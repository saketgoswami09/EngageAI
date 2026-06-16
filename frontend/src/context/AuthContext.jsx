import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load persisted session
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const stored = localStorage.getItem('admin');
    if (token && stored) {
      setAdmin(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    const { accessToken, refreshToken, admin: adminData } = data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('admin', JSON.stringify(adminData));
    setAdmin(adminData);
    return adminData;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout'); } catch {}
    localStorage.clear();
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, login, logout, loading, isAdmin: admin?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
