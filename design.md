# Design: Brightside

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System

- Genre: playful
- Shape of the first page: app screen (an agency console, not a marketing site)
- Theme: custom, by request. Three candidate palettes, one chosen at the end.
- Axes: light/rounded-sans/cool · posture: restrained
- Idea: a quiet desk, not a neon control room. A cool dove ground with warm-white
  cards, so every surface reads as a lit object sitting on the desk.

## Palette

One palette: **Sorbet**. A light warm ground with coral as the primary and
sky and butter as the second and third hues, so the palette reads as a
combination rather than one accent on a page.

| Role | Token | Value |
|---|---|---|
| The ground | `--color-paper` | `oklch(98.8% 0.01 88)` |
| A tile | `--color-paper-2` | `oklch(96.8% 0.013 88)` |
| A well | `--color-paper-3` | `oklch(93.8% 0.016 90)` |
| A card | `--color-paper-raised` | `oklch(99.8% 0.004 85)` |
| Ink | `--color-ink` | `oklch(25% 0.026 40)` |
| Primary, a fill | `--color-accent` | `oklch(56% 0.145 35)` coral |
| Second | `--color-accent-2` | `oklch(54% 0.105 225)` sky |
| Third | `--color-accent-3` | `oklch(86% 0.11 92)` butter |
| Primary, as text | `--color-accent-text` | `oklch(46% 0.145 35)` |
| Focus | `--color-focus` | `oklch(46% 0.14 35)` |

**A fill is not a text colour.** The accent has two forms: `--color-accent` for
buttons, and `--color-accent-text` (the same hue at 46% L) for when the accent
is the text. Without the split, an accent used as text on its own soft ground
lands at 4.25:1 and fails.

The five client identities are the pastel washes: `--color-mint`, `--color-peach`,
`--color-sky`, `--color-butter`, `--color-lilac`. Each client keeps its own
colour on its card and in the roster.

## Tokens

`src/app/tokens.css` is the source of truth. The roles:

```css
@theme static {
  --color-paper:   oklch(98.8% 0.004 85);   /* the ground: warm ivory */
  --color-paper-2: oklch(96.5% 0.008 85);   /* a tile, one step deeper */
  --color-paper-3: oklch(93.8% 0.012 85);   /* a sunk well */
  --color-paper-raised: oklch(99.6% 0.003 85); /* a card, whiter than the ground */
  --color-ink:     oklch(26% 0.02 265);     /* cool near-black */
  --color-ink-2:   oklch(40% 0.022 265);
  --color-muted:   oklch(46% 0.02 265);
  --color-rule:    oklch(90% 0.012 265);     /* the visible hairline */
  --color-accent:  oklch(50% 0.15 272);     /* soft periwinkle, controls only */
  --color-accent-2:oklch(44% 0.16 272);
  --color-accent-soft: oklch(95% 0.03 272); /* a selection or a current state */
  --color-accent-ink: oklch(99.4% 0.005 272);
  --color-focus:   oklch(52% 0.17 272);
  --color-mint:    oklch(93% 0.045 165);    /* pastel washes, identity only */
  --color-peach:   oklch(93% 0.045 45);
  --color-sky:     oklch(93% 0.04 235);
  --color-butter:  oklch(94% 0.05 95);
  --color-lilac:   oklch(93% 0.045 305);
  --color-error:   oklch(93% 0.045 25);     /* soft fill, never a red field */
  --color-error-ink: oklch(42% 0.13 25);
  --color-success: oklch(93% 0.05 160);
  --color-success-ink: oklch(36% 0.09 160);
  --font-display: var(--font-figtree), ui-sans-serif, system-ui, sans-serif;
  --font-body:    var(--font-manrope), ui-sans-serif, system-ui, sans-serif;
  --radius-card: 1.25rem; --radius-control: 0.75rem; --radius-pill: 999px;
  --shadow-card: 0 1px 2px oklch(30% 0.02 265 / 0.04), 0 6px 16px -8px oklch(30% 0.02 265 / 0.12);
}
```

Every pair above was contrast-checked against its own background before it was
written down. `ink` on `paper` is 15.0:1, `muted` on `paper` is 6.9:1,
`accent-ink` on `accent` is 8.0:1, `focus` on `paper` is 4.9:1.

## Surfaces

The ladder, in order. Climb different rungs at different seams.

1. **Whitespace** — the ground showing between blocks.
2. **A hairline** — `--color-rule` at 1px, or a 2px bar above a section or a table.
3. **A tile** — `bg-paper-2`, no border, no shadow. The default group container.
4. **A sunk well** — `bg-paper-3`, for a region inside a tile.
5. **A card** — `bg-paper-raised` with a 1px `--color-rule` border AND a soft `--shadow-card`. It is warm white against a cool dove ground, so it lifts off it. This two-temperature trick is what makes the page read as objects on a desk rather than a flat wash.

The ground itself is never a flat fill: `body` carries a soft accent bloom at the
top and a light-to-dark wash over the first screen, both static and both
subtle enough to read as light rather than as decoration.

