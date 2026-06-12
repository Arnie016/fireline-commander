import drillKnowledge from "@/src/data/drill_knowledge.json";

export type DrillKnowledgeRecord = {
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
};

export type EmergencyKnowledgeFilters = {
  scenario?: string;
  hazard?: string;
  role?: string;
  condition?: string;
};

export type KnowledgeEvidenceResult = {
  record: DrillKnowledgeRecord;
  score: number;
  matched_terms: string[];
};

export type RetrievalStatus =
  | "elastic_mcp_configured"
  | "elastic_index_configured"
  | "local_demo_fallback";

export type KnowledgeSearchResponse = {
  results: KnowledgeEvidenceResult[];
  evidence_source: "Hosted Retrieval" | "Index Search" | "Demo Evidence";
  mcp_status: RetrievalStatus;
  retrieval_query: {
    index: string;
    query: string;
    filters: EmergencyKnowledgeFilters;
  };
};

const localDrillKnowledge = drillKnowledge as DrillKnowledgeRecord[];

export async function searchEmergencyKnowledge(
  query: string,
  filters: EmergencyKnowledgeFilters = {},
): Promise<KnowledgeSearchResponse> {
  const index = process.env.ELASTIC_INDEX || "drill_knowledge";
  const retrievalQuery = {
    index,
    query,
    filters,
  };

  if (process.env.ELASTIC_MCP_ENDPOINT && process.env.ELASTIC_API_KEY) {
    try {
      const response = await fetch(process.env.ELASTIC_MCP_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `ApiKey ${process.env.ELASTIC_API_KEY}`,
        },
        body: JSON.stringify(retrievalQuery),
        cache: "no-store",
      });

      if (response.ok) {
        const payload = await response.json();
        return {
          results: normalizeRetrievalPayload(payload),
          evidence_source: "Hosted Retrieval",
          mcp_status: "elastic_mcp_configured",
          retrieval_query: retrievalQuery,
        };
      }
    } catch {
      // Fall through to the local fallback so the hackathon demo remains runnable.
    }
  }

  if (process.env.ELASTICSEARCH_URL && process.env.ELASTIC_API_KEY) {
    const retrievalResults = await searchHostedIndex(retrievalQuery).catch(() => null);

    if (retrievalResults?.length) {
      return {
        results: retrievalResults,
        evidence_source: "Index Search",
        mcp_status: "elastic_index_configured",
        retrieval_query: retrievalQuery,
      };
    }
  }

  return {
    results: searchLocalKnowledge(query, filters),
    evidence_source: "Demo Evidence",
    mcp_status: "local_demo_fallback",
    retrieval_query: retrievalQuery,
  };
}

export async function getScenarioGuidance(filters: EmergencyKnowledgeFilters) {
  const query = buildEmergencyKnowledgeQuery(filters);
  const response = await searchEmergencyKnowledge(query, filters);
  const topResult = response.results[0] ?? null;

  return {
    ...response,
    retrieved_guidance: topResult ? formatRetrievedEvidence(topResult) : null,
  };
}

export function formatRetrievedEvidence(result: KnowledgeEvidenceResult) {
  return {
    id: result.record.id,
    scenario: result.record.scenario,
    hazard: result.record.hazard,
    role: result.record.role,
    condition: result.record.condition,
    safe_action: result.record.safe_action,
    checklist: result.record.checklist,
    consequence: result.record.consequence,
    source: result.record.source,
    tags: result.record.tags,
    score: result.score,
    matched_terms: result.matched_terms,
  };
}

