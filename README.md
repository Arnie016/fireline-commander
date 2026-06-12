# Fireline Commander

Netflix-style emergency drill simulations for school safety.

**Practice the emergency before the emergency practices you.**

Fireline Commander turns emergency procedures into playable, role-based drills. A learner chooses a scenario, enters a first-person cockpit, makes route decisions, sees consequences, and leaves with a practical handoff.

## What It Does

- Starts fast, visual drill scenarios for fire, flood, typhoon, tsunami, and heat response.
- Lets learners play roles such as teacher, school safety lead, family lead, clinic lead, or student marshal.
- Retrieves scenario guidance before recommending the next action.
- Shows concise mission intelligence inside the cockpit.
- Produces checklist, consequence, route, and handoff artifacts.

## How It Works

1. A player starts a drill.
2. The app sends scenario state to `/api/agent/retrieve-guidance`.
3. The server searches the drill knowledge source.
4. The agent layer returns a role-specific action plan.
5. The UI turns that guidance into a playable decision loop.

When hosted retrieval credentials are not available, the app uses the committed demo evidence dataset and labels it clearly.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Final Verification

```bash
npm run hackathon:final
```

This regenerates the evidence archive and runs the production build.

## Key Files

- `components/beacon-app.tsx`
- `app/api/agent/retrieve-guidance/route.ts`
- `src/data/drill_knowledge.json`
- `src/lib/knowledge-retrieval.ts`
- `src/lib/gemini-agent.ts`
- `demo-evidence/retrieval-report.md`

## Docs

- `docs/ARCHITECTURE.md`
- `docs/SETUP.md`
- `docs/DEMO.md`
- `docs/EVIDENCE.md`

## License

MIT
