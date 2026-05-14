import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { stringify as stringifyYaml } from 'yaml';
import { PDFParse } from 'pdf-parse';
import type { Control, Profile, AppliesTo, RequirementLevel } from '@iwc/controls';

interface CliArgs {
  pdf: string;
  section: number;
  output: string;
}

function parseCliArgs(): CliArgs {
  // pnpm 10 forwards the `--` separator into the script; drop it (and any
  // empty/whitespace tokens that some shells slip in) so Node's parseArgs does
  // not treat them as positionals.
  const args = process.argv
    .slice(2)
    .filter((a) => a !== '--' && a.trim() !== '');
  const { values } = parseArgs({
    args,
    options: {
      pdf: { type: 'string' },
      section: { type: 'string' },
      output: { type: 'string' },
    },
    allowPositionals: false,
  });
  if (!values.pdf || !values.section || !values.output) {
    throw new Error('Usage: extract --pdf <path> --section <number> --output <path>');
  }
  const sectionNum = Number(values.section);
  if (!Number.isInteger(sectionNum) || sectionNum < 1) {
    throw new Error(`Invalid --section value: ${values.section}`);
  }
  return { pdf: values.pdf, section: sectionNum, output: values.output };
}

interface ExtractedDocument {
  text: string;
  pageStarts: number[];
}

async function extractPdfText(pdfPath: string): Promise<ExtractedDocument> {
  const buffer = await readFile(pdfPath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const pageStarts: number[] = [];
    let combinedText = '';
    for (const page of result.pages) {
      pageStarts.push(combinedText.length);
      combinedText += page.text + '\n';
    }
    return { text: combinedText, pageStarts };
  } finally {
    await parser.destroy();
  }
}

function offsetToPage(pageStarts: number[], offset: number): number {
  let page = 1;
  for (let i = 0; i < pageStarts.length; i++) {
    const start = pageStarts[i];
    if (start === undefined) break;
    if (offset >= start) page = i + 1;
    else break;
  }
  return page;
}

interface SectionSlice {
  text: string;
  startOffset: number;
}

function findSection(fullText: string, sectionNum: number): SectionSlice {
  const startRe = new RegExp(
    `(?<=^|\\s)${sectionNum}\\s+[A-Z][A-Za-z][A-Za-z0-9()/\\-]*(?:\\s+[A-Za-z0-9()/\\-]+){0,15}`,
    'g',
  );
  const endRe = new RegExp(
    `(?<=^|\\s)${sectionNum + 1}\\s+[A-Z][A-Za-z][A-Za-z0-9()/\\-]*(?:\\s+[A-Za-z0-9()/\\-]+){0,15}`,
    'g',
  );

  const startMatches = [...fullText.matchAll(startRe)];
  if (startMatches.length === 0) {
    throw new Error(`Could not find section ${sectionNum} heading in the PDF text`);
  }
  // Heuristic: TOC entries appear first; the LAST match is the actual content heading.
  const startMatch = startMatches[startMatches.length - 1]!;
  const startOffset = startMatch.index ?? 0;

  const endMatches = [...fullText.matchAll(endRe)];
  const endMatch = endMatches.find((m) => (m.index ?? 0) > startOffset);
  const endOffset = endMatch?.index ?? fullText.length;

  return { text: fullText.slice(startOffset, endOffset), startOffset };
}

const ID_REGEX = /(?<=^|\s)((?:EAA|QEAA|PuB-EAA)-[\d.]+(?:-\d+)?):\s+/g;
const SUBHEADING_REGEX = /^\d+\.\d+(?:\.\d+)*\s+[A-Z]/m;

function profileForSection(sectionNum: number): Profile[] {
  // Clause 4 ("Semantics of EAA") is cross-cutting; tag both concrete
  // profiles so the rule fires on any concrete-profile assessment.
  if (sectionNum === 4) return ['sd-jwt-vc', 'mdoc'];
  if (sectionNum === 5) return ['sd-jwt-vc'];
  if (sectionNum === 6) return ['mdoc'];
  return ['sd-jwt-vc', 'mdoc'];
}

