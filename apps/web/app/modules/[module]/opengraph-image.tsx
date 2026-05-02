import { ImageResponse } from 'next/og';
import { loadModules } from '@iwc/controls';

export const dynamic = 'force-static';
export const runtime = 'nodejs';
export const alt = 'EUDI Wallet Compliance Module';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateStaticParams() {
  const modules = await loadModules();
  return modules.map((m) => ({ module: m.id }));
}

export default async function OG({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module: moduleId } = await params;
  const modules = await loadModules();
  const m = modules.find((x) => x.id === moduleId);
  const name = m?.name ?? 'Module';
  const description = m?.short_description ?? '';
  const isShipped = m?.status === 'shipped';

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
            marginTop: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: isShipped ? '#047857' : '#71717a',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          {isShipped ? '● Live · Module' : 'In development · Module'}
        </div>
        <div
          style={{
            marginTop: 32,
            color: '#09090b',
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: -1.5,
            lineHeight: 1.05,
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: 32,
            color: '#3f3f46',
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.4,
            maxWidth: 1000,
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {description}
        </div>
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
