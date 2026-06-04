import { configureStore } from '@reduxjs/toolkit';
import authReducer, { clearSession } from './slices/authSlice';
import { setUnauthorizedHandler } from '../lib/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

setUnauthorizedHandler(() => {
  store.dispatch(clearSession());
  const path = window.location.pathname;
  if (path !== '/login' && path !== '/register') {
    window.location.assign('/login');
  }
});
