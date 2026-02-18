
# Table Plan Feature

## What You Get
A new "Bordplan" (Table Plan) tab in the sidebar. When you open it, you can upload your daily Kokkenliste PDF. The app extracts all restaurant reservations from 18:00 onwards and displays them on a colourful visual map of your restaurant's actual table layout -- matching the floor plan from your PDF exactly.

Each table card will show:
- Table number (e.g. B7) prominently displayed
- Number of guests and dish menu type (2-ret / 3-ret)
- Guest name or room number
- Important notes (allergies, intolerances, included services) highlighted with a warning badge
- Empty/free tables shown in a muted style with "Fri" label

The layout will be colourful with:
- Amber/gold for tables with 3-dish menus
- Blue/teal for tables with 2-dish menus
- Red warning badges for allergy/dietary notes
- Green glow for VIP or special notes
- Muted dark cards for free tables
- Table size visually reflected (6-person tables are wider)

## Restaurant Layout (from your PDF)
The visual grid will mirror your actual floor plan with 4 columns and 8 rows:

```text
 Col 1 (4p)   Col 2 (2p)   Col 3 (2p)   Col 4
+-----------+-----------+-----------+-----------+
|  B7 (4p)  | B17 (2p)  | B27 (2p)  |           |
+-----------+-----------+-----------+-----------+
|  B6 (4p)  | B16 (2p)  | B26 (2p)  | B31 (2p)  |
+-----------+-----------+-----------+-----------+
|  B5 (4p)  | B15 (2p)  | B25 (2p)  |           |
+-----------+-----------+-----------+-----------+
|  B4 (4p)  | B14 (2p)  | B32 (6p)  |           |
+-----------+-----------+-----------+-----------+
|  B3 (6p)  | B13 (6p)  | B23 (6p)  |           |
+-----------+-----------+-----------+-----------+
|  B2 (4p)  | B12 (2p)  | B22 (2p)  | B33 (2p)  |
+-----------+-----------+-----------+-----------+
|  B1 (4p)  | B11 (2p)  | B21 (2p)  |           |
+-----------+-----------+-----------+-----------+
| B35 (4p)  | B36 (2p)  | B37 (2p)  |           |
+-----------+-----------+-----------+-----------+
```

## How It Works
1. Open "Bordplan" from the sidebar
2. Drag-and-drop or click to upload the daily Kokkenliste PDF
3. A backend function parses the PDF using AI, extracting only reservations from 18:00+
4. Reservations are auto-assigned to tables based on party size (smallest suitable table first)
5. The floor plan renders with each occupied table showing guest details and notes

## What Gets Built

### New Files
- **`src/pages/TablePlan.tsx`** -- Main page with PDF upload and floor plan display
- **`src/components/tableplan/PdfUploader.tsx`** -- Drag-and-drop upload component
- **`src/components/tableplan/FloorPlan.tsx`** -- The visual grid matching the restaurant layout
- **`src/components/tableplan/TableCard.tsx`** -- Individual table card with guest info, colour-coded
- **`supabase/functions/parse-table-plan/index.ts`** -- Backend function that sends PDF to AI for extraction

### Modified Files
- **`src/App.tsx`** -- Add `/table-plan` route
- **`src/components/layout/AppShell.tsx`** -- Add "Bordplan" nav item with a LayoutGrid icon
- **`src/contexts/LanguageContext.tsx`** -- Add English/Danish translations for all table plan text

## Technical Details

### Floor Plan Data Structure
The table layout is hardcoded as a constant matching the restaurant's physical layout:
```text
type TableDef = { id: string; capacity: number; row: number; col: number }
```
Each table has a fixed position in the grid. The grid renders with CSS Grid (8 rows x 4 columns) so it matches the real restaurant.

### Table Card Design
- Free tables: dark muted background, "Fri" label, dashed border
- 2-dish occupied: teal/blue gradient border, compact info
- 3-dish occupied: amber/gold gradient border
- Allergy/notes: red pulsing badge in the corner
- 6-person tables: span wider in the grid (col-span-1 but taller card)

### AI Extraction (Backend Function)
- Receives PDF as base64
- Uses Lovable AI (Gemini) to parse the text
- Prompt filters for time >= 18:00 only
- Returns JSON array of reservations with: guestName, guestCount, dishCount, roomNumber, notes, time

### Auto-Assignment Logic
Reservations are assigned to tables client-side:
1. Sort reservations by party size (largest first)
2. For each reservation, find the smallest available table that fits
3. 2-person parties go to 2p tables, 4-person to 4p tables, etc.
4. Staff can manually reassign by tapping a table (future enhancement)

### Translations Added
- `nav.tablePlan` / `nav.tablePlan` (en: "Table Plan", da: "Bordplan")
- `tablePlan.title`, `tablePlan.uploadPdf`, `tablePlan.dragDrop`, `tablePlan.processing`, `tablePlan.free`, `tablePlan.guests`, `tablePlan.dishes`, `tablePlan.room`, `tablePlan.notes`, `tablePlan.noReservations`
