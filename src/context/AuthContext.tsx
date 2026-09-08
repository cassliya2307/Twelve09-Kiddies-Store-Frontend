'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, login as apiLogin, register as apiRegister, getCurrentUser } from '@/lib/api';
import type { User, AuthTokens } from '@/types/api';

const TOKEN_KEY = 'twelve09-auth-token';
const USER_KEY = 'twelve09-auth-user';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (token) {
        api.setToken(token);
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            // Guard against malformed stored user (e.g. null, string, missing id)
            if (parsedUser && typeof parsedUser === 'object' && typeof parsedUser.id === 'number') {
              setUser(parsedUser);
            }
          } catch {
            // Corrupted stored user — will verify via network or clear
          }
        }
        try {
          // Verify token is still valid by fetching current user
          const freshUser = await getCurrentUser();
          setUser(freshUser);
          localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        } catch {
          // Token invalid or expired, clear auth
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          api.setToken(null);
          setUser(null);
        }
      } else if (storedUser) {
        // Orphaned user without token — clear stale data
        localStorage.removeItem(USER_KEY);
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin({ email, password });
    const { access_token, user } = response as AuthTokens;
    
    api.setToken(access_token);
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setUser(user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await apiRegister({ name, email, password });
    // After registration, automatically log in
    const response = await apiLogin({ email, password });
    const { access_token, user: loggedInUser } = response as AuthTokens;
    
    api.setToken(access_token);
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    api.setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const freshUser = await getCurrentUser();
      localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      setUser(freshUser);
    } catch {
      logout();
    }
  }, [user, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}