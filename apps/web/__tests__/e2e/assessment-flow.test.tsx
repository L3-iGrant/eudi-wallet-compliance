/**
 * End-to-end Self-Assessment flow.
 *
 * Walks the user from the scope picker through the upload form to the
 * report page, then captures an email and downloads the PDF and JSON.
 * Engine + storage + permissions all run for real; only the things
 * outside our control (next/navigation routing, the @react-pdf
 * rendering pipeline) are mocked.
 */

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

// The PDF library is heavy and dynamically imported. Stub it so the
// test can assert "PDF was produced" without booting up the renderer.
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

// Likewise the dynamically-imported PDF component is irrelevant to the
// flow assertions; the stubbed pdf() does not actually render it.
vi.mock('@/components/pdf/ConformanceReportPdf', () => ({
  ConformanceReportPdf: () => null,
}));

import ScopePicker from '@/app/eudi-wallet-compliance/self-assessment/page';
import UploadPage from '@/app/eudi-wallet-compliance/self-assessment/upload/page';
import ReportPage from '@/app/eudi-wallet-compliance/self-assessment/report/page';

function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

const SAMPLE_HEADER = {
  alg: 'ES256',
  kid: 'issuer-key-1',
  typ: 'vc+sd-jwt',
  x5c: ['BASE64-CERT'],
};

const SAMPLE_PAYLOAD = {
  iss: 'https://issuer.example',
  vct: 'urn:eudi:eaa:test',
  'vct#integrity': 'sha256-abc123',
  iat: 1700000000,
  nbf: 1700000000,
  exp: 1900000000,
  issuing_authority: 'Acme Authority',
  cnf: {
    jwk: { kty: 'EC', crv: 'P-256', x: 'abc-x', y: 'abc-y' },
  },
};

const SAMPLE_SDJWT = `${b64url(SAMPLE_HEADER)}.${b64url(SAMPLE_PAYLOAD)}.placeholder~`;

const createObjectURLSpy = vi.fn(() => 'blob:stub');
const revokeObjectURLSpy = vi.fn();

beforeEach(() => {
  pushMock.mockReset();
  currentSearchParams = new URLSearchParams();
  if (typeof localStorage !== 'undefined') localStorage.clear();
  Object.defineProperty(URL, 'createObjectURL', {
    value: createObjectURLSpy,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: revokeObjectURLSpy,
    writable: true,
    configurable: true,
  });
  createObjectURLSpy.mockClear();
  revokeObjectURLSpy.mockClear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

describe('Self-Assessment end-to-end flow', () => {
  it('walks scope -> upload -> report -> email gate -> downloads', async () => {
    const user = userEvent.setup();

    // ─── Scope picker ───
    render(<ScopePicker />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /EUDI Wallet Compliance Self-Assessment/i,
    );
    // Defaults are sensible (issuer, sd-jwt-vc, ordinary). Just submit.
    await user.click(screen.getByRole('button', { name: /continue/i }));

    expect(pushMock).toHaveBeenCalledTimes(1);
    const uploadUrl = new URL(pushMock.mock.calls[0][0], 'http://localhost');
    expect(uploadUrl.pathname).toBe('/eudi-wallet-compliance/self-assessment/upload/');
    expect(uploadUrl.searchParams.get('module')).toBe('eaa-conformance');
    expect(uploadUrl.searchParams.get('tier')).toBe('ordinary');
    expect(uploadUrl.searchParams.getAll('role')).toEqual(['issuer']);
    expect(uploadUrl.searchParams.getAll('profile')).toEqual(['sd-jwt-vc']);

    cleanup();
    pushMock.mockReset();

    // ─── Upload page ───
    currentSearchParams = uploadUrl.searchParams;
    render(<UploadPage />);
    expect(
      await screen.findByRole('heading', { name: /upload your evidence/i }),
    ).toBeInTheDocument();

    const payloadField = screen.getByPlaceholderText(/eyJhbGciOiJFUzI1NiI/);
    await user.click(payloadField);
    await user.paste(SAMPLE_SDJWT);

    await user.click(screen.getByRole('button', { name: /run assessment/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    const reportUrl = new URL(pushMock.mock.calls[0][0], 'http://localhost');
    expect(reportUrl.pathname).toBe(
      '/eudi-wallet-compliance/self-assessment/report/',
    );
    const reportId = reportUrl.searchParams.get('id');
    expect(reportId).toBeTruthy();

    cleanup();
    pushMock.mockReset();

    // ─── Report page ───
    currentSearchParams = new URLSearchParams({ id: reportId! });
    render(<ReportPage />);

    // Verdicts render with at least one pass; the sample carries vct,
    // iat, nbf, exp, cnf etc., so the structural checks should fire.
    const passCount = await screen.findByText('Pass');
    expect(passCount).toBeInTheDocument();
    const summarySection = passCount.parentElement!.parentElement!;
    expect(summarySection.textContent).toMatch(/Pass/);

    // The control id we know will pass (vct present) should be a link.
    expect(await screen.findByRole('link', { name: /EAA-5\.2\.1\.2-01/i })).toBeInTheDocument();

    // Download section is present and currently shows the email gate.
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.queryByTestId('download-pdf')).not.toBeInTheDocument();

    // Submit the email gate.
    await user.type(screen.getByLabelText(/email address/i), 'tester@example.com');
    await user.click(screen.getByRole('button', { name: /unlock downloads/i }));

    // After capture, the download buttons appear.
    const pdfButton = await screen.findByTestId('download-pdf');
    const jsonButton = screen.getByTestId('download-json');
    expect(pdfButton).toBeEnabled();
    expect(jsonButton).toBeEnabled();

    // ─── Download JSON ───
    let jsonBlob: Blob | null = null;
    createObjectURLSpy.mockImplementationOnce((b: Blob) => {
      jsonBlob = b;
      return 'blob:json-stub';
    });
    await user.click(jsonButton);
    await waitFor(() => expect(jsonBlob).not.toBeNull());
    expect(jsonBlob!.type).toBe('application/json');

    // ─── Download PDF ───
    let pdfBlob: Blob | null = null;
    createObjectURLSpy.mockImplementationOnce((b: Blob) => {
      pdfBlob = b;
      return 'blob:pdf-stub';
    });
    await user.click(pdfButton);
    await waitFor(() => expect(pdfBlob).not.toBeNull());
    expect(pdfBlob!.type).toBe('application/pdf');
  });
});
