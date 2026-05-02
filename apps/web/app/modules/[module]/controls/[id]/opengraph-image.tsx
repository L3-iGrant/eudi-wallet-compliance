import { ImageResponse } from 'next/og';
import { loadAllControls } from '@iwc/controls';
import { controlIdToSlug, slugToControlId } from '@iwc/shared';

export const dynamic = 'force-static';
export const runtime = 'nodejs';
export const alt = 'EUDI Wallet Compliance Control';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateStaticParams() {
  const controls = await loadAllControls();
  return controls.map((c) => ({ module: c.module, id: controlIdToSlug(c.id) }));
}

export default async function OG({
  params,
}: {
  params: Promise<{ module: string; id: string }>;
}) {
  const { id } = await params;
  const controls = await loadAllControls();
  const canonicalId = slugToControlId(id, controls);
  const c = controls.find((x) => x.id === canonicalId);
  const controlId = c?.id ?? id.toUpperCase();
  const shortTitle = c?.short_title ?? '';
  const modal = c?.modal_verb ?? '';
  const clauseRef = c
    ? `${c.spec_source.document} ${c.spec_source.version} clause ${c.spec_source.clause}`
    : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #ffffff 0%, #f4f4f5 60%, #dbeafe 100%)',
          padding: '72px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#1d4ed8',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
          }}
        >
          iGrant.io · EUDI Wallet Compliance
        </div>
        <div
          style={{
            marginTop: 28,
            color: '#1d4ed8',
            fontSize: 56,
            fontWeight: 800,
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: -1,
            display: 'flex',
          }}
        >
          {controlId}
        </div>
        <div
          style={{
            marginTop: 24,
            color: '#09090b',
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: -1,
            maxWidth: 1080,
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {shortTitle}
        </div>
        {modal && (
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                background: modalColour(modal),
                color: 'white',
                padding: '6px 16px',
                borderRadius: 999,
                fontSize: 20,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 2,
                display: 'flex',
              }}
            >
              {modal}
            </div>
            <div style={{ color: '#71717a', fontSize: 22, display: 'flex' }}>
              {clauseRef}
            </div>
          </div>
        )}
        <div
          style={{
            marginTop: 'auto',
            color: '#71717a',
            fontSize: 22,
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          eudi-wallet-compliance.igrant.io
        </div>
      </div>
    ),
    size,
  );
}

function modalColour(modal: string): string {
  if (modal === 'shall') return '#b91c1c';
  if (modal === 'should') return '#b45309';
  return '#3f3f46';
}
