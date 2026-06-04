/** Screen positions for universal teeth 1–32 (patient-facing odontogram). */
export interface ToothLayout {
  n: number;
  cx: number;
  cy: number;
}

const TOOTH_W = 38;
export const ODONTOGRAM_ARCH_SPAN = 720;
export const ODONTOGRAM_START_X = 40;
const ARCH_SPAN = ODONTOGRAM_ARCH_SPAN;
const START_X = ODONTOGRAM_START_X;
const UPPER_Y = 72;
const LOWER_Y = 188;

function archPositions(nums: number[], y: number): ToothLayout[] {
  const n = nums.length;
  const step = ARCH_SPAN / (n - 1);
  return nums.map((tooth, i) => ({
    n: tooth,
    cx: START_X + i * step,
    cy: y,
  }));
}

/** Upper 1→16 left to right; lower 32→17 left to right (17 = patient lower left). */
export const ODONTOGRAM_LAYOUT: ToothLayout[] = [
  ...archPositions(
    Array.from({ length: 16 }, (_, i) => i + 1),
    UPPER_Y,
  ),
  ...archPositions(
    Array.from({ length: 16 }, (_, i) => 32 - i),
    LOWER_Y,
  ),
];

export const ODONTOGRAM_VIEWBOX = { width: 800, height: 260 };
export const ODONTOGRAM_TOOTH = { w: TOOTH_W, h: 44, rx: 8 };
