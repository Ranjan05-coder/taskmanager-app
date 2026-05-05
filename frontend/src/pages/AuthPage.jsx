import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await signup(form.name, form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <h1>◈ Task<span>Flow</span></h1>
          <p>{mode === 'login' ? 'Sign in to your workspace' : 'Create your account'}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Jane Smith"
                value={form.name}
                onChange={update('name')}
                required
                minLength={2}
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update('email')}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={update('password')}
              required
              minLength={6}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <a href="#" onClick={(e) => { e.preventDefault(); setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  );
}
