# Agency OS — Digital Marketing Agency Platform

**Always-free. Permissive licenses. Light-hearted theme. Many options.**
Status: research complete → plan locked → **no code written yet**.
Decisions confirmed: Profile A first · permissive-first · BYO-endpoint AI · thin-slice Phase 1.

---

## 1. Core architectural decision

A digital marketing agency platform is not one app. It's **two layers**:

| Layer | What it is | Who builds it |
|---|---|---|
| **Agency OS Hub** | Your product: unified nav, client roster, cross-client KPIs, content studio, reports, money. Multi-tenant (agency → clients → campaigns). Light-hearted theme. | **We build this** (Next.js) |
| **Function Layer** | ~13 open-source services, each owning one marketing job (social, email, CRM, PM, analytics, design, invoicing…). | We assemble + integrate via API/webhooks |

The Hub is what makes this *your* agency. The function layer is free commodity capability we plug in. Never rebuild what OSS already does well.

---

## 2. Function layer — permissive-first picks (verified 2026-11-10)

| Function | Pick | Stars | License | Notes |
|---|---|---|---|---|
| Social scheduling | **Mixpost** | 3.9k | MIT | Buffer alternative, self-contained |
| Email / ESP | **Dittofeed** | 3.1k | MIT | Multi-channel engagement; NextBilling for paid |
| CRM | **Krayin CRM** | 24k | MIT | Laravel, lead/sales pipeline |
| Project mgmt | **Huly** | 28k | EPL-2.0 | Bundles PM + chat + CRM. Eclipse-friendly |
| Automation | **Node-RED** | 24k | Apache-2.0 | MIT-style permissive; n8n alt (Sustainable Use) |
| Analytics | **Umami** | 40k | MIT | Plausible alt (30k, AGPL) |
| Client BI | **Apache Superset** | 75k | Apache-2.0 | vs Metabase (AGPL-ish) / Grafana (AGPL) |
| Design | **Penpot** | 62k | MPL-2.0 | Weak-copyleft, file-level — fine |
| Time + invoicing | **SolidInvoice** | 1k | MIT | vs Kimai (AGPL) / Akaunting (NOASSERTION) |
| Email delivery | **Resend** | — | SaaS | 3,000 emails/mo free |
| Docs / playbooks | **Docmost** | 22k | AGPL-3.0 | *Weakest link* — see §2b |
| Landing pages | **GrapesJS** embedded | 26k | MIT | Build in-Hub |
| AI runtime | **Ollama** (local) | 187k | MIT | Bulk work, unlimited $0 |
| Deploy | **Coolify** | 66k | Apache-2.0 | Profile B later |

### 2b. License register — the honest list

**Clean (MIT/Apache/EPL/MPL) — safe for commercial agency use:** Mixpost, Dittofeed, Krayin, Huly, Node-RED, Umami, Superset, Penpot, SolidInvoice, GrapesJS, Ollama, Coolify, Appwrite (BSD-3), Better Auth (MIT), AppFlowy.

**AGPL-3.0 — acceptable for *internal self-hosted agency use*.** Trigger is *distributing modified software*; we won't. But it means: don't fork-and-sell, don't expose as a hosted service to the public.
→ Docmost (docs), Plane, Kimai, BillionMail, Postiz, Matomo, Mautic, Listmonk, AppFlowy, Superset-adjacent.

**NOASSERTION / source-available — read the license before commercial use:**
→ **n8n** (Sustainable Use — internal agency OK, *reselling hosting as a service NOT allowed*), Twenty, Chatwoot, Metabase, Formbricks, Outline, Windmill, Activepieces, Notifuse, ERPNext, Odoo.

**Decision rule going forward:** MIT/Apache/EPL by default. AGPL only where there's no permissive peer (docs/playbooks). No NOASSERTION tool gets embedded in the Hub — API-integration only, never redistributed.

**Postiz special case:** 41k stars, AGPL-3.0, and it's the *best* social scheduler (agentic AI, actively maintained). It stays on the Profile-B track as an external service. Mixpost (MIT) is the Phase-1 default so no AGPL ships in the Hub's own deployment.

---

## 3. Free-tier landscape (the real constraint)

