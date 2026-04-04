
# Fix startup failure thoroughly

## Root cause I would fix first

The immediate failure is most likely not your app logic itself, but the preview transport layer:

- the browser log shows Vite cannot connect its websocket
- the app bootstraps via `await import("./App.tsx")`
- when the preview proxy/HMR connection is misconfigured, the browser can fail to fetch that module URL and the whole app dies before React mounts

This lines up with the current `vite.config.ts`, which only sets:

- `host: "::"`
- `port: 8080`
- `hmr.overlay: false`

but does not tell Vite how to connect through the Lovable preview proxy over secure websocket.

## Implementation plan

### 1. Stabilize Vite preview loading
**File:** `vite.config.ts`

Update dev-server HMR config so the preview uses the proxied secure websocket correctly instead of trying the wrong localhost websocket path.

Planned change:
- keep port `8080`
- keep overlay disabled
- add explicit HMR proxy-safe settings:
  - `protocol: "wss"`
  - `clientPort: 443`
  - `host` derived for the preview host when needed
- keep existing env fallback behavior intact

Goal:
- stop the `/src/App.tsx` dynamic import failure
- stop repeated websocket disconnects in preview
- avoid wasting credits on false app-level fixes when the issue is transport/HMR

### 2. Remove a second hidden access bug in kitchen routing
**Files:**
- `src/App.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- likely `src/components/layout/AppShell.tsx`
- likely `src/hooks/useAuth.tsx`

I found the app is still using `requireDepartment="kitchen"` and similar kitchen-specific typing, while your own project rules say there is **no kitchen department** and kitchen belongs to `restaurant`.

That can create broken access behavior even after startup is fixed.

Planned change:
- make `/kitchen` use restaurant access rules
- normalize department typing so kitchen UI is guarded by restaurant membership, not a non-standard kitchen department
- verify sidebar visibility follows the same rule

### 3. Make the new kitchen redesign match the requested workflow better
**Files:**
- `src/components/kitchen/KitchenDisplay.tsx`
- `src/components/kitchen/KitchenTicket.tsx`
- `src/components/kitchen/WaiterDisplay.tsx`

Your request said:
- dispose of pending / in-progress / ready system
- use ticket grid
- waiter side on the left
- chefs edit menus on right

Current code still keeps old status concepts internally and visually exposes “active”, “ready”, “ready for service”, etc.

Planned refinement:
- simplify visible kitchen language to ticket-based workflow
- keep only the minimum backend statuses needed for flow, but hide the old kanban vocabulary from UI
- make ticket actions read more like service flow rather than old KDS states
- ensure waiter-side stays visually aligned with the new ticket model

### 4. Finish translation coverage properly
**Files:**
- `src/contexts/LanguageContext.tsx`
- `src/components/layout/LanguageSwitcher.tsx`
- recent kitchen/order/table-plan files with hardcoded strings

I found a larger problem behind your translation complaints:
- `LanguageContext` still only supports `en | da`
- default language is still `en`
- the new kitchen and order center code includes many hardcoded labels like:
  - `Order`
  - `Bill`
  - `Current Order`
  - `Food`
  - `Drinks`
  - `Loading menu…`
  - `Custom Run`
  - `Split Bill`
  - `Charge`
- language switcher still only shows Danish and English

Planned change:
- set Danish as default
- expand language type and translations to:
  - Danish
  - English
  - Spanish
  - Polish
  - Arabic
- replace new hardcoded labels with translation keys
- ensure all future new UI must use `t(...)` rather than inline strings
- update the switcher to use the circular modern flag design you asked for

### 5. Tighten the command center changes without reopening the layout issues
**File:** `src/components/ordering/OrderCommandCenter.tsx`

This file now mixes:
- UI redesign
- billing panel
- scroll lock
- menu interaction
- many untranslated hardcoded strings

Planned cleanup:
- preserve the layout direction you approved
- keep the background scroll fix
- extract visible labels to translations
- slightly reduce risk by not changing business logic unless needed
- verify the bill panel + split bill area stays usable after translation changes

## Why this is the right order

1. Fix the preview boot failure first
2. Then remove the invalid kitchen department access rule
3. Then clean the kitchen/ticket UX
4. Then complete translations and language defaults
5. Then polish the command center strings/layout safely

That sequence minimizes wasted rebuild/debug cycles and addresses both the startup blocker and the known inconsistencies introduced by the recent batch of changes.

## Technical details

```text
Observed chain:
Preview opens
→ Vite client websocket fails
→ dynamic import of /src/App.tsx fails
→ bootstrap catch renders fatal error screen
```

```text
Secondary code issues found:
- /kitchen guarded by requireDepartment="kitchen"
- LanguageContext supports only en/da
- default language = en
- many new labels are hardcoded and bypass translation
- kitchen UI still exposes old status vocabulary despite new ticket-grid design
```

## Files likely touched

- `vite.config.ts`
- `src/App.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/components/layout/AppShell.tsx`
- `src/hooks/useAuth.tsx`
- `src/components/kitchen/KitchenDisplay.tsx`
- `src/components/kitchen/KitchenTicket.tsx`
- `src/components/kitchen/WaiterDisplay.tsx`
- `src/components/ordering/OrderCommandCenter.tsx`
- `src/contexts/LanguageContext.tsx`
- `src/components/layout/LanguageSwitcher.tsx`
- flag components for new circular language switcher

## Result after implementation

- preview loads reliably again
- kitchen route access matches the real restaurant permission model
- kitchen/waiter displays follow the ticket-based service flow more cleanly
- Danish becomes the default
- new and future UI is translation-ready across all requested languages
- no more repeated credit burn chasing a transport problem as if it were an app logic error
