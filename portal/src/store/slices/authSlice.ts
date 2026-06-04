import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  api,
  getStoredToken,
  setStoredToken,
  USER_KEY,
} from '../../lib/api';
import type {
  AuthUser,
  LoginResponse,
  RegisterPayload,
} from '../../types/auth';

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

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1] ?? '')) as { exp?: number };
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function syncAuthStorage(token: string | null, user: AuthUser | null): void {
  setStoredToken(token);
  persistUser(user);
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const storedToken = getStoredToken();
const storedUser = storedToken ? loadStoredUser() : null;

const initialState: AuthState = {
  user: storedUser,
  token: storedToken,
  loading: Boolean(storedToken),
  isAuthenticated: Boolean(storedToken && storedUser),
};

export const bootstrapSession = createAsyncThunk(
  'auth/bootstrap',
  async (_, { dispatch }) => {
    const token = getStoredToken();
    if (!token) {
      if (loadStoredUser()) {
        dispatch(clearSession());
      }
      return;
    }
    if (isTokenExpired(token)) {
      dispatch(clearSession());
      return;
    }
    try {
      const data = await api.get<{ user: AuthUser }>('/api/users/me');
      dispatch(setSession({ token, user: data.user }));
    } catch {
      dispatch(clearSession());
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }) => {
    const data = await api.post<LoginResponse>(
      '/api/auth/login',
      { email, password },
      false,
    );
    return data;
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload: RegisterPayload) => {
    await api.post<{ user: AuthUser }>('/api/auth/register', payload, false);
  },
);

export const logoutAsync = createAsyncThunk('auth/logoutAsync', async () => {
  try {
    await api.post<{ message: string }>('/api/auth/logout', {}, true);
  } catch {
    // Clear local session even if the network call fails.
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>,
    ) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.loading = false;
      syncAuthStorage(action.payload.token, action.payload.user);
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      syncAuthStorage(state.token, action.payload);
    },
    clearSession(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      syncAuthStorage(null, null);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.pending, (state) => {
        if (state.token) state.loading = true;
      })
      .addCase(bootstrapSession.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.loading = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.loading = false;
        syncAuthStorage(action.payload.token, action.payload.user);
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        syncAuthStorage(null, null);
      })
      .addCase(logoutAsync.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        syncAuthStorage(null, null);
      });
  },
});

export const { setSession, setUser, clearSession, setLoading } = authSlice.actions;
export default authSlice.reducer;
