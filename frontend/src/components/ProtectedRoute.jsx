import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <p>Loading...</p>
      </div>
    );
  }

  if (!admin) return <Navigate to="/login" replace />;
  if (adminOnly && admin.role !== 'admin') return <Navigate to="/" replace />;

  return children;
}
