"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_BASE_URL } from '@/types/user';

interface UserData {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  phone?: string | null;
  role: string;
}

interface AuthContextType {
  user: UserData | null;
  csrfToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<boolean>;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'laaiqa_user';
const CSRF_KEY = 'laaiqa_csrf';
const SESSION_EXPIRY_KEY = 'laaiqa_session_expiry';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(CSRF_KEY);
    sessionStorage.removeItem(SESSION_EXPIRY_KEY);
    setUser(null);
    setCsrfToken(null);
  }, []);

  const isSessionValid = useCallback(() => {
    const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiry) return false;
    return Date.now() < parseInt(expiry, 10);
  }, []);

  const loadFromSession = useCallback(() => {
    try {
      if (!isSessionValid()) {
        clearSession();
        return false;
      }
      const cachedUser = sessionStorage.getItem(SESSION_KEY);
      const cachedCsrf = sessionStorage.getItem(CSRF_KEY);
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
        if (cachedCsrf) setCsrfToken(cachedCsrf);
        return true;
      }
    } catch {
      clearSession();
    }
    return false;
  }, [isSessionValid, clearSession]);

  const saveToSession = useCallback((userData: UserData, csrf: string | null) => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
      if (csrf) sessionStorage.setItem(CSRF_KEY, csrf);
      sessionStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString());
    } catch {
      // Session storage might be full or disabled
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const [userRes, csrfRes] = await Promise.all([
        fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/auth/csrf-token`, { credentials: 'include' })
      ]);

      if (!userRes.ok) {
        clearSession();
        return;
      }

      const userData = await userRes.json();
      // Filter out base64 images to prevent storage issues
      const sanitizedUser = {
        ...userData.user,
        image: userData.user.image && userData.user.image.startsWith('http') ? userData.user.image : null
      };
      setUser(sanitizedUser);

      let csrf = null;
      if (csrfRes.ok) {
        const csrfData = await csrfRes.json();
        csrf = csrfData.csrfToken;
        setCsrfToken(csrf);
      }

      saveToSession(sanitizedUser, csrf);
    } catch {
      clearSession();
    }
  }, [clearSession, saveToSession]);

  const logout = useCallback(async (): Promise<boolean> => {
    if (!csrfToken) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'CSRF-Token': csrfToken }
      });
      if (res.ok) {
        clearSession();
        return true;
      }
    } catch {
      // Logout failed
    }
    return false;
  }, [csrfToken, clearSession]);

  useEffect(() => {
    const init = async () => {
      // Try loading from session first
      if (loadFromSession()) {
        setIsLoading(false);
        // Refresh in background to keep session fresh (but don't block UI)
        refreshUser();
        return;
      }
      // No valid session, fetch from server
      await refreshUser();
      setIsLoading(false);
    };
    init();
  }, [loadFromSession, refreshUser]);

  return (
    <AuthContext.Provider value={{
      user,
      csrfToken,
      isLoading,
      isAuthenticated: !!user,
      refreshUser,
      logout,
      clearSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
