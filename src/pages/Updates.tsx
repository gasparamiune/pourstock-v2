import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Release {
  id: string;
  version: string;
  title: string;
  summary: string | null;
  content: string;
  severity: string;
  published_at: string | null;
  is_mandatory: boolean;
}

export default function Updates() {
  const { language, t } = useLanguage();

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['release-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('release_announcements')
        .select('id, version, title, summary, content, severity, published_at, is_mandatory')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Release[];
    },
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{language === 'da' ? 'Opdateringshistorik' : 'Update History'}</h1>
          <p className="text-sm text-muted-foreground">
            {language === 'da' ? 'Se alle tidligere opdateringer til PourStock' : 'See all past updates to PourStock'}
          </p>
        </div>
      </div>

      <Separator />

      {isLoading && <p className="text-sm text-muted-foreground">{t('common.loading')}</p>}

      {releases.map((r) => {
        const bulletPoints = r.content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .slice(0, 7);

        return (
          <Card key={r.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg">{r.title}</CardTitle>
                <Badge variant="outline" className="text-xs">v{r.version}</Badge>
                {r.severity !== 'info' && (
                  <Badge variant={r.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs capitalize">
                    {r.severity}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {r.published_at && (
                  <span>
                    {new Date(r.published_at).toLocaleDateString(
                      language === 'da' ? 'da-DK' : 'en-US',
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    )}
                  </span>
                )}
              </div>
              {r.summary && <CardDescription>{r.summary}</CardDescription>}
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {bulletPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span className="text-foreground/90">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      {!isLoading && releases.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">
          {language === 'da' ? 'Ingen opdateringer endnu.' : 'No updates yet.'}
        </p>
      )}
    </div>
  );
}
