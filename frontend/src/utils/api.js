// VITE_API_URL is injected at build time. If it was not available during the
// build (e.g. the env var was added after the last deploy), fall back to a
// runtime-safe value: use the current page origin so that relative /api calls
// still work in development (where the Vite proxy handles them), and avoid
// silently hitting the wrong host in production.
const _buildTimeUrl = import.meta.env.VITE_API_URL;
const BASE = _buildTimeUrl
  ? _buildTimeUrl.replace(/\/$/, '') // strip any trailing slash
  : (typeof window !== 'undefined' ? window.location.origin : '') + '/api';

const getToken = () => localStorage.getItem('token');

const req = async (method, path, body) => {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  const token = getToken();
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Request failed');
  return data;
};

export const api = {
  // Auth
  signup: (data) => req('POST', '/auth/signup', data),
  login: (data) => req('POST', '/auth/login', data),
  me: () => req('GET', '/auth/me'),

  // Dashboard
  dashboard: () => req('GET', '/dashboard'),

  // Projects
  getProjects: () => req('GET', '/projects'),
  createProject: (data) => req('POST', '/projects', data),
  getProject: (id) => req('GET', `/projects/${id}`),
  updateProject: (id, data) => req('PUT', `/projects/${id}`, data),
  deleteProject: (id) => req('DELETE', `/projects/${id}`),

  // Members
  getMembers: (projectId) => req('GET', `/projects/${projectId}/members`),
  addMember: (projectId, data) => req('POST', `/projects/${projectId}/members`, data),
  removeMember: (projectId, userId) => req('DELETE', `/projects/${projectId}/members/${userId}`),

  // Tasks
  getTasks: (projectId, filters = {}) => {
    const q = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
    return req('GET', `/projects/${projectId}/tasks${q.size ? '?' + q : ''}`);
  },
  createTask: (projectId, data) => req('POST', `/projects/${projectId}/tasks`, data),
  updateTask: (projectId, taskId, data) => req('PATCH', `/projects/${projectId}/tasks/${taskId}`, data),
  deleteTask: (projectId, taskId) => req('DELETE', `/projects/${projectId}/tasks/${taskId}`),
};
