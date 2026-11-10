# Brightside — Agency OS

A digital marketing agency console: clients, content, campaigns, pipeline and
money on one screen.

Built to run on **always-free tiers** — no paid SaaS required to explore it, and
no API key needed to see the whole thing working.

![Dashboard](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## Quick start

```bash
git clone https://github.com/ahmedimran35/agency-OS.git
cd agency-OS
npm install
npm run dev
```

Open <http://localhost:3000>. That is the whole setup — **no environment
variables, no database, no API key.** The app runs on an in-memory dataset
and every screen is fully interactive.

To run it for real:

```bash
npm run build && npm start
```

## The screens

| Route | What it does |
|---|---|
| `/dashboard` | Command Center — cross-client KPIs, an attention queue, health dials, pipeline snapshot |
| `/clients` | Client roster with search, status filters and health scoring |
| `/clients/[slug]` | Per-client tabs: overview, content, campaigns, reports, deals |
| `/pipeline` | Drag-and-drop CRM Kanban with deal value and probability |
| `/campaigns` | Campaign planner with a calendar grid and budget tracking |
| `/content-studio` | AI drafting composer, content board, provider manager |
| `/delivery` | Project and task board with today's focus |
| `/time-money` | Retainers, hours log, invoices, profit snapshot |
| `/reports` | Auto-generated client reports with period-over-period deltas |
| `/automations` | Automation recipe registry with run simulation |
| `/playbooks` | SOP knowledge base with interactive checklists |
| `/settings` | Agency, team, integrations, free-tier usage meters |
| `/settings/providers` | AI provider manager with live model discovery |

## Bring your own AI

`/settings/providers` → **Add an endpoint** → paste any OpenAI-compatible
base URL and API key → **Fetch models** → tick the ones you want → **Save
provider**.

- Presets for **Google Gemini**, **Groq**, **OpenRouter** (all have free
  tiers) and **Ollama** (local, unlimited).
- Works with any OpenAI-compatible endpoint: vLLM, LM Studio, Together,
  DeepSeek, or your own gateway.
- API keys are held server-side and are **never sent back to the browser**.

| Endpoint | Purpose |
|---|---|
| `POST /api/ai/models` | Model discovery (`GET {baseUrl}/models`) |
| `POST /api/ai/generate` | Chat completion (`POST {baseUrl}/chat/completions`) |
| `GET · POST · PATCH · DELETE /api/ai/providers` | The provider registry |

## Design

The app is built on the **Sorbet** palette: a soft ivory ground, coral as the
primary, sky and butter as the second and third hues, and pastel washes that
give each client their own identity. Cards sit a shade whiter than the ground
with a visible hairline and a soft shadow, so the page reads as objects on a
desk rather than a flat wash.

Motion is short and calm — a lift on hover, a settle on enter, figures that
count up, a health dial that draws its arc.

A sparse field of drifting points sits behind every screen, drawn with
three.js. One draw call per frame, loaded on browser idle, and it does nothing
at all without WebGL or with `prefers-reduced-motion` enabled.

The full system is documented in [`design.md`](./design.md) and implemented in
[`src/app/tokens.css`](./src/app/tokens.css).

## Architecture

```
src/
  app/
    api/ai/              provider registry, model discovery, generation
    dashboard/           the Command Center
    clients/             roster and per-client detail
    pipeline/ campaigns/ content-studio/
    delivery/ time-money/ reports/
    automations/ playbooks/ settings/
    tokens.css           the design tokens (source of truth)
    base.css             the base layer
    globals.css          the entry stylesheet
  components/
    ui.tsx               the shared kit (Card, Button, Badge, Stat, HealthDial…)
    app-shell.tsx        the left rail and mobile nav
    background-field.tsx the three.js point field
    trend-chart.tsx      a reusable SVG area chart
    client-card.tsx      a reusable client card
    icons.tsx            the shared icon registry
    content-studio/      the composer, provider manager and actions
  lib/
    types.ts             domain types — the contract every layer shares
    utils.ts             cn() and the formatters
    data.ts              the data access contract
    ai/                  provider presets, fetchModels, generateText
```

**Swapping the mock data for a real database:** replace the bodies of the
functions in `src/lib/data.ts` and `src/lib/ai/store.ts`. Every page reads
through those two modules, so no caller changes.

## Build notes

Next.js 16 with `cacheComponents: true`. Three things that will bite you, all
already handled in this codebase:

- `Date.now()` and `new Date()` during prerender **abort the build**. Pages
  that need the clock use `await connection()` plus `export const instant = false`.
- Function props **cannot cross the server/client boundary**. Pass
  serializable values (`valueFormat: "compact"`) rather than callbacks.
- `@utility` rules must live in the entry stylesheet. A file imported with
  `layer(base)` cannot declare one.

## The stack behind it

The console is the product. The services it talks to are open source and
free to self-host — see [`PLAN.md`](./PLAN.md) for the full register, including
which are AGPL (external-only) and which source-available licences (n8n,
Twenty, Chatwoot) are excluded from the app itself.

## License

MIT. See [LICENSE](./LICENSE).
