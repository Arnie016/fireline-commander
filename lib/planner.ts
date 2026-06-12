import {
  buildDocumentBrief,
  getDocumentSourceDescriptor,
  summarizeDocumentContext,
} from "@/lib/document-context";
import { enhanceWithOllama } from "@/lib/ollama";
import {
  buildRouteContext,
  geocodeLocation,
  getDestinations,
  getWeatherSnapshot,
} from "@/lib/live-context";
import { getGuidanceDocs, getHazardPlaybook } from "@/lib/guidance";
import {
  actionBundleSchema,
  type ActionBundle,
  type IntakeForm,
  type SourceEntry,
} from "@/lib/schema";

export async function buildGroundedPlan(intake: IntakeForm): Promise<ActionBundle> {
  const place = await geocodeLocation(intake.location);
  const weather = await getWeatherSnapshot(place.latitude, place.longitude);
  const playbook = getHazardPlaybook(intake.hazard);
  const pastedDocumentContext = intake.documentContext.trim();
  const documentSourceName = intake.documentSourceName.trim();
  const documentEffectiveTime = intake.documentEffectiveTime.trim();
  const documentTimingOverride = intake.documentTimingOverride;
  const documentTimingOverrideReason = intake.documentTimingOverrideReason.trim();
  const builtInGuidanceDocs = getGuidanceDocs(intake.hazard);
  const builtInGuidanceCount = builtInGuidanceDocs.length;
  const hasDocumentContext = Boolean(pastedDocumentContext);
  const hasDocumentEffectiveTime = Boolean(documentEffectiveTime);
  const hasDocumentTimingOverride = documentTimingOverride !== "auto";
  const hasDocumentTimingOverrideReason = Boolean(documentTimingOverrideReason);
  const documentBrief = pastedDocumentContext
    ? buildDocumentBrief(pastedDocumentContext)
    : undefined;
  const effectiveWindow = hasDocumentEffectiveTime ? documentEffectiveTime : documentBrief?.timingCue;
  const documentSourceDescriptor = getDocumentSourceDescriptor(documentBrief);
  const retrievedGuidance: SourceEntry[] = builtInGuidanceDocs.map((doc) => ({
    title: doc.title,
    summary: doc.summary,
    url: doc.url,
    usedFor: buildGuidanceUsage(doc.title, intake.hazard),
  }));
  if (pastedDocumentContext) {
    retrievedGuidance.unshift({
      title: documentSourceName
        ? `Document extract (${documentSourceName})`
        : "Pasted bulletin or OCR extract",
      summary: documentSourceDescriptor
        ? `${documentSourceDescriptor.sentence} ${
            hasDocumentEffectiveTime
              ? `Timing to verify: ${documentEffectiveTime}. `
              : ""
          }${summarizeDocumentContext(pastedDocumentContext)}`
        : `${hasDocumentEffectiveTime ? `Timing to verify: ${documentEffectiveTime}. ` : ""}${summarizeDocumentContext(
            pastedDocumentContext,
          )}`,
      usedFor:
        documentBrief?.planningAdjustments[0] ??
        (documentSourceName
          ? `Used guidance from ${documentSourceName} as scenario-specific retrieved context without upgrading it into a verified fact.`
          : "Used as scenario-specific retrieved guidance without upgrading it into a verified fact."),
      evidence:
        documentBrief?.actionCue ??
        (hasDocumentEffectiveTime ? `Timing to verify: ${documentEffectiveTime}` : undefined) ??
        documentBrief?.timingCue ??
        documentSourceDescriptor?.headline ??
        documentBrief?.extractedPoints[0],
      effectiveWindow,
      timingFreshnessOverride:
        hasDocumentTimingOverride && effectiveWindow ? documentTimingOverride : undefined,
      timingFreshnessOverrideReason:
        hasDocumentTimingOverride && effectiveWindow && hasDocumentTimingOverrideReason
          ? documentTimingOverrideReason
          : undefined,
    });
  }
  const destinations = getDestinations(place.latitude, place.longitude, intake.hazard);
  const routeContext = buildRouteContext(place, intake.hazard, intake.weakInternet);

  const officialFacts = [
    {
      title: "Location fix",
      summary: `${place.name}${place.admin1 ? `, ${place.admin1}` : ""}${place.country ? `, ${place.country}` : ""}.`,
      url: "https://open-meteo.com/en/docs/geocoding-api",
    },
    weather
      ? {
          title: "Open-Meteo live weather context",
          summary: `${weather.headline}. ${weather.summary}`,
          url: "https://open-meteo.com/en/docs",
        }
      : {
          title: "Weather context unavailable",
          summary:
            "Live forecast context could not be pulled right now, so this plan leans more heavily on the hazard playbook and official local bulletins.",
        },
  ];

  const basePlan: ActionBundle = {
    actionCardTitle: `${titleCase(intake.hazard)} action card for ${place.name}`,
    engineLabel: "Beacon grounded planner",
    summary: buildSummary(intake, place.name, weather?.headline),
    planningPosture: buildPlanningPosture(
      intake,
      place.name,
      Boolean(weather),
      builtInGuidanceCount,
      hasDocumentContext,
    ),
    planningInputs: buildPlanningInputs(
      intake,
      place.name,
      Boolean(weather),
      builtInGuidanceCount,
      hasDocumentContext,
      hasDocumentEffectiveTime,
    ),
    trustSnapshot: buildTrustSnapshot(
      intake,
      place.name,
      Boolean(weather),
      builtInGuidanceCount,
      hasDocumentContext,
      hasDocumentEffectiveTime,
    ),
    documentBrief,
    planningBasis: buildPlanningBasis(
      intake,
      Boolean(weather),
      builtInGuidanceCount,
      hasDocumentContext,
    ),
    immediateActions: playbook.immediateActions,
    evacuation: {
      decision: buildDecision(intake, place.name),
      routeContext,
      destinations,
    },
    goBag: buildGoBag(intake),
    specialInstructions: buildSpecialInstructions(intake),
    verification: buildVerification(intake, playbook.verificationCadence),
    voiceBriefing: {
      language: intake.language,
      script: buildVoiceScript(intake, place.name),
    },
    flowchart: buildFlowchart(intake.hazard),
    sources: {
      officialFacts,
      retrievedGuidance,
      generatedNotes: [
        {
          title: "Role adaptation",
          summary: `The plan tone and checklist were adapted for a ${intake.role} workflow with household composition and access constraints.`,
        },
        {
          title: "Constraint adaptation",
          summary: intake.mobilityNeeds
            ? `Mobility note included: ${intake.mobilityNeeds}.`
            : "No explicit mobility constraint was provided, so the plan uses standard movement assumptions.",
        },
        {
          title: "Connectivity mode",
          summary: intake.weakInternet
            ? "Low-connectivity mode is active, so the plan favors SMS, radio, and pre-agreed regrouping."
            : "Standard connectivity mode is active, but the plan still recommends a backup check-in method.",
        },
      ],
    },
  };

  const enhancement = await enhanceWithOllama({ basePlan, intake });
  const finalPlan = enhancement
    ? {
        ...basePlan,
        actionCardTitle: enhancement.actionCardTitle,
        summary: enhancement.summary,
        voiceBriefing: {
          ...basePlan.voiceBriefing,
          script: enhancement.voiceScript,
        },
        engineLabel: `Gemma via Ollama (${process.env.OLLAMA_MODEL ?? "gemma4:26b"})`,
      }
    : basePlan;

  return actionBundleSchema.parse(finalPlan);
}

