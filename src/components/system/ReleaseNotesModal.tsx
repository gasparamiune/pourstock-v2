import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, AlertTriangle, Info } from 'lucide-react';
import { useReleaseAnnouncements } from '@/hooks/useReleaseAnnouncements';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const severityConfig = {
  info: { icon: Sparkles, badge: 'default' as const, color: 'text-primary' },
  important: { icon: Info, badge: 'secondary' as const, color: 'text-amber-500' },
  critical: { icon: AlertTriangle, badge: 'destructive' as const, color: 'text-destructive' },
};

export function ReleaseNotesModal() {
  const { activeRelease, mandatoryUnacknowledged, markAsRead, acknowledge } =
    useReleaseAnnouncements();
  const { language } = useLanguage();

  // Mandatory takes priority
  const release = mandatoryUnacknowledged ?? activeRelease;
  if (!release) return null;

  const showMandatory = !!mandatoryUnacknowledged;
  const config = severityConfig[release.severity as keyof typeof severityConfig] ?? severityConfig.info;
  const Icon = config.icon;

  const bulletPoints = release.content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 7);

  const handleDismiss = async () => {
    if (showMandatory) {
      await acknowledge(release.id);
    } else {
      await markAsRead(release.id);
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open && !showMandatory) handleDismiss();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (showMandatory) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (showMandatory) e.preventDefault();
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-full bg-primary/10">
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>
            <DialogTitle className="text-xl flex items-center gap-2">
              {release.title}
              {release.severity !== 'info' && (
                <Badge variant={config.badge} className="text-xs capitalize">
                  {release.severity}
                </Badge>
              )}
            </DialogTitle>
          </div>
          {release.summary && (
            <DialogDescription className="text-sm text-muted-foreground">
              {release.summary}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <Badge variant="outline" className="text-xs">
            v{release.version}
          </Badge>
          {release.published_at && (
            <span>
              {new Date(release.published_at).toLocaleDateString(
                language === 'da' ? 'da-DK' : 'en-US',
                { year: 'numeric', month: 'short', day: 'numeric' }
              )}
            </span>
          )}
        </div>

        <ul className="space-y-2.5 my-4">
          {bulletPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <Check className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
              <span className="text-foreground/90">{point}</span>
            </li>
          ))}
        </ul>

        <Button onClick={handleDismiss} className="w-full">
          {language === 'da' ? 'Forstået!' : 'Got it!'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
