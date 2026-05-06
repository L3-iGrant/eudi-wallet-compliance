/**
 * Reference mdoc samples for the EUDI Wallet Compliance toolkit.
 * Each sample is a fully-decoded JSON record carrying the base64-encoded
 * CBOR plus the parsed protected header / MSO / namespaces, generated
 * by encoding distinct mdoc structures with cbor-x.
 *
 *   pnpm --filter @iwc/generate-samples generate:mdoc
 *
 * Cryptographic posture: signatures are placeholder bytes (the engine
 * does not verify mdoc signatures yet, parallel to the SD-JWT VC
 * posture). The signing certificate is a self-signed dev cert
 * regenerated on each run; sample CBOR bytes change between runs but
 * sample content (docType, namespaces, MSO members) stays stable.
 *
 * Five samples are emitted:
 *
 *   mdl-eaa-1: mDL baseline (no status, no shortLived, no x5chain).
 *   mdl-eaa-2: mDL with TokenStatusList in MSO.status (flat ETSI shape).
 *   mdl-eaa-3: non-mDL using ISO/IEC 23220-2 namespace, with category
 *              data element (non-qualified, non-public-body).
 *   mdl-eaa-4: mdoc QEAA with category urn:etsi:esi:eaa:eu:qualified.
 *   mdl-eaa-5: mdoc PuB-EAA with shortLived = true.
 */

import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import { Encoder, Tag } from 'cbor-x';
import * as x509 from '@peculiar/x509';

x509.cryptoProvider.set(webcrypto as Crypto);

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(here, '..', '..', '..', 'packages', 'controls', 'data', 'reference-samples');

const MDL_DOC_TYPE = 'org.iso.18013.5.1.mDL';
const NS_MDL = 'org.iso.18013.5.1';
const NS_ISO_23220 = 'org.iso.23220.1';
const NS_ETSI = 'org.etsi.01947201.010101';

const encoder = new Encoder({ mapsAsObjects: true, useRecords: false });

// ─── CBOR builders ─────────────────────────────────────────────────────

interface Item {
  digestID: number;
  elementIdentifier: string;
  elementValue: unknown;
}

function encodeIssuerSignedItem(item: Item): Tag {
  const inner = encoder.encode({
    random: new Uint8Array(16),
    digestID: item.digestID,
    elementValue: item.elementValue,
    elementIdentifier: item.elementIdentifier,
  });
  return new Tag(inner, 24);
}

function tdate(d: Date): Tag {
  // tag(0) tdate per RFC 8949: a CBOR tstr containing an ISO 8601
  // datetime in UTC with seconds precision and no fractional part.
  return new Tag(d.toISOString().replace(/\.\d{3}Z$/, 'Z'), 0);
}

interface BuildOpts {
  docType: string;
  primaryNs: string;
  items: Item[];
  etsiItems?: Item[];
  validFrom: Date;
  validUntil: Date;
  status?: Record<string, unknown>;
  x5chainBytes?: Uint8Array;
}

