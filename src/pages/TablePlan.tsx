import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PdfUploader } from '@/components/tableplan/PdfUploader';
import { FloorPlan } from '@/components/tableplan/FloorPlan';
import { PreparationSummary } from '@/components/tableplan/PreparationSummary';
import type { Reservation } from '@/components/tableplan/TableCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export default function TablePlan() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async (pdfBase64: string) => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-table-plan', {
        body: { pdfBase64 },
      });

      if (error) throw error;

      const parsed = Array.isArray(data) ? data : [];
      setReservations(parsed);

      toast({
        title: t('tablePlan.extracted'),
        description: `${parsed.length} ${t('tablePlan.reservationsFound')}`,
      });
    } catch (err) {
      console.error('PDF parse error:', err);
      toast({
        title: t('tablePlan.error'),
        description: t('tablePlan.errorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => setReservations(null);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('tablePlan.title')}</h1>
          <p className="text-muted-foreground">{t('tablePlan.subtitle')}</p>
        </div>
        {reservations && (
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('tablePlan.newUpload')}
          </Button>
        )}
      </div>

      {!reservations ? (
        <PdfUploader onUpload={handleUpload} isProcessing={isProcessing} />
      ) : reservations.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">{t('tablePlan.noReservations')}</p>
          <Button variant="outline" className="mt-4" onClick={handleReset}>
            {t('tablePlan.newUpload')}
          </Button>
        </div>
      ) : (
        <>
          <FloorPlan reservations={reservations} />
          <PreparationSummary reservations={reservations} />
        </>
      )}
    </div>
  );
}
