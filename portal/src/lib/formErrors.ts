import { ApiError } from './api';

export function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.details !== undefined) {
      const details = Array.isArray(err.details)
        ? err.details.join(' ')
        : typeof err.details === 'object'
          ? JSON.stringify(err.details)
          : String(err.details);
      return `${err.message}: ${details}`;
    }
    return err.message;
  }
  return fallback;
}
