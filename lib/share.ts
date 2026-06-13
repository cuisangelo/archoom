/**
 * View-only share links live at `/v/<slug>` — a chromeless, read-only viewer that's safe to
 * embed anywhere. Editing happens through `/d/<slug>` and only where the filesystem is writable.
 */
export function sharePath(slug: string): string {
  return `/v/${slug}`;
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
