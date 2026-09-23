const BASE_URL = '/api/flaky-tests';

async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json();
  if (!body.success) throw new Error(body.error || 'Request failed');
  return body.data;
}

export function listFlakyTests({ page = 1, pageSize = 20, sortBy = 'transitions', sortDir = 'desc', flaky = '', search = '' } = {}) {
  const params = new URLSearchParams({ page, pageSize, sortBy, sortDir });
  if (flaky) params.set('flaky', flaky);
  if (search) params.set('search', search);
  return request(`${BASE_URL}?${params.toString()}`);
}
