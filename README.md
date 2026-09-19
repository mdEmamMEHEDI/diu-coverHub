# DIU CoverHub

Fill a DIU cover page directly on the real template and download it as a PDF (optionally merged with the student's assignment PDF).
Everything runs in the browser – no backend, no database, no login.

## Features
- Department dropdown (NFE, Software Engineering – more can be added).
- "Attach assignment (PDF)" sits under the Download button; footer shows the developer credit (edit it in the `<footer>` of `src/App.tsx`).
- Click any highlighted spot on the real cover page, or use the side form. Both stay in sync.
- Heading can be changed (Assignment / Lab Assignment / Lab Performance / Lab Report …).
- Optional: attach the assignment PDF (max 10 MB). Download = cover page + assignment as one PDF.
- Details are remembered in the browser (localStorage).

## Run in VS Code
1. Install **Node.js 20.19+** (22 LTS recommended) from https://nodejs.org
2. Open this folder in VS Code (`File > Open Folder`), then open the terminal (`Ctrl + ~`).
3. Run:
   ```bash
   npm install
   npm run dev
   ```
4. Open http://localhost:5173

Other commands: `npm run build` (production build into `dist/`), `npm run preview` (serve the build locally).

## Deploy on Vercel
**Option A – GitHub (recommended)**
1. Push this folder to a GitHub repository (`.gitignore` already excludes `node_modules` and `dist`).
2. On https://vercel.com choose **Add New > Project**, import the repository.
3. Vercel reads `vercel.json` (Vite, `npm run build`, output `dist`). Click **Deploy**.

**Option B – Vercel CLI (no GitHub)**
```bash
npm i -g vercel
vercel        # first deploy (preview)
vercel --prod # production
```
Run the command inside this folder. Vercel's web dashboard cannot take a .zip directly, so unzip first.

## How the templates stay unchanged
- `public/templates/nfe.pdf`, `swe.pdf` – the original templates with the sample/blank values removed. The final PDF is this file + the user's text drawn on top (vector, nothing is redrawn).
- `public/templates/nfe.png`, `swe.png` – a picture of the same pages, used only for the on-screen editor.
- `src/lib/templates.ts` – position (pt, from top-left), font and size of every editable spot.

## Add another department
1. Put the blank template PDF at `public/templates/<id>.pdf` and a 216-dpi PNG at `public/templates/<id>.png`
   (`pdftoppm -r 216 -png -singlefile <id>.pdf <id>`).
   If the original has sample values, remove them first so the template is blank.
2. Get the label positions with `pdftotext -bbox-layout <id>.pdf out.html` (values are in points from the top-left).
3. Add a new entry in `src/lib/templates.ts` (fields: key, label, x, baseline, width, font, size …).
4. Register it in `TEMPLATES`, `TEMPLATE_LIST` and the `TemplateId` type. The Department dropdown updates automatically.

## Fonts
`public/fonts` holds subsets of Liberation Serif Bold and Carlito (SIL Open Font License) – metric-compatible with
Times New Roman and Calibri, so typed text lines up identically in the preview and in the PDF.
Only Latin letters, digits and common punctuation can be printed.
