export async function onRequest(context) {
  return new Response(JSON.stringify({ status: "ok", msg: "test function works" }), {
    headers: { "Content-Type": "application/json" }
  });
}
