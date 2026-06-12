#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const outputDir = path.join(rootDir, "demo-evidence");
const sourcePath = path.join(rootDir, "src", "data", "drill_knowledge.json");
const records = JSON.parse(fs.readFileSync(sourcePath, "utf8"));

const scenarios = [
  {
    scenario: "Fireline School",
    hazard: "fire",
    role: "teacher",
    condition: "blocked route vulnerable assistance smoke pickup gate",
  },
  {
    scenario: "Bay Household",
    hazard: "tsunami",
    role: "family lead",
    condition: "strong shaking elder pet inland high ground",
  },
  {
    scenario: "Night Flood",
    hazard: "flood",
    role: "teacher",
    condition: "ground floor night rising moving water vertical shelter",
  },
  {
    scenario: "School Typhoon",
    hazard: "typhoon",
    role: "school safety lead",
    condition: "parent pickup wind warning covered gate accountability",
  },
  {
    scenario: "Clinic Heat",
    hazard: "heatwave",
    role: "clinic lead",
    condition: "heat index cooling triage vulnerable medicine",
  },
];

fs.mkdirSync(outputDir, { recursive: true });

const retrievals = scenarios.map((scenario) => {
  const query = [scenario.scenario, scenario.hazard, scenario.role, scenario.condition].join(" ");
  const results = searchLocalKnowledge(query, scenario);
  const topResult = results[0];

  return {
    request: scenario,
    retrieval_query: {
      index: "drill_knowledge",
      query,
      filters: scenario,
    },
    evidence_source: "Demo evidence",
    mcp_status: "local_demo_fallback",
    note:
      "Generated after Elastic Cloud trial expiry from the same JSON records intended for the drill_knowledge Elasticsearch index.",
    retrieved_guidance: topResult
      ? {
          id: topResult.record.id,
          scenario: topResult.record.scenario,
          hazard: topResult.record.hazard,
          role: topResult.record.role,
          condition: topResult.record.condition,
          safe_action: topResult.record.safe_action,
          checklist: topResult.record.checklist,
          consequence: topResult.record.consequence,
          source: topResult.record.source,
          tags: topResult.record.tags,
          score: topResult.score,
          matched_terms: topResult.matched_terms,
        }
      : null,
    recommended_action:
      topResult?.record.safe_action ??
      "Keep the group together, avoid the risky route, verify official guidance, and hand off accountability.",
    checklist:
      topResult?.record.checklist ??
      ["Name the hazard cue.", "Choose the safest route.", "Confirm accountability."],
    consequence:
      topResult?.record.consequence ??
      "The safer route preserves accountability while waiting for verified guidance.",
  };
});

const manifest = {
  generated_at: new Date().toISOString(),
  repository: "https://github.com/Arnie016/fireline-commander",
  mode: "post-submission archive",
  elastic_status:
    "Hosted retrieval unavailable; bundle preserves reviewable demo evidence without claiming live access.",
  files: {
    knowledge_snapshot: "demo-evidence/drill_knowledge.snapshot.json",
    retrievals: "demo-evidence/retrievals.json",
    report: "demo-evidence/retrieval-report.md",
  },
  scenarios: retrievals.length,
  records: records.length,
};

fs.writeFileSync(
  path.join(outputDir, "drill_knowledge.snapshot.json"),
  `${JSON.stringify(records, null, 2)}\n`,
);
fs.writeFileSync(path.join(outputDir, "retrievals.json"), `${JSON.stringify(retrievals, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, "retrieval-report.md"), buildReport(manifest, retrievals));

console.log(`Wrote ${retrievals.length} retrievals and ${records.length} records to ${outputDir}`);

function searchLocalKnowledge(query, filters) {
  const queryTerms = tokenize(
    [query, filters.scenario, filters.hazard, filters.role, filters.condition].filter(Boolean).join(" "),
  );

  return records
    .map((record) => {
      const recordText = tokenize(
        [
          record.scenario,
          record.hazard,
          record.role,
          record.condition,
          record.safe_action,
          record.checklist.join(" "),
          record.consequence,
          record.tags.join(" "),
        ].join(" "),
      );
      const matchedTerms = [...new Set(queryTerms.filter((term) => recordText.includes(term)))];
      const exactBoost = normalize(record.hazard) === normalize(filters.hazard) ? 4 : 0;
      const scenarioBoost = normalize(record.scenario).includes(normalize(filters.scenario)) ? 3 : 0;
      const roleBoost = normalize(record.role).includes(normalize(filters.role)) ? 2 : 0;

      return {
        record,
        score: matchedTerms.length + exactBoost + scenarioBoost + roleBoost,
        matched_terms: matchedTerms,
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function buildReport(manifest, retrievalsToReport) {
  const lines = [
    "# Fireline Commander Demo Evidence",
    "",
    `Generated: ${manifest.generated_at}`,
    "",
    "## Status",
    "",
    "Hosted retrieval was unavailable when this archive was generated. The bundle is intentionally labeled as demo evidence and does not claim live hosted access.",
    "",
    "The same records can be seeded into the `drill_knowledge` index when a hosted deployment is available.",
    "",
    "## Retrieved Guidance Samples",
    "",
  ];

  retrievalsToReport.forEach((item) => {
    lines.push(`### ${item.request.scenario}`);
    lines.push("");
    lines.push(`- Query: \`${item.retrieval_query.query}\``);
    lines.push(`- Evidence source: ${item.evidence_source}`);
    lines.push(`- Retrieval mode: \`${item.mcp_status}\``);
    lines.push(`- Retrieved record: \`${item.retrieved_guidance?.id ?? "none"}\``);
    lines.push(`- Recommended action: ${item.recommended_action}`);
    lines.push(`- Consequence: ${item.consequence}`);
    lines.push("");
    lines.push("Checklist:");
    lines.push("");
    item.checklist.forEach((check) => lines.push(`- ${check}`));
    lines.push("");
  });

  lines.push("## Final Verification Command");
  lines.push("");
  lines.push("```bash");
  lines.push("npm run hackathon:final");
  lines.push("```");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function tokenize(value) {
  return normalize(value)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
}

function normalize(value) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
