import { EMBEDDING_DIM } from './constants';

function config() {
  const baseUrl = (process.env.LM_STUDIO_API_URL || '').replace(/\/$/, '');
  const apiKey = process.env.LM_STUDIO_API_KEY || 'lm-studio';
  const embeddingModel = process.env.EMBEDDING_MODEL_NAME || '';
  const chatModel = process.env.CHAT_MODEL_NAME || '';
  if (!baseUrl) throw new Error('LM_STUDIO_API_URL is not configured');
  return { baseUrl, apiKey, embeddingModel, chatModel };
}

async function postJson(path: string, body: unknown): Promise<any> {
  const { baseUrl, apiKey } = config();
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`LM Studio ${path} failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`LM Studio ${path} returned invalid JSON`);
  }
}

// Embed a batch of strings. Returns one 1024-dim vector per input, in order.
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const { embeddingModel } = config();
  const data = await postJson('/embeddings', {
    model: embeddingModel,
    input: texts,
  });
  const rows: { embedding: number[]; index: number }[] = data?.data ?? [];
  const sorted = rows
    .slice()
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((r) => r.embedding);
  if (sorted.length !== texts.length) {
    throw new Error(
      `Embedding count mismatch: got ${sorted.length} for ${texts.length} inputs`,
    );
  }
  for (const v of sorted) {
    if (!Array.isArray(v) || v.length !== EMBEDDING_DIM) {
      throw new Error(
        `Unexpected embedding dimension ${v?.length} (expected ${EMBEDDING_DIM})`,
      );
    }
  }
  return sorted;
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// Run a chat completion and return the assistant message text.
export async function chat(
  messages: ChatMessage[],
  opts?: { temperature?: number },
): Promise<string> {
  const { chatModel } = config();
  const data = await postJson('/chat/completions', {
    model: chatModel,
    messages,
    temperature: opts?.temperature ?? 0.2,
    stream: false,
  });
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('LM Studio chat returned no content');
  }
  return content;
}

// Format a JS number[] as a pgvector literal: "[0.1,0.2,...]".
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(',')}]`;
}
