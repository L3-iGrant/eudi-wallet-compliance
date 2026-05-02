import type { Metadata } from 'next';
import Link from 'next/link';
import { DocsLayout } from '@/components/DocsLayout';

export const metadata: Metadata = {
  title: 'Understanding your report',
  description:
    'Pass, fail, warn, N/A: what each verdict means, how to read the gap analysis, and what to do with a failed verdict.',
  alternates: {
    canonical: '/eudi-wallet-compliance/docs/understanding-your-report/',
  },
};

export default function UnderstandingYourReport() {
  return (
    <DocsLayout
      currentSlug="understanding-your-report"
      title="Understanding your report"
      lastReviewed="2026-05-02"
    >
      <p>
        Every assessment lands you on a report page with three sections: the
        summary cards, the verdicts grouped by clause, and the gap analysis
        for higher tiers. This page explains exactly what each part means
        and what to do when something is not green.
      </p>

      <h2>The four verdicts</h2>
      <ul>
        <li>
          <strong className="text-emerald-700 dark:text-emerald-400">
            Pass
          </strong>{' '}
          - the control's check ran, the evidence satisfied it, no further
          action required for this rule.
        </li>
        <li>
          <strong className="text-red-700 dark:text-red-400">Fail</strong> -
          the check ran, the evidence violated the rule. The verdict's note
          says what specifically went wrong (e.g. "status JSON Object is
          missing the type member"). This is actionable: fix the underlying
          issue and re-run.
        </li>
        <li>
          <strong className="text-amber-700 dark:text-amber-400">Warn</strong>{' '}
          - a soft signal. The control says "should" rather than "shall", or
          the engine cannot fully judge without external data (trust list,
          notified-body cert) and surfaces a heads-up. Read the note;
          decide whether the warn is acceptable for your context.
        </li>
        <li>
          <strong className="text-zinc-500">N/A</strong> - the check skipped
          because the evidence does not apply (e.g. a status check on a
          credential without a status component) or because the control is
          not auto-tested yet. The note distinguishes the two cases.
        </li>
      </ul>

      <h2>Summary cards: what they count</h2>
      <p>
        The four cards at the top sum verdicts across the auto-tested
        controls only. Controls that are not yet auto-tested are excluded
        from the cards' counts and called out separately on the line
        "X of Y controls in scope aren't auto-tested yet". This prevents
        the N/A card from inflating with the catalogue-coverage gap.
      </p>

      <h2>Verdicts grouped by clause</h2>
      <p>
        Below the cards, every active verdict is grouped under its top-level
        clause (5.1, 5.2, 5.5, etc.) in a collapsible section. Each row
        shows:
      </p>
      <ul>
        <li>The canonical control id, linked to its catalogue page.</li>
        <li>The status pill (pass / fail / warn / na).</li>
        <li>The check's note, explaining what was evaluated.</li>
      </ul>
      <p>
        Click a control id to read the full spec text, the plain-English
        explanation, the common mistakes, and related controls.
      </p>

      <h2>Gap analysis: would this credential pass at a higher tier?</h2>
      <p>
        Below the verdicts, the gap-analysis section projects the same
        evidence to QEAA and PuB-EAA. Two complementary signals per higher
        tier:
      </p>
      <ul>
        <li>
          <strong>Would fail at this tier.</strong> Behaviour-aware: the
          engine re-runs at the higher tier and reports any control that
          fails. Captures rules whose check function changes by tier (e.g.
          the shortLived/status mutex strict at QEAA, permissive at
          Ordinary).
        </li>
        <li>
          <strong>Additionally required at <em>tier</em>.</strong>{' '}
          Catalogue-level: controls whose <code>applies_to</code> includes
          the higher tier but not your current tier, and which are not
          already passing. The "you would need to address N additional
          controls" callout.
        </li>
      </ul>
      <p>
        When both signals are clear across every higher tier, the section
        opens with a confidence-building emerald banner: "This EAA
        satisfies all controls required for QEAA and PuB-EAA tiers."
      </p>

      <h2>What to do with a fail</h2>
      <p>
        Click the failing control id to land on its catalogue page. The page
        explains the rule in plain English, lists common mistakes, and links
        to related controls. Most fails on structural rules are one-line
        fixes: a missing claim, a wrong type, a misspelt member name. After
        the fix, re-run the assessment; the verdict should flip to pass.
      </p>
      <p>
        For runtime fails (status list resolver), the verdict's note names
        the most likely causes (CORS not configured, wrong content-type,
        index out of range). Fix the upstream service, re-run.
      </p>
      <p>
        If you think a fail is wrong (the engine is misreading the spec),
        open an issue on{' '}
        <a
          href="https://github.com/L3-iGrant/eudi-wallet-compliance"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>{' '}
        with the offending compact form and the verdict; we treat accuracy
        bugs as the highest-priority class.
      </p>

      <h2>Sharing the report</h2>
      <p>
        Below the gap analysis, an email gate unlocks two downloads: a PDF
        suitable for circulating to stakeholders, and a JSON file with the
        raw{' '}
        <code>AssessmentResult</code> shape if you want to consume it from
        your own tooling. Both are produced client-side; nothing is
        uploaded.
      </p>
      <p>
        The email is stored in your browser only and used to gate the
        downloads on this device. Clearing site data removes both the
        report and the email at once. See the{' '}
        <Link href="/eudi-wallet-compliance/docs/privacy/">Privacy</Link>{' '}
        page for the full picture.
      </p>
    </DocsLayout>
  );
}
