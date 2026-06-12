import { z } from "zod";

import type { ActionBundle, IntakeForm } from "@/lib/schema";

const enhancementSchema = z.object({
  actionCardTitle: z.string().min(6),
  summary: z.string().min(20),
  voiceScript: z.string().min(20),
});

type EnhancementInput = {
  basePlan: ActionBundle;
  intake: IntakeForm;
};

export async function enhanceWithOllama({
  basePlan,
  intake,
}: EnhancementInput): Promise<z.infer<typeof enhancementSchema> | null> {
  const endpoint = process.env.OLLAMA_ENDPOINT ?? "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL ?? "gemma4:26b";

  const prompt = [
    "You are Gemma 4 inside Beacon, an emergency-planning copilot.",
    "Rewrite the plan copy to be more grounded, concise, and useful.",
    "Do not invent facts beyond the provided context.",
    "Return valid JSON with keys actionCardTitle, summary, and voiceScript.",
    "",
    `User profile: ${JSON.stringify(intake)}`,
    `Base action bundle: ${JSON.stringify(basePlan)}`,
  ].join("\n");

  try {
    const response = await fetch(`${endpoint}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { response?: string };
    const jsonText = extractJsonObject(data.response ?? "");
    if (!jsonText) {
      return null;
    }

    return enhancementSchema.parse(JSON.parse(jsonText));
  } catch {
    return null;
  }
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return text.slice(start, end + 1);
}
