import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Props {
  itemId: string | null;
  itemName: string;
  initialNote: string;
  onSave: (itemId: string, note: string) => void;
  onClose: () => void;
}

export function NoteDialog({ itemId, itemName, initialNote, onSave, onClose }: Props) {
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    setNote(initialNote);
  }, [itemId, initialNote]);

  function handleSave() {
    if (itemId) onSave(itemId, note.trim());
    onClose();
  }

  return (
    <Dialog open={!!itemId} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold truncate">Note: {itemName}</DialogTitle>
        </DialogHeader>
        <Textarea
          autoFocus
          placeholder="E.g. no onions, extra sauce…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="resize-none text-sm min-h-[80px]"
          maxLength={200}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } }}
        />
        <DialogFooter className="gap-2 flex-row justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>Save note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
