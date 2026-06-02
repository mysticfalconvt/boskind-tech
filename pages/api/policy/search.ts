import type { NextApiRequest, NextApiResponse } from 'next';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { policyQueries } from '@/lib/db/schema';
import { getPolicyPassword, verifyPolicyAccess } from '@/lib/policyServer';
import { embed, chat, toVectorLiteral, ChatMessage } from '@/lib/policy/lmStudio';

type ChunkHit = {
  id: string;
  kind: string;
  content: string;
  section_id: string | null;
  section_heading: string | null;
  section_content: string | null;
  title: string;
  policy_code: string | null;
  source_url: string;
  score: number;
};

// ~4 chars/token estimate, matching lib/policy/parse.ts.
function approxTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

// Include the whole section body in the RAG context when it's at most this big.
const WHOLE_SECTION_TOKEN_LIMIT = 1000;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

type DocHit = {
  policy_code: string | null;
  title: string;
  source_url: string;
  rank: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const auth = verifyPolicyAccess(getPolicyPassword(req));
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const question =
    typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  if (!question) {
    return res.status(400).json({ error: 'Missing question' });
  }

  try {
    // 1. Embed the question and run a vector similarity search over chunks.
    const [queryVec] = await embed([question]);
    const vecLiteral = toVectorLiteral(queryVec);

    const chunkRows = (await db.execute(sql`
      SELECT c.id, c.kind, c.content,
             c.section_id, s.heading AS section_heading, s.content AS section_content,
             d.title, d.policy_code, d.source_url,
             1 - (c.embedding <=> ${vecLiteral}::vector) AS score
      FROM policy_chunks c
      JOIN policy_documents d ON d.id = c.document_id
      LEFT JOIN policy_sections s ON s.id = c.section_id
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${vecLiteral}::vector
      LIMIT 12
    `)) as unknown as ChunkHit[];

    // 2. Keyword full-text pass over titles + parsed text, to catch exact terms.
    const docRows = (await db.execute(sql`
      SELECT d.policy_code, d.title, d.source_url,
             ts_rank(
               to_tsvector('english', coalesce(d.title,'') || ' ' || coalesce(d.parsed_text,'')),
               plainto_tsquery('english', ${question})
             ) AS rank
      FROM policy_documents d
      WHERE to_tsvector('english', coalesce(d.title,'') || ' ' || coalesce(d.parsed_text,''))
            @@ plainto_tsquery('english', ${question})
      ORDER BY rank DESC
      LIMIT 6
    `)) as unknown as DocHit[];

    if (chunkRows.length === 0 && docRows.length === 0) {
      return res.status(200).json({
        answer:
          "I couldn't find any policies matching that question. Try syncing first, or rephrasing.",
        citations: [],
      });
    }

    // 3 + 4. Build the RAG prompt AND the citations from the same pass, so the
    //    sources we show the user are exactly the excerpts fed to the model —
    //    including which section titles were pulled in. For a chunk that
    //    belongs to a section, include the heading; and if the whole section
    //    body is small (<= WHOLE_SECTION_TOKEN_LIMIT) include the entire
    //    section rather than just the matched slice. Dedupe by section, cap 6.
    type Citation = {
      policyCode: string | null;
      title: string;
      sourceUrl: string;
      sections: string[];
    };
    const citationMap = new Map<string, Citation>();
    const usedSections = new Set<string>();
    const excerptParts: string[] = [];

    const citationFor = (
      sourceUrl: string,
      policyCode: string | null,
      title: string,
    ): Citation => {
      let cit = citationMap.get(sourceUrl);
      if (!cit) {
        cit = { policyCode, title, sourceUrl, sections: [] };
        citationMap.set(sourceUrl, cit);
      }
      return cit;
    };

    for (const c of chunkRows) {
      if (excerptParts.length >= 6) break;
      const label = `[${c.policy_code ?? c.title}] ${c.title}`;
      const cit = citationFor(c.source_url, c.policy_code, c.title);

      if (c.section_id) {
        if (usedSections.has(c.section_id)) continue;
        usedSections.add(c.section_id);
        const heading = c.section_heading ? `${c.section_heading}\n` : '';
        const whole = c.section_content ?? c.content;
        const body =
          approxTokens(whole) <= WHOLE_SECTION_TOKEN_LIMIT ? whole : c.content;
        excerptParts.push(`${label}\n${heading}${body}`);
        if (c.section_heading && !cit.sections.includes(c.section_heading)) {
          cit.sections.push(c.section_heading);
        }
      } else {
        // Title or section-less chunk: include as-is.
        excerptParts.push(`${label}\n${c.content}`);
      }
    }
    const excerpts = excerptParts.join('\n\n---\n\n');

    // Append keyword (FTS) matches that weren't already cited from the vector
    // pass, so exact-term hits still show up as sources (no section detail).
    for (const d of docRows) {
      if (!citationMap.has(d.source_url)) {
        citationMap.set(d.source_url, {
          policyCode: d.policy_code,
          title: d.title,
          sourceUrl: d.source_url,
          sections: [],
        });
      }
    }
    const citations = Array.from(citationMap.values());

    const messages: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a helpful assistant answering questions about North Country Supervisory Union (NCSU) school board policies. Answer ONLY using the provided policy excerpts. ' +
          'Cite every policy you rely on by its exact code in square brackets, e.g. [B.04]. ' +
          'Only cite policies you actually used to answer — do not list excerpts you did not use. ' +
          'If the excerpts do not contain the answer, say you could not find it in the policies.',
      },
      {
        role: 'user',
        content: `Policy excerpts:\n\n${excerpts}\n\nQuestion: ${question}`,
      },
    ];

    const answer = await chat(messages);

    // Keep only the sources the model actually cited (by code) in its answer,
    // so we don't show every excerpt we fed it. Match a code only when it isn't
    // immediately followed by another alphanumeric, so "D.01" doesn't match the
    // separate "D.01P" procedure (and vice-versa). Fall back to all candidates
    // if the model didn't cite anything parseable.
    const cited = citations.filter((c) => {
      if (!c.policyCode) return false;
      const re = new RegExp(`${escapeRegExp(c.policyCode)}(?![A-Za-z0-9])`, 'i');
      return re.test(answer);
    });
    const finalCitations = cited.length > 0 ? cited : citations;

    // Log the Q&A for admin review (best-effort; never block the response).
    try {
      await db.insert(policyQueries).values({
        question,
        answer,
        citations: finalCitations,
        matchCount: chunkRows.length,
        askerRole: auth.role,
      });
    } catch (logErr) {
      console.error('Failed to log policy query:', logErr);
    }

    return res.status(200).json({
      answer,
      citations: finalCitations,
      matchCount: chunkRows.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Search failed';
    return res.status(502).json({ error: message });
  }
}
