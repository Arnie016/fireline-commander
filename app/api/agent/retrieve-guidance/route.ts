import { NextResponse } from "next/server";
import { z } from "zod";

import { formatRetrievedEvidence, getScenarioGuidance } from "@/src/lib/knowledge-retrieval";
import { generateAgentRecommendation } from "@/src/lib/gemini-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const retrieveGuidanceSchema = z.object({
  scenario: z.string().min(1),
  hazard: z.string().min(1),
  role: z.string().min(1),
  condition: z.string().min(1),
  userDecision: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = retrieveGuidanceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid retrieval request",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const retrieval = await getScenarioGuidance({
    scenario: parsed.data.scenario,
    hazard: parsed.data.hazard,
    role: parsed.data.role,
    condition: parsed.data.condition,
  });
  const topResult = retrieval.results[0] ?? null;
  const recommendation = await generateAgentRecommendation({
    scenarioState: parsed.data,
    retrievedGuidance: topResult,
    userRole: parsed.data.role,
  });

  return NextResponse.json({
    retrieved_guidance: topResult ? formatRetrievedEvidence(topResult) : retrieval.retrieved_guidance,
    evidence_source: retrieval.evidence_source,
    retrieval_query: retrieval.retrieval_query,
    checklist: recommendation.checklist,
    recommended_action: recommendation.recommended_action,
    consequence: recommendation.consequence,
    reasoning_summary: recommendation.reasoning_summary,
    agent_mode: recommendation.agent_mode,
    mcp_status: retrieval.mcp_status,
  });
}
