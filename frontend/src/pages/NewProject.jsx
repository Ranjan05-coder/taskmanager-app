import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Layout from '../components/Layout';

export default function NewProject() {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const p = await api.createProject(form);
      navigate(`/projects/${p.id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page" style={{ maxWidth: 540 }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">New project</h1>
            <p className="page-subtitle">You'll be set as admin of the project</p>
          </div>
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}
          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Project name *</label>
              <input className="form-input" type="text" placeholder="e.g. Website Redesign"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required maxLength={200} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="What is this project about?"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                maxLength={1000} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/projects')}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating...' : 'Create project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