function buildMdocBytes(opts: BuildOpts): {
  bytes: Uint8Array;
  decodedProtectedHeader: Record<string, unknown>;
  decodedMso: Record<string, unknown>;
  decodedNamespaces: Record<string, Array<Record<string, unknown>>>;
} {
  // nameSpaces
  const nameSpaces: Record<string, Tag[]> = {};
  nameSpaces[opts.primaryNs] = opts.items.map(encodeIssuerSignedItem);
  if (opts.etsiItems && opts.etsiItems.length > 0) {
    nameSpaces[NS_ETSI] = opts.etsiItems.map(encodeIssuerSignedItem);
  }

  // valueDigests: placeholder digests (the engine does not currently
  // verify the digest binding to the disclosed elementValue).
  const valueDigests: Record<string, Record<number, Uint8Array>> = {};
  const primaryDigests: Record<number, Uint8Array> = {};
  for (const it of opts.items) primaryDigests[it.digestID] = new Uint8Array(32);
  valueDigests[opts.primaryNs] = primaryDigests;
  if (opts.etsiItems) {
    const etsiDigests: Record<number, Uint8Array> = {};
    for (const it of opts.etsiItems) etsiDigests[it.digestID] = new Uint8Array(32);
    valueDigests[NS_ETSI] = etsiDigests;
  }

  const deviceKey = {
    1: 2, // kty: EC2
    '-1': 1, // crv: P-256
    '-2': new Uint8Array(32), // x
    '-3': new Uint8Array(32), // y
  };

  const mso: Record<string, unknown> = {
    version: '1.0',
    digestAlgorithm: 'SHA-256',
    valueDigests,
    deviceKeyInfo: { deviceKey },
    docType: opts.docType,
    validityInfo: {
      signed: tdate(opts.validFrom),
      validFrom: tdate(opts.validFrom),
      validUntil: tdate(opts.validUntil),
    },
  };
  if (opts.status) mso.status = opts.status;

  // tag(24) wrap MSO bytes inside the COSE payload bstr.
  const msoInnerBytes = encoder.encode(mso);
  const payloadBstr = encoder.encode(new Tag(msoInnerBytes, 24));

  // Protected header. Numeric-looking string keys round-trip cleanly
  // through the parser (which reads `header['1']`, `header['33']`).
  const protectedHeaderObj: Record<string, unknown> = { '1': -7 };
  if (opts.x5chainBytes) protectedHeaderObj['33'] = [opts.x5chainBytes];
  const protectedBstr = encoder.encode(protectedHeaderObj);

  // COSE_Sign1: [protected_bstr, unprotected_map, payload_bstr, signature_bstr].
  const issuerAuth = [
    protectedBstr,
    {},
    payloadBstr,
    new Uint8Array(64), // placeholder signature
  ];

  const bytes = encoder.encode({ nameSpaces, issuerAuth });

  // Decoded views for the JSON sample file. Use plain JS shapes: byte
  // strings become arrays of unsigned integers so the JSON round-trips
  // through the schema's plain-record validation.
  const decodedNamespaces: Record<string, Array<Record<string, unknown>>> = {};
  decodedNamespaces[opts.primaryNs] = opts.items.map((i) => ({
    digestID: i.digestID,
    elementIdentifier: i.elementIdentifier,
    elementValue: i.elementValue,
  }));
  if (opts.etsiItems) {
    decodedNamespaces[NS_ETSI] = opts.etsiItems.map((i) => ({
      digestID: i.digestID,
      elementIdentifier: i.elementIdentifier,
      elementValue: i.elementValue,
    }));
  }

  const decodedMso: Record<string, unknown> = {
    version: mso.version,
    digestAlgorithm: mso.digestAlgorithm,
    docType: mso.docType,
    validityInfo: {
      signed: opts.validFrom.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      validFrom: opts.validFrom.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      validUntil: opts.validUntil.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    },
    valueDigests: '<32-byte digests per element; bytes elided>',
    deviceKeyInfo: '<COSE_Key (P-256, placeholder coordinates)>',
  };
  if (opts.status) decodedMso.status = opts.status;

  const decodedProtectedHeader: Record<string, unknown> = { alg: 'ES256' };
  if (opts.x5chainBytes) {
    decodedProtectedHeader.x5chain = `<1 cert, ${opts.x5chainBytes.length} bytes>`;
  }

  return { bytes, decodedProtectedHeader, decodedMso, decodedNamespaces };
}

// ─── X.509 cert + key for x5chain on QEAA / PuB-EAA samples ────────────

async function generateDevCert(): Promise<{ pem: string; der: Uint8Array }> {
  const keys = await webcrypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  );
  const cert = await x509.X509CertificateGenerator.createSelfSigned({
    serialNumber: '01',
    name: 'CN=iGrant.io mdoc Reference Issuer, O=iGrant.io, C=SE',
    notBefore: new Date('2026-01-01T00:00:00Z'),
    notAfter: new Date('2031-01-01T00:00:00Z'),
    signingAlgorithm: { name: 'ECDSA', hash: 'SHA-256' },
    keys,
    extensions: [
      new x509.BasicConstraintsExtension(true, 0, true),
      new x509.KeyUsagesExtension(
        x509.KeyUsageFlags.digitalSignature | x509.KeyUsageFlags.keyCertSign,
        true,
      ),
    ],
  });
  return { pem: cert.toString('pem'), der: new Uint8Array(cert.rawData) };
}

// ─── Sample definitions ────────────────────────────────────────────────

interface SampleSpec {
  sample_id: string;
  title: string;
  description: string;
  tier: 'ordinary-eaa' | 'qeaa' | 'pub-eaa';
  exercises_controls: string[];
  build: (cert: { pem: string; der: Uint8Array }) => ReturnType<typeof buildMdocBytes>;
}

