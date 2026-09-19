import type { FontKey, MultiSpec } from './text';

export const PAGE_W = 612;
export const PAGE_H = 792;

export type TemplateId = 'nfe' | 'swe';
export type Group = 'Document' | 'Student' | 'Course' | 'Teacher' | 'Submission';

export interface FieldDef {
  key: string;
  label: string;
  placeholder: string;
  group: Group;
  /** left edge of the input box on the page (pt, origin top-left) */
  x: number;
  /** text baseline (pt from the top of the page) */
  baseline: number;
  /** width available for the text (pt) */
  width: number;
  font: FontKey;
  size: number;
  align?: 'left' | 'center';
  required?: boolean;
  /** copied to the other template when it is still empty there */
  shared?: boolean;
  /** text that is already on the original template – user can change it */
  defaultValue?: string;
  /** shows the value of another field until the user types here */
  followKey?: string;
  /** not listed in the side form, only editable on the page */
  pageOnly?: boolean;
  presets?: string[];
  date?: boolean;
  multi?: MultiSpec;
}

export interface TemplateDef {
  id: TemplateId;
  short: string;
  name: string;
  description: string;
  pdf: string;
  image: string;
  fileTag: string;
  fields: FieldDef[];
}

const year = new Date().getFullYear();

/* ------------------------------------------------------------------ */
/*  NFE  –  Department of Nutrition and Food Engineering               */
/*  Coordinates are read from the original PDF (points, top-left).     */
/* ------------------------------------------------------------------ */
const nfe: TemplateDef = {
  id: 'nfe',
  short: 'NFE',
  name: 'Nutrition & Food Engineering',
  description: 'Assignment / lab cover with evaluation table',
  pdf: '/templates/nfe.pdf',
  image: '/templates/nfe.png',
  fileTag: 'NFE',
  fields: [
    {
      key: 'docTitle', label: 'Heading (Assignment / Lab …)', placeholder: 'Assignment', group: 'Document',
      x: 156, width: 300, baseline: 112.94, font: 'serif-bold', size: 18.96, align: 'center',
      defaultValue: 'Assignment',
      presets: ['Assignment', 'Lab Assignment', 'Lab Performance', 'Lab Report'],
    },
    {
      key: 'rowTitle', label: 'Table row heading', placeholder: 'Assignment', group: 'Document',
      x: 99.76, width: 435, baseline: 399.41, font: 'serif-bold', size: 12.96, align: 'center',
      followKey: 'docTitle', pageOnly: true,
    },
    {
      key: 'courseCode', label: 'Course Code', placeholder: 'code', group: 'Course',
      x: 153.61, width: 75, baseline: 139.46, font: 'serif-bold', size: 12.96, required: true, shared: true,
    },
    {
      key: 'courseTitle', label: 'Course Title', placeholder: 'course title', group: 'Course',
      x: 307.95, width: 251, baseline: 139.46, font: 'serif-bold', size: 12.96, required: true,
    },
    {
      key: 'topic', label: 'Title / Topic', placeholder: 'assignment title or topic', group: 'Course',
      x: 77.664, width: 479.1, baseline: 162.26, font: 'serif-bold', size: 12.96,
      multi: { x: 77.664, width: 479.1, firstIndent: 73.08, lineHeight: 15, maxHeight: 43 },
    },
    {
      key: 'submissionDate', label: 'Date of Submission', placeholder: 'dd-mm-yyyy', group: 'Submission',
      x: 192.05, width: 250, baseline: 521.95, font: 'serif-bold', size: 12.96, shared: true, date: true,
    },
    {
      key: 'semester', label: 'Semester', placeholder: 'semester', group: 'Student',
      x: 123.98, width: 72, baseline: 602.5, font: 'sans-bold', size: 10.56,
      presets: ['Spring', 'Summer', 'Fall'],
    },
    {
      key: 'year', label: 'Year', placeholder: 'year', group: 'Student',
      x: 223.25, width: 96, baseline: 602.5, font: 'sans-bold', size: 10.56, presets: [String(year)],
    },
    {
      key: 'levelTerm', label: 'Level-Term', placeholder: 'L1,T1', group: 'Student',
      x: 375.07, width: 68, baseline: 602.5, font: 'sans-bold', size: 10.56,
    },
    {
      key: 'section', label: 'Section', placeholder: 'section', group: 'Student',
      x: 481.66, width: 78, baseline: 602.5, font: 'sans-bold', size: 10.56, shared: true,
    },
    {
      key: 'studentName', label: 'Student Name', placeholder: 'your name', group: 'Student',
      x: 106.65, width: 197, baseline: 659.86, font: 'sans-bold', size: 10.56, required: true, shared: true,
    },
    {
      key: 'studentId', label: 'Student ID', placeholder: '000-00-000', group: 'Student',
      x: 127.07, width: 177, baseline: 679.06, font: 'sans-bold', size: 10.56, required: true, shared: true,
    },
    {
      key: 'teacherName', label: 'Teacher Name', placeholder: 'teacher name', group: 'Teacher',
      x: 311.45, width: 247, baseline: 659.86, font: 'sans-bold', size: 10.56, required: true, shared: true,
    },
    {
      key: 'designation', label: 'Teacher Designation', placeholder: 'designation', group: 'Teacher',
      x: 311.45, width: 247, baseline: 672.58, font: 'sans-bold', size: 10.56, shared: true,
      presets: ['Lecturer', 'Senior Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor'],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  SWE  –  Department of Software Engineering                         */
/* ------------------------------------------------------------------ */

const swe: TemplateDef = {
  id: 'swe',
  short: 'SWE',
  name: 'Software Engineering',
  description: 'Course assignment report with teacher rubric',
  pdf: '/templates/swe.pdf',
  image: '/templates/swe.png',
  fileTag: 'SWE',
  fields: [
    {
      key: 'docTitle', label: 'Heading (Course Assignment / Lab …)', placeholder: 'Course Assignment Report', group: 'Document',
      x: 100, width: 412, baseline: 165.2, font: 'sans-regular', size: 27, align: 'center',
      defaultValue: 'Course Assignment Report',
      presets: ['Course Assignment Report', 'Lab Assignment Report', 'Lab Performance Report', 'Lab Report'],
    },
    {
      key: 'semester', label: 'Semester', placeholder: 'e.g. Spring 2026', group: 'Student',
      x: 152.5, width: 387.5, baseline: 546.14, font: 'serif-bold', size: 18,
      defaultValue: 'Spring ………..  / Fall ………',
      presets: [`Spring ${year}`, `Summer ${year}`, `Fall ${year}`],
    },
    {
      key: 'studentName', label: 'Student Name', placeholder: 'your name', group: 'Student',
      x: 165.4, width: 374.6, baseline: 572.77, font: 'serif-bold', size: 14, required: true, shared: true,
    },
    {
      key: 'studentId', label: 'Student ID', placeholder: '000-00-000', group: 'Student',
      x: 146, width: 394, baseline: 598.17, font: 'serif-bold', size: 14, required: true, shared: true,
    },
    {
      key: 'batch', label: 'Batch', placeholder: 'batch', group: 'Student',
      x: 115.2, width: 132, baseline: 623.47, font: 'serif-bold', size: 14,
    },
    {
      key: 'section', label: 'Section', placeholder: 'section', group: 'Student',
      x: 303.8, width: 236, baseline: 623.47, font: 'serif-bold', size: 14, shared: true,
    },
    {
      key: 'courseCode', label: 'Course Code', placeholder: 'code', group: 'Course',
      x: 157.6, width: 90, baseline: 648.87, font: 'serif-bold', size: 14, required: true, shared: true,
    },
    {
      key: 'courseName', label: 'Course Name', placeholder: 'course name', group: 'Course',
      x: 341.5, width: 198.5, baseline: 648.87, font: 'serif-bold', size: 14, required: true,
    },
    {
      key: 'teacherName', label: 'Course Teacher Name', placeholder: 'teacher name', group: 'Teacher',
      x: 213.9, width: 326, baseline: 699.57, font: 'serif-bold', size: 14, required: true, shared: true,
    },
    {
      key: 'designation', label: 'Designation', placeholder: 'designation', group: 'Teacher',
      x: 151, width: 389, baseline: 724.87, font: 'serif-bold', size: 14, shared: true,
      presets: ['Lecturer', 'Senior Lecturer', 'Assistant Professor', 'Associate Professor', 'Professor'],
    },
    {
      key: 'submissionDate', label: 'Submission Date', placeholder: 'dd-mm-yyyy', group: 'Submission',
      x: 180.2, width: 359.8, baseline: 750.27, font: 'serif-bold', size: 14, shared: true, date: true,
    },
  ],
};

export const TEMPLATES: Record<TemplateId, TemplateDef> = { nfe, swe };
export const TEMPLATE_LIST: TemplateDef[] = [nfe, swe];
export const GROUP_ORDER: Group[] = ['Document', 'Student', 'Course', 'Teacher', 'Submission'];

export type Values = Record<string, string>;

/** Value shown on the page for a field (typed value → followed field → template default). */
export function resolve(t: TemplateDef, values: Values, def: FieldDef): string {
  const v = values[def.key];
  if (v !== undefined) return v;
  if (def.followKey) {
    const f = t.fields.find((x) => x.key === def.followKey);
    if (f) return resolve(t, values, f);
  }
  return def.defaultValue ?? '';
}
