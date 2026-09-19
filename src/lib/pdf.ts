import { PAGE_H, resolve, type TemplateDef, type Values } from './templates';
import { fitSingle, layoutMulti, measure, type FontKey } from './text';

const FONT_URL: Record<FontKey, string> = {
  'serif-bold': '/fonts/serif-bold.ttf',
  'sans-bold': '/fonts/sans-bold.ttf',
  'sans-regular': '/fonts/sans-regular.ttf',
};

async function bytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url}`);
  return res.arrayBuffer();
}

/** Draws the user's text on top of the untouched template page and returns the PDF bytes. */
export async function buildPdf(t: TemplateDef, values: Values, assignment?: ArrayBuffer): Promise<Uint8Array> {
  const [{ PDFDocument, rgb }, fontkitMod] = await Promise.all([import('pdf-lib'), import('@pdf-lib/fontkit')]);
  const fontkit = (fontkitMod as unknown as { default: never }).default ?? (fontkitMod as unknown as never);

  const doc = await PDFDocument.load(await bytes(t.pdf));
  doc.registerFontkit(fontkit);
  const page = doc.getPages()[0];

  const used = Array.from(new Set(t.fields.map((f) => f.font)));
  const fonts = {} as Record<FontKey, Awaited<ReturnType<typeof doc.embedFont>>>;
  await Promise.all(
    used.map(async (k) => {
      fonts[k] = await doc.embedFont(await bytes(FONT_URL[k]), { subset: true });
    }),
  );

  const black = rgb(0, 0, 0);

  for (const def of t.fields) {
    const value = resolve(t, values, def).replace(/\s+/g, ' ').trim();
    if (!value) continue;
    const font = fonts[def.font];

    if (def.multi) {
      const lay = layoutMulti(def.font, value, def.size, def.multi);
      lay.lines.forEach((line, i) => {
        const first = i === 0;
        const x0 = def.multi!.x + (first ? def.multi!.firstIndent : 0);
        const avail = def.multi!.width - (first ? def.multi!.firstIndent : 0);
        const y = PAGE_H - (def.baseline + i * lay.lineHeight);
        const last = i === lay.lines.length - 1;
        const words = line.split(' ');
        if (last || words.length < 2) {
          page.drawText(line, { x: x0, y, size: lay.size, font, color: black });
          return;
        }
        // justify: spread the spare width over the gaps between words
        const wordsW = words.reduce((a, w) => a + measure(def.font, w, lay.size), 0);
        const gap = (avail - wordsW) / (words.length - 1);
        let x = x0;
        for (const w of words) {
          page.drawText(w, { x, y, size: lay.size, font, color: black });
          x += measure(def.font, w, lay.size) + gap;
        }
      });
      continue;
    }

    const fit = fitSingle(def.font, value, def.size, def.width);
    const x = def.align === 'center' ? def.x + (def.width - fit.width) / 2 : def.x;
    page.drawText(value, { x, y: PAGE_H - def.baseline, size: fit.size, font, color: black });
  }

  // append the student's assignment after the cover page
  if (assignment) {
    const src = await PDFDocument.load(assignment.slice(0));
    const pages = await doc.copyPages(src, src.getPageIndices());
    pages.forEach((pg) => doc.addPage(pg));
  }

  doc.setTitle(assignment ? `${t.name} cover page + assignment` : `${t.name} cover page`);
  doc.setProducer('DIU CoverHub');
  return doc.save();
}

type ClaudeHost = { use?: (name: string) => Promise<{ save: (r: { filename: string; data: Blob }) => Promise<unknown> } | null> };

/**
 * Saves the PDF. Inside the claude.ai artifact viewer the host's "downloads" capability is used
 * (plain <a download> is blocked there); on a normal website (Vercel) a regular browser download is used.
 * Returns false when the viewer declined the save.
 */
export async function downloadBytes(data: Uint8Array, filename: string): Promise<boolean> {
  const blob = new Blob([data as BlobPart], { type: 'application/pdf' });
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (host?.use) {
    const dl = await host.use('downloads').catch(() => null);
    if (dl) {
      try {
        await dl.save({ filename, data: blob });
        return true;
      } catch (e) {
        if ((e as { code?: string })?.code === 'declined') return false;
        throw e;
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return true;
}

export const MAX_ASSIGNMENT_BYTES = 10 * 1024 * 1024;

export interface AssignmentFile {
  name: string;
  size: number;
  pages: number;
  data: ArrayBuffer;
}

/** Validates an uploaded file (PDF, max 10 MB, readable, not password protected). Throws a user-readable Error. */
export async function readAssignment(file: File): Promise<AssignmentFile> {
  if (file.size > MAX_ASSIGNMENT_BYTES) throw new Error('This file is larger than 10 MB. Please compress it and try again.');
  const data = await file.arrayBuffer();
  const head = new TextDecoder('latin1').decode(new Uint8Array(data.slice(0, 1024)));
  if (!head.includes('%PDF-')) throw new Error('Only PDF files can be attached. Export your assignment as a PDF first.');
  const { PDFDocument } = await import('pdf-lib');
  try {
    const doc = await PDFDocument.load(data.slice(0));
    const pages = doc.getPageCount();
    if (pages < 1) throw new Error('empty');
    return { name: file.name, size: file.size, pages, data };
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (/encrypt/i.test(msg)) throw new Error('This PDF is password-protected. Remove the password and upload it again.');
    throw new Error('This PDF could not be read. Try re-saving / re-exporting it as a PDF.');
  }
}
