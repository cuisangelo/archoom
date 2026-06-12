import { cloudIconSrc, resolveIcon } from '@/lib/icons';

interface Props {
  name?: string;
  hint?: string;
  size: number;
  strokeWidth?: number;
}

/** Official cloud-provider SVG when the name matches a vendored pack icon, Lucide glyph otherwise. */
export default function NodeIcon({ name, hint, size, strokeWidth = 1.8 }: Props) {
  const src = cloudIconSrc(name);
  if (src) {
    // Provider icons are full-bleed squares — render slightly larger than line glyphs.
    const px = Math.round(size * 1.35);
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={px} height={px} draggable={false} />;
  }
  const Icon = resolveIcon(name, hint);
  return <Icon size={size} strokeWidth={strokeWidth} />;
}
