/**
 * Consolidated test suite for the §6 mdoc check pack (Phase 7 Prompt 4).
 *
 * Per-check coverage in one file: an SD-JWT-VC-evidence case asserting
 * `na` (the kind guard), a positive case built from the MDL-EAA-1
 * fixture (or a mutated variant), and at least one negative case where
 * the rule is structurally testable.
 *
 * Mutators (`with*`) clone the parsed mdoc and apply a focused change so
 * a single fixture can drive both positive and negative paths without
 * re-encoding CBOR.
 */

import { describe, it, expect } from 'vitest';
import type { ParsedMdoc, IssuerSignedItem } from '@iwc/shared';
import {
  DEFAULT_MDOC_SCOPE,
  asMdocEvidence,
  asSdJwtVcEvidence,
  loadMdocFixture,
  runCheckParsed,
} from './helpers';
import { MDL_DOC_TYPE, NS_MDL, NS_ISO_23220, NS_ETSI } from '../../src/checks/_mdoc';

// Per-check imports.
import { check as check_6_1_01 } from '../../src/checks/eaa-6-1-01';
import { check as check_6_1_02 } from '../../src/checks/eaa-6-1-02';
import { check as check_6_1_03 } from '../../src/checks/eaa-6-1-03';
import { check as check_6_1_04 } from '../../src/checks/eaa-6-1-04';
import { check as check_6_1_05 } from '../../src/checks/eaa-6-1-05';
import { check as check_6_1_06 } from '../../src/checks/eaa-6-1-06';
import { check as check_6_1_07 } from '../../src/checks/eaa-6-1-07';
import { check as check_6_1_08 } from '../../src/checks/eaa-6-1-08';
import { check as check_6_2_2_1_01 } from '../../src/checks/eaa-6-2-2-1-01';
import { check as check_6_2_2_1_02 } from '../../src/checks/eaa-6-2-2-1-02';
import { check as check_6_2_2_1_03 } from '../../src/checks/eaa-6-2-2-1-03';
import { check as check_qeaa_6_2_2_2_01 } from '../../src/checks/qeaa-6-2-2-2-01';
import { check as check_qeaa_6_2_2_2_02 } from '../../src/checks/qeaa-6-2-2-2-02';
import { check as check_pub_6_2_2_3_01 } from '../../src/checks/pub-eaa-6-2-2-3-01';
import { check as check_pub_6_2_2_3_02 } from '../../src/checks/pub-eaa-6-2-2-3-02';
import { check as check_6_2_3_01 } from '../../src/checks/eaa-6-2-3-01';
import { check as check_6_2_3_02 } from '../../src/checks/eaa-6-2-3-02';
import { check as check_6_2_3_03 } from '../../src/checks/eaa-6-2-3-03';
import { check as check_6_2_3_04 } from '../../src/checks/eaa-6-2-3-04';
import { check as check_6_2_4_1_01 } from '../../src/checks/eaa-6-2-4-1-01';
import { check as check_6_2_4_1_02 } from '../../src/checks/eaa-6-2-4-1-02';
import { check as check_6_2_4_1_03 } from '../../src/checks/eaa-6-2-4-1-03';
import { check as check_6_2_4_1_04 } from '../../src/checks/eaa-6-2-4-1-04';
import { check as check_6_2_4_1_05 } from '../../src/checks/eaa-6-2-4-1-05';
import { check as check_6_2_4_1_06 } from '../../src/checks/eaa-6-2-4-1-06';
import { check as check_6_2_4_1_07 } from '../../src/checks/eaa-6-2-4-1-07';
import { check as check_6_2_4_1_08 } from '../../src/checks/eaa-6-2-4-1-08';
import { check as check_6_2_4_1_09 } from '../../src/checks/eaa-6-2-4-1-09';
import { check as check_6_2_4_1_10 } from '../../src/checks/eaa-6-2-4-1-10';
import { check as check_6_2_4_1_11 } from '../../src/checks/eaa-6-2-4-1-11';
import { check as check_6_2_4_1_12 } from '../../src/checks/eaa-6-2-4-1-12';
import { check as check_6_2_4_1_13 } from '../../src/checks/eaa-6-2-4-1-13';
import { check as check_qeaa_6_2_4_2_01 } from '../../src/checks/qeaa-6-2-4-2-01';
import { check as check_qeaa_6_2_4_2_02 } from '../../src/checks/qeaa-6-2-4-2-02';
import { check as check_pub_6_2_4_3_01 } from '../../src/checks/pub-eaa-6-2-4-3-01';
import { check as check_pub_6_2_4_3_02 } from '../../src/checks/pub-eaa-6-2-4-3-02';

