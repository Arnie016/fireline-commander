"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  buildDocumentBrief,
  getDocumentSourceFacts,
  getDocumentSourceDescriptor,
} from "@/lib/document-context";
import { getGuidanceDocs } from "@/lib/guidance";
import type { ActionBundle, DocumentBrief, IntakeForm, SourceEntry } from "@/lib/schema";

const demoPresets = [
  {
    label: "Fireline school",
    detail: "Marikina smoke + evacuation drill",
    track: "Global Resilience + Safety & Trust",
    judgeHook: "A school safety lead must route students while smoke, parent pickup, and responder access collide.",
    routeSkill: "fire lane, upwind assembly, re-entry, accountability",
    gemmaProof: "Multimodal frame generation, retrieved school route card, source-labeled action outputs.",
    state: {
      location: "Marikina, Philippines",
      hazard: "fire",
      role: "school",
      language: "English",
      adults: 10,
      children: 42,
      elders: 0,
      pets: 0,
      medications: "Asthma inhalers and emergency allergy kits in the clinic cabinet",
      mobilityNeeds: "Three students need assisted stair movement",
      weakInternet: true,
      documentContext:
        "Demo retrieved route card for Fireline Commander\nIssued by: Marikina School Safety Office\nEffective: active for the current drill\nPrimary instruction line: Move students upwind through the covered walkway, keep the service road and pickup gate clear for fire crews, and release students only after headcount.\nRoute note: fire lane means responder access; do not use it as an evacuation shortcut.",
      documentSourceName: "Marikina School Safety Office route card",
      documentEffectiveTime: "active for the current drill",
      documentTimingOverride: "active",
      documentTimingOverrideReason: "Preset route card is current for the hackathon training scenario.",
      notes: "Brush fire smoke is moving toward campus. Need a command briefing, parent pickup plan, and safe assembly route.",
    } satisfies IntakeForm,
  },
  {
    label: "Bay household",
    detail: "Manila tsunami practice run",
    track: "Global Resilience",
    judgeHook: "A family near the bay has minutes to move inland after shaking while helping an elder and a pet.",
    routeSkill: "natural warning, vertical evacuation, inland route, all clear",
    gemmaProof: "Local-first plan with route vocabulary, low-bandwidth voice brief, and source-aware trigger language.",
    state: {
      location: "Manila, Philippines",
      hazard: "tsunami",
      role: "household",
      language: "English",
      adults: 2,
      children: 1,
      elders: 1,
      pets: 1,
      medications: "Maintenance meds for hypertension",
      mobilityNeeds: "Grandmother needs help on stairs",
      weakInternet: true,
      documentContext:
        "Demo retrieved bulletin for Fireline Commander\nIssued by: Barangay coastal response desk\nEffective: active until official all clear\nPrimary instruction line: After strong shaking or a tsunami alert, move inland by the marked high-ground route and do not return to the shoreline until an official all clear.\nRoute note: vertical evacuation means moving up to a safe floor only when inland movement is blocked.",
      documentSourceName: "Barangay coastal response desk bulletin",
      documentEffectiveTime: "active until official all clear",
      documentTimingOverride: "active",
      documentTimingOverrideReason: "Preset bulletin is current for the hackathon training scenario.",
      notes: "Apartment near the bay. Need a fast grab-and-go plan.",
    } satisfies IntakeForm,
  },
  {
    label: "Night flood",
    detail: "Pasig ground-floor drill",
    track: "Global Resilience + Digital Equity",
    judgeHook: "A ground-floor household must decide before water cuts the street and the signal drops.",
    routeSkill: "turn around, upper-floor shelter, moving water, power isolation",
    gemmaProof: "Plain-language route synonyms and exportable action cards for low-connectivity households.",
    state: {
      location: "Pasig, Philippines",
      hazard: "flood",
      role: "household",
      language: "Simplified English",
      adults: 2,
      children: 2,
      elders: 0,
      pets: 0,
      medications: "",
      mobilityNeeds: "",
      weakInternet: false,
      documentContext:
        "Demo retrieved bulletin for Fireline Commander\nIssued by: Pasig City DRRMO flood desk\nEffective: active overnight\nPrimary instruction line: Move people, medicines, and chargers above ground level before water reaches ankle depth; do not walk or drive through moving water.\nRoute note: upper-floor shelter is safer than crossing a flooded street when water is rising.",
      documentSourceName: "Pasig City DRRMO flood desk bulletin",
      documentEffectiveTime: "active overnight",
      documentTimingOverride: "active",
      documentTimingOverrideReason: "Preset bulletin is current for the hackathon training scenario.",
      notes: "Ground-floor unit. Worried about overnight flooding and power cuts.",
    } satisfies IntakeForm,
  },
  {
    label: "School typhoon",
    detail: "Quezon City typhoon pickup",
    track: "Global Resilience + Education",
    judgeHook: "A school must keep students sheltered while parents arrive, wind rises, and pickup lanes clog.",
    routeSkill: "shelter-in-place, covered gate, reunification, wind warning",
    gemmaProof: "Scenario-specific parent handoff script, source separation, and decision-pause quizzes.",
    state: {
      location: "Quezon City, Philippines",
      hazard: "typhoon",
      role: "school",
      language: "Tagalog",
      adults: 8,
      children: 30,
      elders: 0,
      pets: 0,
      medications: "Asthma inhalers in the clinic cabinet",
      mobilityNeeds: "Two students need mobility assistance",
      weakInternet: true,
      documentContext:
        "Demo retrieved memo for Fireline Commander\nIssued by: Quezon City school operations office\nEffective: active while wind warning is posted\nPrimary instruction line: Keep students inside assigned rooms during peak wind, release only through the covered gate when safe, and keep emergency vehicle access clear.\nRoute note: reunification means controlled guardian pickup after class-level headcount.",
      documentSourceName: "Quezon City school operations office memo",
      documentEffectiveTime: "active while wind warning is posted",
      documentTimingOverride: "active",
      documentTimingOverrideReason: "Preset memo is current for the hackathon training scenario.",
      notes: "Need a school opening or closure plan plus a parent update message.",
    } satisfies IntakeForm,
  },
  {
    label: "Clinic heat",
    detail: "Caloocan outage + cooling triage",
    track: "Health & Sciences + Safety & Trust",
    judgeHook: "A clinic loses reliable cooling and must triage elders, children, and medication storage before heat illness escalates.",
    routeSkill: "cool room, heat index, wellness check, escalation trigger",
    gemmaProof: "Voice coach turns clinical constraints into a short, auditable operations drill.",
    state: {
      location: "Caloocan, Philippines",
      hazard: "heatwave",
      role: "clinic",
      language: "Simplified English",
      adults: 12,
      children: 8,
      elders: 18,
      pets: 0,
      medications: "Insulin cooler, oral rehydration salts, blood pressure medicines",
      mobilityNeeds: "Wheelchair users and elders waiting for transport",
      weakInternet: true,
      documentContext:
        "Demo retrieved advisory for Fireline Commander\nIssued by: City Health Office heat desk\nEffective: active during heat index alert\nPrimary instruction line: Move vulnerable patients to the coolest reachable room, begin water and symptom checks, protect temperature-sensitive medicines, and escalate confusion, fainting, or heat stroke signs immediately.\nRoute note: cool room means the shaded, ventilated care area with the shortest safe path for mobility-limited patients.",
      documentSourceName: "City Health Office heat desk advisory",
      documentEffectiveTime: "active during heat index alert",
      documentTimingOverride: "active",
      documentTimingOverrideReason: "Preset advisory is current for the hackathon training scenario.",
      notes: "Power is unstable during a heat index alert. Need a cooling triage drill and short voice handoff for staff.",
    } satisfies IntakeForm,
  },
] as const;

const hazardCourses = [
  {
    value: "fire",
    label: "Fire",
    promise: "Move before smoke traps exits.",
    challenge: "School fireline and pickup control",
  },
  {
    value: "tsunami",
    label: "Tsunami",
    promise: "Move inland without freezing.",
    challenge: "Strong shaking near the bay",
  },
  {
    value: "flood",
    label: "Flood",
    promise: "Leave before roads close.",
    challenge: "Water rising after dark",
  },
  {
    value: "typhoon",
    label: "Typhoon",
    promise: "Decide before wind peaks.",
    challenge: "Shelter, closure, parent updates",
  },
  {
    value: "heatwave",
    label: "Heatwave",
    promise: "Cool vulnerable people early.",
    challenge: "Heat stress and power risk",
  },
] as const satisfies Array<{
  value: IntakeForm["hazard"];
  label: string;
  promise: string;
  challenge: string;
}>;

const roleOptions = [
  { value: "household", label: "Home" },
  { value: "school", label: "School" },
  { value: "clinic", label: "Clinic" },
] as const;

type TraineeRoleId = "student" | "teacher" | "instructor";

type TraineeRoleProfile = {
  id: TraineeRoleId;
  label: string;
  goal: string;
  instruction: string;
};

const traineeRoleProfiles: TraineeRoleProfile[] = [
  {
    id: "student",
    label: "Student",
    goal: "Follow the safest line.",
    instruction: "Stay with the group, listen for the route, and avoid shortcuts.",
  },
  {
    id: "teacher",
    label: "Teacher",
    goal: "Move the class.",
    instruction: "Give one clear order, assign buddies, and count students before handoff.",
  },
  {
    id: "instructor",
    label: "Drill instructor",
    goal: "Control the route.",
    instruction: "Keep the fire lane open, read the scene, and correct unsafe movement.",
  },
] as const;

function buildScenarioRoleProfile(hazard: IntakeForm["hazard"], roleId: TraineeRoleId) {
  const profile = traineeRoleProfiles.find((role) => role.id === roleId);

  if (!profile) {
    return null;
  }

  const instructions: Record<IntakeForm["hazard"], Record<TraineeRoleId, string>> = {
    fire: {
      student: "Line up with your buddy, stay low if smoke thickens, and do not use the fire lane.",
      teacher: "Give one order: move upwind, keep the class together, and count before handoff.",
      instructor: "Check smoke direction, keep responder access clear, and correct any shortcut.",
    },
    tsunami: {
      student: "Move inland with the group, help the elder, and never turn back for belongings.",
      teacher: "Call the inland route, assign support for stairs, and wait for the official all clear.",
      instructor: "Confirm natural warning signs, route inland movement, and block return-to-shore behavior.",
    },
    flood: {
      student: "Move upstairs early, keep chargers and medicines with the group, and avoid floodwater.",
      teacher: "Move people above ground level, isolate power risk, and stop anyone entering moving water.",
      instructor: "Watch water depth, close the street route, and push the upper-floor shelter decision.",
    },
    typhoon: {
      student: "Stay inside the assigned room and wait for controlled pickup.",
      teacher: "Keep the class sheltered, count students, and release only through the covered gate.",
      instructor: "Monitor wind conditions, protect the pickup lane, and delay release if exposure rises.",
    },
    heatwave: {
      student: "Move to shade, drink water, and report dizziness or confusion immediately.",
      teacher: "Move vulnerable people to the cool room and run water and symptom checks.",
      instructor: "Triage heat risk, protect medicines, and escalate fainting, confusion, or heat stroke signs.",
    },
  };

  return {
    ...profile,
    instruction: instructions[hazard][roleId],
  };
}

const languageOptions = [
  { value: "English", label: "English" },
  { value: "Simplified English", label: "Simple" },
  { value: "Tagalog", label: "Tagalog" },
] as const;

const engineStages = [
  { step: "01", label: "Brief", detail: "Load a scenario-specific drill" },
  { step: "02", label: "Operate", detail: "Choose actions under route pressure" },
  { step: "03", label: "Review", detail: "Answer decision checks and read consequences" },
  { step: "04", label: "Handoff", detail: "Close with count, route, and all-clear" },
] as const;

const quickGroupPresets = [
  { id: "solo", label: "Solo adult", adults: 1, children: 0, elders: 0, pets: 0 },
  { id: "duo", label: "Adult + child", adults: 1, children: 1, elders: 0, pets: 0 },
  { id: "family", label: "Family", adults: 2, children: 1, elders: 1, pets: 0 },
  { id: "school", label: "School pod", adults: 1, children: 15, elders: 0, pets: 0 },
] as const;

const initialForm: IntakeForm = demoPresets[0].state;

const timingFreshnessOverrideOptions: Array<{
  value: IntakeForm["documentTimingOverride"];
  label: string;
}> = [
  { value: "auto", label: "Auto" },
  { value: "active", label: "Active" },
  { value: "stale", label: "Stale" },
  { value: "unknown", label: "Unknown" },
];

const missingTimingOverrideReasonError =
  "Add a timing override note before building the mission so exports explain why manual freshness was set.";
const voiceDemoClipTarget = {
  minSeconds: 35,
  maxSeconds: 50,
} as const;
const manualSourceLabelPlaceholder = "Manual paste";
const sourceAuthorityKeywordPattern =
  /\b(barangay|brgy|city|municipal(?:ity)?|province|provincial|office|department|agency|bureau|board|commission|drrmo|ndrrmc|pagasa|government|govt|council|school|clinic|hospital|health|fire|police|red cross)\b/i;

type EvidenceSpotlight = {
  sourceType: "official" | "retrieved" | "generated";
  label: string;
  title: string;
  summary: string;
  evidence?: string;
  sourceReference: string;
  sourceLedgerAnchorId?: string | null;
};

type VoiceArtifactSegment = {
  sourceType: "official" | "retrieved" | "generated";
  label: string;
  text: string;
};

type VoiceArtifact = {
  mode: "planner" | "source-aware";
  modeLabel: string;
  summary: string;
  script: string;
  segments: VoiceArtifactSegment[];
};

type SourceLedgerLane = {
  sourceType: "official" | "retrieved" | "generated";
  title: string;
  lead: string;
  items: SourceEntry[];
};

type SourceLedgerView = "all" | "plan-impact";
type SourceLedgerFreshnessFilter = "all" | "risk";
type ShareArtifactLaneFilter = "all" | ShareArtifactJumpSourceType;

type ShareArtifactTarget = "voice" | "action-card" | "flow";
type ShareArtifactJumpOrigin = "source-ledger" | "document-impact" | "judge-demo";
type ShareArtifactJumpSourceType = "official" | "retrieved" | "generated";
type DemoOutputTrustLane = ShareArtifactJumpSourceType | "mixed";

type JudgeDemoCueTarget = "run" | "step" | "source" | "share" | ShareArtifactTarget;

type JudgeDemoCue = {
  id: string;
  timecode: string;
  label: string;
  detail: string;
  proof: string;
  actionLabel: string;
  toneClass: string;
  target: JudgeDemoCueTarget;
  stepId?: string;
  decisionId?: string;
  quizAnswerId?: string;
  viewId?: FirstPersonViewId;
  videoBeatId?: InteractiveVideoBeatId;
  sourceType?: ShareArtifactJumpSourceType;
};

type TrainingOutcome = {
  safety: number;
  speed: number;
  trust: number;
  mastery: number;
  pressure: number;
  quizCorrectCount: number;
  quizTotal: number;
  bestDecisionCount: number;
  totalDecisionCount: number;
  riskyTurnCount: number;
  label: string;
  toneClass: string;
  detail: string;
};

type DebriefConsequenceBrief = {
  headline: string;
  detail: string;
  cards: Array<{
    label: string;
    value: string;
    toneClass: string;
  }>;
};

type WorkspaceSectionId = "overview" | "grounding" | "walkthrough" | "share";

type CommandBriefCard = {
  id: string;
  label: string;
  toneClass: string;
  toneLabel: string;
  headline: string;
  detail: string;
};

type IncidentStoryDecision = {
  id: string;
  label: string;
  detail: string;
  consequence?: string;
  impact: {
    safety: number;
    speed: number;
    trust: number;
  };
};

type DecisionHierarchyCue = {
  label: string;
  toneClass: string;
  detail: string;
};

type IncidentSimulationActor = {
  id: string;
  name: string;
  role: string;
  status: string;
  toneClass: string;
  positionClass: string;
};

type IncidentSimulation = {
  turnLabel: string;
  headline: string;
  consequence: string;
  pressureLabel: string;
  pressureValue: number;
  actors: IncidentSimulationActor[];
  log: string[];
};

type SourceProofLane = "official" | "retrieved" | "generated";

type FirstPersonViewId = "entry" | "corridor" | "gate";
type InteractiveVideoBeatId = "briefing" | "movement" | "decision";

type InteractiveVideoBeat = {
  id: InteractiveVideoBeatId;
  label: string;
  timestamp: string;
  caption: string;
  prompt: string;
  viewId: FirstPersonViewId;
  toneClass: string;
  visualClass: string;
};

type LearningVisualFrame = {
  id: string;
  label: string;
  caption: string;
  outcome: string;
  toneClass: string;
  visualClass: string;
};

type RouteRuleChoice = {
  id: string;
  label: string;
  detail: string;
  correct: boolean;
  feedback: string;
};

type RouteSynonym = {
  term: string;
  plain: string;
  verb: string;
};

type RouteTrainerScene = {
  title: string;
  subtitle: string;
  saveText: string;
  checkpoints: Array<{
    id: string;
    label: string;
    detail: string;
    toneClass: string;
  }>;
  synonyms: RouteSynonym[];
  ruleChoices: RouteRuleChoice[];
};

type FirstPersonDrillScene = {
  viewId: FirstPersonViewId;
  stageFrameUrl: string | null;
  stageVisualClass: string;
  stance: string;
  locationLabel: string;
  objective: string;
  narration: string;
  progress: number;
  cueLabel: string;
  operationStage: string;
  learningGoal: string;
  routeCue: {
    trigger: string;
    route: string;
    avoid: string;
  };
  controls: Array<{
    id: FirstPersonViewId;
    label: string;
    detail: string;
  }>;
  videoBeats: InteractiveVideoBeat[];
  learningFrames: LearningVisualFrame[];
  routeTrainer: RouteTrainerScene;
  hotspots: Array<{
    id: string;
    label: string;
    detail: string;
    toneClass: string;
    positionClass: string;
  }>;
  routeAffordances: Array<{
    id: string;
    label: string;
    detail: string;
    visualClass: string;
    positionClass: string;
  }>;
};

type IncidentStoryScene = {
  label: string;
  headline: string;
  briefing: string;
  quiz: {
    question: string;
    answers: Array<{
      id: string;
      label: string;
      correct: boolean;
      feedback: string;
    }>;
  };
  location: string;
  hazardLabel: string;
  mapToneClass: string;
  zones: Array<{
    id: string;
    label: string;
    detail: string;
    toneClass: string;
  }>;
  overlays: Array<{
    id: string;
    label: string;
    detail: string;
    toneClass: string;
  }>;
  decisions: IncidentStoryDecision[];
};

type PauseQuizResolveCue = {
  verdictLabel: string;
  verdictToneClass: "status-ready" | "status-confirm";
  ruleLabel: string;
  proofLabel: string;
  feedback: string;
};

type DocumentImportState = {
  status: "idle" | "loading" | "loaded" | "hook" | "error";
  fileName?: string;
  message?: string;
};

type MissionBuildMode = {
  state: "source-aware" | "guidance-pack" | "hook-pending";
  toneClass: string;
  badgeLabel: string;
  headline: string;
  detail: string;
  showHookAction: boolean;
};

type RetrievedLaneReadiness = {
  label: string;
  toneClass: string;
  detail: string;
};

type RetrievedIntakeChecklistStatus = "ready" | "confirm" | "advisory";

type RetrievedIntakeChecklistItem = {
  id: "context" | "source-label" | "timing" | "timing-note";
  label: string;
  detail: string;
  status: RetrievedIntakeChecklistStatus;
};

type RetrievedIntakeChecklist = {
  items: RetrievedIntakeChecklistItem[];
  readyCount: number;
  totalCount: number;
  toneClass: "status-ready" | "status-confirm" | "status-advisory";
  summary: string;
};

type AuthorityStripItem = {
  id: string;
  label: string;
  toneClass: string;
  toneLabel: string;
  headline: string;
  detail: string;
  meta: string;
};

type DemoOutputCard = {
  id: string;
  label: string;
  toneClass: string;
  toneLabel: string;
  headline: string;
  detail: string;
  actionId: "voice" | "action-card" | "flow" | "runbook";
  actionLabel: string;
  actionToneClass: string;
  actionStatus: string;
};

type ScenarioSnapshotCard = {
  id: string;
  label: string;
  toneClass: string;
  toneLabel: string;
  headline: string;
  detail: string;
};

type SourceAwareChecklistEntry = {
  item: string;
  sourceType: "official" | "retrieved" | "generated";
  rationale: string;
  sourceReference: string;
  sourceLedgerAnchorId: string | null;
};

type ChecklistSourceReference = {
  text: string;
  sourceLedgerAnchorId: string | null;
};

type WorkspaceJumpCard = {
  id: WorkspaceSectionId;
  label: string;
  toneClass: string;
  toneLabel: string;
  headline: string;
  detail: string;
  meta: string[];
};

type MissionControlChip = {
  id: string;
  label: string;
  value: string;
  toneClass: string;
  toneLabel: string;
};

type DocumentImpactCard = {
  id: string;
  label: string;
  toneClass: string;
  toneLabel: string;
  headline: string;
  detail: string;
};

type DocumentImpactArtifactTarget = {
  target: ShareArtifactTarget;
  sourceType: ShareArtifactJumpSourceType;
  headline: string;
  detail: string;
  actionLabel: string;
  toneClass: string;
  toneLabel: string;
};

type PortableFlowSummaryCard = {
  id: "official" | "retrieved" | "generated" | "route";
  label: string;
  toneClass: string;
  toneLabel: string;
  headline: string;
  detail: string;
};

type PortableFlowArtifact = {
  headline: string;
  summary: string;
  sourceProvenanceLabel: string;
  sourceProvenanceToneClass: "status-ready" | "status-confirm" | "status-advisory";
  sourceProvenanceToneLabel: string;
  summaryCards: PortableFlowSummaryCard[];
  mermaid: string;
  body: string;
};

type OcrHandoff = {
  headline: string;
  detail: string;
  preserveFields: string[];
  focusFields: string[];
  prompt: string;
  pasteTemplate: string;
};

type DemoRetrievedSource = {
  sourceName: string;
  effectiveTime: string;
  context: string;
};

type AgentEvidenceResponse = {
  retrieved_guidance: {
    id: string;
    scenario: string;
    hazard: string;
    role: string;
    condition: string;
    safe_action: string;
    checklist: string[];
    consequence: string;
    source: string;
    tags: string[];
    score: number;
    matched_terms: string[];
  } | null;
  evidence_source: "Hosted Retrieval" | "Index Search" | "Demo Evidence";
  retrieval_query: {
    index: string;
    query: string;
    filters: {
      scenario?: string;
      hazard?: string;
      role?: string;
      condition?: string;
    };
  };
  checklist: string[];
  recommended_action: string;
  consequence: string;
  reasoning_summary: string;
  agent_mode: "gemini_configured" | "deterministic_demo_mode";
  mcp_status: "elastic_mcp_configured" | "elastic_index_configured" | "local_demo_fallback";
};

type AgentEvidenceState =
  | { status: "idle" | "loading" }
  | { status: "ready"; data: AgentEvidenceResponse }
  | { status: "error"; message: string };

type SourceTimingFreshness = {
  status: "active" | "stale" | "unknown";
  label: string;
  detail: string;
  toneClass: "status-ready" | "status-confirm" | "status-advisory";
};

type SourceTimingFreshnessOverride = SourceTimingFreshness["status"];

type SourceTimingFreshnessOptions = {
  now?: Date;
  override?: SourceTimingFreshnessOverride | null;
};

const workspaceSectionShortcuts: Readonly<Record<WorkspaceSectionId, string>> = {
  overview: "1",
  grounding: "2",
  walkthrough: "3",
  share: "4",
};
const workspaceSectionByShortcut: Readonly<Record<string, WorkspaceSectionId>> = {
  "1": "overview",
  "2": "grounding",
  "3": "walkthrough",
  "4": "share",
};
const workspaceSectionHashById: Readonly<Record<WorkspaceSectionId, string>> = {
  overview: "#overview",
  grounding: "#grounding",
  walkthrough: "#walkthrough",
  share: "#share",
};
const workspaceSectionLabelById: Readonly<Record<WorkspaceSectionId, string>> = {
  overview: "Overview",
  grounding: "Grounding",
  walkthrough: "Walkthrough",
  share: "Share",
};
const workspaceShortcutLegend =
  "Shortcuts: 1 Overview, 2 Grounding, 3 Walkthrough, 4 Share (when focus is not inside an input).";
const shortcutBlockedElementSelector =
  "input, textarea, select, button, a, [role='button'], [contenteditable='true'], [contenteditable=''], [tabindex='0']";

const documentImportAccept =
  ".txt,.md,.markdown,.json,.csv,.log,.pdf,.doc,.docx,image/*,text/plain,application/json,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ocrImportScaffoldHeader = "OCR import scaffold";
const ocrVerbatimMarker = "Verbatim OCR (paste exact text below):";
const pastedGuidanceTextareaId = "pasted-guidance";
const retrievedSourceLabelInputId = "retrieved-source-label";

const initialDocumentImportState: DocumentImportState = {
  status: "idle",
};

function isShortcutBlockedTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest(shortcutBlockedElementSelector));
}

function parseWorkspaceSectionHash(hash: string): WorkspaceSectionId | null {
  const normalizedHash = hash.replace(/^#/, "").trim().toLowerCase();
  if (!normalizedHash) {
    return null;
  }

  switch (normalizedHash) {
    case "overview":
    case "mission-overview":
      return "overview";
    case "grounding":
    case "mission-grounding":
      return "grounding";
    case "walkthrough":
    case "mission-walkthrough":
      return "walkthrough";
    case "share":
    case "mission-share":
      return "share";
    default:
      return null;
  }
}

export function BeaconApp() {
  const workspaceRef = useRef<HTMLElement | null>(null);
  const workspaceHeaderRef = useRef<HTMLElement | null>(null);
  const groundingBoardRef = useRef<HTMLElement | null>(null);
  const lessonCardRef = useRef<HTMLElement | null>(null);
  const voiceArtifactCardRef = useRef<HTMLElement | null>(null);
  const actionArtifactCardRef = useRef<HTMLElement | null>(null);
  const flowArtifactCardRef = useRef<HTMLElement | null>(null);
  const navigateToWorkspaceSectionRef = useRef<(targetId: WorkspaceSectionId) => void>(() => {});
  const documentImportInputRef = useRef<HTMLInputElement | null>(null);
  const documentIntakeDrawerRef = useRef<HTMLDetailsElement | null>(null);
  const documentContextInputRef = useRef<HTMLTextAreaElement | null>(null);
  const documentSourceLabelInputRef = useRef<HTMLInputElement | null>(null);
  const documentEffectiveTimeInputRef = useRef<HTMLInputElement | null>(null);
  const timingOverrideReasonInputRef = useRef<HTMLInputElement | null>(null);
  const sourceLedgerExportControlsRef = useRef<HTMLDivElement | null>(null);
  const pendingShareArtifactRef = useRef<ShareArtifactTarget | null>(null);
  const pendingShareArtifactOriginRef = useRef<ShareArtifactJumpOrigin | null>(null);
  const pendingShareArtifactSourceTypeRef = useRef<ShareArtifactJumpSourceType | null>(null);
  const shareArtifactHighlightFrameRef = useRef<number | null>(null);
  const shareArtifactHighlightTimeoutRef = useRef<number | null>(null);
  const sourceLedgerHighlightTimeoutRef = useRef<number | null>(null);
  const scenarioSearchInputRef = useRef<HTMLInputElement | null>(null);
  const skipNextWorkspaceHashWriteRef = useRef(false);
  const hasAppliedInitialWorkspaceHashRef = useRef(false);
  const previousMissionStepRef = useRef(0);
  const [form, setForm] = useState<IntakeForm>(initialForm);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(0);
  const [result, setResult] = useState<ActionBundle | null>(null);
  const [agentEvidence, setAgentEvidence] = useState<AgentEvidenceState>({ status: "idle" });
  const [activeMissionStep, setActiveMissionStep] = useState(0);
  const [storyDecisionByStep, setStoryDecisionByStep] = useState<Record<string, string>>({});
  const [quizAnswerByStep, setQuizAnswerByStep] = useState<Record<string, string>>({});
  const [firstPersonViewByStep, setFirstPersonViewByStep] = useState<Record<string, FirstPersonViewId>>({});
  const [videoBeatByStep, setVideoBeatByStep] = useState<Record<string, InteractiveVideoBeatId>>({});
  const [storyFrameByStep, setStoryFrameByStep] = useState<Record<string, number>>({});
  const [routeRuleChoiceByStep, setRouteRuleChoiceByStep] = useState<Record<string, string>>({});
  const [traineeRoleId, setTraineeRoleId] = useState<TraineeRoleId>("teacher");
  const [liveCoachInput, setLiveCoachInput] = useState("");
  const [liveCoachReply, setLiveCoachReply] = useState("");
  const [liveCoachState, setLiveCoachState] = useState<"idle" | "listening" | "thinking" | "error">("idle");
  const [liveCoachSource, setLiveCoachSource] = useState<"openai" | "fallback" | null>(null);
  const [missionStartedAt, setMissionStartedAt] = useState<number | null>(null);
  const [missionElapsedSeconds, setMissionElapsedSeconds] = useState(0);
  const [openAIVoiceState, setOpenAIVoiceState] = useState<"idle" | "generating" | "ready" | "error">("idle");
  const [openAIVoiceUrl, setOpenAIVoiceUrl] = useState("");
  const [openAIVoiceError, setOpenAIVoiceError] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [actionCardCopyState, setActionCardCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [voiceHandoffCopyState, setVoiceHandoffCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [ocrPromptCopyState, setOcrPromptCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [riskSourceExportCopyState, setRiskSourceExportCopyState] = useState<
    "idle" | "copied" | "error"
  >("idle");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [flowCopyState, setFlowCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [routeCardCopyState, setRouteCardCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [judgePathCopyState, setJudgePathCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [workspaceLinkCopyState, setWorkspaceLinkCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [workspaceQuickLinkCopyState, setWorkspaceQuickLinkCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [workspaceQuickLinkCopiedSection, setWorkspaceQuickLinkCopiedSection] = useState<WorkspaceSectionId | null>(
    null,
  );
  const [downloadState, setDownloadState] = useState<"idle" | "downloaded" | "error">("idle");
  const [includeRiskSourceExportInRunbook, setIncludeRiskSourceExportInRunbook] = useState(true);
  const [voiceLayerMode, setVoiceLayerMode] = useState<VoiceArtifact["mode"]>("planner");
  const [documentImportState, setDocumentImportState] =
    useState<DocumentImportState>(initialDocumentImportState);
  const [activeWorkspaceSection, setActiveWorkspaceSection] =
    useState<WorkspaceSectionId>("overview");
  const [highlightedShareArtifact, setHighlightedShareArtifact] = useState<ShareArtifactTarget | null>(null);
  const [highlightedShareArtifactOrigin, setHighlightedShareArtifactOrigin] =
    useState<ShareArtifactJumpOrigin | null>(null);
  const [highlightedShareArtifactSourceType, setHighlightedShareArtifactSourceType] =
    useState<ShareArtifactJumpSourceType | null>(null);
  const [sourceLedgerView, setSourceLedgerView] = useState<SourceLedgerView>("all");
  const [sourceLedgerFreshnessFilter, setSourceLedgerFreshnessFilter] =
    useState<SourceLedgerFreshnessFilter>("all");
  const [isSourceProofOpen, setIsSourceProofOpen] = useState(false);
  const [shareArtifactLaneFilter, setShareArtifactLaneFilter] = useState<ShareArtifactLaneFilter>("all");
  const [isDemoDockLaneEmptyComparingAll, setIsDemoDockLaneEmptyComparingAll] = useState(false);
  const [isShareLaneEmptyComparingAll, setIsShareLaneEmptyComparingAll] = useState(false);
  const [highlightedSourceLedgerItemId, setHighlightedSourceLedgerItemId] = useState<string | null>(null);
  const [isMissionControlExpanded, setIsMissionControlExpanded] = useState(false);
  const [scenarioSearch, setScenarioSearch] = useState("");
  const [coursePanelTab, setCoursePanelTab] = useState<"story" | "map" | "checklist">("story");
  const [isPending, startTransition] = useTransition();
  const deferredLocation = useDeferredValue(form.location);

  const selectedCourse = hazardCourses.find((course) => course.value === form.hazard) ?? hazardCourses[0];
  const activePreset = activePresetIndex !== null ? demoPresets[activePresetIndex] : null;
  const filteredScenarioPresets = demoPresets
    .map((preset, index) => ({ preset, index }))
    .filter(({ preset }) => {
      const query = scenarioSearch.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return [
        preset.label,
        preset.judgeHook,
        preset.routeSkill,
        preset.state.location,
        preset.state.hazard,
        preset.state.role,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  const locationLabel = deferredLocation.trim() || "your area";
  const scenarioLabel = `${selectedCourse.label} mission in ${locationLabel}`;
  const documentBrief = result?.documentBrief ?? null;
  const documentCueSummary = documentBrief
    ? {
        headline: documentBrief.headline,
        summary: documentBrief.summary,
        sourceDescriptor: getDocumentSourceDescriptor(documentBrief),
        actionCue: documentBrief.actionCue ?? null,
        timingCue: documentBrief.timingCue ?? null,
        extractedCount: documentBrief.extractedPoints.length,
        adjustmentCount: documentBrief.planningAdjustments.length,
        checkCount: documentBrief.recommendedChecks.length,
      }
    : null;
  const isOcrScaffoldPending = useMemo(
    () => isOcrScaffoldAwaitingVerbatim(form.documentContext),
    [form.documentContext],
  );
  const hasOcrScaffoldTemplate = useMemo(
    () =>
      normalizeImportedText(form.documentContext)
        .toLowerCase()
        .includes(ocrImportScaffoldHeader.toLowerCase()),
    [form.documentContext],
  );
  const ocrInlineStatus = useMemo(() => {
    if (!hasOcrScaffoldTemplate) {
      return null;
    }

    if (isOcrScaffoldPending) {
      return {
        toneClass: "status-advisory",
        label: "OCR text pending",
        detail:
          'Paste extracted text under "Verbatim OCR" to activate retrieved cues for this mission run.',
      };
    }

    const verbatimText = extractVerbatimOcrText(form.documentContext);
    const wordCount = verbatimText
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean).length;

    return {
      toneClass: "status-ready",
      label: "OCR text ready",
      detail:
        wordCount > 0
          ? `${wordCount} words detected under "Verbatim OCR". Retrieved cues are active.`
          : 'Text detected under "Verbatim OCR". Retrieved cues are active.',
    };
  }, [form.documentContext, hasOcrScaffoldTemplate, isOcrScaffoldPending]);
  const hasStagedOcrScaffold = hasOcrScaffoldTemplate && documentImportState.status === "hook";
  const intakeDocumentPreview = useMemo(() => {
    const pastedContext = form.documentContext.trim();
    if (!pastedContext || isOcrScaffoldPending) {
      return null;
    }

    return buildDocumentBrief(pastedContext);
  }, [form.documentContext, isOcrScaffoldPending]);
  const intakeDocumentSourceDescriptor = useMemo(
    () => getDocumentSourceDescriptor(intakeDocumentPreview),
    [intakeDocumentPreview],
  );
  const builtInGuidanceCount = useMemo(() => getGuidanceDocs(form.hazard).length, [form.hazard]);
  const ocrHandoff = useMemo(() => {
    if (documentImportState.status !== "hook" || !documentImportState.fileName) {
      return null;
    }

    return buildOcrHandoff(documentImportState.fileName, form, locationLabel, selectedCourse.label);
  }, [documentImportState.fileName, documentImportState.status, form, locationLabel, selectedCourse.label]);
  const detectedDocumentSourceLabel = useMemo(
    () => extractSourceLabelCandidate(form.documentContext),
    [form.documentContext],
  );
  const suggestedDocumentSourceLabel = useMemo(
    () => detectedDocumentSourceLabel ?? normalizeSourceLabel(intakeDocumentPreview?.issuingAuthority ?? ""),
    [detectedDocumentSourceLabel, intakeDocumentPreview?.issuingAuthority],
  );
  const detectedDocumentEffectiveTime = useMemo(
    () => extractEffectiveTimeCandidate(form.documentContext),
    [form.documentContext],
  );
  const hasRetrievedDocumentContext = hasRetrievedGuidanceContext(form.documentContext);
  const hasRetrievedSourceLabel = Boolean(form.documentSourceName.trim());
  const hasTraceableRetrievedSourceLabel = isTraceableSourceLabel(form.documentSourceName);
  const hasAuthorityTaggedRetrievedSourceLabel = isAuthorityTaggedSourceLabel(form.documentSourceName);
  const sourceLabelVerificationStatus = useMemo(() => {
    if (!hasRetrievedDocumentContext) {
      return null;
    }

    if (!hasRetrievedSourceLabel) {
      return {
        toneClass: "status-confirm",
        label: "source label missing",
        detail:
          "Add the issuing office, sender, or bulletin name so retrieved guidance stays traceable in trust lanes and exports.",
      };
    }

    if (!hasTraceableRetrievedSourceLabel) {
      return {
        toneClass: "status-confirm",
        label: "source label needs verify",
        detail:
          "Replace the placeholder label with the issuing office, sender, or bulletin name before exporting trust-lane outputs.",
      };
    }

    if (!hasAuthorityTaggedRetrievedSourceLabel) {
      return {
        toneClass: "status-confirm",
        label: "source authority tag missing",
        detail:
          "Add an authority keyword (office, department, barangay, school, or clinic) so source provenance is obvious in trust-lane outputs.",
      };
    }

    return {
      toneClass: "status-ready",
      label: "verified source label",
      detail:
        "Source label includes an issuing authority keyword, so retrieved cues are ready for trust-lane exports.",
    };
  }, [
    hasAuthorityTaggedRetrievedSourceLabel,
    hasRetrievedDocumentContext,
    hasRetrievedSourceLabel,
    hasTraceableRetrievedSourceLabel,
  ]);
  const intakeSourceLabelStatus =
    sourceLabelVerificationStatus?.toneClass === "status-ready" ? null : sourceLabelVerificationStatus;
  const hasManualTimingOverride =
    hasRetrievedDocumentContext && form.documentTimingOverride !== "auto";
  const hasManualTimingOverrideReason = Boolean(form.documentTimingOverrideReason.trim());
  const hasSourceTimingCue = Boolean(
    form.documentEffectiveTime.trim() || intakeDocumentPreview?.timingCue?.trim(),
  );
  const intakeSourceTimingValue =
    form.documentEffectiveTime.trim() || intakeDocumentPreview?.timingCue?.trim() || "";
  const intakeTimingFreshnessStatus = useMemo(() => {
    if (!hasOcrScaffoldTemplate) {
      return null;
    }

    if (isOcrScaffoldPending) {
      return {
        toneClass: "status-advisory",
        label: "timing pending",
        detail:
          "Paste OCR text first, then add source timing so Beacon can score freshness for this run.",
      };
    }

    const manualOverride =
      form.documentTimingOverride !== "auto" ? form.documentTimingOverride : null;
    const timingFreshness = intakeSourceTimingValue
      ? getSourceTimingFreshness(intakeSourceTimingValue, {
          override: manualOverride,
        })
      : manualOverride
        ? buildManualSourceTimingFreshness(manualOverride)
        : null;

    if (timingFreshness) {
      return {
        toneClass: timingFreshness.toneClass,
        label: timingFreshness.label,
        detail: timingFreshness.detail,
      };
    }

    return {
      toneClass: "status-advisory",
      label: "timing cue missing",
      detail:
        "Add an effective time or timing window so retrieved-source freshness can be carried into mission outputs.",
    };
  }, [
    form.documentTimingOverride,
    hasOcrScaffoldTemplate,
    intakeSourceTimingValue,
    isOcrScaffoldPending,
  ]);
  const requiresTimingOverrideReason =
    hasRetrievedDocumentContext && form.documentTimingOverride !== "auto" && hasSourceTimingCue;
  const isTimingOverrideReasonMissing =
    requiresTimingOverrideReason && !form.documentTimingOverrideReason.trim();
  const retrievedIntakeChecklist = useMemo(
    () =>
      buildRetrievedIntakeChecklist({
        documentImportState,
        hasRetrievedDocumentContext,
        isOcrScaffoldPending,
        hasTraceableSourceLabel: hasTraceableRetrievedSourceLabel,
        hasAuthorityTaggedSourceLabel: hasAuthorityTaggedRetrievedSourceLabel,
        hasSourceTimingCue,
        hasManualTimingOverride,
        hasManualTimingOverrideReason,
      }),
    [
      documentImportState,
      hasRetrievedDocumentContext,
      isOcrScaffoldPending,
      hasAuthorityTaggedRetrievedSourceLabel,
      hasTraceableRetrievedSourceLabel,
      hasSourceTimingCue,
      hasManualTimingOverride,
      hasManualTimingOverrideReason,
    ],
  );
  const retrievedLaneReadiness = useMemo(
    () =>
      getRetrievedLaneReadiness(documentImportState, {
        hasRetrievedDocumentContext,
        isOcrScaffoldPending,
        requiresTimingOverrideReason,
        isTimingOverrideReasonMissing,
      }),
    [
      documentImportState,
      hasRetrievedDocumentContext,
      isOcrScaffoldPending,
      isTimingOverrideReasonMissing,
      requiresTimingOverrideReason,
    ],
  );
  const missionBuildMode: MissionBuildMode = useMemo(() => {
    if (isOcrScaffoldPending) {
      return {
        state: "hook-pending",
        toneClass: "status-advisory",
        badgeLabel: "OCR text pending",
        headline: "Guidance-pack run (OCR scaffold not filled yet)",
        detail: documentImportState.fileName
          ? `${documentImportState.fileName} has an OCR scaffold, but the Verbatim OCR block is still empty. Paste extracted text under the marker to activate retrieved cues in this mission build.`
          : "An OCR scaffold is attached, but the Verbatim OCR block is still empty. Paste extracted text under the marker to activate retrieved cues in this mission build.",
        showHookAction: true,
      };
    }

    if (documentImportState.status === "hook" && !hasRetrievedDocumentContext) {
      return {
        state: "hook-pending",
        toneClass: "status-advisory",
        badgeLabel: "hook pending",
        headline: "Guidance-pack run (OCR text not attached yet)",
        detail: documentImportState.fileName
          ? `${documentImportState.fileName} is staged as an OCR hook. Paste extracted text to activate retrieved cues in this mission build.`
          : "A source file is staged as an OCR hook. Paste extracted text to activate retrieved cues in this mission build.",
        showHookAction: true,
      };
    }

    if (hasRetrievedDocumentContext) {
      return {
        state: "source-aware",
        toneClass: "tone-retrieved",
        badgeLabel: "source-aware",
        headline: "Source-aware run",
        detail:
          "This build will combine official facts, retrieved guidance, and generated adaptations with trust-lane separation in outputs.",
        showHookAction: false,
      };
    }

    return {
      state: "guidance-pack",
      toneClass: "status-ready",
      badgeLabel: "guidance pack",
      headline: "Guidance-pack run",
      detail:
        "This build uses official facts, built-in retrieved guidance, and generated adaptations. Add a bulletin or OCR text to localize it further.",
      showHookAction: false,
    };
  }, [
    documentImportState.fileName,
    documentImportState.status,
    hasRetrievedDocumentContext,
    isOcrScaffoldPending,
  ]);
  const intakeSourcePreview = useMemo(
    () =>
      buildIntakeSourcePreview(
        form,
        locationLabel,
        selectedCourse.label,
        intakeDocumentPreview,
        builtInGuidanceCount,
      ),
    [builtInGuidanceCount, form, intakeDocumentPreview, locationLabel, selectedCourse.label],
  );

  const groundingReadiness = useMemo(() => {
    if (!result) {
      return null;
    }

    const statusItems = [...result.planningInputs, ...result.trustSnapshot.items];
    const readyCount = statusItems.filter((item) => item.status === "ready").length;
    const confirmCount = statusItems.filter((item) => item.status === "confirm").length;
    const advisoryCount = statusItems.filter((item) => item.status === "advisory").length;
    const nextConfirm = statusItems.find((item) => item.status === "confirm");

    return {
      readyCount,
      confirmCount,
      advisoryCount,
      nextConfirm,
      sourceCoverage: [
        {
          type: "official" as const,
          label: "Official facts",
          count: result.sources.officialFacts.length,
        },
        {
          type: "retrieved" as const,
          label: "Retrieved guidance",
          count: result.sources.retrievedGuidance.length,
        },
        {
          type: "generated" as const,
          label: "Planner support",
          count: result.sources.generatedNotes.length,
        },
      ],
    };
  }, [result]);

  const evidenceSpotlight = useMemo(() => {
    if (!result) {
      return null;
    }

    return buildEvidenceSpotlight(result);
  }, [result]);

  const sourceLedger = useMemo(() => {
    if (!result) {
      return [];
    }

    return buildSourceLedger(result);
  }, [result]);
  const sourceLedgerByView = useMemo(
    () =>
      sourceLedger.map((lane) => ({
        ...lane,
        items:
          sourceLedgerView === "plan-impact"
            ? lane.items.filter((item) => isPlanImpactSource(item))
            : lane.items,
      })),
    [sourceLedger, sourceLedgerView],
  );
  const visibleSourceLedger = useMemo(
    () =>
      sourceLedgerByView.map((lane) => ({
        ...lane,
        items:
          sourceLedgerFreshnessFilter === "risk"
            ? lane.items.filter((item) => {
                const freshness = getSourceTimingFreshness(item.effectiveWindow, {
                  override: item.timingFreshnessOverride,
                });
                return freshness?.status === "stale" || freshness?.status === "unknown";
              })
            : lane.items,
      })),
    [sourceLedgerByView, sourceLedgerFreshnessFilter],
  );
  const sourceLedgerVisibleCount = useMemo(
    () => visibleSourceLedger.reduce((count, lane) => count + lane.items.length, 0),
    [visibleSourceLedger],
  );
  const sourceLedgerPlanImpactCount = useMemo(
    () => sourceLedger.reduce((count, lane) => count + lane.items.filter((item) => isPlanImpactSource(item)).length, 0),
    [sourceLedger],
  );
  const sourceLedgerTimingSummary = useMemo(() => {
    const freshnessCounts: Record<SourceTimingFreshness["status"], number> = {
      active: 0,
      stale: 0,
      unknown: 0,
    };
    let untimedCount = 0;

    sourceLedgerByView.forEach((lane) => {
      lane.items.forEach((item) => {
        const freshness = getSourceTimingFreshness(item.effectiveWindow, {
          override: item.timingFreshnessOverride,
        });
        if (!freshness) {
          untimedCount += 1;
          return;
        }

        freshnessCounts[freshness.status] += 1;
      });
    });

    const timedCount = freshnessCounts.active + freshnessCounts.stale + freshnessCounts.unknown;

    return {
      ...freshnessCounts,
      timedCount,
      untimedCount,
      riskCount: freshnessCounts.stale + freshnessCounts.unknown,
    };
  }, [sourceLedgerByView]);
  const riskSourceExportBrief = useMemo(
    () => buildRiskSourceExportBrief(sourceLedgerByView, sourceLedgerView),
    [sourceLedgerByView, sourceLedgerView],
  );
  const sourceLedgerEmptyLaneMessage =
    sourceLedgerFreshnessFilter === "risk"
      ? "No stale or unknown timing item in this lane for the current view."
      : sourceLedgerView === "plan-impact"
        ? "No direct plan-impact item in this lane for the current run."
        : "No source item in this lane for the current run.";
  const shareArtifactPlanImpactTargetsBySource = useMemo(() => {
    const targetsBySource: Record<ShareArtifactJumpSourceType, Set<ShareArtifactTarget>> = {
      official: new Set<ShareArtifactTarget>(),
      retrieved: new Set<ShareArtifactTarget>(),
      generated: new Set<ShareArtifactTarget>(),
    };

    sourceLedger.forEach((lane) => {
      lane.items.filter((item) => isPlanImpactSource(item)).forEach((item) => {
        getPlanImpactArtifactTargets(item).forEach((target) => {
          targetsBySource[lane.sourceType].add(target);
        });
      });
    });

    return targetsBySource;
  }, [sourceLedger]);
  const visibleShareArtifactTargets = useMemo(() => {
    if (shareArtifactLaneFilter === "all") {
      return new Set<ShareArtifactTarget>(["voice", "action-card", "flow"]);
    }

    return shareArtifactPlanImpactTargetsBySource[shareArtifactLaneFilter];
  }, [shareArtifactLaneFilter, shareArtifactPlanImpactTargetsBySource]);
  const showShareFilteredEmptyState = shareArtifactLaneFilter !== "all" && visibleShareArtifactTargets.size === 0;
  const showShareAllArtifactsComparison = showShareFilteredEmptyState && isShareLaneEmptyComparingAll;
  const showVoiceArtifact = showShareAllArtifactsComparison || visibleShareArtifactTargets.has("voice");
  const showActionCardArtifact = showShareAllArtifactsComparison || visibleShareArtifactTargets.has("action-card");
  const showFlowArtifact = showShareAllArtifactsComparison || visibleShareArtifactTargets.has("flow");
  const shareComparisonVisibleArtifactCount = [showVoiceArtifact, showActionCardArtifact, showFlowArtifact].filter(
    Boolean,
  ).length;
  const shareLaneScopedCountLine =
    shareArtifactLaneFilter === "all"
      ? null
      : showShareAllArtifactsComparison
        ? `${formatCountLabel(visibleShareArtifactTargets.size, "impacted artifact")} | ${formatCountLabel(
            shareComparisonVisibleArtifactCount,
            "comparison-visible artifact",
          )}`
        : `${formatCountLabel(visibleShareArtifactTargets.size, "impacted artifact")}`;
  const visibleShareArtifactCountLabel =
    shareArtifactLaneFilter === "all"
      ? `${formatCountLabel(visibleShareArtifactTargets.size, "artifact")} visible`
      : shareLaneScopedCountLine ?? `${formatCountLabel(visibleShareArtifactTargets.size, "artifact")} impacted`;
  const shareArtifactLaneScopeSubtitle =
    shareArtifactLaneFilter === "all"
      ? null
      : `Lane scope: ${
          shareLaneScopedCountLine ??
          `${formatCountLabel(visibleShareArtifactTargets.size, "impacted artifact")}`
        }`;
  const shareLaneEmptyComparisonCountLine = showShareAllArtifactsComparison ? shareLaneScopedCountLine : null;
  const laneEmptyEvidenceItemCount =
    shareArtifactLaneFilter === "all"
      ? 0
      : getSourceLedgerItemCountForLane(sourceLedger, shareArtifactLaneFilter);
  const laneEmptyEvidenceAvailabilityLine =
    shareArtifactLaneFilter === "all"
      ? null
      : laneEmptyEvidenceItemCount > 0
        ? `${formatCountLabel(laneEmptyEvidenceItemCount, "source-ledger item")} ready for evidence jump.`
        : "No source-ledger items ready for evidence jump yet.";
  const laneEmptyEvidenceAnchorId =
    shareArtifactLaneFilter === "all"
      ? null
      : getFirstSourceLedgerAnchorIdForLane(sourceLedger, shareArtifactLaneFilter);
  const shareVoiceLaneEvidenceAnchorId =
    shareArtifactLaneFilter === "all"
      ? null
      : getPlanImpactSourceLedgerAnchorIdForDemoOutput(sourceLedger, shareArtifactLaneFilter, "voice");
  const shareActionCardLaneEvidenceAnchorId =
    shareArtifactLaneFilter === "all"
      ? null
      : getPlanImpactSourceLedgerAnchorIdForDemoOutput(sourceLedger, shareArtifactLaneFilter, "action-card");
  const shareFlowLaneEvidenceAnchorId =
    shareArtifactLaneFilter === "all"
      ? null
      : getPlanImpactSourceLedgerAnchorIdForDemoOutput(sourceLedger, shareArtifactLaneFilter, "flow");
  const shareArtifactEvidenceLaneLabel =
    shareArtifactLaneFilter === "all" ? null : formatSourceTypeLabel(shareArtifactLaneFilter);
  const shareArtifactLaneImpactHelperLine =
    shareArtifactLaneFilter === "all"
      ? null
      : shareArtifactLaneFilter === "official"
        ? "Official lane is driving this artifact view with verified alerts and advisories."
        : shareArtifactLaneFilter === "retrieved"
          ? "Retrieved lane is driving this artifact view with imported guidance and document cues."
          : "Generated lane is driving this artifact view with Beacon-composed actions and phrasing.";
  const shareArtifactComparisonReasonByTarget =
    shareArtifactLaneFilter === "all" || !showShareAllArtifactsComparison
      ? null
      : {
          voice: `Voice briefing stays visible for comparison while ${formatSourceTypeLabel(shareArtifactLaneFilter).toLowerCase()} lane remains selected; no direct plan-impact tag in this lane for this run.`,
          "action-card": `Portable action card stays visible for comparison while ${formatSourceTypeLabel(shareArtifactLaneFilter).toLowerCase()} lane remains selected; no direct plan-impact tag in this lane for this run.`,
          flow: `Flow view stays visible for comparison while ${formatSourceTypeLabel(shareArtifactLaneFilter).toLowerCase()} lane remains selected; no direct plan-impact tag in this lane for this run.`,
        };
  const hasVisibleShareArtifacts = showVoiceArtifact || showActionCardArtifact || showFlowArtifact;
  const highlightedArtifactJumpCaption =
    highlightedShareArtifactOrigin
      ? `Opened from ${formatShareArtifactJumpOriginLabel(highlightedShareArtifactOrigin)} jump.`
      : null;
  const retrievedLaneShareStatusLabel = `Retrieved lane: ${retrievedLaneReadiness.label}`;
  const runbookRiskBlockShareStatus = !riskSourceExportBrief
    ? { label: "risk block unavailable", toneClass: "status-advisory" as const }
    : includeRiskSourceExportInRunbook
      ? { label: "risk block included", toneClass: "status-ready" as const }
      : { label: "risk block excluded", toneClass: "status-advisory" as const };

  const actionCardArtifact = useMemo(() => {
    if (!result) {
      return null;
    }

    return buildPortableActionCard(result);
  }, [result]);
  const flowArtifact = useMemo(() => {
    if (!result) {
      return null;
    }

    return buildPortableFlowArtifact(result);
  }, [result]);
  const actionCardSourceProvenanceNeedsSourceLabel = Boolean(
    actionCardArtifact &&
      (actionCardArtifact.sourceProvenanceToneLabel === "missing" ||
        actionCardArtifact.sourceProvenanceToneLabel === "needs verify"),
  );
  const flowSourceProvenanceNeedsSourceLabel = Boolean(
    flowArtifact &&
      (flowArtifact.sourceProvenanceToneLabel === "missing" ||
        flowArtifact.sourceProvenanceToneLabel === "needs verify"),
  );
  const voiceSourceProvenanceStatus = useMemo(
    () => (result ? buildPortableActionSourceProvenanceStatus(result) : null),
    [result],
  );
  const voiceSourceProvenanceNeedsSourceLabel = Boolean(
    voiceSourceProvenanceStatus &&
      (voiceSourceProvenanceStatus.toneLabel === "missing" ||
        voiceSourceProvenanceStatus.toneLabel === "needs verify"),
  );
  const demoDockSourceProvenanceNeedsSourceLabel = voiceSourceProvenanceNeedsSourceLabel;

  const voicePlaybackConfig = useMemo(
    () => (result ? getVoicePlaybackConfig(result.voiceBriefing.language) : null),
    [result],
  );
  const voiceArtifact = useMemo(
    () => (result ? buildVoiceArtifact(result, voiceLayerMode === "source-aware") : null),
    [result, voiceLayerMode],
  );
  const voicePlaybackDetail = voicePlaybackConfig
    ? `${voicePlaybackConfig.langTag} voice at ${voicePlaybackConfig.rate.toFixed(2)}x speed`
    : "";
  const voiceHandoffTiming = useMemo(() => {
    if (!voiceArtifact) {
      return null;
    }

    return estimateVoiceScriptTiming(voiceArtifact.script, voicePlaybackConfig?.rate ?? 1);
  }, [voiceArtifact, voicePlaybackConfig]);
  const voiceDemoTimingStatus = useMemo(
    () => getVoiceDemoTimingStatus(voiceHandoffTiming, voiceDemoClipTarget),
    [voiceHandoffTiming],
  );
  const voiceTrimSuggestion = useMemo(() => {
    if (!voiceArtifact || voiceArtifact.mode !== "planner") {
      return null;
    }

    return buildVoiceTrimSuggestion(voiceArtifact.script, voicePlaybackConfig?.rate ?? 1, voiceDemoClipTarget);
  }, [voiceArtifact, voicePlaybackConfig]);
  const voiceTrimTimingStatus = useMemo(
    () =>
      voiceTrimSuggestion
        ? getVoiceDemoTimingStatus(voiceTrimSuggestion.timing, voiceDemoClipTarget)
        : null,
    [voiceTrimSuggestion],
  );
  const voiceHandoffBrief = useMemo(() => {
    if (!result || !voiceArtifact || !voiceSourceProvenanceStatus) {
      return "";
    }

    const exportTrustLaneChips = buildTrustLaneChipMarkdown(["official", "retrieved", "generated"]);
    const exportSourceReferences =
      voiceArtifact.mode === "source-aware" ? buildExportSourceReferenceLines(result) : [];
    const voiceTrustOrder =
      voiceArtifact.mode === "source-aware"
        ? "Voice trust order: Official trigger -> Retrieved guidance -> Generated recommendations."
        : "Voice trust order: Generated recommendations only.";

    return [
      "Voice handoff script",
      "",
      exportTrustLaneChips,
      voiceTrustOrder,
      `Mode: ${voiceArtifact.modeLabel}`,
      `Language: ${result.voiceBriefing.language}`,
      `Estimated speaking time: ${voiceHandoffTiming ? `${voiceHandoffTiming.label} (${voiceHandoffTiming.wordCount} words, ${voiceHandoffTiming.playbackRateLabel})` : "Not available"}`,
      `Source provenance: ${voiceSourceProvenanceStatus.exportLine}`,
      voiceDemoTimingStatus.exportLine,
      ...(exportSourceReferences.length > 0 ? ["", ...exportSourceReferences] : []),
      "",
      voiceArtifact.script,
    ].join("\n");
  }, [result, voiceArtifact, voiceSourceProvenanceStatus, voiceHandoffTiming, voiceDemoTimingStatus]);
  const trimmedVoiceHandoffBrief = useMemo(() => {
    if (!result || !voiceArtifact || !voiceTrimSuggestion || !voiceSourceProvenanceStatus) {
      return "";
    }

    const exportTrustLaneChips = buildTrustLaneChipMarkdown(["official", "retrieved", "generated"]);
    const trimStatusLine =
      voiceTrimTimingStatus?.exportLine ??
      `Demo target window: ${voiceDemoClipTarget.minSeconds}-${voiceDemoClipTarget.maxSeconds}s. Trim timing estimate unavailable.`;

    return [
      "Voice handoff script (~45s trim)",
      "",
      exportTrustLaneChips,
      "Voice trust order: Generated recommendations only.",
      `Mode: ${voiceArtifact.modeLabel}`,
      `Language: ${result.voiceBriefing.language}`,
      `Estimated speaking time: ${voiceTrimSuggestion.timing.label} (${voiceTrimSuggestion.timing.wordCount} words, ${voiceTrimSuggestion.timing.playbackRateLabel})`,
      `Source provenance: ${voiceSourceProvenanceStatus.exportLine}`,
      trimStatusLine,
      `Trim helper: Removed ${formatCountLabel(voiceTrimSuggestion.removedSentenceCount, "line")} (${formatCountLabel(voiceTrimSuggestion.removedWordCount, "word")}) from the tail of the generated script.`,
      "",
      voiceTrimSuggestion.script,
    ].join("\n");
  }, [result, voiceArtifact, voiceSourceProvenanceStatus, voiceTrimSuggestion, voiceTrimTimingStatus]);

  const shareBrief = useMemo(() => {
    if (!result) {
      return "";
    }

    const firstDestination = result.evacuation.destinations[0];
    const exportTrustLaneChips = buildTrustLaneChipMarkdown(["official", "retrieved", "generated"]);
    const voiceTrustOrder =
      voiceArtifact?.mode === "source-aware"
        ? "Voice trust order: Official trigger -> Retrieved guidance -> Generated recommendations."
        : "Voice trust order: Generated recommendations only.";
    const officialCount = result.sources.officialFacts.length;
    const retrievedCount = result.sources.retrievedGuidance.length;
    const generatedCount = result.sources.generatedNotes.length;
    const documentSourceFacts = getDocumentSourceFacts(result.documentBrief);
    const retrievedSourceTiming = getRetrievedSourceTiming(result);
    const retrievedTimingOverride = getRetrievedSourceTimingOverride(result);
    const retrievedTimingOverrideReason = getRetrievedSourceTimingOverrideReason(result);
    const retrievedTimingFreshness = getSourceTimingFreshness(retrievedSourceTiming, {
      override: retrievedTimingOverride,
    });
    const exportSourceReferences = buildExportSourceReferenceLines(result);

    return [
      result.actionCardTitle,
      "",
      exportTrustLaneChips,
      voiceTrustOrder,
      "",
      `Summary: ${result.summary}`,
      `Mode: ${result.planningPosture.headline}`,
      `Move trigger: ${
        result.trustSnapshot.items.find((item) => item.title === "Move trigger")?.detail ??
        result.evacuation.decision
      }`,
      `First destination: ${
        firstDestination
          ? `${firstDestination.name} (${firstDestination.etaMinutes} min est, ${firstDestination.distanceKm.toFixed(1)} km)`
          : "Choose the safest reachable inland or elevated location."
      }`,
      `Immediate actions: ${result.immediateActions.slice(0, 3).join(" ")}`,
      `Verify next: ${result.verification.slice(0, 2).join(" ")}`,
      `Voice briefing: ${voiceArtifact?.modeLabel ?? "Generated briefing"} in ${result.voiceBriefing.language}.`,
      ...documentSourceFacts.map((fact) => `${fact.label}: ${fact.headline}.`),
      retrievedSourceTiming ? `Source timing: ${retrievedSourceTiming}.` : null,
      retrievedTimingFreshness ? `Timing freshness: ${retrievedTimingFreshness.detail}` : null,
      retrievedTimingOverrideReason ? `Timing override note: ${retrievedTimingOverrideReason}.` : null,
      evidenceSpotlight
        ? `Evidence spotlight: ${evidenceSpotlight.title}. ${evidenceSpotlight.summary}`
        : null,
      ...exportSourceReferences,
      `Source split: ${officialCount} official, ${retrievedCount} retrieved, ${generatedCount} generated.`,
    ]
      .filter(Boolean)
      .join("\n");
  }, [evidenceSpotlight, result, voiceArtifact]);

  async function handleCopyPortableActionCard() {
    if (!actionCardArtifact) {
      return;
    }

    try {
      await navigator.clipboard.writeText(actionCardArtifact.markdown);
      setActionCardCopyState("copied");
    } catch {
      setActionCardCopyState("error");
    }
  }

  async function handleCopyVoiceHandoff() {
    if (!voiceHandoffBrief) {
      return;
    }

    try {
      await navigator.clipboard.writeText(voiceHandoffBrief);
      setVoiceHandoffCopyState("copied");
    } catch {
      setVoiceHandoffCopyState("error");
    }
  }

  async function handleCopyTrimmedVoiceHandoff() {
    if (!trimmedVoiceHandoffBrief) {
      return;
    }

    try {
      await navigator.clipboard.writeText(trimmedVoiceHandoffBrief);
      setVoiceHandoffCopyState("copied");
    } catch {
      setVoiceHandoffCopyState("error");
    }
  }

  async function handleCopyOcrPrompt() {
    if (!ocrHandoff) {
      return;
    }

    try {
      await navigator.clipboard.writeText(ocrHandoff.prompt);
      setOcrPromptCopyState("copied");
    } catch {
      setOcrPromptCopyState("error");
    }
  }

  async function handleCopyRiskSourceExport() {
    if (!riskSourceExportBrief) {
      return;
    }

    try {
      await navigator.clipboard.writeText(riskSourceExportBrief);
      setRiskSourceExportCopyState("copied");
    } catch {
      setRiskSourceExportCopyState("error");
    }
  }

  function handleInsertOcrTemplate() {
    if (!ocrHandoff || documentImportState.status !== "hook" || !documentImportState.fileName) {
      return;
    }

    const templateMerge = mergeDocumentContextWithTemplate(form.documentContext, ocrHandoff.pasteTemplate);

    updateField("documentContext", templateMerge.nextContext);
    setDocumentImportState({
      status: "hook",
      fileName: documentImportState.fileName,
      message: templateMerge.inserted
        ? `${documentImportState.fileName} now has an OCR intake scaffold. Paste extracted text under "Verbatim OCR" to activate the retrieved-guidance lane.`
        : `${documentImportState.fileName} already has an OCR intake scaffold in the retrieved-guidance lane.`,
    });
  }

  function handleLoadDemoRetrievedSource() {
    const demoSource = buildDemoRetrievedSource(form, locationLabel);

    updateField("documentContext", demoSource.context);
    updateField("documentSourceName", demoSource.sourceName);
    updateField("documentEffectiveTime", demoSource.effectiveTime);
    updateField("documentTimingOverride", "auto");
    updateField("documentTimingOverrideReason", "");
    setOcrPromptCopyState("idle");
    setDocumentImportState({
      status: "loaded",
      fileName: "demo-retrieved-source.txt",
      message:
        "Demo bulletin loaded into the retrieved-guidance lane. Replace it with a real bulletin or OCR extract before using Beacon outside a demo.",
    });
  }

  async function handleCopyShareBrief() {
    if (!shareBrief) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareBrief);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function handleCopyFlowView() {
    if (!flowArtifact) {
      return;
    }

    try {
      await navigator.clipboard.writeText(flowArtifact.body);
      setFlowCopyState("copied");
    } catch {
      setFlowCopyState("error");
    }
  }

  async function handleCopyRouteTrainerCard() {
    if (!activeFirstPersonScene) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeFirstPersonScene.routeTrainer.saveText);
      setRouteCardCopyState("copied");
    } catch {
      setRouteCardCopyState("error");
    }
  }

  async function askLiveCoach(message = liveCoachInput) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || !activeStep || !activeFirstPersonScene || !selectedStoryDecision) {
      return;
    }

    if (activeTraineeRole.id === "student") {
      setLiveCoachReply("Student mode is follow-only. Listen for the route, stay with the group, and reach handoff before the timer ends.");
      setLiveCoachSource("fallback");
      setLiveCoachState("idle");
      return;
    }

    if (activeFirstPersonScene.viewId === "entry") {
      setLiveCoachReply("Not yet. First read the hazard, then move to the route before giving a command.");
      setLiveCoachSource("fallback");
      setLiveCoachState("idle");
      return;
    }

    setLiveCoachInput(trimmedMessage);
    setLiveCoachState("thinking");

    try {
      const response = await fetch("/api/live-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmedMessage,
          stepTitle: activeStep.title,
          routeTitle: activeFirstPersonScene.routeTrainer.title,
          selectedDecision: selectedStoryDecision.label,
          ruleChoice: activeRouteRuleChoice?.label,
          location: form.location,
          hazard: form.hazard,
        }),
      });
      const data = (await response.json()) as {
        reply?: string;
        source?: "openai" | "fallback";
      };
      const reply = data.reply ?? "Check the route, headcount, and responder lane before moving.";

      setLiveCoachReply(reply);
      setLiveCoachSource(data.source ?? "fallback");
      setLiveCoachState("idle");
    } catch {
      setLiveCoachReply("I could not reach the coach. Use the checklist: keep responder access open, move away from the hazard, and confirm the count.");
      setLiveCoachSource("fallback");
      setLiveCoachState("error");
    }
  }

  async function generateOpenAIVoice(voiceText: string) {
    const trimmedVoiceText = voiceText.trim();

    if (!trimmedVoiceText) {
      return;
    }

    setOpenAIVoiceState("generating");
    setOpenAIVoiceError("");

    try {
      const response = await fetch("/api/voice-brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: trimmedVoiceText,
          voice: "marin",
          instructions:
            "Voice: realistic emergency drill coach over a handheld radio. Calm, human, urgent but not theatrical. Pace around 145 words per minute. Use short commands, one breath between beats, and scenario texture from the selected hazard: smoke direction, inland movement, rising water, covered gate, cooling room, responder access, or headcount. Do not add sirens, sound effects, panic, gore, or claims of official certainty. Clearly imply this is AI-generated training audio.",
        }),
      });
      const data = (await response.json()) as {
        audioUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.audioUrl) {
        setOpenAIVoiceError(data.error ?? "OpenAI voice generation failed.");
        setOpenAIVoiceState("error");
        return;
      }

      setOpenAIVoiceUrl(data.audioUrl);
      setOpenAIVoiceState("ready");
    } catch (voiceError) {
      setOpenAIVoiceError(voiceError instanceof Error ? voiceError.message : "OpenAI voice generation failed.");
      setOpenAIVoiceState("error");
    }
  }

  async function handleGenerateOpenAIVoice() {
    if (!activeStep || !activeIncidentScene || !activeFirstPersonScene || !selectedStoryDecision) {
      return;
    }

    const voiceText =
      liveCoachReply ||
      buildScenarioVoiceScript({
        stepLabel: activeStep.label,
        hazard: form.hazard,
        location: form.location,
        role: form.role,
        scene: activeIncidentScene,
        drill: activeFirstPersonScene,
        decision: selectedStoryDecision,
        routeRule: activeRouteRuleChoice?.label ?? "keep the response lane clear",
        beatCaption: activeVideoBeat?.caption ?? activeFirstPersonScene.objective,
      });

    await generateOpenAIVoice(voiceText);
  }

  function handleStartLiveCoachVoice() {
    if (typeof window === "undefined") {
      return;
    }

    if (activeTraineeRole.id === "student" || activeFirstPersonScene?.viewId === "entry") {
      setLiveCoachReply(
        activeTraineeRole.id === "student"
          ? "Student mode is follow-only. Do not speak; follow the lead and finish before time runs out."
          : "Speak after you move into the route or handoff window.",
      );
      setLiveCoachSource("fallback");
      setLiveCoachState("idle");
      return;
    }

    const speechWindow = window as Window & {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onstart: (() => void) | null;
        onerror: (() => void) | null;
        onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onstart: (() => void) | null;
        onerror: (() => void) | null;
        onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        start: () => void;
      };
    };
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setLiveCoachReply("This browser does not expose speech recognition. Type your route question instead.");
      setLiveCoachSource("fallback");
      setLiveCoachState("error");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = voicePlaybackConfig?.langTag ?? "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setLiveCoachState("listening");
    recognition.onerror = () => setLiveCoachState("error");
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setLiveCoachInput(transcript);
      void askLiveCoach(transcript);
    };
    recognition.start();
  }

  async function handleCopyJudgeDemoPath(brief: string) {
    if (!brief) {
      return;
    }

    try {
      await navigator.clipboard.writeText(brief);
      setJudgePathCopyState("copied");
    } catch {
      setJudgePathCopyState("error");
    }
  }

  async function handleCopyWorkspaceSectionLink() {
    if (typeof window === "undefined") {
      return;
    }

    const sectionHash = workspaceSectionHashById[resolvedActiveWorkspaceSection];
    const shareableSectionUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${sectionHash}`;

    try {
      await navigator.clipboard.writeText(shareableSectionUrl);
      setWorkspaceLinkCopyState("copied");
    } catch {
      setWorkspaceLinkCopyState("error");
    }
  }

  async function handleCopyWorkspaceQuickLink(sectionId: WorkspaceSectionId) {
    if (typeof window === "undefined") {
      return;
    }

    const sectionHash = workspaceSectionHashById[sectionId];
    const shareableSectionUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${sectionHash}`;

    try {
      await navigator.clipboard.writeText(shareableSectionUrl);
      setWorkspaceQuickLinkCopiedSection(sectionId);
      setWorkspaceQuickLinkCopyState("copied");
    } catch {
      setWorkspaceQuickLinkCopiedSection(sectionId);
      setWorkspaceQuickLinkCopyState("error");
    }
  }

  function handleDownloadRunbook(judgeBrief = "") {
    if (!result || !voiceArtifact) {
      return;
    }

    try {
      const markdown = buildMarkdownRunbook(
        result,
        shareBrief,
        form,
        voiceArtifact,
        includeRiskSourceExportInRunbook ? riskSourceExportBrief : "",
        judgeBrief,
      );
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildRunbookFilename(result.actionCardTitle);
      link.click();
      URL.revokeObjectURL(url);
      setDownloadState("downloaded");
    } catch {
      setDownloadState("error");
    }
  }

  async function handlePlayVoiceBriefing() {
    if (!voiceArtifact) {
      return;
    }

    await generateOpenAIVoice(voiceArtifact.script);
  }

  function handleToggleVoicePlayback() {
    void handlePlayVoiceBriefing();
  }

  function handlePlaySimulationGuide() {
    const intro = buildSimulationGuideScript({
      drillName: activePreset?.label ?? selectedCourse.label,
      role: activeTraineeRole,
      hazard: form.hazard,
      objective: activeFirstPersonScene?.objective ?? selectedCourse.promise,
      route: activeFirstPersonScene?.routeCue.route ?? "choose the safest visible route",
      speakWindowOpen: Boolean(isSpeakOpportunity),
      secondsLeft: missionTimer?.remainingSeconds ?? null,
    });

    void generateOpenAIVoice(intro);
  }

  const handleSetSourceLedgerView = (nextView: SourceLedgerView) => {
    setSourceLedgerView(nextView);
    setRiskSourceExportCopyState("idle");
  };

  const handleSetSourceLedgerFreshnessFilter = (nextFilter: SourceLedgerFreshnessFilter) => {
    setSourceLedgerFreshnessFilter(nextFilter);
    setRiskSourceExportCopyState("idle");
  };

  const setWorkspaceSection = useCallback((targetId: WorkspaceSectionId) => {
    setActiveWorkspaceSection(targetId);
    setWorkspaceLinkCopyState("idle");
    setWorkspaceQuickLinkCopyState("idle");
    setWorkspaceQuickLinkCopiedSection(null);
  }, []);

  const highlightSourceLedgerItem = (anchorId: string) => {
    if (sourceLedgerHighlightTimeoutRef.current !== null) {
      window.clearTimeout(sourceLedgerHighlightTimeoutRef.current);
      sourceLedgerHighlightTimeoutRef.current = null;
    }

    setHighlightedSourceLedgerItemId(anchorId);
    sourceLedgerHighlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedSourceLedgerItemId((current) => (current === anchorId ? null : current));
      sourceLedgerHighlightTimeoutRef.current = null;
    }, 1400);
  };

  const jumpToSourceLedgerItem = (anchorId: string | null) => {
    handleSetSourceLedgerView("all");
    handleSetSourceLedgerFreshnessFilter("all");
    setWorkspaceSection("grounding");

    const scrollToGrounding = () => {
      groundingBoardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    };

    const attemptJump = (attempt: number) => {
      if (!anchorId) {
        scrollToGrounding();
        return;
      }

      const target = document.getElementById(anchorId);
      if (target) {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
        highlightSourceLedgerItem(anchorId);
        return;
      }

      if (attempt < 1) {
        window.requestAnimationFrame(() => attemptJump(attempt + 1));
        return;
      }

      scrollToGrounding();
    };

    window.requestAnimationFrame(() => attemptJump(0));
  };

  const jumpToSourceLedgerLane = (sourceType: "official" | "retrieved" | "generated") => {
    const lane = sourceLedger.find((entry) => entry.sourceType === sourceType);
    const firstItem = lane?.items[0];
    const anchorId = firstItem ? buildSourceLedgerItemId(sourceType, firstItem.title, 0) : null;
    jumpToSourceLedgerItem(anchorId);
  };

  const missionSteps = (() => {
    if (!result || !groundingReadiness || !voiceArtifact) {
      return [];
    }

    const moveTrigger =
      result.trustSnapshot.items.find((item) => item.title === "Move trigger")?.detail ??
      result.evacuation.decision;
    const firstDestination = result.evacuation.destinations[0];
    const sourceAwareChecklist = buildSourceAwareChecklistEntries(result);
    const requiredStageIds = new Set(["mission", "route", "share"]);

    return [
      {
        id: "mission",
        label: "Read scene",
        title: result.planningPosture.headline,
        coach: "First, learn the shape of the situation. Do not memorize everything. Just name the trigger and the first safe move.",
        trustLane: result.planningPosture.primarySourceType as DemoOutputTrustLane,
        trustLabel: `${formatSourceTypeLabel(result.planningPosture.primarySourceType)} lead`,
        trustDetail:
          "This opening step reflects whichever lane is currently driving mission posture, with official signals taking precedence when available.",
        task: moveTrigger,
        body: (
          <div className="lessonGrid">
            <MetricTile label="Your mode" value={result.planningPosture.headline} />
            <MetricTile
              label="First move"
              value={firstDestination ? firstDestination.name : "Choose elevated shelter"}
            />
            <MetricTile
              label="Voice"
              value={
                voiceArtifact.mode === "source-aware"
                  ? `${result.voiceBriefing.language} + source cue`
                  : `${result.voiceBriefing.language} ready`
              }
            />
            {evidenceSpotlight ? (
              <div className="coachPanel spotlightPanel wide">
                <div className="spotlightHeader">
                  <p className="detailLabel">Evidence spotlight</p>
                  <span className={`tonePill tone-${evidenceSpotlight.sourceType}`}>
                    {evidenceSpotlight.label}
                  </span>
                </div>
                <strong>{evidenceSpotlight.title}</strong>
                <p>{evidenceSpotlight.summary}</p>
                {evidenceSpotlight.evidence ? (
                  <p className="spotlightEvidence">Cue: {evidenceSpotlight.evidence}</p>
                ) : null}
                <p className="missionChecklistEvidence">Source reference: {evidenceSpotlight.sourceReference}</p>
                {evidenceSpotlight.sourceLedgerAnchorId ? (
                  <div className="spotlightJumpRow">
                    <button
                      type="button"
                      className="secondaryButton missionChecklistJumpButton"
                      onClick={() => jumpToSourceLedgerItem(evidenceSpotlight.sourceLedgerAnchorId ?? null)}
                    >
                      Jump to source ledger
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="coachPanel wide">
              <div className="missionChecklistHeader">
                <p className="detailLabel">Tiny checklist</p>
                <span className="tonePill tone-mixed">source-aware</span>
              </div>
              <ul className="missionChecklistList">
                {sourceAwareChecklist.map((entry, index) => (
                  <li key={`${entry.item}-${index}`} className="missionChecklistItem">
                    <span className={`tonePill tone-${entry.sourceType}`}>
                      {formatSourceTypeLabel(entry.sourceType)}
                    </span>
                    <p>{entry.item}</p>
                    <p className="missionChecklistReason">Why this lane: {entry.rationale}</p>
                    <div className="missionChecklistEvidenceRow">
                      <p className="missionChecklistEvidence">Source reference: {entry.sourceReference}</p>
                      {entry.sourceLedgerAnchorId ? (
                        <button
                          type="button"
                          className="secondaryButton missionChecklistJumpButton"
                          onClick={() => jumpToSourceLedgerItem(entry.sourceLedgerAnchorId)}
                        >
                          Jump to source ledger
                        </button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ),
      },
      {
        id: "ground",
        label: "Grounding",
        title: "Know what to trust",
        coach: "Beacon separates facts from guidance from planner help. This keeps the AI useful without making it sound more certain than it is.",
        trustLane: "mixed" as const,
        trustLabel: "Mixed trust lanes",
        trustDetail:
          "Review official facts, retrieved guidance, and generated adaptation together before treating this run as movement-ready.",
        task: groundingReadiness.nextConfirm
          ? groundingReadiness.nextConfirm.detail
          : "No open confirmation gap was flagged for this run.",
        body: (
          <div className="sourceLesson">
            {groundingReadiness.sourceCoverage.map((entry) => (
              <div key={entry.type} className="sourceLane">
                <span className={`tonePill tone-${entry.type}`}>{entry.type}</span>
                <strong>{entry.label}</strong>
                <p>{entry.count} item{entry.count === 1 ? "" : "s"} attached.</p>
              </div>
            ))}
            <div className="coachPanel wide">
              <p className="detailLabel">Trust rule</p>
              <p>{result.trustSnapshot.headline}</p>
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        label: "Action Card",
        title: "Do these in order",
        coach: "This is the playable part. Read one move, imagine doing it, then go next.",
        trustLane: "retrieved" as const,
        trustLabel: "Retrieved guidance focus",
        trustDetail:
          "Action order is anchored to hazard playbooks and any attached document cues, while still requiring official confirmation for activation.",
        task: result.immediateActions[0] ?? "Start with the safest immediate action.",
        body: (
          <div className="actionStack">
            {result.immediateActions.map((item, index) => (
              <div key={item} className="questItem">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "route",
        label: "Move route",
        title: "Pick the first destination",
        coach: "Do not hunt for the perfect route. Pick a safer direction, verify it, and move before the path gets harder.",
        trustLane: "official" as const,
        trustLabel: "Official facts focus",
        trustDetail:
          "Route context stays anchored to verified location and hazard-state signals before relying on planner adaptations.",
        task: result.evacuation.decision,
        body: (
          <div className="routeBoard">
            <div className="coachPanel wide">
              <p className="detailLabel">Route context</p>
              <p>{result.evacuation.routeContext}</p>
            </div>
            {result.evacuation.destinations.map((destination) => (
              <div key={destination.name} className="routeOption">
                <strong>{destination.name}</strong>
                <p>{destination.reason}</p>
                <span>
                  {destination.distanceKm.toFixed(1)} km / {destination.etaMinutes} min est.
                </span>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "people",
        label: "People",
        title: "Pack around real constraints",
        coach: "This step turns a generic checklist into care for the actual people in the room.",
        trustLane: "generated" as const,
        trustLabel: "Generated adaptation focus",
        trustDetail:
          "This section personalizes care, access, and communication details from the scenario inputs after core safety guidance is set.",
        task: result.specialInstructions[0]?.items[0] ?? "Name one lead and keep the go-bag near the exit.",
        body: (
          <div className="careGrid">
            <div className="coachPanel">
              <p className="detailLabel">Go-bag first</p>
              <ul className="missionList">
                {result.goBag.slice(0, 6).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="coachPanel">
              <p className="detailLabel">People notes</p>
              <div className="microStack">
                {result.specialInstructions.map((section) => (
                  <details key={section.title}>
                    <summary>{section.title}</summary>
                    <ul className="missionList">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </details>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        id: "share",
        label: "Handoff",
        title: "Send the mission brief",
        coach: "End with something portable: one voice script, one copyable brief, one markdown runbook.",
        trustLane: "mixed" as const,
        trustLabel: "Mixed export lane",
        trustDetail:
          "Exports intentionally preserve the boundary between official facts, retrieved guidance, and generated recommendations.",
        task: voiceArtifact.script,
        body: (
          <div className="shareLesson">
            <section className="shareArtifactFilter" aria-label="Share artifact trust-lane focus">
              <div className="shareArtifactFilterHeader">
                <div>
                  <p className="detailLabel">Share focus</p>
                  <strong>Show artifacts impacted by one trust lane</strong>
                </div>
                <span className={`tonePill ${shareArtifactLaneFilter === "all" ? "tone-retrieved" : `tone-${shareArtifactLaneFilter}`}`}>
                  {visibleShareArtifactCountLabel}
                </span>
              </div>
              <p className="shareArtifactFilterLead">
                Use this filter to prove which exportable outputs were directly impacted by official, retrieved, or generated lanes.
              </p>
              <div className="shareTrustReadiness" role="status" aria-live="polite">
                <span className={`tonePill ${retrievedLaneReadiness.toneClass}`}>{retrievedLaneShareStatusLabel}</span>
                <p className="shareTrustReadinessDetail">{retrievedLaneReadiness.detail}</p>
                {voiceSourceProvenanceStatus ? (
                  <>
                    <span className={`tonePill ${voiceSourceProvenanceStatus.toneClass}`}>
                      Source provenance: {voiceSourceProvenanceStatus.toneLabel}
                    </span>
                    <p className="shareTrustReadinessDetail">{voiceSourceProvenanceStatus.uiLabel}</p>
                  </>
                ) : null}
                {isTimingOverrideReasonMissing ? (
                  <button className="secondaryButton" type="button" onClick={focusTimingOverrideReasonInput}>
                    Fix note now
                  </button>
                ) : null}
                {voiceSourceProvenanceStatus && voiceSourceProvenanceNeedsSourceLabel ? (
                  <button
                    className="secondaryButton voiceProvenanceAction"
                    type="button"
                    onClick={focusDocumentSourceLabelInput}
                    aria-controls={retrievedSourceLabelInputId}
                  >
                    {voiceSourceProvenanceStatus.toneLabel === "missing"
                      ? "Add source label now"
                      : "Refine source label"}
                  </button>
                ) : null}
              </div>
              <div className="sourceLedgerModeButtons" role="group" aria-label="Filter share artifacts by trust lane">
                <button
                  type="button"
                  className={`choiceButton ${shareArtifactLaneFilter === "all" ? "isActive" : ""}`}
                  onClick={() => setShareArtifactLaneFilter("all")}
                  aria-pressed={shareArtifactLaneFilter === "all"}
                >
                  All trust lanes ({formatCountLabel(3, "artifact")})
                </button>
                {(["official", "retrieved", "generated"] as const).map((lane) => (
                  <button
                    key={lane}
                    type="button"
                    className={`choiceButton ${shareArtifactLaneFilter === lane ? "isActive" : ""}`}
                    onClick={() => setShareArtifactLaneFilter(lane)}
                    aria-pressed={shareArtifactLaneFilter === lane}
                  >
                    {formatSourceTypeLabel(lane)} ({formatCountLabel(shareArtifactPlanImpactTargetsBySource[lane].size, "artifact")})
                  </button>
                ))}
              </div>
            </section>
            {showShareFilteredEmptyState ? (
              <div className="shareArtifactFilterEmpty" role="status">
                <div className="shareArtifactFilterEmptyToneRow">
                  <span className={`tonePill demoDockLaneImpactPill tone-${shareArtifactLaneFilter}`}>
                    {formatSourceTypeLabel(shareArtifactLaneFilter)} lane driving this focus
                  </span>
                </div>
                <p>
                  No share artifacts were tagged as plan-impact outputs for{" "}
                  {formatSourceTypeLabel(shareArtifactLaneFilter).toLowerCase()}{" "}
                  in this run.
                </p>
                {shareArtifactLaneImpactHelperLine ? (
                  <p className="shareArtifactFilterEmptyDetail">{shareArtifactLaneImpactHelperLine}</p>
                ) : null}
                {voiceSourceProvenanceStatus ? (
                  <div className="shareArtifactFilterEmptyTrust" aria-live="polite">
                    <span className={`tonePill ${voiceSourceProvenanceStatus.toneClass}`}>
                      Source provenance: {voiceSourceProvenanceStatus.toneLabel}
                    </span>
                    <p className="shareTrustReadinessDetail">{voiceSourceProvenanceStatus.uiLabel}</p>
                    {voiceSourceProvenanceNeedsSourceLabel ? (
                      <button
                        className="secondaryButton voiceProvenanceAction"
                        type="button"
                        onClick={focusDocumentSourceLabelInput}
                        aria-controls={retrievedSourceLabelInputId}
                      >
                        {voiceSourceProvenanceStatus.toneLabel === "missing"
                          ? "Add source label now"
                          : "Refine source label"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {shareLaneEmptyComparisonCountLine ? (
                  <p className="shareArtifactFilterEmptyCount">{shareLaneEmptyComparisonCountLine}</p>
                ) : null}
                {showShareAllArtifactsComparison ? (
                  <p className="shareArtifactFilterEmptyCompareHint">
                    Comparing against all artifacts while {formatSourceTypeLabel(shareArtifactLaneFilter)} stays selected.
                  </p>
                ) : null}
                {showShareAllArtifactsComparison && laneEmptyEvidenceAvailabilityLine ? (
                  <p className="shareArtifactFilterEmptyDetail">{laneEmptyEvidenceAvailabilityLine}</p>
                ) : null}
                {showShareAllArtifactsComparison && laneEmptyEvidenceAnchorId ? (
                  <div className="artifactJumpCaptionRow">
                    <p className="artifactJumpCaption">
                      Need lane context while comparing? Jump to the first{" "}
                      {formatSourceTypeLabel(shareArtifactLaneFilter).toLowerCase()} source ledger item.
                    </p>
                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => jumpToSourceLedgerItem(laneEmptyEvidenceAnchorId)}
                      title="Jump to first matching source ledger evidence"
                    >
                      Show lane evidence
                    </button>
                  </div>
                ) : null}
                <div className="shareArtifactFilterEmptyActions">
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => setIsShareLaneEmptyComparingAll((previousValue) => !previousValue)}
                  >
                    {showShareAllArtifactsComparison ? "Return to lane impacts" : "Compare against all artifacts"}
                  </button>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => {
                      setIsShareLaneEmptyComparingAll(false);
                      setShareArtifactLaneFilter("all");
                    }}
                  >
                    Show all artifacts
                  </button>
                </div>
              </div>
            ) : null}
            {showVoiceArtifact ? (
              <section
                ref={voiceArtifactCardRef}
                className={`artifactCard voiceReadinessCard ${
                  highlightedShareArtifact === "voice" ? "artifactCardJumpHighlight" : ""
                }`}
                aria-label="Voice briefing controls"
              >
              <div className="artifactCardHeader">
                <div>
                  <p className="detailLabel">Voice briefing</p>
                  <strong>Play the spoken handoff during the demo</strong>
                </div>
                <div className="artifactHeaderToneStack">
                  <div className="demoDockCardToneRow">
                    <span
                      className={`tonePill ${
                        openAIVoiceState === "error"
                          ? "status-confirm"
                          : openAIVoiceUrl
                            ? "status-ready"
                            : "tone-generated"
                      }`}
                    >
                      {openAIVoiceState === "generating"
                        ? "generating"
                        : openAIVoiceState === "error"
                          ? "voice issue"
                          : openAIVoiceUrl
                            ? "OpenAI voice ready"
                            : "ready to generate"}
                    </span>
                    {shareVoiceLaneEvidenceAnchorId ? (
                      <span className={`tonePill demoDockLaneImpactPill tone-${shareArtifactLaneFilter}`}>
                        impacted by selected lane
                      </span>
                    ) : null}
                  </div>
                  {shareVoiceLaneEvidenceAnchorId && shareArtifactLaneImpactHelperLine ? (
                    <p className="artifactLaneImpactDetail">{shareArtifactLaneImpactHelperLine}</p>
                  ) : null}
                </div>
              </div>
              <p className="artifactLead">
                Beacon already writes the spoken script. These controls let you prove voice readiness without leaving the planner.
              </p>
              {shareArtifactLaneScopeSubtitle ? (
                <p className="shareTrustReadinessDetail">{shareArtifactLaneScopeSubtitle}</p>
              ) : null}
              {shareVoiceLaneEvidenceAnchorId ? (
                <div className="artifactJumpCaptionRow">
                  <p className="artifactJumpCaption">
                    {shareArtifactEvidenceLaneLabel} lane tagged this artifact as plan-impact.
                  </p>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => jumpToSourceLedgerItem(shareVoiceLaneEvidenceAnchorId)}
                    title="Jump to first matching source ledger evidence"
                  >
                    Show lane evidence
                  </button>
                </div>
              ) : shareArtifactComparisonReasonByTarget ? (
                <div className="artifactJumpCaptionRow">
                  <p className="artifactJumpCaption">{shareArtifactComparisonReasonByTarget.voice}</p>
                  <span className="tonePill status-advisory">comparison-only</span>
                </div>
              ) : null}
              {highlightedShareArtifact === "voice" && highlightedArtifactJumpCaption ? (
                <div className="artifactJumpCaptionRow">
                  <p className="artifactJumpCaption">{highlightedArtifactJumpCaption}</p>
                  {highlightedShareArtifactSourceType ? (
                    <span className={`tonePill tone-${highlightedShareArtifactSourceType}`}>
                      {formatShareArtifactJumpSourceTypeLabel(highlightedShareArtifactSourceType)}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="voiceMetaRow" aria-label="Voice playback settings">
                <div className="actionArtifactStat">
                  <p className="detailLabel">Language</p>
                  <strong>{result.voiceBriefing.language}</strong>
                </div>
                <div className="actionArtifactStat">
                  <p className="detailLabel">Mode</p>
                  <strong>{voiceArtifact.modeLabel}</strong>
                </div>
                {voiceSourceProvenanceStatus ? (
                  <div className="actionArtifactStat">
                    <div className="flowArtifactStatHeader">
                      <p className="detailLabel">Source provenance</p>
                      <span className={`tonePill ${voiceSourceProvenanceStatus.toneClass}`}>
                        {voiceSourceProvenanceStatus.toneLabel}
                      </span>
                    </div>
                    <strong>{voiceSourceProvenanceStatus.uiLabel}</strong>
                    {voiceSourceProvenanceNeedsSourceLabel ? (
                      <button
                        className="secondaryButton voiceProvenanceAction"
                        type="button"
                        onClick={focusDocumentSourceLabelInput}
                        aria-controls={retrievedSourceLabelInputId}
                      >
                        {voiceSourceProvenanceStatus.toneLabel === "missing"
                          ? "Add source label now"
                          : "Refine source label"}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                <div className="actionArtifactStat">
                  <p className="detailLabel">Playback</p>
                  <strong>{voicePlaybackDetail}</strong>
                </div>
                <div className="actionArtifactStat">
                  <p className="detailLabel">Estimated length</p>
                  <strong>{voiceHandoffTiming ? voiceHandoffTiming.label : "Not available"}</strong>
                </div>
              </div>
              <div className="voiceDemoTimingHint" role="status" aria-live="polite">
                <div className="voiceDemoTimingHeader">
                  <p className="detailLabel">Demo clip target</p>
                  <span className={`tonePill ${voiceDemoTimingStatus.toneClass}`}>{voiceDemoTimingStatus.label}</span>
                </div>
                <p className="voiceStatusNote">{voiceDemoTimingStatus.detail}</p>
                {voiceTrimSuggestion ? (
                  <div className="voiceTrimHintRow">
                    <p className="voiceStatusNote">
                      Quick trim removes {formatCountLabel(voiceTrimSuggestion.removedSentenceCount, "line")} (
                      {formatCountLabel(voiceTrimSuggestion.removedWordCount, "word")}) from the end of the generated
                      script to target about 45s.
                    </p>
                    <button className="secondaryButton" type="button" onClick={handleCopyTrimmedVoiceHandoff}>
                      Copy ~45s trim
                    </button>
                  </div>
                ) : null}
              </div>
              {documentBrief ? (
                <div className="voiceModeStack" aria-label="Voice handoff mode">
                  <div className="voiceModeRow">
                    <button
                      className={`choiceButton ${voiceLayerMode === "planner" ? "isActive" : ""}`}
                      type="button"
                      onClick={() => {
                        if (voiceLayerMode === "planner") {
                          return;
                        }

                        setVoiceLayerMode("planner");
                        setVoiceHandoffCopyState("idle");
                      }}
                    >
                      Generated only
                    </button>
                    <button
                      className={`choiceButton ${voiceLayerMode === "source-aware" ? "isActive" : ""}`}
                      type="button"
                      onClick={() => {
                        if (voiceLayerMode === "source-aware") {
                          return;
                        }

                        setVoiceLayerMode("source-aware");
                        setVoiceHandoffCopyState("idle");
                      }}
                    >
                      Source-aware handoff
                    </button>
                  </div>
                  <p className="voiceStatusNote">{voiceArtifact.summary}</p>
                </div>
              ) : null}
              <div className="voiceSegmentGrid" aria-label="Voice handoff layers">
                {voiceArtifact.segments.map((segment) => (
                  <article key={`${segment.sourceType}-${segment.label}`} className="voiceSegmentCard">
                    <div className="voiceSegmentHeader">
                      <p className="detailLabel">{segment.label}</p>
                      <span className={`tonePill tone-${segment.sourceType}`}>
                        {formatSourceTypeLabel(segment.sourceType)}
                      </span>
                    </div>
                    <p>{segment.text}</p>
                  </article>
                ))}
              </div>
              <div className="shareBriefActions">
                <button className="secondaryButton" type="button" onClick={handleToggleVoicePlayback}>
                  {openAIVoiceState === "generating" ? "Generating..." : openAIVoiceUrl ? "Regenerate voice" : "Generate voice"}
                </button>
                <button className="secondaryButton" type="button" onClick={handleCopyVoiceHandoff}>
                  Copy voice handoff
                </button>
              </div>
                <p className="voiceStatusNote" aria-live="polite">
                  {openAIVoiceState === "error"
                    ? "OpenAI voice generation failed. The scripted brief is still ready to copy."
                    : voiceArtifact.mode === "source-aware"
                      ? "OpenAI voice generation starts from one official trigger line, one retrieved document cue, then the generated briefing."
                      : "OpenAI voice generation uses the visible script. No browser or Mac voice synthesis is used."}
                </p>
                <details className="briefDrawer">
                  <summary>Preview copied voice handoff</summary>
                  {voiceHandoffTiming ? (
                    <p className="shareTrustReadinessDetail">
                      Estimated speaking time: {voiceHandoffTiming.label} ({voiceHandoffTiming.wordCount} words at{" "}
                      {voiceHandoffTiming.playbackRateLabel}).
                    </p>
                  ) : null}
                  <p className="shareTrustReadinessDetail">{voiceDemoTimingStatus.detail}</p>
                  <pre className="shareBriefBlock">{voiceHandoffBrief}</pre>
                </details>
                {trimmedVoiceHandoffBrief ? (
                  <details className="briefDrawer">
                    <summary>Preview ~45s trimmed handoff</summary>
                    {voiceTrimSuggestion ? (
                      <p className="shareTrustReadinessDetail">
                        Estimated speaking time: {voiceTrimSuggestion.timing.label} (
                        {voiceTrimSuggestion.timing.wordCount} words at {voiceTrimSuggestion.timing.playbackRateLabel}).
                      </p>
                    ) : null}
                    {voiceTrimTimingStatus ? (
                      <p className="shareTrustReadinessDetail">{voiceTrimTimingStatus.detail}</p>
                    ) : null}
                    <pre className="shareBriefBlock">{trimmedVoiceHandoffBrief}</pre>
                  </details>
                ) : null}
              </section>
            ) : null}
            {actionCardArtifact && showActionCardArtifact ? (
              <section
                ref={actionArtifactCardRef}
                className={`artifactCard ${
                  highlightedShareArtifact === "action-card" ? "artifactCardJumpHighlight" : ""
                }`}
                aria-label="Portable action card"
              >
                <div className="artifactCardHeader">
                  <div>
                    <p className="detailLabel">Portable action card</p>
                    <strong>One glance for trigger, destination, actions, and trust split</strong>
                  </div>
                  <div className="artifactHeaderToneStack">
                    <div className="demoDockCardToneRow">
                      <span className="tonePill tone-retrieved">exportable</span>
                      {shareActionCardLaneEvidenceAnchorId ? (
                        <span className={`tonePill demoDockLaneImpactPill tone-${shareArtifactLaneFilter}`}>
                          impacted by selected lane
                        </span>
                      ) : null}
                    </div>
                    {shareActionCardLaneEvidenceAnchorId && shareArtifactLaneImpactHelperLine ? (
                      <p className="artifactLaneImpactDetail">{shareArtifactLaneImpactHelperLine}</p>
                    ) : null}
                  </div>
                </div>
                <p className="artifactLead">
                  This is the judge-friendly version of the mission: what to watch, where to go first, what Beacon generated, and what still needs confirmation.
                </p>
                {shareArtifactLaneScopeSubtitle ? (
                  <p className="shareTrustReadinessDetail">{shareArtifactLaneScopeSubtitle}</p>
                ) : null}
                {shareActionCardLaneEvidenceAnchorId ? (
                  <div className="artifactJumpCaptionRow">
                    <p className="artifactJumpCaption">
                      {shareArtifactEvidenceLaneLabel} lane tagged this artifact as plan-impact.
                    </p>
                    <button
                      className="secondaryButton"
                      type="button"
                      onClick={() => jumpToSourceLedgerItem(shareActionCardLaneEvidenceAnchorId)}
                      title="Jump to first matching source ledger evidence"
                    >
                      Show lane evidence
                    </button>
                  </div>
                ) : shareArtifactComparisonReasonByTarget ? (
                  <div className="artifactJumpCaptionRow">
                    <p className="artifactJumpCaption">{shareArtifactComparisonReasonByTarget["action-card"]}</p>
                    <span className="tonePill status-advisory">comparison-only</span>
                  </div>
                ) : null}
                {highlightedShareArtifact === "action-card" && highlightedArtifactJumpCaption ? (
                  <div className="artifactJumpCaptionRow">
                    <p className="artifactJumpCaption">{highlightedArtifactJumpCaption}</p>
                    {highlightedShareArtifactSourceType ? (
                      <span className={`tonePill tone-${highlightedShareArtifactSourceType}`}>
                        {formatShareArtifactJumpSourceTypeLabel(highlightedShareArtifactSourceType)}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="actionArtifactMeta" aria-label="Portable action card summary">
                  <div className="actionArtifactStat">
                    <p className="detailLabel">Move trigger</p>
                    <strong>{actionCardArtifact.triggerLabel}</strong>
                  </div>
                  <div className="actionArtifactStat">
                    <p className="detailLabel">First destination</p>
                    <strong>{actionCardArtifact.destinationLabel}</strong>
                  </div>
                  <div className="actionArtifactStat">
                    <p className="detailLabel">Source split</p>
                    <strong>{actionCardArtifact.sourceSummary}</strong>
                  </div>
                  <div className="actionArtifactStat">
                    <div className="flowArtifactStatHeader">
                      <p className="detailLabel">Source provenance</p>
                      <span className={`tonePill ${actionCardArtifact.sourceProvenanceToneClass}`}>
                        {actionCardArtifact.sourceProvenanceToneLabel}
                      </span>
                    </div>
                    <strong>{actionCardArtifact.sourceProvenanceLabel}</strong>
                    {actionCardSourceProvenanceNeedsSourceLabel ? (
                      <button
                        className="secondaryButton voiceProvenanceAction"
                        type="button"
                        onClick={focusDocumentSourceLabelInput}
                        aria-controls={retrievedSourceLabelInputId}
                      >
                        {actionCardArtifact.sourceProvenanceToneLabel === "missing"
                          ? "Add source label now"
                          : "Refine source label"}
                      </button>
                    ) : null}
                  </div>
                  {actionCardArtifact.documentSourceFacts.map((fact) => (
                    <div key={fact.label} className="actionArtifactStat">
                      <p className="detailLabel">{fact.label}</p>
                      <strong>{fact.headline}</strong>
                    </div>
                  ))}
                  {actionCardArtifact.actionCueLabel ? (
                    <div className="actionArtifactStat">
                      <p className="detailLabel">Document order</p>
                      <strong>{actionCardArtifact.actionCueLabel}</strong>
                    </div>
                  ) : null}
                  {actionCardArtifact.timingCueLabel ? (
                    <div className="actionArtifactStat">
                      <p className="detailLabel">Timing cue</p>
                      <strong>{actionCardArtifact.timingCueLabel}</strong>
                    </div>
                  ) : null}
                  {actionCardArtifact.timingFreshnessDetail ? (
                    <div className="actionArtifactStat">
                      <p className="detailLabel">Timing freshness</p>
                      <strong>{actionCardArtifact.timingFreshnessDetail}</strong>
                    </div>
                  ) : null}
                  {actionCardArtifact.timingOverrideNoteLabel ? (
                    <div className="actionArtifactStat">
                      <p className="detailLabel">Timing override note</p>
                      <strong>{actionCardArtifact.timingOverrideNoteLabel}</strong>
                    </div>
                  ) : null}
                </div>
                <div className="actionArtifactGrid">
                  {actionCardArtifact.lanes.map((lane) => (
                    <article key={lane.title} className="actionArtifactLane">
                      <div className="actionArtifactLaneHeader">
                        <span className={`tonePill tone-${lane.sourceType}`}>{lane.label}</span>
                        <strong>{lane.title}</strong>
                      </div>
                      <p>{lane.detail}</p>
                    </article>
                  ))}
                </div>
                <div className="actionArtifactChecklist">
                  <article className="actionArtifactPanel">
                    <p className="detailLabel">Immediate actions</p>
                    <ul className="missionList">
                      {result.immediateActions.slice(0, 4).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                  <article className="actionArtifactPanel">
                    <p className="detailLabel">Verify next</p>
                    <ul className="missionList">
                      {result.verification.slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </div>
                <details className="briefDrawer">
                  <summary>Preview portable card text</summary>
                  <pre className="shareBriefBlock">{actionCardArtifact.markdown}</pre>
                </details>
              </section>
            ) : null}
            <div className="shareBriefActions">
              {actionCardArtifact && showActionCardArtifact ? (
                <button className="secondaryButton" type="button" onClick={handleCopyPortableActionCard}>
                  Copy action card
                </button>
              ) : null}
              <button className="secondaryButton" type="button" onClick={handleCopyShareBrief}>
                Copy brief
              </button>
              {showFlowArtifact ? (
                <button className="secondaryButton" type="button" onClick={handleCopyFlowView}>
                  Copy flow view
                </button>
              ) : null}
              <button
                className="secondaryButton"
                type="button"
                onClick={() => handleDownloadRunbook()}
              >
                Download runbook
              </button>
              {riskSourceExportBrief ? (
                <button
                  className="secondaryButton shareTrustJumpButton"
                  type="button"
                  onClick={jumpToSourceLedgerExportControls}
                  title={`Current runbook status: ${runbookRiskBlockShareStatus.label}`}
                >
                  Review risk source controls
                </button>
              ) : null}
              <button className="secondaryButton" type="button" onClick={() => window.print()}>
                Print
              </button>
            </div>
            {showFlowArtifact ? (
              <section
                ref={flowArtifactCardRef}
                className={`artifactCard ${highlightedShareArtifact === "flow" ? "artifactCardJumpHighlight" : ""}`}
                aria-label="Portable flow view"
              >
              <div className="artifactCardHeader">
                <div>
                  <p className="detailLabel">Flow view</p>
                  <strong>{flowArtifact?.headline ?? "Portable flow summary and Mermaid block"}</strong>
                </div>
                <div className="artifactHeaderToneStack">
                  <div className="demoDockCardToneRow">
                    <span className="tonePill tone-retrieved">exportable</span>
                    {shareFlowLaneEvidenceAnchorId ? (
                      <span className={`tonePill demoDockLaneImpactPill tone-${shareArtifactLaneFilter}`}>
                        impacted by selected lane
                      </span>
                    ) : null}
                  </div>
                  {shareFlowLaneEvidenceAnchorId && shareArtifactLaneImpactHelperLine ? (
                    <p className="artifactLaneImpactDetail">{shareArtifactLaneImpactHelperLine}</p>
                  ) : null}
                </div>
              </div>
              <p className="artifactLead">
                {flowArtifact?.summary ??
                  "Beacon already builds a route-and-trigger flow. This makes it visible, copyable, and ready for Mermaid-capable markdown viewers."}
              </p>
              {shareArtifactLaneScopeSubtitle ? (
                <p className="shareTrustReadinessDetail">{shareArtifactLaneScopeSubtitle}</p>
              ) : null}
              {shareFlowLaneEvidenceAnchorId ? (
                <div className="artifactJumpCaptionRow">
                  <p className="artifactJumpCaption">
                    {shareArtifactEvidenceLaneLabel} lane tagged this artifact as plan-impact.
                  </p>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => jumpToSourceLedgerItem(shareFlowLaneEvidenceAnchorId)}
                    title="Jump to first matching source ledger evidence"
                  >
                    Show lane evidence
                  </button>
                </div>
              ) : shareArtifactComparisonReasonByTarget ? (
                <div className="artifactJumpCaptionRow">
                  <p className="artifactJumpCaption">{shareArtifactComparisonReasonByTarget.flow}</p>
                  <span className="tonePill status-advisory">comparison-only</span>
                </div>
              ) : null}
              {highlightedShareArtifact === "flow" && highlightedArtifactJumpCaption ? (
                <div className="artifactJumpCaptionRow">
                  <p className="artifactJumpCaption">{highlightedArtifactJumpCaption}</p>
                  {highlightedShareArtifactSourceType ? (
                    <span className={`tonePill tone-${highlightedShareArtifactSourceType}`}>
                      {formatShareArtifactJumpSourceTypeLabel(highlightedShareArtifactSourceType)}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {flowArtifact ? (
                <div className="flowArtifactMeta" aria-label="Portable flow summary">
                  <article className="flowArtifactStat">
                    <div className="flowArtifactStatHeader">
                      <p className="detailLabel">Source provenance</p>
                      <span className={`tonePill ${flowArtifact.sourceProvenanceToneClass}`}>
                        {flowArtifact.sourceProvenanceToneLabel}
                      </span>
                    </div>
                    <strong>{flowArtifact.sourceProvenanceLabel}</strong>
                    {flowSourceProvenanceNeedsSourceLabel ? (
                      <button
                        className="secondaryButton voiceProvenanceAction"
                        type="button"
                        onClick={focusDocumentSourceLabelInput}
                        aria-controls={retrievedSourceLabelInputId}
                      >
                        {flowArtifact.sourceProvenanceToneLabel === "missing"
                          ? "Add source label now"
                          : "Refine source label"}
                      </button>
                    ) : null}
                    <p>Keep this matched with action-card provenance so trust readiness stays consistent across exports.</p>
                  </article>
                  {flowArtifact.summaryCards.map((item) => (
                    <article key={item.id} className="flowArtifactStat">
                      <div className="flowArtifactStatHeader">
                        <p className="detailLabel">{item.label}</p>
                        <span className={`tonePill ${item.toneClass}`}>{item.toneLabel}</span>
                      </div>
                      <strong>{item.headline}</strong>
                      <p>{item.detail}</p>
                    </article>
                  ))}
                </div>
              ) : null}
                <pre className="shareBriefBlock flowBlock">{flowArtifact?.mermaid ?? ""}</pre>
              </section>
            ) : null}
            <div className="statusRow">
              {actionCardArtifact && showActionCardArtifact ? (
                <span
                  className={`tonePill ${actionCardCopyState === "error" ? "status-confirm" : "status-ready"}`}
                >
                  {actionCardCopyState === "copied"
                    ? "card copied"
                    : actionCardCopyState === "error"
                      ? "card failed"
                      : "card ready"}
                </span>
              ) : null}
              {showVoiceArtifact ? (
                <span
                  className={`tonePill ${voiceHandoffCopyState === "error" ? "status-confirm" : "status-ready"}`}
                >
                  {voiceHandoffCopyState === "copied"
                    ? "voice copied"
                    : voiceHandoffCopyState === "error"
                      ? "voice copy failed"
                      : "voice ready"}
                </span>
              ) : null}
              <span className={`tonePill ${copyState === "error" ? "status-confirm" : "status-ready"}`}>
                {copyState === "copied" ? "copied" : copyState === "error" ? "copy failed" : "ready"}
              </span>
              {showFlowArtifact ? (
                <span
                  className={`tonePill ${flowCopyState === "error" ? "status-confirm" : "status-ready"}`}
                >
                  {flowCopyState === "copied"
                    ? "flow copied"
                    : flowCopyState === "error"
                      ? "flow failed"
                      : "flow ready"}
                </span>
              ) : null}
              <span className={`tonePill ${downloadState === "error" ? "status-confirm" : "status-ready"}`}>
                {downloadState === "downloaded"
                  ? "runbook saved"
                  : downloadState === "error"
                    ? "save failed"
                    : "runbook"}
              </span>
              {riskSourceExportBrief ? (
                <button
                  type="button"
                  className={`tonePill tonePillButton ${runbookRiskBlockShareStatus.toneClass}`}
                  onClick={jumpToSourceLedgerExportControls}
                  title="Jump to source ledger export controls"
                >
                  {runbookRiskBlockShareStatus.label}
                </button>
              ) : (
                <span className={`tonePill ${runbookRiskBlockShareStatus.toneClass}`}>
                  {runbookRiskBlockShareStatus.label}
                </span>
              )}
            </div>
            <details className="briefDrawer">
              <summary>Preview the brief</summary>
              <pre className="shareBriefBlock">{shareBrief}</pre>
            </details>
          </div>
        ),
      },
    ].filter((step) => requiredStageIds.has(step.id));
  })();

  const activeMissionStepIndex =
    missionSteps.length > 0 ? Math.min(activeMissionStep, missionSteps.length - 1) : 0;
  const activeStep = missionSteps[activeMissionStepIndex] ?? missionSteps[0];
  const shareStepIndex = missionSteps.findIndex((step) => step.id === "share");
  const resolvedActiveWorkspaceSection: WorkspaceSectionId =
    !result
      ? "overview"
      : activeMissionStepIndex === shareStepIndex && shareStepIndex >= 0
        ? "share"
        : activeWorkspaceSection;
  const resolvedWorkspaceSectionLabel = workspaceSectionLabelById[resolvedActiveWorkspaceSection];
  const progressPercent =
    missionSteps.length > 0 ? Math.round(((activeMissionStepIndex + 1) / missionSteps.length) * 100) : 0;
  const activeIncidentScene =
    result && activeStep
      ? buildIncidentStoryScene(result, form, activeStep.id, activeMissionStepIndex)
      : null;
  const selectedStoryDecisionId =
    activeIncidentScene && activeStep
      ? storyDecisionByStep[activeStep.id] ?? activeIncidentScene.decisions[0]?.id ?? ""
      : "";
  const selectedStoryDecision =
    activeIncidentScene?.decisions.find((decision) => decision.id === selectedStoryDecisionId) ??
    activeIncidentScene?.decisions[0] ??
    null;
  const selectedStoryDecisionCue =
    activeIncidentScene && selectedStoryDecision
      ? getDecisionHierarchyCue(activeIncidentScene, selectedStoryDecision)
      : null;
  const activeIncidentSimulation =
    result && activeIncidentScene && selectedStoryDecision
      ? buildIncidentSimulation(result, form, activeIncidentScene, selectedStoryDecision, activeMissionStepIndex)
      : null;
  const storyBeatPlan = getScenarioBeatPlan(form.hazard);
  const activeStoryFrameIndex = activeStep
    ? Math.min(storyFrameByStep[activeStep.id] ?? 0, Math.max(0, storyBeatPlan.length - 1))
    : 0;
  const activeStoryFrame = storyBeatPlan[activeStoryFrameIndex] ?? storyBeatPlan[0] ?? null;
  const activeFirstPersonViewId =
    activeStep ? firstPersonViewByStep[activeStep.id] ?? activeStoryFrame?.viewId ?? "entry" : "entry";
  const activeFirstPersonScene =
    result && activeIncidentScene && selectedStoryDecision
      ? buildFirstPersonDrillScene(
          result,
          form,
          activeIncidentScene,
          selectedStoryDecision,
          activeFirstPersonViewId,
          activeStep.id,
        )
      : null;
  const activeVideoBeatId =
    activeStep && activeFirstPersonScene
      ? videoBeatByStep[activeStep.id] ?? activeFirstPersonScene.videoBeats[0]?.id ?? "briefing"
      : "briefing";
  const activeVideoBeat =
    activeFirstPersonScene?.videoBeats.find((beat) => beat.id === activeVideoBeatId) ??
    activeFirstPersonScene?.videoBeats[0] ??
    null;
  const activeTraineeRole =
    buildScenarioRoleProfile(form.hazard, traineeRoleId) ??
    traineeRoleProfiles.find((role) => role.id === traineeRoleId) ??
    traineeRoleProfiles[1];
  const activeCourseFrames =
    activeFirstPersonScene && activeIncidentScene
      ? storyBeatPlan.map((frame, index) => ({
          ...frame,
          imageUrl:
            getScenarioGalleryImageSet(form.hazard)[index] ??
            getScenarioStageFrameUrl(activeStep.id, form.hazard, frame.viewId),
          action: () => {
            setStoryFrameByStep((previousValue) => ({ ...previousValue, [activeStep.id]: index }));
            setFirstPersonViewByStep((previousValue) => ({ ...previousValue, [activeStep.id]: frame.viewId }));
            setVideoBeatByStep((previousValue) => ({
              ...previousValue,
              [activeStep.id]:
                frame.viewId === "entry" ? "briefing" : frame.viewId === "corridor" ? "movement" : "decision",
            }));
          },
          active: index === activeStoryFrameIndex,
        }))
      : [];
  const activeStoryFrameImageUrl =
    activeCourseFrames[activeStoryFrameIndex]?.imageUrl ?? activeFirstPersonScene?.stageFrameUrl ?? null;
  const activeStoryFramePrompt = activeStoryFrame
    ? buildStoryFramePrompt({
        frame: activeStoryFrame,
        frameIndex: activeStoryFrameIndex,
        totalFrames: storyBeatPlan.length,
        roleId: activeTraineeRole.id,
        hazard: form.hazard,
        route: activeFirstPersonScene?.routeCue.route ?? selectedCourse.promise,
      })
    : null;
  const activeCommandPrompt =
    activeFirstPersonScene && activeIncidentScene && selectedStoryDecision
      ? buildCourseCommandPrompt(form.hazard, activeFirstPersonScene.viewId, activeTraineeRole.id, selectedStoryDecision)
      : null;
  const roleCanSpeak = activeTraineeRole.id !== "student";
  const isSpeakOpportunity =
    roleCanSpeak && activeFirstPersonScene
      ? activeFirstPersonScene.viewId === "corridor" || activeFirstPersonScene.viewId === "gate"
      : false;
  const missionTimer =
    activeFirstPersonScene && selectedStoryDecision
      ? buildMissionTimerState({
          roleId: activeTraineeRole.id,
          elapsedSeconds: missionElapsedSeconds,
          viewId: activeFirstPersonScene.viewId,
          decision: selectedStoryDecision,
        })
      : null;
  const activeMissionStartCue =
    activeStep?.id === "mission" && activeVideoBeatId === "briefing" && activeFirstPersonScene
      ? {
          clock: "00:30",
          label: "Scan before moving",
          beats: [
            { label: "Hazard", value: activeFirstPersonScene.routeCue.trigger },
            { label: "Route", value: activeFirstPersonScene.routeCue.route },
            { label: "Avoid", value: activeFirstPersonScene.routeCue.avoid },
          ],
        }
      : null;
  const activeRouteRuleChoiceId =
    activeStep && activeFirstPersonScene
      ? routeRuleChoiceByStep[activeStep.id] ?? activeFirstPersonScene.routeTrainer.ruleChoices[0]?.id ?? ""
      : "";
  const activeRouteRuleChoice =
    activeFirstPersonScene?.routeTrainer.ruleChoices.find((choice) => choice.id === activeRouteRuleChoiceId) ??
    activeFirstPersonScene?.routeTrainer.ruleChoices[0] ??
    null;
  const activeQuizAnswerId =
    activeIncidentScene && activeStep ? quizAnswerByStep[activeStep.id] ?? "" : "";
  const activeQuizAnswer =
    activeIncidentScene?.quiz.answers.find((answer) => answer.id === activeQuizAnswerId) ?? null;
  const activePauseQuizResolveCue =
    activeIncidentScene && activeFirstPersonScene && activeQuizAnswer
      ? buildPauseQuizResolveCue(activeIncidentScene, activeFirstPersonScene, activeQuizAnswer)
      : null;

  useEffect(() => {
    if (!result || !missionStartedAt) {
      return;
    }

    const updateElapsed = () => {
      setMissionElapsedSeconds(Math.max(0, Math.floor((Date.now() - missionStartedAt) / 1000)));
    };

    updateElapsed();
    const timerId = window.setInterval(updateElapsed, 1000);

    return () => window.clearInterval(timerId);
  }, [missionStartedAt, result]);

  useEffect(() => {
    if (!activeStep || !activeFirstPersonScene || !activeIncidentScene || activeCourseFrames.length === 0) {
      return;
    }

    function handleMissionKeys(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || isShortcutBlockedTarget(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

      if (["w", "a", "s", "d", " "].includes(key)) {
        event.preventDefault();
      }

      if (key === " ") {
        const nextFrameIndex = activeStoryFrameIndex + 1;

        if (nextFrameIndex < activeCourseFrames.length) {
          const nextFrame = activeCourseFrames[nextFrameIndex];
          setStoryFrameByStep((previousValue) => ({ ...previousValue, [activeStep.id]: nextFrameIndex }));
          setFirstPersonViewByStep((previousValue) => ({ ...previousValue, [activeStep.id]: nextFrame.viewId }));
          setVideoBeatByStep((previousValue) => ({
            ...previousValue,
            [activeStep.id]:
              nextFrame.viewId === "entry" ? "briefing" : nextFrame.viewId === "corridor" ? "movement" : "decision",
          }));
        } else {
          setActiveMissionStep((previousValue) => Math.min(missionSteps.length - 1, previousValue + 1));
        }
        return;
      }

      if (key === "a") {
        const nextFrameIndex = Math.max(0, activeStoryFrameIndex - 1);
        const nextFrame = activeCourseFrames[nextFrameIndex];
        setStoryFrameByStep((previousValue) => ({ ...previousValue, [activeStep.id]: nextFrameIndex }));
        setFirstPersonViewByStep((previousValue) => ({ ...previousValue, [activeStep.id]: nextFrame.viewId }));
        setVideoBeatByStep((previousValue) => ({
          ...previousValue,
          [activeStep.id]: nextFrame.viewId === "entry" ? "briefing" : nextFrame.viewId === "corridor" ? "movement" : "decision",
        }));
      }

      if (key === "w") {
        const nextFrameIndex = Math.min(activeCourseFrames.length - 1, activeStoryFrameIndex + 1);
        const nextFrame = activeCourseFrames[nextFrameIndex];
        setStoryFrameByStep((previousValue) => ({ ...previousValue, [activeStep.id]: nextFrameIndex }));
        setFirstPersonViewByStep((previousValue) => ({ ...previousValue, [activeStep.id]: nextFrame.viewId }));
        setVideoBeatByStep((previousValue) => ({
          ...previousValue,
          [activeStep.id]: nextFrame.viewId === "entry" ? "briefing" : nextFrame.viewId === "corridor" ? "movement" : "decision",
        }));
      }

      if (key === "d") {
        if (!activeIncidentScene) {
          return;
        }

        const bestDecision =
          activeIncidentScene.decisions.find((decision) => decision.impact.safety >= 80 && decision.impact.trust >= 70) ??
          activeIncidentScene.decisions[0];

        if (bestDecision) {
          setStoryDecisionByStep((previousValue) => ({
            ...previousValue,
            [activeStep.id]: bestDecision.id,
          }));
        }
      }

      if (key === "s") {
        const nextFrameIndex = activeCourseFrames.length - 1;
        const nextFrame = activeCourseFrames[nextFrameIndex];
        setStoryFrameByStep((previousValue) => ({ ...previousValue, [activeStep.id]: nextFrameIndex }));
        setFirstPersonViewByStep((previousValue) => ({ ...previousValue, [activeStep.id]: nextFrame.viewId }));
        setVideoBeatByStep((previousValue) => ({
          ...previousValue,
          [activeStep.id]: nextFrame.viewId === "entry" ? "briefing" : nextFrame.viewId === "corridor" ? "movement" : "decision",
        }));
      }
    }

    window.addEventListener("keydown", handleMissionKeys);

    return () => window.removeEventListener("keydown", handleMissionKeys);
  }, [
    activeCourseFrames.length,
    activeIncidentScene,
    activeFirstPersonScene,
    activeStep,
    activeCourseFrames,
    activeStoryFrameIndex,
    activeMissionStepIndex,
    missionSteps.length,
  ]);

  const trainingOutcome =
    result && missionSteps.length > 0
      ? buildTrainingOutcome(result, form, missionSteps, storyDecisionByStep, quizAnswerByStep)
      : null;
  const activeDebriefConsequence =
    result && selectedStoryDecision && trainingOutcome
      ? buildDebriefConsequenceBrief(result, form, selectedStoryDecision, trainingOutcome)
      : null;
  const missionStepStatus = missionSteps.map((step, index) => {
    if (index < activeMissionStep) {
      return {
        id: step.id,
        label: "Done",
        toneClass: "status-ready",
      };
    }

    if (index === activeMissionStep) {
      return {
        id: step.id,
        label: "Current step",
        toneClass: "tone-retrieved",
      };
    }

    return {
      id: step.id,
      label: "Up next",
      toneClass: "tone-generated",
    };
  });
  const firstDestination = result?.evacuation.destinations[0];
  const workspaceMoveTrigger = result
    ? result.trustSnapshot.items.find((item) => item.title === "Move trigger")?.detail ?? result.evacuation.decision
    : "";
  const sourceCoverageSummary = groundingReadiness
    ? groundingReadiness.sourceCoverage
        .filter((entry) => entry.count > 0)
        .map((entry) => `${entry.count} ${formatSourceTypeLabel(entry.type).toLowerCase()}`)
        .join(" + ")
    : "";
  const authorityStrip = result ? buildAuthorityStrip(result) : [];
  const documentImpactCards = documentBrief ? buildDocumentImpactCards(documentBrief) : [];
  const documentImpactArtifactTarget = documentBrief
    ? buildDocumentImpactArtifactTarget(documentBrief)
    : null;
  const scenarioSnapshotCards = result
    ? buildScenarioSnapshotCards(form, result, selectedCourse.label)
    : [];
  const demoOutputDock: DemoOutputCard[] =
    result && actionCardArtifact && voiceArtifact && flowArtifact
      ? [
          {
            id: "voice",
            label: "Voice handoff",
            toneClass: voiceArtifact.mode === "source-aware" ? "tone-retrieved" : "tone-generated",
            toneLabel: voiceArtifact.mode === "source-aware" ? "source-aware" : "generated",
            headline:
              voiceArtifact.mode === "source-aware"
                ? `${result.voiceBriefing.language} source-aware brief`
                : `${result.voiceBriefing.language} spoken brief`,
            detail: documentCueSummary?.actionCue
              ? `Leads with a retrieved document order: ${truncateForCard(documentCueSummary.actionCue, 80)}`
              : documentCueSummary?.timingCue
                ? `Leads with a retrieved timing cue: ${truncateForCard(documentCueSummary.timingCue, 80)}`
                : "Playback-ready handoff for the fastest demo explanation.",
            actionId: "voice",
            actionLabel:
              openAIVoiceState === "generating" ? "Generating voice" : openAIVoiceUrl ? "Regenerate voice" : "Generate voice",
            actionToneClass:
              openAIVoiceState === "error"
                ? "status-confirm"
                : openAIVoiceUrl
                  ? "status-ready"
                  : "tone-generated",
            actionStatus:
              openAIVoiceState === "generating"
                ? "OpenAI voice generating"
                : openAIVoiceState === "error"
                  ? "voice issue"
                  : openAIVoiceUrl
                    ? "OpenAI voice ready"
                    : "ready to generate",
          },
          {
            id: "action-card",
            label: "Action card",
            toneClass: "status-ready",
            toneLabel: "exportable",
            headline: actionCardArtifact.destinationLabel,
            detail: `Portable trigger card with ${actionCardArtifact.sourceSummary}.`,
            actionId: "action-card",
            actionLabel: "Copy card",
            actionToneClass: actionCardCopyState === "error" ? "status-confirm" : "status-ready",
            actionStatus:
              actionCardCopyState === "copied"
                ? "card copied"
                : actionCardCopyState === "error"
                  ? "copy failed"
                  : "ready to copy",
          },
          {
            id: "flow",
            label: "Flow view",
            toneClass: "tone-retrieved",
            toneLabel: "mermaid",
            headline: flowArtifact.headline,
            detail: "Copyable source-aware summary plus Mermaid drill flow for docs, markdown viewers, and slides.",
            actionId: "flow",
            actionLabel: "Copy flow",
            actionToneClass: flowCopyState === "error" ? "status-confirm" : "tone-retrieved",
            actionStatus:
              flowCopyState === "copied"
                ? "flow copied"
                : flowCopyState === "error"
                  ? "copy failed"
                  : "ready to copy",
          },
          {
            id: "runbook",
            label: "Runbook",
            toneClass: "tone-official",
            toneLabel: "markdown",
            headline: buildRunbookFilename(result.actionCardTitle),
            detail: "One file with the brief, sources, voice script, and checklist.",
            actionId: "runbook",
            actionLabel: "Download",
            actionToneClass: downloadState === "error" ? "status-confirm" : "tone-official",
            actionStatus:
              downloadState === "downloaded"
                ? "runbook saved"
                : downloadState === "error"
                  ? "save failed"
                  : "ready to save",
          },
        ]
      : [];
  const hasRunbookDemoOutput = demoOutputDock.some((item) => item.actionId === "runbook");
  const demoOutputDockCountByLane = {
    all: demoOutputDock.length,
    official: shareArtifactPlanImpactTargetsBySource.official.size + (hasRunbookDemoOutput ? 1 : 0),
    retrieved: shareArtifactPlanImpactTargetsBySource.retrieved.size + (hasRunbookDemoOutput ? 1 : 0),
    generated: shareArtifactPlanImpactTargetsBySource.generated.size + (hasRunbookDemoOutput ? 1 : 0),
  };
  const laneImpactedDemoOutputCount =
    shareArtifactLaneFilter === "all"
      ? demoOutputDock.length
      : shareArtifactPlanImpactTargetsBySource[shareArtifactLaneFilter].size;
  const hasLaneTaggedDemoOutputs =
    shareArtifactLaneFilter === "all" ? demoOutputDock.length > 0 : laneImpactedDemoOutputCount > 0;
  const showDemoDockFilteredEmptyState = shareArtifactLaneFilter !== "all" && !hasLaneTaggedDemoOutputs;
  const showDemoDockAllArtifactsComparison = showDemoDockFilteredEmptyState && isDemoDockLaneEmptyComparingAll;
  const visibleDemoOutputDock =
    shareArtifactLaneFilter === "all" || showDemoDockAllArtifactsComparison
      ? demoOutputDock
      : demoOutputDock.filter((item) => {
          if (item.actionId === "runbook") {
            return true;
          }

          return visibleShareArtifactTargets.has(item.actionId);
        });
  const judgeDemoPath: JudgeDemoCue[] = result
    ? [
        {
          id: "launch",
          timecode: "0:00",
          label: `Load ${activePreset?.label ?? selectedCourse.label}`,
          detail: "Start from a one-tap scenario with a retrieved route source already attached.",
          proof: documentBrief ? "Retrieved source active" : `${selectedCourse.label} guidance pack active`,
          actionLabel: "Reload selected demo",
          toneClass: "tone-retrieved",
          target: "run",
        },
        {
          id: "pov",
          timecode: "0:25",
          label: "Show first-person pressure",
          detail: "Open the trainee POV, hazard cue, minimap, and first decision turn.",
          proof: "Interactive briefing beat + visible consequence meters",
          actionLabel: "Open POV turn",
          toneClass: "tone-generated",
          target: "step",
          stepId: "mission",
          decisionId: "stage-now",
          viewId: "entry",
          videoBeatId: "briefing",
        },
        {
          id: "trust",
          timecode: "0:55",
          label: "Open cockpit source proof",
          detail: "Open the cockpit proof drawer before the model advice is trusted.",
          proof: "Official, retrieved, and generated lanes stay separate",
          actionLabel: "Open proof drawer",
          toneClass: "tone-official",
          target: "source",
          stepId: "ground",
          decisionId: "open-ledger",
          quizAnswerId: "official",
          viewId: "gate",
          videoBeatId: "decision",
        },
        {
          id: "choice",
          timecode: "1:25",
          label: "Make the gameplay choice",
          detail: "Select the high-value first action and show safety, speed, and trust changing.",
          proof: trainingOutcome
            ? `${trainingOutcome.mastery}% mastery after current choices`
            : "Decision state updates live",
          actionLabel: "Show action turn",
          toneClass: "status-ready",
          target: "step",
          stepId: "actions",
          decisionId: "first-action",
          quizAnswerId: "first-action",
          viewId: "corridor",
          videoBeatId: "movement",
        },
        {
          id: "route",
          timecode: "1:55",
          label: "Show route and care consequences",
          detail: "Move to the route/care turn so the audience sees people and route rules react.",
          proof: "Actors, pressure meter, and route overlay update from the selected decision",
          actionLabel: "Open route turn",
          toneClass: "tone-official",
          target: "step",
          stepId: "route",
          decisionId: "move-destination",
          quizAnswerId: "route-safe",
          viewId: "gate",
          videoBeatId: "decision",
        },
        {
          id: "handoff",
          timecode: "2:25",
          label: "End with portable outputs",
          detail: "Open voice, action card, flow, and runbook proof in the share lesson.",
          proof: `Voice ${voiceDemoTimingStatus.label}; ${runbookRiskBlockShareStatus.label}`,
          actionLabel: "Open exports",
          toneClass: "tone-retrieved",
          target: "share",
          stepId: "share",
          decisionId: "share-pack",
          quizAnswerId: "source-boundaries",
        },
        {
          id: "voice",
          timecode: "2:45",
          label: "Play the voice close",
          detail: "Generate the OpenAI voice close, with the visible script as the final judge fallback.",
          proof: actionCardArtifact ? actionCardArtifact.sourceSummary : "Action card and source split ready",
          actionLabel: "Open voice",
          toneClass: "tone-generated",
          target: "voice",
          sourceType: documentBrief ? "retrieved" : "generated",
        },
      ]
    : [];
  const judgeDemoBrief =
    result && judgeDemoPath.length > 0
      ? buildJudgeDemoBrief(result, form, judgeDemoPath, trainingOutcome)
      : "";
  const demoDockComparisonCountLabel = `${formatCountLabel(laneImpactedDemoOutputCount, "impacted artifact")} | ${formatCountLabel(
    visibleDemoOutputDock.length,
    "comparison-visible artifact",
  )}`;
  const demoDockPinnedBaselineCountLabel = `${formatCountLabel(
    laneImpactedDemoOutputCount,
    "impacted artifact",
  )} | ${formatCountLabel(hasRunbookDemoOutput ? 1 : 0, "pinned baseline")}`;
  const demoDockLaneScopedCountLine =
    shareArtifactLaneFilter === "all"
      ? null
      : showDemoDockAllArtifactsComparison
        ? demoDockComparisonCountLabel
        : demoDockPinnedBaselineCountLabel;
  const visibleDemoOutputCountLabel =
    shareArtifactLaneFilter === "all"
      ? `${formatCountLabel(demoOutputDock.length, "artifact")} visible`
      : demoDockLaneScopedCountLine ?? `${formatCountLabel(laneImpactedDemoOutputCount, "artifact")} impacted`;
  const shareMissionControlOutputSummary =
    shareArtifactLaneFilter === "all"
      ? `${formatCountLabel(demoOutputDock.length, "artifact")} ready`
      : `${formatSourceTypeLabel(shareArtifactLaneFilter)} focus: ${
          demoDockLaneScopedCountLine ?? `${formatCountLabel(laneImpactedDemoOutputCount, "impacted artifact")}`
        }`;
  const shareMissionControlDetail =
    shareArtifactLaneFilter === "all"
      ? "Jump straight to the export-ready lesson and demo artifacts."
      : `${formatSourceTypeLabel(shareArtifactLaneFilter)} lane focus: ${
          demoDockLaneScopedCountLine ?? `${formatCountLabel(laneImpactedDemoOutputCount, "impacted artifact")}`
        }.`;
  const demoDockShareLaneHelperDetail =
    shareArtifactLaneFilter === "all"
      ? "All trust lanes stay visible here so judges can browse top-level artifacts before opening Share."
      : `${formatSourceTypeLabel(shareArtifactLaneFilter)} lane focus: ${
          demoDockLaneScopedCountLine ?? `${formatCountLabel(laneImpactedDemoOutputCount, "impacted artifact")}`
        }.`;
  const commandBriefCards: CommandBriefCard[] = result && groundingReadiness
    ? [
        {
          id: "mode",
          label: "Mode",
          toneClass: `tone-${result.planningPosture.primarySourceType}`,
          toneLabel: formatSourceTypeLabel(result.planningPosture.primarySourceType),
          headline: result.planningPosture.headline,
          detail:
            groundingReadiness.confirmCount > 0
              ? `${groundingReadiness.confirmCount} confirmation check${
                  groundingReadiness.confirmCount === 1 ? "" : "s"
                } still open before you treat this run as fully move-ready.`
              : "No confirmation blocker is currently flagged, so you can move into the walkthrough with the current grounding state.",
        },
        {
          id: "trigger",
          label: "Move trigger",
          toneClass:
            getSignalToneClass(
              result.trustSnapshot.items.find((item) => item.title === "Move trigger")?.status ?? "confirm",
            ),
          toneLabel: "official first",
          headline: truncateForCard(workspaceMoveTrigger, 110),
          detail:
            "Confirm this against official alerts or direct on-ground conditions before treating the run as active movement guidance.",
        },
        {
          id: "destination",
          label: "First destination",
          toneClass: "status-ready",
          toneLabel: "first move",
          headline: firstDestination
            ? `${firstDestination.name} • ${firstDestination.etaMinutes} min`
            : "Choose safer shelter",
          detail:
            firstDestination ? firstDestination.reason : result.evacuation.routeContext,
        },
        {
          id: "confirm",
          label:
            groundingReadiness.confirmCount > 0
              ? "Confirm next"
              : groundingReadiness.advisoryCount > 0
                ? "Review once more"
                : "Confirmation status",
          toneClass:
            groundingReadiness.confirmCount > 0
              ? "status-confirm"
              : groundingReadiness.advisoryCount > 0
                ? "status-advisory"
                : "status-ready",
          toneLabel:
            groundingReadiness.confirmCount > 0
              ? "confirm"
              : groundingReadiness.advisoryCount > 0
                ? "review"
                : "clear",
          headline:
            groundingReadiness.nextConfirm?.title ??
            (documentCueSummary?.actionCue
              ? "Verify retrieved document order"
              : documentCueSummary?.timingCue
                ? "Verify retrieved timing cue"
                : "No open confirmation gap"),
          detail:
            groundingReadiness.nextConfirm?.detail ??
            (documentCueSummary?.actionCue
              ? `Document order: ${truncateForCard(documentCueSummary.actionCue, 110)}`
              : documentCueSummary?.timingCue
                ? `Timing cue: ${truncateForCard(documentCueSummary.timingCue, 110)}`
                : groundingReadiness.advisoryCount > 0
                  ? "A final review pass is still worth doing before treating this mission as settled."
                  : "Nothing is currently blocked on another source check."),
        },
      ].filter((item): item is CommandBriefCard => Boolean(item))
    : [];
  const commandBriefNotes = result
    ? [
        sourceCoverageSummary ? `Source mix: ${sourceCoverageSummary}.` : null,
        documentCueSummary?.sourceDescriptor
          ? `${documentCueSummary.sourceDescriptor.label}: ${documentCueSummary.sourceDescriptor.headline}.`
          : documentCueSummary?.actionCue
            ? `Retrieved cue: ${truncateForCard(documentCueSummary.actionCue, 120)}`
            : documentCueSummary?.timingCue
              ? `Retrieved timing cue: ${truncateForCard(documentCueSummary.timingCue, 120)}`
              : null,
      ].filter((item): item is string => Boolean(item))
    : [];
  const workspaceNavigator: WorkspaceJumpCard[] = result && groundingReadiness && activeStep
    ? [
        {
          id: "overview",
          label: "Overview",
          headline: result.planningPosture.headline,
          detail: firstDestination
            ? `First destination: ${firstDestination.name}.`
            : "Set the first safer destination before roads close.",
          toneClass: `tone-${result.planningPosture.primarySourceType}`,
          toneLabel: formatSourceTypeLabel(result.planningPosture.primarySourceType),
          meta: [
            `Trigger: ${truncateForCard(workspaceMoveTrigger, 48)}`,
            firstDestination
              ? `Route: ${firstDestination.name} • ${firstDestination.etaMinutes} min`
              : "Route: choose safer shelter",
          ],
        },
        {
          id: "grounding",
          label: "Grounding",
          headline:
            groundingReadiness.confirmCount > 0
              ? `${groundingReadiness.confirmCount} thing${groundingReadiness.confirmCount === 1 ? "" : "s"} to confirm`
              : "Grounding looks clear",
          detail:
            documentCueSummary
              ? documentCueSummary.actionCue
                ? `Document order: ${truncateForCard(documentCueSummary.actionCue, 72)}`
                : documentCueSummary.timingCue
                  ? `Timing cue: ${truncateForCard(documentCueSummary.timingCue, 72)}`
                  : documentCueSummary.sourceDescriptor
                    ? `${documentCueSummary.sourceDescriptor.label}: ${truncateForCard(
                        documentCueSummary.sourceDescriptor.headline,
                        72,
                      )}`
                    : `${documentCueSummary.extractedCount} document cue${
                        documentCueSummary.extractedCount === 1 ? "" : "s"
                      } shaped this run.`
              : (groundingReadiness.nextConfirm?.detail ?? `${sourceCoverageSummary || "Source view ready."}`),
          toneClass:
            groundingReadiness.confirmCount > 0
              ? "status-confirm"
              : groundingReadiness.advisoryCount > 0
                ? "status-advisory"
                : "status-ready",
          toneLabel:
            groundingReadiness.confirmCount > 0
              ? "confirm"
              : groundingReadiness.advisoryCount > 0
                ? "advisory"
                : "ready",
          meta: [
            sourceCoverageSummary ? `Sources: ${sourceCoverageSummary}` : "Sources: lane ready",
            groundingReadiness.nextConfirm?.title
              ? `Check: ${groundingReadiness.nextConfirm.title}`
              : documentCueSummary?.actionCue
                ? "Check: document order"
                : documentCueSummary?.timingCue
                  ? "Check: document timing"
                  : "Check: no open blocker",
          ],
        },
        {
          id: "walkthrough",
          label: "Walkthrough",
          headline: `Step ${activeMissionStepIndex + 1} of ${missionSteps.length}`,
          detail: `${activeStep.label}: ${activeStep.title}`,
          toneClass: "status-ready",
          toneLabel: "lesson",
          meta: [
            `Progress: ${progressPercent}%`,
            `Focus: ${truncateForCard(activeStep.task, 48)}`,
          ],
        },
        {
          id: "share",
          label: "Share",
          headline: "Voice + flow + runbook",
          detail: shareMissionControlDetail,
          toneClass: activeMissionStepIndex === shareStepIndex ? "tone-retrieved" : "status-ready",
          toneLabel: activeMissionStepIndex === shareStepIndex ? "open" : "ready",
          meta: [
            `Outputs: ${shareMissionControlOutputSummary}`,
            openAIVoiceUrl
              ? "Voice: OpenAI clip ready"
              : openAIVoiceState === "error"
                ? "Voice: generation failed"
                : documentBrief
                  ? "Voice: source-aware script"
                  : `Voice script: ${result.voiceBriefing.language}`,
          ],
        },
      ]
    : [];
  const activeWorkspaceCard =
    workspaceNavigator.find((item) => item.id === resolvedActiveWorkspaceSection) ?? workspaceNavigator[0] ?? null;
  const missionControlChips: MissionControlChip[] = result && groundingReadiness
    ? [
        {
          id: "focus",
          label: "Active focus",
          value: activeWorkspaceCard
            ? `${activeWorkspaceCard.label}: ${truncateForCard(activeWorkspaceCard.headline, 56)}`
            : "Overview",
          toneClass: activeWorkspaceCard?.toneClass ?? "status-ready",
          toneLabel: activeWorkspaceCard?.toneLabel ?? "section",
        },
        {
          id: "confirm",
          label:
            groundingReadiness.confirmCount > 0
              ? "Confirm next"
              : groundingReadiness.advisoryCount > 0
                ? "Review once more"
                : "Grounding",
          value:
            groundingReadiness.nextConfirm?.title ??
            (documentCueSummary?.actionCue
              ? "Verify retrieved document order"
              : documentCueSummary?.timingCue
                ? "Verify retrieved timing cue"
                : "No open blocker"),
          toneClass:
            groundingReadiness.confirmCount > 0
              ? "status-confirm"
              : groundingReadiness.advisoryCount > 0
                ? "status-advisory"
                : "status-ready",
          toneLabel:
            groundingReadiness.confirmCount > 0
              ? "confirm"
              : groundingReadiness.advisoryCount > 0
                ? "review"
                : "ready",
        },
        {
          id: "route",
          label: "First move",
          value: firstDestination
            ? `${firstDestination.name} • ${firstDestination.etaMinutes} min`
            : truncateForCard(workspaceMoveTrigger, 56),
          toneClass: "status-ready",
          toneLabel: "route",
        },
        {
          id: "share",
          label: "Share pack",
          value:
            demoOutputDock.length > 0
              ? `${shareMissionControlOutputSummary} • ${
                  documentBrief ? "source-aware voice" : result.voiceBriefing.language
                }`
              : "Outputs appear after the mission builds",
          toneClass: demoOutputDock.length > 0 ? "tone-retrieved" : "tone-generated",
          toneLabel: demoOutputDock.length > 0 ? "demo ready" : "pending",
        },
      ]
    : [];

  function navigateToWorkspaceSection(targetId: WorkspaceSectionId) {
    switch (targetId) {
      case "overview":
        setWorkspaceSection("overview");
        workspaceHeaderRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        return;
      case "grounding":
        setWorkspaceSection("grounding");
        groundingBoardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        return;
      case "walkthrough":
        setWorkspaceSection("walkthrough");
        lessonCardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        return;
      case "share":
        setWorkspaceSection("share");
        if (shareStepIndex < 0) {
          return;
        }

        setActiveMissionStep(shareStepIndex);
        window.requestAnimationFrame(() => {
          lessonCardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
        });
        return;
      default:
        return;
    }
  }

  useEffect(() => {
    navigateToWorkspaceSectionRef.current = navigateToWorkspaceSection;
  });

  useEffect(() => {
    if (!result || hasAppliedInitialWorkspaceHashRef.current || typeof window === "undefined") {
      return;
    }

    hasAppliedInitialWorkspaceHashRef.current = true;
    const hashSection = parseWorkspaceSectionHash(window.location.hash);
    if (!hashSection || hashSection === resolvedActiveWorkspaceSection) {
      return;
    }

    skipNextWorkspaceHashWriteRef.current = true;
    window.requestAnimationFrame(() => {
      navigateToWorkspaceSectionRef.current(hashSection);
    });
  }, [resolvedActiveWorkspaceSection, result, shareStepIndex]);

  useEffect(() => {
    if (!result || typeof window === "undefined") {
      return;
    }

    if (skipNextWorkspaceHashWriteRef.current) {
      skipNextWorkspaceHashWriteRef.current = false;
      return;
    }

    const nextHash = workspaceSectionHashById[resolvedActiveWorkspaceSection];
    if (window.location.hash.toLowerCase() === nextHash) {
      return;
    }

    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [resolvedActiveWorkspaceSection, result]);

  useEffect(() => {
    if (!result || typeof window === "undefined") {
      return;
    }

    const handleHashChange = () => {
      const hashSection = parseWorkspaceSectionHash(window.location.hash);
      if (!hashSection || hashSection === resolvedActiveWorkspaceSection) {
        return;
      }

      skipNextWorkspaceHashWriteRef.current = true;
      navigateToWorkspaceSectionRef.current(hashSection);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [resolvedActiveWorkspaceSection, result, shareStepIndex]);

  useEffect(() => {
    if (!result || !window.matchMedia("(max-width: 1180px)").matches) {
      previousMissionStepRef.current = activeMissionStep;
      return;
    }

    if (previousMissionStepRef.current !== activeMissionStep) {
      lessonCardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    previousMissionStepRef.current = activeMissionStep;
  }, [activeMissionStep, result]);

  useEffect(() => {
    if (!result || (activeMissionStepIndex === shareStepIndex && shareStepIndex >= 0)) {
      return;
    }

    let frameId = 0;
    const syncActiveWorkspaceSection = () => {
      const sectionTargets = [
        { id: "overview" as const, element: workspaceHeaderRef.current },
        { id: "grounding" as const, element: groundingBoardRef.current },
        { id: "walkthrough" as const, element: lessonCardRef.current },
      ];
      const viewportOffset = window.innerWidth <= 1180 ? 112 : 148;
      const rankedTargets = sectionTargets
        .filter(
          (target): target is { id: Exclude<WorkspaceSectionId, "share">; element: HTMLElement } =>
            Boolean(target.element),
        )
        .map((target) => {
          const rect = target.element.getBoundingClientRect();
          const visible = rect.bottom > viewportOffset && rect.top < window.innerHeight * 0.72;
          const distance = Math.abs(rect.top - viewportOffset);

          return {
            id: target.id,
            distance,
            visible,
          };
        })
        .sort((left, right) => {
          if (left.visible !== right.visible) {
            return left.visible ? -1 : 1;
          }

          return left.distance - right.distance;
        });

      if (rankedTargets[0]) {
        setWorkspaceSection(rankedTargets[0].id);
      }
    };

    frameId = window.requestAnimationFrame(syncActiveWorkspaceSection);
    window.addEventListener("scroll", syncActiveWorkspaceSection, { passive: true });
    window.addEventListener("resize", syncActiveWorkspaceSection);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", syncActiveWorkspaceSection);
      window.removeEventListener("resize", syncActiveWorkspaceSection);
    };
  }, [activeMissionStep, activeMissionStepIndex, result, setWorkspaceSection, shareStepIndex]);

  function highlightShareArtifact(
    target: ShareArtifactTarget,
    options?: { origin?: ShareArtifactJumpOrigin; sourceType?: ShareArtifactJumpSourceType },
  ) {
    if (shareArtifactHighlightFrameRef.current !== null) {
      window.cancelAnimationFrame(shareArtifactHighlightFrameRef.current);
      shareArtifactHighlightFrameRef.current = null;
    }

    if (shareArtifactHighlightTimeoutRef.current !== null) {
      window.clearTimeout(shareArtifactHighlightTimeoutRef.current);
      shareArtifactHighlightTimeoutRef.current = null;
    }

    setHighlightedShareArtifact(null);
    setHighlightedShareArtifactOrigin(null);
    setHighlightedShareArtifactSourceType(null);

    shareArtifactHighlightFrameRef.current = window.requestAnimationFrame(() => {
      shareArtifactHighlightFrameRef.current = null;
      setHighlightedShareArtifact(target);
      setHighlightedShareArtifactOrigin(options?.origin ?? null);
      setHighlightedShareArtifactSourceType(options?.sourceType ?? null);

      shareArtifactHighlightTimeoutRef.current = window.setTimeout(() => {
        setHighlightedShareArtifact((current) => (current === target ? null : current));
        setHighlightedShareArtifactOrigin(null);
        setHighlightedShareArtifactSourceType(null);
        shareArtifactHighlightTimeoutRef.current = null;
      }, 1300);
    });
  }

  useEffect(() => {
    if (shareStepIndex < 0 || activeMissionStep !== shareStepIndex || !pendingShareArtifactRef.current) {
      return;
    }

    const target = pendingShareArtifactRef.current;
    const origin = pendingShareArtifactOriginRef.current;
    const sourceType = pendingShareArtifactSourceTypeRef.current;
    pendingShareArtifactRef.current = null;
    pendingShareArtifactOriginRef.current = null;
    pendingShareArtifactSourceTypeRef.current = null;

    const frameId = window.requestAnimationFrame(() => {
      const artifactTarget =
        target === "voice"
          ? voiceArtifactCardRef.current
          : target === "action-card"
            ? actionArtifactCardRef.current
            : flowArtifactCardRef.current;
      artifactTarget?.scrollIntoView({ block: "start", behavior: "smooth" });
      highlightShareArtifact(target, { origin: origin ?? undefined, sourceType: sourceType ?? undefined });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [activeMissionStep, shareStepIndex]);

  useEffect(() => {
    if (!result || !window.matchMedia("(max-width: 1180px)").matches) {
      return;
    }

    workspaceRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [result]);

  useEffect(
    () => () => {
      if (shareArtifactHighlightFrameRef.current !== null) {
        window.cancelAnimationFrame(shareArtifactHighlightFrameRef.current);
        shareArtifactHighlightFrameRef.current = null;
      }

      if (shareArtifactHighlightTimeoutRef.current !== null) {
        window.clearTimeout(shareArtifactHighlightTimeoutRef.current);
        shareArtifactHighlightTimeoutRef.current = null;
      }

      if (sourceLedgerHighlightTimeoutRef.current !== null) {
        window.clearTimeout(sourceLedgerHighlightTimeoutRef.current);
        sourceLedgerHighlightTimeoutRef.current = null;
      }
    },
    [],
  );

  function scrollToWorkspaceTarget(target: HTMLElement | null) {
    target?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function scrollToWorkspaceHeader() {
    scrollToWorkspaceTarget(workspaceHeaderRef.current);
  }

  function scrollToGroundingBoard() {
    scrollToWorkspaceTarget(groundingBoardRef.current);
  }

  function scrollToLessonCard() {
    scrollToWorkspaceTarget(lessonCardRef.current);
  }

  function scrollToShareArtifact(
    target: ShareArtifactTarget,
    options?: { highlight?: boolean; origin?: ShareArtifactJumpOrigin; sourceType?: ShareArtifactJumpSourceType },
  ) {
    const artifactTarget =
      target === "voice"
        ? voiceArtifactCardRef.current
        : target === "action-card"
          ? actionArtifactCardRef.current
          : flowArtifactCardRef.current;
    scrollToWorkspaceTarget(artifactTarget);

    if (options?.highlight) {
      highlightShareArtifact(target, { origin: options.origin, sourceType: options.sourceType });
    }
  }

  function jumpToSourceLedgerExportControls() {
    if (!riskSourceExportBrief) {
      return;
    }

    setWorkspaceSection("grounding");
    window.requestAnimationFrame(() => {
      if (sourceLedgerExportControlsRef.current) {
        scrollToWorkspaceTarget(sourceLedgerExportControlsRef.current);
        return;
      }

      scrollToGroundingBoard();
    });
  }

  function jumpToMissionStep(stepIndex: number) {
    if (stepIndex < 0) {
      return;
    }

    setActiveMissionStep(stepIndex);
    requestAnimationFrame(() => {
      lessonCardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function applyStoryFrame(frameIndex: number) {
    if (!activeStep || activeCourseFrames.length === 0) {
      return;
    }

    const nextFrameIndex = Math.max(0, Math.min(frameIndex, activeCourseFrames.length - 1));
    const nextFrame = activeCourseFrames[nextFrameIndex];

    if (!nextFrame) {
      return;
    }

    setStoryFrameByStep((previousValue) => ({ ...previousValue, [activeStep.id]: nextFrameIndex }));
    setFirstPersonViewByStep((previousValue) => ({ ...previousValue, [activeStep.id]: nextFrame.viewId }));
    setVideoBeatByStep((previousValue) => ({
      ...previousValue,
      [activeStep.id]:
        nextFrame.viewId === "entry" ? "briefing" : nextFrame.viewId === "corridor" ? "movement" : "decision",
    }));
  }

  function advanceStory() {
    if (!activeStep || activeCourseFrames.length === 0) {
      return;
    }

    if (activeStoryFrameIndex < activeCourseFrames.length - 1) {
      applyStoryFrame(activeStoryFrameIndex + 1);
      return;
    }

    jumpToMissionStep(Math.min(missionSteps.length - 1, activeMissionStepIndex + 1));
  }

  useEffect(() => {
    if (!result) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isShortcutBlockedTarget(event.target)) {
        return;
      }

      const nextSection = workspaceSectionByShortcut[event.key] ?? null;
      if (!nextSection) {
        return;
      }

      event.preventDefault();
      navigateToWorkspaceSectionRef.current(nextSection);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [result, shareStepIndex]);

  function openShareArtifactPreview(
    target: ShareArtifactTarget,
    origin: ShareArtifactJumpOrigin,
    sourceType?: ShareArtifactJumpSourceType,
  ) {
    if (shareStepIndex < 0) {
      return;
    }

    if (shareArtifactLaneFilter !== "all") {
      setShareArtifactLaneFilter("all");
    }

    if (activeMissionStepIndex === shareStepIndex) {
      requestAnimationFrame(() => {
        scrollToShareArtifact(target, { highlight: true, origin, sourceType });
      });
      return;
    }

    pendingShareArtifactRef.current = target;
    pendingShareArtifactOriginRef.current = origin;
    pendingShareArtifactSourceTypeRef.current = sourceType ?? null;
    setWorkspaceSection("share");
    jumpToMissionStep(shareStepIndex);
  }

  function primeWinningJudgePath() {
    if (!result || missionSteps.length === 0) {
      return;
    }

    const nextDecisions: Record<string, string> = {};
    const nextQuizAnswers: Record<string, string> = {};
    const nextViews: Record<string, FirstPersonViewId> = {};
    const nextVideoBeats: Record<string, InteractiveVideoBeatId> = {};

    missionSteps.forEach((step, index) => {
      const scene = buildIncidentStoryScene(result, form, step.id, index);
      const bestDecision = scene.decisions.reduce((best, decision) =>
        scoreDecisionImpact(decision) > scoreDecisionImpact(best) ? decision : best,
      );
      const correctAnswer = scene.quiz.answers.find((answer) => answer.correct);

      nextDecisions[step.id] = bestDecision.id;
      if (correctAnswer) {
        nextQuizAnswers[step.id] = correctAnswer.id;
      }
      nextViews[step.id] = "gate";
      nextVideoBeats[step.id] = "decision";
    });

    setStoryDecisionByStep((previousValue) => ({
      ...previousValue,
      ...nextDecisions,
    }));
    setQuizAnswerByStep((previousValue) => ({
      ...previousValue,
      ...nextQuizAnswers,
    }));
    setFirstPersonViewByStep((previousValue) => ({
      ...previousValue,
      ...nextViews,
    }));
    setVideoBeatByStep((previousValue) => ({
      ...previousValue,
      ...nextVideoBeats,
    }));
    setWorkspaceSection("walkthrough");
    jumpToMissionStep(0);
  }

  function jumpToJudgeDemoCue(cue: JudgeDemoCue) {
    if (cue.target === "run") {
      handleRunHackathonDemo();
      return;
    }

    if (!result) {
      return;
    }

    if (cue.stepId) {
      const stepIndex = missionSteps.findIndex((step) => step.id === cue.stepId);
      if (stepIndex >= 0) {
        if (cue.decisionId) {
          setStoryDecisionByStep((previousValue) => ({
            ...previousValue,
            [cue.stepId as string]: cue.decisionId as string,
          }));
        }
        if (cue.quizAnswerId) {
          setQuizAnswerByStep((previousValue) => ({
            ...previousValue,
            [cue.stepId as string]: cue.quizAnswerId as string,
          }));
        }
        if (cue.viewId) {
          setFirstPersonViewByStep((previousValue) => ({
            ...previousValue,
            [cue.stepId as string]: cue.viewId as FirstPersonViewId,
          }));
        }
        if (cue.videoBeatId) {
          setVideoBeatByStep((previousValue) => ({
            ...previousValue,
            [cue.stepId as string]: cue.videoBeatId as InteractiveVideoBeatId,
          }));
        }
        setActiveMissionStep(stepIndex);
      }
    }

    if (cue.target === "source") {
      setIsSourceProofOpen(true);
      setWorkspaceSection("walkthrough");
      requestAnimationFrame(() => {
        lessonCardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
      return;
    }

    if (cue.target === "share") {
      navigateToWorkspaceSection("share");
      return;
    }

    if (cue.target === "voice" || cue.target === "action-card" || cue.target === "flow") {
      openShareArtifactPreview(cue.target, "judge-demo", cue.sourceType);
      return;
    }

    setWorkspaceSection("walkthrough");
    requestAnimationFrame(() => {
      lessonCardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function handleDemoOutputAction(actionId: DemoOutputCard["actionId"]) {
    switch (actionId) {
      case "voice":
        handleToggleVoicePlayback();
        return;
      case "action-card":
        void handleCopyPortableActionCard();
        return;
      case "flow":
        void handleCopyFlowView();
        return;
      case "runbook":
        handleDownloadRunbook(judgeDemoBrief);
        return;
      default:
        return;
    }
  }

  function updateField<K extends keyof IntakeForm>(field: K, value: IntakeForm[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function focusTimingOverrideReasonInput() {
    const intakeDrawer = documentIntakeDrawerRef.current;
    const input = timingOverrideReasonInputRef.current;

    if (!input) {
      return;
    }

    if (intakeDrawer && !intakeDrawer.open) {
      intakeDrawer.open = true;
    }

    requestAnimationFrame(() => {
      input.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      input.focus();
    });
  }

  function focusDocumentEffectiveTimeInput() {
    const intakeDrawer = documentIntakeDrawerRef.current;
    const input = documentEffectiveTimeInputRef.current;

    if (!input) {
      return;
    }

    if (intakeDrawer && !intakeDrawer.open) {
      intakeDrawer.open = true;
    }

    requestAnimationFrame(() => {
      input.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      input.focus();
    });
  }

  function focusDocumentSourceLabelInput() {
    const intakeDrawer = documentIntakeDrawerRef.current;
    const input = documentSourceLabelInputRef.current;

    if (!input) {
      return;
    }

    if (intakeDrawer && !intakeDrawer.open) {
      intakeDrawer.open = true;
    }

    requestAnimationFrame(() => {
      input.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      input.focus();
    });
  }

  function focusVerbatimOcrInput() {
    const intakeDrawer = documentIntakeDrawerRef.current;

    if (intakeDrawer && !intakeDrawer.open) {
      intakeDrawer.open = true;
    }

    if (documentImportState.status === "hook") {
      handleInsertOcrTemplate();
    }

    requestAnimationFrame(() => {
      const input = documentContextInputRef.current;
      if (!input) {
        return;
      }

      input.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      input.focus();

      const markerIndex = input.value.toLowerCase().indexOf(ocrVerbatimMarker.toLowerCase());
      const cursorIndex = markerIndex >= 0 ? markerIndex + ocrVerbatimMarker.length : input.value.length;
      input.setSelectionRange(cursorIndex, cursorIndex);
    });
  }

  function openDocumentIntakeDrawer() {
    const intakeDrawer = documentIntakeDrawerRef.current;

    if (!intakeDrawer) {
      return;
    }

    if (!intakeDrawer.open) {
      intakeDrawer.open = true;
    }

    requestAnimationFrame(() => {
      intakeDrawer.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    });
  }

  async function ingestDocumentFile(file: File) {
    setOcrPromptCopyState("idle");
    updateField("documentSourceName", formatImportedSourceLabel(file.name));
    updateField("documentEffectiveTime", "");
    updateField("documentTimingOverride", "auto");
    updateField("documentTimingOverrideReason", "");
    setDocumentImportState({
      status: "loading",
      fileName: file.name,
      message: `Loading ${file.name} into the document lane...`,
    });

    try {
      if (isTextLikeSourceFile(file)) {
        const text = normalizeImportedText(await file.text());

        if (!text) {
          setDocumentImportState({
            status: "error",
            fileName: file.name,
            message: `${file.name} did not contain readable text. Paste an OCR extract or try another file.`,
          });
          return;
        }

        updateField("documentContext", text);
        updateField(
          "documentSourceName",
          extractSourceLabelCandidate(text) ?? formatImportedSourceLabel(file.name),
        );
        updateField("documentEffectiveTime", extractEffectiveTimeCandidate(text) ?? "");
        updateField("documentTimingOverride", "auto");
        updateField("documentTimingOverrideReason", "");
        setDocumentImportState({
          status: "loaded",
          fileName: file.name,
          message: `${file.name} loaded into the retrieved-guidance lane. You can edit the text below before regenerating the mission.`,
        });
        return;
      }

      if (isHookableBinarySourceFile(file)) {
        const fileKindLabel = describeBinarySourceFile(file.name);
        const templateMerge = mergeDocumentContextWithTemplate(
          form.documentContext,
          buildOcrPasteTemplate(file.name, fileKindLabel),
        );
        if (templateMerge.inserted) {
          updateField("documentContext", templateMerge.nextContext);
        }
        setDocumentImportState({
          status: "hook",
          fileName: file.name,
          message: templateMerge.inserted
            ? `${file.name} is staged as a ${fileKindLabel.toLowerCase()} hook and the OCR intake scaffold is ready below. Paste extracted text under "Verbatim OCR" to activate retrieved cues.`
            : `${file.name} is staged as a ${fileKindLabel.toLowerCase()} hook. Copy the OCR handoff prompt below, extract text outside Beacon, then paste the result into the retrieved-guidance lane.`,
        });
        return;
      }

      setDocumentImportState({
        status: "error",
        fileName: file.name,
        message: "Use TXT, MD, JSON, CSV, PDF, DOCX, or image files for the document lane.",
      });
    } catch {
      setDocumentImportState({
        status: "error",
        fileName: file.name,
        message: `Beacon could not read ${file.name}. Paste the text directly to keep the mission moving.`,
      });
    }
  }

  function handleDocumentFileSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      void ingestDocumentFile(file);
    }

    event.target.value = "";
  }

  function handleDocumentDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];

    if (file) {
      void ingestDocumentFile(file);
    }
  }

  function applyPreset(index: number) {
    setForm(demoPresets[index].state);
    setActivePresetIndex(index);
    setResult(null);
    setIsMissionControlExpanded(false);
    setActiveMissionStep(0);
    setError(null);
    setActionCardCopyState("idle");
    setVoiceHandoffCopyState("idle");
    setOcrPromptCopyState("idle");
    setRiskSourceExportCopyState("idle");
    setCopyState("idle");
    setFlowCopyState("idle");
    setRouteCardCopyState("idle");
    setLiveCoachInput("");
    setLiveCoachReply("");
    setLiveCoachState("idle");
    setLiveCoachSource(null);
    setMissionStartedAt(null);
    setMissionElapsedSeconds(0);
    setOpenAIVoiceState("idle");
    setOpenAIVoiceUrl("");
    setOpenAIVoiceError("");
    setJudgePathCopyState("idle");
    setWorkspaceLinkCopyState("idle");
    setWorkspaceQuickLinkCopyState("idle");
    setWorkspaceQuickLinkCopiedSection(null);
    setDownloadState("idle");
    setVoiceLayerMode("planner");
    setDocumentImportState(initialDocumentImportState);
  }

  function selectHazard(hazard: IntakeForm["hazard"]) {
    updateField("hazard", hazard);
    const matchingPresetIndex = demoPresets.findIndex((preset) => preset.state.hazard === hazard);
    setActivePresetIndex(matchingPresetIndex >= 0 ? matchingPresetIndex : null);
    setResult(null);
    setIsMissionControlExpanded(false);
    setActiveMissionStep(0);
    setActionCardCopyState("idle");
    setVoiceHandoffCopyState("idle");
    setOcrPromptCopyState("idle");
    setRiskSourceExportCopyState("idle");
    setCopyState("idle");
    setFlowCopyState("idle");
    setRouteCardCopyState("idle");
    setLiveCoachInput("");
    setLiveCoachReply("");
    setLiveCoachState("idle");
    setLiveCoachSource(null);
    setMissionStartedAt(null);
    setMissionElapsedSeconds(0);
    setOpenAIVoiceState("idle");
    setOpenAIVoiceUrl("");
    setOpenAIVoiceError("");
    setJudgePathCopyState("idle");
    setWorkspaceLinkCopyState("idle");
    setWorkspaceQuickLinkCopyState("idle");
    setWorkspaceQuickLinkCopiedSection(null);
    setDownloadState("idle");
    setVoiceLayerMode("planner");
  }

  function cyclePreset(direction: "previous" | "next") {
    const offset = direction === "next" ? 1 : -1;
    const current = activePresetIndex ?? 0;
    const next = (current + offset + demoPresets.length) % demoPresets.length;
    applyPreset(next);
  }

  function applyQuickGroupPreset(profile: (typeof quickGroupPresets)[number]) {
    updateField("adults", profile.adults);
    updateField("children", profile.children);
    updateField("elders", profile.elders);
    updateField("pets", profile.pets);
  }

  function resetMissionRunUi() {
    setActionCardCopyState("idle");
    setVoiceHandoffCopyState("idle");
    setOcrPromptCopyState("idle");
    setRiskSourceExportCopyState("idle");
    setCopyState("idle");
    setFlowCopyState("idle");
    setRouteCardCopyState("idle");
    setLiveCoachState("idle");
    setOpenAIVoiceState("idle");
    setJudgePathCopyState("idle");
    setWorkspaceLinkCopyState("idle");
    setWorkspaceQuickLinkCopyState("idle");
    setWorkspaceQuickLinkCopiedSection(null);
    setDownloadState("idle");
    setVoiceLayerMode("planner");
    setIsMissionControlExpanded(false);
    setAgentEvidence({ status: "idle" });
  }

  function getCurrentDemoPresetIndex() {
    const selectedPresetIndex =
      activePresetIndex ?? demoPresets.findIndex((preset) => preset.state.hazard === form.hazard);

    return selectedPresetIndex >= 0 ? selectedPresetIndex : 0;
  }

  function handleReturnToScenarioCinema() {
    applyPreset(getCurrentDemoPresetIndex());

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }

  function handleRestartScenarioRun() {
    launchScenarioPreset(getCurrentDemoPresetIndex());
  }

  function buildMission(nextForm: IntakeForm) {
    setError(null);

    startTransition(async () => {
      resetMissionRunUi();
      setAgentEvidence({ status: "loading" });
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextForm),
      });

      const data = (await response.json()) as ActionBundle | { error?: string };

      if (!response.ok || !("actionCardTitle" in data)) {
        setResult(null);
        setAgentEvidence({ status: "idle" });
        setError(("error" in data ? data.error : undefined) ?? "Unable to build a mission right now.");
        return;
      }

      setResult(data);
      setVoiceLayerMode(data.documentBrief ? "source-aware" : "planner");
      setActiveMissionStep(0);
      setMissionStartedAt(Date.now());
      setMissionElapsedSeconds(0);
      setStoryDecisionByStep({});
      setQuizAnswerByStep({});
      setFirstPersonViewByStep({});
      setVideoBeatByStep({});
      setRouteRuleChoiceByStep({});
      setLiveCoachInput("");
      setLiveCoachReply("");
      setLiveCoachState("idle");
      setLiveCoachSource(null);
      setOpenAIVoiceState("idle");
      setOpenAIVoiceUrl("");
      setOpenAIVoiceError("");
      retrieveAgentEvidence(nextForm).catch(() => {
        setAgentEvidence({
          status: "error",
          message: "Agent evidence could not be retrieved for this run.",
        });
      });
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
      }
    });
  }

  async function retrieveAgentEvidence(nextForm: IntakeForm) {
    const scenario =
      demoPresets.find((preset) => preset.state.hazard === nextForm.hazard && preset.state.role === nextForm.role)
        ?.label ?? selectedCourse.label;
    const response = await fetch("/api/agent/retrieve-guidance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scenario,
        hazard: nextForm.hazard,
        role: traineeRoleId || nextForm.role,
        condition: [
          nextForm.notes,
          nextForm.mobilityNeeds ? `mobility needs: ${nextForm.mobilityNeeds}` : null,
          nextForm.weakInternet ? "weak internet" : null,
          nextForm.documentContext ? "retrieved route guidance attached" : null,
        ]
          .filter(Boolean)
          .join(" | "),
        userDecision: "mission build started",
      }),
    });

    const data = (await response.json()) as AgentEvidenceResponse | { error?: string };

    if (!response.ok || !("recommended_action" in data)) {
      setAgentEvidence({
        status: "error",
        message: ("error" in data ? data.error : undefined) ?? "Agent evidence retrieval failed.",
      });
      return;
    }

    setAgentEvidence({ status: "ready", data });
  }

  function handleRunHackathonDemo() {
    const presetIndex = getCurrentDemoPresetIndex();
    const selectedPreset = demoPresets[presetIndex];
    const fallbackDemoSource = buildDemoRetrievedSource(selectedPreset.state, selectedPreset.state.location);
    const hasPresetSource = Boolean(selectedPreset.state.documentContext.trim());
    const nextForm: IntakeForm = {
      ...selectedPreset.state,
      documentContext: hasPresetSource ? selectedPreset.state.documentContext : fallbackDemoSource.context,
      documentSourceName: hasPresetSource ? selectedPreset.state.documentSourceName : fallbackDemoSource.sourceName,
      documentEffectiveTime: hasPresetSource
        ? selectedPreset.state.documentEffectiveTime
        : fallbackDemoSource.effectiveTime,
    };

    setForm(nextForm);
    setActivePresetIndex(presetIndex);
    setDocumentImportState({
      status: "loaded",
      fileName: `hackathon-${selectedPreset.state.hazard}-demo-source.txt`,
      message: `${selectedPreset.label} source loaded into the retrieved-guidance lane and used to build this mission.`,
    });
    buildMission(nextForm);
  }

  function launchScenarioPreset(index: number) {
    const selectedPreset = demoPresets[index];
    const fallbackDemoSource = buildDemoRetrievedSource(selectedPreset.state, selectedPreset.state.location);
    const hasPresetSource = Boolean(selectedPreset.state.documentContext.trim());
    const nextForm: IntakeForm = {
      ...selectedPreset.state,
      documentContext: hasPresetSource ? selectedPreset.state.documentContext : fallbackDemoSource.context,
      documentSourceName: hasPresetSource ? selectedPreset.state.documentSourceName : fallbackDemoSource.sourceName,
      documentEffectiveTime: hasPresetSource
        ? selectedPreset.state.documentEffectiveTime
        : fallbackDemoSource.effectiveTime,
    };

    setForm(nextForm);
    setActivePresetIndex(index);
    setDocumentImportState({
      status: "loaded",
      fileName: `hackathon-${selectedPreset.state.hazard}-demo-source.txt`,
      message: `${selectedPreset.label} source loaded into the retrieved-guidance lane and used to build this mission.`,
    });
    buildMission(nextForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isTimingOverrideReasonMissing) {
      setError(missingTimingOverrideReasonError);
      focusTimingOverrideReasonInput();
      return;
    }

    buildMission(form);
  }

  return (
    <main className={`shell ${result ? "shell-mission" : "shell-start"}`}>
      <div className="topography" aria-hidden="true" />
      <section className="introPane" aria-label="Scenario builder">
        <div className="brandRow">
          <div>
            <p className="eyebrow">Fire movement learning simulator</p>
            <h1>Fireline Commander</h1>
          </div>
          <p className="statusNote">Role-based drills · decision consequences · by Arnav Salkade</p>
        </div>

        <section
          className="scenarioCinema scenarioCinemaNetflix"
          aria-label="Scenario launcher"
          style={{ backgroundImage: `url(${getScenarioGalleryImageSet(form.hazard)[0]})` }}
        >
          <nav className="scenarioSideNav" aria-label="Landing navigation">
            <button
              type="button"
              aria-label="Search drills"
              onClick={() => scenarioSearchInputRef.current?.focus()}
            >
              ⌕
            </button>
            <button type="button" className="isActive" aria-label="Show featured drill" onClick={() => setActivePresetIndex(0)}>
              ⌂
            </button>
            <button type="button" aria-label="Start selected drill" onClick={() => launchScenarioPreset(activePresetIndex ?? 0)}>
              ↝
            </button>
            <button type="button" aria-label="Next drill" onClick={() => cyclePreset("next")}>
              ▱
            </button>
            <button type="button" aria-label="Start featured training drill" onClick={handleRunHackathonDemo}>
              ＋
            </button>
          </nav>
          <div
            className={`scenarioCinemaPreview scenarioPoster-${form.hazard}`}
            aria-label={`${activePreset ? activePreset.label : selectedCourse.label} preview`}
            style={{ backgroundImage: `url(${getScenarioGalleryImageSet(form.hazard)[0]})` }}
          >
            <div className="scenarioCinemaPreviewCopy">
              <p className="eyebrow">Fire movement training</p>
              <h2>{activePreset ? activePreset.label : selectedCourse.label}</h2>
              <p>{activePreset ? activePreset.judgeHook : selectedCourse.challenge}</p>
              <div className="scenarioHackathonBadges" aria-label="Training features">
                <span>Role-based drill</span>
                <span>Decision consequences</span>
                <span>Map + checklist review</span>
              </div>
              <div className="scenarioHeroActions">
                <button type="button" onClick={() => launchScenarioPreset(activePresetIndex ?? 0)} disabled={isPending}>
                  ▶ Play
                </button>
                <span>{activePreset ? activePreset.routeSkill : selectedCourse.promise}</span>
              </div>
            </div>
            <label className="scenarioSearchBox">
              <span>Search drills</span>
              <input
                ref={scenarioSearchInputRef}
                value={scenarioSearch}
                onChange={(event) => setScenarioSearch(event.target.value)}
                placeholder="Search Manila, school, flood, clinic..."
              />
            </label>
            <div className="scenarioCinemaRail" aria-label="Playable scenario carousel">
              {filteredScenarioPresets.map(({ preset, index }) => {
                const isActive = activePresetIndex === index;

                return (
                  <button
                    key={preset.label}
                    type="button"
                    className={`scenarioCinemaCard scenarioCinemaCard-${preset.state.hazard} ${
                      isActive ? "isActive" : ""
                    }`}
                    style={{ backgroundImage: `linear-gradient(90deg, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.2)), url(${getScenarioGalleryImageSet(preset.state.hazard)[1]})` }}
                    onClick={() => launchScenarioPreset(index)}
                    disabled={isPending}
                  >
                    <span>{preset.label}</span>
                    <strong>{preset.detail}</strong>
                    <small className="scenarioCinemaStakes">{preset.judgeHook}</small>
                    <small className="scenarioCinemaSkill">Route skill: {preset.routeSkill}</small>
                    <span className="scenarioCinemaAction">
                      {isPending && isActive ? "Opening..." : getScenarioStartLabel(preset.state.hazard)}
                    </span>
                  </button>
                );
              })}
              {filteredScenarioPresets.length === 0 ? (
                <div className="scenarioSearchEmpty" role="status">
                  No drill matched. Try Manila, Marikina, flood, clinic, or school.
                </div>
              ) : null}
            </div>
            <div className="scenarioCinemaPreviewSteps" aria-label="Mission flow">
              <span>01 Read scene</span>
              <span>02 Move route</span>
              <span>03 Speak command</span>
            </div>
          </div>
        </section>

        <div
          key={scenarioLabel}
          className={`fieldVisual fieldVisual-${form.hazard}`}
          aria-label={`${scenarioLabel} field context`}
        >
          {form.hazard === "fire" ? (
            <img src="/harbor-stage-01-alarm.png" alt="Generated fireline school evacuation drill scene" />
          ) : (
            <div className={`scenarioPoster scenarioPoster-${form.hazard}`} aria-hidden="true">
              <span className="scenarioPosterRoute" />
              <span className="scenarioPosterNode scenarioPosterNode-start" />
              <span className="scenarioPosterNode scenarioPosterNode-action" />
              <span className="scenarioPosterNode scenarioPosterNode-safe" />
              <span className="scenarioPosterHazard" />
            </div>
          )}
          <div className="fieldVisualOverlay">
            <p className="posterKicker">Playable mission</p>
            <h2>{scenarioLabel}</h2>
            <p>{selectedCourse.promise}</p>
            {activePreset ? (
              <p className="fieldVisualPreset">
                Preset: {activePreset.label} · {activePreset.detail}
              </p>
            ) : null}
          </div>
          <p className="imageCredit">
            {form.hazard === "fire"
              ? "Generated scenario art: fireline school POV"
              : `Procedural route poster: ${selectedCourse.label.toLowerCase()} training path`}
          </p>
          <div className="fieldVisualControls" aria-label="Preset slideshow controls">
            <button
              type="button"
              className="secondaryButton fieldVisualControl"
              onClick={() => cyclePreset("previous")}
            >
              Previous
            </button>
            <button
              type="button"
              className="secondaryButton fieldVisualControl"
              onClick={() => cyclePreset("next")}
            >
              Next
            </button>
          </div>
        </div>

        <section className="quickLaunchPanel" aria-label="Quick mission launch">
          <div className="quickLaunchHeader">
            <div>
              <p className="detailLabel">Agent quick start</p>
              <strong>Pick a preset and start immediately</strong>
            </div>
            <span className={`tonePill ${missionBuildMode.toneClass}`}>{missionBuildMode.badgeLabel}</span>
          </div>
          <p className="quickLaunchLead">
            One-tap training path: choose a role, enter the trainee POV, make choices, see consequences,
            and close the handoff.
          </p>
          {activePreset ? (
            <div className="scenarioJudgeGrid" aria-label="Learning criteria for selected scenario">
              <article>
                <span>Problem</span>
                <strong>{activePreset.track}</strong>
                <p>{activePreset.judgeHook}</p>
              </article>
              <article>
                <span>Skill</span>
                <strong>Route skill</strong>
                <p>{activePreset.routeSkill}</p>
              </article>
              <article>
                <span>Review</span>
                <strong>Consequence map</strong>
                <p>Every choice changes safety, speed, accountability, and the final handoff.</p>
              </article>
            </div>
          ) : null}
          <div className="quickLaunchMeta">
            <span className="tonePill tone-official">{form.location || "Set location"}</span>
            <span className="tonePill tone-generated">
              {form.adults} adults · {form.children} children · {form.elders} elders
            </span>
            <span className="tonePill tone-retrieved">
              Retrieved: {hasRetrievedDocumentContext ? "attached" : "none"}
            </span>
          </div>
          <button
            type="button"
            className="primaryButton quickLaunchDemoAction"
            onClick={handleRunHackathonDemo}
            disabled={isPending}
          >
            {isPending ? "Opening drill..." : "Run selected drill"}
          </button>
          {missionBuildMode.showHookAction ? (
            <div className="quickLaunchHookRecovery" role="status" aria-live="polite">
              <p>OCR hook is staged. Jump to the Verbatim OCR marker before starting this mission.</p>
              <button
                type="button"
                className="secondaryButton quickLaunchHookRecoveryAction"
                onClick={focusVerbatimOcrInput}
                aria-controls={pastedGuidanceTextareaId}
              >
                Jump to Verbatim OCR
              </button>
            </div>
          ) : null}
        </section>

        <div className="courseDeck" aria-label="Emergency courses">
          <div className="courseDeckHeader">
            <p className="eyebrow">Pick a scenario</p>
            <span>{selectedCourse.challenge}</span>
          </div>
          {hazardCourses.map((course) => (
            <button
              key={course.value}
              type="button"
              className={`courseButton ${form.hazard === course.value ? "isActive" : ""}`}
              onClick={() => selectHazard(course.value)}
            >
              <span>{course.label}</span>
              <strong>{course.promise}</strong>
            </button>
          ))}
        </div>

        <div className="presetStripHeader">
          <p className="eyebrow">5 scenario routes</p>
          <div className="presetStripActions">
            <button type="button" className="secondaryButton" onClick={() => cyclePreset("previous")}>
              Previous
            </button>
            <button type="button" className="secondaryButton" onClick={() => cyclePreset("next")}>
              Next
            </button>
          </div>
        </div>
        <div className="presetBar" role="tablist" aria-label="Demo missions">
          {demoPresets.map((preset, index) => (
            <button
              key={preset.label}
              type="button"
              className={`presetButton ${activePresetIndex === index ? "isActive" : ""}`}
              onClick={() => applyPreset(index)}
            >
              <span>{preset.label}</span>
              <small>{preset.detail}</small>
              <small className="presetRouteSkill">{preset.routeSkill}</small>
            </button>
          ))}
        </div>

        <form className="plannerForm" onSubmit={handleSubmit}>
          <div className="actionRow actionRowQuick">
            <button
              className="primaryButton quickLaunchPrimary"
              type="submit"
              disabled={isPending || isTimingOverrideReasonMissing}
            >
              {isPending ? "Building mission..." : result ? "Start updated mission" : "Start mission"}
            </button>
            <button
              type="button"
              className="secondaryButton"
              onClick={openDocumentIntakeDrawer}
            >
              Add source (optional)
            </button>
            <button
              type="button"
              className="secondaryButton hackathonDemoButton"
              onClick={handleRunHackathonDemo}
              disabled={isPending}
            >
              Run selected demo
            </button>
            {missionBuildMode.showHookAction ? (
              <button
                type="button"
                className="tonePill tonePillButton status-advisory quickLaunchTrustChip"
                onClick={focusVerbatimOcrInput}
                aria-controls={pastedGuidanceTextareaId}
              >
                OCR hook pending. Jump to Verbatim OCR.
              </button>
            ) : null}
          </div>

          <Field label="Where are you?">
            <input
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
              placeholder="Manila, Philippines"
            />
          </Field>

          <div className="choiceGroup" aria-label="Audience">
            <p className="detailLabel">Who are you guiding?</p>
            <div>
              {roleOptions.map((option) => (
                <ChoiceButton
                  key={option.value}
                  active={form.role === option.value}
                  label={option.label}
                  onClick={() => updateField("role", option.value)}
                />
              ))}
            </div>
          </div>

          <div className="choiceGroup" aria-label="Language">
            <p className="detailLabel">Briefing style</p>
            <div>
              {languageOptions.map((option) => (
                <ChoiceButton
                  key={option.value}
                  active={form.language === option.value}
                  label={option.label}
                  onClick={() => updateField("language", option.value)}
                />
              ))}
            </div>
          </div>

          <div className="peopleGrid">
            <Stepper label="Adults" value={form.adults} onChange={(value) => updateField("adults", value)} />
            <Stepper
              label="Children"
              value={form.children}
              onChange={(value) => updateField("children", value)}
            />
            <Stepper label="Elders" value={form.elders} onChange={(value) => updateField("elders", value)} />
            <Stepper label="Pets" value={form.pets} onChange={(value) => updateField("pets", value)} />
          </div>
          <div className="choiceGroup" aria-label="Quick group presets">
            <p className="detailLabel">Quick group presets</p>
            <div>
              {quickGroupPresets.map((profile) => (
                <ChoiceButton
                  key={profile.id}
                  active={
                    form.adults === profile.adults &&
                    form.children === profile.children &&
                    form.elders === profile.elders &&
                    form.pets === profile.pets
                  }
                  label={profile.label}
                  onClick={() => applyQuickGroupPreset(profile)}
                />
              ))}
            </div>
          </div>

          <details className="briefDrawer intakeFineTuneDrawer">
            <summary>Fine-tune details (optional)</summary>
            <div className="promptStack">
              <Field label="Critical items">
                <input
                  value={form.medications}
                  onChange={(event) => updateField("medications", event.target.value)}
                  placeholder="Meds, inhalers, documents"
                />
              </Field>

              <Field label="Access needs">
                <input
                  value={form.mobilityNeeds}
                  onChange={(event) => updateField("mobilityNeeds", event.target.value)}
                  placeholder="Stairs, wheelchair, hearing support"
                />
              </Field>

              <Field label="What should Beacon know?">
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="No car, near the bay, weak signal after storms..."
                  rows={3}
                />
              </Field>
            </div>

            <div className="choiceGroup" aria-label="Connectivity">
              <p className="detailLabel">Connectivity</p>
              <div>
                <ChoiceButton
                  active={!form.weakInternet}
                  label="Normal"
                  onClick={() => updateField("weakInternet", false)}
                />
                <ChoiceButton
                  active={form.weakInternet}
                  label="Weak signal"
                  onClick={() => updateField("weakInternet", true)}
                />
              </div>
            </div>
          </details>

          <details ref={documentIntakeDrawerRef} className="briefDrawer">
            <summary>Add a bulletin, OCR extract, or document note</summary>
            <section className="documentImportPanel" aria-label="Document source import">
              <div className="documentImportHeader">
                <div>
                  <p className="detailLabel">Document import hook</p>
                  <strong>Drop a source file or load text directly into Beacon</strong>
                </div>
                <span
                  className={`tonePill ${
                    documentImportState.status === "loaded"
                      ? "status-ready"
                      : documentImportState.status === "hook"
                        ? "tone-retrieved"
                        : documentImportState.status === "error"
                          ? "status-confirm"
                          : "tone-generated"
                  }`}
                >
                  {documentImportState.status === "loaded"
                    ? "text ingested"
                    : documentImportState.status === "hook"
                      ? "hook ready"
                      : documentImportState.status === "error"
                        ? "needs text"
                        : "manual or file"}
                </span>
              </div>
              <div
                className={`documentDropZone documentDropZone-${documentImportState.status}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDocumentDrop}
              >
                <strong>TXT, MD, JSON, CSV, PDF, DOCX, or image</strong>
                <p>
                  Text-like files load straight into the retrieved-guidance lane. PDF, DOCX, and
                  image files stay honest as OCR hooks until you paste extracted text.
                </p>
                <div className="documentImportActions">
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => documentImportInputRef.current?.click()}
                  >
                    Select source file
                  </button>
                  <span>Drop one file here for a fast demo handoff.</span>
                </div>
                <input
                  ref={documentImportInputRef}
                  type="file"
                  accept={documentImportAccept}
                  className="srOnlyInput"
                  onChange={handleDocumentFileSelection}
                />
              </div>
              {documentImportState.message ? (
                <p
                  className={`documentImportStatus documentImportStatus-${documentImportState.status}`}
                  aria-live="polite"
                >
                  {documentImportState.message}
                </p>
              ) : null}
              {ocrHandoff ? (
                <section className="ocrHandoffCard" aria-label="OCR handoff prompt">
                  <div className="ocrHandoffHeader">
                    <div>
                      <p className="detailLabel">OCR handoff</p>
                      <strong>{ocrHandoff.headline}</strong>
                    </div>
                    <span
                      className={`tonePill ${
                        ocrPromptCopyState === "copied"
                          ? "status-ready"
                          : ocrPromptCopyState === "error"
                            ? "status-confirm"
                            : "tone-retrieved"
                      }`}
                    >
                      {ocrPromptCopyState === "copied"
                        ? "prompt copied"
                        : ocrPromptCopyState === "error"
                          ? "copy failed"
                          : "external OCR"}
                    </span>
                  </div>
                  <p className="ocrHandoffLead">{ocrHandoff.detail}</p>
                  <div className="ocrHandoffGrid">
                    <article className="ocrHandoffPanel">
                      <p className="detailLabel">Preserve exactly</p>
                      <ul className="missionList">
                        {ocrHandoff.preserveFields.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                    <article className="ocrHandoffPanel">
                      <p className="detailLabel">Scenario focus</p>
                      <ul className="missionList">
                        {ocrHandoff.focusFields.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  </div>
                  <details className="ocrPromptPreview">
                    <summary>Preview extraction prompt</summary>
                    <pre className="shareBriefBlock ocrPromptBlock">{ocrHandoff.prompt}</pre>
                  </details>
                  <div className="documentImportActions">
                    <button className="secondaryButton" type="button" onClick={handleCopyOcrPrompt}>
                      Copy extraction prompt
                    </button>
                    <button className="secondaryButton" type="button" onClick={handleInsertOcrTemplate}>
                      Insert OCR intake template
                    </button>
                    <span>
                      Paste OCR text under the Verbatim OCR marker below and Beacon will keep it in the retrieved lane.
                    </span>
                  </div>
                </section>
              ) : null}
              <section className="documentDemoSourceCard" aria-label="Demo retrieved source">
                <div>
                  <p className="detailLabel">Demo source seed</p>
                  <strong>Need a source-aware run without a file?</strong>
                  <p>
                    Load a clearly marked sample bulletin into the retrieved lane, including source label
                    and active timing. It is for demos only, not an official fact.
                  </p>
                </div>
                <button className="secondaryButton" type="button" onClick={handleLoadDemoRetrievedSource}>
                  {hasRetrievedDocumentContext ? "Replace with demo bulletin" : "Load demo bulletin"}
                </button>
              </section>
            </section>
            <section className="retrievedChecklistCard" aria-label="Retrieved lane readiness checklist">
              <div className="retrievedChecklistHeader">
                <div>
                  <p className="detailLabel">Retrieved lane checklist</p>
                  <strong>
                    {retrievedIntakeChecklist.readyCount}/{retrievedIntakeChecklist.totalCount} readiness
                    checks ready
                  </strong>
                </div>
                <span className={`tonePill ${retrievedIntakeChecklist.toneClass}`}>
                  {retrievedIntakeChecklist.readyCount === retrievedIntakeChecklist.totalCount
                    ? "traceable"
                    : "needs review"}
                </span>
              </div>
              <p className="retrievedChecklistLead">{retrievedIntakeChecklist.summary}</p>
              <ul className="retrievedChecklistList">
                {retrievedIntakeChecklist.items.map((item) => {
                  const showFocusOcrAction =
                    item.id === "context" &&
                    (isOcrScaffoldPending || documentImportState.status === "hook");
                  const showFocusSourceLabelAction =
                    item.id === "source-label" && item.status === "confirm";
                  const showFocusTimingAction = item.id === "timing" && item.status !== "ready";

                  return (
                    <li key={item.id} className="retrievedChecklistItem">
                      <span className={`tonePill ${getRetrievedChecklistStatusToneClass(item.status)}`}>
                        {formatRetrievedChecklistStatusLabel(item.status)}
                      </span>
                      <div className="retrievedChecklistItemBody">
                        <strong>{item.label}</strong>
                        <p>{item.detail}</p>
                        {showFocusOcrAction ? (
                          <button
                            type="button"
                            className="secondaryButton retrievedChecklistAction"
                            onClick={focusVerbatimOcrInput}
                            aria-controls={pastedGuidanceTextareaId}
                          >
                            Paste OCR text now
                          </button>
                        ) : null}
                        {showFocusTimingAction ? (
                          <button
                            type="button"
                            className="secondaryButton retrievedChecklistAction"
                            onClick={focusDocumentEffectiveTimeInput}
                            aria-controls="retrieved-source-timing"
                          >
                            Add source timing now
                          </button>
                        ) : null}
                        {showFocusSourceLabelAction ? (
                          <button
                            type="button"
                            className="secondaryButton retrievedChecklistAction"
                            onClick={focusDocumentSourceLabelInput}
                            aria-controls={retrievedSourceLabelInputId}
                          >
                            Add source label now
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
            <Field
              label="Retrieved source label"
              hint={
                suggestedDocumentSourceLabel
                  ? `Detected in pasted text: ${suggestedDocumentSourceLabel}`
                  : "Name the issuing office, sender, or bulletin source so trust lanes and exports stay traceable."
              }
            >
              <div className="documentSourceLabelRow">
                <input
                  id={retrievedSourceLabelInputId}
                  ref={documentSourceLabelInputRef}
                  value={form.documentSourceName}
                  onChange={(event) => updateField("documentSourceName", event.target.value)}
                  placeholder="e.g., Barangay DRRMO bulletin"
                />
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => {
                    if (!suggestedDocumentSourceLabel) {
                      return;
                    }

                    updateField("documentSourceName", suggestedDocumentSourceLabel);
                  }}
                  disabled={
                    !suggestedDocumentSourceLabel ||
                    suggestedDocumentSourceLabel === form.documentSourceName.trim()
                  }
                >
                  Use detected source
                </button>
              </div>
              {sourceLabelVerificationStatus ? (
                <div
                  className="sourceLabelVerificationStatus"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <span className={`tonePill ${sourceLabelVerificationStatus.toneClass}`}>
                    {sourceLabelVerificationStatus.label}
                  </span>
                  <p>{sourceLabelVerificationStatus.detail}</p>
                </div>
              ) : null}
            </Field>
            <Field
              label="Retrieved source timing"
              hint={
                detectedDocumentEffectiveTime
                  ? `Detected in pasted text: ${detectedDocumentEffectiveTime}`
                  : "Capture the effective date, validity window, or issue time so source freshness stays visible."
              }
            >
              <div className="documentSourceLabelRow">
                <input
                  id="retrieved-source-timing"
                  ref={documentEffectiveTimeInputRef}
                  value={form.documentEffectiveTime}
                  onChange={(event) => updateField("documentEffectiveTime", event.target.value)}
                  placeholder="e.g., Effective 14 Apr 2026, 08:00-18:00"
                />
                <button
                  className="secondaryButton"
                  type="button"
                  onClick={() => {
                    if (!detectedDocumentEffectiveTime) {
                      return;
                    }

                    updateField("documentEffectiveTime", detectedDocumentEffectiveTime);
                  }}
                  disabled={
                    !detectedDocumentEffectiveTime ||
                    detectedDocumentEffectiveTime === form.documentEffectiveTime.trim()
                  }
                >
                  Use detected timing
                </button>
              </div>
            </Field>
            <Field
              label="Timing freshness override"
              hint={
                hasSourceTimingCue
                  ? "Use manual mode when source wording is ambiguous and you need to mark timing as active, stale, or unknown for this run."
                  : "Add a source timing cue first, then override freshness if needed."
              }
            >
              <div className="choiceGroup">
                <div role="group" aria-label="Timing freshness override">
                  {timingFreshnessOverrideOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`choiceButton ${
                        form.documentTimingOverride === option.value ? "isActive" : ""
                      }`}
                      type="button"
                      aria-pressed={form.documentTimingOverride === option.value}
                      onClick={() => {
                        updateField("documentTimingOverride", option.value);
                        if (option.value === "auto") {
                          updateField("documentTimingOverrideReason", "");
                        }
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {form.documentTimingOverride !== "auto" ? (
                <>
                  <p className="intakeDocumentCheck">
                    Manual timing freshness:{" "}
                    {formatSourceTimingFreshnessOverrideLabel(form.documentTimingOverride)}.
                  </p>
                  <div className="documentSourceLabelRow">
                    <input
                      id="timing-override-note"
                      ref={timingOverrideReasonInputRef}
                      value={form.documentTimingOverrideReason}
                      aria-invalid={isTimingOverrideReasonMissing}
                      onChange={(event) =>
                        updateField("documentTimingOverrideReason", event.target.value)
                      }
                      placeholder="e.g., Source says 'until further notice'; keeping as active."
                    />
                  </div>
                  <p className="intakeDocumentCheck">
                    Timing override note:{" "}
                    {form.documentTimingOverrideReason.trim() || "Add one short reason for exports."}
                  </p>
                  {isTimingOverrideReasonMissing ? (
                    <p className="intakeDocumentCheck intakeDocumentCheckWarning" role="status">
                      Add one short timing override note so exported artifacts explain this manual
                      freshness call.
                    </p>
                  ) : null}
                </>
              ) : null}
            </Field>
            <Field
              label="Pasted guidance"
              hint="Paste text from a bulletin, PDF, DOCX, or OCR pass. Beacon treats it as retrieved guidance, not as a verified fact."
            >
              <textarea
                id={pastedGuidanceTextareaId}
                ref={documentContextInputRef}
                value={form.documentContext}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const hasReadyRetrievedText = hasRetrievedGuidanceContext(nextValue);
                  updateField("documentContext", nextValue);

                  if (!nextValue.trim()) {
                    updateField("documentSourceName", "");
                    updateField("documentEffectiveTime", "");
                    updateField("documentTimingOverride", "auto");
                    updateField("documentTimingOverrideReason", "");
                    setDocumentImportState(initialDocumentImportState);
                    return;
                  }

                  if (!form.documentSourceName.trim()) {
                    updateField(
                      "documentSourceName",
                      extractSourceLabelCandidate(nextValue) ?? manualSourceLabelPlaceholder,
                    );
                  }
                  if (!form.documentEffectiveTime.trim()) {
                    updateField("documentEffectiveTime", extractEffectiveTimeCandidate(nextValue) ?? "");
                  }

                  if (
                    documentImportState.status === "hook" ||
                    documentImportState.status === "error"
                  ) {
                    if (hasReadyRetrievedText) {
                      setDocumentImportState({
                        status: "loaded",
                        fileName: documentImportState.fileName,
                        message: documentImportState.fileName
                          ? `${documentImportState.fileName} now has pasted text attached and is ready for the retrieved-guidance lane.`
                          : "Pasted text is attached and ready for the retrieved-guidance lane.",
                      });
                      return;
                    }

                    if (isOcrScaffoldAwaitingVerbatim(nextValue)) {
                      setDocumentImportState({
                        status: "hook",
                        fileName: documentImportState.fileName,
                        message: documentImportState.fileName
                          ? `${documentImportState.fileName} still needs extracted text under "Verbatim OCR" before the retrieved-guidance lane is active.`
                          : `Paste extracted text under "Verbatim OCR" before the retrieved-guidance lane is active.`,
                      });
                    }
                  }
                }}
                placeholder="Paste school memo, barangay bulletin, OCR text, or incident note here..."
                rows={4}
              />
              {ocrInlineStatus || intakeTimingFreshnessStatus || intakeSourceLabelStatus ? (
                <div
                  className="intakeOcrInlineStatus"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <div className="intakeInlineStatusPills">
                    {ocrInlineStatus ? (
                      <span className={`tonePill ${ocrInlineStatus.toneClass}`}>
                        {ocrInlineStatus.label}
                      </span>
                    ) : null}
                    {hasStagedOcrScaffold ? (
                      <span className="tonePill tone-retrieved">OCR scaffold staged</span>
                    ) : null}
                    {intakeTimingFreshnessStatus ? (
                      <span className={`tonePill ${intakeTimingFreshnessStatus.toneClass}`}>
                        {intakeTimingFreshnessStatus.label}
                      </span>
                    ) : null}
                    {intakeSourceLabelStatus ? (
                      <span className={`tonePill ${intakeSourceLabelStatus.toneClass}`}>
                        {intakeSourceLabelStatus.label}
                      </span>
                    ) : null}
                  </div>
                  <div className="intakeInlineStatusDetails">
                    {ocrInlineStatus ? <p>{ocrInlineStatus.detail}</p> : null}
                    {hasStagedOcrScaffold ? (
                      <p>Jump to the Verbatim OCR marker to paste extracted text immediately.</p>
                    ) : null}
                    {intakeTimingFreshnessStatus ? <p>{intakeTimingFreshnessStatus.detail}</p> : null}
                    {intakeSourceLabelStatus ? <p>{intakeSourceLabelStatus.detail}</p> : null}
                  </div>
                  {hasStagedOcrScaffold ||
                  intakeTimingFreshnessStatus?.label === "timing cue missing" ||
                  (sourceLabelVerificationStatus &&
                    sourceLabelVerificationStatus.toneClass !== "status-ready") ? (
                    <div className="intakeInlineStatusActions">
                      {hasStagedOcrScaffold ? (
                        <button
                          type="button"
                          className="secondaryButton intakeInlineStatusAction"
                          onClick={focusVerbatimOcrInput}
                          aria-controls={pastedGuidanceTextareaId}
                        >
                          Jump to Verbatim OCR
                        </button>
                      ) : null}
                      {intakeTimingFreshnessStatus?.label === "timing cue missing" ? (
                        <button
                          type="button"
                          className="secondaryButton intakeInlineStatusAction"
                          onClick={focusDocumentEffectiveTimeInput}
                          aria-controls="retrieved-source-timing"
                        >
                          Add source timing now
                        </button>
                      ) : null}
                      {sourceLabelVerificationStatus &&
                      sourceLabelVerificationStatus.toneClass !== "status-ready" ? (
                        <button
                          type="button"
                          className="secondaryButton intakeInlineStatusAction"
                          onClick={focusDocumentSourceLabelInput}
                          aria-controls={retrievedSourceLabelInputId}
                        >
                          {hasRetrievedSourceLabel ? "Refine source label" : "Add source label now"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {hasRetrievedDocumentContext ? (
                <p className="intakeDocumentCheck">
                  Retrieved source label:{" "}
                  {hasTraceableRetrievedSourceLabel && hasAuthorityTaggedRetrievedSourceLabel
                    ? form.documentSourceName.trim()
                    : hasTraceableRetrievedSourceLabel
                      ? `${form.documentSourceName.trim()} (add issuing authority keyword)`
                      : form.documentSourceName.trim()
                      ? `${form.documentSourceName.trim()} (replace with issuing source)`
                      : "Missing (add issuing source)"}
                </p>
              ) : null}
              {hasRetrievedDocumentContext && form.documentEffectiveTime.trim() ? (
                <p className="intakeDocumentCheck">
                  Retrieved source timing: {form.documentEffectiveTime.trim()}
                </p>
              ) : null}
              {hasRetrievedDocumentContext && form.documentTimingOverride !== "auto" ? (
                <p className="intakeDocumentCheck">
                  Manual timing freshness:{" "}
                  {formatSourceTimingFreshnessOverrideLabel(form.documentTimingOverride)}
                </p>
              ) : null}
              {hasRetrievedDocumentContext &&
              form.documentTimingOverride !== "auto" &&
              form.documentTimingOverrideReason.trim() ? (
                <p className="intakeDocumentCheck">
                  Timing override note: {form.documentTimingOverrideReason.trim()}
                </p>
              ) : null}
            </Field>
          </details>

          <details className="briefDrawer intakeReasoningDrawer">
            <summary>Show source reasoning and trust checks</summary>
            <section className="intakeSourceBoard" aria-label="How Beacon will build this mission">
              <div className="intakeSourceBoardHeader">
                <div>
                  <p className="detailLabel">Source-aware setup</p>
                  <strong>How Beacon will build this mission</strong>
                </div>
                <span className="tonePill tone-official">official-first</span>
              </div>
              <p className="intakeSourceLead">{intakeSourcePreview.headline}</p>
              <div className="intakeSourceStack">
                {intakeSourcePreview.lanes.map((lane) => (
                  <article key={lane.title} className="intakeSourceCard">
                    <div className="intakeSourceCardHeader">
                      <div>
                        <p className="detailLabel">{lane.label}</p>
                        <strong>{lane.title}</strong>
                      </div>
                      <div className="intakeSourceCardSignals">
                        <span className={`tonePill tone-${lane.sourceType}`}>{lane.tone}</span>
                        {lane.sourceType === "retrieved" ? (
                          <span className={`tonePill ${retrievedLaneReadiness.toneClass}`}>
                            {retrievedLaneReadiness.label}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p>{lane.detail}</p>
                    {lane.sourceType === "retrieved" ? (
                      <p className="intakeDocumentCheck">{retrievedLaneReadiness.detail}</p>
                    ) : null}
                    <ul className="missionList">
                      {lane.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
              {intakeDocumentPreview ? (
                <div className="intakeDocumentStrip" aria-label="Detected document cues">
                  <div className="intakeDocumentStripHeader">
                    <div>
                      <p className="detailLabel">Detected document cues</p>
                      <strong>{intakeDocumentPreview.headline}</strong>
                    </div>
                    <div className="intakeDocumentStripSignals">
                      <span className="tonePill tone-retrieved">
                        {String(intakeDocumentPreview.extractedPoints.length).padStart(2, "0")} cues
                      </span>
                      {isTimingOverrideReasonMissing ? (
                        <button
                          type="button"
                          className="tonePill tonePillButton status-confirm"
                          onClick={focusTimingOverrideReasonInput}
                          aria-controls="timing-override-note"
                        >
                          confirm note needed
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p>{intakeDocumentPreview.summary}</p>
                  <ul className="missionList">
                    {intakeDocumentPreview.extractedPoints.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {intakeDocumentSourceDescriptor ? (
                    <p className="intakeDocumentCheck">
                      {intakeDocumentSourceDescriptor.label}: {intakeDocumentSourceDescriptor.headline}
                    </p>
                  ) : null}
                  {form.documentSourceName.trim() ? (
                    <p className="intakeDocumentCheck">
                      Retrieved source label: {form.documentSourceName.trim()}
                    </p>
                  ) : null}
                  {form.documentEffectiveTime.trim() ? (
                    <p className="intakeDocumentCheck">
                      Retrieved source timing: {form.documentEffectiveTime.trim()}
                    </p>
                  ) : null}
                  {form.documentTimingOverride !== "auto" ? (
                    <p className="intakeDocumentCheck">
                      Manual timing freshness:{" "}
                      {formatSourceTimingFreshnessOverrideLabel(form.documentTimingOverride)}
                    </p>
                  ) : null}
                  {form.documentTimingOverride !== "auto" && form.documentTimingOverrideReason.trim() ? (
                    <p className="intakeDocumentCheck">
                      Timing override note: {form.documentTimingOverrideReason.trim()}
                    </p>
                  ) : null}
                  {intakeDocumentPreview.actionCue ? (
                    <p className="intakeDocumentCheck">Document order: {intakeDocumentPreview.actionCue}</p>
                  ) : null}
                  <p className="intakeDocumentCheck">
                    Check before acting: {intakeDocumentPreview.recommendedChecks[0]}
                  </p>
                </div>
              ) : (
                <p className="intakeSourceHint">
                  Add a memo, bulletin, text file, PDF excerpt, or OCR text and Beacon will preview the cues it can use as retrieved guidance.
                </p>
              )}
            </section>
          </details>

          {isTimingOverrideReasonMissing ? (
            <div className="submitGuardrail" role="status" aria-live="polite">
              <p>
                Mission build paused until you add a timing override note for this manual freshness
                call.
              </p>
              <button
                type="button"
                className="submitGuardrailAction"
                onClick={focusTimingOverrideReasonInput}
                aria-controls="timing-override-note"
              >
                Add note now
              </button>
            </div>
          ) : null}

          <details className="briefDrawer missionModeDrawer">
            <summary>Show mission mode details</summary>
            <div className={`missionBuildMode missionBuildMode-${missionBuildMode.state}`} role="status" aria-live="polite">
              <div className="missionBuildModeHeader">
                <div>
                  <p className="detailLabel">Mission build mode</p>
                  <strong>{missionBuildMode.headline}</strong>
                </div>
                <div className="missionBuildModeSignals">
                  <span className={`tonePill ${missionBuildMode.toneClass}`}>{missionBuildMode.badgeLabel}</span>
                  <span className={`tonePill ${retrievedLaneReadiness.toneClass}`}>
                    {retrievedLaneReadiness.label}
                  </span>
                </div>
              </div>
              <p>{missionBuildMode.detail}</p>
              {missionBuildMode.showHookAction ? (
                <div className="missionBuildModeActions">
                  <button className="secondaryButton" type="button" onClick={openDocumentIntakeDrawer}>
                    Open OCR handoff
                  </button>
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={focusVerbatimOcrInput}
                    aria-controls={pastedGuidanceTextareaId}
                  >
                    Paste OCR text now
                  </button>
                </div>
              ) : null}
            </div>
          </details>

          <div className="actionRow">
            <button
              className="primaryButton"
              type="submit"
              disabled={isPending || isTimingOverrideReasonMissing}
            >
              {isPending ? "Building mission..." : result ? "Rebuild mission" : "Start mission"}
            </button>
          </div>

          {error ? (
            <div className="errorText" role="alert">
              <p>{error}</p>
              {error === missingTimingOverrideReasonError && isTimingOverrideReasonMissing ? (
                <button
                  type="button"
                  className="errorInlineAction"
                  onClick={focusTimingOverrideReasonInput}
                  aria-controls="timing-override-note"
                >
                  Fix now
                </button>
              ) : null}
            </div>
          ) : null}
        </form>
      </section>

      <section ref={workspaceRef} className="workspacePane" aria-label="Guided mission">
        {result && activeStep ? (
          <div className="lessonShell">
            <header ref={workspaceHeaderRef} className="workspaceHeader workspaceAnchorTarget">
              <div className="workspaceHeaderMain">
                <p className="eyebrow">Guided mission</p>
                <h2>{result.actionCardTitle.replace("action card", "mission")}</h2>
                <p className="workspaceLead">{result.summary}</p>
                {scenarioSnapshotCards.length > 0 ? (
                  <section className="missionReadinessStrip" aria-label="Scenario snapshot">
                    <div className="missionReadinessHeader">
                      <div>
                        <p className="detailLabel">Scenario snapshot</p>
                        <strong>Keep the mission context visible while you demo the plan</strong>
                      </div>
                      <span className="tonePill tone-official">context stays attached</span>
                    </div>
                    <p className="missionReadinessLead">
                      The planner form lives in the left rail. This snapshot carries the active
                      scenario, care constraints, and source intake into the generated workspace and
                      exported runbook.
                    </p>
                    <div className="groundingDigest" aria-label="Scenario context digest">
                      {scenarioSnapshotCards.map((item) => (
                        <article key={item.id} className="groundingDigestCard">
                          <div className="groundingDigestHeader">
                            <p className="detailLabel">{item.label}</p>
                            <span className={`tonePill ${item.toneClass}`}>{item.toneLabel}</span>
                          </div>
                          <strong>{item.headline}</strong>
                          <p>{item.detail}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
                {commandBriefCards.length > 0 ? (
                  <section className="missionReadinessStrip" aria-label="Mission readiness">
                    <div className="missionReadinessHeader">
                      <div>
                        <p className="detailLabel">Mission command brief</p>
                        <strong>Read the trigger, first move, and open check before the walkthrough</strong>
                      </div>
                      <div className="missionReadinessActions">
                        <button className="secondaryButton" type="button" onClick={scrollToGroundingBoard}>
                          Show source checks
                        </button>
                        <button
                          className="secondaryButton"
                          type="button"
                          onClick={() => navigateToWorkspaceSection("share")}
                        >
                          Open share lesson
                        </button>
                      </div>
                    </div>
                    <p className="missionReadinessLead">
                      This is the fast judge-facing summary: one official trigger, one first destination,
                      one confirmation gap, and a visible source split before the detailed evidence view.
                    </p>
                    <div className="groundingDigest" aria-label="Mission readiness digest">
                      {commandBriefCards.map((item) => (
                        <article key={item.id} className="groundingDigestCard">
                          <div className="groundingDigestHeader">
                            <p className="detailLabel">{item.label}</p>
                            <span className={`tonePill ${item.toneClass}`}>{item.toneLabel}</span>
                          </div>
                          <strong>{item.headline}</strong>
                          <p>{item.detail}</p>
                        </article>
                      ))}
                    </div>
                    {commandBriefNotes.length > 0 ? (
                      <div className="missionReadinessNotes" aria-label="Mission summary notes">
                        {commandBriefNotes.map((note) => (
                          <p key={note} className="missionReadinessNote">
                            {note}
                          </p>
                        ))}
                      </div>
                    ) : null}
                    {authorityStrip.length > 0 ? (
                      <section className="missionAuthorityInline" aria-label="Mission authority order">
                        <div className="missionAuthorityInlineHeader">
                          <div>
                            <p className="detailLabel">Authority quick scan</p>
                            <strong>Trust sequence without leaving the mission brief</strong>
                          </div>
                          <span className="tonePill tone-official">
                            official → retrieved → generated → route
                          </span>
                        </div>
                        <ol className="missionAuthorityInlineList">
                          {authorityStrip.map((item, index) => (
                            <li key={item.id} className="missionAuthorityInlineItem">
                              <div className="missionAuthorityInlineItemHeader">
                                <p className="detailLabel">Authority {String(index + 1).padStart(2, "0")}</p>
                                <span className={`tonePill ${item.toneClass}`}>{item.toneLabel}</span>
                              </div>
                              <strong>{item.headline}</strong>
                              <p>{item.meta}</p>
                            </li>
                          ))}
                        </ol>
                      </section>
                    ) : null}
                  </section>
                ) : null}
                {judgeDemoPath.length > 0 ? (
                  <section className="judgeDemoPath" aria-label="Three-minute judge demo path">
                    <div className="judgeDemoPathHeader">
                      <div>
                        <p className="detailLabel">3-minute judge path</p>
                        <strong>{activePreset ? `${activePreset.label} run of show` : "Scenario run of show"}</strong>
                      </div>
                      <div className="judgeDemoPathActions">
                        {trainingOutcome ? (
                          <span className={`tonePill ${trainingOutcome.toneClass}`}>
                            mastery {trainingOutcome.mastery}%
                          </span>
                        ) : null}
                        <button
                          className="secondaryButton"
                          type="button"
                          onClick={() => void handleCopyJudgeDemoPath(judgeDemoBrief)}
                          disabled={!judgeDemoBrief}
                        >
                          {judgePathCopyState === "copied"
                            ? "Judge path copied"
                            : judgePathCopyState === "error"
                              ? "Copy failed"
                              : "Copy judge path"}
                        </button>
                        <button
                          className="secondaryButton"
                          type="button"
                          onClick={() => handleDownloadRunbook(judgeDemoBrief)}
                          disabled={!judgeDemoBrief}
                        >
                          Download judged runbook
                        </button>
                        <button className="secondaryButton" type="button" onClick={primeWinningJudgePath}>
                          Prime winning path
                        </button>
                      </div>
                    </div>
                    <p className="judgeDemoPathLead">
                      Use these timed jumps to keep the demo moving from scenario load, to gameplay,
                      to trust proof, to exportable handoff.
                    </p>
                    <ol className="judgeDemoTimeline">
                      {judgeDemoPath.map((cue) => (
                        <li key={cue.id} className="judgeDemoCue">
                          <div className="judgeDemoCueTime">
                            <span>{cue.timecode}</span>
                          </div>
                          <div className="judgeDemoCueBody">
                            <div className="judgeDemoCueHeader">
                              <strong>{cue.label}</strong>
                              <span className={`tonePill ${cue.toneClass}`}>{cue.proof}</span>
                            </div>
                            <p>{cue.detail}</p>
                          </div>
                          <button
                            className="secondaryButton judgeDemoCueAction"
                            type="button"
                            onClick={() => jumpToJudgeDemoCue(cue)}
                          >
                            {cue.actionLabel}
                          </button>
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}
                {documentImpactCards.length > 0 ? (
                  <section className="documentImpactStrip" aria-label="Document impact summary">
                    <div className="documentImpactStripHeader">
                      <div>
                        <p className="detailLabel">Document impact</p>
                        <strong>What the attached source changed in this mission</strong>
                      </div>
                      <button className="secondaryButton" type="button" onClick={scrollToGroundingBoard}>
                        Open full source lane
                      </button>
                    </div>
                    <p className="documentImpactLead">
                      Beacon pulled the most important document cue up into the mission header so judges can see
                      the source-aware change before opening the full ledger.
                    </p>
                    {documentImpactArtifactTarget ? (
                      <div className="documentArtifactJump">
                        <div>
                          <p className="detailLabel">Affected demo output</p>
                          <strong>{documentImpactArtifactTarget.headline}</strong>
                          <p>{documentImpactArtifactTarget.detail}</p>
                        </div>
                        <div className="documentArtifactJumpActions">
                          <span className={`tonePill ${documentImpactArtifactTarget.toneClass}`}>
                            {documentImpactArtifactTarget.toneLabel}
                          </span>
                          <button
                            className="secondaryButton"
                            type="button"
                            onClick={() =>
                              openShareArtifactPreview(
                                documentImpactArtifactTarget.target,
                                "document-impact",
                                documentImpactArtifactTarget.sourceType,
                              )
                            }
                          >
                            {documentImpactArtifactTarget.actionLabel}
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <div className="documentImpactGrid">
                      {documentImpactCards.map((item) => (
                        <article key={item.id} className="documentImpactCard">
                          <div className="documentImpactCardHeader">
                            <p className="detailLabel">{item.label}</p>
                            <span className={`tonePill ${item.toneClass}`}>{item.toneLabel}</span>
                          </div>
                          <strong>{item.headline}</strong>
                          <p>{item.detail}</p>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
                {workspaceNavigator.length > 0 ? (
                  <nav
                    className={`workspaceNavigator ${isMissionControlExpanded ? "isExpanded" : "isCompact"}`}
                    aria-label="Mission control"
                  >
                    {activeWorkspaceCard ? (
                      <div className="workspaceNavigatorSummary">
                        <div className="workspaceNavigatorSummaryCopy">
                          <div className="workspaceNavigatorSummaryHeader">
                            <div>
                              <p className="detailLabel">Mission control</p>
                              <strong>{activeWorkspaceCard.headline}</strong>
                            </div>
                            <div className="workspaceNavigatorSummaryControls">
                              <span className={`tonePill ${activeWorkspaceCard.toneClass}`}>
                                {activeWorkspaceCard.toneLabel}
                              </span>
                              <button
                                type="button"
                                className="workspaceNavigatorModeButton"
                                aria-pressed={isMissionControlExpanded}
                                onClick={() => setIsMissionControlExpanded((previousValue) => !previousValue)}
                              >
                                {isMissionControlExpanded ? "Compact judge mode" : "Expand details"}
                              </button>
                            </div>
                          </div>
                          {isMissionControlExpanded ? <p>{activeWorkspaceCard.detail}</p> : null}
                          <div className="workspaceNavigatorSummaryMeta" aria-label="Active mission facts">
                            {(isMissionControlExpanded
                              ? activeWorkspaceCard.meta
                              : activeWorkspaceCard.meta.slice(0, 1)
                            ).map((entry) => (
                              <span key={entry} className="workspaceNavigatorSummaryMetaItem">
                                {entry}
                              </span>
                            ))}
                          </div>
                          <div className="workspaceNavigatorShortcutRow">
                            <p className="workspaceNavigatorShortcutLegend">{workspaceShortcutLegend}</p>
                            <div className="workspaceNavigatorShortcutActions">
                              <button
                                type="button"
                                className="workspaceNavigatorModeButton workspaceNavigatorLinkButton"
                                onClick={() => void handleCopyWorkspaceSectionLink()}
                              >
                                {workspaceLinkCopyState === "copied"
                                  ? `${resolvedWorkspaceSectionLabel} link copied`
                                  : workspaceLinkCopyState === "error"
                                    ? "Copy section link failed"
                                    : `Copy ${resolvedWorkspaceSectionLabel.toLowerCase()} link`}
                              </button>
                              <span
                                className={`tonePill ${
                                  workspaceLinkCopyState === "copied"
                                    ? "status-ready"
                                    : workspaceLinkCopyState === "error"
                                      ? "status-confirm"
                                      : "tone-retrieved"
                                }`}
                                aria-live="polite"
                              >
                                {workspaceSectionHashById[resolvedActiveWorkspaceSection]}
                              </span>
                            </div>
                          </div>
                          <div className="workspaceNavigatorSectionLinkRow" role="group" aria-label="Copy section links">
                            {workspaceNavigator.map((item) => {
                              const quickLinkState =
                                workspaceQuickLinkCopiedSection === item.id ? workspaceQuickLinkCopyState : "idle";

                              return (
                                <button
                                  key={`workspace-link-${item.id}`}
                                  type="button"
                                  className={`workspaceSectionQuickLink ${
                                    quickLinkState === "copied"
                                      ? "isCopied"
                                      : quickLinkState === "error"
                                        ? "isError"
                                        : ""
                                  }`}
                                  onClick={() => void handleCopyWorkspaceQuickLink(item.id)}
                                >
                                  {quickLinkState === "copied"
                                    ? `${item.label} copied`
                                    : quickLinkState === "error"
                                      ? `${item.label} copy failed`
                                      : `${item.label} ${workspaceSectionHashById[item.id]}`}
                                </button>
                              );
                            })}
                          </div>
                          {groundingReadiness ? (
                            <div className="missionTrustLaneBar" aria-label="Trust lane quick jump">
                              <p className="detailLabel">Trust lane quick jump</p>
                              <div className="missionTrustLaneButtons" role="group" aria-label="Jump by trust lane">
                                {groundingReadiness.sourceCoverage.map((entry) => (
                                  <button
                                    key={entry.type}
                                    type="button"
                                    className={`missionTrustLaneButton tone-${entry.type}`}
                                    onClick={() => jumpToSourceLedgerLane(entry.type)}
                                  >
                                    {formatSourceTypeLabel(entry.type)} ({entry.count})
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                        {missionControlChips.length > 0 ? (
                          isMissionControlExpanded ? (
                            <div className="missionControlChipGrid" aria-label="Mission control status">
                              {missionControlChips.map((item) => (
                                <article key={item.id} className="missionControlChip">
                                  <div className="missionControlChipHeader">
                                    <p className="detailLabel">{item.label}</p>
                                    <span className={`tonePill ${item.toneClass}`}>{item.toneLabel}</span>
                                  </div>
                                  <strong>{item.value}</strong>
                                </article>
                              ))}
                            </div>
                          ) : (
                            <div className="missionControlChipStrip" aria-label="Mission control status">
                              {missionControlChips.map((item) => (
                                <span
                                  key={item.id}
                                  className={`missionControlChipToken ${item.toneClass}`}
                                  title={`${item.label}: ${item.value}`}
                                >
                                  {item.label}: {truncateForCard(item.value, 48)}
                                </span>
                              ))}
                            </div>
                          )
                        ) : null}
                      </div>
                    ) : null}
                    <div className={isMissionControlExpanded ? "workspaceNavigatorTabs" : "workspaceNavigatorTabs isCompact"}>
                      {workspaceNavigator.map((item) => {
                        const quickLinkState =
                          workspaceQuickLinkCopiedSection === item.id ? workspaceQuickLinkCopyState : "idle";
                        const quickLinkButtonText =
                          quickLinkState === "copied"
                            ? "Link copied"
                            : quickLinkState === "error"
                              ? "Retry copy"
                              : "Copy link";
                        const compactQuickLinkStatus =
                          quickLinkState === "copied"
                            ? "link copied"
                            : quickLinkState === "error"
                              ? "copy failed"
                              : null;

                        return isMissionControlExpanded ? (
                          <article
                            key={item.id}
                            className={`workspaceJumpCard isExpandedCard ${
                              resolvedActiveWorkspaceSection === item.id ? "isActive" : ""
                            }`}
                            aria-current={resolvedActiveWorkspaceSection === item.id ? "location" : undefined}
                          >
                            <div className="workspaceJumpHeader">
                              <p className="detailLabel">{item.label}</p>
                              <div className="workspaceJumpHeaderMeta">
                                <kbd className="workspaceJumpShortcut">{workspaceSectionShortcuts[item.id]}</kbd>
                                <span
                                  className="workspaceJumpHashBadge"
                                  title={`Section anchor: ${workspaceSectionHashById[item.id]}`}
                                >
                                  {workspaceSectionHashById[item.id]}
                                </span>
                                <button
                                  type="button"
                                  className={`workspaceJumpCopyLinkButton ${
                                    quickLinkState === "copied"
                                      ? "isCopied"
                                      : quickLinkState === "error"
                                        ? "isError"
                                        : ""
                                  }`}
                                  onClick={() => void handleCopyWorkspaceQuickLink(item.id)}
                                  aria-label={`Copy link to ${item.label} section (${workspaceSectionHashById[item.id]})`}
                                  title={`Copy link to ${item.label} (${workspaceSectionHashById[item.id]})`}
                                >
                                  {quickLinkButtonText}
                                </button>
                                <span className={`tonePill ${item.toneClass}`}>{item.toneLabel}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="workspaceJumpBodyButton"
                              aria-label={`${item.label}: ${item.headline}. ${item.meta[0] ?? item.detail}`}
                              aria-keyshortcuts={workspaceSectionShortcuts[item.id]}
                              onClick={() => navigateToWorkspaceSection(item.id)}
                            >
                              <strong>{item.headline}</strong>
                              <p>{item.meta[0] ?? item.detail}</p>
                            </button>
                          </article>
                        ) : (
                          <button
                            key={item.id}
                            type="button"
                            className={`workspaceJumpCard ${resolvedActiveWorkspaceSection === item.id ? "isActive" : ""} isCompact`}
                            aria-label={`${item.label} ${workspaceSectionHashById[item.id]}: ${item.headline}. ${
                              item.meta[0] ?? item.detail
                            }`}
                            aria-current={resolvedActiveWorkspaceSection === item.id ? "location" : undefined}
                            aria-keyshortcuts={workspaceSectionShortcuts[item.id]}
                            title={`${item.label} section anchor: ${workspaceSectionHashById[item.id]}`}
                            onClick={() => navigateToWorkspaceSection(item.id)}
                          >
                            <div className="workspaceJumpHeader">
                              <p className="detailLabel">{item.label}</p>
                              <div className="workspaceJumpHeaderMeta">
                                <kbd className="workspaceJumpShortcut">{workspaceSectionShortcuts[item.id]}</kbd>
                                <span
                                  className="workspaceJumpHashBadge"
                                  title={`Section anchor: ${workspaceSectionHashById[item.id]}`}
                                >
                                  {workspaceSectionHashById[item.id]}
                                </span>
                                <span className={`tonePill ${item.toneClass}`}>{item.toneLabel}</span>
                                {compactQuickLinkStatus ? (
                                  <span
                                    className={`workspaceJumpCompactCopyStatus ${
                                      quickLinkState === "copied" ? "isCopied" : "isError"
                                    }`}
                                    aria-live="polite"
                                  >
                                    {compactQuickLinkStatus}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <span className="workspaceJumpCompactLine">{truncateForCard(item.headline, 42)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </nav>
                ) : null}
                {demoOutputDock.length > 0 ? (
                  <section className="demoDock" aria-label="Demo outputs">
                    <div className="demoDockHeader">
                      <div>
                        <p className="detailLabel">Demo outputs</p>
                        <strong>Judge-facing artifacts stay one jump away</strong>
                      </div>
                      <div className="demoDockHeaderActions">
                        <button
                          className="secondaryButton"
                          type="button"
                          onClick={() => navigateToWorkspaceSection("share")}
                        >
                          Open share lesson
                        </button>
                        {riskSourceExportBrief ? (
                          <button
                            className="secondaryButton shareTrustJumpButton"
                            type="button"
                            onClick={jumpToSourceLedgerExportControls}
                            title={`Current runbook status: ${runbookRiskBlockShareStatus.label}`}
                          >
                            Review risk source controls
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="demoDockLead">
                      Keep the spoken handoff, action card, flow view, and markdown runbook visible from the top of the workspace instead of making the audience wait for the final step reveal.
                    </p>
                    <div className="demoDockExportStatus" role="status" aria-live="polite">
                      <p className="detailLabel">Runbook trust export</p>
                      {riskSourceExportBrief ? (
                        <button
                          type="button"
                          className={`tonePill tonePillButton ${runbookRiskBlockShareStatus.toneClass}`}
                          onClick={jumpToSourceLedgerExportControls}
                          title="Jump to source ledger export controls"
                        >
                          {runbookRiskBlockShareStatus.label}
                        </button>
                      ) : (
                        <span className={`tonePill ${runbookRiskBlockShareStatus.toneClass}`}>
                          {runbookRiskBlockShareStatus.label}
                        </span>
                      )}
                    </div>
                    <section className="shareArtifactFilter" aria-label="Demo output trust-lane focus">
                      <div className="shareArtifactFilterHeader">
                        <div>
                          <p className="detailLabel">Demo output focus</p>
                          <strong>Mirror lane focus before opening Share</strong>
                        </div>
                        <span
                          className={`tonePill ${shareArtifactLaneFilter === "all" ? "tone-retrieved" : `tone-${shareArtifactLaneFilter}`}`}
                        >
                          {visibleDemoOutputCountLabel}
                        </span>
                      </div>
                      <p className="shareArtifactFilterLead">
                        {demoDockShareLaneHelperDetail} This uses the same scope math as Share.
                      </p>
                      <div className="shareTrustReadiness" role="status" aria-live="polite">
                        <span className={`tonePill ${retrievedLaneReadiness.toneClass}`}>{retrievedLaneShareStatusLabel}</span>
                        <p className="shareTrustReadinessDetail">{retrievedLaneReadiness.detail}</p>
                        {voiceSourceProvenanceStatus ? (
                          <>
                            <span className={`tonePill ${voiceSourceProvenanceStatus.toneClass}`}>
                              Source provenance: {voiceSourceProvenanceStatus.toneLabel}
                            </span>
                            <p className="shareTrustReadinessDetail">{voiceSourceProvenanceStatus.uiLabel}</p>
                          </>
                        ) : null}
                        {isTimingOverrideReasonMissing ? (
                          <button className="secondaryButton" type="button" onClick={focusTimingOverrideReasonInput}>
                            Fix note now
                          </button>
                        ) : null}
                        {voiceSourceProvenanceStatus && demoDockSourceProvenanceNeedsSourceLabel ? (
                          <button
                            className="secondaryButton voiceProvenanceAction"
                            type="button"
                            onClick={focusDocumentSourceLabelInput}
                            aria-controls={retrievedSourceLabelInputId}
                          >
                            {voiceSourceProvenanceStatus.toneLabel === "missing"
                              ? "Add source label now"
                              : "Refine source label"}
                          </button>
                        ) : null}
                      </div>
                      <div className="sourceLedgerModeButtons" role="group" aria-label="Filter demo outputs by trust lane">
                        <button
                          type="button"
                          className={`choiceButton ${shareArtifactLaneFilter === "all" ? "isActive" : ""}`}
                          onClick={() => setShareArtifactLaneFilter("all")}
                          aria-pressed={shareArtifactLaneFilter === "all"}
                        >
                          All trust lanes ({formatCountLabel(demoOutputDockCountByLane.all, "artifact")})
                        </button>
                        {(["official", "retrieved", "generated"] as const).map((lane) => (
                          <button
                            key={lane}
                            type="button"
                            className={`choiceButton ${shareArtifactLaneFilter === lane ? "isActive" : ""}`}
                            onClick={() => setShareArtifactLaneFilter(lane)}
                            aria-pressed={shareArtifactLaneFilter === lane}
                          >
                            {formatSourceTypeLabel(lane)} ({formatCountLabel(demoOutputDockCountByLane[lane], "artifact")})
                          </button>
                        ))}
                      </div>
                      {shareArtifactLaneFilter !== "all" && hasRunbookDemoOutput && !showDemoDockFilteredEmptyState ? (
                        <p className="sourceLedgerModeNote">
                          Runbook stays visible so you always keep one full export in view.
                        </p>
                      ) : null}
                    </section>
                    {showDemoDockFilteredEmptyState ? (
                      <div className="demoDockLaneEmpty" role="status">
                        <div className="demoDockLaneEmptyToneRow">
                          <span
                            className={`tonePill demoDockLaneImpactPill tone-${shareArtifactLaneFilter}`}
                          >
                            {formatSourceTypeLabel(shareArtifactLaneFilter)} lane driving this focus
                          </span>
                        </div>
                        <p>
                          No top-level demo cards were tagged as plan-impact outputs for{" "}
                          {formatSourceTypeLabel(shareArtifactLaneFilter).toLowerCase()} in this run.
                          Runbook stays pinned so you always keep one export visible.
                        </p>
                        {shareArtifactLaneImpactHelperLine ? (
                          <p className="demoDockLaneImpactDetail">{shareArtifactLaneImpactHelperLine}</p>
                        ) : null}
                        {demoDockLaneScopedCountLine ? (
                          <p className="demoDockLaneEmptyCount">{demoDockLaneScopedCountLine}</p>
                        ) : null}
                        {showDemoDockAllArtifactsComparison ? (
                          <p className="demoDockLaneEmptyCompareHint">
                            Comparing against all artifacts while {formatSourceTypeLabel(shareArtifactLaneFilter)} stays selected.
                          </p>
                        ) : null}
                        {showDemoDockAllArtifactsComparison && laneEmptyEvidenceAvailabilityLine ? (
                          <p className="demoDockLaneImpactDetail">{laneEmptyEvidenceAvailabilityLine}</p>
                        ) : null}
                        {showDemoDockAllArtifactsComparison && laneEmptyEvidenceAnchorId ? (
                          <div className="artifactJumpCaptionRow">
                            <p className="artifactJumpCaption">
                              Need lane context while comparing? Jump to the first{" "}
                              {formatSourceTypeLabel(shareArtifactLaneFilter).toLowerCase()} source ledger item.
                            </p>
                            <button
                              className="secondaryButton"
                              type="button"
                              onClick={() => jumpToSourceLedgerItem(laneEmptyEvidenceAnchorId)}
                              title="Jump to first matching source ledger evidence"
                            >
                              Show lane evidence
                            </button>
                          </div>
                        ) : null}
                        {voiceSourceProvenanceStatus ? (
                          <div className="demoDockLaneEmptyTrust" aria-live="polite">
                            <span className={`tonePill ${voiceSourceProvenanceStatus.toneClass}`}>
                              Source provenance: {voiceSourceProvenanceStatus.toneLabel}
                            </span>
                            <p className="shareTrustReadinessDetail">{voiceSourceProvenanceStatus.uiLabel}</p>
                            {missionBuildMode.showHookAction ? (
                              <>
                                <span className="tonePill status-advisory">OCR hook pending</span>
                                <p className="shareTrustReadinessDetail">
                                  Paste extracted text under Verbatim OCR to activate retrieved cues in this run.
                                </p>
                                <button
                                  className="secondaryButton voiceProvenanceAction"
                                  type="button"
                                  onClick={focusVerbatimOcrInput}
                                  aria-controls={pastedGuidanceTextareaId}
                                >
                                  Jump to Verbatim OCR
                                </button>
                              </>
                            ) : null}
                            {demoDockSourceProvenanceNeedsSourceLabel ? (
                              <button
                                className="secondaryButton voiceProvenanceAction"
                                type="button"
                                onClick={focusDocumentSourceLabelInput}
                                aria-controls={retrievedSourceLabelInputId}
                              >
                                {voiceSourceProvenanceStatus.toneLabel === "missing"
                                  ? "Add source label now"
                                  : "Refine source label"}
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="demoDockLaneEmptyActions">
                          <button
                            className="secondaryButton"
                            type="button"
                            onClick={() => setIsDemoDockLaneEmptyComparingAll((previousValue) => !previousValue)}
                          >
                            {showDemoDockAllArtifactsComparison ? "Return to lane impacts" : "Compare against all artifacts"}
                          </button>
                          <button
                            className="secondaryButton"
                            type="button"
                            onClick={() => {
                              setIsDemoDockLaneEmptyComparingAll(false);
                              setShareArtifactLaneFilter("all");
                            }}
                          >
                            Show all demo outputs
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <div className="demoDockGrid">
                      {visibleDemoOutputDock.map((item) => {
                        const trustLane = getDemoOutputTrustLane(
                          item.actionId,
                          shareArtifactPlanImpactTargetsBySource,
                        );
                        const trustLaneToneClass = getTrustLaneToneClass(trustLane);
                        const laneEvidenceAnchorId =
                          shareArtifactLaneFilter === "all"
                            ? null
                            : getPlanImpactSourceLedgerAnchorIdForDemoOutput(
                                sourceLedger,
                                shareArtifactLaneFilter,
                                item.actionId,
                              );
                        const laneComparisonReason =
                          shareArtifactLaneFilter === "all" ||
                          !showDemoDockAllArtifactsComparison ||
                          laneEvidenceAnchorId ||
                          item.actionId === "runbook"
                            ? null
                            : item.actionId === "voice"
                              ? `Voice briefing stays visible for comparison while ${formatSourceTypeLabel(shareArtifactLaneFilter).toLowerCase()} lane remains selected; no direct plan-impact tag in this lane for this run.`
                              : item.actionId === "action-card"
                                ? `Portable action card stays visible for comparison while ${formatSourceTypeLabel(shareArtifactLaneFilter).toLowerCase()} lane remains selected; no direct plan-impact tag in this lane for this run.`
                                : `Flow view stays visible for comparison while ${formatSourceTypeLabel(shareArtifactLaneFilter).toLowerCase()} lane remains selected; no direct plan-impact tag in this lane for this run.`;
                        const laneImpactStatus =
                          shareArtifactLaneFilter === "all"
                            ? null
                            : item.actionId === "runbook"
                              ? {
                                  toneClass: "tone-mixed",
                                  label: "pinned baseline",
                                  detail: "Runbook stays visible as the baseline export while lane focus is active.",
                                }
                              : laneEvidenceAnchorId
                                ? {
                                    toneClass: `tone-${shareArtifactLaneFilter}`,
                                    label: "impacted by selected lane",
                                    detail:
                                      shareArtifactLaneImpactHelperLine ??
                                      `${formatSourceTypeLabel(
                                        shareArtifactLaneFilter,
                                      )} evidence tagged this card as plan-impact for the current filter.`,
                                  }
                                : laneComparisonReason
                                  ? {
                                      toneClass: "status-advisory",
                                      label: "comparison-only",
                                      detail: laneComparisonReason,
                                    }
                                  : null;

                        return (
                          <article key={item.id} className="demoDockCard">
                            <div className="demoDockCardHeader">
                              <p className="detailLabel">{item.label}</p>
                              <div className="demoDockCardToneRow">
                                <span className={`tonePill ${item.toneClass}`}>{item.toneLabel}</span>
                                <span className={`tonePill demoDockTrustLanePill ${trustLaneToneClass}`}>
                                  {formatDemoOutputTrustLaneLabel(trustLane)}
                                </span>
                                {laneImpactStatus ? (
                                  <span className={`tonePill demoDockLaneImpactPill ${laneImpactStatus.toneClass}`}>
                                    {laneImpactStatus.label}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <strong>{item.headline}</strong>
                            <p>{item.detail}</p>
                            {laneImpactStatus ? <p className="demoDockLaneImpactDetail">{laneImpactStatus.detail}</p> : null}
                            {laneEvidenceAnchorId ? (
                              <button
                                className="secondaryButton"
                                type="button"
                                onClick={() => jumpToSourceLedgerItem(laneEvidenceAnchorId)}
                                title="Jump to first matching source ledger evidence"
                              >
                                Show lane evidence
                              </button>
                            ) : null}
                            <div className="demoDockCardFooter">
                              <span className={`tonePill ${item.actionToneClass}`}>{item.actionStatus}</span>
                              <button
                                className="secondaryButton"
                                type="button"
                                onClick={() => handleDemoOutputAction(item.actionId)}
                              >
                                {item.actionLabel}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ) : null}
                {evidenceSpotlight ? (
                  <div className="spotlightCard">
                    <div className="spotlightHeader">
                      <p className="detailLabel">Why this moved up</p>
                      <span className={`tonePill tone-${evidenceSpotlight.sourceType}`}>
                        {evidenceSpotlight.label}
                      </span>
                    </div>
                    <strong>{evidenceSpotlight.title}</strong>
                    <p>{evidenceSpotlight.summary}</p>
                    {evidenceSpotlight.evidence ? (
                      <p className="spotlightEvidence">Cue: {evidenceSpotlight.evidence}</p>
                    ) : null}
                    <p className="missionChecklistEvidence">Source reference: {evidenceSpotlight.sourceReference}</p>
                    {evidenceSpotlight.sourceLedgerAnchorId ? (
                      <div className="spotlightJumpRow">
                        <button
                          type="button"
                          className="secondaryButton missionChecklistJumpButton"
                          onClick={() => jumpToSourceLedgerItem(evidenceSpotlight.sourceLedgerAnchorId ?? null)}
                        >
                          Jump to source ledger
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <section
                  ref={groundingBoardRef}
                  className="groundingBoard workspaceAnchorTarget"
                  aria-label="Why this plan is grounded"
                >
                  <div className="groundingBoardHeader">
                    <div>
                      <p className="detailLabel">Why this plan is grounded</p>
                      <strong>Deep source and evidence view</strong>
                    </div>
                    <span className={`tonePill tone-${result.planningPosture.primarySourceType}`}>
                      {formatSourceTypeLabel(result.planningPosture.primarySourceType)}
                    </span>
                  </div>
                  <p className="groundingBoardLead">
                    The summary stays in Mission readiness above. This section is for the traceable evidence,
                    document cues, and source-by-source reasoning behind the run.
                  </p>
                  {documentCueSummary && documentBrief ? (
                    <section className="documentCueBoard" aria-label="Document ingestion summary">
                      <div className="documentCueBoardHeader">
                        <div>
                          <p className="detailLabel">Document ingestion lane</p>
                          <strong>{documentCueSummary.headline}</strong>
                        </div>
                        <span className="tonePill tone-retrieved">retrieved guidance</span>
                      </div>
                      <p className="documentCueLead">{documentCueSummary.summary}</p>
                      {documentCueSummary.sourceDescriptor ? (
                        <p className="sourceLedgerMeta">
                          {documentCueSummary.sourceDescriptor.label}:{" "}
                          {documentCueSummary.sourceDescriptor.headline}
                        </p>
                      ) : null}
                      <div className="documentCueStats" aria-label="Document cue counts">
                        <div className="documentCueStat">
                          <span>{String(documentCueSummary.extractedCount).padStart(2, "0")}</span>
                          <strong>Extracted cues</strong>
                        </div>
                        <div className="documentCueStat">
                          <span>{String(documentCueSummary.adjustmentCount).padStart(2, "0")}</span>
                          <strong>Plan adjustments</strong>
                        </div>
                        <div className="documentCueStat">
                          <span>{String(documentCueSummary.checkCount).padStart(2, "0")}</span>
                          <strong>Checks before acting</strong>
                        </div>
                      </div>
                      <div className="documentCueGrid">
                        <article className="documentCueCard">
                          <p className="detailLabel">Extracted cues</p>
                          <ul className="missionList">
                            {documentBrief.extractedPoints.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </article>
                        <article className="documentCueCard">
                          <p className="detailLabel">How Beacon used it</p>
                          <ul className="missionList">
                            {documentBrief.planningAdjustments.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </article>
                        <article className="documentCueCard">
                          <p className="detailLabel">Check before acting</p>
                          <ul className="missionList">
                            {documentBrief.recommendedChecks.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </article>
                      </div>
                    </section>
                  ) : null}
                  <div className="groundingGrid">
                    {result.planningBasis.map((entry) => (
                      <article key={entry.section} className="basisCard">
                        <div className="basisCardHeader">
                          <p className="detailLabel">{entry.section}</p>
                          <span className={`tonePill ${getConfidenceToneClass(entry.confidenceLabel)}`}>
                            {formatConfidenceLabel(entry.confidenceLabel)}
                          </span>
                        </div>
                        <p className="basisSourceLine">
                          {entry.sourceTypes.map((sourceType) => formatSourceTypeLabel(sourceType)).join(" + ")}
                        </p>
                        <p>{entry.basis}</p>
                      </article>
                    ))}
                  </div>
                  <section className="sourceLedgerBoard" aria-label="Source ledger">
                    <div className="sourceLedgerBoardHeader">
                      <div>
                        <p className="detailLabel">Source ledger</p>
                        <strong>Actual inputs used in this mission</strong>
                      </div>
                      <span className="tonePill tone-retrieved">traceable</span>
                    </div>
                    <p className="sourceLedgerLead">
                      Each lane stays separate so judges can see what came from facts, retrieved guidance,
                      and Beacon&apos;s own adaptation layer.
                    </p>
                    <div className="sourceLedgerFreshnessSummary" aria-label="Timing freshness summary">
                      <p className="sourceLedgerModeNote">
                        {sourceLedgerTimingSummary.timedCount > 0
                          ? `${sourceLedgerTimingSummary.riskCount} timing risk signal${
                              sourceLedgerTimingSummary.riskCount === 1 ? "" : "s"
                            } in this view.`
                          : "No parsed timing window in this view yet."}
                      </p>
                      <div className="sourceLedgerFreshnessChips">
                        <span className="tonePill status-ready">Active {sourceLedgerTimingSummary.active}</span>
                        <button
                          type="button"
                          className={`tonePill tonePillButton sourceLedgerFreshnessChip status-confirm ${
                            sourceLedgerFreshnessFilter === "risk" ? "isActive" : ""
                          }`}
                          aria-pressed={sourceLedgerFreshnessFilter === "risk"}
                          onClick={() => handleSetSourceLedgerFreshnessFilter("risk")}
                          disabled={sourceLedgerTimingSummary.riskCount === 0}
                        >
                          Stale {sourceLedgerTimingSummary.stale}
                        </button>
                        <button
                          type="button"
                          className={`tonePill tonePillButton sourceLedgerFreshnessChip status-advisory ${
                            sourceLedgerFreshnessFilter === "risk" ? "isActive" : ""
                          }`}
                          aria-pressed={sourceLedgerFreshnessFilter === "risk"}
                          onClick={() => handleSetSourceLedgerFreshnessFilter("risk")}
                          disabled={sourceLedgerTimingSummary.riskCount === 0}
                        >
                          Unknown {sourceLedgerTimingSummary.unknown}
                        </button>
                        {sourceLedgerTimingSummary.untimedCount > 0 ? (
                          <span className="tonePill">No timing cue {sourceLedgerTimingSummary.untimedCount}</span>
                        ) : null}
                        {sourceLedgerFreshnessFilter === "risk" ? (
                          <button
                            type="button"
                            className="tonePill tonePillButton sourceLedgerFreshnessChip"
                            onClick={() => handleSetSourceLedgerFreshnessFilter("all")}
                          >
                            Show all lanes
                          </button>
                        ) : null}
                      </div>
                      <p className="sourceLedgerModeNote">
                        {sourceLedgerFreshnessFilter === "risk"
                          ? `Risk filter on: showing ${formatCountLabel(sourceLedgerVisibleCount, "source item")} with stale or unknown timing.`
                          : "Tip: click Stale or Unknown to triage only risk-timing evidence."}
                      </p>
                      {sourceLedgerTimingSummary.riskCount > 0 ? (
                        <div className="sourceLedgerExportActionRow" ref={sourceLedgerExportControlsRef}>
                          <button
                            type="button"
                            className="secondaryButton sourceLedgerJumpButton"
                            onClick={handleCopyRiskSourceExport}
                            disabled={!riskSourceExportBrief}
                          >
                            Copy risk source export
                          </button>
                          <label className="sourceLedgerRunbookToggle">
                            <input
                              type="checkbox"
                              checked={includeRiskSourceExportInRunbook}
                              onChange={(event) => setIncludeRiskSourceExportInRunbook(event.target.checked)}
                            />
                            Include risk block in runbook
                          </label>
                          <span
                            className={`tonePill ${
                              includeRiskSourceExportInRunbook ? "status-ready" : "status-advisory"
                            }`}
                          >
                            {includeRiskSourceExportInRunbook
                              ? "runbook risk block on"
                              : "runbook risk block off"}
                          </span>
                          <span
                            className={`tonePill ${
                              riskSourceExportCopyState === "error" ? "status-confirm" : "status-ready"
                            }`}
                          >
                            {riskSourceExportCopyState === "copied"
                              ? "risk export copied"
                              : riskSourceExportCopyState === "error"
                                ? "copy failed"
                                : "ready"}
                          </span>
                          <p className="sourceLedgerModeNote">
                            Exports stale and unknown source lines for the current ledger view and can append them to
                            the downloaded runbook.
                          </p>
                        </div>
                      ) : null}
                    </div>
                    <div className="sourceLedgerControls" aria-label="Source ledger view mode">
                      <div className="sourceLedgerModeButtons" role="group" aria-label="Source ledger mode">
                        <button
                          type="button"
                          className={`choiceButton ${sourceLedgerView === "all" ? "isActive" : ""}`}
                          aria-pressed={sourceLedgerView === "all"}
                          onClick={() => handleSetSourceLedgerView("all")}
                        >
                          All sources
                        </button>
                        <button
                          type="button"
                          className={`choiceButton ${sourceLedgerView === "plan-impact" ? "isActive" : ""}`}
                          aria-pressed={sourceLedgerView === "plan-impact"}
                          onClick={() => handleSetSourceLedgerView("plan-impact")}
                        >
                          Plan-impact only
                        </button>
                      </div>
                      <p className="sourceLedgerModeNote">
                        {sourceLedgerView === "plan-impact"
                          ? `${sourceLedgerPlanImpactCount} source item${
                              sourceLedgerPlanImpactCount === 1 ? "" : "s"
                            } directly shaped this run.`
                          : "Showing every source item attached to this mission run."}
                      </p>
                    </div>
                    <div className="sourceLedgerGrid">
                      {visibleSourceLedger.map((lane) => (
                        <article key={lane.sourceType} className="sourceLedgerLane">
                          <div className="sourceLedgerLaneHeader">
                            <div>
                              <p className="detailLabel">{lane.title}</p>
                              <strong>{lane.lead}</strong>
                            </div>
                            <span className={`tonePill tone-${lane.sourceType}`}>
                              {lane.items.length} item{lane.items.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="sourceLedgerItemStack">
                            {lane.items.length === 0 ? (
                              <article className="sourceLedgerItem sourceLedgerEmptyItem">
                                <p className="sourceLedgerMeta">{sourceLedgerEmptyLaneMessage}</p>
                              </article>
                            ) : (
                              lane.items.map((item, itemIndex) => {
                                const impactTargets = getPlanImpactArtifactTargets(item);
                                const timingFreshness = getSourceTimingFreshness(item.effectiveWindow, {
                                  override: item.timingFreshnessOverride,
                                });
                                const sourceLedgerItemId = buildSourceLedgerItemId(lane.sourceType, item.title, itemIndex);
                                const isHighlightedSourceLedgerItem =
                                  highlightedSourceLedgerItemId === sourceLedgerItemId;

                                return (
                                  <article
                                    key={`${lane.sourceType}-${item.title}-${itemIndex}`}
                                    id={sourceLedgerItemId}
                                    className={`sourceLedgerItem ${isHighlightedSourceLedgerItem ? "isLinkedHighlight" : ""}`}
                                  >
                                    <div className="sourceLedgerItemHeader">
                                      <strong>{item.title}</strong>
                                      {item.url ? (
                                        <a href={item.url} target="_blank" rel="noreferrer">
                                          Open source
                                        </a>
                                      ) : null}
                                    </div>
                                    <div className="sourceLedgerItemSignals" aria-label="Source impact tags">
                                      {timingFreshness ? (
                                        <span className={`tonePill ${timingFreshness.toneClass}`}>
                                          {timingFreshness.label}
                                        </span>
                                      ) : null}
                                      {item.usedFor ? (
                                        <span className="tonePill tone-retrieved">used in plan</span>
                                      ) : null}
                                      {item.evidence ? (
                                        <span className="tonePill tone-official">evidence cue</span>
                                      ) : null}
                                      {!item.effectiveWindow && !item.usedFor && !item.evidence ? (
                                        <span className="tonePill tone-generated">context</span>
                                      ) : null}
                                    </div>
                                    <p>{item.summary}</p>
                                    {item.effectiveWindow ? (
                                      <p className="sourceLedgerMeta">
                                        Source timing: {item.effectiveWindow}
                                      </p>
                                    ) : null}
                                    {timingFreshness ? (
                                      <p className="sourceLedgerMeta">Timing freshness: {timingFreshness.detail}</p>
                                    ) : null}
                                    {item.timingFreshnessOverrideReason ? (
                                      <p className="sourceLedgerMeta">
                                        Timing override note: {item.timingFreshnessOverrideReason}
                                      </p>
                                    ) : null}
                                    {item.usedFor ? (
                                      <p className="sourceLedgerMeta">
                                        Used in plan: {item.usedFor}
                                      </p>
                                    ) : null}
                                    {item.evidence ? (
                                      <p className="sourceLedgerMeta">
                                        Evidence cue: {item.evidence}
                                      </p>
                                    ) : null}
                                    {impactTargets.length > 0 ? (
                                      <div className="sourceLedgerJumpGroup">
                                        <p className="sourceLedgerMeta">Jump to impacted output:</p>
                                        <div className="sourceLedgerJumpButtons">
                                          {impactTargets.map((target) => (
                                            <button
                                              key={`${item.title}-${target}`}
                                              className="secondaryButton sourceLedgerJumpButton"
                                              type="button"
                                              onClick={() =>
                                                openShareArtifactPreview(target, "source-ledger", lane.sourceType)
                                              }
                                            >
                                              {formatShareArtifactTargetLabel(target)}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null}
                                  </article>
                                );
                              })
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                </section>
              </div>
              <div className="engineBadge">{result.engineLabel}</div>
            </header>

            <section className="simulationCourseShell" aria-label="Interactive emergency training course">
              <aside className="simulationCourseSidebar" aria-label="Training chapters">
                <div className="simulationCourseSidebarHeader">
                  <p className="detailLabel">Course contents</p>
                  <strong>
                    {activePreset ? `${activePreset.label} simulator` : `${selectedCourse.label} simulator`}
                  </strong>
                  <span>{missionSteps.length} interactive turns</span>
                </div>
                <nav className="missionRail" aria-label="Mission steps">
                  {missionSteps.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      className={`missionRailButton ${activeMissionStepIndex === index ? "isActive" : ""}`}
                      aria-current={activeMissionStepIndex === index ? "step" : undefined}
                      onClick={() => setActiveMissionStep(index)}
                    >
                      <div className="missionRailHeader">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <span className={`tonePill ${missionStepStatus[index]?.toneClass ?? "tone-generated"}`}>
                          {missionStepStatus[index]?.label ?? "Up next"}
                        </span>
                      </div>
                      <strong>{step.label}</strong>
                      <p className="missionRailTrustLabel">
                        <span className={`tonePill ${getTrustLaneToneClass(step.trustLane)}`}>
                          {step.trustLabel}
                        </span>
                      </p>
                    </button>
                  ))}
                </nav>
              </aside>

              <section
                ref={lessonCardRef}
                className="lessonCard workspaceAnchorTarget"
                aria-live="polite"
              >
              <div className="lessonProgress" aria-label={`Mission progress ${progressPercent}%`}>
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="lessonHeader">
                <p className="eyebrow">Step {activeMissionStepIndex + 1} of {missionSteps.length}</p>
                <h3>{activeStep.title}</h3>
                <div className="lessonTrustSignal">
                  <span className={`tonePill ${getTrustLaneToneClass(activeStep.trustLane)}`}>
                    {activeStep.trustLabel}
                  </span>
                  <p>{activeStep.trustDetail}</p>
                </div>
                <p>{activeStep.coach}</p>
              </div>
              {trainingOutcome ? (
                <section className="trainingOutcomePanel" aria-label="Cumulative trainee outcome">
                  <div className="trainingOutcomeHeader">
                    <div>
                      <p className="detailLabel">Trainee outcome</p>
                      <strong>{trainingOutcome.label}</strong>
                    </div>
                    <span className={`tonePill ${trainingOutcome.toneClass}`}>
                      mastery {trainingOutcome.mastery}%
                    </span>
                  </div>
                  <p>{trainingOutcome.detail}</p>
                  <div className="trainingOutcomeMetrics">
                    {[
                      { label: "Safety", value: trainingOutcome.safety },
                      { label: "Speed", value: trainingOutcome.speed },
                      { label: "Accountability", value: trainingOutcome.trust },
                      { label: "Pressure", value: trainingOutcome.pressure },
                    ].map((metric) => (
                      <div key={metric.label} className="trainingOutcomeMetric">
                        <div>
                          <span>{metric.label}</span>
                          <strong>{metric.value}%</strong>
                        </div>
                        <meter min={0} max={100} value={metric.value}>
                          {metric.value}%
                        </meter>
                      </div>
                    ))}
                  </div>
                  <div className="trainingOutcomeProof">
                    <span className="tonePill status-ready">
                      {trainingOutcome.bestDecisionCount}/{trainingOutcome.totalDecisionCount} best choices
                    </span>
                    <span
                      className={`tonePill ${
                        trainingOutcome.quizCorrectCount === trainingOutcome.quizTotal
                          ? "status-ready"
                          : "tone-generated"
                      }`}
                    >
                      {trainingOutcome.quizCorrectCount}/{trainingOutcome.quizTotal} quizzes correct
                    </span>
                    <span
                      className={`tonePill ${
                        trainingOutcome.riskyTurnCount === 0 ? "status-ready" : "status-confirm"
                      }`}
                    >
                      {trainingOutcome.riskyTurnCount} risky turns
                    </span>
                  </div>
                </section>
              ) : null}
              {activeIncidentScene && selectedStoryDecision ? (
                <section className="incidentWalkthrough" aria-label="Visual incident walkthrough">
                  <div className="incidentMapPanel">
                    {activeFirstPersonScene ? (
                      <section
                        className={`firstPersonDrill firstPersonDrill-${form.hazard} firstPersonDrill-${activeFirstPersonScene.viewId} firstPersonVideo-${activeVideoBeatId} firstPersonStage-${activeStep.id}`}
                        aria-label="First-person trainee drill"
                      >
                        <div className="firstPersonHud">
                          <div className="firstPersonHudCopy">
                            <p className="detailLabel">First-person drill</p>
                            <strong>{activeFirstPersonScene.locationLabel}</strong>
                            <p>{activePreset ? activePreset.routeSkill : selectedCourse.challenge}</p>
                          </div>
                          <div className="fpSourceProofStrip" aria-label="One-glance source proof">
                            {activeIncidentScene.overlays.map((overlay) => {
                              const sourceLane = getSourceProofLane(overlay.id);

                              return (
                                <button
                                  key={overlay.id}
                                  type="button"
                                  className={`fpSourceProofChip ${overlay.toneClass}`}
                                  onClick={() => {
                                    if (sourceLane) {
                                      jumpToSourceLedgerLane(sourceLane);
                                    }
                                  }}
                                  disabled={!sourceLane}
                                  title={overlay.detail}
                                  aria-label={
                                    sourceLane
                                      ? `${getSourceProofAction(sourceLane)}: ${overlay.label}. ${overlay.detail}`
                                      : `${overlay.label}: ${overlay.detail}`
                                  }
                            >
                                  <span>{sourceLane ? getSourceProofRole(sourceLane) : overlay.label}</span>
                                  <strong>{overlay.label}</strong>
                                  <em>{sourceLane ? getSourceProofAction(sourceLane) : "View cue"}</em>
                                </button>
                              );
                            })}
                          </div>
                          <span className="tonePill tone-generated">{activeFirstPersonScene.stance}</span>
                          <div className="missionRunControls" aria-label="Mission run controls">
                            <button
                              type="button"
                              className="missionRunControl"
                              onClick={handleReturnToScenarioCinema}
                            >
                              Change scenario
                            </button>
                            <button
                              type="button"
                              className="missionRunControl isPrimary"
                              onClick={handleRestartScenarioRun}
                              disabled={isPending}
                            >
                              {isPending ? "Restarting..." : "Restart run"}
                            </button>
                          </div>
                        </div>
                        <nav className="fpStageSwitch" aria-label="Run stage controls">
                          {missionSteps.map((step, index) => (
                            <button
                              key={step.id}
                              type="button"
                              className={`fpStageSwitchButton ${
                                activeMissionStepIndex === index ? "isActive" : ""
                              }`}
                              aria-current={activeMissionStepIndex === index ? "step" : undefined}
                              onClick={() => jumpToMissionStep(index)}
                            >
                              <span>{String(index + 1).padStart(2, "0")}</span>
                              <strong>{step.label}</strong>
                            </button>
                          ))}
                        </nav>
                        <div
                          key={`${activeStep.id}-${activeFirstPersonScene.viewId}-${activeVideoBeatId}`}
                          className={`firstPersonViewport ${activeFirstPersonScene.stageVisualClass}`}
                          style={{
                            ...(activeFirstPersonScene.stageFrameUrl
                              ? {
                                  backgroundImage: `url(${activeStoryFrameImageUrl ?? activeFirstPersonScene.stageFrameUrl})`,
                                }
                              : {}),
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                          }}
                        >
                          <div className="fpSky" aria-hidden="true" />
                          <div className="fpSmoke" aria-hidden="true" />
                          <div className="fpSceneFrame" aria-hidden="true" />
                          <div className="fpGround" aria-hidden="true" />
                          <div className="fpReticle" aria-hidden="true" />
                          <div className="fpRouteAffordanceLayer" aria-label="Scenario route affordances">
                            {activeFirstPersonScene.routeAffordances.map((affordance) => (
                              <div
                                key={affordance.id}
                                className={`fpRouteAffordance ${affordance.visualClass} ${affordance.positionClass}`}
                                aria-label={`${affordance.label}: ${affordance.detail}`}
                              >
                                <span aria-hidden="true" />
                                <strong>{affordance.label}</strong>
                                <em>{affordance.detail}</em>
                              </div>
                            ))}
                          </div>
                          {activeMissionStartCue ? (
                            <div className="fpMissionStartPulse" aria-label="Opening drill clock">
                              <div className="fpMissionStartClock">
                                <span>Drill clock</span>
                                <strong>{activeMissionStartCue.clock}</strong>
                                <em>{activeMissionStartCue.label}</em>
                              </div>
                              <ol className="fpMissionStartBeats">
                                {activeMissionStartCue.beats.map((beat, index) => (
                                  <li key={beat.label}>
                                    <span>{String(index + 1).padStart(2, "0")}</span>
                                    <div>
                                      <strong>{beat.label}</strong>
                                      <p>{beat.value}</p>
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          ) : null}
                          <div className="fpObjective">
                            <span>Objective</span>
                            <strong>{activeFirstPersonScene.objective}</strong>
                          </div>
                          {activeVideoBeat ? (
                            <div className="fpVideoCaption" aria-live="polite">
                              <span>{activeVideoBeat.timestamp} interactive briefing</span>
                              <strong>{activeVideoBeat.caption}</strong>
                              <p>{activeVideoBeat.prompt}</p>
                            </div>
                          ) : null}
                          <div className="fpCue">
                            <span>{activeFirstPersonScene.cueLabel}</span>
                            <p>{activeFirstPersonScene.narration}</p>
                          </div>
                          <div className="fpTrustStack" aria-label="Source-aware trust layers in this drill beat">
                            {activeIncidentScene.overlays.map((overlay) => (
                              <article key={overlay.id} className={`fpTrustLayer ${overlay.toneClass}`}>
                                <span>{overlay.label}</span>
                                <strong>{overlay.detail}</strong>
                              </article>
                            ))}
                          </div>
                          {activeFirstPersonScene.hotspots.map((hotspot) => (
                            <button
                              key={hotspot.id}
                              type="button"
                              className={`fpHotspot ${hotspot.positionClass} ${hotspot.toneClass}`}
                              title={hotspot.detail}
                            >
                              <span>{hotspot.label}</span>
                              <strong>{hotspot.detail}</strong>
                            </button>
                          ))}
                          <div className="fpMiniMap" aria-label="POV minimap">
                            <span className="fpMiniMapNode fpMiniMapNode-command" />
                            <span className="fpMiniMapNode fpMiniMapNode-hazard" />
                            <span className="fpMiniMapNode fpMiniMapNode-route" />
                            <span className="fpMiniMapSight" style={{ width: `${activeFirstPersonScene.progress}%` }} />
                          </div>
                          <div className="fpRouteCompass" aria-label="Spatial route compass">
                            <span className="fpRouteCompassTrack" aria-hidden="true" />
                            <article className="fpRouteCompassCard isHazard">
                              <span>Hazard cue</span>
                              <strong>{activeFirstPersonScene.routeCue.trigger}</strong>
                            </article>
                            <article className="fpRouteCompassCard isRoute">
                              <span>Take this route</span>
                              <strong>{activeFirstPersonScene.routeCue.route}</strong>
                            </article>
                            <article className="fpRouteCompassCard isBlocked">
                              <span>Do not take</span>
                              <strong>{activeFirstPersonScene.routeCue.avoid}</strong>
                            </article>
                          </div>
                          <section className="fpRouteRuleStack" aria-label="Fast route rule choice">
                            <div className="fpRouteRuleHeader">
                              <span>Route rule</span>
                              <strong>{activeFirstPersonScene.routeTrainer.subtitle}</strong>
                            </div>
                            <div className="fpRouteCheckpointMini" aria-label="Route checkpoints for this move">
                              {activeFirstPersonScene.routeTrainer.checkpoints.slice(0, 3).map((checkpoint, index) => (
                                <article key={checkpoint.id} className={checkpoint.toneClass}>
                                  <span>{String(index + 1).padStart(2, "0")}</span>
                                  <strong>{checkpoint.label}</strong>
                                </article>
                              ))}
                            </div>
                            <div className="fpRouteRuleChoices">
                              {activeFirstPersonScene.routeTrainer.ruleChoices.map((choice) => {
                                const isSelected = activeRouteRuleChoiceId === choice.id;

                                return (
                                  <button
                                    key={choice.id}
                                    type="button"
                                    className={`fpRouteRuleChoice ${isSelected ? "isSelected" : ""} ${
                                      isSelected && choice.correct ? "isCorrect" : isSelected ? "isWrong" : ""
                                    }`}
                                    aria-pressed={isSelected}
                                    onClick={() => {
                                      setRouteCardCopyState("idle");
                                      setRouteRuleChoiceByStep((previousValue) => ({
                                        ...previousValue,
                                        [activeStep.id]: choice.id,
                                      }));
                                    }}
                                  >
                                    <span>{choice.correct ? "Best route" : "Risk check"}</span>
                                    <strong>{choice.label}</strong>
                                    <em>{choice.detail}</em>
                                  </button>
                                );
                              })}
                            </div>
                            {activeRouteRuleChoice ? (
                              <p className="fpRouteRuleFeedback">{activeRouteRuleChoice.feedback}</p>
                            ) : null}
                          </section>
                          <div
                            key={selectedStoryDecision.id}
                            className={`fpConsequenceBoard ${
                              selectedStoryDecision.impact.safety >= 75 &&
                              selectedStoryDecision.impact.speed >= 70 &&
                              selectedStoryDecision.impact.trust >= 70
                                ? "isStrong"
                                : "isRisky"
                            }`}
                            aria-label="Visible consequence from selected decision"
                          >
                            <div className="fpConsequenceHeader">
                              <span>Choice result</span>
                              {selectedStoryDecisionCue ? (
                                <em className={selectedStoryDecisionCue.toneClass}>
                                  {selectedStoryDecisionCue.label}
                                </em>
                              ) : null}
                            </div>
                            <strong>{selectedStoryDecision.label}</strong>
                            <p>{activeIncidentSimulation?.consequence ?? selectedStoryDecision.detail}</p>
                            {activeIncidentSimulation ? (
                              <small>{activeIncidentSimulation.pressureLabel} pressure after this move</small>
                            ) : null}
                            <div className="fpConsequenceMeters">
                              <span>Safety {selectedStoryDecision.impact.safety}%</span>
                              <span>Speed {selectedStoryDecision.impact.speed}%</span>
                              <span>Accountability {selectedStoryDecision.impact.trust}%</span>
                            </div>
                          </div>
                          <section
                            className={`elasticEvidencePanel ${
                              agentEvidence.status === "ready" &&
                              (agentEvidence.data.mcp_status === "elastic_mcp_configured" ||
                                agentEvidence.data.mcp_status === "elastic_index_configured")
                                ? "isLive"
                                : ""
                            }`}
                            aria-label="Mission intelligence evidence"
                          >
                            <div className="elasticEvidenceHeader">
                              <div>
                                <span>Mission Intelligence</span>
                                <strong>
                                  {agentEvidence.status === "ready"
                                    ? agentEvidence.data.evidence_source
                                    : agentEvidence.status === "loading"
                                      ? "Retrieving safety context"
                                      : agentEvidence.status === "error"
                                        ? "Evidence unavailable"
                                        : "Waiting for mission"}
                                </strong>
                              </div>
                              <em
                                className={
                                  agentEvidence.status === "ready" &&
                                  (agentEvidence.data.mcp_status === "elastic_mcp_configured" ||
                                    agentEvidence.data.mcp_status === "elastic_index_configured")
                                    ? "status-ready"
                                    : "status-advisory"
                                }
                              >
                                {agentEvidence.status === "ready"
                                  ? agentEvidence.data.mcp_status === "elastic_mcp_configured"
                                    ? "Retrieval live"
                                    : agentEvidence.data.mcp_status === "elastic_index_configured"
                                      ? "Index live"
                                      : "Demo evidence"
                                  : agentEvidence.status}
                              </em>
                            </div>
                            {agentEvidence.status === "ready" ? (
                              <>
                                <p className="elasticEvidenceQuery">
                                  Query: {agentEvidence.data.retrieval_query.query || "scenario route guidance"}
                                </p>
                                <p>{agentEvidence.data.recommended_action}</p>
                                <ul>
                                  {agentEvidence.data.checklist.slice(0, 3).map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                                <small>
                                  {agentEvidence.data.agent_mode === "gemini_configured"
                                    ? "Gemini reasoning used retrieved evidence."
                                    : "Deterministic demo agent used retrieved evidence."}
                                </small>
                              </>
                            ) : agentEvidence.status === "error" ? (
                              <p>{agentEvidence.message}</p>
                            ) : (
                              <p>
                                The agent retrieves drill knowledge before recommending the next route move.
                              </p>
                            )}
                          </section>
                          {activeVideoBeatId === "decision" ? (
                            <section className="fpPauseQuiz" aria-label="Decision pause quiz">
                              <div className="fpPauseQuizHeader">
                                <span>Decision pause quiz</span>
                                <strong>{activeIncidentScene.quiz.question}</strong>
                              </div>
                              <div className="fpPauseQuizAnswers">
                                {activeIncidentScene.quiz.answers.map((answer) => {
                                  const isSelected = activeQuizAnswerId === answer.id;

                                  return (
                                    <button
                                      key={answer.id}
                                      type="button"
                                      className={`fpPauseQuizAnswer ${isSelected ? "isSelected" : ""} ${
                                        isSelected && answer.correct ? "isCorrect" : isSelected ? "isWrong" : ""
                                      }`}
                                      aria-pressed={isSelected}
                                      onClick={() =>
                                        setQuizAnswerByStep((previousValue) => ({
                                          ...previousValue,
                                          [activeStep.id]: answer.id,
                                        }))
                                      }
                                    >
                                      <span className="fpPauseQuizAnswerCue">
                                        {isSelected ? (answer.correct ? "Rule held" : "Risk exposed") : "Choose"}
                                      </span>
                                      <strong>{answer.label}</strong>
                                    </button>
                                  );
                                })}
                              </div>
                              {activePauseQuizResolveCue ? (
                                <div
                                  key={activeQuizAnswerId}
                                  className={`fpPauseQuizResolve ${activePauseQuizResolveCue.verdictToneClass}`}
                                  aria-live="polite"
                                >
                                  <div className="fpPauseQuizResolveChips">
                                    <span className={activePauseQuizResolveCue.verdictToneClass}>
                                      {activePauseQuizResolveCue.verdictLabel}
                                    </span>
                                    <span>{activePauseQuizResolveCue.ruleLabel}</span>
                                    <span>{activePauseQuizResolveCue.proofLabel}</span>
                                  </div>
                                  <p>{activePauseQuizResolveCue.feedback}</p>
                                </div>
                              ) : null}
                            </section>
                          ) : null}
                          {activeStep.id === "share" && trainingOutcome ? (
                            <section className="fpDebriefOverlay" aria-label="Mission result and handoff export">
                              <div className="fpDebriefHeader">
                                <div>
                                  <span>Run result</span>
                                  <strong>{trainingOutcome.label}</strong>
                                </div>
                                <span className={`tonePill ${trainingOutcome.toneClass}`}>
                                  mastery {trainingOutcome.mastery}%
                                </span>
                              </div>
                              <p>{trainingOutcome.detail}</p>
                              {activeDebriefConsequence ? (
                                <article
                                  className="fpDebriefConsequenceBrief"
                                  aria-label="Scenario-specific consequence"
                                >
                                  <div className="fpDebriefConsequenceHeader">
                                    <span>Scenario consequence</span>
                                    <strong>{activeDebriefConsequence.headline}</strong>
                                  </div>
                                  <p>{activeDebriefConsequence.detail}</p>
                                  <div className="fpDebriefConsequenceGrid">
                                    {activeDebriefConsequence.cards.map((card) => (
                                      <div key={card.label} className={card.toneClass}>
                                        <span>{card.label}</span>
                                        <strong>{card.value}</strong>
                                      </div>
                                    ))}
                                  </div>
                                </article>
                              ) : null}
                              <div className="fpDebriefRoute" aria-label="Route drill result">
                                <article>
                                  <span>Route cue</span>
                                  <strong>{activeFirstPersonScene.routeCue.route}</strong>
                                </article>
                                <article>
                                  <span>Avoided</span>
                                  <strong>{activeFirstPersonScene.routeCue.avoid}</strong>
                                </article>
                                <article>
                                  <span>Decision result</span>
                                  <strong>{activeIncidentSimulation?.consequence ?? selectedStoryDecision.detail}</strong>
                                </article>
                              </div>
                              <div className="fpDebriefMeters" aria-label="Result meters">
                                {[
                                  { label: "Safety", value: trainingOutcome.safety },
                                  { label: "Speed", value: trainingOutcome.speed },
                                  { label: "Accountability", value: trainingOutcome.trust },
                                ].map((metric) => (
                                  <div key={metric.label} className="fpDebriefMeter">
                                    <div>
                                      <span>{metric.label}</span>
                                      <strong>{metric.value}%</strong>
                                    </div>
                                    <meter min={0} max={100} value={metric.value}>
                                      {metric.value}%
                                    </meter>
                                  </div>
                                ))}
                              </div>
                              <div className="fpDebriefProof" aria-label="Run proof">
                                <span className="tonePill status-ready">
                                  {trainingOutcome.bestDecisionCount}/{trainingOutcome.totalDecisionCount} best choices
                                </span>
                                <span
                                  className={`tonePill ${
                                    trainingOutcome.quizCorrectCount === trainingOutcome.quizTotal
                                      ? "status-ready"
                                      : "tone-generated"
                                  }`}
                                >
                                  {trainingOutcome.quizCorrectCount}/{trainingOutcome.quizTotal} quiz
                                </span>
                                <span className="tonePill tone-retrieved">
                                  {actionCardArtifact?.sourceSummary ?? sourceCoverageSummary}
                                </span>
                              </div>
                              {actionCardArtifact ? (
                                <article className="fpDebriefActionCard" aria-label="Portable action card preview">
                                  <div className="fpDebriefActionCardHeader">
                                    <span>Portable action card</span>
                                    <strong>{result.actionCardTitle}</strong>
                                  </div>
                                  <div className="fpDebriefActionCardGrid">
                                    <div>
                                      <span>Move trigger</span>
                                      <strong>{actionCardArtifact.triggerLabel}</strong>
                                    </div>
                                    <div>
                                      <span>First destination</span>
                                      <strong>{actionCardArtifact.destinationLabel}</strong>
                                    </div>
                                    <div>
                                      <span>Source check</span>
                                      <strong>{actionCardArtifact.sourceProvenanceLabel}</strong>
                                    </div>
                                    <div>
                                      <span>Route rule</span>
                                      <strong>{activeFirstPersonScene.routeCue.route}</strong>
                                    </div>
                                  </div>
                                  <div className="fpDebriefSourceOrder" aria-label="Action card source order">
                                    {actionCardArtifact.lanes.map((lane) => (
                                      <span key={lane.sourceType} className={`tonePill tone-${lane.sourceType}`}>
                                        {lane.label}
                                      </span>
                                    ))}
                                  </div>
                                </article>
                              ) : null}
                              <div className="fpDebriefActions" aria-label="Handoff actions">
                                <button
                                  type="button"
                                  className="fpDebriefAction"
                                  onClick={handleToggleVoicePlayback}
                                >
                                  {openAIVoiceState === "generating" ? "Generating..." : openAIVoiceUrl ? "Regenerate voice" : "Generate voice"}
                                </button>
                                <button
                                  type="button"
                                  className="fpDebriefAction isPrimary"
                                  onClick={handleCopyPortableActionCard}
                                  disabled={!actionCardArtifact}
                                >
                                  {actionCardCopyState === "copied" ? "Card copied" : "Copy action card"}
                                </button>
                                <button
                                  type="button"
                                  className="fpDebriefAction"
                                  onClick={() => handleDownloadRunbook(judgeDemoBrief)}
                                >
                                  {downloadState === "downloaded" ? "Runbook saved" : "Download runbook"}
                                </button>
                              </div>
                            </section>
                          ) : null}
                          <div className="fpBottomOptions" aria-label="First-person action options">
                            <div className="fpRouteCueRibbon" aria-label="Route rule for this beat">
                              <article>
                                <span>Trigger</span>
                                <strong>{activeFirstPersonScene.routeCue.trigger}</strong>
                              </article>
                              <article>
                                <span>Route</span>
                                <strong>{activeFirstPersonScene.routeCue.route}</strong>
                              </article>
                              <article>
                                <span>Avoid</span>
                                <strong>{activeFirstPersonScene.routeCue.avoid}</strong>
                              </article>
                            </div>
                            <div className="fpVideoTimeline" aria-label="Interactive video timeline">
                              {activeFirstPersonScene.videoBeats.map((beat) => {
                                const isSelected = activeVideoBeatId === beat.id;

                                return (
                                  <button
                                    key={beat.id}
                                    type="button"
                                    className={`fpVideoBeat ${isSelected ? "isSelected" : ""}`}
                                    aria-pressed={isSelected}
                                    onClick={() => {
                                      setVideoBeatByStep((previousValue) => ({
                                        ...previousValue,
                                        [activeStep.id]: beat.id,
                                      }));
                                      setFirstPersonViewByStep((previousValue) => ({
                                        ...previousValue,
                                        [activeStep.id]: beat.viewId,
                                      }));
                                      window.requestAnimationFrame(() => {
                                        lessonCardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
                                      });
                                    }}
                                  >
                                    <span className={`fpVideoBeatThumb ${beat.visualClass}`} aria-hidden="true" />
                                    <span>{beat.timestamp}</span>
                                    <strong>{beat.label}</strong>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="fpMoveControls" aria-label="Move around the scene">
                              {activeFirstPersonScene.controls.map((control) => {
                                const isActive = activeFirstPersonScene.viewId === control.id;

                                return (
                                  <button
                                    key={control.id}
                                    type="button"
                                    className={`fpMoveControl ${isActive ? "isActive" : ""}`}
                                    aria-pressed={isActive}
                                    onClick={() => {
                                      const matchingBeat = activeFirstPersonScene.videoBeats.find(
                                        (beat) => beat.viewId === control.id,
                                      );
                                      setFirstPersonViewByStep((previousValue) => ({
                                        ...previousValue,
                                        [activeStep.id]: control.id,
                                      }));
                                      if (matchingBeat) {
                                        setVideoBeatByStep((previousValue) => ({
                                          ...previousValue,
                                          [activeStep.id]: matchingBeat.id,
                                        }));
                                      }
                                      window.requestAnimationFrame(() => {
                                        lessonCardRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
                                      });
                                    }}
                                  >
                                    {control.label}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="fpDecisionOptions" aria-label="Choose the trainee response">
                              {activeIncidentScene.decisions.map((decision) => {
                                const isSelected = decision.id === selectedStoryDecision.id;
                                const decisionCue = getDecisionHierarchyCue(activeIncidentScene, decision);

                                return (
                                  <button
                                    key={decision.id}
                                    type="button"
                                    className={`fpDecisionOption ${isSelected ? "isSelected" : ""} ${decisionCue.toneClass}`}
                                    aria-pressed={isSelected}
                                    aria-label={`${decisionCue.label}: ${decision.label}. ${decision.detail}`}
                                    onClick={() =>
                                      setStoryDecisionByStep((previousValue) => ({
                                        ...previousValue,
                                        [activeStep.id]: decision.id,
                                      }))
                                    }
                                  >
                                    <span className={`fpDecisionBadge ${decisionCue.toneClass}`}>
                                      {decisionCue.label}
                                    </span>
                                    <strong>{decision.label}</strong>
                                    <span>{decision.detail}</span>
                                    <span className="fpDecisionImpact">
                                      <span>Safe {decision.impact.safety}</span>
                                      <span>Speed {decision.impact.speed}</span>
                                      <span>Count {decision.impact.trust}</span>
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <section className="missionObjectiveOverlay" aria-label="Current objective">
                          <div>
                            <span>Fire drill training · {activeTraineeRole.label} objective</span>
                            <strong>{activeCommandPrompt?.title ?? activeFirstPersonScene.objective}</strong>
                            <p>{activeCommandPrompt?.action ?? activeFirstPersonScene.objective}</p>
                            {activeCommandPrompt ? <em>Safety key: {activeCommandPrompt.cue}</em> : null}
                          </div>
                          {missionTimer ? (
                            <div className={`missionObjectiveTimer ${missionTimer.toneClass}`}>
                              <span>{missionTimer.label}</span>
                              <meter
                                min={0}
                                max={missionTimer.deadlineSeconds}
                                value={Math.min(missionTimer.elapsedSeconds, missionTimer.deadlineSeconds)}
                              />
                            </div>
                          ) : null}
                        </section>
                        <section className="missionActionDock missionStoryDock" aria-label="Guided story controls">
                          <div className="missionStoryPrompt" aria-live="polite">
                            <span>
                              {activeStoryFramePrompt
                                ? `${activeStoryFramePrompt.progressLabel} · ${activeStoryFramePrompt.timestamp}`
                                : "Story"}
                            </span>
                            <strong>{activeStoryFramePrompt?.title ?? activeCommandPrompt?.title ?? "Continue the drill"}</strong>
                            <p>{activeStoryFramePrompt?.instruction ?? activeCommandPrompt?.action}</p>
                            {activeStoryFramePrompt?.requiresSpeech ? (
                              <em>{activeStoryFramePrompt.speech}</em>
                            ) : null}
                          </div>
                          <div className="missionStoryControls">
                            <button type="button" className="missionStoryPrimary" onClick={advanceStory}>
                              {activeStoryFrameIndex >= activeCourseFrames.length - 1 ? "Finish beat" : "Continue story"}
                            </button>
                            <div className="missionStoryKeys" aria-label="Keyboard hints">
                              <kbd>Space</kbd>
                              <span>continue</span>
                              <kbd>W</kbd>
                              <span>forward</span>
                              <kbd>A</kbd>
                              <span>back</span>
                              <kbd>D</kbd>
                              <span>secure</span>
                              <kbd>S</kbd>
                              <span>handoff</span>
                            </div>
                          </div>
                          {activeStoryFramePrompt?.requiresDecision ? (
                            <div className="missionStoryChoices" aria-label="Story decision">
                              <div className="missionStoryQuestion">
                                <span>Decision check</span>
                                <strong>What do you do now?</strong>
                              </div>
                              {activeIncidentScene.decisions.map((decision) => {
                                const isSelected = decision.id === selectedStoryDecision.id;
                                const decisionCue = getDecisionHierarchyCue(activeIncidentScene, decision);
                                const optionLabel = String.fromCharCode(65 + activeIncidentScene.decisions.indexOf(decision));

                                return (
                                  <button
                                    key={decision.id}
                                    type="button"
                                    className={`${isSelected ? "isSelected" : ""} ${decisionCue.toneClass}`}
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                      setStoryDecisionByStep((previousValue) => ({
                                        ...previousValue,
                                        [activeStep.id]: decision.id,
                                      }))
                                    }
                                  >
                                    <span>{optionLabel} · {decisionCue.label}</span>
                                    <strong>{decision.label}</strong>
                                    <em>{decision.detail}</em>
                                    <small>{decision.consequence ?? decisionCue.detail}</small>
                                  </button>
                                );
                              })}
                              <aside className="missionConsequenceCard" aria-live="polite">
                                <span>Consequence</span>
                                <strong>{selectedStoryDecision.label}</strong>
                                <p>{selectedStoryDecision.consequence ?? activeIncidentSimulation?.consequence}</p>
                                <div>
                                  <em>Safety {selectedStoryDecision.impact.safety}</em>
                                  <em>Speed {selectedStoryDecision.impact.speed}</em>
                                  <em>Accountability {selectedStoryDecision.impact.trust}</em>
                                </div>
                              </aside>
                            </div>
                          ) : null}
                          {roleCanSpeak ? (
                            <div
                              className={`missionStorySpeak ${isSpeakOpportunity ? "isOpen" : "isLocked"}`}
                              aria-label="Speak command"
                            >
                              <span>{isSpeakOpportunity ? "Speak now" : "Speak later"}</span>
                              <input
                                value={liveCoachInput}
                                onChange={(event) => setLiveCoachInput(event.target.value)}
                                placeholder={
                                  isSpeakOpportunity
                                    ? buildSpokenRouteCommand(form.hazard, traineeRoleId)
                                    : "The story will open the mic at the route or handoff."
                                }
                                disabled={!isSpeakOpportunity}
                              />
                              <button
                                type="button"
                                onClick={handleStartLiveCoachVoice}
                                disabled={!isSpeakOpportunity || liveCoachState === "thinking"}
                              >
                                {liveCoachState === "listening" ? "Listening..." : "Mic"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void askLiveCoach()}
                                disabled={!isSpeakOpportunity || liveCoachState === "thinking" || !liveCoachInput.trim()}
                              >
                                {liveCoachState === "thinking" ? "Thinking..." : "Check"}
                              </button>
                              {liveCoachReply ? (
                                <p className={`missionStoryCoachReply ${liveCoachSource === "openai" ? "isOpenAI" : ""}`}>
                                  {liveCoachReply}
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </section>
                        <div className="cockpitDrawerRail" aria-label="Simulation course panel">
                          <section className="coursePlayerPanel" aria-label="Fire drill course controls">
                            <div className="coursePlayerHeader">
                              <div>
                                <span>Training drill</span>
                                <strong>{activePreset?.label ?? "Fire drill"}</strong>
                              </div>
                              <button type="button" onClick={handleReturnToScenarioCinema}>
                                Home
                              </button>
                            </div>
                            <div className="courseRolePicker" aria-label="Choose your role">
                              {traineeRoleProfiles.map((role) => (
                                <button
                                  key={role.id}
                                  type="button"
                                  className={traineeRoleId === role.id ? "isActive" : ""}
                                  aria-pressed={traineeRoleId === role.id}
                                  onClick={() => setTraineeRoleId(role.id)}
                                >
                                  {role.label}
                                </button>
                              ))}
                            </div>
                            <div className="courseRoleBrief" aria-live="polite">
                              <strong>{activeTraineeRole.goal}</strong>
                              <p>{activeTraineeRole.instruction}</p>
                            </div>
                            <button
                              type="button"
                              className="courseVoiceGuide"
                              onClick={handlePlaySimulationGuide}
                            >
                              {openAIVoiceState === "generating"
                                ? "Preparing audio guide..."
                                : openAIVoiceUrl
                                  ? "Replay audio guide"
                                  : "Play audio guide"}
                            </button>
                            {activeCommandPrompt ? (
                              <section className="courseCommandBox" aria-label="What to do next">
                                <span>What to do next</span>
                                <strong>{activeCommandPrompt.title}</strong>
                                <p>{activeCommandPrompt.action}</p>
                                <div className="courseCommandMeta">
                                  <em>{activeCommandPrompt.key}</em>
                                  <em>{activeCommandPrompt.cue}</em>
                                </div>
                              </section>
                            ) : null}
                            {missionTimer ? (
                              <section className={`courseTimerBox ${missionTimer.toneClass}`} aria-label="Timed objective">
                                <div>
                                  <span>Timed objective</span>
                                  <strong>{missionTimer.label}</strong>
                                </div>
                                <p>{missionTimer.instruction}</p>
                                <meter
                                  min={0}
                                  max={missionTimer.deadlineSeconds}
                                  value={Math.min(missionTimer.elapsedSeconds, missionTimer.deadlineSeconds)}
                                />
                              </section>
                            ) : null}
                            <div className="coursePanelTabs" aria-label="Simulation panel tabs">
                              {[
                                { id: "story", label: "Story" },
                                { id: "map", label: "Map" },
                                { id: "checklist", label: "Checklist" },
                              ].map((tab) => (
                                <button
                                  key={tab.id}
                                  type="button"
                                  className={coursePanelTab === tab.id ? "isActive" : ""}
                                  aria-pressed={coursePanelTab === tab.id}
                                  onClick={() => setCoursePanelTab(tab.id as "story" | "map" | "checklist")}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                            {coursePanelTab === "story" ? (
                              <div className="courseChapterList" aria-label="Image chapters">
                                {activeCourseFrames.map((frame) => (
                                  <button
                                    key={frame.id}
                                    type="button"
                                    className={frame.active ? "isActive" : ""}
                                    aria-pressed={frame.active}
                                    onClick={frame.action}
                                  >
                                    <img src={frame.imageUrl ?? "/harbor-stage-01-alarm.png"} alt="" />
                                    <span>{frame.timestamp}</span>
                                    <strong>{frame.label}</strong>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                            {coursePanelTab === "map" ? (
                              <section className="courseMapPanel" aria-label="Route map">
                                <div className="courseRouteMap" aria-label="Current route trajectory">
                                  <span className="courseRoutePath" aria-hidden="true" />
                                  {activeCourseFrames.map((frame, index) => (
                                    <button
                                      key={frame.id}
                                      type="button"
                                      className={`courseRouteNode ${frame.active ? "isActive" : ""} ${
                                        index === 0 ? "isStart" : index === activeCourseFrames.length - 1 ? "isEnd" : ""
                                      }`}
                                      style={{
                                        left: `${10 + (index % 5) * 19}%`,
                                        top: `${index < 5 ? 28 + index * 3 : 67 - (index - 5) * 4}%`,
                                      }}
                                      aria-label={`Go to ${frame.label}`}
                                      onClick={frame.action}
                                    >
                                      {index + 1}
                                    </button>
                                  ))}
                                </div>
                                <div className="courseMapBrief">
                                  <span>Current route</span>
                                  <strong>{activeFirstPersonScene.routeCue.route}</strong>
                                  <p>{activeFirstPersonScene.routeCue.avoid}</p>
                                </div>
                                <div className="courseMapConsequence">
                                  <span>Selected consequence</span>
                                  <strong>{selectedStoryDecision.label}</strong>
                                  <p>{selectedStoryDecision.consequence ?? activeIncidentSimulation?.consequence}</p>
                                </div>
                              </section>
                            ) : null}
                            {coursePanelTab === "checklist" ? (
                              <section className="courseDirectionCoach" aria-label="Primary simulation directions">
                                <span>Primary simulation</span>
                                <strong>{activeFirstPersonScene.routeCue.route}</strong>
                                {activeCommandPrompt ? <small>Safety key: {activeCommandPrompt.cue}</small> : null}
                                <div className="courseKeyGrid" aria-label="Keyboard controls">
                                  <kbd>Space</kbd>
                                  <em>continue</em>
                                  <kbd>W</kbd>
                                  <em>forward</em>
                                  <kbd>A</kbd>
                                  <em>back</em>
                                  <kbd>D</kbd>
                                  <em>secure best path</em>
                                  <kbd>S</kbd>
                                  <em>handoff</em>
                                </div>
                                <div className="courseChecklist" aria-label="Checklist">
                                  {[
                                    activeFirstPersonScene.routeCue.trigger,
                                    activeFirstPersonScene.routeCue.route,
                                    activeFirstPersonScene.routeCue.avoid,
                                    roleCanSpeak
                                      ? buildSpokenRouteCommand(form.hazard, traineeRoleId)
                                      : "Student mode: listen, follow, and finish before the timer ends.",
                                  ].map((item, index) => (
                                    <article key={`${item}-${index}`}>
                                      <span>{String(index + 1).padStart(2, "0")}</span>
                                      <strong>{item}</strong>
                                    </article>
                                  ))}
                                </div>
                              </section>
                            ) : null}
                            <div className="courseActionButtons" aria-label="Scene actions">
                              {activeFirstPersonScene.controls.map((control) => (
                                <button
                                  key={control.id}
                                  type="button"
                                  className={activeFirstPersonScene.viewId === control.id ? "isActive" : ""}
                                  aria-pressed={activeFirstPersonScene.viewId === control.id}
                                  onClick={() => {
                                    const matchingBeat = activeFirstPersonScene.videoBeats.find(
                                      (beat) => beat.viewId === control.id,
                                    );
                                    setFirstPersonViewByStep((previousValue) => ({
                                      ...previousValue,
                                      [activeStep.id]: control.id,
                                    }));
                                    if (matchingBeat) {
                                      setVideoBeatByStep((previousValue) => ({
                                        ...previousValue,
                                        [activeStep.id]: matchingBeat.id,
                                      }));
                                    }
                                  }}
                                >
                                  {control.label}
                                </button>
                              ))}
                            </div>
                            <div className="courseDecisionList" aria-label="Choose the move">
                              {activeIncidentScene.decisions.map((decision) => {
                                const isSelected = decision.id === selectedStoryDecision.id;
                                const decisionCue = getDecisionHierarchyCue(activeIncidentScene, decision);

                                return (
                                  <button
                                    key={decision.id}
                                    type="button"
                                    className={`courseDecisionButton ${isSelected ? "isSelected" : ""} ${decisionCue.toneClass}`}
                                    aria-pressed={isSelected}
                                    onClick={() =>
                                      setStoryDecisionByStep((previousValue) => ({
                                        ...previousValue,
                                        [activeStep.id]: decision.id,
                                      }))
                                    }
                                  >
                                    <span>{decisionCue.label}</span>
                                    <strong>{decision.label}</strong>
                                  </button>
                                );
                              })}
                            </div>
                            {roleCanSpeak ? (
                              <div
                                className={`courseSpeakBox ${isSpeakOpportunity ? "isOpen" : "isLocked"}`}
                                aria-label="Speak or type an instruction"
                              >
                                <span>{isSpeakOpportunity ? "Speak window open" : "Speak window locked"}</span>
                                <input
                                  value={liveCoachInput}
                                  onChange={(event) => setLiveCoachInput(event.target.value)}
                                  placeholder={
                                    isSpeakOpportunity
                                      ? "Say/type the command you would give students..."
                                      : "Move to route/handoff before speaking."
                                  }
                                  disabled={!isSpeakOpportunity}
                                />
                                <div>
                                  <button
                                    type="button"
                                    onClick={handleStartLiveCoachVoice}
                                    disabled={!isSpeakOpportunity}
                                  >
                                    {liveCoachState === "listening" ? "Listening..." : "Mic"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void askLiveCoach()}
                                    disabled={!isSpeakOpportunity}
                                  >
                                    Check
                                  </button>
                                </div>
                                {liveCoachReply ? <p>{liveCoachReply}</p> : null}
                              </div>
                            ) : (
                              <div className="courseListenBox" aria-label="Student follow-only mode">
                                <span>Student mode</span>
                                <strong>Listen and follow.</strong>
                                <p>No speaking task. Stay with the group, use the keys, and finish before the timer ends.</p>
                              </div>
                            )}
                            <div className="courseProofLine">
                              <span>{activeCourseFrames.length} story beats ready</span>
                              <span>Audio guide and review map ready</span>
                            </div>
                          </section>
                        <details
                          className="sourceCockpitPanel missionCockpitDrawer"
                          aria-label="Source proof drawer"
                          open={isSourceProofOpen}
                          onToggle={(event) => setIsSourceProofOpen(event.currentTarget.open)}
                        >
                          <summary className="missionCockpitSummary">
                            <div>
                              <p className="detailLabel">Audit</p>
                              <strong>Sources</strong>
                              <span>{sourceCoverageSummary || "Facts and guidance"}</span>
                            </div>
                            <span className="missionCockpitHint">
                              {activeIncidentScene.overlays.length} lanes · source-safe
                            </span>
                          </summary>
                          <div className="missionCockpitDrawerBody">
                            <div className="cockpitDemoPathProof" aria-label="Demo path proof ladder">
                              {[
                                { label: "Scenario", value: activePreset?.label ?? selectedCourse.label },
                                { label: "Cockpit", value: activeFirstPersonScene.locationLabel },
                                { label: "Decision", value: selectedStoryDecision.label },
                                { label: "Source proof", value: sourceCoverageSummary || "3 trust lanes separated" },
                                { label: "Handoff", value: voiceArtifact?.modeLabel ?? "Handoff ready" },
                              ].map((item) => (
                                <article key={item.label}>
                                  <span>{item.label}</span>
                                  <strong>{item.value}</strong>
                                </article>
                              ))}
                            </div>
                            <div className="cockpitTrustOrder" aria-label="Trust order for current source proof">
                              {activeIncidentScene.overlays.map((overlay, index) => {
                                const sourceLane = getSourceProofLane(overlay.id);

                                return (
                                  <button
                                    key={overlay.id}
                                    type="button"
                                    className={`cockpitTrustOrderStep ${overlay.toneClass}`}
                                    onClick={() => {
                                      if (sourceLane) {
                                        jumpToSourceLedgerLane(sourceLane);
                                      }
                                    }}
                                    disabled={!sourceLane}
                                  >
                                    <span>{String(index + 1).padStart(2, "0")}</span>
                                    <strong>{sourceLane ? getSourceProofRole(sourceLane) : overlay.label}</strong>
                                    <em>{sourceLane ? getSourceProofAction(sourceLane) : "View cue"}</em>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="cockpitSourceGrid" aria-label="Current source lanes">
                              {activeIncidentScene.overlays.map((overlay) => (
                                <article key={overlay.id} className={`cockpitSourceCard ${overlay.toneClass}`}>
                                  <span>{overlay.label}</span>
                                  <p>{overlay.detail}</p>
                                </article>
                              ))}
                            </div>
                          </div>
                        </details>
                        <details className="fpLearningPanel missionCockpitDrawer" aria-label="Scenario learning guide">
                          <summary className="missionCockpitSummary">
                            <div>
                              <p className="detailLabel">Guide</p>
                              <strong>Steps</strong>
                              <span>{activeFirstPersonScene.operationStage}</span>
                            </div>
                            <span className="tonePill tone-generated">{activeFirstPersonScene.learningGoal}</span>
                          </summary>
                          <div className="missionCockpitDrawerBody">
                            <div className="fpLearningFrames">
                              {activeFirstPersonScene.learningFrames.map((frame) => (
                                <article key={frame.id} className="fpLearningFrame">
                                  <div className={`fpLearningVisual ${frame.visualClass}`} aria-hidden="true" />
                                  <div>
                                    <span className={`tonePill ${frame.toneClass}`}>{frame.label}</span>
                                    <strong>{frame.caption}</strong>
                                    <p>{frame.outcome}</p>
                                  </div>
                                </article>
                              ))}
                            </div>
                          </div>
                        </details>
                        <details className="routeTrainerPanel missionCockpitDrawer" aria-label="Route-specific rule trainer">
                          <summary className="missionCockpitSummary">
                            <div>
                              <p className="detailLabel">Practice</p>
                              <strong>Learn</strong>
                              <span>{activeFirstPersonScene.routeTrainer.subtitle}</span>
                            </div>
                            <span className="missionCockpitHint">
                              {activeFirstPersonScene.routeTrainer.checkpoints.length} checkpoints ·{" "}
                              {activeFirstPersonScene.routeTrainer.synonyms.length} phrases
                            </span>
                          </summary>
                          <div className="missionCockpitDrawerBody">
                            <div className="routeTrainerActions">
                              <span className="detailLabel">Pocket card</span>
                              <button
                                type="button"
                                className="secondaryButton routeSaveButton"
                                onClick={handleCopyRouteTrainerCard}
                              >
                                {routeCardCopyState === "copied"
                                  ? "Saved"
                                  : routeCardCopyState === "error"
                                    ? "Save failed"
                                    : "Save route card"}
                              </button>
                            </div>
                            <div className="routeCheckpointTrack" aria-label="Route checkpoints">
                              {activeFirstPersonScene.routeTrainer.checkpoints.map((checkpoint, index) => (
                                <article key={checkpoint.id} className="routeCheckpoint">
                                  <span className={`routeCheckpointNode ${checkpoint.toneClass}`}>
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <div>
                                    <strong>{checkpoint.label}</strong>
                                    <p>{checkpoint.detail}</p>
                                  </div>
                                </article>
                              ))}
                            </div>
                            <div className="routeSynonymBank" aria-label="Emergency synonym trainer">
                              {activeFirstPersonScene.routeTrainer.synonyms.map((synonym) => (
                                <article key={`${synonym.term}-${synonym.plain}`} className="routeSynonymCard">
                                  <span>{synonym.term}</span>
                                  <strong>{synonym.plain}</strong>
                                  <p>{synonym.verb}</p>
                                </article>
                              ))}
                            </div>
                            <div className="routeRuleGame" aria-label="Route rule choice game">
                              <div className="routeRuleHeader">
                                <span>Choose the rule phrase</span>
                                <strong>Which instruction keeps this route safe?</strong>
                              </div>
                              <div className="routeRuleChoices">
                                {activeFirstPersonScene.routeTrainer.ruleChoices.map((choice) => {
                                  const isSelected = activeRouteRuleChoiceId === choice.id;

                                  return (
                                    <button
                                      key={choice.id}
                                      type="button"
                                      className={`routeRuleChoice ${isSelected ? "isSelected" : ""} ${
                                        isSelected && choice.correct ? "isCorrect" : isSelected ? "isWrong" : ""
                                      }`}
                                      aria-pressed={isSelected}
                                      onClick={() => {
                                        setRouteCardCopyState("idle");
                                        setRouteRuleChoiceByStep((previousValue) => ({
                                          ...previousValue,
                                          [activeStep.id]: choice.id,
                                        }));
                                      }}
                                    >
                                      <strong>{choice.label}</strong>
                                      <span>{choice.detail}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              {activeRouteRuleChoice ? (
                                <p className="routeRuleFeedback">{activeRouteRuleChoice.feedback}</p>
                              ) : null}
                            </div>
                          </div>
                        </details>
                        <details className="gemmaCockpitPanel missionCockpitDrawer" aria-label="Agent technical proof drawer">
                          <summary className="missionCockpitSummary">
                            <div>
                              <p className="detailLabel">System</p>
                              <strong>Settings</strong>
                              <span>{result.engineLabel}</span>
                            </div>
                            <span className="missionCockpitHint">Ollama + JSON</span>
                          </summary>
                          <div className="missionCockpitDrawerBody">
                            <div className="cockpitGemmaGrid" aria-label="Agent technical proof">
                              <article>
                                <span>Runtime</span>
                                <strong>
                                  {result.engineLabel.includes("Gemma via Ollama")
                                    ? result.engineLabel
                                    : "Agent path ready"}
                                </strong>
                                <p>Default local endpoint: 127.0.0.1:11434 with model gemma4:26b.</p>
                              </article>
                              <article>
                                <span>Structured output</span>
                                <strong>JSON enhancement contract</strong>
                                <p>Agent output returns actionCardTitle, summary, and voiceScript before schema validation.</p>
                              </article>
                              <article>
                                <span>Grounding</span>
                                <strong>{sourceCoverageSummary || "Official + retrieved + generated"}</strong>
                                <p>Official facts, retrieved guidance, and generated adaptation stay separate.</p>
                              </article>
                              <article>
                                <span>Document hook</span>
                                <strong>{documentBrief ? "Source text active" : "Guidance pack active"}</strong>
                                <p>{documentBrief ? "OCR or bulletin text shaped this run." : "Built-in playbook runs without inventing a bulletin."}</p>
                              </article>
                            </div>
                          </div>
                        </details>
                        <details className="liveCoachPanel missionCockpitDrawer" aria-label="Live voice coach">
                          <summary className="missionCockpitSummary">
                            <div>
                              <p className="detailLabel">Help</p>
                              <strong>Coach</strong>
                              <span>
                                {liveCoachSource === "openai"
                                  ? "Coach connected"
                                  : liveCoachSource === "fallback"
                                    ? "Fallback coach active"
                                    : "Use voice or type a route question"}
                              </span>
                            </div>
                            <span className="missionCockpitHint">voice handoff ready</span>
                          </summary>
                          <div className="missionCockpitDrawerBody">
                            <div className="liveCoachHeader">
                              <button
                                type="button"
                                className="secondaryButton liveCoachTalkButton"
                                onClick={handleStartLiveCoachVoice}
                                disabled={liveCoachState === "listening" || liveCoachState === "thinking"}
                              >
                                {liveCoachState === "listening" ? "Listening..." : "Talk"}
                              </button>
                            </div>
                            <div className="liveCoachInputRow">
                              <input
                                value={liveCoachInput}
                                onChange={(event) => setLiveCoachInput(event.target.value)}
                                placeholder="Ask: which route phrase should I use now?"
                              />
                              <button
                                type="button"
                                className="secondaryButton"
                                onClick={() => void askLiveCoach()}
                                disabled={liveCoachState === "thinking" || !liveCoachInput.trim()}
                              >
                                {liveCoachState === "thinking" ? "Thinking..." : "Ask"}
                              </button>
                            </div>
                            {liveCoachReply ? (
                              <div className="liveCoachReply">
                                <span>Coach reply</span>
                                <p>{liveCoachReply}</p>
                              </div>
                            ) : null}
                            <div className="openAIVoicePanel" aria-label="Generated voice output">
                              <div>
                                <span>Scenario voice</span>
                                <p>
                                  Generate one realistic radio-style drill clip for this exact scene.
                                </p>
                              </div>
                              <button
                                type="button"
                                className="secondaryButton"
                                onClick={handleGenerateOpenAIVoice}
                                disabled={openAIVoiceState === "generating"}
                              >
                                {openAIVoiceState === "generating"
                                  ? "Generating scenario voice..."
                                  : openAIVoiceUrl
                                    ? "Regenerate scenario voice"
                                    : "Generate scenario voice"}
                              </button>
                              {openAIVoiceUrl ? (
                                <audio className="openAIVoicePlayer" src={openAIVoiceUrl} controls />
                              ) : null}
                              {openAIVoiceState === "error" ? (
                                <p className="openAIVoiceError">{openAIVoiceError || "Voice generation failed."}</p>
                              ) : null}
                            </div>
                          </div>
                        </details>
                        </div>
                      </section>
                    ) : null}
                    <div className={`incidentMap ${activeIncidentScene.mapToneClass}`}>
                      <div className="incidentMapGrid" aria-hidden="true" />
                      <div className="incidentMapRoute" aria-hidden="true" />
                      {activeIncidentScene.zones.map((zone, index) => (
                        <div
                          key={zone.id}
                          className={`incidentZone incidentZone-${index + 1} ${zone.toneClass}`}
                        >
                          <span>{zone.label}</span>
                          <strong>{zone.detail}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="incidentBriefing">
                      <p className="detailLabel">{activeIncidentScene.label}</p>
                      <strong>{activeIncidentScene.headline}</strong>
                      <p>{activeIncidentScene.briefing}</p>
                    </div>
                  </div>
                  <div className="incidentDecisionPanel">
                    <div className="incidentAuthorityMap">
                      <p className="detailLabel">Authority overlay</p>
                      {activeIncidentScene.overlays.map((overlay) => (
                        <article key={overlay.id} className="incidentAuthorityItem">
                          <span className={`tonePill ${overlay.toneClass}`}>{overlay.label}</span>
                          <p>{overlay.detail}</p>
                        </article>
                      ))}
                    </div>
                    <div className="incidentDecisionDeck">
                      <p className="detailLabel">Decision point</p>
                      {activeIncidentScene.decisions.map((decision) => {
                        const isSelected = decision.id === selectedStoryDecision.id;
                        const decisionCue = getDecisionHierarchyCue(activeIncidentScene, decision);

                        return (
                          <button
                            key={decision.id}
                            type="button"
                            className={`incidentDecisionCard ${isSelected ? "isSelected" : ""} ${decisionCue.toneClass}`}
                            aria-pressed={isSelected}
                            aria-label={`${decisionCue.label}: ${decision.label}. ${decision.detail}`}
                            onClick={() =>
                              setStoryDecisionByStep((previousValue) => ({
                                ...previousValue,
                                [activeStep.id]: decision.id,
                              }))
                            }
                          >
                            <span className={`decisionHierarchyBadge ${decisionCue.toneClass}`}>
                              {decisionCue.label}
                            </span>
                            <strong>{decision.label}</strong>
                            <span>{decision.detail}</span>
                            <span className="decisionHierarchyDetail">{decisionCue.detail}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="incidentImpactPanel" aria-label="Selected decision impact">
                      {[
                        { label: "Safety", value: selectedStoryDecision.impact.safety },
                        { label: "Speed", value: selectedStoryDecision.impact.speed },
                        { label: "Accountability", value: selectedStoryDecision.impact.trust },
                      ].map(({ label, value }) => (
                        <div key={label} className="incidentImpactMeter">
                          <div>
                            <span>{label}</span>
                            <strong>{value}%</strong>
                          </div>
                          <meter min={0} max={100} value={value}>
                            {value}%
                          </meter>
                        </div>
                      ))}
                    </div>
                    {activeIncidentSimulation ? (
                      <section className="incidentSimulationPanel" aria-label="RPG training simulation">
                        <div className="incidentSimulationHeader">
                          <div>
                            <p className="detailLabel">Training sim turn</p>
                            <strong>{activeIncidentSimulation.turnLabel}</strong>
                          </div>
                          <span className="tonePill status-confirm">
                            pressure {activeIncidentSimulation.pressureValue}%
                          </span>
                        </div>
                        <p>{activeIncidentSimulation.consequence}</p>
                        <div className="incidentSimulationStage" aria-label="Simulated people and responders">
                          {activeIncidentSimulation.actors.map((actor) => (
                            <article
                              key={actor.id}
                              className={`incidentActor ${actor.positionClass} ${actor.toneClass}`}
                            >
                              <span>{actor.role}</span>
                              <strong>{actor.name}</strong>
                              <p>{actor.status}</p>
                            </article>
                          ))}
                        </div>
                        <div className="incidentPressureMeter">
                          <div>
                            <span>Scene pressure</span>
                            <strong>{activeIncidentSimulation.pressureLabel}</strong>
                          </div>
                          <meter min={0} max={100} value={activeIncidentSimulation.pressureValue}>
                            {activeIncidentSimulation.pressureValue}%
                          </meter>
                        </div>
                        <ol className="incidentSimLog">
                          {activeIncidentSimulation.log.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      </section>
                    ) : null}
                  </div>
                </section>
              ) : null}
                <div className="missionTask">
                  <p className="detailLabel">Objective</p>
                  <strong>{activeStep.task}</strong>
                </div>
                {activeIncidentScene ? (
                  <section className="simQuizPanel" aria-label="Knowledge check">
                    <div className="simQuizHeader">
                      <div>
                        <p className="detailLabel">Knowledge check</p>
                        <strong>{activeIncidentScene.quiz.question}</strong>
                      </div>
                      <span className={`tonePill ${activeQuizAnswer?.correct ? "status-ready" : activeQuizAnswer ? "status-confirm" : "tone-generated"}`}>
                        {activeQuizAnswer?.correct ? "correct" : activeQuizAnswer ? "try again" : "quiz"}
                      </span>
                    </div>
                    <div className="simQuizAnswers">
                      {activeIncidentScene.quiz.answers.map((answer) => {
                        const isSelected = activeQuizAnswerId === answer.id;

                        return (
                          <button
                            key={answer.id}
                            type="button"
                            className={`simQuizAnswer ${isSelected ? "isSelected" : ""} ${
                              isSelected && answer.correct ? "isCorrect" : isSelected ? "isWrong" : ""
                            }`}
                            aria-pressed={isSelected}
                            onClick={() =>
                              setQuizAnswerByStep((previousValue) => ({
                                ...previousValue,
                                [activeStep.id]: answer.id,
                              }))
                            }
                          >
                            {answer.label}
                          </button>
                        );
                      })}
                    </div>
                    {activeQuizAnswer ? <p className="simQuizFeedback">{activeQuizAnswer.feedback}</p> : null}
                  </section>
                ) : null}
                <details className="simDeepDiveDrawer">
                  <summary>Open source-backed notes and exports</summary>
                  {activeStep.body}
                </details>
                <div className="lessonControls">
                  <button
                    className="secondaryButton"
                    type="button"
                    onClick={() => jumpToMissionStep(Math.max(0, activeMissionStepIndex - 1))}
                    disabled={activeMissionStepIndex === 0}
                  >
                    Back
                  </button>
                  <button
                    className="primaryButton"
                    type="button"
                    onClick={() => jumpToMissionStep(Math.min(missionSteps.length - 1, activeMissionStepIndex + 1))}
                    disabled={activeMissionStepIndex === missionSteps.length - 1}
                  >
                    Next stage
                  </button>
                </div>
              </section>
            </section>
          </div>
        ) : (
          <div className="emptyState">
            <div className="emptyStateCopy">
              <p className="eyebrow">Learning workspace</p>
              <h2>Pick a preset and press Start mission.</h2>
              <p>
                The guided workspace appears here with simple Next/Back steps.
              </p>
            </div>
            <div className="emptyEnginePreview" aria-label="Engine preview">
              {engineStages.map((stage) => (
                <div key={stage.step}>
                  <span>{stage.step}</span>
                  <strong>{stage.label}</strong>
                  <p>{stage.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function getScenarioStartLabel(hazard: IntakeForm["hazard"]) {
  switch (hazard) {
    case "fire":
      return "Start fireline drill";
    case "tsunami":
      return "Run inland route";
    case "flood":
      return "Practice flood route";
    case "typhoon":
      return "Run shelter drill";
    case "heatwave":
      return "Start cooling drill";
  }
}

function getVoicePlaybackConfig(language: ActionBundle["voiceBriefing"]["language"]) {
  switch (language) {
    case "Tagalog":
      return { langTag: "fil-PH", rate: 0.94, voicePrefix: "fil" };
    case "Simplified English":
      return { langTag: "en-US", rate: 0.92, voicePrefix: "en" };
    case "English":
      return { langTag: "en-PH", rate: 0.96, voicePrefix: "en" };
  }
}

function estimateVoiceScriptTiming(script: string, playbackRate: number) {
  const wordCount = script.trim().split(/\s+/).filter(Boolean).length;
  if (!wordCount) {
    return null;
  }

  const normalizedPlaybackRate = Math.min(Math.max(playbackRate, 0.6), 1.4);
  const baseWordsPerMinute = 145;
  const wordsPerMinute = baseWordsPerMinute * normalizedPlaybackRate;
  const seconds = Math.max(6, Math.round((wordCount / wordsPerMinute) * 60));
  const label =
    seconds >= 60
      ? `about ${Math.floor(seconds / 60)}m ${`${seconds % 60}`.padStart(2, "0")}s`
      : `about ${seconds}s`;

  return {
    wordCount,
    seconds,
    label,
    playbackRateLabel: `${normalizedPlaybackRate.toFixed(2)}x`,
  };
}

function splitVoiceScriptSentences(script: string) {
  const normalized = script.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const rawMatches = normalized.match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g) ?? [normalized];
  return rawMatches.map((item) => ensureSentence(item)).filter(Boolean);
}

function buildVoiceTrimSuggestion(
  script: string,
  playbackRate: number,
  target: { minSeconds: number; maxSeconds: number },
) {
  const baselineTiming = estimateVoiceScriptTiming(script, playbackRate);
  if (!baselineTiming || baselineTiming.seconds <= target.maxSeconds) {
    return null;
  }

  const sentences = splitVoiceScriptSentences(script);
  if (sentences.length < 2) {
    return null;
  }

  const nextSentences = [...sentences];
  const removedSentences: string[] = [];
  let nextTiming = baselineTiming;

  while (nextTiming.seconds > target.maxSeconds && nextSentences.length > 1) {
    const removed = nextSentences.pop();
    if (removed) {
      removedSentences.unshift(removed);
    }

    const candidateTiming = estimateVoiceScriptTiming(nextSentences.join(" "), playbackRate);
    if (!candidateTiming) {
      return null;
    }

    nextTiming = candidateTiming;
  }

  if (!removedSentences.length) {
    return null;
  }

  const removedWordCount = removedSentences.join(" ").split(/\s+/).filter(Boolean).length;

  return {
    script: nextSentences.join(" "),
    timing: nextTiming,
    removedSentenceCount: removedSentences.length,
    removedWordCount,
  };
}

function getVoiceDemoTimingStatus(
  timing: ReturnType<typeof estimateVoiceScriptTiming>,
  target: { minSeconds: number; maxSeconds: number },
) {
  const targetWindow = `${target.minSeconds}-${target.maxSeconds}s`;

  if (!timing) {
    return {
      toneClass: "tone-generated",
      label: "estimate pending",
      detail: `Target demo clip: ${targetWindow}. Generate or copy the voice script to measure speaking length.`,
      exportLine: `Demo target window: ${targetWindow}. Timing estimate unavailable.`,
    };
  }

  if (timing.seconds > target.maxSeconds) {
    const overBy = timing.seconds - target.maxSeconds;
    return {
      toneClass: "status-advisory",
      label: `${overBy}s over target`,
      detail: `Target demo clip: ${targetWindow}. Current estimate is ${timing.label}, so trim one or two lines before live playback.`,
      exportLine: `Demo target window: ${targetWindow}. Current estimate is ${timing.label} (${overBy}s over target).`,
    };
  }

  if (timing.seconds < target.minSeconds) {
    const underBy = target.minSeconds - timing.seconds;
    return {
      toneClass: "tone-retrieved",
      label: `${underBy}s under target`,
      detail: `Target demo clip: ${targetWindow}. Current estimate is ${timing.label}, which is shorter than the ideal demo window but still usable.`,
      exportLine: `Demo target window: ${targetWindow}. Current estimate is ${timing.label} (${underBy}s under target).`,
    };
  }

  return {
    toneClass: "status-ready",
    label: "within target",
    detail: `Target demo clip: ${targetWindow}. Current estimate is ${timing.label}, which fits the live demo pacing window.`,
    exportLine: `Demo target window: ${targetWindow}. Current estimate is ${timing.label}, within target.`,
  };
}

function buildVoiceArtifact(result: ActionBundle, includeSourceAwareLead: boolean): VoiceArtifact {
  const generatedSegment: VoiceArtifactSegment = {
    sourceType: "generated",
    label: "Generated briefing",
    text: ensureSentence(result.voiceBriefing.script),
  };

  if (!includeSourceAwareLead || !result.documentBrief) {
    return {
      mode: "planner",
      modeLabel: "Generated briefing",
      summary: "Play the generated spoken brief on its own for the shortest possible demo handoff.",
      script: generatedSegment.text,
      segments: [generatedSegment],
    };
  }

  const officialTrigger =
    result.trustSnapshot.items.find((item) => item.title === "Move trigger")?.detail ??
    result.evacuation.decision;
  const officialSegment: VoiceArtifactSegment = {
    sourceType: "official",
    label: "Official trigger",
    text: ensureSentence(`Official trigger. ${officialTrigger}`),
  };
  const documentSourceFacts = getDocumentSourceFacts(result.documentBrief);
  const retrievedSourceTiming = getRetrievedSourceTiming(result);
  const retrievedCue =
    result.documentBrief.actionCue ??
    result.documentBrief.extractedPoints[0] ??
    result.documentBrief.recommendedChecks[0] ??
    result.documentBrief.summary;
  const retrievedSegments: VoiceArtifactSegment[] = [
    ...documentSourceFacts.map((fact) => ({
      sourceType: "retrieved" as const,
      label: fact.label,
      text: ensureSentence(fact.sentence),
    })),
    ...(retrievedSourceTiming
      ? [
          {
            sourceType: "retrieved" as const,
            label: "Retrieved source timing",
            text: ensureSentence(`Source timing to verify. ${retrievedSourceTiming}`),
          },
        ]
      : []),
    {
      sourceType: "retrieved",
      label: "Retrieved document cue",
      text: ensureSentence(`Retrieved cue to verify. ${retrievedCue}`),
    },
  ];
  const segments = [officialSegment, ...retrievedSegments, generatedSegment];
  const sourceLeadSummary =
    documentSourceFacts.length === 2
      ? "name the issuing authority and affected facility"
      : documentSourceFacts[0]
        ? `name the ${documentSourceFacts[0].label.toLowerCase()}`
        : "name one retrieved document cue";
  const sourceLeadSummaryDetail = [
    sourceLeadSummary,
    retrievedSourceTiming ? "call out the source timing window" : null,
  ]
    .filter(Boolean)
    .join(", then ");

  return {
    mode: "source-aware",
    modeLabel: "Source-aware handoff",
    summary:
      `Start with one official trigger line, then ${sourceLeadSummaryDetail}, then let the generated briefing carry the rest of the spoken handoff.`,
    script: segments.map((segment) => segment.text).join(" "),
    segments,
  };
}

function buildIntakeSourcePreview(
  form: IntakeForm,
  locationLabel: string,
  hazardLabel: string,
  documentPreview: DocumentBrief | null,
  builtInGuidanceCount: number,
) {
  const documentSourceName = form.documentSourceName.trim();
  const hasTraceableDocumentSourceName = isTraceableSourceLabel(documentSourceName);
  const hasAuthorityTaggedDocumentSourceName = isAuthorityTaggedSourceLabel(documentSourceName);
  const documentEffectiveTime = form.documentEffectiveTime.trim();
  const documentTimingOverride = form.documentTimingOverride;
  const documentTimingOverrideReason = form.documentTimingOverrideReason.trim();
  const profileBits = [
    `${form.adults} adults`,
    form.children > 0 ? `${form.children} children` : null,
    form.elders > 0 ? `${form.elders} elders` : null,
    form.pets > 0 ? `${form.pets} pets` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const roleLabel = form.role === "household" ? "home" : form.role;
  const retrievedInputsLabel = documentPreview
    ? `${builtInGuidanceCount} built-in guidance source${builtInGuidanceCount === 1 ? "" : "s"} plus 1 pasted document cue`
    : `${builtInGuidanceCount} built-in guidance source${builtInGuidanceCount === 1 ? "" : "s"}`;

  return {
    headline: documentPreview
      ? `Beacon will combine official facts, ${retrievedInputsLabel}, and generated role support before it writes the mission.`
      : `Beacon will combine official facts, ${retrievedInputsLabel}, and generated role support before it writes the mission.`,
    lanes: [
      {
        sourceType: "official" as const,
        label: "Official facts",
        title: "Verified at run time",
        tone: "verified",
        detail: "This lane anchors the mission to factual context and keeps the highest-stakes trigger outside the model's imagination.",
        items: [
          `Geocode ${locationLabel} before sequencing the plan.`,
          "Attach live weather context when it is available at run time.",
          `Keep the final ${hazardLabel.toLowerCase()} move trigger tied to official alerts or direct on-ground conditions.`,
        ],
      },
      {
        sourceType: "retrieved" as const,
        label: "Retrieved guidance",
        title: documentPreview
          ? hasTraceableDocumentSourceName && hasAuthorityTaggedDocumentSourceName
            ? `Guidance pack plus ${documentSourceName}`
            : "Guidance pack plus pasted cues"
          : "Guidance pack",
        tone: documentPreview ? "document-ready" : "optional document lane",
        detail: documentPreview
          ? "Beacon will use the pasted text to shape sequencing and checks without upgrading it into a verified fact."
          : "Beacon will use the built-in hazard guidance pack now, and you can add a memo or OCR extract to make this run more local.",
        items: documentPreview
          ? [
              `${builtInGuidanceCount} built-in ${hazardLabel.toLowerCase()} guidance source${
                builtInGuidanceCount === 1 ? "" : "s"
              } stay in the sequencing lane.`,
              hasTraceableDocumentSourceName && hasAuthorityTaggedDocumentSourceName
                ? `Source label kept for traceability: ${documentSourceName}.`
                : hasTraceableDocumentSourceName
                  ? `Source label captured (${documentSourceName}), but it still needs an issuing authority keyword.`
                : documentSourceName
                  ? `Source label is still placeholder (${documentSourceName}). Replace it with the issuing office or sender.`
                  : "No source label attached yet, so this cue will show as manual paste.",
              documentEffectiveTime
                ? `Source timing tracked: ${documentEffectiveTime}.`
                : "No source timing attached yet, so treat this cue as currently un-timed.",
              ...(documentTimingOverride !== "auto"
                ? [
                    `Timing freshness manually set to ${formatSourceTimingFreshnessOverrideLabel(
                      documentTimingOverride,
                    )} for this run.`,
                    ...(documentTimingOverrideReason
                      ? [`Timing override note: ${documentTimingOverrideReason}.`]
                      : []),
                  ]
                : []),
              documentPreview.planningAdjustments[0],
              `First check: ${documentPreview.recommendedChecks[0]}`,
            ]
          : [
              `${builtInGuidanceCount} built-in ${hazardLabel.toLowerCase()} guidance source${
                builtInGuidanceCount === 1 ? "" : "s"
              } shape the action order and verification rhythm.`,
              "Pasted bulletins, PDF snippets, DOCX notes, and OCR text stay in this lane.",
              "This source type informs the plan, but it does not replace official facts.",
            ],
      },
      {
        sourceType: "generated" as const,
        label: "Generated recommendations",
        title: "Role and access adaptation",
        tone: "planner support",
        detail: "This lane personalizes the mission to the people, constraints, and voice format you entered.",
        items: [
          `Adapt for a ${roleLabel} profile with ${profileBits || "the current group setup"}.`,
          form.mobilityNeeds.trim()
            ? `Carry the access note into the checklist: ${form.mobilityNeeds.trim()}.`
            : "Assume standard movement unless you add an access or mobility note.",
          form.weakInternet
            ? `Bias the share plan and voice brief toward low-connectivity fallback in ${form.language}.`
            : `Prepare the share plan and voice brief in ${form.language} with a backup check-in path.`,
        ],
      },
    ],
  };
}

function buildPortableActionCard(result: ActionBundle) {
  const moveTrigger =
    result.trustSnapshot.items.find((item) => item.title === "Move trigger")?.detail ??
    result.evacuation.decision;
  const retrievedGuidanceSignal = getRetrievedGuidanceTrustSignal(result);
  const guidancePack =
    retrievedGuidanceSignal?.detail ?? "Retrieved guidance shaped the sequencing for this mission.";
  const generatedSupport =
    result.trustSnapshot.items.find((item) => item.sourceType === "generated")?.detail ??
    "Generated planning support helped adapt this mission to the people and constraints entered.";
  const firstDestination = result.evacuation.destinations[0];
  const actionCue = result.documentBrief?.actionCue ?? null;
  const timingCue = result.documentBrief?.timingCue;
  const retrievedSourceTiming = getRetrievedSourceTiming(result);
  const retrievedTimingOverride = getRetrievedSourceTimingOverride(result);
  const retrievedTimingOverrideReason = getRetrievedSourceTimingOverrideReason(result);
  const retrievedTimingFreshness = getSourceTimingFreshness(retrievedSourceTiming, {
    override: retrievedTimingOverride,
  });
  const sourceProvenanceStatus = buildPortableActionSourceProvenanceStatus(result);
  const documentSourceFacts = getDocumentSourceFacts(result.documentBrief);
  const documentSourceDescriptor = getDocumentSourceDescriptor(result.documentBrief);
  const authorityStrip = buildAuthorityStrip(result);
  const exportTrustLaneChips = buildTrustLaneChipMarkdown(["official", "retrieved", "generated"]);
  const exportSourceReferences = buildExportSourceReferenceLines(result);
  const sourceSummary = [
    `${result.sources.officialFacts.length} official`,
    `${result.sources.retrievedGuidance.length} retrieved`,
    `${result.sources.generatedNotes.length} generated`,
  ].join(" / ");
  const markdown = [
    `${result.actionCardTitle}`,
    "",
    exportTrustLaneChips,
    "",
    `OFFICIAL FACTS`,
    `- Move trigger: ${moveTrigger}`,
    `- First destination: ${
      firstDestination
        ? `${firstDestination.name} (${firstDestination.etaMinutes} min est, ${firstDestination.distanceKm.toFixed(1)} km)`
        : "Pick the safest reachable destination now."
    }`,
    "",
    `RETRIEVED GUIDANCE`,
    `- ${guidancePack}`,
    `- Source provenance: ${sourceProvenanceStatus.exportLine}`,
    ...documentSourceFacts.map((fact) => `- ${fact.label}: ${fact.headline}`),
    ...(actionCue ? [`- Document order to verify: ${actionCue}`] : []),
    ...(retrievedSourceTiming ? [`- Source timing to verify: ${retrievedSourceTiming}`] : []),
    ...(retrievedTimingFreshness ? [`- Timing freshness: ${retrievedTimingFreshness.detail}`] : []),
    ...(retrievedTimingOverrideReason ? [`- Timing override note: ${retrievedTimingOverrideReason}`] : []),
    ...(timingCue ? [`- Timing cue to verify: ${timingCue}`] : []),
    "",
    `GENERATED RECOMMENDATIONS`,
    `- ${generatedSupport}`,
    "",
    `AUTHORITY ORDER`,
    ...authorityStrip.map((item) => `- ${item.label}: ${item.headline} (${item.toneLabel})`),
    "",
    ...exportSourceReferences,
    "",
    `IMMEDIATE ACTIONS`,
    ...result.immediateActions.slice(0, 4).map((item, index) => `${index + 1}. ${item}`),
    "",
    `VERIFY NEXT`,
    ...result.verification.slice(0, 3).map((item) => `- ${item}`),
    "",
    `Source split: ${sourceSummary}`,
  ].join("\n");

  return {
    triggerLabel: truncateForCard(moveTrigger, 76),
    destinationLabel: firstDestination
      ? `${firstDestination.name} • ${firstDestination.etaMinutes} min`
      : "Choose safer shelter",
    sourceSummary,
    sourceProvenanceLabel: truncateForCard(sourceProvenanceStatus.uiLabel, 96),
    sourceProvenanceToneClass: sourceProvenanceStatus.toneClass,
    sourceProvenanceToneLabel: sourceProvenanceStatus.toneLabel,
    documentSourceFacts: documentSourceFacts.map((fact) => ({
      label: fact.label,
      headline: fact.headline,
    })),
    actionCueLabel: actionCue ? truncateForCard(actionCue, 76) : null,
    timingCueLabel: timingCue ? truncateForCard(timingCue, 76) : null,
    timingFreshnessLabel: retrievedTimingFreshness?.label ?? null,
    timingFreshnessDetail: retrievedTimingFreshness?.detail ?? null,
    timingOverrideNoteLabel: retrievedTimingOverrideReason
      ? truncateForCard(retrievedTimingOverrideReason, 96)
      : null,
    lanes: [
      {
        sourceType: "official" as const,
        label: "Official facts",
        title: "Trigger to act",
        detail: moveTrigger,
      },
      {
        sourceType: "retrieved" as const,
        label: "Retrieved guidance",
        title: actionCue ? "Document order to verify" : timingCue ? "Document timing cue" : "What shaped this sequence",
        detail: actionCue
          ? timingCue
            ? `${actionCue} Timing window: ${timingCue} Verify both against the latest bulletin before treating them as active.`
            : `${actionCue} Verify the document order against the latest bulletin before treating it as active.`
          : timingCue
            ? `${timingCue} Verify the exact schedule window against the latest bulletin before treating it as active.`
          : documentSourceDescriptor
            ? `${documentSourceDescriptor.sentence} Verify that this source still applies before treating it as an active instruction.`
          : guidancePack,
      },
      {
        sourceType: "generated" as const,
        label: "Generated recommendations",
        title: "Planner adaptation",
        detail: generatedSupport,
      },
    ],
    markdown,
  };
}

function buildPortableFlowArtifact(result: ActionBundle): PortableFlowArtifact {
  const authorityStrip = buildAuthorityStrip(result);
  const exportTrustLaneChips = buildTrustLaneChipMarkdown(["official", "retrieved", "generated"]);
  const exportSourceReferences = buildExportSourceReferenceLines(result);
  const sourceProvenanceStatus = buildPortableActionSourceProvenanceStatus(result);
  const summaryCards: PortableFlowSummaryCard[] = [
    {
      id: "official",
      label: "Official trigger",
      toneClass: authorityStrip[0]?.toneClass ?? "status-confirm",
      toneLabel: authorityStrip[0]?.toneLabel ?? "official trigger",
      headline:
        authorityStrip[0]?.headline ??
        truncateForCard(result.evacuation.decision, 92),
      detail:
        authorityStrip[0]?.detail ??
        "Confirm the move threshold with official alerts or direct on-ground conditions.",
    },
    {
      id: "retrieved",
      label: "Retrieved cue",
      toneClass: authorityStrip[1]?.toneClass ?? "tone-retrieved",
      toneLabel: authorityStrip[1]?.toneLabel ?? "retrieved cue",
      headline:
        authorityStrip[1]?.headline ??
        "Retrieved guidance is shaping the mission order and verification rhythm.",
      detail:
        authorityStrip[1]?.detail ??
        "Keep this visible so document, bulletin, or memo cues do not disappear inside general notes.",
    },
    {
      id: "generated",
      label: "Generated support",
      toneClass: authorityStrip[2]?.toneClass ?? "tone-generated",
      toneLabel: authorityStrip[2]?.toneLabel ?? "generated support",
      headline:
        authorityStrip[2]?.headline ??
        "Beacon adapted the mission around the active role, group, and constraints.",
      detail:
        authorityStrip[2]?.detail ??
        "Treat this as operational support after the official trigger and retrieved cue are clear.",
    },
    {
      id: "route",
      label: "First move",
      toneClass: authorityStrip[3]?.toneClass ?? "status-ready",
      toneLabel: authorityStrip[3]?.toneLabel ?? "first move",
      headline:
        authorityStrip[3]?.headline ??
        "Route context attached",
      detail:
        authorityStrip[3]?.detail ??
        "Keep the first destination visible so the demo lands on an actual move, not only a checklist.",
    },
  ];
  const mermaid = buildPortableFlowMermaid(result.flowchart, summaryCards);
  const body = [
    exportTrustLaneChips,
    `Source order: ${summaryCards.map((item) => `${item.label.toLowerCase()} (${item.toneLabel})`).join(" -> ")}`,
    `Source provenance: ${sourceProvenanceStatus.exportLine}`,
    ...summaryCards.map((item) => `- ${item.label}: ${item.headline}`),
    "",
    ...exportSourceReferences,
    "",
    ...mermaid.split("\n"),
  ].join("\n");

  return {
    headline:
      summaryCards[3]?.headline ??
      "Portable flow summary and Mermaid block",
    summary:
      "This export now carries the trust order and first move above the operational drill flow, so it reads cleanly in docs, markdown viewers, and judge slides.",
    sourceProvenanceLabel: truncateForCard(sourceProvenanceStatus.uiLabel, 96),
    sourceProvenanceToneClass: sourceProvenanceStatus.toneClass,
    sourceProvenanceToneLabel: sourceProvenanceStatus.toneLabel,
    summaryCards,
    mermaid,
    body,
  };
}

function buildDocumentImpactCards(documentBrief: DocumentBrief): DocumentImpactCard[] {
  const documentSourceDescriptor = getDocumentSourceDescriptor(documentBrief);
  const primaryCue =
    documentBrief.actionCue ??
    documentBrief.timingCue ??
    documentBrief.extractedPoints[0] ??
    documentBrief.summary;
  const supportingCue =
    documentBrief.actionCue && documentBrief.timingCue
      ? `Timing window: ${truncateForCard(documentBrief.timingCue, 96)}`
      : documentBrief.actionCue
        ? "Beacon elevated the document order into the mission header instead of burying it inside notes."
        : documentBrief.timingCue
          ? "Beacon elevated the timing window so schedule-sensitive moves stay visible."
          : "Beacon surfaced the strongest retrieved cue from the document for faster review.";

  return [
    {
      id: "source",
      label: "Retrieved source",
      toneClass: "tone-retrieved",
      toneLabel: documentSourceDescriptor ? "named source" : "retrieved lane",
      headline: truncateForCard(documentSourceDescriptor?.headline ?? documentBrief.headline, 96),
      detail: documentSourceDescriptor
        ? `${documentSourceDescriptor.sentence} Beacon keeps it in the retrieved-guidance lane instead of upgrading it into an official fact.`
        : "Beacon detected source context in the attached document and kept it separate from official facts.",
    },
    {
      id: "cue",
      label: "Operational cue",
      toneClass: "tone-retrieved",
      toneLabel: documentBrief.actionCue ? "action cue" : documentBrief.timingCue ? "timing cue" : "source cue",
      headline: truncateForCard(primaryCue, 96),
      detail: supportingCue,
    },
    {
      id: "adjustment",
      label: "Planner change",
      toneClass: "tone-generated",
      toneLabel: "adaptation",
      headline: truncateForCard(
        documentBrief.planningAdjustments[0] ?? "Beacon adapted the mission around the retrieved source.",
        96,
      ),
      detail:
        documentBrief.planningAdjustments[1] ??
        "This is the first visible planning change Beacon made because of the attached source.",
    },
    {
      id: "check",
      label: "Check before acting",
      toneClass: "status-confirm",
      toneLabel: "confirm",
      headline: truncateForCard(
        documentBrief.recommendedChecks[0] ?? "Verify the latest bulletin before acting on the document cue.",
        96,
      ),
      detail:
        documentBrief.recommendedChecks[1] ??
        "Keep this confirmation step open before treating the document wording as a live instruction.",
    },
  ];
}

function buildDocumentImpactArtifactTarget(
  documentBrief: DocumentBrief,
): DocumentImpactArtifactTarget {
  const documentSourceFacts = getDocumentSourceFacts(documentBrief);
  const primaryCue = documentBrief.actionCue ?? documentBrief.timingCue;

  if (primaryCue) {
    return {
      target: "voice",
      sourceType: "retrieved",
      headline: "Source-aware voice handoff",
      detail: documentBrief.actionCue
        ? `Opens the spoken brief that now leads with the retrieved order: ${truncateForCard(
            documentBrief.actionCue,
            92,
          )}`
        : `Opens the spoken brief that now leads with the retrieved timing cue: ${truncateForCard(
            documentBrief.timingCue ?? primaryCue,
            92,
          )}`,
      actionLabel: "Open voice handoff",
      toneClass: "tone-retrieved",
      toneLabel: "source-aware",
    };
  }

  return {
    target: "action-card",
    sourceType: "retrieved",
    headline: "Portable action card",
    detail:
      documentSourceFacts.length > 0
        ? `Opens the export card that now carries ${documentSourceFacts
            .map((fact) => fact.label.toLowerCase())
            .join(" + ")} before the checklist.`
        : "Opens the export card that now carries the strongest retrieved source cue into a judge-friendly artifact.",
    actionLabel: "Open action card",
    toneClass: "status-ready",
    toneLabel: "exportable",
  };
}

function buildSourceLedger(result: ActionBundle): SourceLedgerLane[] {
  return [
    {
      sourceType: "official",
      title: "Official facts",
      lead: "Triggers and location anchors",
      items: result.sources.officialFacts,
    },
    {
      sourceType: "retrieved",
      title: "Retrieved guidance",
      lead: "Bulletins, playbooks, and pasted cues",
      items: result.sources.retrievedGuidance,
    },
    {
      sourceType: "generated",
      title: "Generated recommendations",
      lead: "Role and access adaptation",
      items: result.sources.generatedNotes,
    },
  ];
}

function getRetrievedGuidanceTrustSignal(result: ActionBundle) {
  return (
    result.trustSnapshot.items.find(
      (item) =>
        item.sourceType === "retrieved" &&
        (item.title === "Retrieved guidance lane" || item.title === "Guidance pack"),
    ) ??
    result.trustSnapshot.items.find((item) => item.sourceType === "retrieved") ??
    null
  );
}

function isPlanImpactSource(item: SourceEntry) {
  return Boolean(item.usedFor || item.evidence || item.effectiveWindow);
}

function getPlanImpactArtifactTargets(item: SourceEntry): ShareArtifactTarget[] {
  const targets: ShareArtifactTarget[] = [];

  if (item.evidence) {
    targets.push("voice", "flow");
  }

  if (item.usedFor) {
    targets.push("action-card", "flow");
  }

  if (item.effectiveWindow) {
    targets.push("action-card", "voice", "flow");
  }

  return [...new Set(targets)];
}

function buildAuthorityStrip(result: ActionBundle): AuthorityStripItem[] {
  const firstDestination = result.evacuation.destinations[0];
  const moveTrigger =
    result.trustSnapshot.items.find((item) => item.title === "Move trigger")?.detail ??
    result.evacuation.decision;
  const officialTriggerSignal =
    result.trustSnapshot.items.find((item) => item.title === "Move trigger") ?? null;
  const guidancePackSignal = getRetrievedGuidanceTrustSignal(result);
  const generatedSupportSignal =
    result.trustSnapshot.items.find((item) => item.sourceType === "generated") ?? null;
  const documentBrief = result.documentBrief;
  const documentSourceDescriptor = getDocumentSourceDescriptor(documentBrief);
  const retrievedSourceTiming = getRetrievedSourceTiming(result);
  const retrievedTimingOverrideReason = getRetrievedSourceTimingOverrideReason(result);
  const evidenceSpotlight = buildEvidenceSpotlight(result);

  return [
    {
      id: "official",
      label: "Authority 01",
      toneClass: getSignalToneClass(officialTriggerSignal?.status ?? "confirm"),
      toneLabel: "official trigger",
      headline: truncateForCard(moveTrigger, 108),
      detail:
        "This is the movement threshold to confirm with agency alerts or direct on-ground conditions before treating the run as move-ready.",
      meta: `${result.sources.officialFacts.length} official fact${
        result.sources.officialFacts.length === 1 ? "" : "s"
      } attached`,
    },
    {
      id: "retrieved",
      label: "Authority 02",
      toneClass: getSignalToneClass(guidancePackSignal?.status ?? "advisory"),
      toneLabel: documentBrief?.actionCue ? "document order" : documentBrief?.timingCue ? "timing cue" : "retrieved lane",
      headline: truncateForCard(
        documentBrief?.actionCue ??
          documentBrief?.timingCue ??
          documentBrief?.planningAdjustments[0] ??
          guidancePackSignal?.detail ??
          evidenceSpotlight?.summary ??
          "Attach guidance or document context to sharpen the run.",
        108,
      ),
      detail: documentBrief?.actionCue
        ? documentBrief.timingCue
          ? `Timing window: ${truncateForCard(
              documentBrief.timingCue,
              112,
            )} Verify both the order and the schedule against the latest bulletin before acting.`
          : `${documentSourceDescriptor ? `${documentSourceDescriptor.sentence} ` : ""}Beacon surfaced the document's movement or closure instruction separately so operating orders do not disappear inside general guidance.`
        : documentBrief?.timingCue
          ? `${documentSourceDescriptor ? `${documentSourceDescriptor.sentence} ` : ""}Beacon surfaced the document timing window separately so schedule-sensitive runs do not bury the operating deadline.`
        : documentBrief
          ? `${documentSourceDescriptor ? `${documentSourceDescriptor.sentence} ` : ""}Retrieved guidance is shaping this run. Verify next: ${
              documentBrief.recommendedChecks[0] ?? documentBrief.summary
            }`
          : guidancePackSignal?.detail ??
            "This lane stays available for bulletins, playbooks, and OCR extracts without upgrading them into verified facts.",
      meta: [
        `${result.sources.retrievedGuidance.length} retrieved source${
          result.sources.retrievedGuidance.length === 1 ? "" : "s"
        }${documentBrief?.actionCue ? " plus a document order cue" : " shaping this mission"}`,
        documentSourceDescriptor
          ? `${documentSourceDescriptor.label}: ${documentSourceDescriptor.headline}`
          : null,
        retrievedSourceTiming ? `Source timing: ${retrievedSourceTiming}` : null,
        retrievedTimingOverrideReason ? `Timing override note: ${retrievedTimingOverrideReason}` : null,
      ]
        .filter(Boolean)
        .join(" | "),
    },
    {
      id: "generated",
      label: "Authority 03",
      toneClass: getSignalToneClass(generatedSupportSignal?.status ?? "advisory"),
      toneLabel: "generated support",
      headline: truncateForCard(
        generatedSupportSignal?.detail ??
          "Beacon adapts the mission to the role, mobility, medication, and connectivity notes you entered.",
        108,
      ),
      detail:
        "Use this layer for preparation, packing, and communication tailoring after the official trigger and retrieved guidance are clear.",
      meta: `${result.sources.generatedNotes.length} generated note${
        result.sources.generatedNotes.length === 1 ? "" : "s"
      } for group-specific adaptation`,
    },
    {
      id: "route",
      label: "Authority 04",
      toneClass: "status-ready",
      toneLabel: "first move",
      headline: firstDestination
        ? `${firstDestination.name} • ${firstDestination.etaMinutes} min est.`
        : truncateForCard(result.evacuation.decision, 108),
      detail: firstDestination
        ? `Once the trigger is confirmed, Beacon sends the group here first. ${firstDestination.reason}`
        : result.evacuation.routeContext,
      meta: firstDestination
        ? `${firstDestination.distanceKm.toFixed(1)} km from the geocoded area`
        : "Route context attached",
    },
  ];
}

function buildJudgeDemoBrief(
  result: ActionBundle,
  form: IntakeForm,
  judgeDemoPath: ReadonlyArray<JudgeDemoCue>,
  trainingOutcome: TrainingOutcome | null,
) {
  const firstDestination = result.evacuation.destinations[0];
  const hazardRoute = getHazardRouteLexicon(
    formatHazardLabel(form.hazard),
    firstDestination?.name ?? "the first safe destination",
  );
  const sourceCounts = [
    `${result.sources.officialFacts.length} official`,
    `${result.sources.retrievedGuidance.length} retrieved`,
    `${result.sources.generatedNotes.length} generated`,
  ].join(" / ");
  const masteryLine = trainingOutcome
    ? `${trainingOutcome.mastery}% mastery, ${trainingOutcome.quizCorrectCount}/${trainingOutcome.quizTotal} quiz checks, ${trainingOutcome.bestDecisionCount}/${trainingOutcome.totalDecisionCount} best decisions`
    : "Prime the path to lock best decisions and quiz checks before presenting.";

  return [
    "# Fireline Commander 3-minute judge demo path",
    "",
    `Scenario: ${form.role} ${formatHazardLabel(form.hazard)} drill in ${form.location}`,
    `Mission: ${result.actionCardTitle}`,
    `First destination: ${firstDestination ? `${firstDestination.name} (${firstDestination.etaMinutes} min)` : "choose safest reachable assembly point"}`,
    `Route rule: ${hazardRoute.bestRoutePhrase}`,
    `Trust split: ${sourceCounts}`,
    `Training score: ${masteryLine}`,
    "",
    "## Run of show",
    "",
    ...judgeDemoPath.flatMap((cue) => [
      `### ${cue.timecode} ${cue.label}`,
      "",
      `- Operator move: ${cue.actionLabel}`,
      `- What judges see: ${cue.detail}`,
      `- Proof: ${cue.proof}`,
      "",
    ]),
    "## Closing line",
    "",
    `Fireline Commander is not asking people to read a disaster dashboard. It lets a trainee operate through a ${formatHazardLabel(
      form.hazard,
    ).toLowerCase()} ${form.role} route drill, see the consequences of each choice, prove which sources shaped the plan, answer decision-pause quizzes, and leave with voice, action-card, flow, and runbook outputs.`,
  ].join("\n");
}

function buildMarkdownRunbook(
  result: ActionBundle,
  shareBrief: string,
  form: IntakeForm,
  voiceArtifact: VoiceArtifact,
  riskSourceExportBrief: string,
  judgeDemoBrief: string,
) {
  const generatedAt = new Date().toLocaleString();
  const evidenceSpotlight = buildEvidenceSpotlight(result);
  const authorityStrip = buildAuthorityStrip(result);
  const portableActionCard = buildPortableActionCard(result);
  const documentSourceFacts = getDocumentSourceFacts(result.documentBrief);
  const firstDestination = result.evacuation.destinations[0];
  const hazardRoute = getHazardRouteLexicon(
    formatHazardLabel(form.hazard),
    firstDestination?.name ?? "the first safe destination",
  );
  const scenarioSnapshotCards = buildScenarioSnapshotCards(
    form,
    result,
    formatHazardLabel(form.hazard),
  );
  const flowArtifact = buildPortableFlowArtifact(result);
  const sections = [
    `# ${result.actionCardTitle.replace("action card", "mission")}`,
    "",
    `Generated by: ${result.engineLabel}`,
    `Scenario: ${form.hazard} in ${form.location}`,
    `Role: ${form.role}`,
    `Language mode: ${result.voiceBriefing.language}`,
    `Generated at: ${generatedAt}`,
    "",
    "## Scenario snapshot",
    "",
    ...scenarioSnapshotCards.flatMap((item) => [
      `### ${item.label}`,
      "",
      `- Focus: ${item.headline}`,
      `- Detail: ${item.detail}`,
      "",
    ]),
    "## Share brief",
    "",
    ...shareBrief.split("\n"),
    "",
    ...(judgeDemoBrief
      ? [
          "## 3-minute judge demo path",
          "",
          ...judgeDemoBrief.split("\n"),
          "",
        ]
      : []),
    "## Portable action card",
    "",
    ...portableActionCard.markdown.split("\n"),
    "",
    "## Drill route cues",
    "",
    `- Hazard cue: ${hazardRoute.openingBeat}`,
    `- Best route phrase: ${hazardRoute.bestRoutePhrase}`,
    `- Avoid: ${hazardRoute.riskyRoutePhrase}`,
    `- Consequence if correct: ${hazardRoute.consequenceStrong}`,
    `- Consequence if risky: ${hazardRoute.consequenceRisk}`,
    "",
    "## Authority order",
    "",
    ...authorityStrip.flatMap((item) => [
      `### ${item.label}`,
      "",
      `- Tone: ${item.toneLabel}`,
      `- Focus: ${item.headline}`,
      `- Why it matters: ${item.detail}`,
      `- Meta: ${item.meta}`,
      "",
    ]),
    "## Planning posture",
    "",
    `- Mode: ${result.planningPosture.headline}`,
    `- Primary source type: ${result.planningPosture.primarySourceType}`,
    `- Reason: ${result.planningPosture.reason}`,
    "",
    "## Why this plan is grounded",
    "",
    ...result.planningBasis.flatMap((entry) => [
      `### ${entry.section}`,
      "",
      `- Confidence: ${formatConfidenceLabel(entry.confidenceLabel)}`,
      `- Source types: ${entry.sourceTypes.map(formatSourceTypeLabel).join(", ")}`,
      `- Basis: ${entry.basis}`,
      "",
    ]),
    ...(evidenceSpotlight
      ? [
          "## Evidence spotlight",
          "",
          `- Source type: ${evidenceSpotlight.label}`,
          `- Title: ${evidenceSpotlight.title}`,
          `- Why it matters: ${evidenceSpotlight.summary}`,
          ...(evidenceSpotlight.evidence ? [`- Cue: ${evidenceSpotlight.evidence}`] : []),
          "",
        ]
      : []),
    ...(result.documentBrief
      ? [
          "## Document cues",
          "",
          `- Summary: ${result.documentBrief.summary}`,
          ...documentSourceFacts.map((fact) => `- ${fact.label}: ${fact.headline}`),
          ...(result.documentBrief.actionCue ? [`- Action or closure cue: ${result.documentBrief.actionCue}`] : []),
          ...(result.documentBrief.timingCue ? [`- Timing cue: ${result.documentBrief.timingCue}`, ""] : []),
          "",
          "### Extracted cues",
          "",
          ...result.documentBrief.extractedPoints.map((item) => `- ${item}`),
          "",
          "### How Beacon used it",
          "",
          ...result.documentBrief.planningAdjustments.map((item) => `- ${item}`),
          "",
          "### Check before acting",
          "",
          ...result.documentBrief.recommendedChecks.map((item) => `- ${item}`),
          "",
        ]
      : []),
    "",
    "## Immediate actions",
    "",
    ...result.immediateActions.map((item, index) => `${index + 1}. ${item}`),
    "",
    "## Evacuation and route context",
    "",
    `- Decision: ${result.evacuation.decision}`,
    `- Route context: ${result.evacuation.routeContext}`,
    "",
    "### Suggested destinations",
    "",
    ...result.evacuation.destinations.map(
      (destination) =>
        `- ${destination.name} (${destination.distanceKm.toFixed(1)} km, ${destination.etaMinutes} min est): ${destination.reason}`,
    ),
    "",
    "## Go-bag checklist",
    "",
    ...result.goBag.map((item) => `- ${item}`),
    "",
    "## Special instructions",
    "",
    ...result.specialInstructions.flatMap((section) => [
      `### ${section.title}`,
      "",
      ...section.items.map((item) => `- ${item}`),
      "",
    ]),
    "## Voice briefing",
    "",
    `Mode: ${voiceArtifact.modeLabel}`,
    "",
    ...voiceArtifact.segments.map(
      (segment) => `- ${segment.label} (${formatSourceTypeLabel(segment.sourceType)}): ${segment.text}`,
    ),
    "",
    voiceArtifact.script,
    "",
    "## Portable flow view",
    "",
    ...flowArtifact.body.split("\n"),
    "",
    "## Verify next",
    "",
    ...result.verification.map((item) => `- ${item}`),
    "",
    "## Source panel",
    "",
    ...buildSourceSection("Official facts", result.sources.officialFacts),
    ...buildSourceSection("Retrieved guidance", result.sources.retrievedGuidance),
    ...buildSourceSection("Generated notes", result.sources.generatedNotes),
    ...(riskSourceExportBrief
      ? [
          "## Source timing risk export",
          "",
          "This block was auto-appended from Source Ledger risk export mode.",
          "",
          ...riskSourceExportBrief.split("\n"),
          "",
        ]
      : []),
  ];

  return sections.join("\n");
}

function buildSourceSection(title: string, items: ActionBundle["sources"]["officialFacts"]) {
  return [
    `### ${title}`,
    "",
    ...items.flatMap((item) => {
      const lines = [`- ${item.title}: ${item.summary}${item.url ? ` (${item.url})` : ""}`];

      if (item.usedFor) {
        lines.push(`  - Used in plan: ${item.usedFor}`);
      }

      if (item.evidence) {
        lines.push(`  - Evidence cue: ${item.evidence}`);
      }

      if (item.effectiveWindow) {
        const freshness = getSourceTimingFreshness(item.effectiveWindow, {
          override: item.timingFreshnessOverride,
        });

        lines.push(`  - Source timing: ${item.effectiveWindow}`);
        if (freshness) {
          lines.push(`  - Timing freshness: ${freshness.detail}`);
        }
        if (item.timingFreshnessOverrideReason) {
          lines.push(`  - Timing override note: ${item.timingFreshnessOverrideReason}`);
        }
      }

      return lines;
    }),
    "",
  ];
}

function getRetrievedSourceTiming(result: ActionBundle) {
  const sourceTiming = result.sources.retrievedGuidance
    .map((item) => item.effectiveWindow?.trim())
    .find((item): item is string => Boolean(item));

  if (sourceTiming) {
    return sourceTiming;
  }

  const documentTimingCue = result.documentBrief?.timingCue?.trim();
  return documentTimingCue || null;
}

function getRetrievedDocumentSourceLabel(result: ActionBundle): string | null {
  const labeledSourceTitle = result.sources.retrievedGuidance
    .map((item) => item.title.trim())
    .find((title) => /^Document extract \((.+)\)$/.test(title));

  if (!labeledSourceTitle) {
    return null;
  }

  const labelMatch = labeledSourceTitle.match(/^Document extract \((.+)\)$/);
  return labelMatch?.[1]?.trim() || null;
}

function buildPortableActionSourceProvenanceStatus(result: ActionBundle): {
  uiLabel: string;
  exportLine: string;
  toneClass: "status-ready" | "status-confirm" | "status-advisory";
  toneLabel: string;
} {
  const sourceLabel = getRetrievedDocumentSourceLabel(result);

  if (sourceLabel) {
    const hasTraceableSourceLabel = isTraceableSourceLabel(sourceLabel);
    if (!hasTraceableSourceLabel) {
      return {
        uiLabel: `${sourceLabel} (replace with issuing source)`,
        exportLine:
          `Source label ${sourceLabel} is placeholder. Replace it with the issuing office or sender before export.`,
        toneClass: "status-confirm",
        toneLabel: "needs verify",
      };
    }

    const hasAuthorityTaggedSourceLabel = isAuthorityTaggedSourceLabel(sourceLabel);
    if (!hasAuthorityTaggedSourceLabel) {
      return {
        uiLabel: `${sourceLabel} (add issuing authority keyword)`,
        exportLine:
          `Source label ${sourceLabel} is captured, but it still needs an issuing authority keyword before export.`,
        toneClass: "status-confirm",
        toneLabel: "needs verify",
      };
    }

    return {
      uiLabel: `Verified source: ${sourceLabel}`,
      exportLine:
        `Source label ${sourceLabel} includes an issuing authority keyword and is ready for export traceability.`,
      toneClass: "status-ready",
      toneLabel: "verified",
    };
  }

  if (result.documentBrief) {
    return {
      uiLabel: "Source label missing",
      exportLine:
        "Retrieved document cues are attached, but no source label is captured yet. Add the issuing office or sender before export.",
      toneClass: "status-confirm",
      toneLabel: "missing",
    };
  }

  return {
    uiLabel: "Guidance pack only",
    exportLine:
      "This run is using built-in guidance sources only, so no pasted document source label is attached.",
    toneClass: "status-advisory",
    toneLabel: "guidance pack",
  };
}

function getRetrievedSourceTimingOverride(result: ActionBundle): SourceTimingFreshnessOverride | null {
  const sourceOverride = result.sources.retrievedGuidance.find(
    (item) => item.effectiveWindow?.trim() && item.timingFreshnessOverride,
  )?.timingFreshnessOverride;

  return sourceOverride ?? null;
}

function getRetrievedSourceTimingOverrideReason(result: ActionBundle): string | null {
  const sourceOverrideReason = result.sources.retrievedGuidance.find(
    (item) => item.effectiveWindow?.trim() && item.timingFreshnessOverrideReason?.trim(),
  )?.timingFreshnessOverrideReason;

  return sourceOverrideReason?.trim() || null;
}

function getSourceTimingFreshness(
  effectiveWindow: string | null | undefined,
  options: SourceTimingFreshnessOptions = {},
): SourceTimingFreshness | null {
  const { now = new Date(), override } = options;
  const normalized = effectiveWindow?.trim();
  if (!normalized) {
    return null;
  }

  if (override) {
    return buildManualSourceTimingFreshness(override);
  }

  const normalizedLower = normalized.toLowerCase();
  if (/(until\s+further\s+notice|ongoing|continuous)/i.test(normalizedLower)) {
    return {
      status: "active",
      label: "timing active",
      detail: "Open-ended window (until further notice).",
      toneClass: "status-ready",
    };
  }

  const endTime = parseSourceTimingEnd(normalized, now);
  if (!endTime) {
    return {
      status: "unknown",
      label: "timing unknown",
      detail: "No clear end time parsed from this source window.",
      toneClass: "status-advisory",
    };
  }

  const isStale = endTime.getTime() < now.getTime();
  const endLabel = formatTimingMoment(endTime);

  if (isStale) {
    return {
      status: "stale",
      label: "timing stale",
      detail: `Window ended ${endLabel}.`,
      toneClass: "status-confirm",
    };
  }

  return {
    status: "active",
    label: "timing active",
    detail: `Window active through ${endLabel}.`,
    toneClass: "status-ready",
  };
}

function buildManualSourceTimingFreshness(
  override: SourceTimingFreshnessOverride,
): SourceTimingFreshness {
  switch (override) {
    case "active":
      return {
        status: "active",
        label: "timing active (manual)",
        detail: "Manually marked active for this run.",
        toneClass: "status-ready",
      };
    case "stale":
      return {
        status: "stale",
        label: "timing stale (manual)",
        detail: "Manually marked stale for this run.",
        toneClass: "status-confirm",
      };
    case "unknown":
      return {
        status: "unknown",
        label: "timing unknown (manual)",
        detail: "Manually marked unknown for this run.",
        toneClass: "status-advisory",
      };
  }
}

function parseSourceTimingEnd(value: string, now: Date) {
  const explicitEndMatch = value.match(
    /(?:until|through|thru|to|ending|ends|expires?|valid\s+(?:until|through|to)|window\s+ends?)\s+(.+)$/i,
  );
  const prioritizedText = explicitEndMatch?.[1] ?? value;

  const endDate = extractLatestDateCandidate(prioritizedText, now) ?? extractLatestDateCandidate(value, now);
  if (!endDate) {
    return null;
  }

  const rangeMatch = value.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
  );
  if (rangeMatch?.[2]) {
    const endClock = parseClockCandidate(rangeMatch[2]);
    if (endClock) {
      return applyClockToDate(endDate, endClock.hours, endClock.minutes);
    }
  }

  const explicitClock = extractLatestClockCandidate(prioritizedText);
  if (explicitClock) {
    const clock = parseClockCandidate(explicitClock);
    if (clock) {
      return applyClockToDate(endDate, clock.hours, clock.minutes);
    }
  }

  return applyClockToDate(endDate, 23, 59);
}

function extractLatestDateCandidate(value: string, now: Date) {
  const matches = value.match(
    /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*(?:\s+\d{4})?|today|tomorrow|tonight)\b/gi,
  );

  if (!matches?.length) {
    return null;
  }

  const candidates = matches
    .map((token) => parseDateCandidate(token, now))
    .filter((candidate): candidate is Date => Boolean(candidate));

  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[candidates.length - 1];
}

function extractLatestClockCandidate(value: string) {
  const matches = value.match(/\b(?:\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))\b/gi);
  if (!matches?.length) {
    return null;
  }

  return matches[matches.length - 1];
}

function parseDateCandidate(token: string, now: Date) {
  const normalized = token.trim().toLowerCase();
  if (normalized === "today" || normalized === "tonight") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  if (normalized === "tomorrow") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  }

  const isoMatch = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      return new Date(year, month - 1, day);
    }
  }

  const parsed = Date.parse(token);
  if (Number.isNaN(parsed)) {
    return null;
  }

  const date = new Date(parsed);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseClockCandidate(token: string) {
  const match = token.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const meridiem = match[3];

  if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return null;
    }

    if (hours === 12) {
      hours = 0;
    }

    if (meridiem === "pm") {
      hours += 12;
    }
  } else if (hours > 23) {
    return null;
  }

  return { hours, minutes };
}

function applyClockToDate(date: Date, hours: number, minutes: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
}

function formatTimingMoment(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function buildScenarioSnapshotCards(
  form: IntakeForm,
  result: ActionBundle,
  hazardLabel: string,
): ScenarioSnapshotCard[] {
  const roleLabel = formatRoleLabel(form.role);
  const peopleSummary = buildPeopleSummary(form);
  const constraintSummary = buildConstraintSummary(form);
  const sourceSummary = [
    `${result.sources.officialFacts.length} official`,
    `${result.sources.retrievedGuidance.length} retrieved`,
    `${result.sources.generatedNotes.length} generated`,
  ].join(" • ");
  const documentBrief = result.documentBrief;
  const documentSourceDescriptor = getDocumentSourceDescriptor(documentBrief);
  const documentSourceName = form.documentSourceName.trim();
  const hasTraceableDocumentSourceName = isTraceableSourceLabel(documentSourceName);
  const hasAuthorityTaggedDocumentSourceName = isAuthorityTaggedSourceLabel(documentSourceName);
  const sourceLabelLead = hasTraceableDocumentSourceName && hasAuthorityTaggedDocumentSourceName
    ? `Source ${documentSourceName}. `
    : hasTraceableDocumentSourceName
      ? `Source label ${documentSourceName} is missing an issuing authority keyword; refine before export. `
    : documentSourceName
      ? `Source label is placeholder (${documentSourceName}); verify the issuing source. `
      : "";
  const documentEffectiveTime = form.documentEffectiveTime.trim();
  const documentTimingOverrideReason = form.documentTimingOverrideReason.trim();
  const retrievedSourceTiming = getRetrievedSourceTiming(result);
  const retrievedTimingOverride = getRetrievedSourceTimingOverride(result);
  const retrievedTimingFreshness = getSourceTimingFreshness(retrievedSourceTiming, {
    override: retrievedTimingOverride,
  });
  const sourceTimingOverrideNote =
    form.documentTimingOverride !== "auto" && documentTimingOverrideReason
      ? `Timing override note: ${documentTimingOverrideReason}.`
      : "";
  const sourceTimingFreshnessLead = retrievedTimingFreshness
    ? `Retrieved timing freshness: ${retrievedTimingFreshness.detail} `
    : retrievedSourceTiming
      ? "Retrieved timing is attached, but freshness could not be parsed automatically. "
      : "";
  const sourceTimingLead = documentEffectiveTime
    ? `Source timing ${documentEffectiveTime}. `
    : "";
  const sourceDetail = documentBrief?.actionCue
    ? `${sourceLabelLead}${sourceTimingLead}Document order attached: ${truncateForCard(documentBrief.actionCue, 110)}`
    : documentBrief?.timingCue
      ? `${sourceLabelLead}${sourceTimingLead}Document timing cue attached: ${truncateForCard(documentBrief.timingCue, 110)}`
      : documentSourceDescriptor
        ? `${sourceLabelLead}${sourceTimingLead}${documentSourceDescriptor.label}: ${truncateForCard(documentSourceDescriptor.headline, 110)}`
        : hasTraceableDocumentSourceName && hasAuthorityTaggedDocumentSourceName
          ? `Source ${documentSourceName} is attached in the retrieved lane${documentEffectiveTime ? ` with timing ${documentEffectiveTime}` : ""} and will stay separate from verified official facts.`
          : hasTraceableDocumentSourceName
            ? `Retrieved guidance is attached, but the source label (${documentSourceName}) still needs an issuing authority keyword${documentEffectiveTime ? ` while keeping timing ${documentEffectiveTime}` : ""}.`
          : documentSourceName
            ? `Retrieved guidance is attached, but the source label is still placeholder (${documentSourceName}). Replace it with the issuing source${documentEffectiveTime ? ` and keep timing ${documentEffectiveTime}` : ""}.`
          : "No pasted document is shaping this run, so the retrieved lane is coming from the built-in guidance pack.";

  return [
    {
      id: "scenario",
      label: "Scenario",
      toneClass: "tone-official",
      toneLabel: "active run",
      headline: `${hazardLabel} in ${form.location.trim() || "your area"}`,
      detail: `${roleLabel} mission in ${result.voiceBriefing.language} with ${result.planningPosture.headline.toLowerCase()} posture.`,
    },
    {
      id: "people",
      label: "People",
      toneClass: "status-ready",
      toneLabel: "group",
      headline: peopleSummary.headline,
      detail: peopleSummary.detail,
    },
    {
      id: "constraints",
      label: "Constraints",
      toneClass: constraintSummary.toneClass,
      toneLabel: constraintSummary.toneLabel,
      headline: constraintSummary.headline,
      detail: constraintSummary.detail,
    },
    {
      id: "sources",
      label: "Source intake",
      toneClass: retrievedTimingFreshness?.toneClass ?? "tone-retrieved",
      toneLabel: retrievedTimingFreshness?.label ?? "traceable",
      headline: sourceSummary,
      detail: sourceTimingOverrideNote
        ? `${sourceTimingFreshnessLead}${sourceDetail} ${sourceTimingOverrideNote}`
        : `${sourceTimingFreshnessLead}${sourceDetail}`,
    },
  ];
}

function scoreDecisionImpact(decision: IncidentStoryDecision) {
  return decision.impact.safety + decision.impact.speed + decision.impact.trust;
}

function getDecisionHierarchyCue(
  scene: IncidentStoryScene,
  decision: IncidentStoryDecision,
): DecisionHierarchyCue {
  const bestDecision = scene.decisions.reduce((best, candidate) =>
    scoreDecisionImpact(candidate) > scoreDecisionImpact(best) ? candidate : best,
  );

  if (decision.id === bestDecision.id) {
    return {
      label: "Safest choice",
      toneClass: "decisionCue-best",
      detail: "Keeps people moving, counted, and away from the hazard.",
    };
  }

  if (decision.impact.safety < 60) {
    return {
      label: "High risk",
      toneClass: "decisionCue-risk",
      detail: "A person, route, or responder lane is put in danger.",
    };
  }

  if (decision.impact.trust < 60) {
    return {
      label: "Unverified",
      toneClass: "decisionCue-trust",
      detail: "People may follow the wrong instruction.",
    };
  }

  if (decision.impact.speed < 55) {
    return {
      label: "Too slow",
      toneClass: "decisionCue-delay",
      detail: "The safe route can close while everyone waits.",
    };
  }

  return {
    label: "Partial",
    toneClass: "decisionCue-tradeoff",
    detail: "Helps one part of the problem while leaving another exposed.",
  };
}

function buildScenarioVoiceScript({
  stepLabel,
  hazard,
  location,
  role,
  scene,
  drill,
  decision,
  routeRule,
  beatCaption,
}: {
  stepLabel: string;
  hazard: IntakeForm["hazard"];
  location: string;
  role: IntakeForm["role"];
  scene: IncidentStoryScene;
  drill: FirstPersonDrillScene;
  decision: IncidentStoryDecision;
  routeRule: string;
  beatCaption: string;
}) {
  const routeProfile = getHazardRouteLexicon(scene.hazardLabel, drill.routeCue.route);
  const roleLabel =
    role === "school" ? "school safety lead" : role === "clinic" ? "clinic floor lead" : "household lead";
  const sourceCue = scene.overlays.find((overlay) => overlay.id === "retrieved")?.detail ?? drill.routeCue.route;

  return [
    `Training audio for Fireline Commander. ${stepLabel} beat, ${formatHazardLabel(hazard)} scenario in ${location || scene.location}.`,
    routeProfile.voiceTexture,
    `You are the ${roleLabel}. ${beatCaption}`,
    `Command: ${decision.label}.`,
    `Route: ${drill.routeCue.route}. Avoid: ${drill.routeCue.avoid}.`,
    `Rule phrase: ${routeRule}.`,
    `Scene cue to check: ${sourceCue}`,
    routeProfile.voiceClose,
  ].join(" ");
}

function buildTrainingOutcome(
  result: ActionBundle,
  form: IntakeForm,
  steps: Array<{ id: string }>,
  selectedDecisionByStep: Record<string, string>,
  selectedQuizAnswerByStep: Record<string, string>,
): TrainingOutcome {
  const selectedDecisions = steps
    .map((step, index) => {
      const scene = buildIncidentStoryScene(result, form, step.id, index);
      const selectedDecision =
        scene.decisions.find((decision) => decision.id === selectedDecisionByStep[step.id]) ??
        scene.decisions[0];
      const bestDecision = scene.decisions.reduce((best, decision) =>
        scoreDecisionImpact(decision) > scoreDecisionImpact(best) ? decision : best,
      );
      const selectedQuizAnswer = scene.quiz.answers.find(
        (answer) => answer.id === selectedQuizAnswerByStep[step.id],
      );

      return {
        selectedDecision,
        bestDecision,
        selectedQuizAnswer,
      };
    })
    .filter(
      (
        item,
      ): item is {
        selectedDecision: IncidentStoryDecision;
        bestDecision: IncidentStoryDecision;
        selectedQuizAnswer: IncidentStoryScene["quiz"]["answers"][number] | undefined;
      } => Boolean(item.selectedDecision),
    );

  const turnCount = Math.max(1, selectedDecisions.length);
  const safety = Math.round(
    selectedDecisions.reduce((sum, item) => sum + item.selectedDecision.impact.safety, 0) / turnCount,
  );
  const speed = Math.round(
    selectedDecisions.reduce((sum, item) => sum + item.selectedDecision.impact.speed, 0) / turnCount,
  );
  const trust = Math.round(
    selectedDecisions.reduce((sum, item) => sum + item.selectedDecision.impact.trust, 0) / turnCount,
  );
  const quizCorrectCount = selectedDecisions.filter((item) => item.selectedQuizAnswer?.correct).length;
  const bestDecisionCount = selectedDecisions.filter(
    (item) => item.selectedDecision.id === item.bestDecision.id,
  ).length;
  const riskyTurnCount = selectedDecisions.filter(
    (item) =>
      item.selectedDecision.impact.safety < 65 ||
      item.selectedDecision.impact.trust < 60,
  ).length;
  const quizMastery = Math.round((quizCorrectCount / turnCount) * 100);
  const decisionMastery = Math.round((bestDecisionCount / turnCount) * 100);
  const outcomeAverage = Math.round((safety + speed + trust) / 3);
  const mastery = Math.round(outcomeAverage * 0.7 + quizMastery * 0.2 + decisionMastery * 0.1);
  const pressure = Math.max(6, Math.min(94, 104 - outcomeAverage));
  const firstDestination = result.evacuation.destinations[0]?.name ?? "the first safe destination";
  const hazardRoute = getHazardRouteLexicon(formatHazardLabel(form.hazard), firstDestination);
  const label =
    mastery >= 86 && riskyTurnCount === 0
      ? "field-ready"
      : mastery >= 74
        ? "stable drill"
        : "needs coaching";
  const toneClass =
    mastery >= 86 && riskyTurnCount === 0
      ? "status-ready"
      : mastery >= 74
        ? "tone-retrieved"
        : "status-confirm";
  const detail =
    riskyTurnCount > 0
      ? `${riskyTurnCount} risky turn${riskyTurnCount === 1 ? "" : "s"} still visible; ${hazardRoute.riskLearningLine}`
      : quizCorrectCount === turnCount
        ? `${hazardRoute.debriefSuccess} Source proof and quiz checks are locked for the judge route.`
        : `${hazardRoute.debriefSuccess} Finish the embedded checks to prove learning.`;

  return {
    safety,
    speed,
    trust,
    mastery,
    pressure,
    quizCorrectCount,
    quizTotal: turnCount,
    bestDecisionCount,
    totalDecisionCount: turnCount,
    riskyTurnCount,
    label,
    toneClass,
    detail,
  };
}

function buildDebriefConsequenceBrief(
  result: ActionBundle,
  form: IntakeForm,
  decision: IncidentStoryDecision,
  trainingOutcome: TrainingOutcome,
): DebriefConsequenceBrief {
  const firstDestination = result.evacuation.destinations[0]?.name ?? "the first safe destination";
  const hazardLabel = formatHazardLabel(form.hazard);
  const hazardRoute = getHazardRouteLexicon(hazardLabel, firstDestination);
  const safeChoice =
    decision.impact.safety >= 75 &&
    decision.impact.speed >= 70 &&
    decision.impact.trust >= 70 &&
    trainingOutcome.riskyTurnCount === 0;
  const groupFocus = buildScenarioProtectedGroupLine(form);
  const headline = safeChoice
    ? `${hazardLabel}: route held`
    : `${hazardLabel}: risk still visible`;
  const detail = safeChoice
    ? `${groupFocus} followed the route cue and kept the main failure mode out of the handoff.`
    : `${groupFocus} still needs a cleaner next command before the handoff is field-ready.`;

  return {
    headline,
    detail,
    cards: [
      {
        label: "Hazard cue",
        value: truncateForCard(hazardRoute.openingBeat, 82),
        toneClass: "status-confirm",
      },
      {
        label: "Protected group",
        value: truncateForCard(groupFocus, 82),
        toneClass: "tone-retrieved",
      },
      {
        label: safeChoice ? "Held route" : "Failure risk",
        value: truncateForCard(
          safeChoice ? hazardRoute.debriefSuccess : hazardRoute.riskLearningLine,
          92,
        ),
        toneClass: safeChoice ? "status-ready" : "status-confirm",
      },
    ],
  };
}

function buildScenarioProtectedGroupLine(form: IntakeForm) {
  const peopleSummary = buildPeopleSummary(form).headline.toLowerCase();

  if (form.role === "school") {
    return `${peopleSummary} kept with classroom leads and assisted movers`;
  }

  if (form.role === "clinic") {
    return `${peopleSummary} triaged with patients, staff, and medicines`;
  }

  return `${peopleSummary} moved with household lead, care items, and check-in`;
}

function buildIncidentStoryScene(
  result: ActionBundle,
  form: IntakeForm,
  stepId: string,
  stepIndex: number,
): IncidentStoryScene {
  const hazardLabel = formatHazardLabel(form.hazard);
  const location = form.location.trim() || "the incident area";
  const firstDestination = result.evacuation.destinations[0];
  const destination = firstDestination?.name ?? "the safest reachable destination";
  const hazardRoute = getHazardRouteLexicon(hazardLabel, destination);
  const retrievedCue =
    result.documentBrief?.actionCue ??
    result.documentBrief?.timingCue ??
    result.sources.retrievedGuidance[0]?.evidence ??
    result.sources.retrievedGuidance[0]?.usedFor ??
    "Use the drill briefing to decide what must happen next.";
  const officialCue =
    result.trustSnapshot.items.find((item) => item.sourceType === "official")?.detail ??
    result.sources.officialFacts[0]?.summary ??
    "Official facts anchor the incident location and activation trigger.";
  const generatedCue =
    result.trustSnapshot.items.find((item) => item.sourceType === "generated")?.detail ??
    result.sources.generatedNotes[0]?.summary ??
    "Generated support adapts the response to the people, role, and constraints.";
  const mapToneClass = `incidentMap-${form.hazard}`;
  const commandLabel =
    form.role === "clinic" ? "Clinic lead" : form.role === "school" ? "School lead" : "Household lead";

  const baseZones: IncidentStoryScene["zones"] = [
    {
      id: "command",
      label: "Command",
      detail: commandLabel,
      toneClass: "tone-generated",
    },
    {
      id: "hazard",
      label: "Incident",
      detail: hazardRoute.hazardPressureLabel,
      toneClass: "status-confirm",
    },
    {
      id: "route",
      label: "Route",
      detail: firstDestination?.name ?? "Safer destination",
      toneClass: "tone-official",
    },
    {
      id: "source",
      label: "Briefing",
      detail: result.documentBrief ? "Attached order" : "Guidance pack",
      toneClass: "tone-retrieved",
    },
  ];
  const overlays: IncidentStoryScene["overlays"] = [
    {
      id: "official",
      label: "Alarm trigger",
      detail: truncateForCard(officialCue, 112),
      toneClass: "tone-official",
    },
    {
      id: "retrieved",
      label: result.documentBrief ? "Current order" : "Route briefing",
      detail: truncateForCard(retrievedCue, 112),
      toneClass: "tone-retrieved",
    },
    {
      id: "generated",
      label: "Role instruction",
      detail: truncateForCard(generatedCue, 112),
      toneClass: "tone-generated",
    },
  ];
  const destinationDecision = firstDestination
    ? hazardRoute.bestRoutePhrase
    : "Move toward the safest named destination";
  const sceneByStep: Record<
    string,
    Omit<IncidentStoryScene, "location" | "hazardLabel" | "mapToneClass" | "zones" | "overlays" | "quiz">
  > = {
    mission: {
      label: "Opening briefing",
      headline: `${hazardLabel} response at ${location}`,
      briefing: `${hazardRoute.openingBeat} Start with the route picture: ${hazardRoute.sceneNoun}.`,
      decisions: [
        {
          id: "stage-now",
          label: hazardRoute.firstProtectiveAction,
          detail: "Name the trigger, assign a lead, and put the group into ready posture.",
          consequence: "The group starts organized, so the next route decision happens before smoke blocks visibility.",
          impact: { safety: 88, speed: 82, trust: 78 },
        },
        {
          id: "wait-confirm",
          label: hazardRoute.riskyDelayPhrase,
          detail: "Looks simpler in the moment, but gives away the early route advantage.",
          consequence: "The alarm becomes background noise; students hesitate and the first clear route starts to crowd.",
          impact: { safety: 58, speed: 42, trust: 72 },
        },
      ],
    },
    ground: {
      label: "Scene read",
      headline: "Read the alarm, smoke, people, and exits",
      briefing:
        "Before moving, check where the hazard is coming from, who needs help, and which exits keep responder access clear.",
      decisions: [
        {
          id: "read-scene",
          label: "Read smoke, exit, people, and lane",
          detail: "Use the visible hazard, the exit route, and the people count before the first command.",
          consequence: "The teacher gives a short order that matches the scene instead of guessing from panic.",
          impact: { safety: 82, speed: 62, trust: 94 },
        },
        {
          id: "follow-crowd",
          label: "Follow the loudest group",
          detail: "It feels fast, but the group may move toward smoke or block the fire lane.",
          consequence: "The line bends toward the wrong side and the teacher has to stop movement to regain control.",
          impact: { safety: 62, speed: 78, trust: 46 },
        },
      ],
    },
    actions: {
      label: "Tactical choice",
      headline: "Choose the first action under pressure",
      briefing:
        "The walkthrough should feel like a decision drill: pick one action, see the impact, then advance.",
      decisions: [
        {
          id: "first-action",
          label: "Give one clear first action",
          detail: result.immediateActions[0] ?? "Run the highest-priority action first.",
          consequence: "The class hears one instruction, starts moving together, and avoids split-second confusion.",
          impact: { safety: 86, speed: 86, trust: 76 },
        },
        {
          id: "batch-actions",
          label: "Batch the checklist",
          detail: "Review everything before moving, but delay the first protective action.",
          consequence: "The drill becomes a lecture while smoke and crowd pressure keep changing the route.",
          impact: { safety: 64, speed: 48, trust: 70 },
        },
      ],
    },
    route: {
      label: "Movement decision",
      headline: "Pick the first safe direction",
      briefing:
        "The map makes evacuation feel spatial: destination, hazard front, and communication fallback stay visible together.",
      decisions: [
        {
          id: "move-destination",
          label: destinationDecision,
          detail: `${hazardRoute.bestRouteDetail} ${firstDestination?.reason ?? result.evacuation.routeContext}`,
          consequence: hazardRoute.consequenceStrong,
          impact: { safety: 90, speed: 76, trust: 82 },
        },
        {
          id: "hold-position",
          label: hazardRoute.riskyRoutePhrase,
          detail: hazardRoute.riskyRouteFeedback,
          consequence: hazardRoute.consequenceRisk,
          impact: { safety: 56, speed: 38, trust: 68 },
        },
      ],
    },
    people: {
      label: "Care decision",
      headline: "Protect the people who slow the timeline",
      briefing:
        "The response becomes more human when care constraints visibly change the tactical plan.",
      decisions: [
        {
          id: "buddy-system",
          label: "Assign buddies and count people",
          detail: "Pair vulnerable people with a lead and count the group before handoff.",
          consequence: "Nobody disappears from the line; the teacher can report exactly who reached assembly.",
          impact: { safety: 88, speed: 68, trust: 80 },
        },
        {
          id: "fastest-first",
          label: "Move fastest group first",
          detail: "Looks efficient, but can strand children, elders, pets, or medication needs.",
          consequence: "A slower or vulnerable person is left behind and the route team must split to recover them.",
          impact: { safety: 46, speed: 84, trust: 52 },
        },
      ],
    },
    share: {
      label: "Handoff decision",
      headline: "Finish with count, route, and all-clear",
      briefing:
        "The final move proves the class arrived, the lane stayed open, and nobody returns before the all-clear.",
      decisions: [
        {
          id: "share-pack",
          label: "Give headcount and route handoff",
          detail: "State the route used, who is present, who needs care, and what must stay blocked.",
          consequence: "The next adult can continue the drill without asking the class to repeat the whole story.",
          impact: { safety: 82, speed: 86, trust: 88 },
        },
        {
          id: "screen-only",
          label: "Assume everyone knows the ending",
          detail: "Skip the count and let people disperse as soon as they reach the destination.",
          consequence: "A missing student is discovered late because no one closed the loop at assembly.",
          impact: { safety: 54, speed: 58, trust: 64 },
        },
      ],
    },
  };
  const fallbackScene = sceneByStep.mission;
  const scene = sceneByStep[stepId] ?? {
    ...fallbackScene,
    label: `Briefing ${stepIndex + 1}`,
  };

  return {
    ...scene,
    decisions: buildLearnerDecisionOptions(scene.decisions, stepId, form.hazard, hazardRoute, destination),
    location,
    hazardLabel,
    mapToneClass,
    zones: baseZones,
    overlays,
    quiz: buildIncidentQuiz(stepId, result, hazardRoute),
  };
}

function buildLearnerDecisionOptions(
  baseDecisions: IncidentStoryDecision[],
  stepId: string,
  hazard: IntakeForm["hazard"],
  hazardRoute: ReturnType<typeof getHazardRouteLexicon>,
  destination: string,
): IncidentStoryDecision[] {
  const baseBest = baseDecisions.reduce((best, decision) =>
    scoreDecisionImpact(decision) > scoreDecisionImpact(best) ? decision : best,
  );
  const bestDecision: IncidentStoryDecision = {
    ...baseBest,
    consequence:
      baseBest.consequence ??
      (hazard === "fire"
        ? "People move away from smoke, the lane stays open, and the group remains countable."
        : "The group reaches the safer route while the leader keeps accountability."),
  };
  const routeRisk: IncidentStoryDecision =
    hazard === "fire"
      ? {
          id: `${stepId}-fire-lane-shortcut`,
          label: "Use the fire lane as a shortcut",
          detail: "It looks open, but it blocks firefighters and puts the class beside responder traffic.",
          consequence: "Fire response slows down and the class must reverse course while smoke pressure grows.",
          impact: { safety: 42, speed: 58, trust: 38 },
        }
      : {
          id: `${stepId}-shortcut`,
          label: hazardRoute.riskyRoutePhrase,
          detail: hazardRoute.riskyRouteFeedback,
          consequence: hazardRoute.consequenceRisk,
          impact: { safety: 50, speed: 54, trust: 48 },
        };
  const accountabilityRisk: IncidentStoryDecision = {
    id: `${stepId}-no-headcount`,
    label: hazard === "fire" ? "Move before headcount" : "Move without checking everyone",
    detail:
      hazard === "fire"
        ? "The line starts quickly, but nobody confirms students, buddies, or vulnerable people."
        : "The group moves before the lead confirms who needs help or where everyone is.",
    consequence:
      hazard === "fire"
        ? "One student is unaccounted for at assembly, forcing a risky search while the building is still unsafe."
        : "A vulnerable person is missed and the team loses time recovering the route.",
    impact: { safety: 50, speed: 70, trust: 44 },
  };
  const splitRisk: IncidentStoryDecision = {
    id: `${stepId}-split-group`,
    label: hazard === "fire" ? "Let students split for bags or toilet" : "Let people split from the route",
    detail:
      hazard === "fire"
        ? "Students leave the line for familiar rooms instead of staying with the teacher."
        : "People peel off to collect items or check another room.",
    consequence:
      hazard === "fire"
        ? "A student misses the teacher, gets lost near the corridor, and the class cannot close the drill safely."
        : "The leader loses visibility and the drill turns into a search instead of a safe movement.",
    impact: { safety: 34, speed: 36, trust: 32 },
  };
  const delayRisk: IncidentStoryDecision = {
    id: `${stepId}-wait-too-long`,
    label: "Wait for a second instruction",
    detail: `The group pauses near the hazard instead of moving toward ${destination}.`,
    consequence:
      hazard === "fire"
        ? "Smoke spreads through the corridor and the cleaner route becomes harder to use."
        : "The safe window narrows and the group loses the easiest path.",
    impact: { safety: 55, speed: 30, trust: 62 },
  };
  const optionsByStep: Record<string, IncidentStoryDecision[]> = {
    mission: [bestDecision, delayRisk, accountabilityRisk, splitRisk],
    ground: [bestDecision, routeRisk, delayRisk, splitRisk],
    actions: [bestDecision, delayRisk, splitRisk, accountabilityRisk],
    route: [bestDecision, routeRisk, accountabilityRisk, splitRisk],
    people: [bestDecision, accountabilityRisk, splitRisk, routeRisk],
    share: [bestDecision, accountabilityRisk, splitRisk, delayRisk],
  };
  const deduped = (optionsByStep[stepId] ?? [bestDecision, routeRisk, accountabilityRisk, delayRisk]).filter(
    (decision, index, decisions) => decisions.findIndex((candidate) => candidate.id === decision.id) === index,
  );

  return deduped.slice(0, 4);
}

function buildIncidentQuiz(
  stepId: string,
  result: ActionBundle,
  hazardRoute: ReturnType<typeof getHazardRouteLexicon>,
): IncidentStoryScene["quiz"] {
  const firstAction = result.immediateActions[0] ?? "move the group to a safer posture";
  const destination = result.evacuation.destinations[0]?.name ?? "the first safe assembly point";
  const sourceCue = result.documentBrief?.actionCue ?? result.sources.retrievedGuidance[0]?.evidence ?? "the attached source cue";

  switch (stepId) {
    case "ground":
      return {
        question: "Which layer should override generated advice if the two conflict?",
        answers: [
          {
            id: "official",
            label: `${hazardRoute.authorityPhrase} or local authority instruction`,
            correct: true,
            feedback: "Correct. The simulation keeps official authority above generated recommendations.",
          },
          {
            id: "generated",
            label: "Whichever generated route sounds fastest",
            correct: false,
            feedback: "Not quite. Fast routes still need authority and source checks.",
          },
        ],
      };
    case "actions":
      return {
        question: "What should the trainee do before trying to complete the full checklist?",
        answers: [
          {
            id: "first-action",
            label: firstAction,
            correct: true,
            feedback: "Correct. The first protective action matters more than reading every note.",
          },
          {
            id: "read-all",
            label: "Read every export and source note first",
            correct: false,
            feedback: "That delays protection. Open the notes after the first action is underway.",
          },
        ],
      };
    case "route":
      return {
        question: "Which route choice best protects people and official access?",
        answers: [
          {
            id: "route-safe",
            label: `${hazardRoute.bestRoutePhrase || `Move toward ${destination}`} while preserving source checks`,
            correct: true,
            feedback: "Correct. A safe route also preserves the access path needed for official response or care.",
          },
          {
            id: "shortcut",
            label: "Use the closest path even if it blocks official access",
            correct: false,
            feedback: "Unsafe. Access paths and control points need to stay clear.",
          },
        ],
      };
    case "people":
      return {
        question: "Who should be named before movement starts?",
        answers: [
          {
            id: "buddy",
            label: "A buddy for vulnerable people plus medication and gate leads",
            correct: true,
            feedback: "Correct. The game rewards assigning people, not just moving fast.",
          },
          {
            id: "fast",
            label: "Only the fastest group, so they can leave first",
            correct: false,
            feedback: "That can strand people who need help. Assign care roles first.",
          },
        ],
      };
    case "share":
      return {
        question: "What makes the final handoff trustworthy?",
        answers: [
          {
            id: "source-boundaries",
            label: "Voice/action/flow outputs preserve source boundaries",
            correct: true,
            feedback: "Correct. The handoff is portable, but it still shows what came from where.",
          },
          {
            id: "single-summary",
            label: "A single confident summary with no source labels",
            correct: false,
            feedback: "That is less auditable. Judges need to see the source boundaries.",
          },
        ],
      };
    default:
      return {
        question: "What turns this from a video into a training simulation?",
        answers: [
          {
            id: "decision",
            label: `Make a decision using ${truncateForCard(sourceCue, 72)}`,
            correct: true,
            feedback: "Correct. The trainee acts on source-grounded context and sees consequences.",
          },
          {
            id: "watch",
            label: "Watch passively until the briefing ends",
            correct: false,
            feedback: "This is the old model. Fireline Commander should make the trainee act.",
          },
        ],
      };
  }
}

function buildPauseQuizResolveCue(
  scene: IncidentStoryScene,
  firstPersonScene: FirstPersonDrillScene,
  answer: IncidentStoryScene["quiz"]["answers"][number],
): PauseQuizResolveCue {
  const saferRule =
    firstPersonScene.routeTrainer.ruleChoices.find((choice) => choice.correct) ??
    firstPersonScene.routeTrainer.ruleChoices[0];
  const proofCheckpoint =
    firstPersonScene.routeTrainer.checkpoints.find((checkpoint) => checkpoint.toneClass === "status-ready") ??
    firstPersonScene.routeTrainer.checkpoints[0];
  const sourceLayer =
    scene.overlays.find((overlay) => overlay.toneClass === "tone-official") ??
    scene.overlays.find((overlay) => overlay.toneClass === "tone-retrieved") ??
    scene.overlays[0];

  return {
    verdictLabel: answer.correct ? "Correct route lock" : "Risk cue caught",
    verdictToneClass: answer.correct ? "status-ready" : "status-confirm",
    ruleLabel: answer.correct
      ? saferRule?.label ?? "Safer route confirmed"
      : `Safer: ${saferRule?.label ?? firstPersonScene.routeCue.route}`,
    proofLabel: [proofCheckpoint?.label, sourceLayer?.label].filter(Boolean).join(" + "),
    feedback: answer.feedback,
  };
}

function buildFirstPersonDrillScene(
  result: ActionBundle,
  form: IntakeForm,
  scene: IncidentStoryScene,
  decision: IncidentStoryDecision,
  viewId: FirstPersonViewId,
  stepId: string,
): FirstPersonDrillScene {
  const destination = result.evacuation.destinations[0]?.name ?? "the assembly point";
  const firstAction = result.immediateActions[0] ?? "move the group into a safer posture";
  const sourceCue =
    result.documentBrief?.actionCue ??
    result.sources.retrievedGuidance[0]?.evidence ??
    result.sources.officialFacts[0]?.summary ??
    "Use the visible alarm, route markers, and people count before moving.";
  const roleLabel =
    form.role === "school" ? "School safety lead" : form.role === "clinic" ? "Clinic floor lead" : "Household lead";
  const hazardRoute = getHazardRouteLexicon(scene.hazardLabel, destination);
  const viewCopy: Record<
    FirstPersonViewId,
    Pick<FirstPersonDrillScene, "stance" | "locationLabel" | "objective" | "narration" | "progress" | "cueLabel">
  > = {
    entry: {
      stance: "look",
      locationLabel: `${roleLabel} POV`,
      objective: `Read the scene, then choose whether to ${decision.label.toLowerCase()}.`,
      narration: `${scene.headline}. The trainee is at the entry point with ${hazardRoute.sceneNoun} competing for attention.`,
      progress: 24,
      cueLabel: "Scene read",
    },
    corridor: {
      stance: "advance",
      locationLabel: "Route decision",
      objective: truncateForCard(firstAction, 96),
      narration: `You move the trainee into the route decision. The current choice is ${decision.label.toLowerCase()}, so speed and safety update visibly.`,
      progress: 58,
      cueLabel: "Action turn",
    },
    gate: {
      stance: "interact",
      locationLabel: `Exit toward ${destination}`,
      objective: truncateForCard(`Handoff: ${hazardRoute.accessDetail} Move toward ${destination}.`, 108),
      narration: `The final interaction tests whether the plan survives contact with parents, responders, vulnerable people, and low-bandwidth handoff.`,
      progress: 88,
      cueLabel: "Handoff",
    },
  };
  const hotspotsByView: Record<FirstPersonViewId, FirstPersonDrillScene["hotspots"]> = {
    entry: [
      {
        id: "source",
        label: "Briefing cue",
        detail: truncateForCard(sourceCue, 66),
        toneClass: "tone-retrieved",
        positionClass: "fpHotspot-left",
      },
      {
        id: "hazard",
        label: hazardRoute.hazardPressureLabel,
        detail: hazardRoute.hazardHotspotDetail,
        toneClass: "status-confirm",
        positionClass: "fpHotspot-right",
      },
      {
        id: "lead",
        label: roleLabel,
        detail: "You are controlling the person who gives the first order.",
        toneClass: "tone-generated",
        positionClass: "fpHotspot-center",
      },
    ],
    corridor: [
      {
        id: "group",
        label: "People",
        detail: decision.impact.safety >= 75 ? "Group is moving with assigned leads." : "One group still needs a handler.",
        toneClass: decision.impact.safety >= 75 ? "status-ready" : "status-confirm",
        positionClass: "fpHotspot-left",
      },
      {
        id: "action",
        label: "Action",
        detail: truncateForCard(firstAction, 66),
        toneClass: "tone-generated",
        positionClass: "fpHotspot-center",
      },
      {
        id: "route",
        label: "Route lane",
        detail: decision.impact.speed >= 75 ? "Movement starts without blocking access." : "Delay is creating a bottleneck.",
        toneClass: decision.impact.speed >= 75 ? "status-ready" : "status-confirm",
        positionClass: "fpHotspot-right",
      },
    ],
    gate: [
      {
        id: "authority",
        label: "Handoff",
        detail: decision.impact.trust >= 75 ? "Count and route are clear." : "Count is weak; confirm people before release.",
        toneClass: decision.impact.trust >= 75 ? "tone-official" : "status-confirm",
        positionClass: "fpHotspot-left",
      },
      {
        id: "destination",
        label: destination,
        detail: "The trainee completes the movement handoff.",
        toneClass: "status-ready",
        positionClass: "fpHotspot-center",
      },
      {
        id: "responders",
        label: hazardRoute.accessLabel,
        detail: hazardRoute.accessDetail,
        toneClass: "tone-official",
        positionClass: "fpHotspot-right",
      },
    ],
  };

  return {
    viewId,
    stageFrameUrl: getScenarioStageFrameUrl(stepId, form.hazard, viewId),
    stageVisualClass: getScenarioStageVisualClass(stepId, form.hazard),
    ...viewCopy[viewId],
    ...buildStepLearningGuide(stepId, scene, decision, firstAction, destination, sourceCue),
    routeCue: {
      trigger: truncateForCard(hazardRoute.openingBeat, 72),
      route: truncateForCard(hazardRoute.bestRoutePhrase, 78),
      avoid: truncateForCard(hazardRoute.riskyRoutePhrase, 66),
    },
    controls: [
      { id: "entry", label: "Scan hazard", detail: "Read hazard, source, and people cues." },
      { id: "corridor", label: "Move route", detail: "Move into the first protective action." },
      { id: "gate", label: "Check handoff", detail: `Handoff at the ${hazardRoute.accessLabel.toLowerCase()}.` },
    ],
    videoBeats: [
      {
        id: "briefing",
        label: "Briefing",
        timestamp: "00:00",
        caption: hazardRoute.openingBeat,
        prompt: "Scan the hazard cue, source cue, and people before issuing the first order.",
        viewId: "entry",
        toneClass: "tone-retrieved",
        visualClass: "fpVisual-corridor",
      },
      {
        id: "movement",
        label: "Movement",
        timestamp: "00:18",
        caption: truncateForCard(firstAction, 86),
        prompt: `Advance the trainee and decide whether ${decision.label.toLowerCase()} is still the right move.`,
        viewId: "corridor",
        toneClass: "tone-generated",
        visualClass: "fpVisual-action",
      },
      {
        id: "decision",
        label: "Decision pause",
        timestamp: "00:36",
        caption: `Handoff toward ${destination}.`,
        prompt: "Pause the video, choose the response, then watch the impact meters and actors change.",
        viewId: "gate",
        toneClass: decision.impact.trust >= 75 ? "tone-official" : "status-confirm",
        visualClass: "fpVisual-route",
      },
    ],
    routeTrainer: buildRouteTrainerScene(stepId, scene, decision, firstAction, destination, sourceCue),
    hotspots: hotspotsByView[viewId],
    routeAffordances: buildRouteAffordanceProps(scene.hazardLabel, destination),
  };
}

function buildRouteTrainerScene(
  stepId: string,
  scene: IncidentStoryScene,
  decision: IncidentStoryDecision,
  firstAction: string,
  destination: string,
  sourceCue: string,
): RouteTrainerScene {
  const hazardRoute = getHazardRouteLexicon(scene.hazardLabel, destination);
  const commonSynonyms = hazardRoute.commonSynonyms;
  const checkpointByStep: Record<string, RouteTrainerScene["checkpoints"]> = {
    mission: [
      { id: "read", label: "Read scene", detail: scene.hazardLabel, toneClass: "status-confirm" },
      { id: "brief", label: "Name command", detail: "One lead gives the first order.", toneClass: "tone-generated" },
      { id: "stage", label: "Stage group", detail: "Prepare to move without crowding exits.", toneClass: "status-ready" },
    ],
    ground: [
      { id: "official", label: "Official layer", detail: "Highest authority in conflict.", toneClass: "tone-official" },
      { id: "retrieved", label: "Retrieved cue", detail: truncateForCard(sourceCue, 58), toneClass: "tone-retrieved" },
      { id: "generated", label: "Generated support", detail: "Adapts to people and constraints.", toneClass: "tone-generated" },
    ],
    actions: [
      { id: "first", label: "First action", detail: truncateForCard(firstAction, 58), toneClass: "tone-generated" },
      { id: "hazard", label: "Hazard side", detail: hazardRoute.bestRouteDetail, toneClass: "status-confirm" },
      { id: "count", label: "Head count", detail: "Confirm groups are moving.", toneClass: "status-ready" },
    ],
    route: [
      { id: "start", label: "Start point", detail: hazardRoute.startDetail, toneClass: "tone-generated" },
      { id: "lane", label: hazardRoute.accessLabel, detail: hazardRoute.accessDetail, toneClass: "tone-official" },
      { id: "assembly", label: destination, detail: hazardRoute.destinationDetail, toneClass: "status-ready" },
    ],
    people: [
      { id: "buddy", label: "Buddy assign", detail: "Pair vulnerable people with named helpers.", toneClass: "status-ready" },
      { id: "meds", label: "Medication cue", detail: "Clinic kit travels with the care lead.", toneClass: "tone-generated" },
      { id: "gate", label: "Gate control", detail: "Prevent pickup crowding.", toneClass: "tone-official" },
    ],
    share: [
      { id: "voice", label: "Voice brief", detail: "Speak the route in plain language.", toneClass: "tone-generated" },
      { id: "card", label: "Action card", detail: "Portable route and rule words.", toneClass: "tone-retrieved" },
      { id: "flow", label: "Flow handoff", detail: "Source boundaries stay visible.", toneClass: "status-ready" },
    ],
  };
  const choicesByStep: Record<string, RouteRuleChoice[]> = {
    mission: [
      {
        id: "trigger",
        label: "Stage now; move on trigger",
        detail: "Names command, posture, and the condition for movement.",
        correct: true,
        feedback: "Correct. It creates readiness without inventing an evacuation order.",
      },
      {
        id: "wait",
        label: hazardRoute.riskyDelayPhrase,
        detail: "Delays until the route is worse.",
        correct: false,
        feedback: `Risky. ${hazardRoute.riskyRouteFeedback}`,
      },
    ],
    ground: [
      {
        id: "official-first",
        label: "Official order overrides generated route",
        detail: "The source hierarchy stays visible.",
        correct: true,
        feedback: "Correct. The simulator rewards trust discipline, not confidence alone.",
      },
      {
        id: "fast-summary",
        label: "Fastest generated summary wins",
        detail: "Route sounds efficient but drops authority checks.",
        correct: false,
        feedback: "Wrong layer. Generated advice supports the plan but does not override authority.",
      },
    ],
    actions: [
      {
        id: "first-action",
        label: hazardRoute.firstProtectiveAction,
        detail: "Protects people before full checklist review.",
        correct: true,
        feedback: "Correct. The first action buys time for the rest of the operation.",
      },
      {
        id: "read-export",
        label: "Read every export before moving",
        detail: "Looks careful but delays protection.",
        correct: false,
        feedback: "Too slow for this beat. Start protection, then open deeper notes.",
      },
    ],
    route: [
      {
        id: "response-lane",
        label: hazardRoute.bestRoutePhrase,
        detail: hazardRoute.bestRouteDetail,
        correct: true,
        feedback: hazardRoute.bestRouteFeedback,
      },
      {
        id: "shortcut",
        label: hazardRoute.riskyRoutePhrase,
        detail: "Shorter or easier path, worse operations.",
        correct: false,
        feedback: hazardRoute.riskyRouteFeedback,
      },
    ],
    people: [
      {
        id: "buddy-meds",
        label: "Assign buddies, meds, and gate lead",
        detail: "Makes care constraints operational.",
        correct: true,
        feedback: "Correct. Vulnerable people need named support before movement starts.",
      },
      {
        id: "fast-group",
        label: "Move the fastest group first",
        detail: "Looks efficient but can strand people.",
        correct: false,
        feedback: "Risky. Speed without accountability lowers safety.",
      },
    ],
    share: [
      {
        id: "plain-source",
        label: "Say route plainly and preserve source labels",
        detail: "Works for voice, action card, and flow handoff.",
        correct: true,
        feedback: "Correct. A field handoff must be easy to repeat and easy to audit.",
      },
      {
        id: "single-confident",
        label: "Send one confident unlabeled summary",
        detail: "Easy to read but hides what came from where.",
        correct: false,
        feedback: "Not enough trust. Judges and field users need source boundaries.",
      },
    ],
  };
  const routeSynonymsByStep: Record<string, RouteSynonym[]> = {
    route: hazardRoute.routeSynonyms,
    people: hazardRoute.peopleSynonyms,
    share: [
      { term: "Voice handoff", plain: "Speakable route", verb: "Make the plan repeatable without reading." },
      { term: "Action card", plain: "Pocket plan", verb: "Save the route, trigger, and rule words." },
      { term: "Flow view", plain: "If/then path", verb: "Show decision order and source labels." },
      { term: "Source boundary", plain: "What came from where", verb: "Keep facts, guidance, and recommendations separate." },
    ],
  };
  const checkpoints = checkpointByStep[stepId] ?? checkpointByStep.mission;
  const ruleChoices = choicesByStep[stepId] ?? choicesByStep.mission;
  const synonyms = routeSynonymsByStep[stepId] ?? commonSynonyms;
  const correctChoice = ruleChoices.find((choice) => choice.correct) ?? ruleChoices[0];
  const titleByStep: Record<string, string> = {
    mission: "Read the route before movement",
    ground: "Decode the authority layer",
    actions: "Choose the first route action",
    route: "Navigate the safe route",
    people: "Route people, not just paths",
    share: "Save the route language",
  };
  const subtitleByStep: Record<string, string> = {
    mission: "Turn scene cues into a ready posture.",
    ground: "Learn which rule words have priority.",
    actions: "Practice the first protective movement.",
    route: "Balance evacuee movement with responder access.",
    people: "Make care roles visible in the route.",
    share: "Make the route repeatable outside the app.",
  };
  const saveText = [
    `Route trainer: ${titleByStep[stepId] ?? titleByStep.mission}`,
    `Scenario: ${scene.headline}`,
    `Best rule phrase: ${correctChoice.label}`,
    `Why: ${correctChoice.feedback}`,
    "",
    "Checkpoints:",
    ...checkpoints.map((checkpoint, index) => `${index + 1}. ${checkpoint.label}: ${checkpoint.detail}`),
    "",
    "Vocabulary:",
    ...synonyms.map((synonym) => `- ${synonym.term} = ${synonym.plain}. ${synonym.verb}`),
    "",
    `Current selected decision: ${decision.label}`,
  ].join("\n");

  return {
    title: titleByStep[stepId] ?? titleByStep.mission,
    subtitle: subtitleByStep[stepId] ?? subtitleByStep.mission,
    saveText,
    checkpoints,
    synonyms,
    ruleChoices,
  };
}

function getHazardRouteLexicon(hazardLabel: string, destination: string) {
  if (hazardLabel === "Tsunami") {
    return {
      accessLabel: "Inland route",
      accessDetail: "Avoid shoreline roads and bridges until official all clear.",
      hazardPressureLabel: "Coastal warning",
      authorityPhrase: "coastal response desk",
      openingBeat: "Strong shaking has stopped; the inland route is the urgent cue.",
      sceneNoun: "shaking, high-ground route, elder help, and pet movement",
      hazardHotspotDetail: "Natural warning is visible before the checklist opens.",
      startDetail: "Coastal home or street.",
      destinationDetail: "High ground with accountability before return.",
      firstProtectiveAction: `Move inland toward ${destination} now`,
      riskyDelayPhrase: "Wait near the shore for more certainty",
      bestRoutePhrase: `Move inland toward ${destination}; do not return before all clear`,
      bestRouteDetail: "Combines natural warning, high-ground movement, and return discipline.",
      bestRouteFeedback: "Correct. Tsunami safety depends on moving inland quickly and waiting for official all clear.",
      riskyRoutePhrase: "Wait near the shore for a clearer update",
      riskyRouteFeedback: "Unsafe. Natural warning signs can require immediate movement before more messages arrive.",
      responderName: "Barangay responders",
      voiceTexture:
        "The shaking has stopped. The shoreline is not the focus now; the inland route and vertical backup are.",
      voiceClose:
        "Keep the household calm, move inland or upward, preserve all-clear discipline, and say the next move in plain language before anyone turns back.",
      consequenceStrong:
        "The household commits inland early; elder help and pet control stay ahead of the return-risk window.",
      consequenceRisk:
        "Delay keeps the family near the coastal edge, where a second cue may arrive too late for the slowest person.",
      riskLearningLine:
        "the trainee must move inland before certainty feels complete and wait for the official all clear.",
      debriefSuccess:
        "The trainee moved inland or upward, kept the elder and pet inside the route plan, and preserved all-clear discipline.",
      commonSynonyms: [
        { term: "Natural warning", plain: "Shaking or sea change", verb: "Treat it as the trigger to move." },
        { term: "Inland", plain: "Away from the shore", verb: "Choose streets that climb or move away from water." },
        { term: "Vertical evacuation", plain: "Go up a safe building", verb: "Use only when inland movement is blocked." },
        { term: "All clear", plain: "Official return signal", verb: "Do not go back for belongings early." },
      ],
      routeSynonyms: [
        { term: "High ground", plain: "Safer height", verb: "Move above the expected water path." },
        { term: "Coastal access", plain: "Road toward water", verb: "Avoid it during the warning period." },
        { term: "Return wave", plain: "More waves possible", verb: "Stay away until officials clear return." },
        { term: "Assembly point", plain: "Meeting place", verb: "Count everyone before next movement." },
      ],
      peopleSynonyms: [
        { term: "Buddy carry", plain: "Named stair helper", verb: "Assign help for elders before moving." },
        { term: "Grab bag", plain: "Critical meds and IDs", verb: "Take only what is ready." },
        { term: "Pet leash", plain: "Control animal movement", verb: "Prevent delays at stairs or exits." },
        { term: "Family check-in", plain: "Head count", verb: "Confirm everyone reached high ground." },
      ],
    };
  }

  if (hazardLabel === "Flood") {
    return {
      accessLabel: "Dry route",
      accessDetail: "Use upper floors or elevated walkways; never cross moving water.",
      hazardPressureLabel: "Rising water",
      authorityPhrase: "city flood desk",
      openingBeat: "Water is rising near the ground-floor entrance.",
      sceneNoun: "rising water, dark street edges, charger bag, and medicines",
      hazardHotspotDetail: "Moving water pressure is visible before the checklist opens.",
      startDetail: "Ground-floor room or flooded street edge.",
      destinationDetail: "Dry elevated shelter with power and medication access.",
      firstProtectiveAction: `Move up toward ${destination} before water cuts the route`,
      riskyDelayPhrase: "Cross the street before it gets deeper",
      bestRoutePhrase: `Move up toward ${destination}; avoid moving water`,
      bestRouteDetail: "Prioritizes elevation and avoids the common flooded-road mistake.",
      bestRouteFeedback: "Correct. Flood routes fail when people cross moving water too late.",
      riskyRoutePhrase: "Cross the street before it gets deeper",
      riskyRouteFeedback: "Unsafe. Moving water can knock people down or hide hazards.",
      responderName: "Flood desk",
      voiceTexture:
        "Water is rising near the ground floor. Do not cross moving water; keep people, chargers, and medicines above the flood line.",
      voiceClose:
        "Keep the household calm, move people and critical items up, avoid moving water, and say the next move in plain language before anyone steps outside.",
      consequenceStrong:
        "The group moves above the flood line while medicines and chargers stay reachable for the overnight window.",
      consequenceRisk:
        "The street shortcut exposes the group to moving water and makes the next safe move depend on a route that may close.",
      riskLearningLine:
        "the trainee must choose elevation over a flooded shortcut and protect power, medicine, and child movement early.",
      debriefSuccess:
        "The trainee chose elevation, avoided moving water, and protected medicine plus communication before the street closed.",
      commonSynonyms: [
        { term: "Turn around", plain: "Do not cross", verb: "Stop before moving water." },
        { term: "Upper-floor shelter", plain: "Go upstairs", verb: "Move people and meds above water." },
        { term: "Ankle depth", plain: "Early warning level", verb: "Start movement before water rises more." },
        { term: "Power isolation", plain: "Shut off risky electricity", verb: "Keep people away from wet outlets." },
      ],
      routeSynonyms: [
        { term: "Elevated walkway", plain: "Dry raised path", verb: "Use it instead of flooded roads." },
        { term: "Moving water", plain: "Flowing floodwater", verb: "Treat it as a stop sign." },
        { term: "Shelter upstairs", plain: "Wait above water", verb: "Choose elevation when streets are unsafe." },
        { term: "Exit trigger", plain: "Leave-before level", verb: "Act before the route closes." },
      ],
      peopleSynonyms: [
        { term: "Medicine lift", plain: "Move meds upstairs", verb: "Protect health needs early." },
        { term: "Charger bag", plain: "Power backup", verb: "Keep communication alive." },
        { term: "Child buddy", plain: "Named adult helper", verb: "Prevent separation in dark water." },
        { term: "Neighbor check", plain: "Door-to-door check", verb: "Warn nearby vulnerable people." },
      ],
    };
  }

  if (hazardLabel === "Typhoon") {
    return {
      accessLabel: "Covered gate",
      accessDetail: "Use controlled covered pickup and keep emergency access open.",
      hazardPressureLabel: "Wind field",
      authorityPhrase: "school operations office",
      openingBeat: "Wind and rain are increasing around the school pickup zone.",
      sceneNoun: "wind, classroom holds, guardian queue, and covered pickup",
      hazardHotspotDetail: "Wind pressure is visible before the checklist opens.",
      startDetail: "Assigned classroom or covered corridor.",
      destinationDetail: "Accounted group inside or controlled guardian handoff.",
      firstProtectiveAction: `Hold students inside until covered release toward ${destination} is safe`,
      riskyDelayPhrase: "Open all gates for faster pickup",
      bestRoutePhrase: `Hold inside until safe; release through ${destination}`,
      bestRouteDetail: "Combines shelter-in-place with controlled reunification.",
      bestRouteFeedback: "Correct. Typhoon movement should not expose students to peak wind or block emergency access.",
      riskyRoutePhrase: "Open all gates so pickup finishes faster",
      riskyRouteFeedback: "Unsafe. Faster pickup can create uncontrolled exposure and traffic blockage.",
      responderName: "School operations",
      voiceTexture:
        "Wind is picking up outside. Keep students inside assigned rooms until the covered-gate handoff is safe.",
      voiceClose:
        "Keep students calm, preserve covered-gate control, protect emergency access, and say the next release move in plain language before gates open.",
      consequenceStrong:
        "Class groups stay accounted for inside while the covered pickup queue remains controlled and emergency access stays open.",
      consequenceRisk:
        "Opening every gate turns the pickup zone into an exposure and traffic problem before the wind window clears.",
      riskLearningLine:
        "the trainee must hold rooms, control the covered gate, and release only when conditions allow.",
      debriefSuccess:
        "The trainee kept students sheltered, protected covered reunification, and avoided a faster but unsafe all-gates release.",
      commonSynonyms: [
        { term: "Shelter-in-place", plain: "Stay in safe rooms", verb: "Hold until movement is safer." },
        { term: "Covered route", plain: "Protected walkway", verb: "Avoid wind-driven debris." },
        { term: "Reunification", plain: "Controlled pickup", verb: "Release students after headcount." },
        { term: "Wind warning", plain: "Movement trigger", verb: "Tie release to official conditions." },
      ],
      routeSynonyms: [
        { term: "Pickup lane", plain: "Guardian queue", verb: "Keep it controlled and clear." },
        { term: "Emergency access", plain: "Responder path", verb: "Do not block vehicles." },
        { term: "Room hold", plain: "Stay assigned", verb: "Prevent crowding at gates." },
        { term: "Release window", plain: "Safe pickup time", verb: "Move only when conditions allow." },
      ],
      peopleSynonyms: [
        { term: "Class roster", plain: "Head count list", verb: "Confirm students before release." },
        { term: "Guardian match", plain: "Approved pickup", verb: "Verify who receives each child." },
        { term: "Mobility route", plain: "Assisted covered path", verb: "Assign help before movement." },
        { term: "Clinic kit", plain: "Health bag", verb: "Keep meds with staff." },
      ],
    };
  }

  if (hazardLabel === "Heatwave") {
    return {
      accessLabel: "Cooling route",
      accessDetail: "Keep the shortest shaded path open for mobility-limited patients.",
      hazardPressureLabel: "Heat zone",
      authorityPhrase: "city health office",
      openingBeat: "The clinic is heating up during a power instability alert.",
      sceneNoun: "heat index, waiting-room load, medicine cooler, and symptom checks",
      hazardHotspotDetail: "Heat stress risk is visible before the checklist opens.",
      startDetail: "Warm waiting area or clinic corridor.",
      destinationDetail: "Cool room with water, checks, and medication protection.",
      firstProtectiveAction: `Move vulnerable patients toward ${destination} and start checks`,
      riskyDelayPhrase: "Wait until patients ask for help",
      bestRoutePhrase: `Move vulnerable patients toward ${destination}; start symptom checks`,
      bestRouteDetail: "Combines cooling movement, care triage, and escalation triggers.",
      bestRouteFeedback: "Correct. Heat response is a route to cooling plus repeated checks, not just a reminder to drink water.",
      riskyRoutePhrase: "Wait until patients ask for help",
      riskyRouteFeedback: "Unsafe. Heat illness can escalate before people self-report clearly.",
      responderName: "Clinic escalation",
      voiceTexture:
        "The clinic is hot and power is unstable. Move vulnerable patients toward the coolest reachable room and repeat symptom checks.",
      voiceClose:
        "Keep staff calm, move high-risk patients to cooling, protect medicines, and say the escalation trigger in plain language before symptoms worsen.",
      consequenceStrong:
        "High-risk patients move to cooling early while medicine storage and symptom escalation stay visible to staff.",
      consequenceRisk:
        "Waiting for self-reports leaves elders and children exposed while heat illness can progress quietly.",
      riskLearningLine:
        "the trainee must route people to cooling before they self-report and name escalation triggers early.",
      debriefSuccess:
        "The trainee moved vulnerable patients to cooling, protected medicines, and made symptom escalation explicit.",
      commonSynonyms: [
        { term: "Heat index", plain: "Feels-like heat", verb: "Use it as a risk trigger." },
        { term: "Cool room", plain: "Shaded care area", verb: "Move vulnerable people there first." },
        { term: "Wellness check", plain: "Ask and observe", verb: "Repeat checks on schedule." },
        { term: "Escalation trigger", plain: "Call higher care", verb: "Act on confusion, fainting, or heat stroke signs." },
      ],
      routeSynonyms: [
        { term: "Cooling route", plain: "Path to cooler space", verb: "Keep it short, shaded, and clear." },
        { term: "Hydration station", plain: "Water point", verb: "Place it where staff can monitor use." },
        { term: "Medicine cooler", plain: "Temperature-safe storage", verb: "Protect insulin and heat-sensitive meds." },
        { term: "Transport wait", plain: "Pickup queue", verb: "Prioritize shade and symptom checks." },
      ],
      peopleSynonyms: [
        { term: "High-risk patient", plain: "More vulnerable person", verb: "Check elders, children, and chronic conditions first." },
        { term: "Buddy monitor", plain: "Named observer", verb: "Assign someone to repeat checks." },
        { term: "Oral rehydration", plain: "Electrolyte drink", verb: "Use per clinic protocol." },
        { term: "Red flag symptoms", plain: "Danger signs", verb: "Escalate confusion, fainting, or hot dry skin." },
      ],
    };
  }

  return {
    accessLabel: "Response lane",
    accessDetail: "Keep this path open for official fire response.",
    hazardPressureLabel: "Smoke front",
    authorityPhrase: "fire command",
    openingBeat: "Smoke is entering the school route.",
    sceneNoun: "smoke, student groups, pickup pressure, and responder access",
    hazardHotspotDetail: "Smoke direction is visible before the checklist opens.",
    startDetail: "Interior corridor.",
    destinationDetail: "Upwind assembly and accountability.",
    firstProtectiveAction: `Move upwind toward ${destination} and keep the fire lane clear`,
    riskyDelayPhrase: "Use the fire lane as a shortcut",
    bestRoutePhrase: `Move toward ${destination}; keep fire lane clear`,
    bestRouteDetail: "Combines evacuee safety and responder access.",
    bestRouteFeedback: "Correct. A route is only safe if firefighters can still reach the scene.",
    riskyRoutePhrase: "Use the closest gate even if responders need it",
    riskyRouteFeedback: "Unsafe. The shortcut can block fire crews and slow the real response.",
    responderName: "Fire crew",
    voiceTexture:
      "Light smoke is pushing toward the covered walkway. The pickup gate is getting crowded, and the fire lane must stay open.",
    voiceClose:
      "Keep the group calm, preserve the fire lane, move upwind, and say the next move in plain language before anyone re-enters.",
    consequenceStrong:
      "Students move upwind while the fire lane remains open and headcount stays attached to the route.",
    consequenceRisk:
      "The shortcut blocks responder access and turns parent pickup into the next bottleneck.",
    riskLearningLine:
      "the trainee must move upwind without using the responder lane as a shortcut.",
    debriefSuccess:
      "The trainee moved upwind, kept the fire lane clear, and preserved accountability before re-entry.",
    commonSynonyms: [
      { term: "Evacuate", plain: "Leave now", verb: "Start movement on the official trigger." },
      { term: "Upwind", plain: "Away from smoke", verb: "Route the group where smoke is not blowing." },
      { term: "Assembly area", plain: "Meeting point", verb: "Count everyone before the next move." },
      { term: "All clear", plain: "Official return signal", verb: "Do not re-enter until authority says so." },
    ],
    routeSynonyms: [
      { term: "Response lane", plain: "Fire truck access", verb: "Keep this path open." },
      { term: "Upwind assembly", plain: "Meet away from smoke", verb: "Move people where air is cleaner." },
      { term: "Re-entry", plain: "Going back inside", verb: "Block until official all clear." },
      { term: "Accountability", plain: "Head count", verb: "Confirm every person is accounted for." },
    ],
    peopleSynonyms: [
      { term: "Buddy system", plain: "Named helper", verb: "Pair each vulnerable person with support." },
      { term: "Mobility assist", plain: "Help moving", verb: "Assign stairs, gate, or chair support." },
      { term: "Medication continuity", plain: "Meds stay with care lead", verb: "Move health needs with the group." },
      { term: "Reunification", plain: "Safe pickup", verb: "Control handoff to guardians." },
    ],
  };
}

function getScenarioStageFrameUrl(stepId: string, hazard: IntakeForm["hazard"], viewId: FirstPersonViewId) {
  const gallery = getScenarioGalleryImageSet(hazard);
  const frameIndexByStepAndView: Record<string, Record<FirstPersonViewId, number>> = {
    mission: { entry: 0, corridor: 1, gate: 2 },
    ground: { entry: 1, corridor: 2, gate: 3 },
    actions: { entry: 3, corridor: 4, gate: 5 },
    route: { entry: 4, corridor: 5, gate: 6 },
    people: { entry: 6, corridor: 7, gate: 8 },
    share: { entry: 7, corridor: 8, gate: 9 },
  };
  const frameIndex = frameIndexByStepAndView[stepId]?.[viewId] ?? 0;

  if (gallery[frameIndex]) {
    return gallery[frameIndex];
  }

  switch (stepId) {
    case "mission":
      return gallery[0] ?? "/harbor-stage-01-alarm.png";
    case "actions":
      return gallery[1] ?? "/harbor-stage-02-corridor.png";
    case "route":
      return gallery[2] ?? "/harbor-stage-03-gate.png";
    case "people":
      return gallery[4] ?? "/harbor-stage-05-assembly.png";
    case "share":
      return gallery[5] ?? "/harbor-stage-06-handoff.png";
    case "ground":
      return gallery[3] ?? "/harbor-stage-04-lane.png";
    default:
      return gallery[0] ?? "/harbor-stage-01-alarm.png";
  }
}

function getScenarioGalleryImageSet(hazard: IntakeForm["hazard"]) {
  return Array.from({ length: 10 }, (_, index) => {
    const frameNumber = index + 1;

    return `/scenarios/${hazard}-${String(frameNumber).padStart(2, "0")}.png`;
  });
}

function getScenarioBeatPlan(hazard: IntakeForm["hazard"]) {
  const common = {
    fire: [
      ["alarm", "00:00", "Alarm + smoke", "entry"],
      ["corridor", "00:12", "Read wind", "entry"],
      ["route", "00:24", "Move upwind", "corridor"],
      ["lane", "00:36", "Keep lane clear", "corridor"],
      ["count", "00:52", "Headcount", "gate"],
      ["handoff", "01:08", "Handoff", "gate"],
      ["asthma", "01:18", "Assist buddy", "gate"],
      ["shortcut", "01:28", "Block shortcut", "corridor"],
      ["pickup", "01:38", "Pickup control", "gate"],
      ["clear", "01:50", "Final clear", "gate"],
    ],
    tsunami: [
      ["shake", "00:00", "Shaking stops", "entry"],
      ["bag", "00:10", "Grab essentials", "entry"],
      ["inland", "00:22", "Move inland", "corridor"],
      ["stairs", "00:34", "Vertical backup", "corridor"],
      ["allclear", "00:52", "Wait all clear", "gate"],
      ["family", "01:06", "Family check", "gate"],
      ["school", "01:18", "School route", "corridor"],
      ["elder", "01:30", "Assist elder", "corridor"],
      ["highground", "01:42", "Higher ground", "gate"],
      ["return", "01:55", "No return", "gate"],
    ],
    flood: [
      ["rain", "00:00", "Water rising", "entry"],
      ["power", "00:10", "Power check", "entry"],
      ["upstairs", "00:22", "Move upstairs", "corridor"],
      ["street", "00:35", "Avoid street", "corridor"],
      ["supplies", "00:52", "Meds + chargers", "gate"],
      ["update", "01:05", "Status update", "gate"],
      ["meds", "01:16", "Raise meds", "entry"],
      ["dryroom", "01:28", "Dry room", "gate"],
      ["doorway", "01:40", "Block street", "corridor"],
      ["balcony", "01:52", "Neighbor check", "gate"],
    ],
    typhoon: [
      ["warning", "00:00", "Wind warning", "entry"],
      ["rooms", "00:12", "Stay in rooms", "entry"],
      ["covered", "00:25", "Covered gate", "corridor"],
      ["pickup", "00:38", "Controlled pickup", "corridor"],
      ["headcount", "00:55", "Class count", "gate"],
      ["release", "01:10", "Safe release", "gate"],
      ["curtains", "01:20", "Away from glass", "entry"],
      ["interior", "01:32", "Interior wall", "entry"],
      ["boundary", "01:44", "Parent boundary", "corridor"],
      ["orderly", "01:56", "Orderly release", "gate"],
    ],
    heatwave: [
      ["alert", "00:00", "Heat alert", "entry"],
      ["triage", "00:12", "Triage risk", "entry"],
      ["coolroom", "00:26", "Cool room", "corridor"],
      ["water", "00:38", "Water check", "corridor"],
      ["meds", "00:52", "Protect meds", "gate"],
      ["escalate", "01:08", "Escalate signs", "gate"],
      ["shade", "01:18", "Move to shade", "corridor"],
      ["symptoms", "01:30", "Symptom check", "gate"],
      ["priority", "01:42", "Priority queue", "corridor"],
      ["transport", "01:55", "Transport handoff", "gate"],
    ],
  } as const;

  return common[hazard].map(([id, timestamp, label, viewId]) => ({
    id,
    timestamp,
    label,
    viewId: viewId as FirstPersonViewId,
  }));
}

function buildSimulationGuideScript({
  drillName,
  role,
  hazard,
  objective,
  route,
  speakWindowOpen,
  secondsLeft,
}: {
  drillName: string;
  role: TraineeRoleProfile;
  hazard: IntakeForm["hazard"];
  objective: string;
  route: string;
  speakWindowOpen: boolean;
  secondsLeft: number | null;
}) {
  const safetyKeyByHazard: Record<IntakeForm["hazard"], string> = {
    fire: "Safety key: RACE. Rescue immediate danger, alarm others, contain smoke by keeping doors closed, then evacuate by the marked route.",
    tsunami: "Safety key: natural warning means move inland or up, then wait for official all clear.",
    flood: "Safety key: turn around, do not cross moving water, and move people and medicines above ground early.",
    typhoon: "Safety key: shelter away from glass, keep the covered gate controlled, and release only after count.",
    heatwave: "Safety key: cool first, hydrate slowly, check symptoms, and escalate confusion, fainting, or heat stroke signs.",
  };
  const roleRuleByRole: Record<TraineeRoleId, string> = {
    student:
      "You do not speak in this role. Your task is to follow the lead, stay with your buddy, and finish before the timer runs out.",
    teacher:
      "You speak only when the route or handoff window opens. Give one short instruction to the students, then count the group.",
    instructor:
      "You speak only when correction is needed. Keep the command short, protect the route, and confirm the handoff.",
  };
  const speakCue =
    role.id === "student"
      ? "The mic stays locked for students."
      : speakWindowOpen
        ? `The speak window is open. Say: ${buildSpokenRouteCommand(hazard, role.id)}`
        : "The speak window is locked. First scan the scene or move to the route.";
  const timerCue = secondsLeft === null ? "" : ` ${secondsLeft} seconds remain on this objective.`;

  return [
    `Welcome to Fireline Commander: ${drillName}.`,
    `You are playing as ${role.label}. ${role.instruction}`,
    `Objective: ${objective}`,
    safetyKeyByHazard[hazard],
    `Use Space to continue, W to move forward, A to step back, D to secure the safest choice, and S to hand off. Route: ${route}.`,
    `${roleRuleByRole[role.id]} ${speakCue}${timerCue}`,
  ].join(" ");
}

function buildStoryFramePrompt({
  frame,
  frameIndex,
  totalFrames,
  roleId,
  hazard,
  route,
}: {
  frame: ReturnType<typeof getScenarioBeatPlan>[number];
  frameIndex: number;
  totalFrames: number;
  roleId: TraineeRoleId;
  hazard: IntakeForm["hazard"];
  route: string;
}) {
  const frameNumber = frameIndex + 1;
  const promptByView: Record<FirstPersonViewId, string> = {
    entry: "Read smoke, exits, people, and the responder lane before moving.",
    corridor: "Choose the safest movement and watch the consequence.",
    gate: "Confirm headcount, route, care needs, and all-clear.",
  };
  const speakByRole: Record<TraineeRoleId, string> = {
    student: "Listen only. Follow the lead and stay with your buddy.",
    teacher: `Say one clear command when prompted: ${buildSpokenRouteCommand(hazard, roleId)}`,
    instructor: `Correct the unsafe movement when prompted: ${buildSpokenRouteCommand(hazard, roleId)}`,
  };
  const requiresDecision = frameNumber === 3 || frameNumber === 6 || frameNumber === 9;
  const requiresSpeech = roleId !== "student" && (frame.viewId === "corridor" || frame.viewId === "gate");

  return {
    progressLabel: `${frameNumber}/${totalFrames}`,
    title: frame.label,
    timestamp: frame.timestamp,
    instruction: promptByView[frame.viewId],
    speech: speakByRole[roleId],
    route,
    requiresDecision,
    requiresSpeech,
  };
}

function buildCourseCommandPrompt(
  hazard: IntakeForm["hazard"],
  viewId: FirstPersonViewId,
  roleId: TraineeRoleId,
  decision: IncidentStoryDecision,
) {
  const roleVerb: Record<TraineeRoleId, string> = {
    student: "follow the instruction and stay with your buddy",
    teacher: "say one clear command and confirm the group is moving",
    instructor: "observe, correct the route, and protect responder access",
  };
  const hazardCue: Record<IntakeForm["hazard"], string> = {
    fire: "RACE: rescue, alarm, contain, evacuate.",
    tsunami: "Move inland or up. Do not return until official all clear.",
    flood: "Turn around. Move up before water reaches the route.",
    typhoon: "Shelter first. Release only through controlled pickup.",
    heatwave: "Cool, hydrate, check symptoms, and escalate danger signs.",
  };
  const nextByView: Record<FirstPersonViewId, { title: string; key: string; action: string }> = {
    entry: {
      title: "Scan before moving",
      key: "Press W",
      action: `First ${roleVerb[roleId]}.`,
    },
    corridor: {
      title: "Choose the route",
      key: "Press D",
      action: "Secure the safest choice and watch what happens.",
    },
    gate: {
      title: "Close the drill",
      key: "Press S",
      action: "Give the handoff, count people, and wait for all-clear.",
    },
  };
  const next = nextByView[viewId];

  return {
    ...next,
    cue: hazardCue[hazard],
    decision: decision.label,
  };
}

function buildSpokenRouteCommand(hazard: IntakeForm["hazard"], roleId: TraineeRoleId) {
  const commandByHazard: Record<IntakeForm["hazard"], string> = {
    fire: "Evacuate now. Stay together. Keep the lane clear. Count at assembly.",
    tsunami: "Move inland now. Stay together. Do not return until all clear.",
    flood: "Move upstairs now. Avoid floodwater. Bring medicine and chargers.",
    typhoon: "Shelter inside. Stay away from windows. Release one at a time.",
    heatwave: "Cool down now. Drink water slowly. Report danger signs.",
  };
  const prefixByRole: Record<TraineeRoleId, string> = {
    student: "I will follow the lead:",
    teacher: "Class, listen:",
    instructor: "Training command:",
  };

  return `${prefixByRole[roleId]} ${commandByHazard[hazard]}`;
}

function buildMissionTimerState({
  roleId,
  elapsedSeconds,
  viewId,
  decision,
}: {
  roleId: TraineeRoleId;
  elapsedSeconds: number;
  viewId: FirstPersonViewId;
  decision: IncidentStoryDecision;
}) {
  const deadlineByRole: Record<TraineeRoleId, number> = {
    student: 35,
    teacher: 50,
    instructor: 60,
  };
  const deadlineSeconds = deadlineByRole[roleId];
  const remainingSeconds = Math.max(0, deadlineSeconds - elapsedSeconds);
  const objectiveMet = viewId === "gate" && decision.impact.safety >= 75 && decision.impact.trust >= 70;
  const hasLost = !objectiveMet && elapsedSeconds > deadlineSeconds;
  const toneClass = objectiveMet ? "status-ready" : hasLost ? "status-confirm" : remainingSeconds <= 10 ? "status-advisory" : "tone-retrieved";
  const label = objectiveMet ? "Objective clear" : hasLost ? "Time lost" : `${remainingSeconds}s left`;
  const instruction =
    roleId === "student"
      ? "Listen, follow the line, and reach handoff before time runs out."
      : "Speak only at command moments, move the route, then finish the handoff before time runs out.";

  return {
    deadlineSeconds,
    elapsedSeconds,
    remainingSeconds,
    objectiveMet,
    hasLost,
    toneClass,
    label,
    instruction,
  };
}

function getScenarioStageVisualClass(stepId: string, hazard: IntakeForm["hazard"]) {
  const stageClassByStep: Record<string, string> = {
    mission: "fpStage-mission",
    ground: "fpStage-ground",
    actions: "fpStage-actions",
    route: "fpStage-route",
    people: "fpStage-people",
    share: "fpStage-share",
  };

  return `fpHazard-${hazard} ${stageClassByStep[stepId] ?? "fpStage-mission"}`;
}

function buildRouteAffordanceProps(hazardLabel: string, destination: string): FirstPersonDrillScene["routeAffordances"] {
  const destinationLabel = truncateForCard(destination, 34);

  if (hazardLabel === "Tsunami") {
    return [
      {
        id: "inland-arrow",
        label: "Inland",
        detail: `Move away from shore toward ${destinationLabel}.`,
        visualClass: "fpAffordance-arrow",
        positionClass: "fpAffordance-route",
      },
      {
        id: "shore-block",
        label: "No return",
        detail: "Shore road stays blocked until official all clear.",
        visualClass: "fpAffordance-block",
        positionClass: "fpAffordance-hazard",
      },
      {
        id: "vertical-backup",
        label: "Go up",
        detail: "Use vertical evacuation only if inland movement is blocked.",
        visualClass: "fpAffordance-stairs",
        positionClass: "fpAffordance-safe",
      },
    ];
  }

  if (hazardLabel === "Flood") {
    return [
      {
        id: "depth-marker",
        label: "Water line",
        detail: "Rising water marks the stop point.",
        visualClass: "fpAffordance-depth",
        positionClass: "fpAffordance-hazard",
      },
      {
        id: "upper-floor",
        label: "Move up",
        detail: `Use elevation toward ${destinationLabel}.`,
        visualClass: "fpAffordance-arrow",
        positionClass: "fpAffordance-route",
      },
      {
        id: "power-check",
        label: "Power off",
        detail: "Keep people away from wet outlets and cords.",
        visualClass: "fpAffordance-power",
        positionClass: "fpAffordance-safe",
      },
    ];
  }

  if (hazardLabel === "Typhoon") {
    return [
      {
        id: "covered-gate",
        label: "Covered gate",
        detail: `Release only through ${destinationLabel} when safe.`,
        visualClass: "fpAffordance-tape",
        positionClass: "fpAffordance-route",
      },
      {
        id: "wind-side",
        label: "Wind side",
        detail: "Peak wind makes open gates a risk.",
        visualClass: "fpAffordance-wind",
        positionClass: "fpAffordance-hazard",
      },
      {
        id: "room-hold",
        label: "Room hold",
        detail: "Keep classes accounted for before pickup.",
        visualClass: "fpAffordance-hold",
        positionClass: "fpAffordance-safe",
      },
    ];
  }

  if (hazardLabel === "Heatwave") {
    return [
      {
        id: "cool-room",
        label: "Cool room",
        detail: `Move vulnerable patients toward ${destinationLabel}.`,
        visualClass: "fpAffordance-arrow",
        positionClass: "fpAffordance-route",
      },
      {
        id: "heat-zone",
        label: "Heat zone",
        detail: "Waiting area is heating before patients self-report.",
        visualClass: "fpAffordance-heat",
        positionClass: "fpAffordance-hazard",
      },
      {
        id: "medicine-cooler",
        label: "Meds cool",
        detail: "Protect temperature-sensitive medicine during the move.",
        visualClass: "fpAffordance-meds",
        positionClass: "fpAffordance-safe",
      },
    ];
  }

  return [
    {
      id: "upwind-arrow",
      label: "Upwind",
      detail: `Move toward ${destinationLabel} away from smoke.`,
      visualClass: "fpAffordance-arrow",
      positionClass: "fpAffordance-route",
    },
    {
      id: "smoke-side",
      label: "Smoke side",
      detail: "Smoke direction marks the unsafe edge.",
      visualClass: "fpAffordance-smoke",
      positionClass: "fpAffordance-hazard",
    },
    {
      id: "fire-lane",
      label: "Keep clear",
      detail: "Fire lane is responder access, not a shortcut.",
      visualClass: "fpAffordance-block",
      positionClass: "fpAffordance-safe",
    },
  ];
}

function buildStepLearningGuide(
  stepId: string,
  scene: IncidentStoryScene,
  decision: IncidentStoryDecision,
  firstAction: string,
  destination: string,
  sourceCue: string,
): Pick<FirstPersonDrillScene, "operationStage" | "learningGoal" | "learningFrames"> {
  const hazardRoute = getHazardRouteLexicon(scene.hazardLabel, destination);
  const sourceFrame: LearningVisualFrame = {
    id: "source",
    label: "Read",
    caption: "Separate official, retrieved, and generated cues.",
    outcome: truncateForCard(sourceCue, 92),
    toneClass: "tone-retrieved",
    visualClass: "fpVisual-source",
  };
  const decisionFrame: LearningVisualFrame = {
    id: "decision",
    label: "Choose",
    caption: decision.label,
    outcome: `Safety ${decision.impact.safety}% · speed ${decision.impact.speed}% · trust ${decision.impact.trust}%`,
    toneClass: decision.impact.safety >= 75 ? "status-ready" : "status-confirm",
    visualClass: "fpVisual-decision",
  };
  const guideByStep: Record<
    string,
    {
      operationStage: string;
      learningGoal: string;
      frames: LearningVisualFrame[];
    }
  > = {
    mission: {
      operationStage: "Stage 1: size up the incident",
      learningGoal: "situational awareness",
      frames: [
        {
          id: "scene",
          label: "Notice",
          caption: scene.headline,
          outcome: "The trainee learns to read hazard, people, route, and authority before acting.",
          toneClass: "status-confirm",
          visualClass: "fpVisual-corridor",
        },
        sourceFrame,
        decisionFrame,
      ],
    },
    ground: {
      operationStage: "Stage 2: verify the rule layer",
      learningGoal: "trust discipline",
      frames: [
        sourceFrame,
        {
          id: "overlay",
          label: "Compare",
          caption: "Check which map layer has authority.",
          outcome: "The trainee learns why model advice cannot override official instructions.",
          toneClass: "tone-official",
          visualClass: "fpVisual-map",
        },
        decisionFrame,
      ],
    },
    actions: {
      operationStage: "Stage 3: perform the first protective action",
      learningGoal: "action under pressure",
      frames: [
        {
          id: "action",
          label: "Do",
          caption: truncateForCard(firstAction, 88),
          outcome: "The trainee learns to start the highest-value action before reading every note.",
          toneClass: "tone-generated",
          visualClass: "fpVisual-action",
        },
        {
          id: "pressure",
          label: "Watch",
          caption: "People and route conditions react to delay.",
          outcome: "The simulation shows why hesitation changes safety and speed.",
          toneClass: "status-confirm",
          visualClass: "fpVisual-corridor",
        },
        decisionFrame,
      ],
    },
    route: {
      operationStage: "Stage 2: move without blocking responders",
      learningGoal: "route judgment",
      frames: [
        {
          id: "route",
          label: "Navigate",
          caption: `Move toward ${destination}.`,
          outcome: "The trainee learns that a safe route also protects official access and accountability.",
          toneClass: "tone-official",
          visualClass: "fpVisual-route",
        },
        {
          id: "lane",
          label: "Preserve",
          caption: hazardRoute.accessLabel,
          outcome: hazardRoute.accessDetail,
          toneClass: "status-ready",
          visualClass: "fpVisual-map",
        },
        decisionFrame,
      ],
    },
    people: {
      operationStage: "Stage 5: account for vulnerable people",
      learningGoal: "care logistics",
      frames: [
        {
          id: "buddy",
          label: "Assign",
          caption: "Name buddies, medication leads, and gate leads.",
          outcome: "The trainee learns that care constraints are part of the operation, not a note at the end.",
          toneClass: "status-ready",
          visualClass: "fpVisual-care",
        },
        {
          id: "group",
          label: "Track",
          caption: "Slowest people set the real timeline.",
          outcome: "The simulation rewards assignments that prevent people from being stranded.",
          toneClass: "tone-generated",
          visualClass: "fpVisual-corridor",
        },
        decisionFrame,
      ],
    },
    share: {
      operationStage: "Stage 3: hand off the plan",
      learningGoal: "field communication",
      frames: [
        {
          id: "handoff",
          label: "Brief",
          caption: "Send voice, action card, and flow outputs.",
          outcome: "The trainee learns to preserve source boundaries in low-bandwidth handoff.",
          toneClass: "tone-generated",
          visualClass: "fpVisual-handoff",
        },
        sourceFrame,
        decisionFrame,
      ],
    },
  };
  const guide = guideByStep[stepId] ?? guideByStep.mission;

  return {
    operationStage: guide.operationStage,
    learningGoal: guide.learningGoal,
    learningFrames: guide.frames,
  };
}

function buildIncidentSimulation(
  result: ActionBundle,
  form: IntakeForm,
  scene: IncidentStoryScene,
  decision: IncidentStoryDecision,
  stepIndex: number,
): IncidentSimulation {
  const averageImpact = Math.round((decision.impact.safety + decision.impact.speed + decision.impact.trust) / 3);
  const pressureValue = Math.max(6, Math.min(94, 104 - averageImpact));
  const pressureLabel =
    pressureValue <= 18 ? "contained" : pressureValue <= 34 ? "tense" : pressureValue <= 50 ? "unstable" : "critical";
  const strongChoice = averageImpact >= 76;
  const riskyChoice = decision.impact.safety < 65 || decision.impact.trust < 60;
  const firstDestination = result.evacuation.destinations[0]?.name ?? "assembly point";
  const hazardRoute = getHazardRouteLexicon(scene.hazardLabel, firstDestination);
  const actorTemplate =
    form.role === "school"
      ? [
          { id: "lead", name: "Principal Reyes", role: "Command", positionClass: "actor-command" },
          { id: "classroom", name: "Grade 5 room", role: "Group", positionClass: "actor-group" },
          { id: "clinic", name: "Clinic aide", role: "Care", positionClass: "actor-care" },
          { id: "gate", name: "Pickup gate", role: "Access", positionClass: "actor-gate" },
          { id: "responder", name: hazardRoute.responderName, role: "Responder", positionClass: "actor-responder" },
        ]
      : form.role === "clinic"
        ? [
            { id: "lead", name: "Duty nurse", role: "Command", positionClass: "actor-command" },
            { id: "ward", name: "Patient bay", role: "Group", positionClass: "actor-group" },
            { id: "meds", name: "Medicine cart", role: "Care", positionClass: "actor-care" },
            { id: "gate", name: "Ambulance lane", role: "Access", positionClass: "actor-gate" },
            { id: "responder", name: hazardRoute.responderName, role: "Escalation", positionClass: "actor-responder" },
          ]
        : [
            { id: "lead", name: "Household lead", role: "Command", positionClass: "actor-command" },
            { id: "family", name: "Family group", role: "Group", positionClass: "actor-group" },
            { id: "meds", name: "Medication bag", role: "Care", positionClass: "actor-care" },
            { id: "exit", name: "Exit route", role: "Access", positionClass: "actor-gate" },
            { id: "responder", name: "Local response", role: "Responder", positionClass: "actor-responder" },
          ];
  const actors = actorTemplate.map((actor, index) => {
    const actorAtRisk = riskyChoice && index % 2 === 1;
    const actorStatus =
      actor.id === "lead"
        ? strongChoice
          ? "Orders are clear and the next move is assigned."
          : "Still waiting for a cleaner trigger before moving."
        : actor.id === "responder"
          ? decision.impact.trust >= 75
            ? `${hazardRoute.accessLabel} stays clear and the handoff is countable.`
            : "Needs a cleaner headcount before the plan can close."
          : actor.id === "gate" || actor.id === "exit"
            ? decision.impact.speed >= 75
              ? `Movement toward ${firstDestination} starts without blocking access.`
              : "Access slows while people wait for another briefing."
            : actorAtRisk
              ? "Confusion rises; this group needs a direct instruction."
              : "Status improves; the group knows where to go next.";

    return {
      ...actor,
      status: actorStatus,
      toneClass: actorAtRisk ? "status-confirm" : strongChoice ? "status-ready" : "tone-generated",
    };
  });
  const log = [
    `${scene.label}: ${decision.label}.`,
    decision.impact.speed >= 75
      ? "Movement starts before the scene bottlenecks."
      : "Delay cost increases; the next turn should reduce hesitation.",
    decision.impact.trust >= 75
      ? "Accountability improves because the route, people count, and handoff are clear."
      : "Accountability penalty: confirm the count and route before release.",
    decision.impact.safety >= 75
      ? "Safety improves because vulnerable people stay inside the decision loop."
      : "Safety penalty: one exposed group still needs a named handler.",
  ];

  return {
    turnLabel: `Turn ${stepIndex + 1}: ${decision.label}`,
    headline: `${scene.hazardLabel} simulation`,
    consequence: decision.consequence ?? (strongChoice ? hazardRoute.consequenceStrong : hazardRoute.consequenceRisk),
    pressureLabel,
    pressureValue,
    actors,
    log,
  };
}

function buildRunbookFilename(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${slug || "beacon-runbook"}.md`;
}

function truncateForCard(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function ensureSentence(value: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return "";
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function buildPortableFlowMermaid(flowchart: string, summaryCards: PortableFlowSummaryCard[]) {
  const lines = flowchart
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const directionLine = lines[0] ?? "flowchart TD";
  const direction = directionLine.match(/^flowchart\s+([A-Z]{2})/i)?.[1] ?? "TD";
  const drillLines = lines[0]?.startsWith("flowchart") ? lines.slice(1) : lines;

  return [
    `%%{init: {"flowchart": {"curve": "stepBefore"}} }%%`,
    `flowchart ${direction}`,
    `subgraph Summary["\`**Judge summary**\`"]`,
    ...summaryCards.map(
      (item, index) =>
        `S${index + 1}["\`**${escapeMermaidMarkdown(item.label)}**\n${escapeMermaidMarkdown(
          truncateForCard(item.headline, 92),
        )}\`"]:::${getMermaidToneKey(item.id)}`,
    ),
    "S1 --> S2 --> S3 --> S4",
    "end",
    `subgraph Drill["\`**Operational drill flow**\`"]`,
    ...drillLines,
    "end",
    "classDef official fill:#e8f1f8,stroke:#176aa4,color:#111714,stroke-width:1.5px;",
    "classDef retrieved fill:#eef6f1,stroke:#1d7a59,color:#111714,stroke-width:1.5px;",
    "classDef generated fill:#f7f2de,stroke:#7a6a1b,color:#111714,stroke-width:1.5px;",
    "classDef route fill:#ffffff,stroke:#35433c,color:#111714,stroke-width:1.5px;",
  ].join("\n");
}

function getMermaidToneKey(cardId: PortableFlowSummaryCard["id"]) {
  switch (cardId) {
    case "official":
      return "official";
    case "retrieved":
      return "retrieved";
    case "generated":
      return "generated";
    case "route":
      return "route";
    default:
      return "route";
  }
}

function escapeMermaidMarkdown(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/"/g, "'")
    .replace(/[`]/g, "'")
    .replace(/[\[\]{}]/g, "")
    .replace(/[|]/g, "/")
    .trim();
}

function buildMermaidFlowBlock(flowchart: string) {
  return ["```mermaid", flowchart, "```"].join("\n");
}

function buildPeopleSummary(form: IntakeForm) {
  const peopleBits = [
    form.adults > 0 ? formatCountLabel(form.adults, "adult") : null,
    form.children > 0 ? formatCountLabel(form.children, "child", "children") : null,
    form.elders > 0 ? formatCountLabel(form.elders, "elder") : null,
    form.pets > 0 ? formatCountLabel(form.pets, "pet") : null,
  ].filter((item): item is string => Boolean(item));

  if (peopleBits.length === 0) {
    return {
      headline: "No people counts entered",
      detail: "Beacon is using the role default without an explicit group size.",
    };
  }

  const detail =
    peopleBits.length > 2
      ? `${peopleBits.slice(0, 2).join(", ")}, plus ${peopleBits.length - 2} more group detail${
          peopleBits.length - 2 === 1 ? "" : "s"
        }.`
      : `${peopleBits.join(", ")} in the active group.`;

  return {
    headline: truncateForCard(peopleBits.join(", "), 96),
    detail,
  };
}

function buildConstraintSummary(form: IntakeForm) {
  const constraints = [
    form.mobilityNeeds.trim() ? `Mobility: ${form.mobilityNeeds.trim()}` : null,
    form.medications.trim() ? `Medications: ${form.medications.trim()}` : null,
    form.weakInternet ? "Weak-signal fallback is on." : null,
  ].filter((item): item is string => Boolean(item));

  if (constraints.length === 0) {
    return {
      toneClass: "status-ready",
      toneLabel: "standard",
      headline: "Standard mobility and connectivity assumptions",
      detail: "No added mobility, medication, or weak-signal constraint was entered for this run.",
    };
  }

  return {
    toneClass: form.weakInternet ? "status-advisory" : "tone-generated",
    toneLabel: form.weakInternet ? "fallback" : "care notes",
    headline: truncateForCard(constraints[0], 96),
    detail: constraints.slice(1).join(" ") || "Beacon is adapting the plan around this constraint.",
  };
}

function formatCountLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatRetrievedChecklistStatusLabel(status: RetrievedIntakeChecklistStatus) {
  switch (status) {
    case "ready":
      return "ready";
    case "confirm":
      return "confirm";
    case "advisory":
      return "optional";
  }
}

function getRetrievedChecklistStatusToneClass(status: RetrievedIntakeChecklistStatus) {
  switch (status) {
    case "ready":
      return "status-ready";
    case "confirm":
      return "status-confirm";
    case "advisory":
      return "status-advisory";
  }
}

function buildRetrievedIntakeChecklist({
  documentImportState,
  hasRetrievedDocumentContext,
  isOcrScaffoldPending,
  hasTraceableSourceLabel,
  hasAuthorityTaggedSourceLabel,
  hasSourceTimingCue,
  hasManualTimingOverride,
  hasManualTimingOverrideReason,
}: {
  documentImportState: DocumentImportState;
  hasRetrievedDocumentContext: boolean;
  isOcrScaffoldPending: boolean;
  hasTraceableSourceLabel: boolean;
  hasAuthorityTaggedSourceLabel: boolean;
  hasSourceTimingCue: boolean;
  hasManualTimingOverride: boolean;
  hasManualTimingOverrideReason: boolean;
}): RetrievedIntakeChecklist {
  const items: RetrievedIntakeChecklistItem[] = [
    hasRetrievedDocumentContext
      ? {
          id: "context",
          label: "Retrieved text attached",
          status: "ready",
          detail:
            "Pasted or imported text is attached, so Beacon can use scenario-specific guidance in the retrieved lane.",
        }
      : documentImportState.status === "hook"
        ? isOcrScaffoldPending
          ? {
              id: "context",
              label: "Retrieved text attached",
              status: "confirm",
              detail:
                "OCR scaffold is attached, but the Verbatim OCR block is empty. Paste extracted text under the marker to activate retrieved cues.",
            }
          : {
              id: "context",
              label: "Retrieved text attached",
              status: "advisory",
              detail:
                "An OCR hook is staged, but no extracted text is pasted yet. Attach text to activate retrieved cues.",
            }
        : {
            id: "context",
            label: "Retrieved text attached",
            status: "advisory",
            detail:
              "No pasted bulletin or OCR extract yet. This run stays on built-in guidance pack context.",
          },
    hasRetrievedDocumentContext && hasTraceableSourceLabel && hasAuthorityTaggedSourceLabel
      ? {
          id: "source-label",
          label: "Source label captured",
          status: "ready",
          detail: "Source naming is present, so exports can trace where retrieved cues came from.",
        }
      : hasRetrievedDocumentContext && hasTraceableSourceLabel
        ? {
            id: "source-label",
            label: "Source label captured",
            status: "confirm",
            detail:
              "Add an issuing authority keyword (office, department, barangay, school, or clinic) so provenance is obvious in exports.",
          }
      : hasRetrievedDocumentContext
        ? {
            id: "source-label",
            label: "Source label captured",
            status: "confirm",
            detail:
              "Add the issuing source name (office, sender, or bulletin) so trust-lane outputs stay auditable.",
          }
        : {
            id: "source-label",
            label: "Source label captured",
            status: "advisory",
            detail: "Source labels become relevant once retrieved text is attached.",
          },
    hasRetrievedDocumentContext && (hasSourceTimingCue || hasManualTimingOverride)
      ? {
          id: "timing",
          label: "Timing state captured",
          status: "ready",
          detail: hasSourceTimingCue
            ? "An effective time or timing cue is attached for freshness checks."
            : "Manual timing freshness is set even without an extracted timing cue.",
        }
      : hasRetrievedDocumentContext
        ? {
            id: "timing",
            label: "Timing state captured",
            status: "confirm",
            detail:
              "Add source timing (issue window/effective time) or set manual freshness so readiness can be explained.",
          }
        : {
            id: "timing",
            label: "Timing state captured",
            status: "advisory",
            detail: "Timing checks become actionable after retrieved text is attached.",
          },
    hasManualTimingOverride
      ? hasManualTimingOverrideReason
        ? {
            id: "timing-note",
            label: "Timing override note",
            status: "ready",
            detail: "Manual freshness includes a rationale, so exports can explain this trust call.",
          }
        : {
            id: "timing-note",
            label: "Timing override note",
            status: "confirm",
            detail:
              "Add a short reason for manual freshness so action cards and runbooks explain why it was overridden.",
          }
      : {
          id: "timing-note",
          label: "Timing override note",
          status: "advisory",
          detail: "Only needed when manual freshness is selected.",
        },
  ];
  const readyCount = items.filter((item) => item.status === "ready").length;
  const confirmCount = items.filter((item) => item.status === "confirm").length;
  const toneClass =
    confirmCount > 0
      ? "status-confirm"
      : readyCount === items.length
        ? "status-ready"
        : "status-advisory";
  const summary =
    confirmCount > 0
      ? "Resolve confirm items to keep retrieved guidance clear and export-ready."
      : readyCount === items.length
        ? "Retrieved lane is fully traceable for source-aware planning and demo exports."
        : "Optional enrichments are available if you want stronger retrieved-lane traceability.";

  return {
    items,
    readyCount,
    totalCount: items.length,
    toneClass,
    summary,
  };
}

function getRetrievedLaneReadiness(
  documentImportState: DocumentImportState,
  {
    hasRetrievedDocumentContext,
    isOcrScaffoldPending,
    requiresTimingOverrideReason,
    isTimingOverrideReasonMissing,
  }: {
    hasRetrievedDocumentContext: boolean;
    isOcrScaffoldPending: boolean;
    requiresTimingOverrideReason: boolean;
    isTimingOverrideReasonMissing: boolean;
  },
): RetrievedLaneReadiness {
  if (documentImportState.status === "loading") {
    return {
      label: "importing document",
      toneClass: "status-advisory",
      detail: documentImportState.message ?? "Beacon is still loading this file into the retrieved lane.",
    };
  }

  if (documentImportState.status === "error") {
    return {
      label: "import needs retry",
      toneClass: "status-confirm",
      detail:
        documentImportState.message ??
        "The selected file did not load. Use paste or the OCR handoff to recover the retrieved lane.",
    };
  }

  if (isOcrScaffoldPending) {
    return {
      label: "OCR text pending",
      toneClass: "status-confirm",
      detail:
        'OCR scaffold is attached, but the Verbatim OCR block is empty. Paste extracted text below "Verbatim OCR" to activate retrieved cues.',
    };
  }

  if (documentImportState.status === "hook" && !hasRetrievedDocumentContext) {
    return {
      label: "OCR hook pending",
      toneClass: "status-advisory",
      detail: documentImportState.fileName
        ? `${documentImportState.fileName} is staged as a source hook. Paste extracted text to activate retrieved cues.`
        : "A source hook is staged. Paste extracted text to activate retrieved cues.",
    };
  }

  if (isTimingOverrideReasonMissing) {
    return {
      label: "timing note needed",
      toneClass: "status-confirm",
      detail:
        "Manual timing freshness is set, but the override note is missing. Add a short rationale before mission build.",
    };
  }

  if (requiresTimingOverrideReason) {
    return {
      label: "timing override documented",
      toneClass: "status-ready",
      detail:
        "Manual timing freshness includes an override note, so this trust call can be carried into exports.",
    };
  }

  if (hasRetrievedDocumentContext) {
    return {
      label: "document cues ready",
      toneClass: "tone-retrieved",
      detail: "Retrieved text is attached and will stay separate from verified official facts.",
    };
  }

  return {
    label: "guidance pack only",
    toneClass: "status-ready",
    detail: "No pasted bulletin or OCR extract yet. This run is using built-in retrieved guidance only.",
  };
}

function formatHazardLabel(hazard: IntakeForm["hazard"]) {
  return hazardCourses.find((course) => course.value === hazard)?.label ?? hazard;
}

function buildDemoRetrievedSource(form: IntakeForm, locationLabel: string): DemoRetrievedSource {
  const sourceName = "Demo sample - Local City DRRMO bulletin";
  const roleAnchor =
    form.role === "school"
      ? "school staff, parent pickup teams, and classroom leads"
      : form.role === "clinic"
        ? "clinic duty staff, patient transfer leads, and medicine handlers"
        : "household leads, elders, children, pets, and neighbors needing assistance";
  const effectiveTime = "active until further notice";
  const instruction =
    form.hazard === "fire"
      ? "School teams should move students upwind to the marked assembly zone, keep the service road clear for fire crews, and release students only through the controlled pickup gate."
      : form.hazard === "tsunami"
      ? "After strong shaking or an official tsunami alert, residents near coastal roads should move inland or uphill immediately and avoid returning to the shoreline."
      : form.hazard === "flood"
        ? "Ground-floor households should move people, medicines, and chargers to an upper floor before water reaches ankle depth, then avoid flooded roads."
        : form.hazard === "typhoon"
          ? "School teams should suspend outdoor pickup when wind warning is active, hold students in assigned rooms, and release only through the main covered gate."
          : "Care leads should move elders, children, and patients to the coolest available room, begin water check-ins, and escalate heat illness symptoms quickly.";
  const routeCue =
    form.hazard === "fire"
      ? "Route note: move crosswind or upwind away from smoke, avoid the service road, and leave hydrant access clear."
      : form.hazard === "tsunami"
      ? "Route note: prioritize inland streets and avoid bridges or roads marked as coastal access."
      : form.hazard === "flood"
        ? "Route note: use elevated walkways or upper-floor shelter first; do not cross moving water."
        : form.hazard === "typhoon"
          ? "Route note: keep pickup lanes clear for emergency vehicles and use the covered gate only."
          : "Route note: keep cooling areas shaded, ventilated, and reachable for mobility-limited people.";

  return {
    sourceName,
    effectiveTime,
    context: [
      "Demo retrieved bulletin for Beacon",
      `Issued by: ${sourceName}`,
      `Applies to: ${roleAnchor} in ${locationLabel}`,
      `Effective: ${effectiveTime}`,
      "",
      `Primary instruction line: ${instruction}`,
      `Timing line: ${effectiveTime}`,
      routeCue,
      "Supporting line: Keep this as retrieved guidance until a real local bulletin or OCR extract replaces it.",
    ].join("\n"),
  };
}

function formatRoleLabel(role: IntakeForm["role"]) {
  return roleOptions.find((option) => option.value === role)?.label ?? role;
}

function buildEvidenceSpotlight(result: ActionBundle): EvidenceSpotlight | null {
  const sourceReferences = buildChecklistSourceReferences(result);

  if (result.documentBrief) {
    const documentSourceDescriptor = getDocumentSourceDescriptor(result.documentBrief);
    const retrievedSource = getPrimaryRetrievedChecklistSource(result);
    return {
      sourceType: "retrieved",
      label: documentSourceDescriptor ? "Document source" : "Document cue",
      title: documentSourceDescriptor?.headline ?? "Pasted bulletin or OCR extract",
      summary:
        result.documentBrief.actionCue ??
        documentSourceDescriptor?.sentence ??
        result.documentBrief.planningAdjustments[0] ??
        "Beacon used the attached document as retrieved guidance without turning it into a verified fact.",
      evidence:
        result.documentBrief.actionCue ??
        documentSourceDescriptor?.headline ??
        result.documentBrief.extractedPoints[0],
      sourceReference: sourceReferences.retrieved.text,
      sourceLedgerAnchorId: getSourceLedgerAnchorIdForEntry(
        "retrieved",
        retrievedSource,
        result.sources.retrievedGuidance,
      ),
    };
  }

  const retrievedSource = result.sources.retrievedGuidance.find((item) => item.usedFor || item.evidence);
  if (retrievedSource) {
    return {
      sourceType: "retrieved",
      label: "Retrieved guidance",
      title: retrievedSource.title,
      summary: retrievedSource.usedFor ?? retrievedSource.summary,
      evidence: retrievedSource.evidence,
      sourceReference: sourceReferences.retrieved.text,
      sourceLedgerAnchorId: getSourceLedgerAnchorIdForEntry(
        "retrieved",
        retrievedSource,
        result.sources.retrievedGuidance,
      ),
    };
  }

  const officialTrigger = result.trustSnapshot.items.find((item) => item.title === "Move trigger");
  if (officialTrigger) {
    const officialSource = getPrimaryOfficialChecklistSource(result);
    return {
      sourceType: "official",
      label: "Official trigger",
      title: officialTrigger.title,
      summary: officialTrigger.detail,
      sourceReference: sourceReferences.official.text,
      sourceLedgerAnchorId: getSourceLedgerAnchorIdForEntry("official", officialSource, result.sources.officialFacts),
    };
  }

  const generatedNote = result.sources.generatedNotes[0];
  if (generatedNote) {
    return {
      sourceType: "generated",
      label: "Planner support",
      title: generatedNote.title,
      summary: generatedNote.summary,
      sourceReference: sourceReferences.generated.text,
      sourceLedgerAnchorId: getSourceLedgerAnchorIdForEntry("generated", generatedNote, result.sources.generatedNotes),
    };
  }

  return null;
}

function buildSourceAwareChecklistEntries(result: ActionBundle): SourceAwareChecklistEntry[] {
  const planningPosture = result.planningPosture;
  const lastIndex = planningPosture.checklist.length - 1;
  const sourceReferences = buildChecklistSourceReferences(result);

  return planningPosture.checklist.map((item, index) => {
    const sourceType = inferChecklistSourceType(item, index, lastIndex, planningPosture.primarySourceType);
    return {
      item,
      sourceType,
      rationale: describeChecklistSourceRationale(item, sourceType, index, lastIndex, planningPosture.primarySourceType),
      sourceReference: sourceReferences[sourceType].text,
      sourceLedgerAnchorId: sourceReferences[sourceType].sourceLedgerAnchorId,
    };
  });
}

function buildChecklistSourceReferences(
  result: ActionBundle,
): Record<SourceAwareChecklistEntry["sourceType"], ChecklistSourceReference> {
  const officialSource = getPrimaryOfficialChecklistSource(result);
  const retrievedSource = getPrimaryRetrievedChecklistSource(result);
  const generatedSource = getPrimaryGeneratedChecklistSource(result);

  return {
    official: {
      text: describeOfficialChecklistReference(result, officialSource),
      sourceLedgerAnchorId: getSourceLedgerAnchorIdForEntry("official", officialSource, result.sources.officialFacts),
    },
    retrieved: {
      text: describeRetrievedChecklistReference(result, retrievedSource),
      sourceLedgerAnchorId: getSourceLedgerAnchorIdForEntry(
        "retrieved",
        retrievedSource,
        result.sources.retrievedGuidance,
      ),
    },
    generated: {
      text: describeGeneratedChecklistReference(result, generatedSource),
      sourceLedgerAnchorId: getSourceLedgerAnchorIdForEntry("generated", generatedSource, result.sources.generatedNotes),
    },
  };
}

function buildExportSourceReferenceLines(result: ActionBundle) {
  const sourceReferences = buildChecklistSourceReferences(result);

  return [
    "SOURCE REFERENCES",
    `- Official facts: ${sourceReferences.official.text}`,
    `- Retrieved guidance: ${sourceReferences.retrieved.text}`,
    `- Generated recommendations: ${sourceReferences.generated.text}`,
  ];
}

function buildRiskSourceExportBrief(
  lanes: ReadonlyArray<SourceLedgerLane>,
  view: SourceLedgerView,
) {
  const riskLines: string[] = [];
  let riskItemCount = 0;
  let staleCount = 0;
  let unknownCount = 0;

  lanes.forEach((lane) => {
    lane.items.forEach((item) => {
      const freshness = getSourceTimingFreshness(item.effectiveWindow, {
        override: item.timingFreshnessOverride,
      });
      if (!freshness || (freshness.status !== "stale" && freshness.status !== "unknown")) {
        return;
      }

      riskItemCount += 1;
      if (freshness.status === "stale") {
        staleCount += 1;
      } else {
        unknownCount += 1;
      }

      riskLines.push(`${riskItemCount}. [${formatSourceTypeLabel(lane.sourceType)}] ${item.title}`);
      riskLines.push(`   Timing freshness: ${freshness.detail}`);

      if (item.effectiveWindow) {
        riskLines.push(`   Source timing: ${item.effectiveWindow}`);
      }
      if (item.timingFreshnessOverrideReason) {
        riskLines.push(`   Timing override note: ${item.timingFreshnessOverrideReason}`);
      }
      if (item.usedFor) {
        riskLines.push(`   Used in plan: ${truncateForCard(item.usedFor, 140)}`);
      }
      if (item.evidence) {
        riskLines.push(`   Evidence cue: ${truncateForCard(item.evidence, 140)}`);
      }
      riskLines.push(`   Summary: ${truncateForCard(item.summary, 180)}`);
      if (item.url) {
        riskLines.push(`   Source link: ${item.url}`);
      }
      riskLines.push("");
    });
  });

  if (riskItemCount === 0) {
    return "";
  }

  return [
    "SOURCE TIMING RISK EXPORT",
    `View: ${view === "plan-impact" ? "Plan-impact sources only" : "All source lanes"}`,
    `Risk split: ${staleCount} stale, ${unknownCount} unknown`,
    `Risk items: ${riskItemCount}`,
    "",
    "Use this block in the runbook or judge notes before relying on time-sensitive guidance.",
    "",
    ...riskLines,
  ].join("\n");
}

function getPrimaryOfficialChecklistSource(result: ActionBundle): SourceEntry | null {
  return (
    result.sources.officialFacts.find((item) => item.effectiveWindow || item.usedFor || item.evidence || item.summary) ??
    result.sources.officialFacts[0] ??
    null
  );
}

function getPrimaryRetrievedChecklistSource(result: ActionBundle): SourceEntry | null {
  return (
    result.sources.retrievedGuidance.find((item) => item.evidence || item.usedFor || item.summary) ??
    result.sources.retrievedGuidance[0] ??
    null
  );
}

function getPrimaryGeneratedChecklistSource(result: ActionBundle): SourceEntry | null {
  return (
    result.sources.generatedNotes.find((item) => item.usedFor || item.summary || item.evidence) ??
    result.sources.generatedNotes[0] ??
    null
  );
}

function getSourceLedgerAnchorIdForEntry(
  sourceType: SourceAwareChecklistEntry["sourceType"],
  entry: SourceEntry | null,
  laneItems: ReadonlyArray<SourceEntry>,
) {
  if (!entry) {
    return null;
  }

  const index = laneItems.findIndex((candidate) => candidate === entry);
  if (index < 0) {
    return null;
  }

  return buildSourceLedgerItemId(sourceType, entry.title, index);
}

function describeOfficialChecklistReference(result: ActionBundle, officialSource: SourceEntry | null) {
  const officialSignal =
    result.trustSnapshot.items.find((item) => item.title === "Move trigger" && item.sourceType === "official") ??
    result.trustSnapshot.items.find((item) => item.sourceType === "official");

  if (officialSource) {
    const cue = officialSource.effectiveWindow ?? officialSource.usedFor ?? officialSource.evidence ?? officialSource.summary;
    const triggerSuffix = officialSignal ? ` Trigger: ${truncateForCard(officialSignal.detail, 52)}` : "";
    return `Official source "${officialSource.title}": ${truncateForCard(cue, 92)}${triggerSuffix}`;
  }

  if (officialSignal) {
    return `Trust signal "${officialSignal.title}": ${truncateForCard(officialSignal.detail, 92)}`;
  }

  return "No official cue attached yet; verify with local authority before movement.";
}

function describeRetrievedChecklistReference(result: ActionBundle, retrievedSource: SourceEntry | null) {
  if (result.documentBrief) {
    const documentSourceDescriptor = getDocumentSourceDescriptor(result.documentBrief);
    const documentCue =
      result.documentBrief.actionCue ??
      result.documentBrief.timingCue ??
      result.documentBrief.extractedPoints[0] ??
      result.documentBrief.summary;

    if (retrievedSource) {
      const descriptorPrefix = documentSourceDescriptor
        ? `${documentSourceDescriptor.label} "${documentSourceDescriptor.headline}"`
        : `Retrieved source "${retrievedSource.title}"`;
      return `${descriptorPrefix}: ${truncateForCard(documentCue, 92)}`;
    }

    return `Document cue: ${truncateForCard(documentCue, 92)}`;
  }

  if (retrievedSource) {
    const cue = retrievedSource.evidence ?? retrievedSource.usedFor ?? retrievedSource.summary;
    return `Retrieved source "${retrievedSource.title}": ${truncateForCard(cue, 92)}`;
  }

  return "No retrieved cue attached; add advisory text or OCR guidance for this lane.";
}

function describeGeneratedChecklistReference(result: ActionBundle, generatedSource: SourceEntry | null) {
  if (generatedSource) {
    const cue = generatedSource.usedFor ?? generatedSource.summary ?? generatedSource.evidence;
    return `Planner note "${generatedSource.title}": ${truncateForCard(cue, 92)}`;
  }

  const generatedSignal = result.trustSnapshot.items.find((item) => item.sourceType === "generated");
  if (generatedSignal) {
    return `Generated signal "${generatedSignal.title}": ${truncateForCard(generatedSignal.detail, 92)}`;
  }

  return "No generated adaptation cue recorded for this run.";
}

function buildSourceLedgerItemId(
  sourceType: SourceAwareChecklistEntry["sourceType"],
  title: string,
  index: number,
) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 44);

  return `source-ledger-${sourceType}-${index}-${slug || "item"}`;
}

const CHECKLIST_OFFICIAL_PATTERN =
  /\b(official|bulletin|notice|alert|trigger|route|movement-ready|all-clear|city|school|clinic|barangay|local government)\b/;
const CHECKLIST_RETRIEVED_PATTERN = /\b(document|guidance|playbook|timing|schedule|advisory|re-run|rerun|refine)\b/;
const CHECKLIST_GENERATED_PATTERN =
  /\b(pack|go-bag|med|meds|role|briefing|hydration|cooling|vulnerability|group|check-in|support|stage)\b/;

function inferChecklistSourceType(
  item: string,
  index: number,
  lastIndex: number,
  primarySourceType: ActionBundle["planningPosture"]["primarySourceType"],
): "official" | "retrieved" | "generated" {
  const normalizedItem = item.toLowerCase();

  if (CHECKLIST_OFFICIAL_PATTERN.test(normalizedItem)) {
    return "official";
  }

  if (CHECKLIST_RETRIEVED_PATTERN.test(normalizedItem)) {
    return "retrieved";
  }

  if (CHECKLIST_GENERATED_PATTERN.test(normalizedItem)) {
    return "generated";
  }

  if (index === 0) {
    return primarySourceType;
  }

  if (index === lastIndex) {
    return "official";
  }

  return primarySourceType === "official" ? "retrieved" : primarySourceType;
}

function describeChecklistSourceRationale(
  item: string,
  sourceType: "official" | "retrieved" | "generated",
  index: number,
  lastIndex: number,
  primarySourceType: ActionBundle["planningPosture"]["primarySourceType"],
): string {
  const normalizedItem = item.toLowerCase();

  const keywordCue = (() => {
    if (sourceType === "official") {
      return normalizedItem.match(CHECKLIST_OFFICIAL_PATTERN)?.[0];
    }

    if (sourceType === "retrieved") {
      return normalizedItem.match(CHECKLIST_RETRIEVED_PATTERN)?.[0];
    }

    return normalizedItem.match(CHECKLIST_GENERATED_PATTERN)?.[0];
  })();

  if (keywordCue) {
    const cueLabel = sourceType === "official" ? "official" : sourceType === "retrieved" ? "guidance" : "adaptation";
    return `Keyword cue "${keywordCue}" matches ${cueLabel} language.`;
  }

  if (index === 0) {
    return `Opening checklist item mirrors the ${formatSourceTypeLabel(primarySourceType).toLowerCase()} posture.`;
  }

  if (index === lastIndex) {
    return "Final checklist item is held for official verification before movement.";
  }

  if (sourceType === "retrieved") {
    return "Defaulted to retrieved guidance to keep the middle checklist steps evidence-led.";
  }

  return "Inherited the current mission posture for this checklist step.";
}

function formatConfidenceLabel(confidenceLabel: ActionBundle["planningBasis"][number]["confidenceLabel"]) {
  switch (confidenceLabel) {
    case "grounded":
      return "Grounded";
    case "mixed":
      return "Mixed";
    case "generated":
      return "Generated";
  }
}

function formatSourceTypeLabel(sourceType: "official" | "retrieved" | "generated") {
  switch (sourceType) {
    case "official":
      return "Official facts";
    case "retrieved":
      return "Retrieved guidance";
    case "generated":
      return "Generated recommendations";
  }
}

function getSourceProofLane(sourceId: string): SourceProofLane | null {
  return sourceId === "official" || sourceId === "retrieved" || sourceId === "generated" ? sourceId : null;
}

function getSourceProofRole(sourceType: SourceProofLane) {
  switch (sourceType) {
    case "official":
      return "Fact gate";
    case "retrieved":
      return "Route cue";
    case "generated":
      return "AI support";
  }
}

function getSourceProofAction(sourceType: SourceProofLane) {
  switch (sourceType) {
    case "official":
      return "Verify trigger";
    case "retrieved":
      return "Check route";
    case "generated":
      return "Review adaptation";
  }
}

function buildTrustLaneChipMarkdown(lanes: ReadonlyArray<"official" | "retrieved" | "generated">) {
  return `Trust lanes: ${lanes.map((lane) => `[${formatSourceTypeLabel(lane)}]`).join(" ")}`;
}

function formatSourceTimingFreshnessOverrideLabel(
  value: IntakeForm["documentTimingOverride"] | SourceTimingFreshnessOverride,
) {
  switch (value) {
    case "auto":
      return "auto";
    case "active":
      return "active";
    case "stale":
      return "stale";
    case "unknown":
      return "unknown";
  }
}

function formatShareArtifactTargetLabel(target: ShareArtifactTarget) {
  switch (target) {
    case "voice":
      return "Voice handoff";
    case "action-card":
      return "Action card";
    case "flow":
      return "Flow view";
  }
}

function formatShareArtifactJumpOriginLabel(origin: ShareArtifactJumpOrigin) {
  switch (origin) {
    case "source-ledger":
      return "source ledger";
    case "document-impact":
      return "document impact";
    case "judge-demo":
      return "judge demo path";
  }
}

function formatShareArtifactJumpSourceTypeLabel(sourceType: ShareArtifactJumpSourceType) {
  switch (sourceType) {
    case "official":
      return "official";
    case "retrieved":
      return "retrieved";
    case "generated":
      return "generated";
  }
}

function getDemoOutputTrustLane(
  actionId: DemoOutputCard["actionId"],
  sourceImpactTargetsByType: Record<ShareArtifactJumpSourceType, Set<ShareArtifactTarget>>,
): DemoOutputTrustLane {
  if (actionId === "runbook") {
    return "mixed";
  }

  const artifactTarget: ShareArtifactTarget = actionId;
  const matchedLanes = (["official", "retrieved", "generated"] as const).filter((sourceType) =>
    sourceImpactTargetsByType[sourceType].has(artifactTarget),
  );

  return matchedLanes.length === 1 ? matchedLanes[0] : "mixed";
}

function getPlanImpactSourceLedgerAnchorIdForDemoOutput(
  sourceLedger: ReadonlyArray<SourceLedgerLane>,
  sourceType: ShareArtifactJumpSourceType,
  actionId: DemoOutputCard["actionId"],
) {
  if (actionId === "runbook") {
    return null;
  }

  const lane = sourceLedger.find((entry) => entry.sourceType === sourceType);
  if (!lane) {
    return null;
  }

  const sourceIndex = lane.items.findIndex((item) => {
    if (!isPlanImpactSource(item)) {
      return false;
    }

    return getPlanImpactArtifactTargets(item).includes(actionId);
  });

  if (sourceIndex < 0) {
    return null;
  }

  return buildSourceLedgerItemId(sourceType, lane.items[sourceIndex].title, sourceIndex);
}

function getFirstSourceLedgerAnchorIdForLane(
  sourceLedger: ReadonlyArray<SourceLedgerLane>,
  sourceType: ShareArtifactJumpSourceType,
) {
  const lane = sourceLedger.find((entry) => entry.sourceType === sourceType);
  if (!lane || lane.items.length === 0) {
    return null;
  }

  return buildSourceLedgerItemId(sourceType, lane.items[0].title, 0);
}

function getSourceLedgerItemCountForLane(
  sourceLedger: ReadonlyArray<SourceLedgerLane>,
  sourceType: ShareArtifactJumpSourceType,
) {
  const lane = sourceLedger.find((entry) => entry.sourceType === sourceType);
  return lane?.items.length ?? 0;
}

function formatDemoOutputTrustLaneLabel(lane: DemoOutputTrustLane) {
  switch (lane) {
    case "official":
      return "official";
    case "retrieved":
      return "retrieved";
    case "generated":
      return "generated";
    case "mixed":
      return "mixed";
  }
}

function getTrustLaneToneClass(lane: DemoOutputTrustLane) {
  switch (lane) {
    case "official":
      return "tone-official";
    case "retrieved":
      return "tone-retrieved";
    case "generated":
      return "tone-generated";
    case "mixed":
      return "tone-mixed";
  }
}

function getSignalToneClass(status: "ready" | "confirm" | "advisory") {
  switch (status) {
    case "ready":
      return "status-ready";
    case "confirm":
      return "status-confirm";
    case "advisory":
      return "status-advisory";
  }
}

function getConfidenceToneClass(confidenceLabel: ActionBundle["planningBasis"][number]["confidenceLabel"]) {
  switch (confidenceLabel) {
    case "grounded":
      return "status-ready";
    case "mixed":
      return "tone-official";
    case "generated":
      return "tone-generated";
  }
}

function normalizeImportedText(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function hasRetrievedGuidanceContext(value: string) {
  const normalized = normalizeImportedText(value);
  if (!normalized) {
    return false;
  }

  return !isOcrScaffoldAwaitingVerbatim(normalized);
}

function isOcrScaffoldAwaitingVerbatim(value: string) {
  const normalized = normalizeImportedText(value);
  if (!normalized) {
    return false;
  }

  if (!normalized.toLowerCase().includes(ocrImportScaffoldHeader.toLowerCase())) {
    return false;
  }

  return extractVerbatimOcrText(normalized).length === 0;
}

function extractVerbatimOcrText(value: string) {
  const normalized = normalizeImportedText(value);
  const lines = normalized.split("\n");
  const markerIndex = lines.findIndex(
    (line) => line.trim().toLowerCase() === ocrVerbatimMarker.toLowerCase(),
  );

  if (markerIndex === -1) {
    return "";
  }

  return lines.slice(markerIndex + 1).join("\n").trim();
}

function formatImportedSourceLabel(fileName: string) {
  const normalizedName = fileName.trim();
  if (!normalizedName) {
    return "Imported source";
  }

  const baseName = normalizedName.replace(/\.[^./\\]+$/, "").trim();
  return baseName || normalizedName;
}

function isTraceableSourceLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return normalized !== manualSourceLabelPlaceholder.toLowerCase();
}

function isAuthorityTaggedSourceLabel(value: string) {
  if (!isTraceableSourceLabel(value)) {
    return false;
  }

  return sourceAuthorityKeywordPattern.test(value.trim());
}

function extractSourceLabelCandidate(value: string) {
  const lines = normalizeImportedText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 24);

  const patterns = [
    /^(issued by|issuer|agency|office|department|from|source)\s*[:\-]\s*(.+)$/i,
    /^(issued by|issuer|agency|office|department|from|source)\s+(.+)$/i,
  ];

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);

      if (!match) {
        continue;
      }

      const candidate = normalizeSourceLabel(match[2] ?? "");
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

function extractEffectiveTimeCandidate(value: string) {
  const lines = normalizeImportedText(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 32);

  const keyValuePatterns = [
    /^(effective(?:\s+(?:date|time|window))?|valid(?:ity)?(?:\s+(?:from|until|through|to))?|issued(?:\s+on)?|date|as of|timestamp|time)\s*[:\-]\s*(.+)$/i,
    /^(effective(?:\s+(?:date|time|window))?|valid(?:ity)?(?:\s+(?:from|until|through|to))?|issued(?:\s+on)?|date|as of|timestamp|time)\s+(.+)$/i,
  ];
  const timingTokenPattern =
    /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?|\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|today|tonight|tomorrow)\b/i;
  const timingCuePattern =
    /\b(?:effective|valid|issued|window|until|through|between|from|to|as of|curfew|start|starting|ending|expires?)\b/i;

  for (const line of lines) {
    for (const pattern of keyValuePatterns) {
      const match = line.match(pattern);

      if (!match) {
        continue;
      }

      const candidate = normalizeSourceTiming(match[2] ?? "");
      if (candidate) {
        return candidate;
      }
    }

    if (timingTokenPattern.test(line) && timingCuePattern.test(line)) {
      const candidate = normalizeSourceTiming(line);
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

function normalizeSourceLabel(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim().replace(/[.,"'`]+$/, "");
  if (cleaned.length < 3) {
    return null;
  }

  return cleaned.length > 96 ? `${cleaned.slice(0, 95).trimEnd()}…` : cleaned;
}

function normalizeSourceTiming(value: string) {
  const cleaned = value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,"'`]+$/, "")
    .replace(/^(?:effective|valid(?:ity)?|issued(?:\s+on)?|date|as of|timestamp|time)\s*[:\-]?\s*/i, "")
    .trim();
  if (cleaned.length < 4) {
    return null;
  }

  return cleaned.length > 112 ? `${cleaned.slice(0, 111).trimEnd()}…` : cleaned;
}

function buildOcrHandoff(
  fileName: string,
  intake: IntakeForm,
  locationLabel: string,
  hazardLabel: string,
): OcrHandoff {
  const fileKindLabel = describeBinarySourceFile(fileName);
  const preserveFields = [
    "Issuing authority, office, or sender name",
    getRoleAnchorLabel(intake.role),
    "Exact action orders, closures, or movement wording",
    "Dates, times, validity windows, and alert levels",
    "Route, pickup, shelter, gate, or contact details",
  ];
  const focusFields = getOcrFocusFields(intake);
  const prompt = [
    `Extract readable text from ${fileName} for Beacon.`,
    `Scenario: ${hazardLabel.toLowerCase()} planning for a ${intake.role} in ${locationLabel}.`,
    "",
    "Return format:",
    "- Plain text only.",
    "- Keep headings and bullet points on separate lines.",
    "- Preserve original wording and ordering when possible.",
    "- Mark uncertain OCR with [unclear].",
    "- Do not summarize or paraphrase.",
    "",
    "Preserve these fields if present:",
    ...preserveFields.map((item) => `- ${item}`),
    "",
    "Prioritize these scenario cues:",
    ...focusFields.map((item) => `- ${item}`),
    "",
    "If the source contains evacuation language, closure notices, pickup instructions, timing windows, or route restrictions, keep those lines verbatim.",
  ].join("\n");

  return {
    headline: `${fileKindLabel} ready for OCR handoff`,
    detail:
      "Beacon does not fake OCR. It gives you a clean extraction brief so the text that comes back is usable for source-aware planning on the next pass.",
    preserveFields,
    focusFields,
    prompt,
    pasteTemplate: buildOcrPasteTemplate(fileName, fileKindLabel),
  };
}

function buildOcrPasteTemplate(fileName: string, fileKindLabel: string) {
  return [
    ocrImportScaffoldHeader,
    `Source file: ${fileName}`,
    `Source kind: ${fileKindLabel}`,
    "",
    "Issued by:",
    "Applies to:",
    "",
    "Primary instruction line:",
    "Timing line:",
    "Effective date/time:",
    "Supporting lines:",
    "",
    ocrVerbatimMarker,
  ].join("\n");
}

function mergeDocumentContextWithTemplate(currentContext: string, template: string) {
  const normalizedContext = currentContext.trim();

  if (!normalizedContext) {
    return {
      nextContext: template,
      inserted: true,
    };
  }

  if (normalizedContext.includes(template)) {
    return {
      nextContext: normalizedContext,
      inserted: false,
    };
  }

  return {
    nextContext: `${normalizedContext}\n\n${template}`,
    inserted: true,
  };
}

function describeBinarySourceFile(fileName: string) {
  const lowered = fileName.toLowerCase();

  if (lowered.endsWith(".pdf")) {
    return "PDF source";
  }

  if (lowered.endsWith(".doc") || lowered.endsWith(".docx")) {
    return "Document source";
  }

  return "Image source";
}

function getRoleAnchorLabel(role: IntakeForm["role"]) {
  switch (role) {
    case "school":
      return "School, campus, room, or pickup point name";
    case "clinic":
      return "Clinic, hospital, ward, or transfer destination name";
    case "household":
      return "Barangay, building, shelter, or household anchor location";
  }
}

function getOcrFocusFields(intake: IntakeForm) {
  const roleFocus =
    intake.role === "school"
      ? [
          "Dismissal, closure, or class suspension instructions",
          "Parent pickup windows, gates, or reunification rules",
        ]
      : intake.role === "clinic"
        ? [
            "Transfer, triage, generator, or medicine handling instructions",
            "Patient movement constraints and backup care routing",
          ]
        : [
            "Household movement trigger, regroup point, or shelter order",
            "Building access, floor, or transport constraints",
          ];

  const hazardFocus =
    intake.hazard === "fire"
      ? [
          "Evacuation order, smoke direction, perimeter, or assembly point wording",
          "Hydrant access, response lane, pickup gate, or re-entry restrictions",
        ]
      : intake.hazard === "tsunami"
      ? [
          "Move inland, move uphill, or stay away from coastal roads wording",
          "Wave timing, all-clear, or coastal access restrictions",
        ]
      : intake.hazard === "flood"
        ? [
            "Road closure, rising water, or power shutoff instructions",
            "Shelter, pickup, or overnight movement timing",
          ]
        : intake.hazard === "typhoon"
          ? [
              "Suspension, storm signal, or evacuation trigger wording",
              "Wind, flooding overlap, or shelter timing details",
            ]
          : [
              "Cooling center, hydration, or exposure-limit instructions",
              "Heat warning windows and vulnerable-person checks",
            ];

  return [...roleFocus, ...hazardFocus];
}

function isTextLikeSourceFile(file: File) {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return (
    fileType.startsWith("text/") ||
    fileType === "application/json" ||
    [".txt", ".md", ".markdown", ".json", ".csv", ".log"].some((extension) =>
      fileName.endsWith(extension),
    )
  );
}

function isHookableBinarySourceFile(file: File) {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return (
    fileType.startsWith("image/") ||
    fileType === "application/pdf" ||
    fileType === "application/msword" ||
    fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp", ".heic"].some((extension) =>
      fileName.endsWith(extension),
    )
  );
}

function ChoiceButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={`choiceButton ${active ? "isActive" : ""}`} type="button" onClick={onClick}>
      {label}
    </button>
  );
}

function Field({
  children,
  hint,
  label,
}: {
  children: React.ReactNode;
  hint?: string;
  label: string;
}) {
  return (
    <label className="fieldBlock">
      <span>{label}</span>
      {children}
      {hint ? <small className="fieldHint">{hint}</small> : null}
    </label>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="metricTile">
      <p className="detailLabel">{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function Stepper({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <div className="stepper">
      <span>{label}</span>
      <div>
        <button type="button" onClick={() => onChange(Math.max(0, value - 1))}>
          -
        </button>
        <strong>{value}</strong>
        <button type="button" onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}
