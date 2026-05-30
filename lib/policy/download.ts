const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 boskind-tech-policy/1';

export type ResolvedSource = {
  kind: 'drive' | 'docs' | 'other';
  id: string | null;
  downloadUrl: string;
};

// Turn a Drive "view" / Docs "edit" URL into a direct-download URL.
export function resolveDownloadUrl(sourceUrl: string): ResolvedSource {
  const driveFile = sourceUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveFile) {
    const id = driveFile[1];
    return {
      kind: 'drive',
      id,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
    };
  }
  const driveOpen = sourceUrl.match(/[?&]id=([^&]+)/);
  if (driveOpen && /drive\.google\.com/.test(sourceUrl)) {
    const id = driveOpen[1];
    return {
      kind: 'drive',
      id,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
    };
  }
  const docs = sourceUrl.match(
    /docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/]+)/,
  );
  if (docs) {
    const type = docs[1];
    const id = docs[2];
    const fmt = type === 'spreadsheets' ? 'pdf' : 'pdf';
    return {
      kind: 'docs',
      id,
      downloadUrl: `https://docs.google.com/${type}/d/${id}/export?format=${fmt}`,
    };
  }
  return { kind: 'other', id: null, downloadUrl: sourceUrl };
}

function looksLikePdf(bytes: Uint8Array): boolean {
  // %PDF
  return (
    bytes.length > 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

// Google Drive shows a "can't scan for viruses" interstitial for larger files.
// The HTML contains a form whose action + hidden inputs build the real URL.
function buildConfirmUrl(html: string, fallbackId: string | null): string | null {
  const formAction = html.match(/action="([^"]+)"/);
  const base = formAction
    ? formAction[1].replace(/&amp;/g, '&')
    : 'https://drive.usercontent.google.com/download';
  const params = new URLSearchParams();
  const hiddenRe = /<input[^>]+type="hidden"[^>]*>/gi;
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = hiddenRe.exec(html)) !== null) {
    const tag = m[0];
    const name = tag.match(/name="([^"]+)"/)?.[1];
    const value = tag.match(/value="([^"]*)"/)?.[1];
    if (name) params.set(name, (value ?? '').replace(/&amp;/g, '&'));
  }
  if (!params.has('id') && fallbackId) params.set('id', fallbackId);
  if (!params.has('export')) params.set('export', 'download');
  if (!Array.from(params.keys()).length) return null;
  return `${base}?${params.toString()}`;
}

async function fetchBytes(url: string): Promise<Response> {
  return fetch(url, {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
  });
}

// Download a policy document and return its raw bytes. Handles the Drive
// virus-scan confirmation interstitial.
export async function downloadPolicyPdf(
  sourceUrl: string,
): Promise<{ bytes: Uint8Array; downloadUrl: string; contentType: string }> {
  const resolved = resolveDownloadUrl(sourceUrl);
  let res = await fetchBytes(resolved.downloadUrl);
  if (!res.ok) {
    throw new Error(`Download failed (HTTP ${res.status}) for ${sourceUrl}`);
  }

  let buf = new Uint8Array(await res.arrayBuffer());
  let contentType = res.headers.get('content-type') || '';

  // If we got HTML back from Drive, it's the confirm interstitial.
  if (
    resolved.kind === 'drive' &&
    !looksLikePdf(buf) &&
    /text\/html/i.test(contentType)
  ) {
    const html = new TextDecoder().decode(buf);
    const confirmUrl = buildConfirmUrl(html, resolved.id);
    if (confirmUrl) {
      res = await fetchBytes(confirmUrl);
      if (res.ok) {
        buf = new Uint8Array(await res.arrayBuffer());
        contentType = res.headers.get('content-type') || '';
      }
    }
  }

  if (!looksLikePdf(buf)) {
    // Not a PDF — could be a Doc exported as something else, or an error page.
    // Surface a clear error so the caller can record/skip it.
    const preview = new TextDecoder().decode(buf.slice(0, 200));
    throw new Error(
      `Downloaded content for ${sourceUrl} is not a PDF (content-type: ${contentType || 'unknown'}). Preview: ${preview.slice(0, 120)}`,
    );
  }

  return { bytes: buf, downloadUrl: resolved.downloadUrl, contentType };
}
