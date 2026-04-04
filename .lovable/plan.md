

# Add Steak Cooking Preference Prompt

## What changes

When a waiter taps a steak item (or any item flagged as requiring a cooking preference), a small dialog appears asking "How would you like your steak cooked?" with options: Rare, Medium, Well Done, and Custom (free text). The chosen preference is appended to the order line's notes automatically.

## How

### 1. Cooking preference dialog — new component
**File**: `src/components/ordering/CookingPreferenceDialog.tsx` (new)

A small modal/dialog with:
- Title: "How would you like it cooked?" (translated)
- 3 preset buttons: Rare, Medium, Well Done
- 1 "Custom" button that reveals a text input
- On selection, calls `onConfirm(preference: string)` and closes

### 2. Intercept item addition for steak items
**File**: `src/components/ordering/OrderCommandCenter.tsx`

- Add state: `cookingPrompt: { item: DailyMenuItem; course: CourseKey } | null`
- Modify `addItem()`: check if the item name matches steak keywords (e.g., `steak`, `bøf`, `entrecôte`, `oksemørbrad`) — case-insensitive. If yes, set `cookingPrompt` instead of directly adding.
- On dialog confirm: add the item with the cooking preference prepended to the notes field, then clear `cookingPrompt`.
- If the item is already in selection (qty > 0), show the dialog again for the additional portion (each steak can have different doneness).

### 3. Translations
**File**: `src/contexts/LanguageContext.tsx`

Add keys for: `order.cookingPreference`, `order.rare`, `order.medium`, `order.wellDone`, `order.custom`, `order.howCooked` in Danish and English.

## Files
| File | Action |
|------|--------|
| `src/components/ordering/CookingPreferenceDialog.tsx` | Create |
| `src/components/ordering/OrderCommandCenter.tsx` | Add cooking prompt intercept |
| `src/contexts/LanguageContext.tsx` | Add translations |

