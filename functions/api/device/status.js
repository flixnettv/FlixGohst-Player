export async function onRequest(context) {
  return new Response(JSON.stringify({ status: "ok", msg: "device/status works" }), {
    headers: { "Content-Type": "application/json" }
  });
}
