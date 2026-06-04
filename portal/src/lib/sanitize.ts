/** Max lengths aligned with typical API / DB limits */
export const MAX = {
  name: 200,
  email: 254,
  phone: 32,
  url: 2048,
  address: 500,
  notes: 5000,
  comment: 5000,
  search: 200,
  region: 100,
  hearAboutUs: 500,
  password: 128,
  chiefComplaint: 4000,
  relationship: 200,
  instructions: 4000,
  transitionNote: 2000,
  productionDescription: 500,
} as const;

export type SanitizeTextOptions = {
  maxLength?: number;
  /** Allow single newlines; still strips HTML */
  multiline?: boolean;
};

const HTML_TAG = /<[^>]*>/g;
const SCRIPT_BLOCK = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function stripHtmlTags(value: string): string {
  return value
    .replace(SCRIPT_BLOCK, '')
    .replace(HTML_TAG, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

function normalizeWhitespace(value: string, multiline: boolean): string {
  if (multiline) {
    return value
      .replace(/\r\n/g, '\n')
      .replace(/[^\S\n]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  return value.replace(/\s+/g, ' ').trim();
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength);
}

/**
 * Trim, strip HTML/script, normalize whitespace, enforce max length.
 */
export function sanitizeText(
  value: string | null | undefined,
  options: SanitizeTextOptions = {},
): string {
  const { maxLength = MAX.notes, multiline = false } = options;
  if (value == null) return '';
  let out = stripHtmlTags(String(value));
  out = out.replace(CONTROL_CHARS, '');
  out = normalizeWhitespace(out, multiline);
  return truncate(out, maxLength);
}

/** Lowercase, trim, strip HTML — for login/register/API email fields */
export function sanitizeEmail(value: string | null | undefined): string {
  const raw = sanitizeText(value, { maxLength: MAX.email });
  return raw.toLowerCase();
}

/** Passwords: trim only — do not strip characters needed for complexity rules */
export function sanitizePassword(value: string | null | undefined): string {
  if (value == null) return '';
  return String(value).trim().slice(0, MAX.password);
}

/** Phone: keep digits and common punctuation */
export function sanitizePhone(value: string | null | undefined): string {
  const raw = sanitizeText(value, { maxLength: MAX.phone });
  return raw.replace(/[^\d\s\-+().]/g, '').trim();
}

/** URL fields: trim + strip HTML; does not validate URL shape */
export function sanitizeUrl(value: string | null | undefined): string {
  return sanitizeText(value, { maxLength: MAX.url });
}

/** Client-side search boxes — safe for display/filter matching */
export function sanitizeSearchQuery(value: string | null | undefined): string {
  return sanitizeText(value, { maxLength: MAX.search });
}

/** Parse payment / numeric amount — not HTML-sanitized */
export function parseAmount(value: string | null | undefined): number | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 100) / 100;
}

/** Escape for safe text display in HTML (if rendering raw strings) */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
