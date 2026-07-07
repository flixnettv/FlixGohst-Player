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

  // If statically hosted, route API requests to the running Cloud Run deployment container
  if (isStaticHost) {
    const apiBase = 'https://ais-pre-bcyytbfpp3xkbn46ejp2ze-176663467173.europe-west1.run.app';
    // Ensure clean slash joining
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${apiBase}${cleanPath}`;
  }

  // Otherwise, use relative paths (e.g. when running locally or on the Express backend itself)
  return path;
}
