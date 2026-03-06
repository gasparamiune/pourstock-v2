import { useState } from 'react';
import { Coffee, Flag, AlertTriangle, Wine, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QuickNoteButtonsProps {
  coffeeOnly: boolean;
  coffeeTeaSweet: boolean;
  wineMenu?: boolean;
  welcomeDrink?: boolean;
  notes: string;
  onCoffeeOnlyChange: (val: boolean) => void;
  onCoffeeTeaSweetChange: (val: boolean) => void;
  onWineMenuChange?: (val: boolean) => void;
  onWelcomeDrinkChange?: (val: boolean) => void;
  onNotesChange: (val: string) => void;
}

export function QuickNoteButtons({
  coffeeOnly, coffeeTeaSweet, wineMenu, welcomeDrink, notes,
  onCoffeeOnlyChange, onCoffeeTeaSweetChange, onWineMenuChange, onWelcomeDrinkChange, onNotesChange,
}: QuickNoteButtonsProps) {
  const [showAllergyInput, setShowAllergyInput] = useState(false);
  const [allergyText, setAllergyText] = useState('');

  const hasFlag = notes.includes('Flag på bord');
  const toggleFlag = () => {
    if (hasFlag) {
      // Remove both old and new format
      onNotesChange(notes.replace('🇩🇰 Flag på bord', '').replace('Flag på bord', '').replace(/\n{2,}/g, '\n').trim());
    } else {
      onNotesChange(notes ? `${notes}\nFlag på bord` : 'Flag på bord');
    }
  };

  const toggleCoffee = () => {
    if (coffeeOnly) {
      onCoffeeOnlyChange(false);
    } else {
      onCoffeeOnlyChange(true);
      onCoffeeTeaSweetChange(false);
    }
  };

  const toggleCoffeeSweet = () => {
    if (coffeeTeaSweet) {
      onCoffeeTeaSweetChange(false);
    } else {
      onCoffeeTeaSweetChange(true);
      onCoffeeOnlyChange(false);
    }
  };

  const addAllergy = () => {
    if (!allergyText.trim()) return;
    const allergyNote = `Allergi: ${allergyText.trim()}`;
    onNotesChange(notes ? `${notes}\n${allergyNote}` : allergyNote);
    setAllergyText('');
    setShowAllergyInput(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Hurtig-noter</Label>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={coffeeOnly ? 'default' : 'outline'}
          size="sm"
          onClick={toggleCoffee}
          className="text-xs h-8 gap-1.5"
        >
          <Coffee className="h-3.5 w-3.5" />
          Kaffe/te
        </Button>
        <Button
          type="button"
          variant={coffeeTeaSweet ? 'default' : 'outline'}
          size="sm"
          onClick={toggleCoffeeSweet}
          className="text-xs h-8 gap-1.5"
        >
          <Coffee className="h-3.5 w-3.5" />
          Kaffe/te + sødt
        </Button>
        <Button
          type="button"
          variant={hasFlag ? 'default' : 'outline'}
          size="sm"
          onClick={toggleFlag}
          className="text-xs h-8 gap-1.5"
        >
          <Flag className="h-3.5 w-3.5" />
          Flag på bord
        </Button>
        {onWineMenuChange && (
          <Button
            type="button"
            variant={wineMenu ? 'default' : 'outline'}
            size="sm"
            onClick={() => onWineMenuChange(!wineMenu)}
            className="text-xs h-8 gap-1.5"
          >
            <Wine className="h-3.5 w-3.5" />
            Vinmenu
          </Button>
        )}
        {onWelcomeDrinkChange && (
          <Button
            type="button"
            variant={welcomeDrink ? 'default' : 'outline'}
            size="sm"
            onClick={() => onWelcomeDrinkChange(!welcomeDrink)}
            className="text-xs h-8 gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Velkomst
          </Button>
        )}
        <Button
          type="button"
          variant={showAllergyInput ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowAllergyInput(!showAllergyInput)}
          className="text-xs h-8 gap-1.5"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Allergi
        </Button>
      </div>
      {showAllergyInput && (
        <div className="flex gap-2">
          <Input
            value={allergyText}
            onChange={e => setAllergyText(e.target.value)}
            placeholder="F.eks. laktoseintolerant, glutenfri..."
            className="text-sm h-8"
            onKeyDown={e => e.key === 'Enter' && addAllergy()}
          />
          <Button type="button" size="sm" onClick={addAllergy} className="h-8 text-xs">
            Tilføj
          </Button>
        </div>
      )}
    </div>
  );
}
