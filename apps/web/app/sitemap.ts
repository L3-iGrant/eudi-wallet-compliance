import type { MetadataRoute } from 'next';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import {
  loadAllControls,
  loadAllSamples,
  loadModules,
  DEFAULT_DATA_DIR,
} from '@iwc/controls';
import { controlIdToSlug } from '@iwc/shared';
import { absoluteUrl } from '@/lib/site';
import { DOCS_PAGES } from '@/app/eudi-wallet-compliance/docs/_pages';

const PROFILES = ['sd-jwt-vc', 'mdoc', 'abstract'] as const;
const ROLES = ['issuer', 'verifier', 'wallet', 'rp', 'qtsp', 'all'] as const;
const TIER_SLUGS = ['ordinary', 'qeaa', 'pub-eaa'] as const;

const here = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(here, '..', '..', '..');

/**
 * Returns the file's last commit time as an ISO string, or undefined if
 * the file is untracked or git is unavailable. Used to give crawlers a
 * meaningful lastModified per page rather than a single build-time
 * timestamp on every URL.
 */
function gitLastModified(filePath: string): Date | undefined {
  try {
    if (!existsSync(filePath)) return undefined;
    const out = execSync(`git log -1 --format=%aI -- "${filePath}"`, {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (!out) return new Date(statSync(filePath).mtimeMs);
    return new Date(out);
  } catch {
    return undefined;
  }
}

export const dynamic = 'force-static';

const BUILD_DATE = new Date();

interface Entry {
  path: string;
  lastModified?: Date;
  changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority?: number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [controls, modules, samples] = await Promise.all([
    loadAllControls(),
    loadModules(),
    loadAllSamples(),
  ]);

  const entries: Entry[] = [];

  // Hub and namespace landings
  entries.push(
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    {
      path: '/eudi-wallet-compliance/',
      priority: 0.9,
      changeFrequency: 'weekly',
    },
  );

  // Self-Assessment flow (the report page is a query-param route, not in sitemap)
  entries.push(
    {
      path: '/eudi-wallet-compliance/self-assessment/',
      priority: 0.9,
      changeFrequency: 'monthly',
    },
    {
      path: '/eudi-wallet-compliance/self-assessment/upload/',
      priority: 0.5,
      changeFrequency: 'monthly',
    },
  );

  // Documentation
  entries.push({
    path: '/eudi-wallet-compliance/docs/',
    priority: 0.7,
    changeFrequency: 'monthly',
  });
  for (const d of DOCS_PAGES) {
    entries.push({
      path: `/eudi-wallet-compliance/docs/${d.slug}/`,
      priority: 0.6,
      changeFrequency: 'monthly',
    });
  }

  // Reference samples (currently under the EAA Conformance module).
  entries.push({
    path: '/modules/eaa-conformance/reference-samples/',
    priority: 0.8,
    changeFrequency: 'monthly',
  });
  for (const s of samples) {
    const sampleFile = join(
      DEFAULT_DATA_DIR,
      'reference-samples',
      `${s.sample_id}.json`,
    );
    entries.push({
      path: `/modules/eaa-conformance/reference-samples/${s.sample_id}/`,
      lastModified: gitLastModified(sampleFile),
      priority: 0.7,
      changeFrequency: 'monthly',
    });
  }

  // Modules index, then per-module pages and their facet views
  entries.push({
    path: '/modules/',
    priority: 0.8,
    changeFrequency: 'monthly',
  });
  for (const m of modules) {
    entries.push({
      path: `/modules/${m.id}/`,
      priority: 0.8,
      changeFrequency: 'monthly',
    });
    if (m.status !== 'shipped') continue;
    entries.push({
      path: `/modules/${m.id}/controls/`,
      priority: 0.8,
      changeFrequency: 'monthly',
    });
    for (const p of PROFILES) {
      entries.push({
        path: `/modules/${m.id}/profiles/${p}/`,
        priority: 0.6,
        changeFrequency: 'monthly',
      });
    }
    for (const r of ROLES) {
      entries.push({
        path: `/modules/${m.id}/roles/${r}/`,
        priority: 0.6,
        changeFrequency: 'monthly',
      });
    }
    for (const t of TIER_SLUGS) {
      entries.push({
        path: `/modules/${m.id}/tiers/${t}/`,
        priority: 0.6,
        changeFrequency: 'monthly',
      });
    }
  }

  // Individual control pages, the SEO money pages.
  for (const c of controls) {
    const slug = controlIdToSlug(c.id);
    // Best-effort lastModified from the YAML file the control was extracted from.
    const guessed = join(
      DEFAULT_DATA_DIR,
      c.module,
      `section-${c.spec_source.clause.split('.')[0]}.yaml`,
    );
    entries.push({
      path: `/modules/${c.module}/controls/${slug}/`,
      lastModified: gitLastModified(guessed),
      priority: 0.7,
      changeFrequency: 'monthly',
    });
  }

  return entries.map((e) => ({
    url: absoluteUrl(e.path),
    lastModified: e.lastModified ?? BUILD_DATE,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
  }));
}
