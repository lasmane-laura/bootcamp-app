import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBug, updateBug, deleteBug, changeBugStatus, addBugComment, bugAttachmentUrl } from '../api/bugs';
import SeverityBadge from '../components/SeverityBadge';
import PriorityBadge from '../components/PriorityBadge';
import BugForm from '../components/BugForm';
import Select from '../components/Select';

const TRANSITIONS = {
  open: ['in-progress', 'closed'],
  'in-progress': ['resolved', 'closed'],
  resolved: ['closed', 'reopened'],
  closed: ['reopened'],
  reopened: ['in-progress', 'closed'],
};

function BugDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bug, setBug] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nextStatus, setNextStatus] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [commentText, setCommentText] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  function load() {
    setLoading(true);
    setError('');
    getBug(id)
      .then((data) => setBug(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleChangeStatus(e) {
    e.preventDefault();
    if (!nextStatus) return;
    setBusy(true);
    try {
      const data = await changeBugStatus(id, nextStatus, statusMessage.trim() || undefined);
      setBug(data);
      setNextStatus('');
      setStatusMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(payload) {
    const data = await updateBug(id, payload);
    setBug(data);
    setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm('Delete this bug report? This cannot be undone.')) return;
    setBusy(true);
    try {
      await deleteBug(id);
      navigate('/bugs');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      const data = await addBugComment(id, commentText.trim());
      setBug((prev) => ({ ...prev, activity: data.activity }));
      setCommentText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div >Loading...</div>;
  if (error && !bug) return <div style={{ color: 'var(--danger)' }}>{error}</div>;
  if (!bug) return null;

  const options = TRANSITIONS[bug.status] || [];

  return (
    <div>
      <p>
        <Link to="/bugs">← Back to bugs</Link>
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h1 style={{ marginBottom: '0.25rem' }}>{bug.title}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button className="btn-secondary" onClick={() => setEditing(true)}>
            Edit
          </button>
          <button className="btn-secondary" onClick={handleDelete} disabled={busy}>
            Delete
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
        <SeverityBadge severity={bug.severity} />
        <PriorityBadge priority={bug.priority} />
        <span style={{ color: 'var(--muted)' }}>{bug.status}</span>
      </div>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      <section style={sectionStyle}>
        <h3 style={sectionHeadingStyle}>Description</h3>
        <p style={{ margin: 0 }}>{bug.description}</p>
      </section>

      <section style={sectionStyle}>
        <h3 style={sectionHeadingStyle}>Steps to reproduce</h3>
        <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
          {bug.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </section>

      <div style={{ display: 'flex', gap: '2rem' }}>
        <section style={{ ...sectionStyle, flex: 1 }}>
          <h3 style={sectionHeadingStyle}>Expected</h3>
          <p style={{ margin: 0 }}>{bug.expected}</p>
        </section>
        <section style={{ ...sectionStyle, flex: 1 }}>
          <h3 style={sectionHeadingStyle}>Actual</h3>
          <p style={{ margin: 0 }}>{bug.actual}</p>
        </section>
      </div>

      {bug.environment && (
        <section style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Environment</h3>
          <p style={{ margin: 0 }}>{bug.environment}</p>
        </section>
      )}

      {bug.attachments && bug.attachments.length > 0 && (
        <section style={sectionStyle}>
          <h3 style={sectionHeadingStyle}>Evidence</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {bug.attachments.map((a) => (
              <li key={a.id} style={attachmentRowStyle}>
                {a.kind === 'image' ? (
                  <img
                    src={bugAttachmentUrl(bug.id, a.id)}
                    alt={a.filename}
                    style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                  />
                ) : (
                  <span aria-hidden="true" style={{ fontSize: '1.2rem', flexShrink: 0 }}>{a.kind === 'video' ? '🎬' : '📄'}</span>
                )}
                <a href={bugAttachmentUrl(bug.id, a.id)} target="_blank" rel="noreferrer">
                  {a.filename}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section style={{ ...sectionStyle, background: 'var(--input-bg)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '6px' }}>
        <h3 style={sectionHeadingStyle}>Change status</h3>
        {options.length === 0 ? (
          <p style={{ color: 'var(--muted)', margin: 0 }}>No further transitions available from "{bug.status}".</p>
        ) : (
          <form onSubmit={handleChangeStatus} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Select
                aria-label="Change status to"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                wrapStyle={{ flex: 1 }}
              >
                <option value="">Change status to...</option>
                {options.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
              <button type="submit" className="btn-primary" disabled={!nextStatus || busy}>
                Update status
              </button>
            </div>
            <input
              aria-label="Optional note about this status change"
              placeholder="Optional note about this change..."
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
            />
          </form>
        )}
      </section>

      <section style={sectionStyle}>
        <h3 style={sectionHeadingStyle}>Activity</h3>
        <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            aria-label="Add a comment"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn-primary" disabled={!commentText.trim() || busy}>
            Comment
          </button>
        </form>

        {bug.activity.length === 0 && <p style={{ color: 'var(--muted)' }}>No activity yet.</p>}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {bug.activity.map((a) => (
            <li key={a.id} style={activityItemStyle}>
              {a.action === 'status_change' ? (
                <p style={{ margin: 0 }}>
                  Status changed from <strong>{a.oldValue}</strong> to <strong>{a.newValue}</strong>
                  {a.message ? `: ${a.message}` : ''}
                </p>
              ) : (
                <p style={{ margin: 0 }}>{a.message}</p>
              )}
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{new Date(a.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>

      {editing && <BugForm initial={bug} onSubmit={handleUpdate} onCancel={() => setEditing(false)} />}
    </div>
  );
}

const sectionStyle = { marginBottom: '1.25rem' };
const sectionHeadingStyle = { margin: '0 0 0.25rem', fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--muted)' };
const activityItemStyle = {
  padding: '0.6rem 0',
  borderBottom: '1px solid #eee',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem',
};
const attachmentRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.4rem 0',
  borderBottom: '1px solid #eee',
};

export default BugDetailPage;