function buildEmergencyKnowledgeQuery(filters: EmergencyKnowledgeFilters) {
  return [filters.scenario, filters.hazard, filters.role, filters.condition]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function searchLocalKnowledge(query: string, filters: EmergencyKnowledgeFilters): KnowledgeEvidenceResult[] {
  const queryTerms = tokenize(
    [query, filters.scenario, filters.hazard, filters.role, filters.condition].filter(Boolean).join(" "),
  );

  return localDrillKnowledge
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
      const exactBoost =
        normalize(record.hazard) === normalize(filters.hazard) ? 4 : 0;
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

async function searchHostedIndex(retrievalQuery: KnowledgeSearchResponse["retrieval_query"]) {
  const elasticsearchUrl = process.env.ELASTICSEARCH_URL;
  const apiKey = process.env.ELASTIC_API_KEY;

  if (!elasticsearchUrl || !apiKey) {
    return [];
  }

  const endpoint = new URL(`/${encodeURIComponent(retrievalQuery.index)}/_search`, normalizeUrl(elasticsearchUrl));
  const filters = buildHostedFilters(retrievalQuery.filters);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `ApiKey ${apiKey}`,
    },
    body: JSON.stringify({
      size: 3,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: retrievalQuery.query,
                fields: [
                  "scenario^4",
                  "hazard^4",
                  "role^3",
                  "condition^3",
                  "safe_action^2",
                  "checklist^2",
                  "consequence",
                  "tags^2",
                ],
                fuzziness: "AUTO",
              },
            },
          ],
          filter: filters,
        },
      },
      highlight: {
        fields: {
          condition: {},
          safe_action: {},
          checklist: {},
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  return normalizeRetrievalPayload(payload);
}

function buildHostedFilters(filters: EmergencyKnowledgeFilters) {
  const clauses: Array<Record<string, unknown>> = [];

  if (filters.hazard) {
    clauses.push({ term: { "hazard.keyword": filters.hazard } });
  }

  if (filters.role) {
    clauses.push({
      bool: {
        should: [
          { term: { "role.keyword": filters.role } },
          { match: { role: filters.role } },
        ],
        minimum_should_match: 1,
      },
    });
  }

  return clauses;
}

function normalizeRetrievalPayload(payload: unknown): KnowledgeEvidenceResult[] {
  const rawHits = extractHits(payload);
  const results: KnowledgeEvidenceResult[] = [];

  rawHits.forEach((hit, index) => {
    const source = extractSource(hit);
    const parsedRecord = parseRecord(source);

    if (!parsedRecord) {
      return;
    }

    results.push({
      record: parsedRecord,
      score: extractScore(hit) ?? rawHits.length - index,
      matched_terms: [],
    });
  });

  return results;
}

function extractHits(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const candidate = payload as {
    hits?: { hits?: unknown[] } | unknown[];
    results?: unknown[];
    documents?: unknown[];
  };

  if (Array.isArray(candidate.results)) {
    return candidate.results;
  }

  if (Array.isArray(candidate.documents)) {
    return candidate.documents;
  }

  if (Array.isArray(candidate.hits)) {
    return candidate.hits;
  }

  if (candidate.hits && typeof candidate.hits === "object" && Array.isArray(candidate.hits.hits)) {
    return candidate.hits.hits;
  }

  return [];
}

function extractSource(hit: unknown): unknown {
  if (!hit || typeof hit !== "object") {
    return hit;
  }

  const candidate = hit as { _source?: unknown; source?: unknown; document?: unknown };
  return candidate._source ?? candidate.source ?? candidate.document ?? hit;
}

function extractScore(hit: unknown) {
  if (!hit || typeof hit !== "object") {
    return null;
  }

  const candidate = hit as { _score?: unknown; score?: unknown };
  const score = candidate._score ?? candidate.score;
  return typeof score === "number" ? score : null;
}

function parseRecord(source: unknown): DrillKnowledgeRecord | null {
  if (!source || typeof source !== "object") {
    return null;
  }

  const record = source as Partial<DrillKnowledgeRecord>;
  if (
    typeof record.id !== "string" ||
    typeof record.scenario !== "string" ||
    typeof record.hazard !== "string" ||
    typeof record.role !== "string" ||
    typeof record.condition !== "string" ||
    typeof record.safe_action !== "string" ||
    !Array.isArray(record.checklist) ||
    typeof record.consequence !== "string" ||
    typeof record.source !== "string" ||
    !Array.isArray(record.tags)
  ) {
    return null;
  }

  return {
    id: record.id,
    scenario: record.scenario,
    hazard: record.hazard,
    role: record.role,
    condition: record.condition,
    safe_action: record.safe_action,
    checklist: record.checklist.filter((item): item is string => typeof item === "string"),
    consequence: record.consequence,
    source: record.source,
    tags: record.tags.filter((item): item is string => typeof item === "string"),
  };
}

function tokenize(value: string) {
  return normalize(value)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2);
}

function normalize(value: string | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeUrl(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}
