import type { CSSProperties } from 'react';

export interface WallpaperOption {
  id: string;
  label: string;
  preview: string;
  isPattern?: boolean;
}

export const WALLPAPERS: WallpaperOption[] = [
  { id: 'default', label: 'Points (défaut)', preview: 'radial-gradient(circle, var(--border) 1.5px, var(--bg) 1.5px)', isPattern: true },
  { id: 'plain', label: 'Uni', preview: 'var(--bg)' },
  { id: 'sunset', label: 'Coucher de soleil', preview: 'linear-gradient(135deg, var(--coral-soft), var(--amber-soft))' },
  { id: 'ocean', label: 'Océan', preview: 'linear-gradient(135deg, var(--accent-soft), #cfeeff)' },
  { id: 'candy', label: 'Bonbon', preview: 'linear-gradient(135deg, var(--violet-soft), var(--pink-soft))' },
  { id: 'dark-slate', label: 'Ardoise sombre', preview: 'linear-gradient(135deg, #1c262b, #0c1215)' },
];

export function wallpaperStyle(id: string | undefined): CSSProperties {
  const w = WALLPAPERS.find((x) => x.id === id) || WALLPAPERS[0];
  if (w.isPattern) {
    return { backgroundImage: w.preview, backgroundSize: '22px 22px', backgroundPosition: '-8px -8px' };
  }
  return { background: w.preview };
}
