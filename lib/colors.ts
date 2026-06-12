export interface Tint {
  fg: string;
  chipBg: string;
  groupBg: string;
  groupBorder: string;
}

const DEFAULT: Tint = {
  fg: '#2B2F3A',
  chipBg: '#EEF0F3',
  groupBg: 'rgba(255,255,255,0.55)',
  groupBorder: '#E3E5EA',
};

const mk = (fg: string, chipBg: string): Tint => ({
  fg,
  chipBg,
  groupBg: `${chipBg}99`,
  groupBorder: `${fg}2E`,
});

// Desaturated tints so colored nodes stay inside the near-monochrome design language.
const PALETTE: Record<string, Tint> = {
  gray: mk('#4B5563', '#EAECEF'),
  grey: mk('#4B5563', '#EAECEF'),
  blue: mk('#3D5A80', '#E7EDF6'),
  green: mk('#3E6B4F', '#E6F0E9'),
  red: mk('#9A4A42', '#F6E8E7'),
  orange: mk('#9C6B2F', '#F6EDE2'),
  yellow: mk('#8A7A2E', '#F5F0DC'),
  purple: mk('#5F4B8B', '#EDE9F5'),
  pink: mk('#965577', '#F5E9F0'),
  teal: mk('#3A6E6A', '#E3F0EF'),
};

export function resolveColor(color?: string): Tint {
  if (!color) return DEFAULT;
  const key = color.trim().toLowerCase();
  if (PALETTE[key]) return PALETTE[key];
  if (/^#[0-9a-f]{6}$/.test(key)) {
    return { fg: key, chipBg: `${key}1F`, groupBg: `${key}12`, groupBorder: `${key}3D` };
  }
  return DEFAULT;
}
