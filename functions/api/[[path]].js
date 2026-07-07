// Cloudflare Pages Function — Proxies /api/* to backend
// Auto-deployed with Pages, no separate Worker needed

const BACKEND = 'http://65.75.200.19:3001';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const search = url.search;

  const targetUrl = `${BACKEND}${path}${search}`;

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', url.hostname);
  headers.set('X-Forwarded-Proto', url.protocol);
  headers.set('X-Real-IP', request.headers.get('CF-Connecting-IP') || '');

  const init = {
    method: request.method,
    headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
  }

  try {
    const response = await fetch(targetUrl, init);
    const respHeaders = new Headers(response.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    respHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Backend unreachable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
