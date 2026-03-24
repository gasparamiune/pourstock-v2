import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hotel, ArrowRight, ArrowLeft, Check, Globe, ChefHat, Wine, BedDouble, SprayCan, Utensils,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// ─── Constants ───────────────────────────────────────────────────────────────

const COUNTRIES = [
  { value: 'DK', label: 'Denmark' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'FI', label: 'Finland' },
  { value: 'IS', label: 'Iceland' },
  { value: 'DE', label: 'Germany' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'FR', label: 'France' },
];

const TIMEZONES = [
  { value: 'Europe/Copenhagen', label: 'Copenhagen (CET)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET)' },
  { value: 'Europe/Oslo', label: 'Oslo (CET)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET)' },
  { value: 'Atlantic/Reykjavik', label: 'Reykjavik (GMT)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)' },
];

const DEPARTMENTS = [
  {
    slug: 'reception',
    label: 'Reception',
    description: 'Check-in/out, guest management, billing, analytics',
    icon: BedDouble,
    required: false,
  },
  {
    slug: 'housekeeping',
    label: 'Housekeeping',
    description: 'Room cleaning, task assignments, inspections',
    icon: SprayCan,
    required: false,
  },
  {
    slug: 'restaurant',
    label: 'Restaurant',
    description: 'Table plan, reservations, ordering, menu',
    icon: Utensils,
    required: false,
  },
  {
    slug: 'kitchen',
    label: 'Kitchen',
    description: 'Kitchen display, daily menu management, prep tracking',
    icon: ChefHat,
    required: false,
  },
  {
    slug: 'bar',
    label: 'Bar',
    description: 'Bar tabs, beverage service, stock tracking',
    icon: Wine,
    required: false,
  },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[æ]/g, 'ae')
    .replace(/[ø]/g, 'oe')
    .replace(/[å]/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Detect if user came from "Create Hotel" signup path
  const fromSignupWizard = sessionStorage.getItem('pendingHotelSetup') === 'true';

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — Hotel identity
  const [hotelName, setHotelName] = useState('');
  const [slug, setSlug] = useState('');

  // Step 2 — Locale
  const [country, setCountry] = useState('DK');
  const [timezone, setTimezone] = useState('Europe/Copenhagen');
  const [language, setLanguage] = useState('da');

  // Step 3 — Departments
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(
    new Set(['reception', 'housekeeping', 'restaurant'])
  );

  const TOTAL_STEPS = 4;

  function handleNameChange(name: string) {
    setHotelName(name);
    if (!slug || slug === slugify(hotelName)) {
      setSlug(slugify(name));
    }
  }

  function toggleDept(slug: string) {
    setSelectedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  async function handleCreate() {
    if (!hotelName.trim() || !slug.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (selectedDepts.size === 0) {
      toast.error('Please select at least one department');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-hotel', {
        body: {
          name: hotelName.trim(),
          slug: slug.trim(),
          country,
          timezone,
          language_default: language,
          departments: Array.from(selectedDepts),
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      // Clear the signup wizard flag if present
      sessionStorage.removeItem('pendingHotelSetup');

      toast.success('Hotel created! Welcome to PourStock.');
      setTimeout(() => { window.location.href = '/'; }, 800);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create hotel');
    } finally {
      setSaving(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <Hotel className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold">Set Up Your Hotel</h1>
          <p className="text-muted-foreground mt-1">
            {fromSignupWizard
              ? "You're almost there — configure your hotel to start your free trial."
              : 'Configure your hotel to start using PourStock'}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                s < step
                  ? 'w-6 bg-primary'
                  : s === step
                  ? 'w-10 bg-primary'
                  : 'w-6 bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-6">

          {/* ── Step 1: Hotel identity ── */}
          {step === 1 && (
            <>
              <div className="space-y-1 mb-2">
                <h2 className="font-semibold">Hotel Name & URL</h2>
                <p className="text-xs text-muted-foreground">What's your hotel called?</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Hotel Name *</Label>
                  <Input
                    value={hotelName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Sønderborg Strand Hotel"
                    autoFocus
                  />
                </div>
                <div>
                  <Label>URL Slug *</Label>
                  <Input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="e.g. soenderborg-strand"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Lowercase letters, numbers, and hyphens only.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!hotelName.trim() || slug.trim().length < 3}
                  className="gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* ── Step 2: Locale ── */}
          {step === 2 && (
            <>
              <div className="space-y-1 mb-2">
                <h2 className="font-semibold">Location & Language</h2>
                <p className="text-xs text-muted-foreground">Where is your hotel located?</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="da">Dansk</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} className="gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* ── Step 3: Departments ── */}
          {step === 3 && (
            <>
              <div className="space-y-1 mb-2">
                <h2 className="font-semibold">Active Departments</h2>
                <p className="text-xs text-muted-foreground">
                  Select which departments your hotel uses. You can change this later in Settings.
                </p>
              </div>

              <div className="space-y-2">
                {DEPARTMENTS.map(({ slug: dSlug, label, description, icon: Icon }) => {
                  const active = selectedDepts.has(dSlug);
                  return (
                    <button
                      key={dSlug}
                      type="button"
                      onClick={() => toggleDept(dSlug)}
                      className={`w-full text-left rounded-xl border p-3 transition-all flex items-start gap-3 ${
                        active
                          ? 'border-primary/60 bg-primary/5'
                          : 'border-border/50 bg-card/30 hover:border-border'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        active ? 'bg-primary/15' : 'bg-muted/50'
                      }`}>
                        <Icon className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{label}</p>
                          {active && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                {selectedDepts.size} department{selectedDepts.size !== 1 ? 's' : ''} selected
              </p>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(4)} disabled={selectedDepts.size === 0} className="gap-2">
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* ── Step 4: Summary ── */}
          {step === 4 && (
            <>
              <div className="space-y-1 mb-2">
                <h2 className="font-semibold">Ready to launch</h2>
                <p className="text-xs text-muted-foreground">Review your hotel configuration.</p>
              </div>

              <div className="rounded-xl bg-muted/30 divide-y divide-border/50 overflow-hidden text-sm">
                <div className="flex justify-between px-4 py-3">
                  <span className="text-muted-foreground">Hotel name</span>
                  <span className="font-medium">{hotelName}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-muted-foreground">URL slug</span>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{slug}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-muted-foreground">Country / TZ</span>
                  <span className="font-medium">{country} · {timezone.split('/')[1]}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-muted-foreground">Departments</span>
                  <span className="font-medium text-right max-w-[220px]">
                    {Array.from(selectedDepts).map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-sm">
                <p className="font-medium text-primary">30-day free trial included</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All modules active. No credit card required.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
                <Button onClick={handleCreate} disabled={saving} className="gap-2">
                  {saving ? (
                    'Creating…'
                  ) : (
                    <><Check className="h-4 w-4" /> Start Free Trial</>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          You will be set as the hotel admin automatically.
        </p>
      </div>
    </div>
  );
}
