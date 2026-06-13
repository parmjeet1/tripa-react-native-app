import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, storeAuthData, clearAuthData, getStoredToken, getStoredUser } from './api';
import { User, AuthState } from '../types';

interface AuthContextValue extends AuthState {
  isLoading: boolean;
  login: (mobile: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, mobile: string, password: string, role?: 'driver' | 'rider') => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoggedIn: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from AsyncStorage on boot
  useEffect(() => {
    (async () => {
      try {
        const token = await getStoredToken();
        const user = await getStoredUser();
        if (token && user) {
          setState({ user, token, isLoggedIn: true });
        }
      } catch (e) {
        console.warn('Error restoring session:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (mobile: string, password: string) => {
    const res = await authApi.login(mobile, password);
    if (res.success && res.data) {
      await storeAuthData(res.data.token, res.data.user);
      setState({ user: res.data.user, token: res.data.token, isLoggedIn: true });
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed.' };
  };

  const register = async (name: string, mobile: string, password: string, role: 'driver' | 'rider' = 'driver') => {
    const res = await authApi.register(name, mobile, password, role);
    if (res.success && res.data) {
      await storeAuthData(res.data.token, res.data.user);
      setState({ user: res.data.user, token: res.data.token, isLoggedIn: true });
      return { success: true };
    }
    return { success: false, message: res.message || 'Registration failed.' };
  };

  const logout = async () => {
    await clearAuthData();
    setState({ user: null, token: null, isLoggedIn: false });
  };

  const refresh = async () => {
    const token = await getStoredToken();
    const user = await getStoredUser();
    if (token && user) {
      setState({ user, token, isLoggedIn: true });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, isLoading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
