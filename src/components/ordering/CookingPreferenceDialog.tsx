import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleCancel()}>
      <DialogContent className="max-w-xs z-[10000]" style={{ zIndex: 10000 }}>
        <DialogHeader>
          <DialogTitle className="text-base">
            {t('order.howCooked')}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{itemName}</p>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
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
      </DialogContent>
    </Dialog>
  );
}
