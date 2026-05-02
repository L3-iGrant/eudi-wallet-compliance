import { ImageResponse } from 'next/og';

export const dynamic = 'force-static';
export const runtime = 'nodejs';
export const alt = 'EUDI Wallet Compliance · The reference toolkit by iGrant.io';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OG() {
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
          position: 'relative',
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
          iGrant.io
        </div>
        <div
          style={{
            marginTop: 32,
            color: '#09090b',
            fontSize: 84,
            fontWeight: 700,
            letterSpacing: -1.5,
            lineHeight: 1.05,
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          EUDI Wallet Compliance
        </div>
        <div
          style={{
            marginTop: 32,
            color: '#3f3f46',
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1.3,
            maxWidth: 1000,
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          The reference conformance toolkit, anchored in EUDI Wallet specs from
          ETSI, IETF, ISO, OpenID, and W3C.
        </div>
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#71717a',
            fontSize: 22,
            fontWeight: 500,
          }}
        >
          <div style={{ display: 'flex' }}>Free · Open-source · Spec-anchored</div>
          <div style={{ display: 'flex' }}>eudi-wallet-compliance.igrant.io</div>
        </div>
      </div>
    ),
    size,
  );
}
