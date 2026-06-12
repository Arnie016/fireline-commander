import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ScenarioFrameRequest = {
  stepId?: string;
  beatId?: string;
  sceneTitle?: string;
  routeTitle?: string;
  decisionLabel?: string;
  learningGoal?: string;
  hazard?: "fire" | "tsunami" | "flood" | "typhoon" | "heatwave";
  role?: "household" | "school" | "clinic";
  location?: string;
};

const frameVisualClasses = [
  "liveFrame-alarm",
  "liveFrame-corridor",
  "liveFrame-gate",
  "liveFrame-lane",
  "liveFrame-assembly",
  "liveFrame-handoff",
] as const;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as ScenarioFrameRequest;
  const visualClass = frameVisualClasses[Math.abs(hashFrameSeed(`${body.stepId ?? ""}-${body.beatId ?? ""}`)) % frameVisualClasses.length];
  const prompt = buildScenarioFramePrompt(body);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      imageUrl: null,
      source: "prompt-ready",
      title: formatFrameTitle(body),
      description: "OPENAI_API_KEY is not configured, so Fireline Commander prepared the frame prompt and rendered a procedural frame.",
      visualClass,
      prompt,
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1.5",
        prompt,
        size: "1536x1024",
        quality: "low",
      }),
      signal: AbortSignal.timeout(60000),
    });
    const data = (await response.json()) as {
      data?: Array<{ b64_json?: string; revised_prompt?: string }>;
      error?: { message?: string };
    };
    const imageBase64 = data.data?.[0]?.b64_json;

    if (!response.ok || !imageBase64) {
      return NextResponse.json({
        imageUrl: null,
        source: "prompt-ready",
        title: formatFrameTitle(body),
        description: data.error?.message ?? "Image generation did not return a frame. Procedural frame is active.",
        visualClass,
        prompt,
      });
    }

    return NextResponse.json({
      imageUrl: `data:image/png;base64,${imageBase64}`,
      source: "openai-image",
      title: formatFrameTitle(body),
      description: "Fresh scenario frame generated for this training beat.",
      visualClass,
      prompt: data.data?.[0]?.revised_prompt ?? prompt,
    });
  } catch (error) {
    return NextResponse.json({
      imageUrl: null,
      source: "prompt-ready",
      title: formatFrameTitle(body),
      description: error instanceof Error ? error.message : "Image generation failed. Procedural frame is active.",
      visualClass,
      prompt,
    });
  }
}

function buildScenarioFramePrompt(body: ScenarioFrameRequest) {
  const stageSpec = getScenarioStageSpec(body.stepId, body.beatId, body.hazard);
  const settingSpec = getScenarioSettingSpec(body);

  return [
    "Create exactly one 16:9 cinematic training-simulator frame for Fireline Commander, a disaster-response learning game.",
    "The image must be unambiguous, realistic, and instructional. It should look like a single in-game camera frame, not a collage, poster, split screen, dashboard, infographic, or UI mockup.",
    `Fixed setting continuity: ${settingSpec.setting}. Keep the same adult trainee lead, calm affected people, and local Philippine disaster-response context across frames.`,
    `Hazard-specific route rule: ${settingSpec.routeRule}.`,
    `Current stage: ${body.sceneTitle ?? body.stepId ?? "route decision"}.`,
    `Interactive beat: ${body.beatId ?? "decision pause"}.`,
    `Route focus: ${body.routeTitle ?? "safe movement and responder access"}.`,
    `Decision focus: ${body.decisionLabel ?? "choose the safest route phrase"}.`,
    `Learning goal: ${body.learningGoal ?? "teach emergency vocabulary and route judgment"}.`,
    `Stage-specific camera: ${stageSpec.camera}.`,
    `Must show: ${stageSpec.mustShow}.`,
    `Must not show: ${stageSpec.mustNotShow}.`,
    `Composition: ${stageSpec.composition}.`,
    "Show the route using physical cues only: floor arrows, cones, tape, body position, smoke direction, open lane, headcount posture, or handoff gesture. Do not add readable words, map labels, fake signage, logos, UI panels, captions, or overlay text inside the image.",
    "Safety constraints: no gore, no injuries, no panic, no burning people, no trapped children, no flames touching people, no collapsed building, no ambiguous crowd stampede. Smoke can be visible but the training path and learning objective must remain clear.",
    "Leave calm darker space in the top-left and lower edge for the app HUD overlays. Professional AAA emergency-training simulator style, realistic lighting, readable route geometry.",
  ].join(" ");
}

