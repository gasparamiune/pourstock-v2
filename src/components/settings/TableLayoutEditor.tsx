import { useState } from 'react';
import { Plus, Trash2, Save, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTableLayout } from '@/hooks/useTableLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { TableDef } from '@/components/tableplan/TableCard';
import { toast } from 'sonner';

interface EditingTable {
  id: string;
  capacity: number;
  row: number;
  col: number;
  shape: 'round' | 'rect';
}

export default function TableLayoutEditor() {
  const { tables, isLoading, saveLayout, isSaving } = useTableLayout();
  const { t } = useLanguage();
  const [localTables, setLocalTables] = useState<TableDef[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<EditingTable | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Work with local copy once user starts editing, otherwise show DB data
  const currentTables = localTables ?? tables;
  const hasChanges = localTables !== null;

  const maxRow = Math.max(0, ...currentTables.map((t) => t.row));
  const maxCol = Math.max(0, ...currentTables.map((t) => t.col));

  function openAddDialog() {
    const nextId = `B${currentTables.length + 1}`;
    setEditingTable({
      id: nextId,
      capacity: 4,
      row: maxRow + 1,
      col: 1,
      shape: 'rect',
    });
    setIsNew(true);
    setDialogOpen(true);
  }

  function openEditDialog(table: TableDef) {
    setEditingTable({
      id: table.id,
      capacity: table.capacity,
      row: table.row,
      col: table.col,
      shape: table.shape ?? 'rect',
    });
    setIsNew(false);
    setDialogOpen(true);
  }

  function handleSaveTable() {
    if (!editingTable) return;
    const updated = localTables ? [...localTables] : [...tables];
    const def: TableDef = {
      id: editingTable.id,
      capacity: editingTable.capacity,
      row: editingTable.row,
      col: editingTable.col,
      shape: editingTable.shape,
    };
    if (isNew) {
      // Check for duplicate id
      if (updated.some((t) => t.id === def.id)) {
        toast.error(`Table "${def.id}" already exists`);
        return;
      }
      updated.push(def);
    } else {
      const idx = updated.findIndex((t) => t.id === def.id);
      if (idx >= 0) updated[idx] = def;
    }
    setLocalTables(updated);
    setDialogOpen(false);
    setEditingTable(null);
  }

  function handleDelete(id: string) {
    const updated = (localTables ?? [...tables]).filter((t) => t.id !== id);
    setLocalTables(updated);
  }

  async function handleSaveLayout() {
    if (!localTables) return;
    try {
      await saveLayout(localTables);
      setLocalTables(null);
      toast.success('Layout saved');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save layout');
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading layout…</p>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg">Restaurant Layout</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={openAddDialog}>
            <Plus className="h-4 w-4" />
            Add Table
          </Button>
          {hasChanges && (
            <Button size="sm" className="gap-2" onClick={handleSaveLayout} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving…' : 'Save Layout'}
            </Button>
          )}
        </div>
      </div>

      {/* Grid Preview */}
      {currentTables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
          <LayoutGrid className="h-12 w-12 opacity-40" />
          <p className="text-sm">No tables configured yet. Add your first table to get started.</p>
        </div>
      ) : (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${Math.max(maxCol, 1)}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: maxRow }, (_, r) =>
            Array.from({ length: maxCol }, (_, c) => {
              const table = currentTables.find((t) => t.row === r + 1 && t.col === c + 1);
              return (
                <div
                  key={`${r + 1}-${c + 1}`}
                  className={cn(
                    'min-h-[64px] rounded-xl border-2 border-dashed flex items-center justify-center text-xs transition-colors cursor-pointer',
                    table
                      ? 'border-primary/40 bg-primary/5 hover:bg-primary/10'
                      : 'border-border/30 bg-muted/20'
                  )}
                  onClick={() => table && openEditDialog(table)}
                >
                  {table ? (
                    <div className="text-center p-2">
                      <div className="font-semibold text-foreground">{table.id}</div>
                      <div className="text-muted-foreground">
                        {table.capacity}p · {table.shape === 'round' ? '●' : '▬'}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Table List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">All Tables ({currentTables.length})</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {currentTables
            .slice()
            .sort((a, b) => a.row - b.row || a.col - b.col)
            .map((table) => (
              <div
                key={table.id}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                <button className="flex items-center gap-3 text-left flex-1" onClick={() => openEditDialog(table)}>
                  <div
                    className={cn(
                      'w-8 h-8 flex items-center justify-center text-xs font-bold',
                      table.shape === 'round' ? 'rounded-full' : 'rounded-lg',
                      'bg-primary/15 text-primary'
                    )}
                  >
                    {table.id.replace('B', '')}
                  </div>
                  <div>
                    <span className="font-medium text-sm">{table.id}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      {table.capacity}p · R{table.row}C{table.col}
                    </span>
                  </div>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive h-8 w-8"
                  onClick={() => handleDelete(table.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add Table' : `Edit ${editingTable?.id}`}</DialogTitle>
          </DialogHeader>
          {editingTable && (
            <div className="space-y-4 py-2">
              <div>
                <Label>Table ID / Name</Label>
                <Input
                  value={editingTable.id}
                  onChange={(e) => setEditingTable({ ...editingTable, id: e.target.value })}
                  disabled={!isNew}
                  placeholder="e.g. B1 or Bord 1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={editingTable.capacity}
                    onChange={(e) =>
                      setEditingTable({ ...editingTable, capacity: parseInt(e.target.value) || 2 })
                    }
                  />
                </div>
                <div>
                  <Label>Shape</Label>
                  <Select
                    value={editingTable.shape}
                    onValueChange={(v) => setEditingTable({ ...editingTable, shape: v as 'round' | 'rect' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rect">Rectangular</SelectItem>
                      <SelectItem value="round">Round</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Row</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={editingTable.row}
                    onChange={(e) =>
                      setEditingTable({ ...editingTable, row: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div>
                  <Label>Column</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={editingTable.col}
                    onChange={(e) =>
                      setEditingTable({ ...editingTable, col: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTable}>{isNew ? 'Add' : 'Update'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
