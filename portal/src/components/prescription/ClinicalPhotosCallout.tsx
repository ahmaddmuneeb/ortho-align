import { Camera, ImageIcon, Scan } from 'lucide-react';

const PLACEHOLDERS = [
  { label: 'Front', Icon: ImageIcon },
  { label: 'Profile', Icon: Camera },
  { label: 'Occlusal', Icon: Scan },
];

export function ClinicalPhotosCallout() {
  return (
    <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/40 p-4">
      <p className="text-sm font-medium text-teal-900">Clinical reference photos</p>
      <p className="mt-1 text-xs text-teal-800/80">
        Upload intraoral photos and x-rays in{' '}
        <a href="#case-files" className="font-medium text-brand-700 underline hover:text-brand-800">
          Case files
        </a>{' '}
        above — not duplicated here.
      </p>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {PLACEHOLDERS.map(({ label, Icon }) => (
          <a
            key={label}
            href="#case-files"
            className="flex h-20 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-teal-100 bg-white text-teal-700/70 transition-colors hover:border-teal-300 hover:bg-teal-50"
          >
            <Icon className="h-6 w-6" aria-hidden />
            <span className="text-[10px] font-medium">{label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
