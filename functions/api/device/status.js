export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = 'https://api.fgtv.qzz.io' + url.pathname + url.search;
  try {
    const response = await fetch(targetUrl);
    const respHeaders = new Headers(response.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    respHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return new Response(response.body, { status: response.status, headers: respHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Backend unreachable' + err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
