import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { readDiagram } from '@/lib/diagrams';
import { verifyShareToken } from '@/lib/share';
import Workbench from '@/components/Workbench';

export const dynamic = 'force-dynamic';

type Params = Promise<{ slug: string; token: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug, token } = await params;
  if (!verifyShareToken(slug, token)) return {};
  const diagram = readDiagram(slug);
  const title = diagram?.title ?? slug;
  return { title: `${title} — archoom`, description: diagram?.description };
}

export default async function ViewPage({ params }: { params: Params }) {
  const { slug, token } = await params;
  if (!verifyShareToken(slug, token)) notFound();
  const diagram = readDiagram(slug);
  if (!diagram) notFound();

  return <Workbench slug={diagram.slug} file={diagram.file} initialSource={diagram.source} editable={false} embed />;
}
