/**
 * Cryptographically-valid SD-JWT VC reference samples for the
 * EUDI Wallet Compliance toolkit. Naming and content match the
 * ETSI EAA Plugtests SJV-EAA test cases.
 *
 *   pnpm --filter @iwc/generate-samples generate
 *
 * Writes seven sample files into packages/controls/data/reference-samples/
 * (sjv-eaa-1.json .. sjv-eaa-7.json), each with a real signed SD-JWT VC
 * compact serialisation, the disclosed payload, the signing
 * certificate in PEM form, and a list of catalogue controls the sample
 * is intended to exercise. Then runs every applicable engine check
 * against each sample and exits non-zero if any expected control fails.
 *
 * Cert and key are regenerated on each run; signatures change but
 * sample content stays stable. The engine does not verify signatures
 * yet, so committed samples remain useful as test fixtures across runs.
 */

import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import { SignJWT, exportJWK, type JWK } from 'jose';
import * as x509 from '@peculiar/x509';
import { runAssessment, type AssessmentScope, type Evidence } from '@iwc/engine';
import { loadAllControls } from '@iwc/controls';

x509.cryptoProvider.set(webcrypto as Crypto);

const here = dirname(fileURLToPath(import.meta.url));
const samplesDir = join(here, '..', '..', '..', 'packages', 'controls', 'data', 'reference-samples');

const GENERATED_BY = 'iGrant.io EAA Reference Generator v1';
const ISSUER_DID = 'https://reference-issuer.igrant.io.example';
const VCT_BASE = 'urn:igrant:eaa:reference';
const ISSUING_AUTHORITY = 'iGrant.io Reference Authority';
const NOW_SECONDS = Math.floor(Date.now() / 1000);
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

interface SampleSpec {
  id: string;
  title: string;
  description: string;
  tier: 'ordinary-eaa' | 'qeaa' | 'pub-eaa';
  exercises_controls: string[];
  /** Builds the (possibly-disclosed) payload + the disclosure list. */
  build: (ctx: BuildContext) => Promise<{
    payload: Record<string, unknown>;
    disclosures: string[];
    decodedPayload: Record<string, unknown>;
  }>;
}

interface BuildContext {
  baseClaims: Record<string, unknown>;
  cnfJwk: JWK;
  digester: typeof digest;
}

async function main() {
  console.log('Generating issuer key pair (ES256, P-256)...');
  const issuerKeyPair = (await webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair;

  console.log('Building self-signed X.509 certificate (5 years)...');
  const cert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: '01',
    name: 'CN=iGrant.io EAA Reference Issuer',
    notBefore: new Date(),
    notAfter: new Date(Date.now() + 5 * ONE_YEAR_SECONDS * 1000),
    signingAlgorithm: { name: 'ECDSA', hash: 'SHA-256' },
    keys: issuerKeyPair,
    extensions: [
      new x509.BasicConstraintsExtension(true, 0, true),
      new x509.KeyUsagesExtension(
        x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyCertSign,
        true,
      ),
    ],
  });
  const certPem = cert.toString('pem');
  const x5cEntry = bufToBase64(new Uint8Array(cert.rawData));

  // The wallet's binding key (the subject's public key, included in cnf
  // for samples that exercise key binding).
  console.log('Generating wallet binding key (ES256, P-256)...');
  const walletKeyPair = (await webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair;
  const walletJwk = await exportJWK(walletKeyPair.publicKey);
  // Strip key_ops / ext that exportJWK adds; cnf JWK should be minimal.
  const cnfJwk: JWK = {
    kty: walletJwk.kty,
    crv: walletJwk.crv,
    x: walletJwk.x,
    y: walletJwk.y,
  };

  const baseClaims = {
    iss: ISSUER_DID,
    vct: `${VCT_BASE}/v1`,
    'vct#integrity':
      'sha256-9b1d6e3c46db8a6d2f6db20cba85e9e6dbe3d8f3a4b3a4eaef2c3c4e1d8d6e7f',
    iat: NOW_SECONDS,
    nbf: NOW_SECONDS,
    exp: NOW_SECONDS + ONE_YEAR_SECONDS * 2,
    issuing_authority: ISSUING_AUTHORITY,
  };

  const ctx: BuildContext = { baseClaims, cnfJwk, digester: digest };

  const specs: SampleSpec[] = [
    sjvEaa1(),
    sjvEaa2(),
    sjvEaa3(),
    sjvEaa4(),
    sjvEaa5(),
    sjvEaa6(),
    sjvEaa7(),
  ];

  console.log(`Loading controls catalogue for self-verification...`);
  const controls = await loadAllControls();

  let anyFailed = false;
  for (const spec of specs) {
    const built = await spec.build(ctx);

    const header = {
      alg: 'ES256',
      typ: 'dc+sd-jwt',
      x5c: [x5cEntry],
    };

    const jwt = await new SignJWT(built.payload)
      .setProtectedHeader(header)
      .sign(issuerKeyPair.privateKey);

    const compactSerialisation = `${jwt}~${built.disclosures.map((d) => `${d}~`).join('')}`;

    const sampleData = {
      sample_id: spec.id,
      title: spec.title,
      description: spec.description,
      profile: 'sd-jwt-vc' as const,
      tier: spec.tier,
      compact_serialisation: compactSerialisation,
      decoded_header: header,
      decoded_payload: built.decodedPayload,
      issuer_cert_pem: certPem,
      exercises_controls: spec.exercises_controls,
      generated_by: GENERATED_BY,
      generated_at: new Date().toISOString(),
    };

    const outPath = join(samplesDir, `${spec.id}.json`);
    await writeFile(outPath, `${JSON.stringify(sampleData, null, 2)}\n`, 'utf8');
    console.log(`  wrote ${outPath}`);

    const verifyOk = await verifySample(controls, sampleData);
    if (!verifyOk) anyFailed = true;
  }

  if (anyFailed) {
    console.error('\nOne or more samples failed self-verification.');
    process.exit(1);
  }
  console.log('\nAll samples generated and self-verified.');
}

