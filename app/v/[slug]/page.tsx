import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { readDiagram } from '@/lib/diagrams';
import Workbench from '@/components/Workbench';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const diagram = readDiagram(slug);
  if (!diagram) return {};
  return { title: `${diagram.title ?? slug} — archoom`, description: diagram.description };
}

export default async function ViewPage({ params }: { params: Params }) {
  const { slug } = await params;
  const diagram = readDiagram(slug);
  if (!diagram) notFound();

  return <Workbench slug={diagram.slug} file={diagram.file} initialSource={diagram.source} editable={false} embed />;
}
