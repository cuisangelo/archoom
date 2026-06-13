import { notFound } from 'next/navigation';
import { readDiagram } from '@/lib/diagrams';
import { editEnabled, sharePath } from '@/lib/share';
import Workbench from '@/components/Workbench';

export const dynamic = 'force-dynamic';

export default async function DiagramPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const diagram = readDiagram(slug);
  if (!diagram) notFound();

  return (
    <Workbench
      slug={diagram.slug}
      file={diagram.file}
      initialSource={diagram.source}
      editable
      canSave={editEnabled()}
      sharePath={sharePath(diagram.slug)}
    />
  );
}