function getScenarioSettingSpec(body: ScenarioFrameRequest) {
  const location = body.location?.trim() || "the Philippines";
  const role = body.role ?? "school";

  if (body.hazard === "tsunami") {
    return {
      setting: `a coastal neighborhood in ${location}, humid tropical streets, visible inland/uphill route, apartment stairwell or elevated safe building, and no shoreline return`,
      routeRule:
        "show natural-warning movement inland or upward, avoid bridges and coastal roads, and keep the official all-clear concept implied by posture rather than text",
    };
  }

  if (body.hazard === "flood") {
    return {
      setting: `a low-lying urban household block in ${location}, rainwater rising near a ground-floor entrance, visible upper-floor shelter or elevated walkway, and safe dry staging area`,
      routeRule:
        "show upper-floor or elevated movement, avoid crossing moving water, protect medicines and chargers, and keep vehicle shortcuts visibly unsafe",
    };
  }

  if (body.hazard === "typhoon") {
    return {
      setting: `a school campus in ${location}, covered pickup gate, wind-driven rain outside, assigned indoor rooms, and a controlled guardian handoff zone`,
      routeRule:
        "show shelter-in-place, covered-gate reunification, emergency-vehicle access, and calm room-by-room accountability",
    };
  }

  if (body.hazard === "heatwave") {
    return {
      setting: `a community clinic in ${location}, shaded waiting area, cooling room, medication cooler, drinking-water station, and mobility-limited patients`,
      routeRule:
        "show movement toward the coolest reachable room, wellness checks, medication temperature protection, and escalation posture for heat illness signs",
    };
  }

  if (role === "household") {
    return {
      setting: `a household emergency route in ${location}, visible family staging point, calm adults, children, elders, and a clear exit or shelter path`,
      routeRule:
        "show one safe household movement path, care support, and no ambiguous crowding or blocked exits",
    };
  }

  return {
    setting:
      "a Philippine public/private school in Marikina, humid tropical architecture, blue-and-cream corridor walls, covered walkways, a black metal pickup gate, a visible but unobstructed fire truck access lane, the same adult safety lead wearing a reflective vest, and the same calm student group",
    routeRule:
      "show upwind movement away from smoke, keep the fire truck access lane open, control pickup, and preserve headcount/accountability",
  };
}

