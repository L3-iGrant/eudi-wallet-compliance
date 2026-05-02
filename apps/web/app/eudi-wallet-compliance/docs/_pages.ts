/**
 * Single source of truth for the docs sidebar, the docs index, and the
 * sitemap. Order in this array is the rendered order.
 */
export interface DocsPage {
  slug: string;
  title: string;
  /** Short blurb shown on the docs index card. */
  summary: string;
}

export const DOCS_PAGES: DocsPage[] = [
  {
    slug: 'getting-started',
    title: 'Getting started',
    summary:
      'Run your first Self-Assessment in five minutes: pick a scope, paste an EAA, read the verdict.',
  },
  {
    slug: 'evidence-types',
    title: 'Evidence types',
    summary:
      'What goes into the upload form: SD-JWT VC compact form, issuer cert, status list URL, type metadata.',
  },
  {
    slug: 'understanding-your-report',
    title: 'Understanding your report',
    summary:
      'Pass, fail, warn, N/A: what each verdict means, how to read the gap analysis, what to do next.',
  },
  {
    slug: 'methodology',
    title: 'Methodology',
    summary:
      'How the controls catalogue is maintained, which spec versions we track, what the toolkit does NOT do.',
  },
  {
    slug: 'about',
    title: 'About',
    summary:
      'Who maintains the toolkit, why we built it, where to find the source code and reach the team.',
  },
  {
    slug: 'faq',
    title: 'FAQ',
    summary:
      'Common questions: cost, privacy, accuracy, comparison to ETSI, contributions, GDPR, and more.',
  },
  {
    slug: 'privacy',
    title: 'Privacy',
    summary:
      'What we track, what we do not, and how the analytics is configured to be privacy-friendly by default.',
  },
];

export function findDocBySlug(slug: string): DocsPage | undefined {
  return DOCS_PAGES.find((p) => p.slug === slug);
}
