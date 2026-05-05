import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Layout from '../components/Layout';

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="spinner" /></Layout>;

  return (
    <Layout>
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">All projects you're a member of</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/projects/new')}>+ New project</button>
        </div>

        {!projects.length ? (
          <div className="card empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project to get started.</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/projects/new')}>
              Create project
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {projects.map(p => {
              const pct = p.total_tasks > 0 ? Math.round((p.done_count / p.total_tasks) * 100) : 0;
              return (
                <Link to={`/projects/${p.id}`} key={p.id} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow .15s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</h3>
                      <span className={`badge badge-${p.role}`}>{p.role}</span>
                    </div>
                    {p.description && (
                      <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
                        {p.description.length > 80 ? p.description.slice(0, 80) + '...' : p.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
                      <span>{p.task_count} tasks</span>
                      <span>{p.member_count} members</span>
                      <span>{pct}% done</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: 'var(--border)', borderRadius: 2 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--success)', borderRadius: 2, transition: 'width .3s' }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
