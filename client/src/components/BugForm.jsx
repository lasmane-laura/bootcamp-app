import { useState } from 'react';
import Dialog from './Dialog';
import Select from './Select';
import { uploadBugAttachment, deleteBugAttachment, bugAttachmentUrl } from '../api/bugs';

const SEVERITIES = ['Critical', 'Major', 'Minor', 'Trivial'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov', '.webm', '.txt', '.log'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extOf(filename) {
  const i = filename.lastIndexOf('.');
  return i === -1 ? '' : filename.slice(i).toLowerCase();
}

function BugForm({ initial, onSubmit, onCancel, defaultSeverity }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [severity, setSeverity] = useState(initial?.severity || defaultSeverity || 'Major');
  const [priority, setPriority] = useState(initial?.priority || 'Medium');
  const [stepsText, setStepsText] = useState(initial?.steps?.join('\n') || '');
  const [expected, setExpected] = useState(initial?.expected || '');
  const [actual, setActual] = useState(initial?.actual || '');
  const [environment, setEnvironment] = useState(initial?.environment || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState(initial?.attachments || []);
  const [attachError, setAttachError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  async function handleSubmit(e) {
    e.preventDefault();

    const steps = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!title.trim() || !description.trim() || steps.length === 0 || !expected.trim() || !actual.trim()) {
      setError('Title, description, steps, expected, and actual are required.');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        severity,
        priority,
        steps,
        expected: expected.trim(),
        actual: actual.trim(),
        environment: environment.trim() || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFiles(fileList) {
    setAttachError('');
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    let pendingCount = attachments.length + uploadingCount;

    for (const file of files) {
      if (pendingCount >= MAX_ATTACHMENTS) {
        setAttachError(`A bug can have at most ${MAX_ATTACHMENTS} attachments.`);
        break;
      }
      const ext = extOf(file.name);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setAttachError(`"${file.name}" isn't a supported file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setAttachError(`"${file.name}" is larger than the 10MB limit.`);
        continue;
      }

      pendingCount += 1;
      setUploadingCount((n) => n + 1);
      try {
        const attachment = await uploadBugAttachment(initial.id, file);
        setAttachments((prev) => [...prev, attachment]);
      } catch (err) {
        pendingCount -= 1;
        setAttachError(err.message);
      } finally {
        setUploadingCount((n) => n - 1);
      }
    }
  }

  async function handleRemoveAttachment(attachmentId) {
    try {
      await deleteBugAttachment(initial.id, attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      setAttachError(err.message);
    }
  }

  return (
    <Dialog onClose={onCancel} style={{ width: '560px' }}>
      <h2 style={{ marginTop: 0 }}>{initial ? 'Edit bug' : 'New bug'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={fieldStyle}>
          <label htmlFor="bug-title">Title *</label>
          <input id="bug-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="bug-description">Description *</label>
          <textarea id="bug-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="bug-steps">Steps to reproduce * (one per line)</label>
          <textarea id="bug-steps" rows={4} value={stepsText} onChange={(e) => setStepsText(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="bug-expected">Expected *</label>
          <textarea id="bug-expected" rows={2} value={expected} onChange={(e) => setExpected(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="bug-actual">Actual *</label>
          <textarea id="bug-actual" rows={2} value={actual} onChange={(e) => setActual(e.target.value)} />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="bug-environment">Environment</label>
          <input
            id="bug-environment"
            placeholder="e.g. Chrome 128, macOS"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ ...fieldStyle, flex: 1 }}>
            <label htmlFor="bug-severity">Severity *</label>
            <Select id="bug-severity" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div style={{ ...fieldStyle, flex: 1 }}>
            <label htmlFor="bug-priority">Priority</label>
            <Select id="bug-priority" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {initial?.id ? (
          <div style={fieldStyle}>
            <label>Evidence (optional)</label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFiles(e.dataTransfer.files);
              }}
              style={{ ...dropzoneStyle, borderColor: dragActive ? '#2563eb' : '#ccc' }}
            >
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
                Drag and drop a photo, video, or text/log file here, or{' '}
                <label style={{ cursor: 'pointer', color: 'var(--link)' }}>
                  choose a file
                  <input
                    type="file"
                    multiple
                    accept={ALLOWED_EXTENSIONS.join(',')}
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = '';
                    }}
                    style={{ display: 'none' }}
                  />
                </label>
              </p>
              <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.75rem' }}>
                Images, video, or text/log files, up to 10MB each ({attachments.length}/{MAX_ATTACHMENTS} used)
                {uploadingCount > 0 ? ' — uploading...' : ''}
              </p>
            </div>

            {attachError && <p style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{attachError}</p>}

            {attachments.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '0.5rem 0 0' }}>
                {attachments.map((a) => (
                  <li key={a.id} style={attachmentRowStyle}>
                    {a.kind === 'image' ? (
                      <img
                        src={bugAttachmentUrl(initial.id, a.id)}
                        alt={a.filename}
                        style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                      />
                    ) : (
                      <span aria-hidden="true" style={{ fontSize: '1.2rem', flexShrink: 0 }}>{a.kind === 'video' ? '🎬' : '📄'}</span>
                    )}
                    <a
                      href={bugAttachmentUrl(initial.id, a.id)}
                      target="_blank"
                      rel="noreferrer"
                      style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {a.filename}
                    </a>
                    <span style={{ color: 'var(--muted)', fontSize: '0.75rem', flexShrink: 0 }}>{formatBytes(a.size)}</span>
                    <button type="button" className="btn-secondary" onClick={() => handleRemoveAttachment(a.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Save this bug first, then you can attach evidence.</p>
        )}

        {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  marginBottom: '0.75rem',
};

const dropzoneStyle = {
  border: '2px dashed #ccc',
  borderRadius: '6px',
  padding: '0.75rem',
  textAlign: 'center',
};

const attachmentRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.4rem 0',
  borderBottom: '1px solid #eee',
};

export default BugForm;
