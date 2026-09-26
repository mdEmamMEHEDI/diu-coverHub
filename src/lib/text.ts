import metrics from './metrics.json';

export type FontKey = 'serif-bold' | 'serif-regular' | 'sans-bold' | 'sans-regular';

type FontMetrics = { upm: number; asc: number; desc: number; widths: Record<string, number> };
const M = metrics as unknown as Record<FontKey, FontMetrics>;

export const fontAsc = (f: FontKey) => M[f].asc;
export const fontDesc = (f: FontKey) => M[f].desc;

/** Plain glyph-advance width (no kerning, no ligatures) – identical in the preview and in the PDF. */
export function measure(font: FontKey, text: string, size: number): number {
  const m = M[font];
  let w = 0;
  for (const ch of text) w += m.widths[ch] ?? m.widths['?'] ?? 0;
  return (w / m.upm) * size;
}

/** Keep only characters the bundled fonts can draw; collapse whitespace. */
export function sanitize(text: string): { text: string; removed: boolean } {
  let removed = false;
  let out = '';
  for (const ch of text.replace(/\s+/g, ' ')) {
    if (M['serif-bold'].widths[ch] !== undefined && M['sans-bold'].widths[ch] !== undefined) out += ch;
    else removed = true;
  }
  return { text: out, removed };
}

/* ---------- single line: shrink-to-fit ---------- */

export function fitSingle(font: FontKey, text: string, size: number, maxWidth: number, minFactor = 0.55) {
  const w = measure(font, text.trimEnd(), size);
  if (w <= maxWidth || w === 0) return { size, width: w };
  const factor = Math.max(minFactor, maxWidth / w);
  const s = size * factor;
  return { size: s, width: measure(font, text.trimEnd(), s) };
}

/* ---------- multi line (Title / Topic) ---------- */

export interface MultiSpec {
  /** left edge of the text block */
  x: number;
  /** width of the text block (line 2..n) */
  width: number;
  /** extra left offset of the first line */
  firstIndent: number;
  /** distance between baselines at the default font size */
  lineHeight: number;
  /** vertical room (from the top of the first line) that must not be exceeded */
  maxHeight: number;
}

/** Greedy wrap. Break opportunities: after a space and after a hyphen between letters/digits. */
export function wrapLines(font: FontKey, text: string, size: number, firstWidth: number, width: number): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  // split into pieces; a piece carries its own leading space (if any)
  const pieces: string[] = [];
  const words = clean.split(' ');
  words.forEach((word, wi) => {
    const parts = word.split(/(?<=[A-Za-z0-9]-)(?=[A-Za-z])/);
    parts.forEach((p, pi) => pieces.push(wi > 0 && pi === 0 ? ' ' + p : p));
  });

  const lines: string[] = [];
  let cur = '';
  let limit = firstWidth;
  const push = () => {
    lines.push(cur.trimEnd());
    cur = '';
    limit = width;
  };
  for (const piece of pieces) {
    const candidate = cur + (cur === '' ? piece.trimStart() : piece);
    if (measure(font, candidate, size) <= limit) {
      cur = candidate;
      continue;
    }
    if (cur !== '') push();
    let p = piece.trimStart();
    // a single piece longer than the line: break by character
    while (measure(font, p, size) > limit) {
      let n = p.length;
      while (n > 1 && measure(font, p.slice(0, n), size) > limit) n--;
      cur = p.slice(0, n);
      push();
      p = p.slice(n);
    }
    cur = p;
  }
  if (cur !== '') push();
  return lines;
}

export interface MultiLayout {
  size: number;
  lineHeight: number;
  lines: string[];
  overflow: boolean;
}

export function layoutMulti(font: FontKey, text: string, baseSize: number, spec: MultiSpec): MultiLayout {
  const step = 0.24;
  let size = baseSize;
  for (;;) {
    const lh = spec.lineHeight * (size / baseSize);
    const maxLines = Math.max(1, Math.floor(spec.maxHeight / lh));
    const lines = wrapLines(font, text, size, spec.width - spec.firstIndent, spec.width);
    if (lines.length <= maxLines) return { size, lineHeight: lh, lines, overflow: false };
    if (size - step < baseSize * 0.62) return { size, lineHeight: lh, lines: lines.slice(0, maxLines), overflow: true };
    size -= step;
  }
}
