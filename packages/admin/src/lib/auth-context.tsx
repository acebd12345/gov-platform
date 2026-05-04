'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  isSuperAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  tenant: string;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  setTenant: (slug: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenant, setTenant] = useState('portal');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    const savedTenant = localStorage.getItem('tenant');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {}
    }
    if (savedTenant) setTenant(savedTenant);
    setIsLoading(false);
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: AuthUser) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  const changeTenant = (slug: string) => {
    localStorage.setItem('tenant', slug);
    setTenant(slug);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, isLoading, login, logout, setTenant: changeTenant }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
