export async function onRequest(context) {
  return new Response(JSON.stringify({ status: 'ok', message: 'Pages Function works!' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
