/** Universal tooth numbering (1–32) per ortho-align prescription API. */
export const TOOTH_MIN = 1;
export const TOOTH_MAX = 32;

export type ToothFieldKey =
  | 'avoidEngagersTeeth'
  | 'extractTeeth'
  | 'leaveSpacesTeeth'
  | 'doNotMoveTeeth';

export function parseTeethArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const nums = value
    .map((v) => (typeof v === 'number' ? v : Number.parseInt(String(v), 10)))
    .filter((n) => Number.isInteger(n) && n >= TOOTH_MIN && n <= TOOTH_MAX);
  return [...new Set(nums)].sort((a, b) => a - b);
}

/** Parse comma/space-separated input into valid tooth numbers; returns invalid tokens. */
export function parseTeethInput(raw: string): { teeth: number[]; invalid: string[] } {
  const trimmed = raw.trim();
  if (!trimmed) return { teeth: [], invalid: [] };

  const parts = trimmed.split(/[\s,;]+/).filter(Boolean);
  const teeth: number[] = [];
  const invalid: string[] = [];

  for (const part of parts) {
    const n = Number.parseInt(part, 10);
    if (Number.isInteger(n) && n >= TOOTH_MIN && n <= TOOTH_MAX) {
      teeth.push(n);
    } else {
      invalid.push(part);
    }
  }

  return { teeth: [...new Set(teeth)].sort((a, b) => a - b), invalid };
}

export function mergeTeeth(existing: number[], added: number[]): number[] {
  return [...new Set([...existing, ...added])].sort((a, b) => a - b);
}

export function validateTeethList(
  teeth: number[] | undefined,
  fieldLabel: string,
): string | null {
  if (!teeth?.length) return null;
  const invalid = teeth.filter((t) => t < TOOTH_MIN || t > TOOTH_MAX);
  if (invalid.length > 0) {
    return `${fieldLabel} contains invalid tooth numbers: ${invalid.join(', ')}. Must be ${TOOTH_MIN}-${TOOTH_MAX}`;
  }
  return null;
}