function buildSummary(intake: IntakeForm, placeName: string, weatherHeadline?: string) {
  const roleLabel = intake.role === "household" ? "household" : intake.role;
  const peopleBits = [
    intake.adults > 0 ? `${intake.adults} adults` : null,
    intake.children > 0 ? `${intake.children} children` : null,
    intake.elders > 0 ? `${intake.elders} elders` : null,
    intake.pets > 0 ? `${intake.pets} pets` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    `This ${titleCase(intake.hazard)} plan is tuned for a ${roleLabel} in ${placeName}${peopleBits ? ` with ${peopleBits}` : ""}.`,
    weatherHeadline ? `Current context: ${weatherHeadline}.` : null,
    intake.notes ? `Planner note: ${intake.notes}` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildPlanningBasis(
  intake: IntakeForm,
  hasLiveWeather: boolean,
  builtInGuidanceCount: number,
  hasDocumentContext: boolean,
): ActionBundle["planningBasis"] {
  const hasRetrievedContext = builtInGuidanceCount > 0 || hasDocumentContext;

  return [
    {
      section: "Immediate action card",
      basis:
        intake.hazard === "heatwave"
          ? "Built mostly from the hazard playbook and any live weather context so the first steps match the current heat pattern."
          : "Built from the hazard playbook first, then tightened with live conditions when available so the first moves stay practical.",
      sourceTypes: hasLiveWeather ? ["official", "retrieved"] : ["retrieved", "generated"],
      confidenceLabel: hasLiveWeather ? "grounded" : "mixed",
    },
    {
      section: "Evacuation and route context",
      basis:
        "Anchored to the geocoded location and preloaded safer destinations, then adapted for hazard type and connectivity constraints.",
      sourceTypes: ["official", "generated"],
      confidenceLabel: "mixed",
    },
    {
      section: "Go-bag and special instructions",
      basis:
        "Uses the household or facility profile you entered, including medications, dependents, pets, and mobility constraints.",
      sourceTypes: ["generated"],
      confidenceLabel: "generated",
    },
    {
      section: "Voice briefing",
      basis:
        hasDocumentContext
          ? "Condenses the highest-priority actions into a short spoken brief while preserving the official-first ordering and any pasted document cue."
          : hasRetrievedContext
            ? "Condenses the highest-priority actions into a short spoken brief while preserving the official-first ordering."
            : "Condenses the current plan into a short spoken brief for phone trees or TTS playback.",
      sourceTypes:
        hasRetrievedContext ? ["official", "retrieved", "generated"] : ["official", "generated"],
      confidenceLabel: hasRetrievedContext ? "mixed" : "generated",
    },
  ];
}

function buildPlanningPosture(
  intake: IntakeForm,
  placeName: string,
  hasLiveWeather: boolean,
  builtInGuidanceCount: number,
  hasDocumentContext: boolean,
): ActionBundle["planningPosture"] {
  const hasRetrievedContext = builtInGuidanceCount > 0 || hasDocumentContext;

  if (!hasLiveWeather) {
    return {
      mode: "verify-now",
      headline: "Verify now",
      reason: `Beacon fixed ${placeName}, but live weather context is missing, so confirm the latest official bulletin before treating this run as movement-ready.`,
      checklist: [
        "Check the latest official hazard bulletin or local evacuation notice.",
        "Confirm whether the first route and destination are still usable right now.",
        "Keep packing and group briefing active while that confirmation comes in.",
      ],
      primarySourceType: "official",
    };
  }

  if (!hasRetrievedContext) {
    return {
      mode: "verify-now",
      headline: "Verify now",
      reason: "This run has factual location and weather context, but no retrieved guidance pack shaped the sequence, so official instructions should carry more weight.",
      checklist: [
        "Read the latest city, school, clinic, or barangay instructions first.",
        "Use Beacon's packing and coordination steps as prep support, not final movement authority.",
        "Re-run or refine the plan once local guidance is available.",
      ],
      primarySourceType: "official",
    };
  }

  if (intake.hazard === "heatwave") {
    return {
      mode: "prep-now",
      headline: "Prep now",
      reason: `Beacon has enough official and retrieved context for ${placeName} to start cooling, hydration, and check-in prep immediately while monitoring for heat escalation.`,
      checklist: [
        "Start hydration, cooling, and vulnerability checks now.",
        "Stage medications, power, and transport for anyone heat-sensitive.",
        "Escalate movement if symptoms worsen or an official heat advisory tightens.",
      ],
      primarySourceType: "retrieved",
    };
  }

  if (intake.hazard === "fire") {
    return {
      mode: "move-on-trigger",
      headline: "Evacuate on command",
      reason: `Beacon has enough official and retrieved context for ${placeName} to stage evacuation roles now and move as soon as fire command, smoke, or heat exposure crosses the trigger.`,
      checklist: [
        "Stage the group upwind and away from smoke without blocking fire response lanes.",
        "Assign room sweep, medication, child, and mobility leads before movement starts.",
        "Move when incident command, visible smoke, or heat exposure confirms the trigger.",
      ],
      primarySourceType: "official",
    };
  }

  return {
    mode: "move-on-trigger",
    headline: "Move on trigger",
    reason: `Beacon has both factual context and retrieved guidance for ${placeName}, so the plan is ready for staging now and immediate movement once the official or on-ground trigger appears.`,
    checklist: [
      "Stage go-bags, meds, IDs, and departure roles now.",
      "Watch the move trigger and route status without waiting until the last minute.",
      "Leave as soon as the official alert or physical hazard matches the trigger in Mission control.",
    ],
    primarySourceType: "official",
  };
}

function buildPlanningInputs(
  intake: IntakeForm,
  placeName: string,
  hasLiveWeather: boolean,
  builtInGuidanceCount: number,
  hasDocumentContext: boolean,
  hasDocumentEffectiveTime: boolean,
): ActionBundle["planningInputs"] {
  const profileBits = [
    `${intake.adults} adults`,
    intake.children > 0 ? `${intake.children} children` : null,
    intake.elders > 0 ? `${intake.elders} elders` : null,
    intake.pets > 0 ? `${intake.pets} pets` : null,
    intake.medications.trim() ? "medication needs" : null,
    intake.mobilityNeeds.trim() ? "mobility support" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    {
      title: hasLiveWeather ? "Live location and weather context" : "Location fix without live weather",
      detail: hasLiveWeather
        ? `Beacon geocoded ${placeName} and attached current weather as factual context for this ${intake.hazard} run.`
        : `Beacon geocoded ${placeName}, but weather retrieval failed, so live conditions need an extra official check.`,
      sourceType: "official",
      status: hasLiveWeather ? "ready" : "confirm",
    },
    {
      title: "Built-in guidance lane",
      detail:
        builtInGuidanceCount > 0
          ? `${builtInGuidanceCount} built-in hazard guidance source${builtInGuidanceCount === 1 ? "" : "s"} shaped the action order and verification rhythm.`
          : hasDocumentContext
            ? "No built-in guidance source was attached, but Beacon is still using the pasted bulletin or OCR cue as retrieved guidance."
          : "No guidance pack was attached for this run, so the planner leaned more on built-in playbooks and official monitoring.",
      sourceType: "retrieved",
      status: builtInGuidanceCount > 0 || hasDocumentContext ? "ready" : "confirm",
    },
    {
      title: hasDocumentContext ? "Pasted document cue attached" : "No pasted document cue",
      detail: hasDocumentContext
        ? hasDocumentEffectiveTime
          ? "A pasted bulletin, memo, or OCR extract was folded into retrieved guidance with an attached effective window so Beacon can keep source timing visible."
          : "A pasted bulletin, memo, or OCR extract was folded into retrieved guidance so Beacon can sequence around scenario-specific wording."
        : "You can paste a bulletin, memo, or OCR extract to make the next run more document-aware without changing Beacon's source separation.",
      sourceType: "retrieved",
      status: hasDocumentContext ? "ready" : "advisory",
    },
    {
      title: `${titleCase(intake.role)} profile and constraints`,
      detail: `This plan was adapted for ${profileBits || "the provided role profile"} in ${placeName}.`,
      sourceType: "generated",
      status: "advisory",
    },
    {
      title: intake.weakInternet ? "Low-connectivity mode" : "Standard-connectivity mode",
      detail: intake.weakInternet
        ? "Beacon biased toward radio, SMS, and pre-agreed regrouping because weak connectivity was flagged."
        : "Beacon assumed normal data access but still keeps backup check-in instructions in the plan.",
      sourceType: "generated",
      status: "advisory",
    },
  ];
}

function buildTrustSnapshot(
  intake: IntakeForm,
  placeName: string,
  hasLiveWeather: boolean,
  builtInGuidanceCount: number,
  hasDocumentContext: boolean,
  hasDocumentEffectiveTime: boolean,
): ActionBundle["trustSnapshot"] {
  const hazardSignal =
    intake.hazard === "fire"
      ? "fire-service evacuation, visible smoke in the building, or heat exposure near the route"
      : intake.hazard === "tsunami"
      ? "strong shaking or an official tsunami advisory"
      : intake.hazard === "flood"
        ? "floodwater cutting access or an LGU evacuation order"
        : intake.hazard === "typhoon"
          ? "an official severe weather bulletin or pre-emptive evacuation order"
          : "heat illness symptoms or an official extreme-heat advisory";

  return {
    headline:
      "Use Beacon to organize the move, but confirm the highest-stakes trigger with official alerts or direct on-ground conditions.",
    items: [
      {
        title: "Move trigger",
        detail: `Treat ${hazardSignal} in ${placeName} as the main confirmation to escalate from planning into movement.`,
        sourceType: "official",
        status: "confirm",
      },
      {
        title: hasLiveWeather ? "Live conditions attached" : "Live conditions missing",
        detail: hasLiveWeather
          ? "Current weather context is attached as factual background, but it does not replace agency warnings."
          : "Weather fetch failed, so this run leans more heavily on hazard playbooks and official local bulletins.",
        sourceType: "official",
        status: hasLiveWeather ? "ready" : "confirm",
      },
      {
        title: "Retrieved guidance lane",
        detail:
          builtInGuidanceCount > 0
            ? `Beacon attached ${builtInGuidanceCount} built-in guidance source${builtInGuidanceCount === 1 ? "" : "s"} to shape phrasing and sequencing${
                hasDocumentContext
                  ? hasDocumentEffectiveTime
                    ? ", plus a pasted document cue with an attached effective window"
                    : ", plus a pasted document cue"
                  : ""
              }.`
            : hasDocumentContext
              ? hasDocumentEffectiveTime
                ? "Beacon is using the pasted bulletin or OCR cue as retrieved guidance with an attached effective window, but there is no additional built-in guidance source attached for this scenario."
                : "Beacon is using the pasted bulletin or OCR cue as retrieved guidance, but there is no additional built-in guidance source attached for this scenario."
              : "No retrieved guidance was attached for this scenario, so rely more heavily on official updates.",
        sourceType: "retrieved",
        status: builtInGuidanceCount > 0 || hasDocumentContext ? "ready" : "confirm",
      },
      {
        title: "Household adaptation",
        detail:
          "Role, mobility, medication, and connectivity adjustments are generated planning help. Use them to prepare now, then refine them as official instructions change.",
        sourceType: "generated",
        status: "advisory",
      },
    ],
  };
}

function buildDecision(intake: IntakeForm, placeName: string) {
  switch (intake.hazard) {
    case "fire":
      return `If fire command orders evacuation, smoke enters occupied areas, or heat blocks normal exits near ${placeName}, move upwind to the first safe assembly point and keep response lanes clear.`;
    case "tsunami":
      return `If you feel strong shaking, receive a tsunami advisory, or are already in a low coastal zone near ${placeName}, do not wait for visual confirmation. Move inland and upward immediately.`;
    case "flood":
      return `If water is already cutting roads, drains are backing up, or your floor level is exposed in ${placeName}, evacuate before dark or before water enters the home.`;
    case "typhoon":
      return `If your building is not storm-secure, your route floods early, or local officials issue pre-emptive evacuation for ${placeName}, shift to shelter before peak winds arrive.`;
    case "heatwave":
      return `If indoor heat is becoming unsafe, a vulnerable person is symptomatic, or cooling power is unstable in ${placeName}, move to a cooler facility before midday peak heat.`;
  }
}

function buildGoBag(intake: IntakeForm) {
  const items = [
    "Water, oral rehydration salts, and shelf-stable food for at least 72 hours",
    "IDs, emergency contacts, cash, and a printed regrouping plan",
    "Charged power bank, flashlight, and battery radio",
    "First-aid kit, masks, and hygiene supplies packed in a waterproof pouch",
  ];

  if (intake.hazard === "tsunami") {
    items.push("Shoes, a grab-and-go outer layer, and a route note toward inland high ground");
  }
  if (intake.hazard === "fire") {
    items.push("N95 or smoke masks if available, room roster, flashlight, and a written upwind assembly point");
  }
  if (intake.hazard === "flood") {
    items.push("Dry bags for documents and clothes, plus sandals or boots for contaminated water");
  }
  if (intake.hazard === "typhoon") {
    items.push("Window-safe shelter kit, tarps or tape, and extra lighting for longer outages");
  }
  if (intake.hazard === "heatwave") {
    items.push("Cooling towels, spare drinking water containers, and backup charging for fans or health devices");
  }
  if (intake.medications.trim()) {
    items.push(`Medication reserve: ${intake.medications.trim()}`);
  }

  return items;
}

function buildSpecialInstructions(intake: IntakeForm) {
  const sections: ActionBundle["specialInstructions"] = [];

  if (intake.elders > 0) {
    sections.push({
      title: "Elders and high-risk adults",
      items: [
        "Pack meds, spare glasses, and a one-page medical summary where one person can reach it fast.",
        "Assign one movement buddy and one remote check-in contact before departure.",
        "Avoid last-minute stair decisions; pre-pick the first rest stop or transfer point now.",
      ],
    });
  }

  if (intake.children > 0) {
    sections.push({
      title: "Children and dependents",
      items: [
        "Give each child a simple reunion rule, one contact card, and one known adult lead.",
        "Use a script they can repeat under stress: name, regrouping point, and who to follow.",
        "Pack one comfort item only if it does not slow movement or reduce water space.",
      ],
    });
  }

  if (intake.pets > 0) {
    sections.push({
      title: "Pets and animals",
      items: [
        "Keep one leash or carrier at the door and pre-pack food, water, and vaccination proof if available.",
        "Do not delay the move because pets are unprepared; load the kit in the same grab zone as the human go-bag.",
      ],
    });
  }

  if (intake.mobilityNeeds.trim()) {
    sections.push({
      title: "Mobility and access needs",
      items: [
        `Specific mobility note: ${intake.mobilityNeeds.trim()}`,
        "Check whether the first route leg includes stairs, tight transfers, or uneven surfaces.",
        "If transport is needed, trigger that request early instead of after the alert escalates.",
      ],
    });
  }

  if (sections.length === 0) {
    sections.push({
      title: "Household coordination",
      items: [
        "Name one departure lead, one document lead, and one contact lead now.",
        "Store the go-bag and shoes at the same exit point so the first move is obvious.",
      ],
    });
  }

  return sections;
}

function buildVerification(intake: IntakeForm, cadence: string) {
  const items = [
    `Re-check official advisories at least ${cadence} until the situation stabilizes.`,
    "Follow city, barangay, school, or clinic instructions before any model recommendation if they conflict.",
    "If the situation changes on the ground faster than the forecast, trust the physical hazard and move earlier.",
  ];

  if (intake.weakInternet) {
    items.push("Keep one radio, SMS chain, or printed regrouping plan active in case data service drops.");
  }

  return items;
}

function buildVoiceScript(intake: IntakeForm, placeName: string) {
  const opener =
    intake.language === "Tagalog"
      ? `Beacon briefing para sa ${placeName}.`
      : intake.language === "Simplified English"
        ? `Beacon plan for ${placeName}.`
        : `Beacon emergency briefing for ${placeName}.`;

  const core =
    intake.hazard === "fire"
      ? "Move upwind away from smoke and heat, account for everyone, and keep fire response lanes clear."
      : intake.hazard === "tsunami"
      ? "Move inland or to higher ground now. Do not wait to confirm the wave."
      : intake.hazard === "flood"
        ? "Move people, medicines, and documents above water line and leave before roads close."
        : intake.hazard === "typhoon"
          ? "Secure the shelter, monitor the bulletin, and move before wind and flood overlap."
          : "Reduce heat exposure, hydrate early, and move vulnerable people into cooler spaces.";

  const closer =
    intake.language === "Tagalog"
      ? "Sundin ang opisyal na abiso at manatiling magkasama ang grupo."
      : "Follow official instructions first and keep the group on the same movement plan.";

  return [opener, core, closer].join(" ");
}

function buildFlowchart(hazard: IntakeForm["hazard"]) {
  const hazardLabel = titleCase(hazard);
  return [
    "flowchart TD",
    `A[Receive ${hazardLabel} signal] --> B{Immediate danger or official evacuation?}`,
    "B -->|Yes| C[Grab meds, IDs, water, and move now]",
    "B -->|No| D[Pack go bag and stage departure]",
    "C --> E[Check in with household or facility lead]",
    "D --> E",
    "E --> F[Verify official bulletins and route status]",
    "F --> G[Stay out until official all-clear or safer conditions]",
  ].join("\n");
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildGuidanceUsage(title: string, hazard: IntakeForm["hazard"]) {
  if (/pagasa/i.test(title)) {
    return "Used to keep official bulletin checks and escalation timing near the front of the plan.";
  }

  if (/phivolcs earthquake preparedness/i.test(title)) {
    return "Used to prioritize immediate uphill or inland movement after strong shaking instead of waiting for visual confirmation.";
  }

  if (/phivolcs tsunami readiness/i.test(title)) {
    return "Used to keep tsunami evacuation language short, early, and community-action oriented in the action card and voice brief.";
  }

  if (/open-meteo/i.test(title)) {
    return hazard === "fire"
      ? "Used as factual background for wind and heat context while leaving evacuation authority with fire-service or local incident command."
      : hazard === "heatwave"
      ? "Used as factual background for heat conditions while leaving the movement trigger anchored to official advisories and symptoms."
      : "Used as factual background only, so route and urgency wording can reflect current conditions without replacing agency warnings.";
  }

  if (/bfp|fire/i.test(title)) {
    return "Used to keep evacuation, smoke exposure, and response-lane instructions aligned with fire-service authority.";
  }

  return "Used as retrieved guidance to shape the plan order and verification rhythm.";
}
