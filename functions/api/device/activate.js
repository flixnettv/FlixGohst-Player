export async function onRequest(context) {
  return new Response(JSON.stringify({ status: "ok", msg: "device/activate works" }), {
    headers: { "Content-Type": "application/json" }
  });
}
