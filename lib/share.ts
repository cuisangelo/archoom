import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * View-only share links carry a token derived from the slug, decoupling the public
 * `/v/<slug>/<token>` viewer from the editable `/d/<slug>` route. Set ARCHOOM_SHARE_SECRET
 * in production to make tokens unguessable; the default keeps links stable for local use.
 */
const SECRET = process.env.ARCHOOM_SHARE_SECRET ?? 'archoom';

export function shareToken(slug: string): string {
  return createHmac('sha256', SECRET).update(slug).digest('base64url').slice(0, 12);
}

export function verifyShareToken(slug: string, token: string): boolean {
  const expected = shareToken(slug);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function sharePath(slug: string): string {
  return `/v/${slug}/${shareToken(slug)}`;
}

/**
 * Editing writes to the diagram files, so it's only available where the filesystem is
 * writable — i.e. running locally, not on Vercel's read-only runtime. Override with
 * ARCHOOM_EDIT=1 to force-enable (writable self-host) or ARCHOOM_EDIT=0 to preview read-only.
 */
export function editEnabled(): boolean {
  if (process.env.ARCHOOM_EDIT === '1') return true;
  if (process.env.ARCHOOM_EDIT === '0') return false;
  return !process.env.VERCEL;
}
