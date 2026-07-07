export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = 'http://65.75.200.19:3002' + url.pathname + url.search;

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', url.hostname);
  headers.set('X-Real-IP', request.headers.get('CF-Connecting-IP') || '');

  const init = { method: request.method, headers };
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
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
