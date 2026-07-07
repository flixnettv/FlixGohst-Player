export async function onRequest(context) {
  return new Response(JSON.stringify({ status: "ok", msg: "root function works" }), {
    headers: { "Content-Type": "application/json" }
  });
}
