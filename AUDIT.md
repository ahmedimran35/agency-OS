# Hallmark Audit — Brightside (Agency OS)

**Target:** `/Users/imran/difital-marketing` · **Scope:** app screens · **Genre:** playful
**Run:** `sloplint src --scope app --render --url http://127.0.0.1:3222/dashboard`

## Result after the redesign

**Floor 0 FAIL · Reflex 0 · Finish 0** across 37 files, 14 routes, five viewport widths.

| | Before | After |
|---|---|---|
| Floor FAIL | 183 | **0** |
| Reflex | 9 | **0** |
| Finish / WARN | 11 | **0** |
| Emoji used as icons | 147 | **0** |
| `transition-all` | 19 | **0** |
| Tracked-caps labels | 26 | **0** |
| Horizontal scroll | 4 breakpoints | **0** |
| Contrast failures | 9 | **0** |
| Focus ring failures | 14 | **0** |

Also verified beyond the linter:
- **Contrast** — every text element on all 11 screens checked against its painted
  background. All pass WCAG AA.
- **Responsiveness** — 11 routes × 5 widths (320, 375, 768, 1280, 1920).
  No horizontal overflow anywhere.
- **Routes** — all 14 return 200 with no server error.
- **Typecheck and production build** — clean.

The redesign replaced the first palette (a drenched deep-green ground) with a
light, warm-ivory one after feedback that it read as heavy and flat. The
current system is documented in `design.md`.

---

## First pass (before the redesign)

## The read

Brightside is an **agency operating console** — 14 routes of tables, boards, forms and stat rows. Audience: agency owners running 5–20 clients. The one action per screen is "see what's on fire and handle it."

**What works and stays:** the Command Center genuinely earns its place. Cross-client KPIs, a health ring per client, an attention queue that says what's actually due, and a drag-and-drop pipeline with real money in it — that's agency-specific, not a generic dashboard template. The pastel system is coherent and the copy is warm without being cute-for-cute's-sake ("Nothing here — yet ✨").

**What reads as generated:** the *decoration* layer. Emoji are doing the job of an icon library in 96 places, sitting right next to `lucide-react` in the same 18 files. Labels are set in tracked small caps in 26 places — the single most reliable tell of a machine-set interface. And `transition-all` in 19 spots, which is both a Hallmark Floor failure and a real perf smell.

**What is broken:** four things actually matter — focus rings at 1.7:1, text at 2.98:1, horizontal scroll at 320–414px, and `transition-all`. The first two are accessibility failures that make the app harder to use for everyone. The rest is polish.

---

## Floor failures — 183

### A. Accessibility and contrast — the ones that matter

| Gate | Count | Where | What's wrong |
|---|---|---|---|
| **26a** | 14 | `globals.css:113` (all nav, cards, links) | Focus ring is `--sky #8ECBFF` = **1.70:1** against paper. Needs 3:1. |
| **40** | 9 | `globals.css` `--ink-faint #8B95A3` | Small text at **2.98:1**. Needs 4.5:1. 127 uses across the app. |
| **34** | 4 | `globals.css:1`, `trend-chart.tsx:243`, `dashboard/page.tsx:150` | Horizontal scroll, `scrollWidth 677` vs `clientWidth 365`. |

**Root causes, all in `src/app/globals.css`:**

- **Focus ring** — `outline: 2px solid var(--sky)` (line 114). `--sky` is a pastel, so it can't reach 3:1 on paper. Needs a dedicated `--focus` token: a saturated mid-tone that reads on paper *and* on the tinted surfaces. `--ink` at 15.36:1 works but is heavy; something around `#3B82F6`-ish on this warm paper lands ~3.5:1.
- **Faint text** — `--ink-faint: #8b95a3` (line 24) is used for labels, timestamps and metadata at 11–12px. It's too light for its job. `--ink-soft #5B6470` is **5.9:1** and passes comfortably — so the fix is to promote `--ink-faint` to roughly `#767F8C` (≈4.6:1) and keep the two-step hierarchy.
- **Overflow** — three separate causes, all confirmed by measurement at 375px:
  1. `trend-chart.tsx:243` — `<svg width={width}>` where `width` is a **fixed pixel value** (default 640). It never shrinks, so the SVG is 677px wide inside a 365px viewport. Needs `width="100%"` with the viewBox doing the scaling.
  2. `dashboard/page.tsx:150,154` — the two decorative `blur-2xl` orbs are positioned `-right-16` / `right-32` with `absolute`; they extend past the viewport edge. The parent has `overflow-hidden` but the orb is `position: absolute` against a `relative` header that itself sits inside a page without a clipping context.
  3. `globals.css` — no `overflow-x: clip` on `html`/`body`. This is the belt-and-braces fix the gate asks for, and it alone would clear the scrollbar.
  
  The mobile nav strip (`app-shell.tsx`) uses `overflow-x-auto` correctly — that one is intentional scrolling, not overflow.

