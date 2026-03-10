# PourStock UI Architecture

## Last Updated: 2026-03-10

## Module Map

| Module | Route | Page Component | Key Components |
|--------|-------|---------------|----------------|
| Dashboard | `/` | `Dashboard.tsx` | QuickStats, SearchAssistant, Department Cards |
| Reception | `/reception` | `Reception.tsx` | RoomBoard, TodayOverview, GuestDirectory, CheckIn/OutDialog |
| Housekeeping | `/housekeeping` | `Housekeeping.tsx` | HKStatusBoard, MyTasksList, HKRoomCard |
| Table Plan | `/table-plan` | `TablePlan.tsx` | FloorPlan, PdfUploader, PreparationSummary, TableCard |
| Inventory | `/inventory` | `Inventory.tsx` | QuickCountCard, StockIndicator, CategoryBadge |
| Products | `/products` | `Products.tsx` | ProductCard, Add/Edit dialogs |
| Import | `/import` | `Import.tsx` | Excel/CSV parser, data preview |
| Orders | `/orders` | `Orders.tsx` | Suggested orders, order history |
| Reports | `/reports` | `Reports.tsx` | Occupancy, Housekeeping, Inventory, Revenue charts |
| User Mgmt | `/user-management` | `UserManagement.tsx` | UserTable, AddUserDialog, EditUserDialog |
| Settings | `/settings` | `Settings.tsx` | Grouped settings sidebar (General, Operations, Inventory, System) |
| Updates | `/updates` | `Updates.tsx` | Release history cards |

## Navigation Structure

The sidebar navigation is organized into groups:

### Main
- Dashboard

### Operations  
- Reception (requires reception department)
- Housekeeping (requires housekeeping department)
- Table Plan (requires restaurant or reception)

### Inventory
- Inventory (requires restaurant department)
- Products (requires restaurant department)
- Import (requires restaurant department)
- Orders (requires restaurant department)

### Administration
- Reports (requires restaurant department)
- User Management (requires manager role)
- Settings (requires admin role)

### System
- What's New / Updates

## Design System

### Color Tokens (HSL via CSS variables)
- `--primary`: Warm amber (38 92% 50%) — hero accent
- `--background`: Dark base (220 15% 8%)
- `--card`: Elevated surface (220 15% 12%)
- Status: `--success`, `--warning`, `--info`, `--destructive`
- Room: `--room-available`, `--room-occupied`, `--room-checkout`, `--room-maintenance`
- Housekeeping: `--hk-dirty`, `--hk-in-progress`, `--hk-clean`, `--hk-inspected`

### Typography
- Display: DM Sans (headings)
- Body: Inter (body text)

### Component Patterns
- `glass-card` — Glass morphism card with backdrop blur
- `touch-target` — 44px minimum touch target
- Status badges use semantic color tokens
- All pages follow: PageHeader → Filters → MainContent

## Settings Organization

Settings are grouped into 4 categories:

1. **General**: Departments, Locations, Users & Roles, Modules
2. **Operations**: Room Types, Restaurants & Service, Table Plan, Parser Profiles
3. **Inventory**: Categories, Vendors, Reorder Rules, POS Integration
4. **System**: Notifications, Audit Logs, Data Protection, Release Notes

## Access Control

Navigation items are filtered based on:
- `requireAdmin` — only visible to hotel admins
- `requireManager` — visible to managers and admins
- `department` — visible to users in that department (or admins)
- `module` — gated by hotel_modules configuration

## Responsive Design

- Mobile: Collapsible sidebar overlay, 48px touch targets
- Tablet: Sidebar overlay, 44px touch targets
- Desktop: Persistent sidebar (72px width), collapsible

## Data Flow

All data flows through React Query hooks:
- `useReception` → rooms, reservations, guests
- `useHousekeeping` → tasks, maintenance
- `useInventoryData` → products, stock levels, movements
- `useAuth` → user, roles, departments, hotel membership

Realtime subscriptions via Supabase channels for:
- rooms, reservations, housekeeping_tasks, table_plans, stock data
