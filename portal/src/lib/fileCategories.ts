import type { FileCategory } from '../types/case';

export const FILE_CATEGORY_LABELS: Record<FileCategory, string> = {
  SCAN: 'Intraoral scan',
  PHOTO: 'Clinical photo',
  XRAY: 'X-ray',
  PRODUCTION: 'Production deliverable',
  OTHER: 'Other',
};

export function fileCategoryLabel(category: FileCategory): string {
  return FILE_CATEGORY_LABELS[category] ?? category;
}