### Profile A — always-free SaaS (Hub lives here)
| Service | Free limit |
|---|---|
| Cloudflare Pages | 500 builds/mo, 20k files, unlimited preview deploys |
| Cloudflare Workers | 100,000 req/day, **10 ms CPU/req** (fits API routes, not SSR-heavy) |
| Cloudflare Workers AI | 10,000 neurons/day (resets 00:00 UTC) |
| Cloudflare R2 | 10 GB storage, free egress |
| Neon (Postgres) | 1 GB/project, 100 CU-hrs, scales to zero |
| Supabase | 500 MB DB, 50k MAU, **pauses after 1 wk idle** |
| Resend | 3,000 emails/mo |
| Gemini API | Free on Flash-class (2.5 Pro/Flash, 3.1/3.5/3.6/3.8 Flash-Lite) |
| Groq | 30 req/min, 1k req/day (gpt-oss-120b) |
| OpenRouter `:free` | 50 req/day (**1,000** after $10 lifetime credit) |
| Sentry | 5k errors/mo |
| GitHub Actions | 2,000 min/mo |

⚠️ **GitHub Models free tier was retired 2026-07-30.** Don't plan on it.
⚠️ **Workers CPU is 10 ms free** — keep API routes thin; put PDF/report generation on a separate service or a paid-tier cron.
⚠️ **Supabase pauses after 1 week idle** — Neon is the safer default for a low-traffic agency tool.

### AI reality check → hence BYO endpoints
Free API LLM caps (50–1000 req/day) are the tightest constraint. So the Hub ships a **provider registry**:
- User adds any **OpenAI-compatible base URL + API key**
- Hub **fetches the model list** from `<base>/models` and lets the user **select** models
- Works with Gemini, Groq, OpenRouter, Ollama, LM Studio, vLLM, Together, DeepSeek, anything
- Prebuilt presets for the free tiers (Gemini/Groq/OpenRouter/Ollama) + **custom endpoint**
- Quota-aware fallback chain per task class (bulk → local/free, quality → premium)

**Verified endpoint shape:** `GET {base}/models` → OpenAI-compatible JSON `{data:[{id,...}]}`. OpenRouter returns 200 unauthenticated; Groq/Gemini need a key. A single `ProviderRegistry` adapter handles this with a `fetchModels()` capability probe.

### Profile B — self-host everything (later)
Oracle Cloud Always Free ARM (4 OCPU/24 GB) is the best free box but needs a card and capacity luck. Fallbacks: Koyeb/Render free (spin-down), spare Mac/NAS. **Coolify** on that box runs the whole function layer as Docker Compose.

⚠️ **Business-model caveat:** free tiers are for **your agency's own operations**, not for reselling hosting to clients. Design the Hub so paid SaaS swaps in per-module later — that's the point of the function-layer split.

---

## 4. Light-hearted theme spec

**Principle:** serious agency capabilities, unserious presentation.

| Token | Decision |
|---|---|
| Palette | Pastel accents — mint `#7DE2C3`, peach `#FFB4A2`, sky `#8ECBFF`, butter `#FFD166`, lilac `#C3A6FF`; base paper `#FFFDF9`; ink `#1F242B` |
| Type | Nunito / Baloo 2 / Fredoka (all OFL, free) — rounded, friendly |
| Shape | 16–24 px radius, soft layered shadows, no harsh 1px borders |
| Motion | Spring-y transitions, confetti on success, wiggle on hover (framer-motion) |
| Icons | Twemoji (MIT), Fluent Emoji (MIT), OpenMoji (CC BY-SA) |
| Avatars | DiceBear (MIT) |
| Illustrations | unDraw (MIT) — pastel line style, on-brand |
| Copy | Witty microcopy. Empty states: *"No reports yet — let's make something people brag about."* |
| Rules | One accent per surface. Sentence-case buttons, never uppercase. Dark mode optional later; brand colors never flip. |

Base UI: **shadcn/ui** (128k, MIT) + **Tailwind** (99k, MIT) → themeable via CSS tokens. Cost near-zero.

---

## 5. Agency OS Hub — module map

