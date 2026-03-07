import { useLanguage, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { DanishFlag } from '@/components/flags/DanishFlag';
import { BritishFlag } from '@/components/flags/BritishFlag';

const flags: { lang: Language; Flag: typeof DanishFlag; label: string }[] = [
  { lang: 'da', Flag: DanishFlag, label: 'Dansk' },
  { lang: 'en', Flag: BritishFlag, label: 'English' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      {flags.map(({ lang, Flag, label }) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          title={label}
          className={cn(
            "transition-all duration-200 rounded-md px-2 py-1.5",
            language === lang
              ? "opacity-100 ring-2 ring-primary/50 scale-110"
              : "opacity-40 hover:opacity-70 hover:scale-105"
          )}
        >
          <Flag size={28} />
        </button>
      ))}
    </div>
  );
}
