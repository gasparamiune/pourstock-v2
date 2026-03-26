import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Phone, Mail, Plus, Pencil, Loader2, Search,
  Wrench, Zap, Thermometer, Wifi, Flame, Stethoscope, Lock, Bug, SprayCan, HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmergencyContact {
  id: string;
  category: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  contract_ref: string | null;
  last_service: string | null;
  sla_notes: string | null;
  is_active: boolean;
}

// ── Category config ───────────────────────────────────────────────────────────

const CATEGORIES: { value: string; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'plumbing',      label: 'Plumbing',         icon: Wrench,         color: 'bg-blue-500/10 text-blue-600' },
  { value: 'electrical',    label: 'Electrical',       icon: Zap,            color: 'bg-yellow-500/10 text-yellow-600' },
  { value: 'hvac',          label: 'HVAC',             icon: Thermometer,    color: 'bg-orange-500/10 text-orange-600' },
  { value: 'elevator',      label: 'Elevator',         icon: Loader2,        color: 'bg-purple-500/10 text-purple-600' },
  { value: 'it',            label: 'IT / Internet',    icon: Wifi,           color: 'bg-cyan-500/10 text-cyan-600' },
  { value: 'fire_safety',   label: 'Fire / Safety',    icon: Flame,          color: 'bg-red-500/10 text-red-600' },
  { value: 'medical',       label: 'Medical',          icon: Stethoscope,    color: 'bg-green-500/10 text-green-600' },
  { value: 'locksmith',     label: 'Locksmith',        icon: Lock,           color: 'bg-gray-500/10 text-gray-600' },
  { value: 'pest_control',  label: 'Pest Control',     icon: Bug,            color: 'bg-lime-500/10 text-lime-600' },
  { value: 'cleaning',      label: 'Cleaning Supplies',icon: SprayCan,       color: 'bg-pink-500/10 text-pink-600' },
  { value: 'other',         label: 'Other',            icon: HelpCircle,     color: 'bg-muted text-muted-foreground' },
];

function catConfig(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1];
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

function useEmergencyContacts() {
  const { activeHotelId } = useAuth();
  return useQuery({
    queryKey: ['emergency-contacts', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('emergency_contacts' as any)
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('is_active', true)
        .order('category')
        .order('name');
      if (error) throw error;
      return (data as unknown) as EmergencyContact[];
    },
    enabled: !!activeHotelId,
  });
}

function useContactMutations() {
  const qc = useQueryClient();
  const { activeHotelId } = useAuth();

  const upsert = useMutation({
    mutationFn: async (contact: Partial<EmergencyContact> & { id?: string }) => {
      if (contact.id) {
        const { error } = await supabase.from('emergency_contacts' as any).update(contact).eq('id', contact.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('emergency_contacts' as any).insert({ ...contact, hotel_id: activeHotelId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['emergency-contacts'] });
      toast.success('Contact saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { upsert };
}

// ── Contact form dialog ───────────────────────────────────────────────────────

interface ContactFormProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Partial<EmergencyContact>;
}

const EMPTY: Partial<EmergencyContact> = {
  category: 'plumbing', name: '', contact_person: '', phone: '', email: '', contract_ref: '', sla_notes: '',
};

function ContactFormDialog({ open, onOpenChange, initial }: ContactFormProps) {
  const { upsert } = useContactMutations();
  const [form, setForm] = useState<Partial<EmergencyContact>>(initial ?? EMPTY);

  function set(field: keyof EmergencyContact, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) { toast.error('Name is required'); return; }
    upsert.mutate(form, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.id ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Company / Service Name *</Label>
              <Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Contact Person</Label>
              <Input value={form.contact_person ?? ''} onChange={(e) => set('contact_person', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input type="tel" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Contract / Ref #</Label>
              <Input value={form.contract_ref ?? ''} onChange={(e) => set('contract_ref', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>SLA / Notes</Label>
              <Input value={form.sla_notes ?? ''} onChange={(e) => set('sla_notes', e.target.value)} placeholder="e.g. 4h response weekdays" />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={upsert.isPending}>
              {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Contact card ──────────────────────────────────────────────────────────────

function ContactCard({ contact, onEdit }: { contact: EmergencyContact; onEdit: () => void }) {
  const { icon: Icon, color } = catConfig(contact.category);
  return (
    <Card className="glass-card border-border/50">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm truncate">{contact.name}</p>
              <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={onEdit}>
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
            {contact.contact_person && (
              <p className="text-xs text-muted-foreground">{contact.contact_person}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-primary hover:underline">
                  <Phone className="h-3 w-3" /> {contact.phone}
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:underline">
                  <Mail className="h-3 w-3" /> {contact.email}
                </a>
              )}
            </div>
            {contact.sla_notes && (
              <p className="text-xs text-muted-foreground mt-1 italic">{contact.sla_notes}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main ProblemSolver ────────────────────────────────────────────────────────

export function ProblemSolver() {
  const { data: contacts = [], isLoading } = useEmergencyContacts();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editContact, setEditContact] = useState<EmergencyContact | null>(null);

  const filtered = contacts.filter((c) => {
    const matchCat = filterCat === 'all' || c.category === filterCat;
    const q = search.toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || (c.contact_person ?? '').toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  // Group by category
  const grouped: Record<string, EmergencyContact[]> = {};
  filtered.forEach((c) => {
    (grouped[c.category] ??= []).push(c);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-9"
            placeholder="Search contacts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Contact
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {contacts.length === 0
            ? 'No contacts yet. Add your first emergency contact.'
            : 'No contacts match the current filter.'}
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => {
          const { label, icon: Icon, color } = catConfig(cat);
          return (
            <div key={cat}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" /> {label}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {items.map((c) => (
                  <ContactCard key={c.id} contact={c} onEdit={() => setEditContact(c)} />
                ))}
              </div>
            </div>
          );
        })
      )}

      <ContactFormDialog open={addOpen} onOpenChange={setAddOpen} />
      {editContact && (
        <ContactFormDialog
          open={!!editContact}
          onOpenChange={(v) => { if (!v) setEditContact(null); }}
          initial={editContact}
        />
      )}
    </div>
  );
}
