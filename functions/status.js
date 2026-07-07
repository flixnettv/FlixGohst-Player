export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = 'http://65.75.200.19:3002/api/device/status' + url.search;
  try {
    const response = await fetch(targetUrl, { method: request.method, headers: request.headers });
    const respHeaders = new Headers(response.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    return new Response(response.body, { status: response.status, headers: respHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Backend unreachable' }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }
}
