import { z } from 'zod';

export const SpecSourceSchema = z.object({
  document: z.string(),
  version: z.string(),
  clause: z.string(),
  page: z.number().int().positive().optional(),
});

export const ModuleSchema = z.enum([
  'eaa-conformance',
  'pid-lpid',
  'wallet-attestation',
  'oid4vci',
  'oid4vp',
  'qtsp',
  'trust-list',
]);

export const ModalVerbSchema = z.enum(['shall', 'should', 'may']);

export const AppliesToSchema = z.enum(['ordinary-eaa', 'qeaa', 'pub-eaa', 'all']);

export const ProfileSchema = z.enum(['sd-jwt-vc', 'mdoc', 'abstract']);

export const RoleSchema = z.enum(['issuer', 'verifier', 'wallet', 'rp', 'qtsp', 'all']);

export const EvidenceTypeSchema = z.enum([
  'eaa-payload',
  'eaa-header',
  'issuer-cert',
  'status-list',
  'type-metadata',
  'trust-list',
]);

// Capitalised prefix(es), e.g. EAA, QEAA, PuB-EAA, then a clause and an
// optional sequence number: EAA-5.2.1.2-01, QEAA-5.6.2-02, PuB-EAA-5.6.3-03.
const ID_PATTERN = /^[A-Z][A-Za-z]*(-[A-Z][A-Za-z]*)?-[\d.]+(-\d+)?$/;

export const ControlSchema = z.object({
  id: z.string().regex(ID_PATTERN, {
    message: 'id must match prefix-clause-suffix, e.g. EAA-5.2.1.2-01',
  }),
  module: ModuleSchema,
  spec_source: SpecSourceSchema,
  modal_verb: ModalVerbSchema,
  applies_to: z.array(AppliesToSchema).default(['all']),
  profile: z.array(ProfileSchema),
  role: z.array(RoleSchema),
  evidence_type: z.array(EvidenceTypeSchema),
  short_title: z.string().min(5).max(120),
  spec_text: z.string().min(10),
  plain_english: z
    .string()
    .refine((v) => v === 'TODO' || v.length >= 20, {
      message:
        'plain_english must be at least 20 characters or the literal "TODO" placeholder',
    })
    .default('TODO'),
  why_it_matters: z.string().optional(),
  common_mistakes: z.array(z.string()).default([]),
  related_controls: z.array(z.string()).default([]),
  check_function: z.string().optional(),
});

export const ControlsCatalogueSchema = z.array(ControlSchema);

export const ModuleStatusSchema = z.enum(['shipped', 'in-development', 'planned']);

export const ModuleMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: ModuleStatusSchema,
  short_description: z.string(),
  spec_sources: z.array(z.string()),
});

export const ModulesCatalogueSchema = z.array(ModuleMetadataSchema);

export const TierSchema = z.enum(['ordinary-eaa', 'qeaa', 'pub-eaa']);

export const ReferenceSampleSchema = z.object({
  sample_id: z.string().min(1),
  title: z.string().min(5),
  description: z.string().min(20),
  profile: ProfileSchema,
  tier: TierSchema,
  compact_serialisation: z.string().min(1),
  decoded_header: z.record(z.string(), z.unknown()),
  decoded_payload: z.record(z.string(), z.unknown()),
  issuer_cert_pem: z.string().regex(/-----BEGIN CERTIFICATE-----/),
  exercises_controls: z.array(z.string()).min(1),
  generated_by: z.string().min(1),
  generated_at: z.string().regex(/\d{4}-\d{2}-\d{2}T/),
});

export const ReferenceSamplesCatalogueSchema = z.array(ReferenceSampleSchema);

export type SpecSource = z.infer<typeof SpecSourceSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type ModalVerb = z.infer<typeof ModalVerbSchema>;
export type AppliesTo = z.infer<typeof AppliesToSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type EvidenceType = z.infer<typeof EvidenceTypeSchema>;
export type Control = z.infer<typeof ControlSchema>;
export type ControlsCatalogue = z.infer<typeof ControlsCatalogueSchema>;
export type ModuleStatus = z.infer<typeof ModuleStatusSchema>;
export type ModuleMetadata = z.infer<typeof ModuleMetadataSchema>;
export type ModulesCatalogue = z.infer<typeof ModulesCatalogueSchema>;
export type Tier = z.infer<typeof TierSchema>;
export type ReferenceSample = z.infer<typeof ReferenceSampleSchema>;
export type ReferenceSamplesCatalogue = z.infer<typeof ReferenceSamplesCatalogueSchema>;
