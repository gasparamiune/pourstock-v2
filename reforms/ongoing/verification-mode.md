# Verification Mode — PDF Highlight on Hover

**Status**: 🟢 Ongoing
**Started**: 2026-03-20
**Scope**: Table Plan tab — source verification for AI-extracted reservations

---

## Summary

Add a verification mode to the Table Plan tab. When active, a horizontal PDF viewer strip appears below the floor plan. Hovering over any assigned table scrolls the PDF to the matching reservation line and highlights it, allowing staff to visually confirm the AI extraction is correct.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│  FLOOR PLAN (top)                                       │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐                               │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │  ← hover over table 2        │
│  └───┘ └───┘ └─▲─┘ └───┘                               │
│                │                                        │
├────────────────┼────────────────────────────────────────┤
│  PDF VIEWER (bottom, horizontal strip)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ...regular text...                              │   │
│  │  ██████████████████████████████████████████████   │   │
│  │  ██ Vær. 215 · Hansen · 4p · Halvpension    ██   │   │
│  │  ██████████████████████████████████████████████   │   │
│  │  ...regular text...                              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Extend AI extraction to return source metadata

Update `parse-table-plan` edge function tool schema to include per-reservation:
- `sourceIndex` (integer) — sequential order in the PDF (0-based)
- `sourceText` (string) — verbatim text line from the PDF

### Step 2: Store uploaded PDF in memory

Retain raw PDF `base64` string in `TablePlan.tsx` state after upload. No backend persistence needed — verification is a session-time activity.

### Step 3: Add `pdfjs-dist` for client-side PDF rendering

Lazy-load `pdfjs-dist` only when verification mode is active. Render PDF pages to canvas elements inside the verification strip.

### Step 4: Build VerificationStrip component

New component: `src/components/tableplan/VerificationStrip.tsx`
- Receives: PDF base64, list of reservations with `sourceText`
- Renders PDF pages as canvas
- On hover signal: text-searches for `sourceText`, scrolls to it, draws highlight overlay
- Horizontal layout, ~200px tall, full width below floor plan

### Step 5: Wire hover events through FloorPlan

- Add `onHoverTable` / `onHoverEnd` callbacks to `FloorPlan` and `TableCard`
- When hovering a table, look up its reservation's `sourceText`
- Pass active highlight text down to `VerificationStrip`

### Step 6: Add Verification Mode toggle

- Toggle button (Eye icon) in `TablePlan.tsx` toolbar
- When off: floor plan uses full height (current behavior)
- When on: floor plan shrinks, verification strip appears below
- Persist toggle preference in localStorage

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/parse-table-plan/index.ts` | Add `sourceText` + `sourceIndex` to tool schema |
| `src/components/tableplan/VerificationStrip.tsx` | **New** — PDF viewer with highlight |
| `src/components/tableplan/TableCard.tsx` | Add `onMouseEnter`/`onMouseLeave` callbacks |
| `src/components/tableplan/FloorPlan.tsx` | Pass hover callbacks through |
| `src/pages/TablePlan.tsx` | Add verification mode state, store PDF base64, render strip |

## Dependencies

- `pdfjs-dist` — PDF rendering (lazy-loaded, ~400KB, only when verification mode active)

## What This Does NOT Require

- No new database table
- No storage bucket
- No image cropping or upload pipeline
- No bounding box coordinates from AI
- No backend changes beyond adding `sourceText` to the extraction schema

---

*Reform approved 2026-03-20. Pre-flight check: N/A (new feature, no prior state to validate).*
