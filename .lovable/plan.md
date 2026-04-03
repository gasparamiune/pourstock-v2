

# Redesign Order Command Center — Floating Island Layout with Table Card

## What changes

Replace the current Order Command Center layout (full-screen with header bar, 3-column grid, solid background) with an immersive "floating island" design where:

1. **The actual TableCard component** (from screenshot 1 — with table number badge, icon bar, guest info, course type, room number, arrived status) renders in the center of a dark void
2. **Floating panels** surround it: order ticket to the left, table info to the right, menu below
3. Background is pure dark/black — no header bar, no borders — creating the illusion that the restaurant disappeared and only this table remains

## Visual structure

```text
┌──────────────────────────────────────────────────────┐
│                                                      │
│                    (dark void)                        │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ CURRENT      │  │    ┌──┐     │  │ TABLE INFO   │ │
│  │ ORDER        │  │    │11│     │  │              │ │
│  │              │  │    └──┘     │  │ Guest:       │ │
│  │ 1x Serrano   │  │  ☕🍷🎉🏳   │  │ Jensen, M.   │ │
│  │ 1x Okse...   │  │  👥2 🍴3-ret│  │ Room: #313   │ │
│  │ 1x Pandekager│  │ Jensen, M.  │  │ Covers: 2    │ │
│  │              │  │ Room 313    │  │              │ │
│  │ Total 453kr  │  │ ✓ Arrived   │  │ Allergies... │ │
│  │ [Fire]       │  │             │  │              │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │ 🍽 Food  🥂 Drinks       [À la Carte] [Daily]   ││
│  │ Starters | Mains | Desserts                      ││
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐          ││
│  │ │ Serrano  │ │ Okse...  │ │ Dagens   │          ││
│  │ │ 89 kr    │ │ 275 kr   │ │ 245 kr   │          ││
│  │ └──────────┘ └──────────┘ └──────────┘          ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

## Changes

### `src/components/ordering/OrderCommandCenter.tsx`

**Remove**: The current header bar (back arrow, "Table 11", Order/Bill toggle at top). Replace with a minimal close button (X or back arrow) floating in the top-left corner.

**Remove**: The 3-column grid with `height: 38%`. Replace with a flexbox center layout.

**Center panel — Real TableCard**: Import and render the actual `TableCard` component with the reservation data, passing the same props as the floor plan does (reservation type colors, icon bar with coffee/wine/welcome/flag indicators, guest count, course type badge, guest name, room number, arrived status with timer). This card is the focal point — rendered at roughly its normal size, centered in the dark space.

**Left floating panel — Order ticket**: Same content as current left column (existing lines grouped by course, pending lines, total, Fire to Kitchen button), but rendered as a floating card with `bg-card/80 backdrop-blur-lg rounded-2xl border border-border/20 shadow-2xl`. Positioned to the left of the table card.

**Right floating panel — Table info**: Same content as current right column (guest name, room, covers, allergies), rendered as a matching floating card to the right.

**Bottom floating panel — Menu**: The full menu browser (Food/Drinks tabs, À la Carte/Daily toggle, course sub-tabs, VisualMenuBoard) rendered as a floating card spanning the width below the three upper panels.

**Order/Bill toggle**: Move it into the top-right corner as a small floating pill, or integrate it into the order panel header.

**Background**: Change the portal container from `bg-background` to `bg-black/95` or similar deep dark.

**Animations**: Keep existing `command-center-enter` animation. Add subtle scale-up on the floating panels with staggered delays.

### Layout approach

Use CSS grid or flexbox with `place-items: center` for the upper section (3 panels side by side), and a constrained-width bottom section for the menu. All panels have:
- `bg-card/60 backdrop-blur-xl`
- `rounded-2xl`
- `border border-white/5`
- `shadow-[0_8px_32px_rgba(0,0,0,0.4)]`

### Files modified
- `src/components/ordering/OrderCommandCenter.tsx` — full layout rewrite of the render section (logic/state unchanged)

