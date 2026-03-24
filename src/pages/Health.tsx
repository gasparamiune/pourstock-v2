// Lightweight health-check endpoint served at /health
// Used by uptime monitors, load balancers, and CI pre-smoke checks.
export default function Health() {
  return (
    <pre style={{ fontFamily: 'monospace', padding: '2rem', background: '#000', color: '#0f0', minHeight: '100vh' }}>
      {JSON.stringify({ status: 'ok', app: 'pourstock', time: new Date().toISOString() }, null, 2)}
    </pre>
  );
}
