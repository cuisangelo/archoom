import { NextResponse } from 'next/server';
import { writeDiagramSource } from '@/lib/diagrams';
import { editEnabled } from '@/lib/share';

export async function PUT(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!editEnabled()) {
    return NextResponse.json({ error: 'Editing is disabled on this deployment' }, { status: 403 });
  }
  const { slug } = await params;
  const body = (await req.json()) as { source?: unknown };
  if (typeof body.source !== 'string') {
    return NextResponse.json({ error: '"source" must be a string' }, { status: 400 });
  }
  try {
    writeDiagramSource(slug, body.source);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