const sampleSpecs: SampleSpec[] = [
  {
    sample_id: 'mdl-eaa-1',
    title: 'MDL-EAA-1: mDL baseline',
    description:
      'Baseline mDL (org.iso.18013.5.1.mDL) carrying the standard subject identifier triplet plus document_number, issuing_authority and issue_date. No status, no shortLived, no x5chain.',
    tier: 'ordinary-eaa',
    exercises_controls: [
      'EAA-6.1-01',
      'EAA-6.1-02',
      'EAA-6.1-07',
      'EAA-6.2.3-01',
      'EAA-6.2.3-03',
      'EAA-6.2.4.1-01',
      'EAA-6.2.5.1-01',
      'EAA-6.2.5.1-02',
      'EAA-6.2.6-01',
      'EAA-6.2.7.1-01',
    ],
    build: () =>
      buildMdocBytes({
        docType: MDL_DOC_TYPE,
        primaryNs: NS_MDL,
        items: [
          { digestID: 0, elementIdentifier: 'given_name', elementValue: 'Erika' },
          { digestID: 1, elementIdentifier: 'family_name', elementValue: 'Mustermann' },
          { digestID: 2, elementIdentifier: 'document_number', elementValue: 'MDL-0001' },
          { digestID: 3, elementIdentifier: 'issuing_authority', elementValue: 'iGrant.io Reference Authority' },
          { digestID: 4, elementIdentifier: 'issue_date', elementValue: '2026-01-01' },
          { digestID: 5, elementIdentifier: 'expiry_date', elementValue: '2031-01-01' },
        ],
        validFrom: new Date('2026-01-01T00:00:00Z'),
        validUntil: new Date('2031-01-01T00:00:00Z'),
      }),
  },
  {
    sample_id: 'mdl-eaa-2',
    title: 'MDL-EAA-2: mDL with TokenStatusList (flat ETSI shape)',
    description:
      'mDL carrying a status component implementing the ETSI flat shape: type=TokenStatusList, purpose=revocation, index, uri.',
    tier: 'ordinary-eaa',
    exercises_controls: [
      'EAA-6.1-02',
      'EAA-6.2.10.1-01',
      'EAA-6.2.10.1-04',
      'EAA-6.2.10.1-06',
      'EAA-6.2.10.1-08',
      'EAA-6.2.10.1-10',
    ],
    build: () =>
      buildMdocBytes({
        docType: MDL_DOC_TYPE,
        primaryNs: NS_MDL,
        items: [
          { digestID: 0, elementIdentifier: 'given_name', elementValue: 'Erika' },
          { digestID: 1, elementIdentifier: 'family_name', elementValue: 'Mustermann' },
          { digestID: 2, elementIdentifier: 'document_number', elementValue: 'MDL-0002' },
          { digestID: 3, elementIdentifier: 'issuing_authority', elementValue: 'iGrant.io Reference Authority' },
          { digestID: 4, elementIdentifier: 'issue_date', elementValue: '2026-01-01' },
        ],
        validFrom: new Date('2026-01-01T00:00:00Z'),
        validUntil: new Date('2031-01-01T00:00:00Z'),
        status: {
          type: 'TokenStatusList',
          purpose: 'revocation',
          index: 2,
          uri: 'https://reference-issuer.igrant.io.example/status/mdl-eaa-2',
        },
      }),
  },
  {
    sample_id: 'mdl-eaa-3',
    title: 'MDL-EAA-3: non-mDL with category data element',
    description:
      'Non-mDL credential using the ISO/IEC 23220-2 namespace, plus a category data element in the ETSI namespace flagging the credential as non-qualified, non-public-body.',
    tier: 'ordinary-eaa',
    exercises_controls: [
      'EAA-6.1-03',
      'EAA-6.2.2.1-01',
      'EAA-6.2.2.1-03',
      'EAA-6.2.3-01',
      'EAA-6.2.3-04',
      'EAA-6.2.4.1-03',
    ],
    build: () =>
      buildMdocBytes({
        docType: 'org.example.test.v1',
        primaryNs: NS_ISO_23220,
        items: [
          { digestID: 0, elementIdentifier: 'given_name', elementValue: 'Anna' },
          { digestID: 1, elementIdentifier: 'family_name', elementValue: 'Smith' },
          { digestID: 2, elementIdentifier: 'document_number', elementValue: 'EAA-0003' },
          { digestID: 3, elementIdentifier: 'issuing_authority_unicode', elementValue: 'Acme Authority' },
          { digestID: 4, elementIdentifier: 'issue_date', elementValue: '2026-01-01' },
        ],
        etsiItems: [
          { digestID: 0, elementIdentifier: 'category', elementValue: 'urn:example:eaa:category:internal' },
        ],
        validFrom: new Date('2026-01-01T00:00:00Z'),
        validUntil: new Date('2031-01-01T00:00:00Z'),
      }),
  },
  {
    sample_id: 'mdl-eaa-4',
    title: 'MDL-EAA-4: mdoc QEAA with qualified URN',
    description:
      'Non-mDL credential at the QEAA tier with category=urn:etsi:esi:eaa:eu:qualified, status carried in MSO, and the issuer cert in the COSE x5chain header parameter.',
    tier: 'qeaa',
    exercises_controls: [
      'EAA-6.1-03',
      'QEAA-6.2.2.2-01',
      'QEAA-6.2.2.2-02',
      'QEAA-6.2.10.2-01',
      'QEAA-6.6.2-04',
    ],
    build: (cert) =>
      buildMdocBytes({
        docType: 'org.example.qeaa.v1',
        primaryNs: NS_ISO_23220,
        items: [
          { digestID: 0, elementIdentifier: 'given_name', elementValue: 'Beatriz' },
          { digestID: 1, elementIdentifier: 'family_name', elementValue: 'Costa' },
          { digestID: 2, elementIdentifier: 'document_number', elementValue: 'QEAA-0004' },
          { digestID: 3, elementIdentifier: 'issuing_authority_unicode', elementValue: 'Reference QTSP' },
          { digestID: 4, elementIdentifier: 'issue_date', elementValue: '2026-01-01' },
        ],
        etsiItems: [
          { digestID: 0, elementIdentifier: 'category', elementValue: 'urn:etsi:esi:eaa:eu:qualified' },
        ],
        validFrom: new Date('2026-01-01T00:00:00Z'),
        validUntil: new Date('2031-01-01T00:00:00Z'),
        status: {
          type: 'TokenStatusList',
          purpose: 'revocation',
          index: 4,
          uri: 'https://reference-issuer.igrant.io.example/status/qeaa-4',
        },
        x5chainBytes: cert.der,
      }),
  },
  {
    sample_id: 'mdl-eaa-5',
    title: 'MDL-EAA-5: mdoc PuB-EAA with shortLived',
    description:
      'Non-mDL credential at the PuB-EAA tier with category=urn:etsi:esi:eaa:eu:pub and shortLived=true (so revocation status is not required).',
    tier: 'pub-eaa',
    exercises_controls: [
      'EAA-6.1-03',
      'PuB-EAA-6.2.2.3-01',
      'PuB-EAA-6.2.2.3-02',
      'PuB-EAA-6.2.10.3-01',
      'EAA-6.2.12-01',
      'EAA-6.2.12-03',
      'EAA-6.2.12-04',
      'PuB-EAA-6.6.3-04',
    ],
    build: (cert) =>
      buildMdocBytes({
        docType: 'org.example.pubeaa.v1',
        primaryNs: NS_ISO_23220,
        items: [
          { digestID: 0, elementIdentifier: 'given_name', elementValue: 'Carlos' },
          { digestID: 1, elementIdentifier: 'family_name', elementValue: 'Rivera' },
          { digestID: 2, elementIdentifier: 'document_number', elementValue: 'PUB-0005' },
          { digestID: 3, elementIdentifier: 'issuing_authority_unicode', elementValue: 'Reference Civil Registry' },
          { digestID: 4, elementIdentifier: 'issue_date', elementValue: '2026-01-01' },
        ],
        etsiItems: [
          { digestID: 0, elementIdentifier: 'category', elementValue: 'urn:etsi:esi:eaa:eu:pub' },
          { digestID: 1, elementIdentifier: 'shortLived', elementValue: true },
        ],
        validFrom: new Date('2026-01-01T00:00:00Z'),
        validUntil: new Date('2026-02-01T00:00:00Z'),
        x5chainBytes: cert.der,
      }),
  },
];

// ─── Driver ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cert = await generateDevCert();
  const generatedAt = new Date().toISOString();
  for (const spec of sampleSpecs) {
    const built = spec.build(cert);
    const sample = {
      sample_id: spec.sample_id,
      title: spec.title,
      description: spec.description,
      profile: 'mdoc' as const,
      tier: spec.tier,
      cbor_base64: Buffer.from(built.bytes).toString('base64'),
      decoded_protected_header: built.decodedProtectedHeader,
      decoded_mso: built.decodedMso,
      decoded_namespaces: built.decodedNamespaces,
      issuer_cert_pem: cert.pem,
      exercises_controls: spec.exercises_controls,
      generated_by: 'iGrant.io mdoc Reference Generator (cbor-x, placeholder signatures)',
      generated_at: generatedAt,
    };
    const out = join(OUT_DIR, `${spec.sample_id}.json`);
    await writeFile(out, JSON.stringify(sample, null, 2));
    console.log(`wrote ${out}`);
  }
}

await main();