### B. `transition-all` — 19 findings

`globals.css` aside, the biggest offenders are in `src/components/ui.tsx`:
- `ui.tsx:130` — the `Button` base class: `transition-all duration-200`
- `ui.tsx:439` — `Progress` bar fill
- `ui.tsx:488` — `HealthRing` stroke

Others: `pipeline-board.tsx:322,414` · `delivery-board.tsx:472` · `playbooks-library.tsx:363` · `roster.tsx:113,128` · `automations-registry.tsx:465` · `settings-workbench.tsx:489` · `tabs.tsx:129` · `dashboard/page.tsx:285`.

**Fix:** name the properties. `transition-colors` for state changes, `transition-[transform,opacity]` for the lifts. This is also a genuine performance win — `transition-all` forces the browser to watch every property.

### C. Emoji as icons — 96 findings

**This one directly conflicts with the brief.** The light-hearted theme was specified with emoji as a deliberate device — the nav, the stat tiles, the attention panel, the confetti. Gate 30a (Floor) says an emoji standing in for an icon is a fail.

**But the project already uses `lucide-react` in all 18 of the same files.** So the current state is the worst of both: two icon systems in one place, and 96 emoji doing work that a proper icon could do.

**My recommendation — split it, don't pick a side:**

- **Keep** emoji where they're *content*, not chrome: the confetti burst (`confetti.tsx:16`), the toast sparkle (`agency-toast.tsx:121`), the empty-state illustrations (`ui.tsx:319` 🌱), and the greeting 👋 (`dashboard/page.tsx:167`). These are the light-hearted signature and they read as personality, not as broken icons.
- **Replace** emoji where they're *navigation and controls*: the 10 nav items in `app-shell.tsx:24-33` (each already has a lucide icon sitting right next to it — literally unused), the channel picker buttons in `campaign-planner.tsx:73-77`, and the filter chips.

That last one is worth calling out: `app-shell.tsx` imports `LayoutDashboard`, `Users`, `Handshake` and nine other lucide icons — and renders the emoji *instead*. The icons are imported and discarded. That's not a design disagreement, that's a bug in how the agents merged their work.

**This is the one place the audit needs your call**, because it's the one place where following the gate means giving up part of what you asked for. Options: (a) split as above — best of both; (b) full emoji, waive 30a on the record; (c) full lucide, drop the light-hearted iconography.

### D. Tracked-caps labels — 26 findings

Gate 67 (Floor, house rule): labels, captions, table heads and tags at 15px or under set uppercase or letter-spaced past `0.03em`.

Pattern across the app: `text-xs font-semibold tracking-wide uppercase` on section labels, and `text-[11px] font-bold tracking-wide uppercase` on stat captions.

- `ui.tsx:390` — `StatTile` label (the shared component, so it propagates everywhere)
- `client-card.tsx:104`, `tabs.tsx:195` — "Health"
- `time-money.tsx:475-487` — table heads: Date, Client, Task, Hours, Billable
- `automations-registry.tsx:244,255,322,330,339,458`
- `campaign-planner.tsx:420,428,546,598`
- `reports-workbench.tsx:648,686,704,717,727`

**Fix:** drop `uppercase` and `tracking-*`, keep the size step. The `StatTile` fix alone removes most of the count since it's the shared component.

### E. Copy tells — 10 findings (gate 19)

Em/en dashes in prose at: `automations-registry.tsx:263` · `campaign-planner.tsx:779` · `clients/[slug]/page.tsx:47` · `delivery-board.tsx:427` · `pipeline-board.tsx:358` · `reports-workbench.tsx:478` · `settings-workbench.tsx:623` · `time-money.tsx:330` · `content-studio.tsx:423` · `provider-manager.tsx:368`.

One line each — a comma or full stop instead. Cheap fix.

### F. Other Floor gates

| Gate | Count | Where | Fix |
|---|---|---|---|
| **20** | 1 | `globals.css:1` | Add the Hallmark stamp comment as line 1 |
| **54** | 2 | `dashboard/page.tsx:161`, `reports-workbench.tsx:686` | Eyebrow before a heading. The dashboard one is "BRIGHTSIDE STUDIO" over the greeting — that's a brand/eyebrow line that carries no fact. |
| **33** | 1 | `ui.tsx:479` | `<svg>` in `HealthRing` lacks `aria-hidden` |
| **49a** | 1 | render | A button label wraps at some width — needs `whitespace-nowrap` |
| **7b** | Reflex | `globals.css:40` | `--paper-raised: #ffffff` is a pure absolute. Tint it toward the warm hue (e.g. `#FFFDFC`). |

