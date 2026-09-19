import { GROUP_ORDER, resolve, type FieldDef, type TemplateDef, type Values } from '../lib/templates';

interface Props {
  template: TemplateDef;
  values: Values;
  activeKey: string | null;
  invalidKeys: Set<string>;
  onChange: (def: FieldDef, value: string) => void;
  onActive: (key: string | null) => void;
  onEnter: (key: string) => void;
}

const isoToDisplay = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};
const displayToIso = (d: string) => {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(d.trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

export function FormPanel({ template, values, activeKey, invalidKeys, onChange, onActive, onEnter }: Props) {
  const fields = template.fields.filter((f) => !f.pageOnly);
  return (
    <div className="space-y-5">
      {GROUP_ORDER.map((g) => {
        const list = fields.filter((f) => f.group === g);
        if (!list.length) return null;
        return (
          <section key={g}>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{g}</h3>
            <div className="space-y-3">
              {list.map((def) => {
                const value = resolve(template, values, def);
                const cls = `f-input${invalidKeys.has(def.key) ? ' invalid' : ''}${activeKey === def.key ? ' is-active' : ''}`;
                return (
                  <div key={def.key}>
                    <label htmlFor={`f-${def.key}`} className="mb-1 flex items-center gap-1 text-sm font-medium text-slate-700">
                      {def.label}
                      {def.required && <span className="text-red-500" title="Required">*</span>}
                    </label>
                    <div className="flex gap-2">
                      {def.multi ? (
                        <textarea
                          id={`f-${def.key}`}
                          data-form-field={def.key}
                          className={cls}
                          rows={3}
                          value={value}
                          placeholder={def.placeholder}
                          onChange={(e) => onChange(def, e.target.value)}
                          onFocus={() => onActive(def.key)}
                          onBlur={() => onActive(null)}
                        />
                      ) : (
                        <input
                          id={`f-${def.key}`}
                          data-form-field={def.key}
                          className={cls}
                          type="text"
                          value={value}
                          placeholder={def.placeholder}
                          autoComplete="off"
                          onChange={(e) => onChange(def, e.target.value)}
                          onFocus={() => onActive(def.key)}
                          onBlur={() => onActive(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              onEnter(def.key);
                            }
                          }}
                        />
                      )}
                      {def.date && (
                        <input
                          type="date"
                          aria-label={`${def.label} – pick from calendar`}
                          className="f-input !w-[46px] shrink-0 !px-2 cursor-pointer"
                          value={displayToIso(value)}
                          onChange={(e) => onChange(def, isoToDisplay(e.target.value))}
                        />
                      )}
                    </div>
                    {def.presets && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {def.presets.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => onChange(def, p)}
                            className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                              value === p
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-300 bg-white text-slate-600 hover:border-blue-400 hover:text-blue-700'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export type { Values };
