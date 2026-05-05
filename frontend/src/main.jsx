import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ProjectsList from './pages/ProjectsList';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><ProjectsList /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><NewProject /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
