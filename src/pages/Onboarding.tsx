import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hotel, ArrowRight, ArrowLeft, Check, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const COUNTRIES = [
  { value: 'DK', label: 'Denmark' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'FI', label: 'Finland' },
  { value: 'IS', label: 'Iceland' },
  { value: 'DE', label: 'Germany' },
];

const TIMEZONES = [
  { value: 'Europe/Copenhagen', label: 'Copenhagen (CET)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET)' },
  { value: 'Europe/Oslo', label: 'Oslo (CET)' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET)' },
  { value: 'Atlantic/Reykjavik', label: 'Reykjavik (GMT)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
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

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [hotelName, setHotelName] = useState('');
  const [slug, setSlug] = useState('');
  const [country, setCountry] = useState('DK');
  const [timezone, setTimezone] = useState('Europe/Copenhagen');
  const [language, setLanguage] = useState('da');

  function handleNameChange(name: string) {
    setHotelName(name);
    if (!slug || slug === slugify(hotelName)) {
      setSlug(slugify(name));
    }
  }

  async function handleCreate() {
    if (!hotelName.trim() || !slug.trim()) {
      toast.error('Please fill in all required fields');
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
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success('Hotel created! Redirecting…');
      // Reload to pick up new membership
      setTimeout(() => window.location.href = '/', 1000);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to create hotel');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
            <Hotel className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold">Set Up Your Hotel</h1>
          <p className="text-muted-foreground mt-1">Configure your hotel to start using PourStock</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 w-12 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-6">
          {step === 1 && (
            <>
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
                    Used in URLs. Lowercase letters, numbers, and hyphens only.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!hotelName.trim() || !slug.trim()}
                  className="gap-2"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                <Button onClick={handleCreate} disabled={saving} className="gap-2">
                  {saving ? 'Creating…' : (
                    <>
                      <Check className="h-4 w-4" /> Create Hotel
                    </>
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
