import type { KnowledgeSearchResponse } from "@/src/lib/knowledge-retrieval";

type AgentRecommendationInput = {
  scenarioState: {
    scenario: string;
    hazard: string;
    role: string;
    condition: string;
    userDecision?: string;
  };
  retrievedGuidance: KnowledgeSearchResponse["results"][number] | null;
  userRole: string;
};

export type AgentRecommendation = {
  recommended_action: string;
  checklist: string[];
  consequence: string;
  reasoning_summary: string;
  agent_mode: "gemini_configured" | "deterministic_demo_mode";
};

export async function generateAgentRecommendation({
  scenarioState,
  retrievedGuidance,
  userRole,
}: AgentRecommendationInput): Promise<AgentRecommendation> {
  if (process.env.GEMINI_API_KEY) {
    const liveRecommendation = await tryGenerateGeminiRecommendation({
      scenarioState,
      retrievedGuidance,
      userRole,
    });

    if (liveRecommendation) {
      return liveRecommendation;
    }
  }

  const evidence = retrievedGuidance?.record;

  return {
    recommended_action:
      evidence?.safe_action ??
      `For ${scenarioState.scenario}, keep the group together, avoid the risky route, verify official guidance, and hand off a short accountability update.`,
    checklist:
      evidence?.checklist ??
      [
        "Name the hazard cue.",
        "Choose the safest available route.",
        "Assign support for vulnerable people.",
        "Confirm accountability.",
        "Wait for official all-clear.",
      ],
    consequence:
      evidence?.consequence ??
      "The safer route protects people and preserves accountability while the drill waits for verified guidance.",
    reasoning_summary: `Demo-mode agent used retrieved ${evidence?.source ?? "local emergency drill guidance"} for ${userRole} in ${scenarioState.scenario}.`,
    agent_mode: "deterministic_demo_mode",
  };
}

async function tryGenerateGeminiRecommendation({
  scenarioState,
  retrievedGuidance,
  userRole,
}: AgentRecommendationInput): Promise<AgentRecommendation | null> {
  const endpoint =
    process.env.GEMINI_API_ENDPOINT ??
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  const evidence = retrievedGuidance?.record;

  try {
    const response = await fetch(`${endpoint}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: [
                  "Return concise JSON for an emergency drill recommendation.",
                  `Scenario: ${scenarioState.scenario}`,
                  `Hazard: ${scenarioState.hazard}`,
                  `Role: ${userRole}`,
                  `Condition: ${scenarioState.condition}`,
                  `User decision: ${scenarioState.userDecision ?? "not provided"}`,
                  `Retrieved guidance: ${evidence ? JSON.stringify(evidence) : "none"}`,
                  'Schema: {"recommended_action":"string","checklist":["string"],"consequence":"string","reasoning_summary":"string"}',
                ].join("\n"),
              },
            ],
          },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    const text =
      payload?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text)
        .filter(Boolean)
        .join("\n") ?? "";
    const parsed = parseJsonFromText(text);

    if (!parsed) {
      return null;
    }

    return {
      recommended_action: parsed.recommended_action,
      checklist: parsed.checklist,
      consequence: parsed.consequence,
      reasoning_summary: parsed.reasoning_summary,
      agent_mode: "gemini_configured",
    };
  } catch {
    return null;
  }
}

function parseJsonFromText(text: string): Omit<AgentRecommendation, "agent_mode"> | null {
  const jsonText = text.match(/\{[\s\S]*\}/)?.[0] ?? text;

  try {
    const parsed = JSON.parse(jsonText) as Partial<Omit<AgentRecommendation, "agent_mode">>;
    if (
      typeof parsed.recommended_action !== "string" ||
      !Array.isArray(parsed.checklist) ||
      typeof parsed.consequence !== "string" ||
      typeof parsed.reasoning_summary !== "string"
    ) {
      return null;
    }

    return {
      recommended_action: parsed.recommended_action,
      checklist: parsed.checklist.filter((item): item is string => typeof item === "string"),
      consequence: parsed.consequence,
      reasoning_summary: parsed.reasoning_summary,
    };
  } catch {
    return null;
  }
}
