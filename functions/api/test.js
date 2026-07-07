export async function onRequest(context) {
  return new Response(JSON.stringify({ status: "ok", msg: "nested function works" }), {
    headers: { "Content-Type": "application/json" }
  });
}
