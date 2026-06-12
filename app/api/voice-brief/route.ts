import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VoiceBriefRequest = {
  text?: string;
  voice?: string;
  instructions?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as VoiceBriefRequest;
  const text = body.text?.trim();

  if (!text) {
    return NextResponse.json({ error: "Missing voice text." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "OPENAI_API_KEY is not configured.",
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
        voice: body.voice ?? process.env.OPENAI_TTS_VOICE ?? "marin",
        input: text.slice(0, 3800),
        instructions:
          body.instructions ??
          "Speak like a realistic emergency training coach over a handheld radio. Calm, human, and urgent without drama. Use short commands and natural pauses. Do not add sound effects, panic, gore, or unsupported certainty. Disclose that the voice is AI-generated.",
        response_format: "mp3",
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "OpenAI voice generation failed.");
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      audioUrl: `data:audio/mpeg;base64,${audioBase64}`,
      source: "openai-tts",
      model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
      voice: body.voice ?? process.env.OPENAI_TTS_VOICE ?? "marin",
      disclosure: "AI-generated voice.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "OpenAI voice generation failed.",
      },
      { status: 500 },
    );
  }
}