// §6.2.5 to §6.2.9 (Phase 7 Prompt 5)
import { check as check_6_2_5_1_01 } from '../../src/checks/eaa-6-2-5-1-01';
import { check as check_6_2_5_1_02 } from '../../src/checks/eaa-6-2-5-1-02';
import { check as check_6_2_5_1_03 } from '../../src/checks/eaa-6-2-5-1-03';
import { check as check_6_2_5_1_04 } from '../../src/checks/eaa-6-2-5-1-04';
import { check as check_6_2_5_1_05 } from '../../src/checks/eaa-6-2-5-1-05';
import { check as check_6_2_5_2_01 } from '../../src/checks/eaa-6-2-5-2-01';
import { check as check_6_2_5_3_01 } from '../../src/checks/eaa-6-2-5-3-01';
import { check as check_6_2_5_3_02 } from '../../src/checks/eaa-6-2-5-3-02';
import { check as check_6_2_5_3_03 } from '../../src/checks/eaa-6-2-5-3-03';
import { check as check_6_2_5_4_01 } from '../../src/checks/eaa-6-2-5-4-01';
import { check as check_6_2_5_4_02 } from '../../src/checks/eaa-6-2-5-4-02';
import { check as check_qeaa_6_2_5_5_01 } from '../../src/checks/qeaa-6-2-5-5-01';
import { check as check_pub_6_2_5_6_01 } from '../../src/checks/pub-eaa-6-2-5-6-01';
import { check as check_6_2_6_01 } from '../../src/checks/eaa-6-2-6-01';
import { check as check_6_2_6_02 } from '../../src/checks/eaa-6-2-6-02';
import { check as check_6_2_6_03 } from '../../src/checks/eaa-6-2-6-03';
import { check as check_6_2_6_04 } from '../../src/checks/eaa-6-2-6-04';
import { check as check_6_2_7_1_01 } from '../../src/checks/eaa-6-2-7-1-01';
import { check as check_6_2_7_1_02 } from '../../src/checks/eaa-6-2-7-1-02';
import { check as check_6_2_7_1_03 } from '../../src/checks/eaa-6-2-7-1-03';
import { check as check_6_2_7_1_04 } from '../../src/checks/eaa-6-2-7-1-04';
import { check as check_6_2_7_1_05 } from '../../src/checks/eaa-6-2-7-1-05';
import { check as check_6_2_7_2_01 } from '../../src/checks/eaa-6-2-7-2-01';
import { check as check_6_2_7_2_02 } from '../../src/checks/eaa-6-2-7-2-02';
import { check as check_6_2_7_2_03 } from '../../src/checks/eaa-6-2-7-2-03';
import { check as check_6_2_8_1_01 } from '../../src/checks/eaa-6-2-8-1-01';
import { check as check_6_2_8_2_01 } from '../../src/checks/eaa-6-2-8-2-01';
import { check as check_6_2_8_2_02 } from '../../src/checks/eaa-6-2-8-2-02';
import { check as check_6_2_8_2_03 } from '../../src/checks/eaa-6-2-8-2-03';
import { check as check_6_2_8_2_04 } from '../../src/checks/eaa-6-2-8-2-04';
import { check as check_6_2_8_2_05 } from '../../src/checks/eaa-6-2-8-2-05';
import { check as check_6_2_9_01 } from '../../src/checks/eaa-6-2-9-01';

// ─── Mutators ─────────────────────────────────────────────────────────────

function clone(parsed: ParsedMdoc): ParsedMdoc {
  // Shallow clone is sufficient: tests overwrite specific top-level paths
  // and never mutate the cloned references.
  return {
    ...parsed,
    nameSpaces: Object.fromEntries(
      Object.entries(parsed.nameSpaces).map(([ns, items]) => [ns, [...items]]),
    ),
    issuerAuth: {
      ...parsed.issuerAuth,
      protectedHeader: { ...parsed.issuerAuth.protectedHeader },
      mso: {
        ...parsed.issuerAuth.mso,
        validityInfo: { ...parsed.issuerAuth.mso.validityInfo },
      },
    },
  };
}

function withDocType(parsed: ParsedMdoc, docType: string): ParsedMdoc {
  const out = clone(parsed);
  out.docType = docType;
  out.issuerAuth.mso.docType = docType;
  return out;
}

function withRenamedNs(
  parsed: ParsedMdoc,
  oldNs: string,
  newNs: string,
): ParsedMdoc {
  const out = clone(parsed);
  if (out.nameSpaces[oldNs]) {
    out.nameSpaces[newNs] = out.nameSpaces[oldNs];
    delete out.nameSpaces[oldNs];
  }
  return out;
}

function withAddedNs(
  parsed: ParsedMdoc,
  ns: string,
  items: IssuerSignedItem[] = [],
): ParsedMdoc {
  const out = clone(parsed);
  out.nameSpaces[ns] = items;
  return out;
}

function withRemovedNs(parsed: ParsedMdoc, ns: string): ParsedMdoc {
  const out = clone(parsed);
  delete out.nameSpaces[ns];
  return out;
}

function withItem(
  parsed: ParsedMdoc,
  ns: string,
  identifier: string,
  value: unknown,
): ParsedMdoc {
  const out = clone(parsed);
  const items = out.nameSpaces[ns] ?? [];
  const filtered = items.filter((i) => i.elementIdentifier !== identifier);
  filtered.push({
    digestID: filtered.length,
    random: new Uint8Array(16),
    elementIdentifier: identifier,
    elementValue: value,
  });
  out.nameSpaces[ns] = filtered;
  return out;
}

function withoutItem(
  parsed: ParsedMdoc,
  ns: string,
  identifier: string,
): ParsedMdoc {
  const out = clone(parsed);
  const items = out.nameSpaces[ns];
  if (!items) return out;
  out.nameSpaces[ns] = items.filter((i) => i.elementIdentifier !== identifier);
  return out;
}

