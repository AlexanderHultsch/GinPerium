// Client-API-Wrapper: JSON-Fetch inkl. Session-Cookie und einheitlichem Fehler-Umschlag.
const api = {
  async request(method, url, body) {
    const response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const message = data?.error?.message ?? `Fehler (${response.status})`;
      const error = new Error(message);
      error.code = data?.error?.code;
      error.status = response.status;
      throw error;
    }

    return data;
  },

  get(url) {
    return this.request('GET', url);
  },
  post(url, body) {
    return this.request('POST', url, body);
  },
  put(url, body) {
    return this.request('PUT', url, body);
  },
  delete(url) {
    return this.request('DELETE', url);
  },
};
