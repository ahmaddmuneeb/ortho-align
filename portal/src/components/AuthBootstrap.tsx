import { useEffect, type ReactNode } from 'react';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useAppDispatch } from '../store/hooks';
import { bootstrapSession } from '../store/slices/authSlice';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(bootstrapSession());
  }, [dispatch]);

  useSessionTimeout();

  return <>{children}</>;
}
