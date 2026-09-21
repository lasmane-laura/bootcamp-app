const BASE_URL = '/api/test-cases';

async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json();
  if (!body.success) throw new Error(body.error || 'Request failed');
  return body.data;
}

export function listTestCases({ page = 1, pageSize = 20, sortBy = 'updatedAt', sortDir = 'desc', status = '', severity = '', search = '' } = {}) {
  const params = new URLSearchParams({
    page,
    pageSize,
    sortBy: sortBy === 'updatedAt' ? 'updated_at' : sortBy,
    sortDir,
  });
  if (status) params.set('status', status);
  if (severity) params.set('severity', severity);
  if (search) params.set('search', search);
  return request(`${BASE_URL}?${params.toString()}`);
}

export function createTestCase(data) {
  return request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateTestCase(id, data) {
  return request(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteTestCase(id) {
  return request(`${BASE_URL}/${id}`, { method: 'DELETE' });
}
