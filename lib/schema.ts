import { z } from "zod";

export const intakeSchema = z.object({
  location: z.string().min(2),
  hazard: z.enum(["fire", "tsunami", "flood", "typhoon", "heatwave"]),
  role: z.enum(["household", "school", "clinic"]),
  language: z.enum(["English", "Simplified English", "Tagalog"]),
  adults: z.number().int().min(0).max(50),
  children: z.number().int().min(0).max(200),
  elders: z.number().int().min(0).max(50),
  pets: z.number().int().min(0).max(20),
  medications: z.string(),
  mobilityNeeds: z.string(),
  weakInternet: z.boolean(),
  documentContext: z.string(),
  documentSourceName: z.string().default(""),
  documentEffectiveTime: z.string().default(""),
  documentTimingOverride: z.enum(["auto", "active", "stale", "unknown"]).default("auto"),
  documentTimingOverrideReason: z.string().default(""),
  notes: z.string(),
});

export const sourceEntrySchema = z.object({
  title: z.string(),
  summary: z.string(),
  url: z.string().url().optional(),
  usedFor: z.string().optional(),
  evidence: z.string().optional(),
  effectiveWindow: z.string().optional(),
  timingFreshnessOverride: z.enum(["active", "stale", "unknown"]).optional(),
  timingFreshnessOverrideReason: z.string().optional(),
});

export const destinationSchema = z.object({
  name: z.string(),
  reason: z.string(),
  distanceKm: z.number(),
  etaMinutes: z.number(),
});

export const specialInstructionSchema = z.object({
  title: z.string(),
  items: z.array(z.string()),
});

export const documentBriefSchema = z.object({
  headline: z.string(),
  summary: z.string(),
  issuingAuthority: z.string().optional(),
  facilityName: z.string().optional(),
  actionCue: z.string().optional(),
  timingCue: z.string().optional(),
  extractedPoints: z.array(z.string()),
  planningAdjustments: z.array(z.string()),
  recommendedChecks: z.array(z.string()),
});

export const planningBasisEntrySchema = z.object({
  section: z.string(),
  basis: z.string(),
  sourceTypes: z.array(z.enum(["official", "retrieved", "generated"])),
  confidenceLabel: z.enum(["grounded", "mixed", "generated"]),
});

export const planningPostureSchema = z.object({
  mode: z.enum(["prep-now", "verify-now", "move-on-trigger"]),
  headline: z.string(),
  reason: z.string(),
  checklist: z.array(z.string()),
  primarySourceType: z.enum(["official", "retrieved", "generated"]),
});

export const trustSignalSchema = z.object({
  title: z.string(),
  detail: z.string(),
  sourceType: z.enum(["official", "retrieved", "generated"]),
  status: z.enum(["ready", "confirm", "advisory"]),
});

export const planningInputSchema = z.object({
  title: z.string(),
  detail: z.string(),
  sourceType: z.enum(["official", "retrieved", "generated"]),
  status: z.enum(["ready", "confirm", "advisory"]),
});

export const actionBundleSchema = z.object({
  actionCardTitle: z.string(),
  engineLabel: z.string(),
  summary: z.string(),
  planningPosture: planningPostureSchema,
  planningInputs: z.array(planningInputSchema),
  trustSnapshot: z.object({
    headline: z.string(),
    items: z.array(trustSignalSchema),
  }),
  documentBrief: documentBriefSchema.optional(),
  planningBasis: z.array(planningBasisEntrySchema),
  immediateActions: z.array(z.string()),
  evacuation: z.object({
    decision: z.string(),
    routeContext: z.string(),
    destinations: z.array(destinationSchema),
  }),
  goBag: z.array(z.string()),
  specialInstructions: z.array(specialInstructionSchema),
  verification: z.array(z.string()),
  voiceBriefing: z.object({
    language: z.string(),
    script: z.string(),
  }),
  flowchart: z.string(),
  sources: z.object({
    officialFacts: z.array(sourceEntrySchema),
    retrievedGuidance: z.array(sourceEntrySchema),
    generatedNotes: z.array(sourceEntrySchema),
  }),
});

export type IntakeForm = z.infer<typeof intakeSchema>;
export type ActionBundle = z.infer<typeof actionBundleSchema>;
export type SourceEntry = z.infer<typeof sourceEntrySchema>;
export type DocumentBrief = z.infer<typeof documentBriefSchema>;