**Never** a card inside a card. **Never** a border and a heavy shadow together.

## Colour posture

**Restrained.** The accent marks the primary action, the current selection and
state. Nothing else. Pastel washes (`--color-mint`, `--color-peach`, `--color-sky`,
`--color-butter`, `--color-lilac`) give each client their own identity and carry
no meaning on their own. Status is a soft fill with dark ink on it, never a
saturated field.

**No heavy colour.** No deep green, no red field, no glow, no dark mode. The
page is light and stays light.

## Controls

- **Primary**: accent fill (`bg-accent`), `text-accent-ink`, 2px `border-accent`, `--radius-control`, 40px tall. Pressed steps to `--color-accent-2`.
- **Secondary**: transparent fill, 2px `--color-rule` border, same radius and height.
- **Ghost**: transparent, `text-ink-2`, fills `--color-paper-2` on hover.
- **Input**: 40px, 1px `--color-rule` border, `--radius-control`, `bg-paper-raised`. Focus is an accent border plus a 4px accent ring at 15%, never a border change alone.
- **Chip / tag**: `--radius-pill`, 12px bold, `bg-paper-3`.
- One filled primary per screen. Secondaries are never louder than it.

## Type

- **Display** — Figtree 800, `--tracking-display`, line-height 1.12. Headings are one weight, one style, one colour.
- **Body** — Manrope 400/700, 16px, line-height 1.55.
- **Figures** — Figtree 800 with `tabular-nums`. A stat is a title that never wraps and a figure. No icon on a stat.
- **Labels, captions, table heads, meta** — the body face, 14px or 12px, **sentence case, untracked**. Never uppercase, never letter-spaced. Gate 67 is not waivable.
- Three weights only: 400, 700, 800.

## Hard rules

These are Floor gates. A screen that breaks one does not ship.

1. **No emoji as an icon.** Use `lucide-react`, or a name from `src/components/icons.tsx`. An emoji may appear inside a sentence of prose, never as a nav glyph or a control icon.
2. **No `transition-all`.** Name the properties: `transition-colors`, `transition-opacity`, `transition-transform`, `transition-[width]`.
3. **No eyebrow.** A section opens on its heading, or on a fact the reader needs.
4. **No tracked caps.** No `uppercase`, no `tracking-wide` on any label, caption, table head, tag or nav link.
5. **No em or en dash in prose.** A comma, a colon, a full stop or parentheses.
6. **Curly quotes** in prose: `“ ” ’`.
7. **Charts take `width="100%"` with a viewBox.** A fixed pixel width overflows and paints over whatever sits below it.
8. **Focus is instant.** Never animate a focus ring. The ring is `--color-focus`.
9. **Every animation has a reduced-motion fallback.** Only `transform` and `opacity`.
10. **Every interactive element** needs a visible hover, focus-visible, active and disabled state.

## States

Every region that loads data has four states: **loading** (a skeleton in the
shape of what is coming), **empty** (what belongs here and the one action that
fills it), **error** (what broke and what to do), **full**.

## The background field

A sparse lattice of drifting points behind every screen, drawn with three.js.

Deliberately cheap:
- One `BufferGeometry`, one `ShaderMaterial`, **one draw call** per frame.
- No loaders, no textures, no post-processing, no shadows, no controls.
- 416 points, `devicePixelRatio` capped at 1.5.
- `import("three")` is dynamic and runs inside `requestIdleCallback`, so the
  renderer is fetched only when the browser has nothing better to do.
- It checks for WebGL first and does nothing if there is none.
- It stops entirely when the tab is hidden.
- Under `prefers-reduced-motion` it never loads at all.
- The points are drawn at 16% opacity: texture, not decoration.

## Motion

- Character: calm and quick. `--dur-micro` 120ms for press and colour, `--dur-short` 220ms for hover, `--dur-long` 420ms for a modal or a settle.
- **Entrance**: one settle. Content rises 10px and fades in over 550ms, staggered by 60ms. `.stagger` staggers a row by `--i`; `.animate-rise`, `.animate-scale`, `.animate-slide` are the per-element utilities.
- **The dial draws itself in** (`.animate-draw`) over 1s.
- **Figures count up** when they scroll into view (`<CountUp>`), easing out. The real number is in the DOM from the first frame, so it is readable without scripting.
- Hover on a card: one signal, a 1px lift plus a shadow step. Nothing else.
- Everything is visible at rest, so a failed script never leaves a blank page.
- No bounce, no parallax, no loops, no confetti.

## Voice

Plain and specific. A client is a client, a retainer is a retainer. Numbers say
the thing: `2,340`, not `significant growth`. Toast copy states what happened
and nothing more. Never a buzzword, never a stock second action.

## Exports

`src/app/tokens.css` is the source of truth. The Tailwind v4 `@theme static` block
inside it generates the utilities (`bg-paper-2`, `text-muted`, `rounded-card`,
`font-display`, `shadow-card`).
