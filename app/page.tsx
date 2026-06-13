import Link from 'next/link';
import { listDiagrams } from '@/lib/diagrams';
import { parse } from '@/lib/dsl/parser';

export const dynamic = 'force-dynamic';

export default function Home() {
  const diagrams = listDiagrams();

  return (
    <main className="relative mx-auto max-w-2xl px-5 py-12">
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[520px] w-[620px] rounded-full bg-[#7C9CD8]/30 blur-[110px]" />
        <div className="absolute right-[-10%] top-1/3 h-[460px] w-[560px] rounded-full bg-[#9D8BC4]/25 blur-[110px]" />
        <div className="absolute bottom-[-15%] left-[10%] h-[420px] w-[520px] rounded-full bg-[#7FB5AE]/25 blur-[100px]" />
      </div>
      <header className="relative mb-10">
        <h1 className="font-mono text-2xl font-semibold tracking-tight">archoom</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          Architecture as code. Each diagram lives as a plain <span className="font-mono text-[13px]">.md</span> or{' '}
          <span className="font-mono text-[13px]">.yaml</span> file in{' '}
          <span className="font-mono text-[13px]">diagrams/</span> — open one to explore it, drag it around, and
          click any component to leave a note.
        </p>
      </header>

      {diagrams.length === 0 ? (
        <div className="relative rounded-3xl border border-white/65 bg-white/55 p-6 text-[14px] leading-relaxed text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_24px_rgba(31,36,48,0.06)] backdrop-blur-xl">
          No diagrams yet. Drop a <span className="font-mono text-[12.5px]">.md</span> file with an{' '}
          <span className="font-mono text-[12.5px]">```archoom</span> code block (or a{' '}
          <span className="font-mono text-[12.5px]">.yaml</span> with a{' '}
          <span className="font-mono text-[12.5px]">source: |</span> key) into{' '}
          <span className="font-mono text-[12.5px]">diagrams/</span>.
        </div>
      ) : (
        <ul className="relative flex flex-col gap-4">
          {diagrams.map((d) => {
            const doc = parse(d.source);
            const components = [...doc.nodes.values()].filter((n) => !n.isGroup).length;
            return (
              <li key={d.slug}>
                <Link
                  href={`/e/${d.slug}`}
                  className="block rounded-3xl border border-white/65 bg-white/55 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_24px_rgba(31,36,48,0.06)] backdrop-blur-xl backdrop-saturate-150 transition-colors hover:bg-white/80"
                >
                  <h2 className="text-[15px] font-semibold">{d.title ?? doc.title ?? d.slug}</h2>
                  {d.description && (
                    <p className="mt-1 text-[13.5px] leading-relaxed text-muted">{d.description}</p>
                  )}
                  <p className="mt-3 font-mono text-[11px] text-muted">
                    {d.file} · {components} components · {doc.edges.length} connections
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
