export async function onRequest(context) {
  const targets = [
    { label: 'HTTPS ghost-api', url: 'https://65.75.200.19:3002/api/device/status?mac=00:11:22:33:44:55' },
    { label: 'HTTP ghost-api', url: 'http://65.75.200.19:3002/api/device/status?mac=00:11:22:33:44:55' },
    { label: 'HTTPS example.com', url: 'https://example.com' },
    { label: 'HTTP example.com', url: 'http://example.com' },
  ];
  const results = [];
  for (const t of targets) {
    try {
      const start = Date.now();
      const resp = await fetch(t.url, { signal: AbortSignal.timeout(5000) });
      const elapsed = Date.now() - start;
      const text = await resp.text();
      results.push({ label: t.label, status: resp.status, elapsed: elapsed + 'ms', body: text.slice(0, 100) });
    } catch (err) {
      results.push({ label: t.label, error: err.name + ': ' + err.message });
    }
  }
  return new Response(JSON.stringify(results, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
