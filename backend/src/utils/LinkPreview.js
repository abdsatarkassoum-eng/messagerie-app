// Récupère titre, description et image d'une page web (balises Open Graph),
// pour construire un aperçu façon "carte de lien" comme sur WhatsApp.

function extractMeta(html, key, isName = false) {
  const attr = isName ? 'name' : 'property';
  let re = new RegExp(`<meta[^>]*${attr}=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i');
  let m = html.match(re);
  if (m) return decodeEntities(m[1]);

  re = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${attr}=["']${key}["']`, 'i');
  m = html.match(re);
  if (m) return decodeEntities(m[1]);

  return null;
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchLinkPreview(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FriEndsLinkPreview/1.0)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const html = await res.text();

    const ogTitle = extractMeta(html, 'og:title');
    const titleTagMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = ogTitle || (titleTagMatch ? decodeEntities(titleTagMatch[1].trim()) : null);

    const description = extractMeta(html, 'og:description') || extractMeta(html, 'description', true);

    let image = extractMeta(html, 'og:image');
    if (image && !/^https?:\/\//i.test(image)) {
      try {
        image = new URL(image, url).toString();
      } catch {
        image = null;
      }
    }

    const domain = new URL(url).hostname.replace(/^www\./, '');

    return { title, description, image, domain };
  } catch (err) {
    return null;
  }
}

module.exports = { fetchLinkPreview };