function withX5chain(parsed: ParsedMdoc, chain: Uint8Array[] | undefined): ParsedMdoc {
  const out = clone(parsed);
  if (chain === undefined) {
    delete out.issuerAuth.protectedHeader.x5chain;
  } else {
    out.issuerAuth.protectedHeader.x5chain = chain;
  }
  return out;
}

function withValidity(
  parsed: ParsedMdoc,
  validFrom: Date,
  validUntil: Date,
): ParsedMdoc {
  const out = clone(parsed);
  out.issuerAuth.mso.validityInfo = {
    ...out.issuerAuth.mso.validityInfo,
    validFrom,
    validUntil,
  };
  return out;
}

// Build a synthetic non-mDL fixture with the canonical 23220-2 namespace
// and the standard subject triplet, used as the "happy path" for several
// non-mDL rules.
function asConformantNonMdl(parsed: ParsedMdoc): ParsedMdoc {
  let out = withDocType(parsed, 'org.example.test.v1');
  // Move whatever real namespace the fixture happens to carry into the
  // canonical 23220-2 namespace, then top up the standard subject
  // identifiers and the issuer's identity component.
  const sourceNs = Object.keys(out.nameSpaces).find(
    (ns) => ns !== NS_ETSI && ns !== NS_MDL && ns !== NS_ISO_23220,
  );
  if (sourceNs) {
    out = withRenamedNs(out, sourceNs, NS_ISO_23220);
  } else if (!out.nameSpaces[NS_ISO_23220]) {
    out = withAddedNs(out, NS_ISO_23220);
  }
  out = withItem(out, NS_ISO_23220, 'document_number', 'DOC-123');
  out = withItem(out, NS_ISO_23220, 'issuing_authority_unicode', 'Authority');
  out = withItem(out, NS_ISO_23220, 'given_name', 'Alex');
  out = withItem(out, NS_ISO_23220, 'family_name', 'Example');
  return out;
}

function asConformantMdl(parsed: ParsedMdoc): ParsedMdoc {
  let out = withDocType(parsed, MDL_DOC_TYPE);
  const sourceNs = Object.keys(out.nameSpaces).find(
    (ns) => ns !== NS_ETSI && ns !== NS_MDL && ns !== NS_ISO_23220,
  );
  if (sourceNs) {
    out = withRenamedNs(out, sourceNs, NS_MDL);
  } else if (!out.nameSpaces[NS_MDL]) {
    out = withAddedNs(out, NS_MDL);
  }
  out = withItem(out, NS_MDL, 'document_number', 'MDL-123');
  out = withItem(out, NS_MDL, 'issuing_authority', 'mDL Authority');
  out = withItem(out, NS_MDL, 'given_name', 'Alex');
  out = withItem(out, NS_MDL, 'family_name', 'Example');
  return out;
}

// ─── Section 6.1 ──────────────────────────────────────────────────────────

