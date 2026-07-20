// Serverzeit in ISO 8601 UTC. Der Server verlässt sich nie auf Client-Zeit.
export function nowIso() {
  return new Date().toISOString();
}
