import { useState } from 'react';
import { Users, UserPlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, UserProfile } from '@/hooks/useUsers';
import { UserTable } from '@/components/users/UserTable';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';

export default function UserManagement() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { usersQuery, createUser, deleteUser, approveUser, updateUser } = useUsers();
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);

  const users = usersQuery.data ?? [];
  const isLoading = usersQuery.isLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            {t('users.title')}
          </h1>
          <p className="text-muted-foreground mt-1">{t('users.description')}</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          {t('users.addUser')}
        </Button>
      </div>

      {/* User Table */}
      <UserTable
        users={users}
        currentUserId={user?.id || ''}
        onApprove={(userId) => approveUser.mutate(userId)}
        onUpdateRole={(userId, role) => updateUser.mutate({ userId, role })}
        onEdit={(u) => setEditUser(u)}
        onDelete={(userId) => deleteUser.mutate(userId)}
        onResetPassword={async () => {}}
      />

      {/* Add User Dialog */}
      <AddUserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(data) => {
          createUser.mutate({ ...data, departments: data.departments || [] }, { onSuccess: () => setAddOpen(false) });
        }}
        isLoading={createUser.isPending}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={!!editUser}
        onOpenChange={(open) => { if (!open) setEditUser(null); }}
        user={editUser}
        onSubmit={(data) => {
          updateUser.mutate(data, { onSuccess: () => setEditUser(null) });
        }}
        isLoading={updateUser.isPending}
      />
    </div>
  );
}
