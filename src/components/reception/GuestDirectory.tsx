import { useState } from 'react';
import { useGuests, useGuestMutations } from '@/hooks/useReception';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Loader2 } from 'lucide-react';

export function GuestDirectory() {
  const { t } = useLanguage();
  const { data: guests, isLoading } = useGuests();
  const { createGuest } = useGuestMutations();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', nationality: '' });

  const filtered = (guests || []).filter(g => {
    const term = search.toLowerCase();
    return `${g.first_name} ${g.last_name}`.toLowerCase().includes(term) ||
      (g.email || '').toLowerCase().includes(term) ||
      (g.phone || '').includes(term);
  });

  const handleAdd = () => {
    createGuest.mutate(form, {
      onSuccess: () => {
        setShowAdd(false);
        setForm({ first_name: '', last_name: '', email: '', phone: '', nationality: '' });
      },
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder={t('reception.searchGuests')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('reception.addGuest')}
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reception.guestName')}</TableHead>
              <TableHead>{t('users.email')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('users.phone')}</TableHead>
              <TableHead className="hidden md:table-cell">{t('reception.nationality')}</TableHead>
              <TableHead>{t('reception.visits')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(g => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.first_name} {g.last_name}</TableCell>
                <TableCell className="text-muted-foreground">{g.email || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{g.phone || '—'}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{g.nationality || '—'}</TableCell>
                <TableCell>{g.visit_count}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {t('common.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Guest Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('reception.addGuest')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('reception.firstName')}</Label>
                <Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <Label>{t('reception.lastName')}</Label>
                <Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>{t('users.email')}</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>{t('users.phone')}</Label>
              <Input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>{t('reception.nationality')}</Label>
              <Input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAdd} disabled={!form.first_name || !form.last_name || createGuest.isPending}>
              {createGuest.isPending ? t('common.loading') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
