export async function onRequest(context) {
  try {
    const response = await fetch('http://example.com');
    return new Response(JSON.stringify({ ok: response.ok, status: response.status }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
