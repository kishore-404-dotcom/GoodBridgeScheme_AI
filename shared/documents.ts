import type { Scheme } from './types';

/**
 * Document check: maps a scheme's official document list (free text from myScheme) onto the
 * common documents a citizen can say they hold, so the eligibility report can show what is
 * ready, what is missing and how ready the citizen is to apply.
 *
 * The citizen declares the documents they have; nothing is uploaded or stored on a server.
 */

export type DocumentTypeId =
  | 'aadhaar' | 'bank' | 'photo' | 'income' | 'caste' | 'residence' | 'ration' | 'age'
  | 'education' | 'land' | 'disability' | 'otherId' | 'workerId' | 'marriage' | 'medical';

/** Order shown in the wizard: most common first */
export const DOCUMENT_TYPES: DocumentTypeId[] = [
  'aadhaar', 'bank', 'photo', 'income', 'residence', 'caste', 'ration', 'age',
  'education', 'otherId', 'land', 'workerId', 'disability', 'medical', 'marriage'
];

const PATTERNS: [DocumentTypeId, RegExp][] = [
  ['aadhaar', /aa?dh?aa?r|\buid\b|\buidai\b/i],
  ['bank', /bank|pass ?book|cheque|\bifsc|account (details|number|no)|\ba\/c\b/i],
  ['photo', /photo/i],
  ['income', /income|salary slip|\bitr\b|form[- ]?16/i],
  ['caste', /caste|category certificate|community certificate|tribe certificate|\b(sc|st|obc)\b.*certificate|certificate.*\b(sc|st|obc)\b/i],
  ['residence', /domicile|residen|address|native|nativity|ration card.*address/i],
  ['ration', /ration|\bbpl\b|below poverty|antyodaya|\bnfsa\b|\bphh\b/i],
  ['age', /birth|age proof|proof of age|date of birth|\bdob\b|age certificate/i],
  ['education', /mark ?sheet|marks? (card|memo|statement)|grade sheet|class ?(x|xii|10|12)|\b(10th|12th|xth|xiith)\b|matric|degree|diploma|admission|bona ?fide|fee (receipt|structure)|school|college|institut|education|qualification|leaving certificate|transfer certificate|enrol?ment|hall ticket|student/i],
  ['land', /\bland|khata|khatauni|khasra|patta|\b7\/12\b|\brtc\b|record of rights|\bror\b|jamabandi|chitta|adangal|revenue receipt|lease deed|survey number/i],
  ['disability', /disab|\budid\b|handicap|divyang|pwd/i],
  ['otherId', /voter|epic|\bpan\b|passport(?![- ]?(size|sized))|driving licen[cs]e|identity|identification|\bid proof|id card(?!.*(labour|worker|bocw))/i],
  ['workerId', /labour card|labou?r (id|registration)|bocw|construction worker|e-?shram|job card|nrega|worker'?s? (id|card|registration)|artisan (id|card)|pehchan card|fisher(man|men)?('s)? (id|card)|farmer'?s? (id|registration)|beneficiary card/i],
  ['marriage', /marriage|wedding/i],
  ['medical', /medical (certificate|report|board)|doctor|civil surgeon|hospital|fitness certificate|treatment|disease/i]
];

/** Lines that are not documents: notes, section headings, contact details, catch-alls */
const NOT_A_DOCUMENT = /^(note|n\.?b\.?|\*|>|\(?[a-z0-9]\)\s*$)|:-?\s*$|documents such as|list of documents|following documents|any other|as (may be )?required|as per (the )?requirement|^e-?mail|mobile (number|no)|phone number|contact number|^\s*$|^do not|no documents (are )?required|should not be|of the above|(application|submission|selection) stage|^(pre|post)-|^(during|upon|after) (the )?(application|selection|disbursement)/i;
const OPTIONAL = /if applicable|as applicable|if any\b|optional|wherever applicable|where applicable|if required|in case of|in case the|if the applicant|if he|if she|if you|\(if /i;

export interface DocumentLine {
  /** Official text as published */
  text: string;
  /** Common document types that satisfy this line (any one of them) */
  types: DocumentTypeId[];
  optional: boolean;
}

/** Classifies one official document line; null for notes, headings and contact details */
export const classifyDocument = (text: string): DocumentLine | null => {
  const clean = text.replace(/&amp;#39;|&#39;/g, "'").trim();
  if (clean.length < 3 || NOT_A_DOCUMENT.test(clean)) return null;
  let types = PATTERNS.filter(([, re]) => re.test(clean)).map(([id]) => id);
  // "Passport-size photograph" is a photo, not an identity document
  if (types.includes('photo')) types = types.filter((t) => t !== 'otherId');
  // Aadhaar mentioned alongside other IDs means any of them is accepted
  return { text: clean, types, optional: OPTIONAL.test(clean) };
};

export interface DocumentCheck {
  /** Required lines the citizen has a matching document for */
  ready: DocumentLine[];
  /** Required lines the citizen does not have yet */
  missing: DocumentLine[];
  /** Optional ("if applicable") lines, not counted */
  optional: DocumentLine[];
  /** Scheme-specific documents the check cannot match to a common type (shown to prepare) */
  other: DocumentLine[];
  /** Share of the countable required documents the citizen holds, 0-100; null when nothing is countable */
  readiness: number | null;
}

/** Compares a scheme's official document list with the documents the citizen holds */
export const checkDocuments = (scheme: Pick<Scheme, 'documentsRequired'>, held: string[]): DocumentCheck => {
  const have = new Set(held);
  const result: DocumentCheck = { ready: [], missing: [], optional: [], other: [], readiness: null };
  const seen = new Set<string>();
  for (const raw of scheme.documentsRequired || []) {
    const line = classifyDocument(raw);
    if (!line) continue;
    if (line.optional) { result.optional.push(line); continue; }
    if (!line.types.length) { result.other.push(line); continue; }
    // The same document listed twice (e.g. "Aadhaar Card" and "Copy of Aadhaar card") counts once
    const key = [...line.types].sort().join('+');
    if (seen.has(key)) continue;
    seen.add(key);
    (line.types.some((t) => have.has(t)) ? result.ready : result.missing).push(line);
  }
  const countable = result.ready.length + result.missing.length;
  result.readiness = countable ? Math.round((result.ready.length / countable) * 100) : null;
  return result;
};

/** Weight of documents in the overall match: eligibility decides, documents show readiness to apply */
export const DOCUMENT_WEIGHT = 0.3;

/** Overall match = 70% eligibility + 30% documents ready (eligibility alone when nothing is countable) */
export const overallMatch = (eligibilityPct: number, readiness: number | null): number =>
  readiness === null ? eligibilityPct : Math.round(eligibilityPct * (1 - DOCUMENT_WEIGHT) + readiness * DOCUMENT_WEIGHT);