function appliesToForId(id: string): AppliesTo[] {
  if (id.startsWith('PuB-EAA-')) return ['pub-eaa'];
  if (id.startsWith('QEAA-')) return ['qeaa'];
  if (id.startsWith('EAA-')) return ['ordinary-eaa'];
  return ['all'];
}

function clauseFromId(id: string): string {
  const withoutPrefix = id.replace(/^(?:PuB-EAA|QEAA|EAA)-/, '');
  return withoutPrefix.replace(/-\d+$/, '');
}

function detectRequirementLevel(text: string): RequirementLevel {
  const m = /\b(shall|should|may)\b/i.exec(text);
  if (!m || !m[1]) return 'shall';
  return m[1].toLowerCase() as RequirementLevel;
}

function buildShortTitle(specText: string, fallback: string): string {
  const normalised = specText.replace(/\s+/g, ' ').trim();
  if (normalised.length < 5) return fallback;
  if (normalised.length <= 80) return normalised;
  const truncated = normalised.slice(0, 80);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace >= 5 ? truncated.slice(0, lastSpace).trim() : truncated.trim();
}

interface IdMatch {
  id: string;
  matchStart: number;
  bodyStart: number;
}

function findIdMatches(sectionText: string): IdMatch[] {
  const out: IdMatch[] = [];
  for (const m of sectionText.matchAll(ID_REGEX)) {
    if (!m[1] || m.index === undefined) continue;
    out.push({
      id: m[1],
      matchStart: m.index,
      bodyStart: m.index + m[0].length,
    });
  }
  return out;
}

function buildDraftControl(
  match: IdMatch,
  nextStart: number,
  sectionText: string,
  sectionAbsoluteStart: number,
  pageStarts: number[],
  sectionNum: number,
): Control {
  const rawBody = sectionText.slice(match.bodyStart, nextStart);
  const subHeading = SUBHEADING_REGEX.exec(rawBody);
  const trimmedBody = (subHeading ? rawBody.slice(0, subHeading.index) : rawBody)
    .replace(/\s+/g, ' ')
    .trim();

  const absoluteOffset = sectionAbsoluteStart + match.matchStart;
  const page = offsetToPage(pageStarts, absoluteOffset);

  return {
    id: match.id,
    module: 'eaa-conformance',
    spec_source: {
      document: 'ETSI TS 119 472-1',
      version: 'v1.2.1',
      clause: clauseFromId(match.id),
      page,
    },
    requirement_level: detectRequirementLevel(trimmedBody),
    applies_to: appliesToForId(match.id),
    profile: profileForSection(sectionNum),
    role: ['issuer', 'verifier'],
    evidence_type: ['eaa-payload'],
    short_title: buildShortTitle(trimmedBody, match.id),
    spec_text: trimmedBody,
    plain_english: 'TODO: hand-write this explanation',
    common_mistakes: [],
    related_controls: [],
  };
}

async function main(): Promise<void> {
  const args = parseCliArgs();
  const pdfPath = resolve(process.cwd(), args.pdf);
  const outputPath = resolve(process.cwd(), args.output);

  const { text, pageStarts } = await extractPdfText(pdfPath);
  const { text: sectionText, startOffset: sectionStart } = findSection(text, args.section);

  const matches = findIdMatches(sectionText);
  if (matches.length === 0) {
    throw new Error(
      `Found section ${args.section} (length ${sectionText.length} chars) but no normative IDs matching the regex`,
    );
  }

  const controls: Control[] = matches.map((m, i) => {
    const next = matches[i + 1];
    const nextStart = next ? next.matchStart : sectionText.length;
    return buildDraftControl(m, nextStart, sectionText, sectionStart, pageStarts, args.section);
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, stringifyYaml(controls), 'utf8');
  console.log(`Section ${args.section}: extracted ${controls.length} draft controls to ${outputPath}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
