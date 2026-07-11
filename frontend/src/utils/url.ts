// En production, le frontend et le backend peuvent être hébergés sur des domaines différents.
// Cette fonction transforme un chemin relatif (ex: /uploads/avatars/x.png) renvoyé par l'API
// en URL absolue pointant vers le bon serveur.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');

export function resolveFileUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_ORIGIN}${path}`;
}