async function verifySample(
  controls: Awaited<ReturnType<typeof loadAllControls>>,
  sample: {
    sample_id: string;
    tier: 'ordinary-eaa' | 'qeaa' | 'pub-eaa';
    compact_serialisation: string;
    exercises_controls: string[];
  },
): Promise<boolean> {
  const tierForScope = sample.tier === 'ordinary-eaa' ? 'ordinary' : sample.tier;
  const scope: AssessmentScope = {
    module: 'eaa-conformance',
    profile: ['sd-jwt-vc'],
    role: ['issuer', 'verifier'],
    tier: tierForScope,
  };
  const evidence: Evidence = { eaaPayload: sample.compact_serialisation };
  const result = await runAssessment(controls, evidence, scope);
  const failed = sample.exercises_controls.filter((cid) => {
    const v = result.verdicts.find((x) => x.controlId === cid);
    return v && v.status !== 'pass' && v.status !== 'warn';
  });
  if (failed.length > 0) {
    console.error(
      `    ${sample.sample_id}: expected pass/warn for ${failed.join(', ')}; got:`,
    );
    for (const cid of failed) {
      const v = result.verdicts.find((x) => x.controlId === cid);
      console.error(`      ${cid}: ${v?.status ?? '(no verdict)'} - ${v?.notes ?? ''}`);
    }
    return false;
  }
  console.log(`    ${sample.sample_id}: ${sample.exercises_controls.length} expected controls pass/warn`);
  return true;
}

// ---- Sample specs ----

function sjvEaa1(): SampleSpec {
  return {
    id: 'sjv-eaa-1',
    title: 'SJV-EAA-1: Baseline mandatory + given_name + family_name',
    description:
      'Mandatory elements only with x5c, iss, issuing_authority, given_name, family_name. No selective disclosures. No key binding.',
    tier: 'ordinary-eaa',
    exercises_controls: [
      'EAA-5.1-01',
      'EAA-5.2.1.2-01',
      'EAA-5.2.1.2-03',
      'EAA-5.2.4.1-03',
      'EAA-5.2.7.1-01',
      'EAA-5.2.7.1-03',
    ],
    async build(ctx) {
      const payload = {
        ...ctx.baseClaims,
        given_name: 'Erika',
        family_name: 'Mustermann',
      };
      return { payload, disclosures: [], decodedPayload: payload };
    },
  };
}

