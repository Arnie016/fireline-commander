# Architecture

Fireline Commander is a simulation-first emergency drill app. The player sees a role-based drill, not a chatbot.

## Flow

1. The player starts a drill scenario.
2. The app sends scenario, hazard, role, and route condition to `/api/agent/retrieve-guidance`.
3. The server retrieves matching drill knowledge.
4. The agent layer turns that evidence into a recommendation, checklist, and consequence.
5. The cockpit shows the guidance as mission intelligence while the player makes decisions.

## Layers

| Layer | Role |
| --- | --- |
| Simulation UI | Scenario launcher, cockpit, route choices, consequences, handoff artifacts |
| Retrieval | Searches the drill knowledge source by scenario, role, hazard, and condition |
| Agent reasoning | Produces role-specific action guidance from retrieved context |
| Evidence archive | Stores deterministic fallback outputs for review when hosted services are unavailable |

## Safety Boundary

Fireline Commander is training support. It does not replace emergency authorities or official alerts.

