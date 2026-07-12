const PALETTE = [
  '#7c5cff', '#ef476f', '#f5a623', '#1f7a6c', '#0e7490', '#c2410c', '#7a3b8f', '#2b3a55',
];

// Renvoie toujours la même couleur pour un même identifiant/nom (répartition stable)
export function avatarColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}
