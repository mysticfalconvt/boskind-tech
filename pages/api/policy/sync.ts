import type { NextApiRequest, NextApiResponse } from 'next';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { policySyncJobs } from '@/lib/db/schema';
import {
  getPolicyPassword,
  verifyPolicyAccess,
  verifyPolicyAdmin,
} from '@/lib/policyServer';
import { runSync, wipePolicyData } from '@/lib/policy/sync';
import type { SyncDocDetail } from '@/lib/db/schema';

async function latestJob() {
  const rows = await db
    .select()
    .from(policySyncJobs)
    .orderBy(desc(policySyncJobs.startedAt))
    .limit(1);
  return rows[0] ?? null;
}

// Kick off a sync in the background, updating the job row as it progresses.
async function startSync(jobId: string, wipe: boolean) {
  try {
    if (wipe) {
      await db
        .update(policySyncJobs)
        .set({ message: 'Wiping existing data…' })
        .where(eq(policySyncJobs.id, jobId));
      await wipePolicyData();
    }
    const details: SyncDocDetail[] = [];
    const { progress } = await runSync(async (p, last) => {
      details.push({
        policyCode: last.policyCode,
        title: last.title,
        sourceUrl: last.sourceUrl,
        status: last.status,
        ms: last.ms,
        chunks: last.chunks,
        embedTokens: last.embedTokens,
        ...(last.message ? { error: last.message } : {}),
      });
      await db
        .update(policySyncJobs)
        .set({
          total: p.total,
          completed: p.completed,
          skipped: p.skipped,
          errors: p.errors,
          chunksCreated: p.chunksCreated,
          embedTokens: p.embedTokens,
          details,
          message: `Processed ${p.completed}/${p.total} (${p.skipped} unchanged, ${p.errors} errors)`,
        })
        .where(eq(policySyncJobs.id, jobId));
    });
    await db
      .update(policySyncJobs)
      .set({
        status: 'completed',
        total: progress.total,
        completed: progress.completed,
        skipped: progress.skipped,
        errors: progress.errors,
        chunksCreated: progress.chunksCreated,
        embedTokens: progress.embedTokens,
        details,
        message: `Done: ${progress.completed} processed, ${progress.skipped} unchanged, ${progress.errors} errors`,
        finishedAt: new Date(),
      })
      .where(eq(policySyncJobs.id, jobId));
  } catch (e) {
    await db
      .update(policySyncJobs)
      .set({
        status: 'error',
        message: e instanceof Error ? e.message : String(e),
        finishedAt: new Date(),
      })
      .where(eq(policySyncJobs.id, jobId));
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'GET') {
    // Read access: either password is fine.
    const auth = verifyPolicyAccess(getPolicyPassword(req));
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
    const job = await latestJob();
    // All-time aggregate across every sync run.
    const statsRows = (await db.execute(sql`
      SELECT
        count(*)::int AS runs,
        coalesce(sum(completed), 0)::int AS completed,
        coalesce(sum(skipped), 0)::int AS skipped,
        coalesce(sum(errors), 0)::int AS errors,
        coalesce(sum(chunks_created), 0)::int AS chunks_created,
        coalesce(sum(embed_tokens), 0)::bigint AS embed_tokens,
        coalesce(sum(extract(epoch FROM (finished_at - started_at))), 0)::int AS total_seconds
      FROM policy_sync_jobs
    `)) as unknown as Array<Record<string, number | string>>;
    const stats = statsRows[0] ?? null;
    return res.status(200).json({ job, stats });
  }

  if (req.method === 'POST') {
    // All sync actions (normal and wipe) require the admin password.
    const admin = verifyPolicyAdmin(getPolicyPassword(req));
    if (!admin.ok) {
      return res.status(admin.status).json({ error: admin.error });
    }

    const running = await latestJob();
    if (running && running.status === 'running') {
      return res
        .status(409)
        .json({ error: 'A sync is already running', job: running });
    }

    const wipe = req.body?.wipe === true;

    const created = await db
      .insert(policySyncJobs)
      .values({ status: 'running', message: wipe ? 'Wiping…' : 'Starting…' })
      .returning();
    const job = created[0];

    // Fire-and-forget; the long-running Next server keeps this alive.
    void startSync(job.id, wipe);

    return res.status(202).json({ job });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
