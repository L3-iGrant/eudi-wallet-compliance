/**
 * End-to-end mdoc upload-page flow.
 *
 * Mirrors assessment-flow.test.tsx but for the mdoc profile: pick the
 * mdoc scope, paste a base64-encoded reference fixture, confirm the
 * auto-fill helpers populate issuer cert and status URL, the docType
 * and namespace badges render, the type-metadata textarea is hidden,
 * and Run Assessment triggers the server action.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const pushMock = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => currentSearchParams,
}));

vi.mock('@react-pdf/renderer', () => ({
  pdf: () => ({
    toBlob: async () => new Blob(['stub-pdf-bytes'], { type: 'application/pdf' }),
  }),
  Document: () => null,
  Page: () => null,
  Text: () => null,
  View: () => null,
  StyleSheet: { create: <T,>(s: T): T => s },
}));

vi.mock('@/components/pdf/ConformanceReportPdf', () => ({
  ConformanceReportPdf: () => null,
}));

import ScopePicker from '@/app/eudi-wallet-compliance/self-assessment/page';
import UploadPage from '@/app/eudi-wallet-compliance/self-assessment/upload/page';

const here = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(
  here,
  '..',
  '..',
  '..',
  '..',
  'packages',
  'engine',
  'test',
  'checks',
  '__fixtures__',
  'mdl-eaa-1.cbor',
);

function loadMdocBase64(): string {
  return Buffer.from(readFileSync(FIXTURE_PATH)).toString('base64');
}

beforeEach(() => {
  pushMock.mockReset();
  currentSearchParams = new URLSearchParams();
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

describe('mdoc upload flow', () => {
  it('walks scope (mdoc) -> upload -> auto-fill -> Run Assessment', async () => {
    const user = userEvent.setup();

    // ─── Scope picker ───
    render(<ScopePicker />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /EUDI Wallet Compliance Self-Assessment/i,
    );
    // Switch profile to mdoc. The picker exposes profile checkboxes; toggle
    // off SD-JWT VC and on mdoc.
    const sdjwtCheckbox = screen.getByRole('checkbox', { name: /SD-JWT VC/i });
    if ((sdjwtCheckbox as HTMLInputElement).checked) await user.click(sdjwtCheckbox);
    const mdocCheckbox = screen.getByRole('checkbox', { name: /mdoc|ISO mdoc/i });
    if (!(mdocCheckbox as HTMLInputElement).checked) await user.click(mdocCheckbox);

    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const uploadUrl = new URL(pushMock.mock.calls[0][0], 'http://localhost');
    expect(uploadUrl.pathname).toBe('/eudi-wallet-compliance/self-assessment/upload/');
    expect(uploadUrl.searchParams.getAll('profile')).toEqual(['mdoc']);

    cleanup();
    pushMock.mockReset();

    // ─── Upload page ───
    currentSearchParams = uploadUrl.searchParams;
    render(<UploadPage />);
    expect(
      await screen.findByRole('heading', { name: /upload your evidence/i }),
    ).toBeInTheDocument();

    // Paste the base64-encoded mdoc fixture into the EAA payload field.
    const payloadField = screen.getByPlaceholderText(/eyJhbGciOiJFUzI1NiI/);
    await user.click(payloadField);
    await user.paste(loadMdocBase64());

    // The mdoc context block renders with the docType and at least one
    // namespace badge.
    const badges = await screen.findByTestId('mdoc-context-badges');
    expect(badges).toBeInTheDocument();
    const docType = screen.getByTestId('mdoc-doctype');
    expect(docType.textContent).toMatch(/eu\.europa\.ec\.eudi\.pid\.1|org\.iso/i);
    const namespaces = screen.getAllByTestId('mdoc-namespace');
    expect(namespaces.length).toBeGreaterThan(0);

    // Auto-fill should populate the status URL (the fixture carries the
    // IETF nested envelope status_list.uri).
    const statusField = screen.getByPlaceholderText(
      /https:\/\/issuer\.example\/status\/list-1/i,
    ) as HTMLInputElement;
    await waitFor(() => {
      expect(statusField.value).toMatch(/^https:\/\//);
    });
    expect(statusField.value).toContain('revocation-statuslists');

    // The fixture has no x5chain, so the issuer cert field stays empty.
    // The cert textarea is still rendered so the user can paste manually.
    const certField = screen.getByPlaceholderText(
      /-----BEGIN CERTIFICATE-----/i,
    ) as HTMLTextAreaElement;
    expect(certField.value).toBe('');

    // Type metadata textarea should NOT render for mdoc.
    expect(screen.queryByPlaceholderText(/{"vct":/i)).not.toBeInTheDocument();

    // Submit; expect a redirect to the report page.
    await user.click(screen.getByRole('button', { name: /run assessment/i }));
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    const reportUrl = new URL(pushMock.mock.calls[0][0], 'http://localhost');
    expect(reportUrl.pathname).toBe(
      '/eudi-wallet-compliance/self-assessment/report/',
    );
    expect(reportUrl.searchParams.get('id')).toBeTruthy();
  });

  it('shows the profile-mismatch warning when the pasted payload is mdoc but scope is sd-jwt-vc', async () => {
    const user = userEvent.setup();
    currentSearchParams = new URLSearchParams({
      module: 'eaa-conformance',
      role: 'issuer',
      profile: 'sd-jwt-vc',
      tier: 'ordinary',
    });
    render(<UploadPage />);
    const payloadField = screen.getByPlaceholderText(/eyJhbGciOiJFUzI1NiI/);
    await user.click(payloadField);
    await user.paste(loadMdocBase64());
    const warning = await screen.findByTestId('profile-mismatch-warning');
    expect(warning.textContent).toMatch(/looks like.*mdoc/i);
    expect(warning.textContent).toMatch(/scope.*SD-JWT VC/i);
  });
});
