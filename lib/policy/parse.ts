import { getDocumentProxy } from 'unpdf';

export type ParsedSection = {
  ordinal: number;
  heading: string | null;
  content: string;
};

// Extract text from a PDF, reconstructing line breaks from pdf.js item
// positions. unpdf's extractText joins everything into one space-separated
// string (no newlines), which destroys the heading/paragraph structure we need
// for section splitting — so we walk the text items ourselves and start a new
// line on an end-of-line marker or a vertical position change.
export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const lines: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    // eslint-disable-next-line no-await-in-loop
    const page = await pdf.getPage(p);
    // eslint-disable-next-line no-await-in-loop
    const content = await page.getTextContent();
    let line = '';
    let lastY: number | null = null;
    for (const item of content.items as Array<{
      str?: string;
      transform?: number[];
      hasEOL?: boolean;
    }>) {
      if (typeof item.str !== 'string') continue;
      const y = Array.isArray(item.transform) ? item.transform[5] : null;
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 3 && line.trim()) {
        lines.push(line);
        line = '';
      }
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = '';
        lastY = null;
      } else {
        lastY = y;
      }
    }
    if (line.trim()) lines.push(line);
  }
  return normalizeWhitespace(lines.join('\n'));
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// A line looks like a heading if it's a short banner / numbered section title.
// We key on SHORT lines so that lettered sub-items that happen to start with a
// Roman-numeral letter (e.g. "C. The effect of the proposed policy ...") are
// not mistaken for sections — those are long sentences, real headings are short
// ("I. Policy", "II. Definitions", "III. Policy Development").
function isHeadingLine(line: string): boolean {
  const t = line.trim();
  if (t.length === 0 || t.length > 90) return false;
  // ALL-CAPS banner line (title block, "FOUNDATIONS", ...). Excludes lines
  // containing digits so table rows like "NCUHS 03/17/2015 06/21/2022 ..."
  // (all-caps district name + dates) aren't mistaken for headings and dropped.
  const letters = t.replace(/[^A-Za-z]/g, '');
  if (
    !/[0-9]/.test(t) &&
    letters.length >= 3 &&
    letters === letters.toUpperCase() &&
    t.length <= 80
  ) {
    return true;
  }
  // "Section 3", "Article IV" — keyword followed by a number/numeral. (Plain
  // "Policy …" is excluded: the word starts countless body lines.)
  if (/^(SECTION|ARTICLE|PART)\s+([0-9]+|[IVXLCDM]+)\b/i.test(t)) return true;
  // Short numbered / Roman-numeral section marker followed by a Title. Real
  // section titles don't end in sentence/list punctuation (; , .), which
  // distinguishes "II. Definitions" from a list item like "D. Samples ...;".
  if (
    t.length <= 70 &&
    /^([0-9]+(\.[0-9]+)*|[IVXLCDM]+)\.\s+[A-Z]/.test(t) &&
    !/[;,.]$/.test(t)
  ) {
    return true;
  }
  return false;
}

// Best-effort split of document text into sections by heading-like lines.
// Falls back to a single section if no headings are detected.
export function splitIntoSections(text: string): ParsedSection[] {
  const lines = text.split('\n');
  const sections: ParsedSection[] = [];
  let current: { heading: string | null; lines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const content = current.lines.join('\n').trim();
    // Only keep sections with real body text. This drops banner/footer lines
    // (title block, adoption-date footer) that match a heading pattern but
    // carry no content of their own.
    if (content) {
      sections.push({
        ordinal: sections.length,
        heading: current.heading,
        content,
      });
    }
  };

  for (const line of lines) {
    if (isHeadingLine(line)) {
      flush();
      current = { heading: line.trim(), lines: [] };
    } else {
      if (!current) current = { heading: null, lines: [] };
      current.lines.push(line);
    }
  }
  flush();

  if (sections.length === 0) {
    return [{ ordinal: 0, heading: null, content: text }];
  }
  return sections;
}

// Rough token estimate (~4 chars/token) used to bound chunk size.
export function approxTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

const CHARS_PER_TOKEN = 4;

// Split a block of text into balanced chunks of at most ~maxTokens.
//
// "Balanced" means: a section that fits in one chunk stays whole, and a section
// that must be split is divided into roughly-equal pieces rather than greedily
// filled. e.g. a 700-token section -> one chunk; an 805-token section ->
// two ~400-token chunks (not an 800 + a 5). Breaks on paragraph boundaries
// first, then sentence boundaries for an oversized single paragraph.
export function splitIntoChunks(text: string, maxTokens = 800): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (approxTokens(clean) <= maxTokens) return [clean];

  const maxChars = maxTokens * CHARS_PER_TOKEN;
  // Number of chunks needed, then aim each chunk at an even share of the text.
  const numChunks = Math.ceil(clean.length / maxChars);
  const targetChars = Math.ceil(clean.length / numChunks);

  const paragraphs = clean.split(/\n{2,}/);
  const chunks: string[] = [];
  let buf = '';

  const pushBuf = () => {
    const t = buf.trim();
    if (t) chunks.push(t);
    buf = '';
  };

  for (const para of paragraphs) {
    if (para.length > maxChars) {
      // Paragraph itself too big: split on sentence boundaries toward target.
      pushBuf();
      const sentences = para.match(/[^.!?]+[.!?]+|\S+$/g) ?? [para];
      let sbuf = '';
      for (const s of sentences) {
        if ((sbuf + s).length > targetChars && sbuf) {
          chunks.push(sbuf.trim());
          sbuf = '';
        }
        sbuf += s;
      }
      if (sbuf.trim()) chunks.push(sbuf.trim());
      continue;
    }
    // Start a new chunk once the buffer reaches the even target size.
    if (buf && buf.length + 2 + para.length > targetChars) {
      pushBuf();
    }
    buf = buf ? `${buf}\n\n${para}` : para;
  }
  pushBuf();
  return chunks.filter(Boolean);
}
