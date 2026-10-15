import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string, department?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchPersona: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const storedToken = api.getToken();
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          api.setToken(null);
          setToken(null);
          setUser(null);
        }
      } else {
        // Auto sign-in as Admin by default so the demo is immediately fully interactive
        try {
          const res = await api.login('admin@asyncflow.io', 'admin123');
          setUser(res.user);
          setToken(res.token);
        } catch (e) {
          console.warn('Default auto-login skipped:', e);
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(email, pass);
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name: string, role?: string, department?: string) => {
    setIsLoading(true);
    try {
      const res = await api.register({ email, password: pass, name, role, department });
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Instant switch persona helper for testing RBAC
  const switchPersona = async (role: UserRole) => {
    setIsLoading(true);
    try {
      let email = 'admin@asyncflow.io';
      let pass = 'admin123';
      if (role === 'operator') {
        email = 'operator@asyncflow.io';
        pass = 'operator123';
      } else if (role === 'user') {
        email = 'user@asyncflow.io';
        pass = 'user123';
      }
      const res = await api.login(email, pass);
      setUser(res.user);
      setToken(res.token);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, switchPersona }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