function sjvEaa2(): SampleSpec {
  return {
    id: 'sjv-eaa-2',
    title: 'SJV-EAA-2: Baseline + cnf JWK',
    description:
      'Mandatory elements plus a cnf claim binding the credential to the wallet public key. No selective disclosures.',
    tier: 'ordinary-eaa',
    exercises_controls: [
      'EAA-5.1-01',
      'EAA-5.2.1.2-01',
      'EAA-5.2.1.2-03',
      'EAA-5.2.4.1-03',
      'EAA-5.2.7.1-01',
      'EAA-5.2.7.1-03',
      'EAA-5.5-01',
      'EAA-5.5-02',
    ],
    async build(ctx) {
      const payload = {
        ...ctx.baseClaims,
        given_name: 'Erika',
        family_name: 'Mustermann',
        cnf: { jwk: ctx.cnfJwk },
      };
      return { payload, disclosures: [], decodedPayload: payload };
    },
  };
}

function sjvEaa3(): SampleSpec {
  return {
    id: 'sjv-eaa-3',
    title: 'SJV-EAA-3: Baseline + selective disclosure',
    description:
      'given_name and family_name are selectively-disclosable claims. The payload carries _sd digests and _sd_alg; the disclosures are appended after the JWT in the compact serialisation.',
    tier: 'ordinary-eaa',
    exercises_controls: [
      'EAA-5.1-01',
      'EAA-5.2.1.2-01',
      'EAA-5.2.1.2-03',
      'EAA-5.2.4.1-03',
      'EAA-5.2.7.1-01',
      'EAA-5.2.7.1-03',
    ],
    async build(ctx) {
      const givenName = await disclose(ctx.digester, 'given_name', 'Erika');
      const familyName = await disclose(ctx.digester, 'family_name', 'Mustermann');
      const payload = {
        ...ctx.baseClaims,
        _sd: [givenName.digest, familyName.digest].sort(),
        _sd_alg: 'sha-256',
      };
      const decodedPayload = {
        ...ctx.baseClaims,
        given_name: 'Erika',
        family_name: 'Mustermann',
        _sd: [givenName.digest, familyName.digest].sort(),
        _sd_alg: 'sha-256',
      };
      return {
        payload,
        decodedPayload,
        disclosures: [givenName.disclosure, familyName.disclosure],
      };
    },
  };
}

function sjvEaa4(): SampleSpec {
  return {
    id: 'sjv-eaa-4',
    title: 'SJV-EAA-4: + pseudonym',
    description:
      'Carries a pseudonym claim plus key binding (cnf) and selective disclosure. The pseudonym substitutes for natural-person identifiers in attestation flows where the subject must remain unidentifiable.',
    tier: 'ordinary-eaa',
    exercises_controls: [
      'EAA-5.1-01',
      'EAA-5.2.1.2-01',
      'EAA-5.2.1.2-03',
      'EAA-5.2.4.1-03',
      'EAA-5.2.7.1-01',
      'EAA-5.2.7.1-03',
      'EAA-5.5-01',
      'EAA-5.5-02',
    ],
    async build(ctx) {
      const givenName = await disclose(ctx.digester, 'given_name', 'Erika');
      const familyName = await disclose(ctx.digester, 'family_name', 'Mustermann');
      const payload = {
        ...ctx.baseClaims,
        pseudonym: 'pn-2c4f3b1a8e7d',
        cnf: { jwk: ctx.cnfJwk },
        _sd: [givenName.digest, familyName.digest].sort(),
        _sd_alg: 'sha-256',
      };
      const decodedPayload = {
        ...ctx.baseClaims,
        pseudonym: 'pn-2c4f3b1a8e7d',
        given_name: 'Erika',
        family_name: 'Mustermann',
        cnf: { jwk: ctx.cnfJwk },
        _sd: [givenName.digest, familyName.digest].sort(),
        _sd_alg: 'sha-256',
      };
      return {
        payload,
        decodedPayload,
        disclosures: [givenName.disclosure, familyName.disclosure],
      };
    },
  };
}

