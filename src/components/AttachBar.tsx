import { useRef, useState } from 'react';
import type { AssignmentFile } from '../lib/pdf';

interface Props {
  file: AssignmentFile | null;
  busy: boolean;
  error: string | null;
  onPick: (f: File) => void;
  onRemove: () => void;
  onCoverOnly: () => void;
}

const fmt = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Compact "attach assignment" control – sits directly under the Download button. */
export function AttachBar({ file, busy, error, onPick, onRemove, onCoverOnly }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div
      className={`w-full min-w-[210px] rounded-lg transition ${drag ? 'bg-blue-50 ring-2 ring-blue-400' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onPick(f);
      }}
    >
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = '';
        }}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          title="PDF only, up to 10 MB. It is added right after the cover page."
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-400 bg-slate-50 px-3 py-1.5 text-[13px] font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16" />
          </svg>
          {busy ? 'Checking…' : 'Attach assignment (PDF)'}
        </button>
      ) : (
        <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[13px] text-emerald-900">
          <div className="flex items-center gap-2">
            <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m5 12 4.5 4.5L19 7" />
            </svg>
            <span className="min-w-0 flex-1 truncate font-medium" title={file.name}>
              {file.name}
            </span>
            <span className="shrink-0 text-emerald-700">
              {file.pages}p · {fmt(file.size)}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs">
            <button type="button" onClick={() => input.current?.click()} className="font-medium text-blue-700 hover:underline">
              Replace
            </button>
            <button type="button" onClick={onRemove} className="font-medium text-slate-500 hover:text-red-600">
              Remove
            </button>
            <button type="button" onClick={onCoverOnly} className="ml-auto font-medium text-slate-600 hover:text-blue-700 hover:underline">
              Cover only
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs leading-snug text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
