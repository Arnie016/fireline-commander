import { NextResponse } from "next/server";

import { buildGroundedPlan } from "@/lib/planner";
import { intakeSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = intakeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const plan = await buildGroundedPlan(parsed.data);
    return NextResponse.json(plan);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to build plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
