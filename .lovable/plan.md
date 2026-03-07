

# Plan: Language Switcher Flags + Auto-save Plan Name

## 1. `LanguageSwitcher.tsx` — Two side-by-side flag buttons
Replace the single toggle button with two flag buttons (🇩🇰 first, 🇬🇧 second). Active language gets full opacity + ring highlight; inactive is dimmed. Clicking sets that language directly.

## 2. `TableCard.tsx` — Danish flag emoji
Replace the Lucide `Flag` icon in the `iconItems` array with a `🇩🇰` emoji `<span>` for the `flagOnTable` indicator.

## 3. `TablePlan.tsx` — Instant plan name save + display on upload screen
- Add a `useEffect` that watches `planName` changes and triggers `triggerAutoSave` with the current assignments (debounced via existing 500ms mechanism) so the name is persisted immediately as the user types.
- The saved plans list on the upload screen already shows `plan.name || plan.plan_date` (line 1006), so newly saved names will appear automatically after the auto-save completes and `loadSavedPlans()` refreshes the list.
- Translate the placeholder "Navngiv bordplan..." and the "Tilbage" button text using translation keys.

## 4. `LanguageContext.tsx` — Add missing translations
- `tablePlan.namePlaceholder`: "Name your table plan..." / "Navngiv bordplan..."
- `tablePlan.back`: "Back" / "Tilbage"

## Files changed
| File | Change |
|------|--------|
| `src/components/LanguageSwitcher.tsx` | Two-flag selector (🇩🇰, 🇬🇧) |
| `src/components/tableplan/TableCard.tsx` | Replace `Flag` icon with 🇩🇰 emoji |
| `src/pages/TablePlan.tsx` | Auto-save on planName change + translate hardcoded strings |
| `src/contexts/LanguageContext.tsx` | Add translation keys |

