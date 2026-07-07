export async function onRequest(context) {
  try {
    const response = await fetch('https://65.75.200.19:3002/api/device/status');
    return new Response(response.body, { status: response.status, headers: response.headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
