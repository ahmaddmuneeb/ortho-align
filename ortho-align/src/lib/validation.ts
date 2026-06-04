const HTML_TAG = /<[^>]*>/g;
const SCRIPT_BLOCK = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

/** Strip HTML/script from user-provided strings */
export const stripHtml = (value: string): string =>
  value
    .replace(SCRIPT_BLOCK, '')
    .replace(HTML_TAG, '')
    .replace(/javascript:/gi, '')
    .trim();

/** Trim, strip HTML, enforce max length (returns null for empty optional fields) */
export const clampString = (
  value: unknown,
  maxLength: number,
  { required = false, multiline = false }: { required?: boolean; multiline?: boolean } = {},
): string | null => {
  if (value == null || typeof value !== 'string') {
    return required ? '' : null;
  }
  let cleaned = stripHtml(value);
  cleaned = multiline
    ? cleaned.replace(/[^\S\n]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
    : cleaned.replace(/\s+/g, ' ').trim();
  if (!cleaned) return required ? '' : null;
  return cleaned.length > maxLength ? cleaned.slice(0, maxLength) : cleaned;
};

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number (0-9)');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Basic phone validation - adjust regex based on your requirements
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phone.length >= 10 && phoneRegex.test(phone);
};
