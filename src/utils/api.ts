/**
 * API Url Helper to resolve the correct backend API endpoint.
 * This is crucial because when the app's frontend is hosted statically (e.g. on Cloudflare Pages or fgtv.qzz.io),
 * relative fetch calls to "/api/*" would fail as those static servers do not have the Express backend running.
 */

export function getApiUrl(path: string): string {
  if (typeof window === 'undefined') {
    return path;
  }

  const hostname = window.location.hostname;
  
  // Detect if running on a static host (like Cloudflare Pages, custom frontend domains, etc.)
  const isStaticHost = 
    hostname.includes('pages.dev') || 
    hostname.includes('qzz.io') || 
    hostname.includes('github.io') || 
    hostname.includes('webos') || 
    hostname.includes('tizen');

  // If statically hosted, route API requests to the custom proxy or tunnel domain
  if (isStaticHost) {
    const apiBase = 'https://fgtv.qzz.io';
    // Ensure clean slash joining
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${apiBase}${cleanPath}`;
  }

  // Otherwise, use relative paths (e.g. when running locally or on the Express backend itself)
  return path;
}