---

## Reflex — 9

| Gate | Count | Where | Note |
|---|---|---|---|
| **29** | 7 | `dashboard/page.tsx:150,154` (blurred orbs) · `automations-registry.tsx:439`, `campaign-planner.tsx:771`, `roster.tsx:159`, `settings-workbench.tsx:913`, `content-studio.tsx:961` (dialog backdrop-blur) | Glow/wash. The two orbs are decorative glow — they'd go with the overflow fix. The dialog backdrops use `backdrop-blur-[2px]` over `bg-ink/25`; a solid scrim is the standard fix. |
| **49b** | 1 | render, 320px | "All reports" wraps to 2 lines |
| **7b** | 1 | `globals.css:40` | Pure `#fff` — tint it |

---

## Finish — 3 (never block)

`F1` straight quotes in prose: `delivery-board.tsx:321` ("Today's focus") · `reports-workbench.tsx:562` · `time-money.tsx:359`. Use typographic quotes `“ ” ’`.

---

## What this costs to fix

| Work | Size | Gates cleared |
|---|---|---|
| `globals.css` — focus token, faint-text token, `overflow-x: clip`, tint paper, stamp | **~30 min** | 26a ×14, 40 ×9, 34 ×4, 7b, 20 |
| `trend-chart.tsx` — responsive SVG width | **~10 min** | 34 (primary cause) |
| `dashboard/page.tsx` — remove/reposition the two orbs | **~10 min** | 34, 29 ×2 |
| `ui.tsx` — `transition-all` → named properties, `StatTile` label case, `HealthRing` aria | **~20 min** | 10a ×3, 67 (many), 33 |
| Remaining `transition-all` across 9 files | **~40 min** | 10a ×16 |
| Label case across 6 files | **~40 min** | 67 (remaining ~20) |
| Em dashes (10 lines) | **~15 min** | 19 ×10 |
| Straight quotes (3 lines) | **~5 min** | F1 ×3 |
| **Emoji → lucide in control slots** | **~1.5 hr** | 30a ×~70 (of 96) |

Roughly **3.5 hours** for the mechanical Floor work including the emoji pass, **~2 hours** without it.

---

## The lightest depth that settles each

| Depth | Covers |
|---|---|
| **polish** | Every Floor gate except 30a, all Reflex, all Finish. Fixes tokens, labels, transitions, overflow, a11y. **No layout or composition changes.** |
| **restyle** | Adds: removing the glow, the tracked-caps system, and swapping the control-slot emoji for lucide. Keeps every layout and every word. |
| **full** | Not warranted. The composition and anatomy are genuinely agency-specific — the attention queue, the health rings, the pipeline stages all belong to this product. A full redesign would cost the thing that makes it good. |

**My recommendation: restyle.** It clears the accessibility failures, the mechanical tells and the emoji conflict, while keeping the composition that's working.

---

## Files that would be touched

```
edit:  src/app/globals.css
       src/components/ui.tsx
       src/components/app-shell.tsx
       src/components/trend-chart.tsx
       src/components/client-card.tsx
       src/app/dashboard/page.tsx
       src/app/pipeline/pipeline-board.tsx
       src/app/campaigns/campaign-planner.tsx
       src/app/clients/roster.tsx
       src/app/clients/[slug]/tabs.tsx
       src/app/clients/[slug]/page.tsx
       src/app/delivery/delivery-board.tsx
       src/app/time-money/time-money.tsx
       src/app/reports/reports-workbench.tsx
       src/app/automations/automations-registry.tsx
       src/app/settings/settings-workbench.tsx
       src/app/content-studio/content-studio.tsx
       src/components/content-studio/provider-manager.tsx
create: none
delete: none
```

Nothing is deleted. Every route, field, handler and link stays.

---

## The one open question

**Gate 30a vs. the light-hearted brief.** 96 emoji-as-icon findings. The fix splits them: keep emoji as personality (confetti, toasts, empty states, the greeting), replace them with lucide in navigation and controls. The nav is the easy case — the lucide icons are already imported there and unused.

If you'd rather keep emoji everywhere, that's a waivable Reflex-style decision on the record (`/* Hallmark · waive 30a · the emoji are the light-hearted theme the brief asked for */`), and I can put it in the stamp. But the nav case I'd fix regardless, since the icons are sitting right there unused.
