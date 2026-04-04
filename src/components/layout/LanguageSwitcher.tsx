import { useState, useRef, useEffect } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { DanishFlag } from '@/components/flags/DanishFlag';
import { BritishFlag } from '@/components/flags/BritishFlag';
import { SpanishFlag } from '@/components/flags/SpanishFlag';
import { PolishFlag } from '@/components/flags/PolishFlag';
import { ArabicFlag } from '@/components/flags/ArabicFlag';
import { ChevronDown } from 'lucide-react';

const flags: { lang: Language; Flag: typeof DanishFlag; label: string }[] = [
  { lang: 'da', Flag: DanishFlag, label: 'Dansk' },
  { lang: 'en', Flag: BritishFlag, label: 'English' },
  { lang: 'es', Flag: SpanishFlag, label: 'Español' },
  { lang: 'pl', Flag: PolishFlag, label: 'Polski' },
  { lang: 'ar', Flag: ArabicFlag, label: 'العربية' },
];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = flags.find(f => f.lang === language) ?? flags[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative px-4 py-2" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/50 transition-colors"
      >
        <current.Flag size={22} />
        <span className="text-xs text-muted-foreground">{current.label}</span>
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-4 bottom-full mb-1 bg-popover border border-border rounded-xl shadow-xl py-1 min-w-[140px] z-50">
          {flags.map(({ lang, Flag, label }) => (
            <button
              key={lang}
              onClick={() => { setLanguage(lang); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors",
                lang === language
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Flag size={18} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
