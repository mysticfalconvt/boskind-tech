import { POLICY_INDEX_URL, TOPIC_NAMES } from './constants';

export type ScrapedPolicy = {
  topicCode: string; // "A".."J", or "?" if it couldn't be derived
  topicName: string;
  policyCode: string | null; // "A.01" etc.
  title: string;
  sourceUrl: string;
};

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 boskind-tech-policy/1';

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/gi, '"')
    .replace(/&ndash;|&mdash;/gi, '-')
    .replace(/&[a-z]+;/gi, ' ');
}

function cleanText(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

// Pulls "A.01" style codes (letter, dot, number) from the start of the text.
function parseCode(text: string): { code: string | null; title: string } {
  const m = text.match(/\b([A-J])\.(\d{1,3}[A-Za-z]?)\b\s*(.*)$/);
  if (m) {
    const code = `${m[1]}.${m[2]}`;
    const title = m[3]?.trim() || text.trim();
    return { code, title };
  }
  return { code: null, title: text.trim() };
}

export function parsePolicyIndexHtml(html: string): ScrapedPolicy[] {
  const anchorRe =
    /<a\b[^>]*href="([^"]*(?:drive\.google|docs\.google)[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const out: ScrapedPolicy[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = anchorRe.exec(html)) !== null) {
    const sourceUrl = m[1].trim();
    if (seen.has(sourceUrl)) continue;
    const text = cleanText(m[2]);
    if (!text) continue;
    const { code, title } = parseCode(text);
    const topicCode = code ? code[0] : '?';
    const topicName = TOPIC_NAMES[topicCode] ?? 'OTHER';
    seen.add(sourceUrl);
    out.push({ topicCode, topicName, policyCode: code, title, sourceUrl });
  }
  return out;
}

export async function fetchPolicyIndex(): Promise<ScrapedPolicy[]> {
  const res = await fetch(POLICY_INDEX_URL, {
    headers: { 'User-Agent': UA },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch policy index (HTTP ${res.status} ${res.statusText})`,
    );
  }
  const html = await res.text();
  const policies = parsePolicyIndexHtml(html);
  if (policies.length === 0) {
    throw new Error('No policy links found on the index page');
  }
  return policies;
}
