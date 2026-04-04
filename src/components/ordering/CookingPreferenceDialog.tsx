import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  open: boolean;
  itemName: string;
  onConfirm: (preference: string) => void;
  onCancel: () => void;
}

const PRESETS = [
  { key: 'order.rare', fallback: 'Rare' },
  { key: 'order.medium', fallback: 'Medium' },
  { key: 'order.wellDone', fallback: 'Well Done' },
];

export function CookingPreferenceDialog({ open, itemName, onConfirm, onCancel }: Props) {
  const { t } = useLanguage();
  const [showCustom, setShowCustom] = useState(false);
  const [customText, setCustomText] = useState('');

  const handlePreset = (label: string) => {
    onConfirm(label);
    reset();
  };

  const handleCustom = () => {
    if (customText.trim()) {
      onConfirm(customText.trim());
      reset();
    }
  };

  const reset = () => {
    setShowCustom(false);
    setCustomText('');
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center" onClick={handleCancel}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-10 w-full max-w-xs rounded-lg border bg-background p-6 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold">{t('order.howCooked')}</h3>
        <p className="text-sm text-muted-foreground mb-4">{itemName}</p>

        <div className="flex flex-col gap-2">
          {PRESETS.map(p => (
            <Button
              key={p.key}
              variant="outline"
              className="w-full justify-center"
              onClick={() => handlePreset(t(p.key))}
            >
              {t(p.key)}
            </Button>
          ))}

          {!showCustom ? (
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={() => setShowCustom(true)}
            >
              {t('order.custom')}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                autoFocus
                value={customText}
                onChange={e => setCustomText(e.target.value)}
                placeholder={t('order.custom')}
                onKeyDown={e => e.key === 'Enter' && handleCustom()}
              />
              <Button size="sm" onClick={handleCustom}>OK</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