function sjvEaa5(): SampleSpec {
  return {
    id: 'sjv-eaa-5',
    title: 'SJV-EAA-5: + oneTime',
    description:
      'Carries the oneTime claim (a JSON null primitive) marking the credential as single-use. Includes key binding and selective disclosure.',
    tier: 'ordinary-eaa',
    exercises_controls: [
      'EAA-5.1-01',
      'EAA-5.2.1.2-01',
      'EAA-5.2.1.2-03',
      'EAA-5.2.4.1-03',
      'EAA-5.2.7.1-01',
      'EAA-5.2.7.1-03',
      'EAA-5.5-01',
      'EAA-5.5-02',
    ],
    async build(ctx) {
      const givenName = await disclose(ctx.digester, 'given_name', 'Erika');
      const familyName = await disclose(ctx.digester, 'family_name', 'Mustermann');
      const payload = {
        ...ctx.baseClaims,
        oneTime: null,
        cnf: { jwk: ctx.cnfJwk },
        _sd: [givenName.digest, familyName.digest].sort(),
        _sd_alg: 'sha-256',
      };
      const decodedPayload = {
        ...ctx.baseClaims,
        oneTime: null,
        given_name: 'Erika',
        family_name: 'Mustermann',
        cnf: { jwk: ctx.cnfJwk },
        _sd: [givenName.digest, familyName.digest].sort(),
        _sd_alg: 'sha-256',
      };
      return {
        payload,
        decodedPayload,
        disclosures: [givenName.disclosure, familyName.disclosure],
      };
    },
  };
}

function sjvEaa6(): SampleSpec {
  return {
    id: 'sjv-eaa-6',
    title: 'SJV-EAA-6: + ShortLived',
    description:
      'Carries the shortLived claim (JSON null) declaring the credential as non-revocable and short-lived. No status component, no key-binding requirement.',
    tier: 'ordinary-eaa',
    exercises_controls: [
      'EAA-5.1-01',
      'EAA-5.2.1.2-01',
      'EAA-5.2.1.2-03',
      'EAA-5.2.4.1-03',
      'EAA-5.2.7.1-01',
      'EAA-5.2.7.1-03',
      'EAA-4.2.11.1-03',
    ],
    async build(ctx) {
      const payload = {
        ...ctx.baseClaims,
        shortLived: null,
        given_name: 'Erika',
        family_name: 'Mustermann',
      };
      return { payload, disclosures: [], decodedPayload: payload };
    },
  };
}

function sjvEaa7(): SampleSpec {
  return {
    id: 'sjv-eaa-7',
    title: 'SJV-EAA-7: + status component',
    description:
      'Carries a status claim referencing an IETF Token Status List, plus key binding. The structural status checks (5.2.10.1-*) verify the component is well-formed; the runtime resolver is only exercised against a real endpoint.',
    tier: 'ordinary-eaa',
    exercises_controls: [
      'EAA-5.1-01',
      'EAA-5.2.1.2-01',
      'EAA-5.2.1.2-03',
      'EAA-5.2.4.1-03',
      'EAA-5.2.7.1-01',
      'EAA-5.2.7.1-03',
      'EAA-5.5-01',
      'EAA-5.5-02',
      'EAA-5.2.10.1-03',
      'EAA-5.2.10.1-04',
      'EAA-5.2.10.1-06',
      'EAA-5.2.10.1-08',
      'EAA-5.2.10.1-09',
      'EAA-5.2.10.1-10',
      'EAA-5.2.10.1-11',
      'EAA-4.2.11.1-03',
    ],
    async build(ctx) {
      const payload = {
        ...ctx.baseClaims,
        given_name: 'Erika',
        family_name: 'Mustermann',
        cnf: { jwk: ctx.cnfJwk },
        status: {
          type: 'TokenStatusList',
          purpose: 'revocation',
          index: 42,
          uri: 'https://reference-issuer.igrant.io.example/status/sjv-eaa-7',
        },
      };
      return { payload, disclosures: [], decodedPayload: payload };
    },
  };
}

// ---- SD-JWT helpers ----

interface DisclosureBuild {
  disclosure: string;
  digest: string;
}

async function disclose(
  digester: typeof digest,
  claimName: string,
  claimValue: unknown,
): Promise<DisclosureBuild> {
  const saltBytes = webcrypto.getRandomValues(new Uint8Array(16));
  const salt = base64Url(saltBytes);
  const arr = [salt, claimName, claimValue];
  const json = JSON.stringify(arr);
  const disclosure = base64Url(new TextEncoder().encode(json));
  const d = await digester(disclosure);
  return { disclosure, digest: d };
}

async function digest(disclosure: string): Promise<string> {
  const bytes = await webcrypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(disclosure),
  );
  return base64Url(new Uint8Array(bytes));
}

function base64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function bufToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
