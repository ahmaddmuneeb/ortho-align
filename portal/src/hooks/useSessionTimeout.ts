import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutAsync } from '../store/slices/authSlice';
import { toast } from '../lib/toast';

const IDLE_MS = 20 * 60 * 1000;
const WARN_MS = 18 * 60 * 1000;
const CHECK_MS = 30_000;

const ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
] as const;

/**
 * Logs out after 20 minutes without mouse/keyboard/touch/scroll/click activity.
 * Warns at 18 minutes. Only active when authenticated with token + user.
 */
export function useSessionTimeout(): void {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, token, user, loading } = useAppSelector((s) => s.auth);
  const lastActivityRef = useRef(Date.now());
  const warnedRef = useRef(false);
  const loggingOutRef = useRef(false);

  const enabled = Boolean(isAuthenticated && token && user && !loading);

  useEffect(() => {
    if (!enabled) {
      warnedRef.current = false;
      return;
    }

    lastActivityRef.current = Date.now();
    warnedRef.current = false;
    loggingOutRef.current = false;

    const bumpActivity = () => {
      lastActivityRef.current = Date.now();
      warnedRef.current = false;
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, bumpActivity, { passive: true });
    }

    const intervalId = window.setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current;

      if (idleFor >= WARN_MS && idleFor < IDLE_MS && !warnedRef.current) {
        warnedRef.current = true;
        toast.info('Session expiring in 2 minutes');
      }

      if (idleFor >= IDLE_MS && !loggingOutRef.current) {
        loggingOutRef.current = true;
        void (async () => {
          try {
            await dispatch(logoutAsync()).unwrap();
          } catch {
            // logoutAsync clears session on reject too
          }
          navigate('/login', {
            replace: true,
            state: {
              message: 'Logged out for security (inactive 20 minutes)',
            },
          });
          toast.info('Logged out for security (inactive 20 minutes)');
        })();
      }
    }, CHECK_MS);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, bumpActivity);
      }
      window.clearInterval(intervalId);
    };
  }, [enabled, dispatch, navigate]);
}