function getScenarioStageSpec(stepId?: string, beatId?: string, hazard?: ScenarioFrameRequest["hazard"]) {
  if (hazard && hazard !== "fire") {
    if (stepId === "mission") {
      return {
        camera: "first-person trainee viewpoint at the route entry, looking toward the safest visible direction.",
        mustShow:
          "one clear hazard cue, a calm adult lead preparing the group, visible safe route cues, and people ready to move without panic.",
        mustNotShow: "fire-specific smoke or fire trucks unless the hazard is fire, chaotic crowding, text labels, fake UI.",
        composition: "safe route line is visible from foreground to midground, with hazard pressure off to one side.",
      };
    }

    if (stepId === "actions") {
      return {
        camera: "first-person movement perspective halfway through the safest route.",
        mustShow:
          "orderly movement, one lead pointing or gesturing, vulnerable people supported, and physical route cues such as cones, tape, shade, stairs, or dry/elevated path.",
        mustNotShow: "running, blocked safe path, text signage, abstract map view.",
        composition: "route path occupies center third, hazard remains visibly separate from the safe movement choice.",
      };
    }

    if (stepId === "ground") {
      return {
        camera: "slightly elevated realistic tactical view near the route decision point, not a map or dashboard.",
        mustShow:
          "official access or control point kept clear, calm staff checking the route, and retrieved guidance implied by a clipboard or route card without readable text.",
        mustNotShow: "floating labels, UI overlays, unreadable bulletin text, people in immediate danger.",
        composition: "the official control/access path must be the clearest object; people movement path stays separate.",
      };
    }

    if (stepId === "route" && beatId === "movement") {
      return {
        camera: "low-angle exterior or corridor view along the safe movement route.",
        mustShow: "empty official access path, affected people on a separate safe path, and a visible destination direction.",
        mustNotShow: "people blocking official access, confusing crossing routes, panic, unsafe shortcut as the main path.",
        composition: "safe route is a strong diagonal, access path is visibly preserved.",
      };
    }

    if (stepId === "route") {
      return {
        camera: "first-person viewpoint at a fork between a risky shortcut and safer controlled route.",
        mustShow: "two visually distinct route options, with the safer route open and the shortcut visibly riskier.",
        mustNotShow: "uncontrolled crowd, blocked official access, people in danger, text labels.",
        composition: "risky route on one side, safer route on the other, clear decision geometry.",
      };
    }

    if (stepId === "people") {
      return {
        camera: "medium-wide view at the safe care or assembly area.",
        mustShow:
          "headcount or wellness checks, buddy support for mobility-limited people, medicine/care kit, and calm organized clusters.",
        mustNotShow: "medical emergency, separated children, chaotic pickup, hazard covering the group.",
        composition: "care support is clearly visible in the foreground or middle ground.",
      };
    }

    if (stepId === "share") {
      return {
        camera: "close but clear handoff moment at the safe area edge.",
        mustShow: "lead speaking into phone or radio, staff receiving instructions, group visible behind them, route still controlled.",
        mustNotShow: "screens with readable text, brand logos, fake app UI, dramatic disaster scene.",
        composition: "human communication is the focus; background confirms safe assembly and controlled access.",
      };
    }
  }

  if (stepId === "mission") {
    return {
      camera: "first-person trainee viewpoint at the corridor entry, looking toward the visible exit gate.",
      mustShow: "smoke down one side of the corridor, clear safe side of corridor, safety lead preparing the group, students calm and ready.",
      mustNotShow: "students already outside, fire truck blocking the gate, unreadable route, dramatic flames.",
      composition: "foreground hands or shoulders optional, clear route line visible on floor, exit gate in distance.",
    };
  }

  if (stepId === "actions") {
    return {
      camera: "first-person walking perspective halfway down the covered corridor.",
      mustShow: "students moving in an orderly single line away from smoke, safety lead pointing along the safe side, floor arrows or tape showing direction.",
      mustNotShow: "chaotic running, blocked exit, abstract map view, text signage.",
      composition: "route path occupies center third, smoke stays to one side so the safe movement choice is obvious.",
    };
  }

  if (stepId === "ground") {
    return {
      camera: "slightly elevated tactical view near the fire lane outside the gate, still realistic not map-like.",
      mustShow: "official responder access lane kept empty, cones or tape indicating boundary, safety lead checking source/route with staff.",
      mustNotShow: "cars parked in the lane, fake UI overlays, floating labels, unreadable bulletin text.",
      composition: "open lane must be the clearest visual object; student movement path stays separate.",
    };
  }

  if (stepId === "route" && beatId === "movement") {
    return {
      camera: "low-angle exterior view along the fire truck response lane.",
      mustShow: "empty response lane, fire truck staged with space to move, evacuees routed on a separate walkway.",
      mustNotShow: "students walking in the truck lane, parked cars blocking responders, confusing crossing routes.",
      composition: "lane is a strong diagonal, evacuee path is visibly separate and safer.",
    };
  }

  if (stepId === "route") {
    return {
      camera: "first-person viewpoint at the pickup gate deciding between gate crowd and safer assembly route.",
      mustShow: "gate bottleneck risk, clear alternate route toward assembly area, responder lane left open.",
      mustNotShow: "uncontrolled crowd, blocked fire truck, students in danger, text labels.",
      composition: "two route options must be visually distinguishable: congested gate side and safer open route side.",
    };
  }

  if (stepId === "people") {
    return {
      camera: "medium-wide view at the upwind assembly area.",
      mustShow: "headcount being performed, buddy support for mobility-impaired students, medication/care kit with staff, calm group formation.",
      mustNotShow: "medical emergency, separated children, chaotic parent pickup, smoke covering the group.",
      composition: "assembly group in organized clusters with care support clearly visible.",
    };
  }

  if (stepId === "share") {
    return {
      camera: "close but clear handoff moment at assembly area edge.",
      mustShow: "safety lead speaking into a phone/radio, staff receiving instructions, group visible behind them, route still safe.",
      mustNotShow: "screens with readable text, brand logos, fake app UI, dramatic disaster scene.",
      composition: "human communication is the focus; background confirms safe assembly and responder lane discipline.",
    };
  }

  return {
    camera: "first-person emergency-training viewpoint with clear route geometry.",
    mustShow: "one obvious safe action, one visible route cue, calm students, safety lead.",
    mustNotShow: "ambiguous map collage, unreadable text, panic, gore, blocked route.",
    composition: "single scene with center route clarity and HUD-safe negative space.",
  };
}

function formatFrameTitle(body: ScenarioFrameRequest) {
  const stage = body.stepId ? body.stepId.replace(/-/g, " ") : "scenario";
  const beat = body.beatId ? body.beatId.replace(/-/g, " ") : "frame";

  return `${stage} ${beat} frame`;
}

function hashFrameSeed(value: string) {
  return [...value].reduce((hash, character) => {
    return (hash * 31 + character.charCodeAt(0)) | 0;
  }, 7);
}
