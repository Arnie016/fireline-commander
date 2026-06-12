import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LiveCoachRequest = {
  message?: string;
  stepTitle?: string;
  routeTitle?: string;
  selectedDecision?: string;
  ruleChoice?: string;
  location?: string;
  hazard?: "fire" | "tsunami" | "flood" | "typhoon" | "heatwave";
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LiveCoachRequest;
  const message = body.message?.trim();

  if (!message) {
    return NextResponse.json({
      reply: "Say what you are trying to do on the route, and I will coach the next safe move.",
      source: "fallback",
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      reply: buildFallbackCoachReply(body),
      source: "fallback",
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_LIVE_COACH_MODEL ?? "gpt-5-mini",
        max_output_tokens: 140,
        reasoning: { effort: "minimal" },
        input: [
          {
            role: "system",
            content:
              "You are Fireline Commander Live Coach, a concise emergency-training voice coach. Keep replies under 45 words. Teach route vocabulary, source discipline, and safe disaster-drill actions. Never invent official orders. Tell the trainee what to check or do next.",
          },
          {
            role: "user",
            content: [
              `Location: ${body.location ?? "unknown"}`,
              `Hazard: ${body.hazard ?? "unknown"}`,
              `Step: ${body.stepTitle ?? "unknown"}`,
              `Route: ${body.routeTitle ?? "unknown"}`,
              `Selected decision: ${body.selectedDecision ?? "unknown"}`,
              `Rule choice: ${body.ruleChoice ?? "unknown"}`,
              `Trainee says: ${message}`,
            ].join("\n"),
          },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ text?: string }> }>;
      error?: { message?: string };
    };
    const reply =
      data.output_text ??
      data.output?.flatMap((item) => item.content ?? []).find((content) => content.text)?.text;

    if (!response.ok || !reply) {
      return NextResponse.json({
        reply: buildFallbackCoachReply(body),
        source: "fallback",
        detail: data.error?.message,
      });
    }

    return NextResponse.json({
      reply,
      source: "openai",
    });
  } catch (error) {
    return NextResponse.json({
      reply: buildFallbackCoachReply(body),
      source: "fallback",
      detail: error instanceof Error ? error.message : "Live coach failed.",
    });
  }
}

function buildFallbackCoachReply(body: LiveCoachRequest) {
  const route = body.routeTitle ?? "this route";
  const decision = body.selectedDecision ?? "your selected action";
  const routeCueByHazard: Record<NonNullable<LiveCoachRequest["hazard"]>, string> = {
    fire: "move upwind, keep the fire lane open, and wait for official all clear before re-entry",
    tsunami: "move inland or upward, avoid the shoreline, and wait for official all clear before return",
    flood: "move up, avoid moving water, and keep medicines plus chargers above the flood line",
    typhoon: "hold inside, release through covered control points, and keep emergency access open",
    heatwave: "move vulnerable patients to cooling, protect medicines, and repeat symptom checks",
  };
  const routeCue =
    body.hazard && routeCueByHazard[body.hazard]
      ? routeCueByHazard[body.hazard]
      : "move away from the hazard, keep access clear, and verify the official trigger";

  return `For ${route}, ${routeCue}. Your current choice is ${decision}; say the route in plain language before you move.`;
}