describe('§6.1 General requirements', () => {
  it('EAA-6.1-01 passes for any mdoc payload, na for SD-JWT VC', async () => {
    const parsed = await loadMdocFixture();
    const mdoc = await runCheckParsed(check_6_1_01, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(mdoc.status).toBe('pass');
    const sdjwt = await runCheckParsed(check_6_1_01, await asSdJwtVcEvidence(), DEFAULT_MDOC_SCOPE);
    expect(sdjwt.status).toBe('na');
  });

  it('EAA-6.1-02 passes when mDL has the 18013-5 namespace', async () => {
    const parsed = await loadMdocFixture();
    const mdl = asConformantMdl(parsed);
    const ok = await runCheckParsed(check_6_1_02, asMdocEvidence(mdl), DEFAULT_MDOC_SCOPE);
    expect(ok.status).toBe('pass');
  });

  it('EAA-6.1-02 fails when mDL is missing the 18013-5 namespace', async () => {
    const parsed = await loadMdocFixture();
    const mdl = withRemovedNs(asConformantMdl(parsed), NS_MDL);
    const fail = await runCheckParsed(check_6_1_02, asMdocEvidence(mdl), DEFAULT_MDOC_SCOPE);
    expect(fail.status).toBe('fail');
  });

  it('EAA-6.1-02 returns na for non-mDL', async () => {
    const parsed = await loadMdocFixture();
    const non = asConformantNonMdl(parsed);
    const v = await runCheckParsed(check_6_1_02, asMdocEvidence(non), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });

  it('EAA-6.1-03 passes when non-mDL has the 23220-2 namespace', async () => {
    const parsed = await loadMdocFixture();
    const non = asConformantNonMdl(parsed);
    const ok = await runCheckParsed(check_6_1_03, asMdocEvidence(non), DEFAULT_MDOC_SCOPE);
    expect(ok.status).toBe('pass');
  });

  it('EAA-6.1-03 fails when non-mDL is missing the 23220-2 namespace', async () => {
    const parsed = await loadMdocFixture();
    // The raw fixture is non-mDL with a non-23220-2 namespace; serves as
    // the negative case.
    const fail = await runCheckParsed(check_6_1_03, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(fail.status).toBe('fail');
  });

  it('EAA-6.1-04 fails when an org.etsi-prefixed but non-canonical namespace is present', async () => {
    const parsed = await loadMdocFixture();
    const broken = withAddedNs(parsed, 'org.etsi.something-else.v1');
    const fail = await runCheckParsed(check_6_1_04, asMdocEvidence(broken), DEFAULT_MDOC_SCOPE);
    expect(fail.status).toBe('fail');
  });

  it('EAA-6.1-04 passes when no non-canonical ETSI namespaces are present', async () => {
    const parsed = await loadMdocFixture();
    const ok = await runCheckParsed(check_6_1_04, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(ok.status).toBe('pass');
  });

  it.each([
    ['EAA-6.1-05', check_6_1_05],
    ['EAA-6.1-06', check_6_1_06],
    ['EAA-6.1-08', check_6_1_08],
  ] as const)('%s returns na (deferred) on mdoc evidence', async (_, check) => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });

  it('EAA-6.1-07 passes for parsed mdoc evidence', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_1_07, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it.each([
    ['EAA-6.1-01', check_6_1_01],
    ['EAA-6.1-02', check_6_1_02],
    ['EAA-6.1-03', check_6_1_03],
    ['EAA-6.1-04', check_6_1_04],
    ['EAA-6.1-05', check_6_1_05],
    ['EAA-6.1-06', check_6_1_06],
    ['EAA-6.1-07', check_6_1_07],
    ['EAA-6.1-08', check_6_1_08],
  ] as const)('%s returns na for SD-JWT VC evidence', async (_, check) => {
    const v = await runCheckParsed(check, await asSdJwtVcEvidence(), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });
});

// ─── Section 6.2.2 EAA category ───────────────────────────────────────────

describe('§6.2.2 EAA category', () => {
  it('EAA-6.2.2.1-01 warns when category is present at ordinary tier', async () => {
    const parsed = await loadMdocFixture();
    const evil = withItem(parsed, NS_ETSI, 'category', 'urn:etsi:esi:eaa:eu:qualified');
    const v = await runCheckParsed(check_6_2_2_1_01, asMdocEvidence(evil), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('warn');
  });

  it('EAA-6.2.2.1-01 passes when category is absent at ordinary tier', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_2_1_01, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.2.1-03 fails when category is not a string', async () => {
    const parsed = await loadMdocFixture();
    const broken = withItem(parsed, NS_ETSI, 'category', 42);
    const v = await runCheckParsed(check_6_2_2_1_03, asMdocEvidence(broken), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.2.1-03 passes when category is a tstr', async () => {
    const parsed = await loadMdocFixture();
    const ok = withItem(parsed, NS_ETSI, 'category', 'urn:etsi:esi:eaa:eu:qualified');
    const v = await runCheckParsed(check_6_2_2_1_03, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.2.1-02 returns na (semantic) when category is absent', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_2_1_02, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });

  it('QEAA-6.2.2.2-01 fails at QEAA scope when category is absent', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_qeaa_6_2_2_2_01, asMdocEvidence(parsed), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'qeaa',
    });
    expect(v.status).toBe('fail');
  });

  it('QEAA-6.2.2.2-01 passes at QEAA scope when category is present', async () => {
    const parsed = await loadMdocFixture();
    const ok = withItem(parsed, NS_ETSI, 'category', 'urn:etsi:esi:eaa:eu:qualified');
    const v = await runCheckParsed(check_qeaa_6_2_2_2_01, asMdocEvidence(ok), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'qeaa',
    });
    expect(v.status).toBe('pass');
  });

  it('QEAA-6.2.2.2-01 is na at non-QEAA scope', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_qeaa_6_2_2_2_01, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });

  it('QEAA-6.2.2.2-02 fails when QEAA category value is wrong', async () => {
    const parsed = await loadMdocFixture();
    const wrong = withItem(parsed, NS_ETSI, 'category', 'urn:wrong');
    const v = await runCheckParsed(check_qeaa_6_2_2_2_02, asMdocEvidence(wrong), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'qeaa',
    });
    expect(v.status).toBe('fail');
  });

  it('QEAA-6.2.2.2-02 passes with the qualified URN', async () => {
    const parsed = await loadMdocFixture();
    const ok = withItem(parsed, NS_ETSI, 'category', 'urn:etsi:esi:eaa:eu:qualified');
    const v = await runCheckParsed(check_qeaa_6_2_2_2_02, asMdocEvidence(ok), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'qeaa',
    });
    expect(v.status).toBe('pass');
  });

  it('PuB-EAA-6.2.2.3-01 fails at PuB-EAA scope when category is absent', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_pub_6_2_2_3_01, asMdocEvidence(parsed), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'pub-eaa',
    });
    expect(v.status).toBe('fail');
  });

  it('PuB-EAA-6.2.2.3-02 fails when PuB-EAA category value is wrong', async () => {
    const parsed = await loadMdocFixture();
    const wrong = withItem(parsed, NS_ETSI, 'category', 'urn:wrong');
    const v = await runCheckParsed(check_pub_6_2_2_3_02, asMdocEvidence(wrong), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'pub-eaa',
    });
    expect(v.status).toBe('fail');
  });

  it('PuB-EAA-6.2.2.3-02 passes with the public-body URN', async () => {
    const parsed = await loadMdocFixture();
    const ok = withItem(parsed, NS_ETSI, 'category', 'urn:etsi:esi:eaa:eu:pub');
    const v = await runCheckParsed(check_pub_6_2_2_3_02, asMdocEvidence(ok), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'pub-eaa',
    });
    expect(v.status).toBe('pass');
  });

  it.each([
    ['EAA-6.2.2.1-01', check_6_2_2_1_01],
    ['EAA-6.2.2.1-02', check_6_2_2_1_02],
    ['EAA-6.2.2.1-03', check_6_2_2_1_03],
    ['QEAA-6.2.2.2-01', check_qeaa_6_2_2_2_01],
    ['QEAA-6.2.2.2-02', check_qeaa_6_2_2_2_02],
    ['PuB-EAA-6.2.2.3-01', check_pub_6_2_2_3_01],
    ['PuB-EAA-6.2.2.3-02', check_pub_6_2_2_3_02],
  ] as const)('%s returns na for SD-JWT VC evidence', async (_, check) => {
    const v = await runCheckParsed(check, await asSdJwtVcEvidence(), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });
});

