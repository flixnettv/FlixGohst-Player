export async function onRequest(context) {
  const targets = [
    'http://65.75.200.19:3002/api/device/status?mac=00:11:22:33:44:55',
    'http://65.75.200.19:3002',
    'http://65.75.200.19:3001',
  ];
  const results = [];
  for (const target of targets) {
    try {
      const start = Date.now();
      const resp = await fetch(target, { signal: AbortSignal.timeout(5000) });
      const elapsed = Date.now() - start;
      results.push({ target, status: resp.status, ok: resp.ok, elapsed: elapsed + 'ms' });
    } catch (err) {
      results.push({ target, error: err.name + ': ' + err.message });
    }
  }
  return new Response(JSON.stringify(results, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
