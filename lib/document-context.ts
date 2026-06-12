import type { DocumentBrief } from "@/lib/schema";

export type DocumentSourceFact = {
  kind: "issuingAuthority" | "facilityName";
  label: "Issuing authority" | "Facility anchor";
  headline: string;
  sentence: string;
};

export function summarizeDocumentContext(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= 220) {
    return compact;
  }

  return `${compact.slice(0, 217)}...`;
}

export function buildDocumentBrief(value: string): DocumentBrief {
  const normalized = value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const sentencePool = normalized.length > 0 ? normalized : value.split(/(?<=[.!?])\s+/);
  const normalizedSentences = normalizeDocumentLines(sentencePool);
  const extractedPoints = Array.from(
    new Set(
      normalizedSentences
        .map((item) => item.replace(/\s+/g, " ").trim())
        .filter((item) => item.length >= 24)
        .map((item) => (item.length > 140 ? `${item.slice(0, 137)}...` : item)),
    ),
  ).slice(0, 3);
  const compact = value.replace(/\s+/g, " ").trim();
  const issuingAuthority = findIssuingAuthority(normalizedSentences);
  const facilityName = findFacilityCue(normalizedSentences, issuingAuthority);
  const sourceDescriptor = getDocumentSourceDescriptor({ issuingAuthority, facilityName });
  const actionCue = findActionCue(normalizedSentences);
  const timingCue = findTimingCue(normalizedSentences);
  const checks: string[] = [];
  const planningAdjustments: string[] = [];

  if (/\b(evacuat|relocat|move to|suspend|cancel|closure)\b/i.test(compact)) {
    checks.push("Confirm whether the document is issuing a movement or closure order right now.");
    planningAdjustments.push(
      "Beacon kept movement or closure language near the top of Mission control and the share brief so the trigger stays visible.",
    );
  }
  if (/\b(today|tonight|tomorrow|am|pm|until|before|after|deadline)\b/i.test(compact)) {
    checks.push("Verify the timing window in the document so the action card matches the latest schedule.");
    planningAdjustments.push(
      "Beacon treated the timing window as an early check, so schedule-sensitive wording stays near the front of the plan.",
    );
  }
  if (/\b(barangay|city|school|clinic|hospital|campus|building|room)\b/i.test(compact)) {
    checks.push("Check that the named facility or local authority in the document matches your current location and role.");
    planningAdjustments.push(
      "Beacon carried the named facility or local authority into the planning posture so the run stays anchored to the right place and role.",
    );
  }
  if (/\b(route|road|bridge|gate|access|pickup|transport|shelter)\b/i.test(compact)) {
    checks.push("Reconfirm route or pickup details from the document before treating them as movement-ready.");
    planningAdjustments.push(
      "Beacon elevated route, pickup, or shelter wording into the movement context instead of leaving it buried in source notes.",
    );
  }
  if (checks.length === 0) {
    checks.push("Confirm that the document is current and still applies to this exact household, school, or clinic.");
  }
  if (planningAdjustments.length === 0) {
    planningAdjustments.push(
      "Beacon used the document as scenario context, but it did not contain a strong enough operational cue to reorder the plan on its own.",
    );
  }

  return {
    headline: "Document cues attached",
    summary:
      sourceDescriptor
        ? `Beacon pulled scenario-specific cues from the pasted bulletin or OCR extract, tagged the source as ${sourceDescriptor.headline}, and kept it separate from verified official facts.`
        : "Beacon pulled scenario-specific cues from the pasted bulletin or OCR extract and kept them separate from verified official facts.",
    issuingAuthority,
    facilityName,
    actionCue,
    timingCue,
    extractedPoints:
      extractedPoints.length > 0
        ? extractedPoints
        : ["Document text was attached, but Beacon could only use it as a broad retrieved-guidance layer."],
    planningAdjustments: planningAdjustments.slice(0, 3),
    recommendedChecks: checks.slice(0, 3),
  };
}

export function getDocumentSourceDescriptor(
  documentBrief:
    | Pick<DocumentBrief, "issuingAuthority" | "facilityName">
    | null
    | undefined,
) {
  const facts = getDocumentSourceFacts(documentBrief);

  if (facts.length === 2) {
    return {
      label: "Document source",
      headline: `${facts[0].headline} for ${facts[1].headline}`,
      sentence: `${facts[0].sentence.slice(0, -1)} for ${facts[1].headline}.`,
    };
  }

  if (facts[0]) {
    return {
      label: facts[0].label,
      headline: facts[0].headline,
      sentence: facts[0].sentence,
    };
  }

  return null;
}

export function getDocumentSourceFacts(
  documentBrief:
    | Pick<DocumentBrief, "issuingAuthority" | "facilityName">
    | null
    | undefined,
): DocumentSourceFact[] {
  const issuingAuthority = documentBrief?.issuingAuthority?.trim();
  const facilityName = documentBrief?.facilityName?.trim();
  const facts: DocumentSourceFact[] = [];

  if (issuingAuthority) {
    facts.push({
      kind: "issuingAuthority",
      label: "Issuing authority",
      headline: issuingAuthority,
      sentence: `Issued by ${issuingAuthority}.`,
    });
  }

  if (facilityName) {
    const normalizedFacility = normalizeComparisonValue(facilityName);
    const normalizedAuthority = issuingAuthority
      ? normalizeComparisonValue(issuingAuthority)
      : "";

    if (
      !normalizedAuthority ||
      (normalizedFacility !== normalizedAuthority &&
        !normalizedAuthority.includes(normalizedFacility) &&
        !normalizedFacility.includes(normalizedAuthority))
    ) {
      facts.push({
        kind: "facilityName",
        label: "Facility anchor",
        headline: facilityName,
        sentence: `Applies to ${facilityName}.`,
      });
    }
  }

  return facts;
}

