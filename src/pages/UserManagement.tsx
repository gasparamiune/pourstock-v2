import { useState } from 'react';
import { Users, UserPlus, Loader2, Link2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUsers, UserProfile } from '@/hooks/useUsers';
import { UserTable } from '@/components/users/UserTable';
import { AddUserDialog } from '@/components/users/AddUserDialog';
import { EditUserDialog } from '@/components/users/EditUserDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function UserManagement() {
  const { t } = useLanguage();
  const { user, activeHotelId } = useAuth();
  const { usersQuery, createUser, deleteUser, approveUser, updateUser } = useUsers();
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateInviteLink() {
    if (!activeHotelId) return;
    setGeneratingInvite(true);
    try {
      const { data, error } = await (supabase as any)
        .from('hotel_invites')
        .insert({
          hotel_id: activeHotelId,
          hotel_role: 'staff',
          invited_by: user?.id,
        })
        .select('token')
        .single();

      if (error) throw error;
      const link = `${window.location.origin}/join?token=${(data as any).token}`;
      setInviteLink(link);
      setInviteOpen(true);
    } catch (e: any) {
      toast.error('Failed to generate invite link: ' + (e.message ?? ''));
    } finally {
      setGeneratingInvite(false);
    }
  }

  async function copyInviteLink() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateInviteLink} disabled={generatingInvite}>
            <Link2 className="h-4 w-4 mr-2" />
            {generatingInvite ? 'Generating…' : 'Invite Link'}
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            {t('users.addUser')}
          </Button>
        </div>
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

      {/* Invite Link Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) setInviteLink(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" /> Staff Invite Link
            </DialogTitle>
            <DialogDescription>
              Share this link with your new staff member. It expires in 7 days and can only be used once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Label>Invite URL</Label>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly className="font-mono text-xs" />
              <Button size="icon" variant="outline" onClick={copyInviteLink}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The new staff member will be assigned role <strong>Staff</strong> and will need manager approval before accessing the app.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
