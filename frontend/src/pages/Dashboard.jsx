import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const statusBadge = (s) => <span className={`badge badge-${s}`}>{s.replace('_', ' ')}</span>;
const priorityBadge = (p) => <span className={`badge badge-${p}`}>{p}</span>;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.dashboard().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="spinner" /></Layout>;

  const totalTasks = data?.projects.reduce((s, p) => s + Number(p.total_tasks), 0) || 0;
  const doneTasks = data?.projects.reduce((s, p) => s + Number(p.done_tasks), 0) || 0;

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="page-subtitle">Here's what's happening across your projects.</p>
          </div>
          <Link to="/projects/new" className="btn btn-primary">+ New Project</Link>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card accent">
            <div className="stat-value">{data?.projects.length || 0}</div>
            <div className="stat-label">Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalTasks}</div>
            <div className="stat-label">Total tasks</div>
          </div>
          <div className="stat-card success">
            <div className="stat-value">{doneTasks}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-value">{data?.overdue || 0}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* My tasks */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>My open tasks</h2>
            </div>
            {!data?.myTasks.length ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <h3>No tasks assigned to you</h3>
              </div>
            ) : data.myTasks.map(t => (
              <div className="task-row" key={t.id}>
                <div style={{ flex: 1 }}>
                  <div className="task-title">{t.title}</div>
                  <div className="task-meta">{t.project_name}</div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {priorityBadge(t.priority)}
                  {t.due_date && (
                    <span className={`badge ${new Date(t.due_date) < new Date() ? 'badge-overdue' : 'badge-todo'}`}>
                      {new Date(t.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Projects overview */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Projects</h2>
            </div>
            {!data?.projects.length ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <h3>No projects yet</h3>
                <Link to="/projects/new" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Create one</Link>
              </div>
            ) : data.projects.map(p => {
              const pct = p.total_tasks > 0 ? Math.round((p.done_tasks / p.total_tasks) * 100) : 0;
              return (
                <Link to={`/projects/${p.id}`} key={p.id} style={{ display: 'block', textDecoration: 'none' }}>
                  <div className="task-row">
                    <div style={{ flex: 1 }}>
                      <div className="task-title">{p.name}</div>
                      <div className="task-meta">
                        {p.total_tasks} tasks · {p.member_count} members
                        {p.overdue_tasks > 0 && <span className="text-danger"> · {p.overdue_tasks} overdue</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 60 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{pct}%</div>
                      <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 4 }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--success)', borderRadius: 2 }} />
                      </div>
                    </div>
                    <span className={`badge badge-${p.role}`}>{p.role}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        {data?.recentActivity?.length > 0 && (
          <div className="card" style={{ marginTop: 20, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600 }}>Recent activity</h2>
            </div>
            {data.recentActivity.map(t => (
              <div className="task-row" key={t.id}>
                <div style={{ flex: 1 }}>
                  <span className="task-title">{t.title}</span>
                  <span className="text-muted text-sm"> — {t.project_name}</span>
                </div>
                {statusBadge(t.status)}
                <span className="text-muted text-sm">{new Date(t.updated_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
