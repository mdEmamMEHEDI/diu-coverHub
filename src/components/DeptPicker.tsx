import { useEffect, useMemo, useRef, useState } from 'react';
import type { TemplateDef, TemplateId } from '../lib/templates';

interface Props {
  templates: TemplateDef[];
  value: TemplateId;
  onChange: (id: TemplateId) => void;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ');

export function DeptPicker({ templates, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const current = templates.find((template) => template.id === value);

  const results = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (!words.length) return templates;
    return templates.filter((template) => {
      const searchable = normalize(`${template.name} ${template.short} ${template.keywords?.join(' ') ?? ''}`);
      return words.every((word) => searchable.includes(word));
    });
  }, [query, templates]);

  useEffect(() => setHighlighted(0), [query, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    searchRef.current?.focus();
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
    };
  }, [open]);

  const select = (id: TemplateId) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 sm:flex-none">
      <button
        type="button"
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Choose department"
        className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-3 text-left text-sm font-semibold text-[color:var(--diu-blue)] shadow-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:min-w-[300px]"
      >
        <span className="min-w-0 flex-1 truncate">{current ? `${current.short} – ${current.name}` : 'Select department'}</span>
        <svg className="shrink-0 text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-full min-w-[300px] rounded-xl border border-slate-200 bg-white p-2 shadow-xl sm:w-[380px]">
          <div className="relative">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search department… (e.g. software, nfe)"
              role="combobox"
              aria-expanded="true"
              aria-controls="department-list"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-[15px] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setHighlighted((index) => Math.min(results.length - 1, index + 1));
                } else if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  setHighlighted((index) => Math.max(0, index - 1));
                } else if (event.key === 'Enter' && results[highlighted]) {
                  event.preventDefault();
                  select(results[highlighted].id);
                } else if (event.key === 'Escape') {
                  setOpen(false);
                }
              }}
            />
          </div>

          <ul id="department-list" role="listbox" className="mt-2 max-h-64 overflow-y-auto">
            {results.map((template, index) => (
              <li key={template.id} role="option" aria-selected={template.id === value}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => select(template.id)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${index === highlighted ? 'bg-blue-50' : ''} ${template.id === value ? 'font-semibold text-[color:var(--diu-blue)]' : 'text-slate-800'}`}
                >
                  <span className="w-11 shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-center text-[11px] font-bold text-slate-600">{template.short}</span>
                  <span className="min-w-0 flex-1 truncate">{template.name}</span>
                </button>
              </li>
            ))}
          </ul>

          {!results.length && <p className="px-3 py-3 text-sm text-slate-600">No department found for <b>“{query}”</b>.</p>}
        </div>
      )}
    </div>
  );
}
