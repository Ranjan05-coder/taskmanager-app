import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const STATUS_COLS = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' }
];
const PRIORITY_COLORS = { high: '#dc2626', medium: '#ca8a04', low: '#9ca3af' };

function TaskModal({ task, members, projectId, isAdmin, onClose, onSave }) {
  const [form, setForm] = useState(task ? { ...task, due_date: task.due_date ? task.due_date.split('T')[0] : '' } : {
    title: '', description: '', priority: 'medium', assignee_id: '', due_date: '', status: 'todo'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.assignee_id) delete payload.assignee_id;
      if (!payload.due_date) delete payload.due_date;

      let saved;
      if (task) {
        saved = await api.updateTask(projectId, task.id, payload);
      } else {
        saved = await api.createTask(projectId, payload);
      }
      onSave(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Edit task' : 'New task'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form className="form-stack" onSubmit={handleSubmit}>
          {isAdmin && (
            <>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description || ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due date</label>
                  <input type="date" className="form-input" value={form.due_date || ''}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-select" value={form.assignee_id || ''}
                  onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [form, setForm] = useState({ email: '', role: 'member' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const member = await api.addMember(projectId, form);
      onAdded(member);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add member</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <p className="text-sm text-muted" style={{ marginBottom: 16 }}>The user must have already signed up.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input type="email" className="form-input" placeholder="member@example.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('kanban'); // 'kanban' | 'members'
  const [modal, setModal] = useState(null); // null | 'newTask' | task object | 'members'
  const [memberModal, setMemberModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const [p, t, m] = await Promise.all([
        api.getProject(id),
        api.getTasks(id, statusFilter ? { status: statusFilter } : {}),
        api.getMembers(id)
      ]);
      setProject(p); setTasks(t); setMembers(m);
    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, statusFilter, navigate]);

  useEffect(() => { load(); }, [load]);

  const isAdmin = project?.role === 'admin';
  const tasksByStatus = STATUS_COLS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  const handleTaskSaved = (saved) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === saved.id);
      return exists ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev];
    });
    setModal(null);
  };

  const handleDeleteTask = async (task) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await api.deleteTask(id, task.id);
    setTasks(prev => prev.filter(t => t.id !== task.id));
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    await api.removeMember(id, memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    await api.deleteProject(id);
    navigate('/projects');
  };

  if (loading) return <Layout><div className="spinner" /></Layout>;

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">{project?.name}</h1>
            {project?.description && <p className="page-subtitle">{project.description}</p>}
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <button className="btn btn-secondary" onClick={() => setMemberModal(true)}>+ Member</button>
                <button className="btn btn-primary" onClick={() => setModal('newTask')}>+ Task</button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {['kanban', 'members'].map(t => (
            <button key={t} className="btn btn-ghost"
              style={{ borderRadius: '6px 6px 0 0', borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t ? 'var(--accent)' : undefined }}
              onClick={() => setTab(t)}>
              {t === 'kanban' ? '⊞ Board' : '⊙ Members'}
            </button>
          ))}
          {isAdmin && (
            <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto', alignSelf: 'center' }} onClick={handleDeleteProject}>
              Delete project
            </button>
          )}
        </div>

        {tab === 'kanban' && (
          <>
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="text-sm text-muted">Filter:</span>
              {['', 'todo', 'in_progress', 'done'].map(s => (
                <button key={s} className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStatusFilter(s)}>
                  {s === '' ? 'All' : s.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="kanban">
              {STATUS_COLS.map(col => (
                <div className="kanban-col" key={col.key}>
                  <div className="kanban-col-header">
                    <span>{col.label}</span>
                    <span style={{ background: 'var(--border)', borderRadius: 100, padding: '1px 7px', fontSize: 11 }}>
                      {tasksByStatus[col.key]?.length || 0}
                    </span>
                  </div>
                  {tasksByStatus[col.key]?.map(task => (
                    <div className="kanban-card" key={task.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div className="kanban-card-title">{task.title}</div>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[task.priority], marginTop: 4, flexShrink: 0 }} />
                      </div>
                      {task.description && (
                        <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                          {task.description.length > 100 ? task.description.slice(0, 100) + '...' : task.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 12 }}>
                        {task.assignee_name && (
                          <span style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '1px 7px', borderRadius: 100, fontSize: 11 }}>
                            {task.assignee_name}
                          </span>
                        )}
                        {task.due_date && (
                          <span className={`badge ${task.overdue ? 'badge-overdue' : 'badge-todo'}`}>
                            {new Date(task.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                        {(isAdmin || task.assignee_id === user?.id) && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }} onClick={() => setModal(task)}>Edit</button>
                        )}
                        {isAdmin && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: 'var(--danger)' }} onClick={() => handleDeleteTask(task)}>Delete</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!tasksByStatus[col.key]?.length && (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text3)', fontSize: 13 }}>No tasks</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'members' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td style={{ color: 'var(--text2)' }}>{m.email}</td>
                    <td><span className={`badge badge-${m.role}`}>{m.role}</span></td>
                    <td style={{ color: 'var(--text3)', fontSize: 13 }}>{new Date(m.joined_at).toLocaleDateString()}</td>
                    {isAdmin && (
                      <td>
                        {m.id !== user?.id && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.id)}>Remove</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal === 'newTask' || (modal && modal.id)) && (
        <TaskModal
          task={modal === 'newTask' ? null : modal}
          members={members}
          projectId={id}
          isAdmin={isAdmin}
          onClose={() => setModal(null)}
          onSave={handleTaskSaved}
        />
      )}

      {memberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setMemberModal(false)}
          onAdded={(m) => { setMembers(prev => [...prev, m]); setMemberModal(false); }}
        />
      )}
    </Layout>
  );
}