function normalizeDocumentLines(lines: string[]) {
  return lines
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 6)
    .filter((line) => !isOcrScaffoldLine(line));
}

function isOcrScaffoldLine(line: string) {
  const normalized = line.toLowerCase().replace(/\s+/g, " ").trim();

  if (
    normalized === "ocr import scaffold" ||
    normalized === "issued by:" ||
    normalized === "applies to:" ||
    normalized === "primary instruction line:" ||
    normalized === "timing line:" ||
    normalized === "effective date/time:" ||
    normalized === "supporting lines:" ||
    normalized === "verbatim ocr (paste exact text below):"
  ) {
    return true;
  }

  if (normalized.startsWith("source file:") || normalized.startsWith("source kind:")) {
    return true;
  }

  return false;
}

function findActionCue(lines: string[]) {
  const actionPattern =
    /\b(evacuat|relocat|move to|move inland|move uphill|pre-?evacuat|suspend|cancel|close|closure|closed|dismiss|open|resume|shelter|pickup|drop-?off|report to|avoid travel|road closure|stay away|cease operations)\b/i;
  const authorityPattern = /\b(must|should|immediately|mandatory|ordered|advisory|effective|implement|remain)\b/i;
  const normalizedLines = lines.filter((line) => line.length >= 18);
  const candidate =
    normalizedLines.find((line) => actionPattern.test(line) && authorityPattern.test(line)) ??
    normalizedLines.find((line) => actionPattern.test(line));

  if (!candidate) {
    return undefined;
  }

  return candidate.length > 118 ? `${candidate.slice(0, 115)}...` : candidate;
}

function findTimingCue(lines: string[]) {
  const timingPattern =
    /\b(today|tonight|tomorrow|am|pm|until|before|after|deadline|curfew|window|starting|effective|between|from|through|by)\b/i;
  const actionPattern =
    /\b(evacuat|relocat|move|suspend|cancel|close|closure|pickup|drop-?off|open|resume|shelter|dismiss|report)\b/i;
  const normalizedLines = lines.filter((line) => line.length >= 18);
  const candidate =
    normalizedLines.find((line) => timingPattern.test(line) && actionPattern.test(line)) ??
    normalizedLines.find((line) => timingPattern.test(line));

  if (!candidate) {
    return undefined;
  }

  return candidate.length > 118 ? `${candidate.slice(0, 115)}...` : candidate;
}

function findIssuingAuthority(lines: string[]) {
  const candidate = lines
    .filter((line) => line.length >= 10)
    .map((line) => extractIssuingAuthority(line))
    .find(Boolean);

  return candidate ? truncateNamedCue(candidate) : undefined;
}

function findFacilityCue(lines: string[], issuingAuthority?: string) {
  const candidate = lines
    .filter((line) => line.length >= 10)
    .map((line) => extractFacilityCue(line))
    .find((value) => {
      if (!value) {
        return false;
      }

      if (!issuingAuthority) {
        return true;
      }

      const normalizedCandidate = normalizeComparisonValue(value);
      const normalizedAuthority = normalizeComparisonValue(issuingAuthority);
      return (
        normalizedCandidate !== normalizedAuthority &&
        !normalizedAuthority.includes(normalizedCandidate) &&
        !normalizedCandidate.includes(normalizedAuthority)
      );
    });

  return candidate ? truncateNamedCue(candidate) : undefined;
}

function extractIssuingAuthority(line: string) {
  const headerMatch = line.match(/^(?:issued by|from|source|office|authority)\s*[:\-]\s*(.+)$/i);
  if (headerMatch) {
    return cleanNamedCue(headerMatch[1]);
  }

  const keywordMatch = line.match(
    /\b((?:barangay|city|municipal(?:ity)?|provincial|regional|school|clinic|hospital|department|office|division|administration|principal|mayor|disaster risk reduction(?: and management)?(?: office)?|drrmo|mdrrmo|cdrrmo|health office)[^.;]{0,88})/i,
  );
  if (keywordMatch) {
    return cleanNamedCue(keywordMatch[1]);
  }

  return undefined;
}

function extractFacilityCue(line: string) {
  const namedFacilityMatch = line.match(
    /\b([A-Z0-9][A-Za-z0-9&.'-]*(?:\s+[A-Z0-9][A-Za-z0-9&.'-]*){0,6}\s+(?:School|Clinic|Hospital|Campus|Building|Center|Centre|Hall|Gym(?:nasium)?|Gate|Room|Covered Court|Health Center|Medical Center))\b/i,
  );
  if (namedFacilityMatch) {
    return cleanNamedCue(namedFacilityMatch[1]);
  }

  const genericFacilityMatch = line.match(
    /\b((?:barangay hall|evacuation center|main gate|pickup gate|school gate|clinic gate|covered court|health center|command center)[^.;]{0,48})/i,
  );
  if (genericFacilityMatch) {
    return cleanNamedCue(genericFacilityMatch[1]);
  }

  return undefined;
}

function cleanNamedCue(value: string) {
  return value
    .replace(/^(?:issued by|from|source|office|authority)\s*[:\-]\s*/i, "")
    .split(/\b(?:announces?|advis(?:es?|ory)|orders?|directs?|requires?|implements?|reports?|states?|effective|must|should|will)\b/i)[0]
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateNamedCue(value: string) {
  return value.length > 96 ? `${value.slice(0, 93).trimEnd()}...` : value;
}

function normalizeComparisonValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
