import { useLanguage, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const flags: { lang: Language; emoji: string; label: string }[] = [
  { lang: 'da', emoji: '🇩🇰', label: 'Dansk' },
  { lang: 'en', emoji: '🇬🇧', label: 'English' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {flags.map(({ lang, emoji, label }) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          title={label}
          className={cn(
            "text-2xl transition-all duration-200 rounded-lg px-2 py-1",
            language === lang
              ? "opacity-100 ring-2 ring-primary/50 scale-110"
              : "opacity-40 hover:opacity-70 hover:scale-105"
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
