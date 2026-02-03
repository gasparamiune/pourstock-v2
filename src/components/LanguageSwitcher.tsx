import { useLanguage, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const flags: Record<Language, { emoji: string; label: string }> = {
  en: { emoji: '🇬🇧', label: 'English' },
  da: { emoji: '🇩🇰', label: 'Dansk' },
};

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'da' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl w-full",
        "bg-sidebar-accent/30 hover:bg-sidebar-accent transition-colors",
        "text-sidebar-foreground/70 hover:text-sidebar-foreground"
      )}
    >
      <span className="text-xl">{flags[language].emoji}</span>
      <span className="text-sm font-medium">{flags[language].label}</span>
      <span className="ml-auto text-xs text-muted-foreground">
        → {flags[language === 'en' ? 'da' : 'en'].emoji}
      </span>
    </button>
  );
}
