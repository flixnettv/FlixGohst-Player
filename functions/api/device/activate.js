export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const targetUrl = 'http://65.75.200.19:3002' + url.pathname + url.search;
  try {
    const response = await fetch(targetUrl, { method: request.method, body: request.body, headers: request.headers });
    return new Response(response.body, { status: response.status, headers: response.headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Backend unreachable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
