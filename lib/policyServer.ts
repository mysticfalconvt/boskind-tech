import type { NextApiRequest } from 'next';

export type PolicyRole = 'viewer' | 'admin';

export type AccessCheck =
  | { ok: true; role: PolicyRole }
  | { ok: false; status: number; error: string };

export type PasswordCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

// A single password field gates the page. Whichever password matched decides
// the role: the admin password grants 'admin' (can sync), the normal password
// grants 'viewer' (read + search only).
export function verifyPolicyAccess(
  provided: string | undefined | null,
): AccessCheck {
  const normal = process.env.POLICY_LLM_PASSWORD;
  const admin = process.env.POLICY_LLM_ADMIN_PASSWORD;
  if (!normal && !admin) {
    return {
      ok: false,
      status: 503,
      error: 'Policy passwords are not configured on the server',
    };
  }
  if (provided && admin && provided === admin) {
    return { ok: true, role: 'admin' };
  }
  if (provided && normal && provided === normal) {
    return { ok: true, role: 'viewer' };
  }
  return { ok: false, status: 401, error: 'Invalid password' };
}

// Stricter check for sync/wipe: the provided password must be the admin one.
export function verifyPolicyAdmin(
  provided: string | undefined | null,
): PasswordCheck {
  const admin = process.env.POLICY_LLM_ADMIN_PASSWORD;
  if (!admin) {
    return {
      ok: false,
      status: 503,
      error: 'POLICY_LLM_ADMIN_PASSWORD is not configured on the server',
    };
  }
  if (!provided || provided !== admin) {
    return { ok: false, status: 403, error: 'Admin access required' };
  }
  return { ok: true };
}

export function getPolicyPassword(req: NextApiRequest): string | undefined {
  const header = req.headers['x-policy-password'];
  if (Array.isArray(header)) return header[0];
  return header;
}
