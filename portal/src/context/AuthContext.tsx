import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  ApiError,
  getStoredToken,
  setStoredToken,
  setUnauthorizedHandler,
  USER_KEY,
} from '../lib/api';
import type {
  AuthUser,
  LoginResponse,
  RegisterPayload,
} from '../types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    persistUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setStoredToken(null);
      setToken(null);
      setUser(null);
      persistUser(null);
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        window.location.assign('/login');
      }
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) {
      // User may persist in storage without a token (stale session).
      if (loadStoredUser()) {
        setUser(null);
        persistUser(null);
      }
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get<{ user: AuthUser }>('/api/users/me');
        if (!cancelled) {
          setUser(data.user);
          persistUser(data.user);
          setToken(stored);
        }
      } catch {
        if (!cancelled) {
          logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<LoginResponse>(
      '/api/auth/login',
      { email, password },
      false,
    );
    setStoredToken(data.token);
    setToken(data.token);
    setUser(data.user);
    persistUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await api.post<{ user: AuthUser }>(
      '/api/auth/register',
      payload,
      false,
    );
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

export function getEmployeeHomePath(employeeType: AuthUser['employeeType']): string {
  if (employeeType === 'QC') return '/employee/qc';
  if (employeeType === 'DESIGNER') return '/employee/designer';
  if (employeeType === 'BOTH') return '/employee/designer';
  return '/employee/designer';
}

export function getRoleHomePath(user: AuthUser | AuthUser['role']): string {
  const role = typeof user === 'string' ? user : user.role;
  if (role === 'CLIENT') return '/dashboard';
  if (role === 'ADMIN') return '/admin';
  if (role === 'EMPLOYEE') {
    const employeeType = typeof user === 'string' ? null : user.employeeType;
    return getEmployeeHomePath(employeeType);
  }
  return '/login';
}

export { ApiError };
