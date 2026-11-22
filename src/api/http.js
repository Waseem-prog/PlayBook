export async function request(path, { method = 'GET', body, query } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== '') params.set(key, value);
  }
  const suffix = params.size ? '?' + params.toString() : '';
  const response = await fetch('/api' + path + suffix, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || 'The server could not complete the request');
  return result;
}