// ─── Section 6.2.3 EAA identifier ─────────────────────────────────────────

describe('§6.2.3 EAA identifier', () => {
  it('EAA-6.2.3-01 passes when document_number is present in the primary namespace', async () => {
    const parsed = await loadMdocFixture();
    const ok = asConformantNonMdl(parsed);
    const v = await runCheckParsed(check_6_2_3_01, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.3-01 fails when document_number is missing', async () => {
    const parsed = await loadMdocFixture();
    const broken = withoutItem(asConformantNonMdl(parsed), NS_ISO_23220, 'document_number');
    const v = await runCheckParsed(check_6_2_3_01, asMdocEvidence(broken), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.3-03 passes for mDL with document_number in the mDL namespace', async () => {
    const parsed = await loadMdocFixture();
    const mdl = asConformantMdl(parsed);
    const v = await runCheckParsed(check_6_2_3_03, asMdocEvidence(mdl), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.3-03 fails for mDL without document_number', async () => {
    const parsed = await loadMdocFixture();
    const mdl = withoutItem(asConformantMdl(parsed), NS_MDL, 'document_number');
    const v = await runCheckParsed(check_6_2_3_03, asMdocEvidence(mdl), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.3-03 is na for non-mDL', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_3_03, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });

  it('EAA-6.2.3-04 passes for non-mDL with document_number in the 23220-2 namespace', async () => {
    const parsed = await loadMdocFixture();
    const ok = asConformantNonMdl(parsed);
    const v = await runCheckParsed(check_6_2_3_04, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.3-02 returns na (semantic-deferred)', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_3_02, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });

  it.each([
    ['EAA-6.2.3-01', check_6_2_3_01],
    ['EAA-6.2.3-02', check_6_2_3_02],
    ['EAA-6.2.3-03', check_6_2_3_03],
    ['EAA-6.2.3-04', check_6_2_3_04],
  ] as const)('%s returns na for SD-JWT VC evidence', async (_, check) => {
    const v = await runCheckParsed(check, await asSdJwtVcEvidence(), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });
});

// ─── Section 6.2.4 EAA issuer identifier ──────────────────────────────────

describe('§6.2.4 EAA issuer identifier', () => {
  it('EAA-6.2.4.1-01 passes for mDL with issuing_authority in mDL namespace', async () => {
    const parsed = await loadMdocFixture();
    const ok = asConformantMdl(parsed);
    const v = await runCheckParsed(check_6_2_4_1_01, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.4.1-01 fails for mDL missing issuing_authority', async () => {
    const parsed = await loadMdocFixture();
    const broken = withoutItem(asConformantMdl(parsed), NS_MDL, 'issuing_authority');
    const v = await runCheckParsed(check_6_2_4_1_01, asMdocEvidence(broken), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.4.1-03 passes for non-mDL with issuing_authority_unicode', async () => {
    const parsed = await loadMdocFixture();
    const ok = asConformantNonMdl(parsed);
    const v = await runCheckParsed(check_6_2_4_1_03, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.4.1-03 fails for non-mDL missing issuing_authority_unicode', async () => {
    const parsed = await loadMdocFixture();
    const broken = withoutItem(
      asConformantNonMdl(parsed),
      NS_ISO_23220,
      'issuing_authority_unicode',
    );
    const v = await runCheckParsed(check_6_2_4_1_03, asMdocEvidence(broken), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.4.1-05 always passes (permissive may rule)', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_4_1_05, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.4.1-09 always passes (permissive may rule)', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_4_1_09, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.4.1-10 passes when iss_reg_id is a tstr', async () => {
    const parsed = await loadMdocFixture();
    const ok = withItem(parsed, NS_ETSI, 'iss_reg_id', 'IT-12345');
    const v = await runCheckParsed(check_6_2_4_1_10, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.4.1-10 fails when iss_reg_id is not a string', async () => {
    const parsed = await loadMdocFixture();
    const broken = withItem(parsed, NS_ETSI, 'iss_reg_id', 12345);
    const v = await runCheckParsed(check_6_2_4_1_10, asMdocEvidence(broken), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.4.1-13 warns when both iss_reg_id and x5chain are present', async () => {
    const parsed = await loadMdocFixture();
    let mut = withItem(parsed, NS_ETSI, 'iss_reg_id', 'IT-12345');
    mut = withX5chain(mut, [new Uint8Array([0x30, 0x82, 0x00, 0x00])]);
    const v = await runCheckParsed(check_6_2_4_1_13, asMdocEvidence(mut), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('warn');
  });

  it('QEAA-6.2.4.2-01 warns at QEAA scope when neither iss_reg_id nor x5chain is present', async () => {
    const parsed = await loadMdocFixture();
    const mut = withX5chain(parsed, undefined);
    const v = await runCheckParsed(check_qeaa_6_2_4_2_01, asMdocEvidence(mut), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'qeaa',
    });
    expect(v.status).toBe('warn');
  });

  it('QEAA-6.2.4.2-01 passes at QEAA scope when iss_reg_id is present', async () => {
    const parsed = await loadMdocFixture();
    const ok = withItem(parsed, NS_ETSI, 'iss_reg_id', 'IT-12345');
    const v = await runCheckParsed(check_qeaa_6_2_4_2_01, asMdocEvidence(ok), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'qeaa',
    });
    expect(v.status).toBe('pass');
  });

  it('PuB-EAA-6.2.4.3-01 warns at PuB-EAA scope when neither iss_reg_id nor x5chain is present', async () => {
    const parsed = await loadMdocFixture();
    const mut = withX5chain(parsed, undefined);
    const v = await runCheckParsed(check_pub_6_2_4_3_01, asMdocEvidence(mut), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'pub-eaa',
    });
    expect(v.status).toBe('warn');
  });

  it.each([
    ['EAA-6.2.4.1-02', check_6_2_4_1_02],
    ['EAA-6.2.4.1-04', check_6_2_4_1_04],
    ['EAA-6.2.4.1-08', check_6_2_4_1_08],
    ['EAA-6.2.4.1-11', check_6_2_4_1_11],
    ['EAA-6.2.4.1-12', check_6_2_4_1_12],
    ['QEAA-6.2.4.2-02', check_qeaa_6_2_4_2_02],
    ['PuB-EAA-6.2.4.3-02', check_pub_6_2_4_3_02],
  ] as const)('%s returns na (semantic-deferred) on mdoc evidence', async (_, check) => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });

  it.each([
    ['EAA-6.2.4.1-01', check_6_2_4_1_01],
    ['EAA-6.2.4.1-02', check_6_2_4_1_02],
    ['EAA-6.2.4.1-03', check_6_2_4_1_03],
    ['EAA-6.2.4.1-04', check_6_2_4_1_04],
    ['EAA-6.2.4.1-05', check_6_2_4_1_05],
    ['EAA-6.2.4.1-06', check_6_2_4_1_06],
    ['EAA-6.2.4.1-07', check_6_2_4_1_07],
    ['EAA-6.2.4.1-08', check_6_2_4_1_08],
    ['EAA-6.2.4.1-09', check_6_2_4_1_09],
    ['EAA-6.2.4.1-10', check_6_2_4_1_10],
    ['EAA-6.2.4.1-11', check_6_2_4_1_11],
    ['EAA-6.2.4.1-12', check_6_2_4_1_12],
    ['EAA-6.2.4.1-13', check_6_2_4_1_13],
    ['QEAA-6.2.4.2-01', check_qeaa_6_2_4_2_01],
    ['QEAA-6.2.4.2-02', check_qeaa_6_2_4_2_02],
    ['PuB-EAA-6.2.4.3-01', check_pub_6_2_4_3_01],
    ['PuB-EAA-6.2.4.3-02', check_pub_6_2_4_3_02],
  ] as const)('%s returns na for SD-JWT VC evidence', async (_, check) => {
    const v = await runCheckParsed(check, await asSdJwtVcEvidence(), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });
});

// ─── Section 6.2.5 Subject and pseudonym ──────────────────────────────────

describe('§6.2.5 Subject and pseudonym', () => {
  it('EAA-6.2.5.1-01 passes for an mDL with the full subject triplet', async () => {
    const parsed = await loadMdocFixture();
    const ok = asConformantMdl(parsed);
    const v = await runCheckParsed(check_6_2_5_1_01, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.5.1-01 fails when the mDL triplet is partial', async () => {
    const parsed = await loadMdocFixture();
    const broken = withoutItem(asConformantMdl(parsed), NS_MDL, 'family_name');
    const v = await runCheckParsed(check_6_2_5_1_01, asMdocEvidence(broken), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.5.1-02 passes when also_known_as is present without the triplet', async () => {
    const parsed = await loadMdocFixture();
    let mdl = withDocType(parsed, MDL_DOC_TYPE);
    // Remove the original namespace contents and add only also_known_as.
    for (const ns of Object.keys(mdl.nameSpaces)) {
      mdl = withRemovedNs(mdl, ns);
    }
    mdl = withItem(mdl, NS_ETSI, 'also_known_as', 'pseudo');
    const v = await runCheckParsed(check_6_2_5_1_02, asMdocEvidence(mdl), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.5.1-02 fails for an mDL with neither the triplet nor also_known_as', async () => {
    const parsed = await loadMdocFixture();
    let mdl = withDocType(parsed, MDL_DOC_TYPE);
    for (const ns of Object.keys(mdl.nameSpaces)) mdl = withRemovedNs(mdl, ns);
    const v = await runCheckParsed(check_6_2_5_1_02, asMdocEvidence(mdl), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.5.1-03 passes when also_known_as is a tstr', async () => {
    const parsed = await loadMdocFixture();
    const ok = withItem(parsed, NS_ETSI, 'also_known_as', 'pseudo');
    const v = await runCheckParsed(check_6_2_5_1_03, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.5.1-03 fails when also_known_as is not a string', async () => {
    const parsed = await loadMdocFixture();
    const broken = withItem(parsed, NS_ETSI, 'also_known_as', 42);
    const v = await runCheckParsed(check_6_2_5_1_03, asMdocEvidence(broken), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.5.1-04 passes for non-mDL with the full triplet', async () => {
    const parsed = await loadMdocFixture();
    const ok = asConformantNonMdl(parsed);
    const v = await runCheckParsed(check_6_2_5_1_04, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.5.1-05 fails for non-mDL with neither triplet nor also_known_as', async () => {
    const parsed = await loadMdocFixture();
    let non = withDocType(parsed, 'org.example.test.v1');
    for (const ns of Object.keys(non.nameSpaces)) non = withRemovedNs(non, ns);
    const v = await runCheckParsed(check_6_2_5_1_05, asMdocEvidence(non), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('QEAA-6.2.5.5-01 fails when SubAttr-shaped values exist at QEAA scope', async () => {
    const parsed = await loadMdocFixture();
    const evil = withItem(parsed, NS_ETSI, 'foo', { subId: { kind: 'x' } });
    const v = await runCheckParsed(check_qeaa_6_2_5_5_01, asMdocEvidence(evil), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'qeaa',
    });
    expect(v.status).toBe('fail');
  });

  it('QEAA-6.2.5.5-01 passes at QEAA scope when no SubAttr-shaped values are present', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_qeaa_6_2_5_5_01, asMdocEvidence(parsed), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'qeaa',
    });
    expect(v.status).toBe('pass');
  });

  it('PuB-EAA-6.2.5.6-01 fails when SubAttr-shaped values exist at PuB-EAA scope', async () => {
    const parsed = await loadMdocFixture();
    const evil = withItem(parsed, NS_ETSI, 'foo', { subAka: 'x' });
    const v = await runCheckParsed(check_pub_6_2_5_6_01, asMdocEvidence(evil), {
      ...DEFAULT_MDOC_SCOPE,
      tier: 'pub-eaa',
    });
    expect(v.status).toBe('fail');
  });

  it.each([
    ['EAA-6.2.5.1-01', check_6_2_5_1_01],
    ['EAA-6.2.5.1-02', check_6_2_5_1_02],
    ['EAA-6.2.5.1-03', check_6_2_5_1_03],
    ['EAA-6.2.5.1-04', check_6_2_5_1_04],
    ['EAA-6.2.5.1-05', check_6_2_5_1_05],
    ['EAA-6.2.5.2-01', check_6_2_5_2_01],
    ['EAA-6.2.5.3-01', check_6_2_5_3_01],
    ['EAA-6.2.5.3-02', check_6_2_5_3_02],
    ['EAA-6.2.5.3-03', check_6_2_5_3_03],
    ['EAA-6.2.5.4-01', check_6_2_5_4_01],
    ['EAA-6.2.5.4-02', check_6_2_5_4_02],
    ['QEAA-6.2.5.5-01', check_qeaa_6_2_5_5_01],
    ['PuB-EAA-6.2.5.6-01', check_pub_6_2_5_6_01],
  ] as const)('%s returns na for SD-JWT VC evidence', async (_, check) => {
    const v = await runCheckParsed(check, await asSdJwtVcEvidence(), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });
});

// ─── Section 6.2.6 Issuance ───────────────────────────────────────────────

describe('§6.2.6 Issuance', () => {
  it('EAA-6.2.6-01 passes when issue_date is in the primary namespace', async () => {
    const parsed = await loadMdocFixture();
    const ok = withItem(asConformantNonMdl(parsed), NS_ISO_23220, 'issue_date', '2026-01-01');
    const v = await runCheckParsed(check_6_2_6_01, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.6-01 fails when issue_date is missing', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_6_01, asMdocEvidence(asConformantNonMdl(parsed)), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.6-03 passes for mDL with issue_date in the mDL namespace', async () => {
    const parsed = await loadMdocFixture();
    const mdl = withItem(asConformantMdl(parsed), NS_MDL, 'issue_date', '2026-01-01');
    const v = await runCheckParsed(check_6_2_6_03, asMdocEvidence(mdl), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.6-04 passes for non-mDL with issue_date in 23220-2', async () => {
    const parsed = await loadMdocFixture();
    const non = withItem(asConformantNonMdl(parsed), NS_ISO_23220, 'issue_date', '2026-01-01');
    const v = await runCheckParsed(check_6_2_6_04, asMdocEvidence(non), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it.each([
    ['EAA-6.2.6-01', check_6_2_6_01],
    ['EAA-6.2.6-02', check_6_2_6_02],
    ['EAA-6.2.6-03', check_6_2_6_03],
    ['EAA-6.2.6-04', check_6_2_6_04],
  ] as const)('%s returns na for SD-JWT VC evidence', async (_, check) => {
    const v = await runCheckParsed(check, await asSdJwtVcEvidence(), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });
});

// ─── Section 6.2.7 Validity periods ───────────────────────────────────────

describe('§6.2.7 Validity periods', () => {
  it('EAA-6.2.7.1-01 passes when validityInfo.validFrom is a valid Date', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_7_1_01, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.7.1-02 passes when validityInfo.validUntil is a valid Date', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_7_1_02, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.7.1-03 passes when both validity dates are valid', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_7_1_03, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.7.1-04 fails when validity dates carry milliseconds', async () => {
    const parsed = await loadMdocFixture();
    const broken = withValidity(parsed, new Date('2026-01-01T00:00:00.500Z'), new Date('2027-01-01T00:00:00.000Z'));
    const v = await runCheckParsed(check_6_2_7_1_04, asMdocEvidence(broken), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.7.1-04 passes at second precision', async () => {
    const parsed = await loadMdocFixture();
    const ok = withValidity(parsed, new Date('2026-01-01T00:00:00.000Z'), new Date('2027-01-01T00:00:00.000Z'));
    const v = await runCheckParsed(check_6_2_7_1_04, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.7.1-05 fails when fractional seconds appear on validUntil', async () => {
    const parsed = await loadMdocFixture();
    const broken = withValidity(parsed, new Date('2026-01-01T00:00:00.000Z'), new Date('2027-01-01T00:00:00.250Z'));
    const v = await runCheckParsed(check_6_2_7_1_05, asMdocEvidence(broken), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.7.2-01 passes for mDL with expiry_date in mDL namespace', async () => {
    const parsed = await loadMdocFixture();
    const mdl = withItem(asConformantMdl(parsed), NS_MDL, 'expiry_date', '2027-01-01');
    const v = await runCheckParsed(check_6_2_7_2_01, asMdocEvidence(mdl), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.7.2-02 passes for non-mDL with expiry_date in 23220-2', async () => {
    const parsed = await loadMdocFixture();
    const non = withItem(asConformantNonMdl(parsed), NS_ISO_23220, 'expiry_date', '2027-01-01');
    const v = await runCheckParsed(check_6_2_7_2_02, asMdocEvidence(non), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.7.2-03 always passes (permissive)', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_7_2_03, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it.each([
    ['EAA-6.2.7.1-01', check_6_2_7_1_01],
    ['EAA-6.2.7.1-02', check_6_2_7_1_02],
    ['EAA-6.2.7.1-03', check_6_2_7_1_03],
    ['EAA-6.2.7.1-04', check_6_2_7_1_04],
    ['EAA-6.2.7.1-05', check_6_2_7_1_05],
    ['EAA-6.2.7.2-01', check_6_2_7_2_01],
    ['EAA-6.2.7.2-02', check_6_2_7_2_02],
    ['EAA-6.2.7.2-03', check_6_2_7_2_03],
  ] as const)('%s returns na for SD-JWT VC evidence', async (_, check) => {
    const v = await runCheckParsed(check, await asSdJwtVcEvidence(), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });
});

// ─── Section 6.2.8 Constraining usage ─────────────────────────────────────

describe('§6.2.8 Constraining usage', () => {
  it('EAA-6.2.8.1-01 passes when no audience-shaped element is present', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_8_1_01, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.8.1-01 fails when an "aud" element is present', async () => {
    const parsed = await loadMdocFixture();
    const evil = withItem(parsed, NS_ETSI, 'aud', 'rp.example');
    const v = await runCheckParsed(check_6_2_8_1_01, asMdocEvidence(evil), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.8.2-03 passes when oneTime is a CBOR bool', async () => {
    const parsed = await loadMdocFixture();
    const ok = withItem(parsed, NS_ETSI, 'oneTime', true);
    const v = await runCheckParsed(check_6_2_8_2_03, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.8.2-03 fails when oneTime is a string', async () => {
    const parsed = await loadMdocFixture();
    const broken = withItem(parsed, NS_ETSI, 'oneTime', 'true');
    const v = await runCheckParsed(check_6_2_8_2_03, asMdocEvidence(broken), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.8.2-04 passes when oneTime is true', async () => {
    const parsed = await loadMdocFixture();
    const ok = withItem(parsed, NS_ETSI, 'oneTime', true);
    const v = await runCheckParsed(check_6_2_8_2_04, asMdocEvidence(ok), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.8.2-05 passes when oneTime is absent', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_8_2_05, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it.each([
    ['EAA-6.2.8.1-01', check_6_2_8_1_01],
    ['EAA-6.2.8.2-01', check_6_2_8_2_01],
    ['EAA-6.2.8.2-02', check_6_2_8_2_02],
    ['EAA-6.2.8.2-03', check_6_2_8_2_03],
    ['EAA-6.2.8.2-04', check_6_2_8_2_04],
    ['EAA-6.2.8.2-05', check_6_2_8_2_05],
  ] as const)('%s returns na for SD-JWT VC evidence', async (_, check) => {
    const v = await runCheckParsed(check, await asSdJwtVcEvidence(), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });
});

// ─── Section 6.2.9 Attributes evidence ────────────────────────────────────

describe('§6.2.9 Attributes evidence', () => {
  it('EAA-6.2.9-01 passes when no attributes-evidence-shaped element is present', async () => {
    const parsed = await loadMdocFixture();
    const v = await runCheckParsed(check_6_2_9_01, asMdocEvidence(parsed), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('pass');
  });

  it('EAA-6.2.9-01 fails when an "evidence" element is present', async () => {
    const parsed = await loadMdocFixture();
    const evil = withItem(parsed, NS_ETSI, 'evidence', 'something');
    const v = await runCheckParsed(check_6_2_9_01, asMdocEvidence(evil), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('fail');
  });

  it('EAA-6.2.9-01 returns na for SD-JWT VC evidence', async () => {
    const v = await runCheckParsed(check_6_2_9_01, await asSdJwtVcEvidence(), DEFAULT_MDOC_SCOPE);
    expect(v.status).toBe('na');
  });
});
