import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('cv_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('cv_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then(({ user: freshUser }) => {
        setUser(freshUser);
        localStorage.setItem('cv_user', JSON.stringify(freshUser));
      })
      .catch(() => {
        localStorage.removeItem('cv_token');
        localStorage.removeItem('cv_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: loggedInUser, token } = await authService.login(email, password);
    localStorage.setItem('cv_token', token);
    localStorage.setItem('cv_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cv_token');
    localStorage.removeItem('cv_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
