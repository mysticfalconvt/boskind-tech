// The hard-coded NCSU policy index page. It is a flat list of links to Google
// Drive PDFs / Google Docs, grouped under lettered sections (A-J).
export const POLICY_INDEX_URL = 'https://www.ncsuvt.org/27829_1';

// Lettered section (topic) names. The policy code prefix (e.g. "B.04" -> "B")
// maps to one of these. Names are stable on the source site.
export const TOPIC_NAMES: Record<string, string> = {
  A: 'FOUNDATIONS',
  B: 'BOARD GOVERNANCE',
  C: 'SCHOOL ADMINISTRATION',
  D: 'PERSONNEL',
  E: 'BUSINESS AND NON-INSTRUCTIONAL OPERATIONS',
  F: 'STUDENTS',
  G: 'INSTRUCTION',
  H: 'SCHOOL-COMMUNITY RELATIONS',
  I: 'TRANSPORTATION',
  J: 'HEALTH',
};

// Embedding model output dimension (mxbai-embed-large-v1). Must match the
// vector(1024) column in the schema.
export const EMBEDDING_DIM = 1024;

// During development we cap how many documents a sync will process so we don't
// hammer Google Drive / LM Studio while iterating on the pipeline. Set
// POLICY_SYNC_LIMIT=0 (or unset and rely on the default below) to lift the cap.
// Phase 1-2: 1, Phase 3: 3, Phase 4 (full): 0 / unset.
export function getSyncLimit(): number {
  const raw = process.env.POLICY_SYNC_LIMIT;
  if (raw == null || raw === '') return 1; // safe default while building
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 1;
  return n; // 0 means "no limit"
}
