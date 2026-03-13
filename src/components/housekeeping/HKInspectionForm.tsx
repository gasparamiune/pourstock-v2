import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, RotateCcw, Plus, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { HousekeepingTask } from '@/hooks/useHousekeeping';

const DEFECT_CATEGORIES = [
  'bathroom', 'bedding', 'flooring', 'furniture', 'windows', 'amenities', 'minibar', 'general',
] as const;

interface Defect {
  category: string;
  description: string;
}

interface HKInspectionFormProps {
  task: HousekeepingTask;
  onPass: (notes: string) => void;
  onFail: (notes: string, defects: Defect[]) => void;
  onReopen: () => void;
}

export function HKInspectionForm({ task, onPass, onFail, onReopen }: HKInspectionFormProps) {
  const { t } = useLanguage();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [addingDefect, setAddingDefect] = useState(false);
  const [newDefectCategory, setNewDefectCategory] = useState('');
  const [newDefectDesc, setNewDefectDesc] = useState('');

  const addDefect = () => {
    if (!newDefectCategory || !newDefectDesc.trim()) return;
    setDefects([...defects, { category: newDefectCategory, description: newDefectDesc.trim() }]);
    setNewDefectCategory('');
    setNewDefectDesc('');
    setAddingDefect(false);
  };

  const removeDefect = (idx: number) => {
    setDefects(defects.filter((_, i) => i !== idx));
  };

  const cleanDuration = task.started_at && task.completed_at
    ? Math.round((new Date(task.completed_at).getTime() - new Date(task.started_at).getTime()) / 60000)
    : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-2xl font-bold">{t('reception.room')} {task.room?.room_number}</h2>
          <Badge variant="outline" className="capitalize">{task.room?.room_type}</Badge>
          {task.room?.floor && <Badge variant="outline">{t('reception.floor')} {task.room.floor}</Badge>}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="capitalize">{t(`housekeeping.taskType.${task.task_type}`)}</span>
          {cleanDuration !== null && <span>· {cleanDuration} min</span>}
          {task.completed_at && (
            <span>· {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}</span>
          )}
        </div>
      </div>

      <Separator />

      {/* Defects section */}
      <div>
        <h3 className="text-sm font-semibold mb-3">{t('housekeeping.defectsFound')} ({defects.length})</h3>
        
        {defects.map((defect, idx) => (
          <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-destructive/5 mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] capitalize">{t(`housekeeping.defect.${defect.category}`)}</Badge>
              <span className="text-sm">{defect.description}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeDefect(idx)}>✕</Button>
          </div>
        ))}

        {addingDefect ? (
          <div className="space-y-2 p-3 rounded-lg border border-dashed">
            <Select value={newDefectCategory} onValueChange={setNewDefectCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('housekeeping.defectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {DEFECT_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{t(`housekeeping.defect.${cat}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={newDefectDesc}
              onChange={e => setNewDefectDesc(e.target.value)}
              placeholder={t('housekeeping.defectDescription')}
              rows={2}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={addDefect} disabled={!newDefectCategory || !newDefectDesc.trim()}>
                {t('common.add')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingDefect(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setAddingDefect(true)} className="mt-1">
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t('housekeeping.addDefect')}
          </Button>
        )}
      </div>

      <Separator />

      {/* Notes */}
      <div>
        <h3 className="text-sm font-semibold mb-2">{t('housekeeping.inspectionNotes')}</h3>
        <Textarea
          value={inspectionNotes}
          onChange={e => setInspectionNotes(e.target.value)}
          placeholder={t('housekeeping.inspectionNotesPlaceholder')}
          rows={3}
          className="text-sm"
        />
      </div>

      <Separator />

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="destructive"
          className="flex-1 touch-target"
          onClick={() => onFail(inspectionNotes, defects)}
        >
          <XCircle className="h-4 w-4 mr-2" />
          {t('housekeeping.fail')}
          {defects.length > 0 && <Badge className="ml-2 bg-white/20 text-xs">{defects.length}</Badge>}
        </Button>
        <Button
          className="flex-1 touch-target bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-white"
          onClick={() => onPass(inspectionNotes)}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {t('housekeeping.pass')}
        </Button>
        <Button
          variant="outline"
          className="touch-target"
          onClick={onReopen}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {t('housekeeping.reopen')}
        </Button>
      </div>
    </div>
  );
}