```
/dashboard          Command Center — cross-client KPIs, alerts, "today" queue
/clients            Roster, contracts, health score, onboarding checklist
/campaigns          Multi-channel planner (social/email/SEO/SEM), calendar
/content-studio     AI draft → human edit → asset library → templates
/pipeline           CRM deals, proposals, follow-ups
/delivery           Projects/tasks, deadlines, client approvals
/time-money         Timesheets, invoices, retainer vs. project, P&L
/reports            Auto-generated monthly client reports (white-label PDF)
/automations        Workflow registry + trigger recipes
/playbooks          SOPs, checklists, onboarding
/settings           Integrations, API keys, AI providers, theme, team, roles
```

**The three features that actually win agency money:**
1. **Auto client reports** — pull metrics from Umami/GA → white-label PDF, scheduled. Recurring revenue.
2. **Multi-client Command Center** — one screen, every client's health. Replaces 6 tabs.
3. **Content engine** — brief → AI draft → approval workflow → auto-schedule to Mixpost/Postiz. Kills the bottleneck.

---

## 6. Phase 1 — thin slice (confirmed)

**One client, end-to-end: CRM → content → schedule → report.**

| Step | Deliverable | Stack |
|---|---|---|
| 1 | Repo + license register + design tokens + theme | Tailwind, shadcn/ui |
| 2 | Auth + multi-tenancy (role: owner/manager/editor/client) | Better Auth (MIT), Neon |
| 3 | Prisma schema: agency, client, contact, deal, campaign, content, report | Prisma + Neon |
| 4 | Client roster + pipeline (CRM read/write) | Krayin API integration |
| 5 | Content Studio: brief → AI draft → edit → approve | ProviderRegistry + Gemini/Groq/Ollama |
| 6 | Schedule & publish handoff | Mixpost API |
| 7 | Auto monthly report (white-label PDF) | Umami API + PDF lib |
| 8 | Deploy + CI + error tracking | Cloudflare Pages, GitHub Actions, Sentry |

Success = **one client whose full month runs through the Hub without a human touching a third-party UI.**

---

## 7. Later phases

| Phase | Deliverable |
|---|---|
| 2 | Profile B bring-up (Coolify): Postiz, Node-RED, Huly, Docmost, Coolify |
| 3 | Campaign planner, calendar, approval workflow |
| 4 | Time + invoicing + proposals (SolidInvoice) |
| 5 | Playbooks, AI agent recipes, multi-agency/white-label |
| 6 | Hardening: webhooks/retries, SSO, backups, quota guardrails, monitoring |

---

## 8. Token / cost discipline (your constraint)

- **Configuration over code**: Node-RED workflows, Tailwind tokens, Prisma schema, JSON campaign templates.
- **Don't hand-write what OSS ships**: don't rebuild email sending, social posting, analytics, PDF libs, drag-drop. Bind to APIs.
- **Ship thin vertical slices**: one client end-to-end before broad features.
- **Document decisions, not prose** — `DECISIONS.md`, one line per choice + why.
- **Local models for bulk** so free API quotas survive (50/day is nothing).
- **Model registry, not per-provider code** — one adapter handles all OpenAI-compatible endpoints, so adding a provider is config, not code.

---

## 9. Open items to resolve during Phase 1 (not blocking)

1. **Krayin vs. build-in-Hub CRM** — Krayin (MIT) is solid; but a thin in-Hub pipeline may serve the slice better. Decide at schema time.
2. **Dittofeed vs. Listmonk/BillionMail** — Dittofeed is MIT but smaller (3.1k). Revisit if email needs a mail server (BillionMail bundles one).
3. **Reports**: white-label PDF generator in-Hub vs. Superset embeds for internal BI. Recommended: in-Hub PDF for clients, Superset internal only.
4. **PDF library**: no strong OSS winner found via GitHub search — will evaluate `pdf-lib` / `react-pdf` / headless-Chrome at implementation time.
5. **Node-RED vs. n8n** — Node-RED is Apache-2.0 and cleaner; n8n has richer AI nodes but a restrictive license. Node-RED default, n8n as external service later.

---

## 10. Research sources

- GitHub API (repo metadata, stars, licenses, maintenance dates) — verified 2026-11-10
- [openorchstr.com/guides/marketing-agency](https://openorchstr.com/guides/marketing-agency) — 12-tool agency stack reference
- [free-ish.dev](https://free-ish.dev/) — free-tier limits registry
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [api.foo free LLM limits](https://api.foo/docs/en/free-llm-api/), [frontierdot](https://frontierdot.com/best/free-llm-apis/)
- Exa web search via agent-reach
