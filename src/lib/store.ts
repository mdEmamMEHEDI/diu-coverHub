import { useEffect, useReducer } from 'react';
import { TEMPLATES, type TemplateId, type Values } from './templates';

export interface State {
  template: TemplateId;
  values: Record<TemplateId, Values>;
}

type Action =
  | { type: 'set'; key: string; value: string }
  | { type: 'unset'; key: string }
  | { type: 'switch'; template: TemplateId }
  | { type: 'reset' };

const KEY = 'diu-coverhub:v1';
const empty = (): State => ({ template: 'nfe', values: { nfe: {}, swe: {}, eee: {} } });

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as State;
    if (!p || !TEMPLATES[p.template]) return empty();
    return { template: p.template, values: { nfe: p.values?.nfe ?? {}, swe: p.values?.swe ?? {}, eee: p.values?.eee ?? {} } };
  } catch {
    return empty();
  }
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'set':
      return { ...s, values: { ...s.values, [s.template]: { ...s.values[s.template], [a.key]: a.value } } };
    case 'unset': {
      const { [a.key]: _drop, ...rest } = s.values[s.template];
      void _drop;
      return { ...s, values: { ...s.values, [s.template]: rest } };
    }
    case 'switch': {
      if (a.template === s.template) return s;
      // carry over shared details (name, id, course code …) that are still empty on the other template
      const from = TEMPLATES[s.template];
      const to = TEMPLATES[a.template];
      const next = { ...s.values[a.template] };
      for (const f of to.fields) {
        if (!f.shared || (next[f.key] ?? '') !== '') continue;
        const src = from.fields.find((x) => x.key === f.key && x.shared);
        const v = src ? s.values[s.template][src.key] : undefined;
        if (v) next[f.key] = v;
      }
      return { template: a.template, values: { ...s.values, [a.template]: next } };
    }
    case 'reset':
      return { ...s, values: { ...s.values, [s.template]: {} } };
  }
}

export function useCoverStore() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* private mode – ignore */
    }
  }, [state]);
  return [state, dispatch] as const;
}
