import { openDatabase } from '../../db/index.js';
import { createRepository } from '../../db/repository.js';
import { createApp } from '../../app.js';

/**
 * Startet die App auf einem zufälligen freien Port gegen eine
 * :memory:-SQLite-Datenbank. Liefert eine kleine fetch-Hülle, die den
 * Session-Cookie automatisch zwischen Anfragen mitführt (wie ein Browser).
 */
export async function startTestServer() {
  const db = openDatabase(':memory:');
  const repo = createRepository(db);
  const app = createApp({ repo, sessionSecret: 'test-secret', enableRateLimit: false });

  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, (err) => (err ? reject(err) : resolve(s)));
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  let cookie = null;

  async function request(method, path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(cookie ? { cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    return { status: response.status, data };
  }

  async function close() {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  }

  return { request, close, baseUrl };
}
