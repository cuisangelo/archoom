'use client';

import { useEffect, useRef, useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

const trigger =
  'flex items-center gap-1.5 rounded-full border border-white/60 bg-white/50 backdrop-blur-md px-3.5 py-1.5 text-[12px] font-medium text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-white/85 transition-colors';

function embedSnippet(url: string): string {
  return `<iframe src="${url}" width="100%" height="480" style="border:0;border-radius:16px" loading="lazy"></iframe>`;
}

export default function ShareMenu({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState<'link' | 'embed' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const url = origin + path;

  const copy = async (what: 'link' | 'embed') => {
    await navigator.clipboard.writeText(what === 'link' ? url : embedSnippet(url));
    setCopied(what);
    window.setTimeout(() => setCopied((c) => (c === what ? null : c)), 1600);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className={trigger}>
        <Share2 size={13} />
        Share
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-80 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_48px_rgba(31,36,48,0.16)] backdrop-blur-2xl backdrop-saturate-150">
          <p className="mb-2 text-[12px] font-semibold text-ink">View-only link</p>
          <div className="flex items-center gap-1.5">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-lg bg-ink/5 px-2.5 py-1.5 font-mono text-[11px] text-ink outline-none"
            />
            <button
              onClick={() => copy('link')}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-ink/5 px-2.5 py-1.5 text-[11px] font-medium text-ink hover:bg-ink/10"
            >
              {copied === 'link' ? <Check size={12} /> : <Copy size={12} />}
              {copied === 'link' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <button
            onClick={() => copy('embed')}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-hairline/70 px-2.5 py-1.5 text-[11px] font-medium text-muted hover:bg-ink/5 hover:text-ink"
          >
            {copied === 'embed' ? <Check size={12} /> : <Copy size={12} />}
            {copied === 'embed' ? 'Embed code copied' : 'Copy embed code'}
          </button>

          <p className="mt-2.5 font-mono text-[10.5px] leading-snug text-muted">
            Anyone with this link can view — not edit. Drop the embed code into any page.
          </p>
        </div>
      )}
    </div>
  );
}
