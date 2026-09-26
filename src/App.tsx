import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageCanvas } from './components/PageCanvas';
import { FormPanel } from './components/FormPanel';
import { useCoverStore } from './lib/store';
import { PAGE_W, TEMPLATES, TEMPLATE_LIST, resolve, type FieldDef } from './lib/templates';
import { sanitize } from './lib/text';
import { buildPdf, downloadBytes, readAssignment, type AssignmentFile } from './lib/pdf';
import { AttachBar } from './components/AttachBar';
import { DeptPicker } from './components/DeptPicker';

type Mobile = 'page' | 'form';

export default function App() {
  const [state, dispatch] = useCoverStore();
  const template = TEMPLATES[state.template];
  const values = state.values[state.template];

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [hints, setHints] = useState(true);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  const [mobileTab, setMobileTab] = useState<Mobile>('page');
  const [showErrors, setShowErrors] = useState(false);
  const [missing, setMissing] = useState<FieldDef[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentFile | null>(null);
  const [attachBusy, setAttachBusy] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  /* ---------- fit-to-width scale ---------- */
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageW, setStageW] = useState(800);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStageW(el.clientWidth));
    ro.observe(el);
    setStageW(el.clientWidth);
    return () => ro.disconnect();
  }, [mobileTab]);
  const fitScale = Math.min(1.25, Math.max(0.35, (stageW - 32) / (template.pageW ?? PAGE_W)));
  const scale = zoom === 'fit' ? fitScale : zoom;
  const bump = (d: number) => setZoom(Math.min(2.2, Math.max(0.4, +(scale + d).toFixed(2))));

  /* ---------- editing ---------- */
  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const onChange = useCallback(
    (def: FieldDef, raw: string) => {
      const { text, removed } = sanitize(raw);
      if (removed) flash('Some characters can’t be printed on the cover (English letters, digits and common symbols only).');
      dispatch({ type: 'set', key: def.key, value: text });
      // fields that "follow" this one go back to following it
      for (const f of template.fields) if (f.followKey === def.key) dispatch({ type: 'unset', key: f.key });
    },
    [dispatch, flash, template],
  );

  const orderedKeys = useMemo(() => template.fields.filter((f) => !f.pageOnly || true).map((f) => f.key), [template]);
  const onEnter = useCallback(
    (key: string) => {
      // move to the next field – on the page when the page is visible, otherwise in the form
      const pageEl = document.querySelector<HTMLElement>(`[data-page-field="${key}"]`);
      const attr = pageEl && pageEl.offsetParent !== null && document.activeElement === pageEl ? 'data-page-field' : 'data-form-field';
      const keys = attr === 'data-page-field' ? orderedKeys : template.fields.filter((f) => !f.pageOnly).map((f) => f.key);
      const next = keys[keys.indexOf(key) + 1];
      const el = next && document.querySelector<HTMLElement>(`[${attr}="${next}"]`);
      if (el) el.focus();
      else (document.activeElement as HTMLElement | null)?.blur();
    },
    [orderedKeys, template],
  );

  const missingFields = useMemo(
    () => template.fields.filter((f) => f.required && resolve(template, values, f).trim() === ''),
    [template, values],
  );
  const invalidKeys = useMemo(() => (showErrors ? new Set(missingFields.map((f) => f.key)) : new Set<string>()), [showErrors, missingFields]);

  /* ---------- download ---------- */
  const doDownload = async (coverOnly = false) => {
    setBusy(true);
    try {
      const merged = !coverOnly && assignment ? assignment : null;
      const data = await buildPdf(template, values, merged?.data);
      const id = (resolve(template, values, template.fields.find((f) => f.key === 'studentId')!) || '').replace(/[^\w-]+/g, '');
      const saved = await downloadBytes(data, `${template.fileTag}-${merged ? 'submission' : 'cover'}${id ? '-' + id : ''}.pdf`);
      if (saved) flash(merged ? 'Cover + assignment saved as one PDF.' : 'PDF ready.');
    } catch (e) {
      console.error(e);
      flash('Could not create the PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const coverOnlyRef = useRef(false);
  const onDownload = (coverOnly = false) => {
    coverOnlyRef.current = coverOnly;
    if (missingFields.length) {
      setShowErrors(true);
      setMissing(missingFields);
      return;
    }
    void doDownload(coverOnly);
  };

  const pickAssignment = async (f: File) => {
    setAttachError(null);
    setAttachBusy(true);
    try {
      setAssignment(await readAssignment(f));
    } catch (e) {
      setAttachError((e as Error).message);
    } finally {
      setAttachBusy(false);
    }
  };

  const switchTemplate = (id: typeof state.template) => {
    dispatch({ type: 'switch', template: id });
    setShowErrors(false);
    setActiveKey(null);
  };

  const form = (
    <FormPanel
      template={template}
      values={values}
      activeKey={activeKey}
      invalidKeys={invalidKeys}
      onChange={onChange}
      onActive={setActiveKey}
      onEnter={onEnter}
    />
  );

  return (
    <div className="flex h-full flex-col">
      {/* ------------------------------ top bar ------------------------------ */}
      <header className="z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <div className="text-lg font-bold tracking-tight text-[color:var(--diu-blue)]">CoverHub</div>

          <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <label htmlFor="dept" className="sr-only text-xs font-semibold uppercase tracking-wider text-slate-500 sm:not-sr-only">
              Department
            </label>
            <DeptPicker templates={TEMPLATE_LIST} value={state.template} onChange={switchTemplate} />
          </div>

          <div className="flex w-full flex-wrap items-start justify-end gap-2 sm:ml-auto sm:w-auto sm:flex-nowrap">
            <div className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 md:flex">
              <button type="button" className="h-8 w-8 rounded-md text-lg leading-none text-slate-600 hover:bg-slate-100" onClick={() => bump(-0.1)} aria-label="Zoom out">−</button>
              <button type="button" className="min-w-[52px] rounded-md px-1 text-xs font-medium text-slate-600 hover:bg-slate-100" onClick={() => setZoom('fit')} title="Fit to width">
                {Math.round(scale * 100)}%
              </button>
              <button type="button" className="h-8 w-8 rounded-md text-lg leading-none text-slate-600 hover:bg-slate-100" onClick={() => bump(0.1)} aria-label="Zoom in">+</button>
            </div>
            <label className="hidden cursor-pointer select-none items-center gap-1.5 text-xs text-slate-600 lg:flex">
              <input type="checkbox" checked={hints} onChange={(e) => setHints(e.target.checked)} className="accent-blue-600" />
              Highlight fields
            </label>
            <button
              type="button"
              onClick={() => {
                if (!confirmClear) {
                  setConfirmClear(true);
                  window.setTimeout(() => setConfirmClear(false), 3000);
                  return;
                }
                dispatch({ type: 'reset' });
                setShowErrors(false);
                setConfirmClear(false);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${confirmClear ? 'bg-red-50 text-red-600' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {confirmClear ? 'Sure? Clear all' : 'Clear'}
            </button>
            <div className="flex min-w-0 flex-1 flex-col items-stretch gap-1.5 sm:flex-none">
              <button
                type="button"
                onClick={() => onDownload(false)}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--diu-blue)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--diu-blue-dark)] disabled:opacity-60"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 20h16" />
                </svg>
                {busy ? 'Creating…' : assignment ? 'Download with assignment' : 'Download PDF'}
              </button>
              <AttachBar
                file={assignment}
                busy={attachBusy}
                error={attachError}
                onPick={pickAssignment}
                onRemove={() => {
                  setAssignment(null);
                  setAttachError(null);
                }}
                onCoverOnly={() => onDownload(true)}
              />
            </div>
          </div>
        </div>
      </header>

      {/* mobile switch */}
      <div className="flex border-b border-slate-200 bg-white lg:hidden">
        {(['page', 'form'] as Mobile[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMobileTab(m)}
            className={`flex-1 py-2.5 text-sm font-semibold ${mobileTab === m ? 'border-b-2 border-blue-600 text-blue-700' : 'text-slate-500'}`}
          >
            {m === 'page' ? 'Cover page' : 'Quick form'}
          </button>
        ))}
      </div>

      {/* ------------------------------ body ------------------------------ */}
      <div className="mx-auto flex min-h-0 w-full max-w-[1500px] flex-1">
        <aside className={`${mobileTab === 'form' ? 'block' : 'hidden'} w-full overflow-y-auto bg-white p-4 lg:block lg:w-[340px] lg:shrink-0 lg:border-r lg:border-slate-200`}>
          <p className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-[13px] leading-snug text-blue-900">
            Type here, or click any highlighted spot <b>directly on the cover page</b>. Both stay in sync.
          </p>
          {form}
        </aside>

        <main ref={stageRef} className={`${mobileTab === 'page' ? 'block' : 'hidden'} min-w-0 flex-1 overflow-auto px-4 py-6 lg:block`}>
          <div className="mx-auto w-fit">
            <PageCanvas
              template={template}
              values={values}
              scale={scale}
              hints={hints}
              activeKey={activeKey}
              invalidKeys={invalidKeys}
              onChange={onChange}
              onActive={setActiveKey}
              onEnter={onEnter}
            />
            <p className="mt-3 text-center text-xs text-slate-500">
              {template.name} · {template.description}
            </p>
          </div>
        </main>
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-2 text-center text-[11px] leading-snug text-slate-500 sm:text-xs">
        Developed by <span className="font-semibold text-slate-700">Emam Mehedi</span>
        <span className="mx-1.5 hidden text-slate-300 sm:inline">·</span>
        <br className="sm:hidden" />
        <a href="mailto:emam241-35-024@diu.edu.bd" className="whitespace-nowrap text-blue-700 hover:underline">
          emam241-35-024@diu.edu.bd
        </a>
      </footer>

      {/* ------------------------------ overlays ------------------------------ */}
      {missing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold">Some details are still empty</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
              {missing.map((f) => (
                <li key={f.key}>{f.label}</li>
              ))}
            </ul>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                onClick={() => {
                  const first = missing[0];
                  setMissing(null);
                  window.setTimeout(() => {
                    const el =
                      document.querySelector<HTMLElement>(`[data-page-field="${first.key}"]`) ?? document.querySelector<HTMLElement>(`[data-form-field="${first.key}"]`);
                    const visible = el && el.offsetParent !== null ? el : document.querySelector<HTMLElement>(`[data-form-field="${first.key}"]`);
                    visible?.focus();
                  }, 0);
                }}
              >
                Fill them in
              </button>
              <button
                type="button"
                className="rounded-lg bg-[color:var(--diu-blue)] px-3 py-2 text-sm font-semibold text-white hover:bg-[color:var(--diu-blue-dark)]"
                onClick={() => {
                  setMissing(null);
                  void doDownload(coverOnlyRef.current);
                }}
              >
                Download anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
          <div className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white shadow-lg" role="status">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
