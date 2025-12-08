"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { API_BASE_URL } from '@/types/user';

interface UserData {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  phone?: string | null;
  role: string;
  profileComplete?: boolean;
  // Common address fields
  address?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  gender?: string | null;
  // Customer physical attributes
  height?: number | null;
  weight?: number | null;
  color?: string | null;
  ethnicity?: string | null;
  age?: number | null;
  other?: string | null;
  // Artist profile fields
  companyName?: string | null;
  category?: string | null;
  experience?: string | null;
  bio?: string | null;
  specialties?: string | null;
  portfolioLink?: string | null;
  services?: string[] | null;
  availableLocations?: string[] | null;
  // Artist booking settings
  advanceBookingDays?: number | null;
  bookingType?: string | null;
  paymentMethods?: string[] | null;
  allowPartialPayment?: boolean | null;
  bookingInfo?: string[] | null;
  // Customer preferences
  bookingPreferences?: string[] | null;
  preferredArtists?: string[] | null;
}

interface AuthContextType {
  user: UserData | null;
  csrfToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: (forceRefresh?: boolean) => Promise<UserData | null>;
  logout: () => Promise<boolean>;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'laaiqa_user';
const CSRF_KEY = 'laaiqa_csrf';
const SESSION_EXPIRY_KEY = 'laaiqa_session_expiry';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
const ROLE_CHANGE_KEY = 'laaiqa_role_changed'; // Flag to force refresh after role change

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initRef = useRef(false);

  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(CSRF_KEY);
      sessionStorage.removeItem(SESSION_EXPIRY_KEY);
      sessionStorage.removeItem(ROLE_CHANGE_KEY);
    } catch {
      // Session storage might not be available
    }
    setUser(null);
    setCsrfToken(null);
  }, []);

  const isSessionValid = useCallback(() => {
    try {
      // Check if role was recently changed - force refresh
      const roleChanged = sessionStorage.getItem(ROLE_CHANGE_KEY);
      if (roleChanged) {
        sessionStorage.removeItem(ROLE_CHANGE_KEY);
        return false;
      }
      
      const expiry = sessionStorage.getItem(SESSION_EXPIRY_KEY);
      if (!expiry) return false;
      return Date.now() < parseInt(expiry, 10);
    } catch {
      return false;
    }
  }, []);

  const loadFromSession = useCallback((): UserData | null => {
    try {
      if (!isSessionValid()) {
        clearSession();
        return null;
      }
      const cachedUser = sessionStorage.getItem(SESSION_KEY);
      const cachedCsrf = sessionStorage.getItem(CSRF_KEY);
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        setUser(userData);
        if (cachedCsrf) setCsrfToken(cachedCsrf);
        return userData;
      }
    } catch {
      clearSession();
    }
    return null;
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

  const refreshUser = useCallback(async (forceRefresh: boolean = false): Promise<UserData | null> => {
    try {
      // If force refresh, clear session first to ensure fresh data
      if (forceRefresh) {
        try {
          sessionStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(SESSION_EXPIRY_KEY);
        } catch {
          // Ignore
        }
      }

      const [userRes, csrfRes] = await Promise.all([
        fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include', cache: 'no-store' }),
        fetch(`${API_BASE_URL}/auth/csrf-token`, { credentials: 'include', cache: 'no-store' })
      ]);

      if (!userRes.ok) {
        clearSession();
        return null;
      }

      const userData = await userRes.json();
      // Filter out base64 images to prevent storage issues
      const sanitizedUser: UserData = {
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
      return sanitizedUser;
    } catch {
      clearSession();
      return null;
    }
  }, [clearSession, saveToSession]);

  const logout = useCallback(async (): Promise<boolean> => {
    try {
      // Try to get CSRF token if we don't have one
      let token = csrfToken;
      if (!token) {
        try {
          const csrfRes = await fetch(`${API_BASE_URL}/auth/csrf-token`, { credentials: 'include' });
          if (csrfRes.ok) {
            const data = await csrfRes.json();
            token = data.csrfToken;
          }
        } catch {
          // Continue without CSRF
        }
      }
      
      if (!token) {
        // Even without CSRF, clear local session
        clearSession();
        return true;
      }
      
      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'CSRF-Token': token }
      });
      
      // Clear session regardless of response
      clearSession();
      return res.ok;
    } catch {
      // Clear session even on error
      clearSession();
      return true;
    }
  }, [csrfToken, clearSession]);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return;
    initRef.current = true;
    
    const init = async () => {
      // Try loading from session first
      const cachedUser = loadFromSession();
      if (cachedUser) {
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
