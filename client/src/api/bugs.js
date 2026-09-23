const BASE_URL = '/api/bugs';

async function request(url, options) {
  const res = await fetch(url, options);
  const body = await res.json();
  if (!body.success) throw new Error(body.error || 'Request failed');
  return body.data;
}

export function listBugs({ status = '', severity = '', priority = '', search = '', sortBy = 'updatedAt', sortDir = 'desc' } = {}) {
  const params = new URLSearchParams({
    sortBy: sortBy === 'updatedAt' ? 'updated_at' : sortBy,
    sortDir,
  });
  if (status) params.set('status', status);
  if (severity) params.set('severity', severity);
  if (priority) params.set('priority', priority);
  if (search) params.set('search', search);
  return request(`${BASE_URL}?${params.toString()}`);
}

export function getBug(id) {
  return request(`${BASE_URL}/${id}`);
}

export function createBug(data) {
  return request(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateBug(id, data) {
  return request(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteBug(id) {
  return request(`${BASE_URL}/${id}`, { method: 'DELETE' });
}

export function changeBugStatus(id, status, message) {
  return request(`${BASE_URL}/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, message }),
  });
}

export function addBugComment(id, message) {
  return request(`${BASE_URL}/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
}

async function requestForm(url, formData) {
  const res = await fetch(url, { method: 'POST', body: formData });
  const body = await res.json();
  if (!body.success) throw new Error(body.error || 'Request failed');
  return body.data;
}

export function uploadBugAttachment(bugId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return requestForm(`${BASE_URL}/${bugId}/attachments`, formData);
}

export function deleteBugAttachment(bugId, attachmentId) {
  return request(`${BASE_URL}/${bugId}/attachments/${attachmentId}`, { method: 'DELETE' });
}

export function bugAttachmentUrl(bugId, attachmentId) {
  return `${BASE_URL}/${bugId}/attachments/${attachmentId}`;
}
