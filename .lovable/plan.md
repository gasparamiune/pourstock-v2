

# Allow Managers to Edit/Delete Users

Adjust the User Management plan so that **managers** (not just admins) can edit and delete user profiles and roles.

## Database Changes

### 1. Profiles table -- add manager policies for UPDATE and DELETE
- Add RLS policy: "Managers can update any profile" (UPDATE) using `is_manager_or_admin()`
- Add RLS policy: "Managers can delete profiles" (DELETE) using `is_manager_or_admin()`
- Update existing "Admins can update any profile" and "Admins can delete profiles" policies to use `is_manager_or_admin()` instead (or drop and recreate them)

### 2. Profiles table -- allow managers to SELECT all profiles
- Add RLS policy: "Managers can view all profiles" (SELECT) using `is_manager_or_admin()`

### 3. Profiles table -- allow managers to INSERT profiles
- Update "Admins can insert profiles" to use `is_manager_or_admin()`

### 4. User_roles table -- allow managers to view and manage roles
- Add RLS policy: "Managers can view all roles" (SELECT) using `is_manager_or_admin()`
- Add RLS policy: "Managers can manage roles" (ALL) using `is_manager_or_admin()`

### 5. Add `phone_number` and `is_approved` columns to profiles
- `phone_number` text nullable
- `is_approved` boolean default false

## Edge Function: `manage-users`
- Validate caller is admin **or manager** (using `is_manager_or_admin()` check)
- Actions: createUser, deleteUser, resetPassword, approveUser, updateRole

## Frontend
- Route `/user-management` with `requireManager={true}` (accessible to both managers and admins)
- User table with approve/deny, edit contact info, change role, reset password, delete
- Add nav item visible to managers and admins
- Approval gate in ProtectedRoute for unapproved users (admins bypass)

## Security Guardrail
- Managers cannot promote someone to admin -- only admins can assign the admin role
- Managers cannot edit/delete admin users -- the edge function enforces this server-side

## Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | Update RLS, add columns |
| `supabase/functions/manage-users/index.ts` | Create |
| `src/pages/UserManagement.tsx` | Create |
| `src/components/users/UserTable.tsx` | Create |
| `src/components/users/AddUserDialog.tsx` | Create |
| `src/components/users/EditUserDialog.tsx` | Create |
| `src/hooks/useUsers.tsx` | Create |
| `src/components/auth/ProtectedRoute.tsx` | Modify -- approval gate |
| `src/components/layout/AppShell.tsx` | Modify -- nav item |
| `src/App.tsx` | Modify -- route |
| `src/contexts/LanguageContext.tsx` | Modify -- translation keys |

