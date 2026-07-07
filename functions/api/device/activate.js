export async function onRequest(context) {
  const body = JSON.stringify({ status: "ok", msg: "device/activate works" });
  return new Response(body, {
    headers: { "Content-Type": "application/json" }
  });
}
