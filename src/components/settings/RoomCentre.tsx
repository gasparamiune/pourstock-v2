/**
 * Room Centre — Full CRUD for hotel rooms with single + bulk creation.
 * Supports amenity packs, multi-room generation, floor/type filtering.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  BedDouble, Plus, Edit, Trash2, Copy, Search, Filter,
  ChevronDown, Hash, Layers, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Tables } from '@/integrations/supabase/types';

type Room = Tables<'rooms'>;
type RoomType = 'single' | 'double' | 'twin' | 'suite' | 'family';
type RoomStatus = 'available' | 'occupied' | 'checkout' | 'maintenance' | 'reserved';

const ROOM_TYPES: RoomType[] = ['single', 'double', 'twin', 'suite', 'family'];

const DEFAULT_AMENITY_PACKS: Record<string, { label: string; items: string[] }> = {
  standard: {
    label: 'Standard',
    items: ['Towels', 'Soap', 'Shampoo', 'Hair dryer', 'TV remote', 'Room key card'],
  },
  comfort: {
    label: 'Comfort',
    items: ['Towels', 'Soap', 'Shampoo', 'Conditioner', 'Body lotion', 'Hair dryer', 'TV remote', 'Room key card', 'Bathrobe', 'Slippers', 'Minibar'],
  },
  premium: {
    label: 'Premium',
    items: ['Towels', 'Soap', 'Shampoo', 'Conditioner', 'Body lotion', 'Hair dryer', 'TV remote', 'Room key card', 'Bathrobe', 'Slippers', 'Minibar', 'Nespresso machine', 'Welcome fruit', 'Premium toiletries', 'Pillow menu'],
  },
  suite: {
    label: 'Suite',
    items: ['Towels', 'Soap', 'Shampoo', 'Conditioner', 'Body lotion', 'Hair dryer', 'TV remote', 'Room key card', 'Bathrobe', 'Slippers', 'Minibar', 'Nespresso machine', 'Welcome fruit', 'Premium toiletries', 'Pillow menu', 'Welcome champagne', 'Fresh flowers', 'Turn-down service'],
  },
};

interface SingleRoomForm {
  room_number: string;
  room_type: RoomType;
  floor: number;
  capacity: number;
  amenities: string[];
  notes: string;
}

interface BulkRoomForm {
  prefix: string;
  start_number: number;
  count: number;
  room_type: RoomType;
  floor_start: number;
  rooms_per_floor: number;
  capacity: number;
  amenity_pack: string;
  custom_amenities: string[];
}

const emptySingleForm: SingleRoomForm = {
  room_number: '', room_type: 'double', floor: 1, capacity: 2, amenities: [], notes: '',
};

const emptyBulkForm: BulkRoomForm = {
  prefix: '', start_number: 101, count: 10, room_type: 'double',
  floor_start: 1, rooms_per_floor: 10, capacity: 2,
  amenity_pack: 'standard', custom_amenities: [],
};

export default function RoomCentre() {
  const { activeHotelId } = useAuth();
  const { t } = useLanguage();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'single' | 'bulk'>('single');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [singleForm, setSingleForm] = useState<SingleRoomForm>(emptySingleForm);
  const [bulkForm, setBulkForm] = useState<BulkRoomForm>(emptyBulkForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedAmenityPack, setSelectedAmenityPack] = useState<string>('standard');

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms', activeHotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('hotel_id', activeHotelId!)
        .eq('is_active', true)
        .order('floor')
        .order('room_number');
      if (error) throw error;
      return data as Room[];
    },
    enabled: !!activeHotelId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['rooms', activeHotelId] });

  const createRoom = useMutation({
    mutationFn: async (values: Omit<Room, 'id' | 'created_at' | 'updated_at' | 'status' | 'is_active'>[]) => {
      const { error } = await supabase.from('rooms').insert(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        values.map(v => ({ ...v, hotel_id: activeHotelId })) as any
      );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      invalidate();
      toast.success(`${vars.length} room${vars.length > 1 ? 's' : ''} created`);
      setDialogOpen(false);
    },
    onError: (e: Error) => {
      if (e.message.includes('duplicate key') || e.message.includes('unique')) {
        toast.error('One or more room numbers already exist');
      } else if (e.message.includes('row-level security')) {
        toast.error('You do not have permission to create rooms');
      } else {
        toast.error(e.message);
      }
    },
  });

  const updateRoom = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async ({ id, ...values }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from('rooms').update(values).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Room updated');
      setDialogOpen(false);
      setEditingRoom(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRoom = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('rooms').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Room deactivated');
      setDeletingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Derived data
  const floors = useMemo(() => [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b), [rooms]);

  const filteredRooms = useMemo(() => {
    let result = rooms;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => r.room_number.toLowerCase().includes(q));
    }
    if (filterFloor !== 'all') result = result.filter(r => r.floor === parseInt(filterFloor));
    if (filterType !== 'all') result = result.filter(r => r.room_type === filterType);
    return result;
  }, [rooms, searchQuery, filterFloor, filterType]);

  const roomsByFloor = useMemo(() => {
    const grouped: Record<number, Room[]> = {};
    filteredRooms.forEach(r => {
      if (!grouped[r.floor]) grouped[r.floor] = [];
      grouped[r.floor].push(r);
    });
    return grouped;
  }, [filteredRooms]);

  // Actions
  const openCreateSingle = () => {
    setEditingRoom(null);
    setSingleForm(emptySingleForm);
    setSelectedAmenityPack('standard');
    setDialogMode('single');
    setDialogOpen(true);
  };

  const openCreateBulk = () => {
    setEditingRoom(null);
    setBulkForm(emptyBulkForm);
    setDialogMode('bulk');
    setDialogOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    const amenities = Array.isArray(room.amenities) ? room.amenities as string[] : [];
    setSingleForm({
      room_number: room.room_number,
      room_type: room.room_type as RoomType,
      floor: room.floor,
      capacity: room.capacity,
      amenities,
      notes: room.notes || '',
    });
    setDialogMode('single');
    setDialogOpen(true);
  };

  const handleSaveSingle = () => {
    if (!singleForm.room_number.trim()) return;
    const payload = {
      room_number: singleForm.room_number.trim(),
      room_type: singleForm.room_type,
      floor: singleForm.floor,
      capacity: singleForm.capacity,
      amenities: singleForm.amenities,
      notes: singleForm.notes || null,
    };
    if (editingRoom) {
      updateRoom.mutate({ id: editingRoom.id, ...payload });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createRoom.mutate([payload as any]);
    }
  };

  const handleSaveBulk = () => {
    if (bulkForm.count < 1 || bulkForm.count > 500) {
      toast.error('Room count must be between 1 and 500');
      return;
    }

    const amenities = bulkForm.amenity_pack !== 'custom'
      ? DEFAULT_AMENITY_PACKS[bulkForm.amenity_pack]?.items || []
      : bulkForm.custom_amenities;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roomsToCreate: any[] = [];
    for (let i = 0; i < bulkForm.count; i++) {
      const num = bulkForm.start_number + i;
      const floor = bulkForm.floor_start + Math.floor(i / bulkForm.rooms_per_floor);
      const roomNumber = bulkForm.prefix ? `${bulkForm.prefix}${num}` : `${num}`;
      roomsToCreate.push({
        room_number: roomNumber,
        room_type: bulkForm.room_type,
        floor,
        capacity: bulkForm.capacity,
        amenities,
        notes: null,
      });
    }
    createRoom.mutate(roomsToCreate);
  };

  const applyAmenityPack = (packKey: string) => {
    setSelectedAmenityPack(packKey);
    const pack = DEFAULT_AMENITY_PACKS[packKey];
    if (pack) {
      setSingleForm(f => ({ ...f, amenities: [...pack.items] }));
    }
  };

  const toggleAmenity = (item: string) => {
    setSingleForm(f => ({
      ...f,
      amenities: f.amenities.includes(item)
        ? f.amenities.filter(a => a !== item)
        : [...f.amenities, item],
    }));
  };

  // All possible amenities from all packs
  const allAmenities = useMemo(() => {
    const set = new Set<string>();
    Object.values(DEFAULT_AMENITY_PACKS).forEach(p => p.items.forEach(i => set.add(i)));
    return Array.from(set).sort();
  }, []);

  // Preview for bulk
  const bulkPreview = useMemo(() => {
    if (bulkForm.count <= 0) return [];
    const preview: { number: string; floor: number }[] = [];
    const showCount = Math.min(bulkForm.count, 5);
    for (let i = 0; i < showCount; i++) {
      const num = bulkForm.start_number + i;
      const floor = bulkForm.floor_start + Math.floor(i / bulkForm.rooms_per_floor);
      preview.push({ number: bulkForm.prefix ? `${bulkForm.prefix}${num}` : `${num}`, floor });
    }
    if (bulkForm.count > 5) {
      const lastI = bulkForm.count - 1;
      const lastNum = bulkForm.start_number + lastI;
      const lastFloor = bulkForm.floor_start + Math.floor(lastI / bulkForm.rooms_per_floor);
      preview.push({ number: '...', floor: 0 });
      preview.push({ number: bulkForm.prefix ? `${bulkForm.prefix}${lastNum}` : `${lastNum}`, floor: lastFloor });
    }
    return preview;
  }, [bulkForm]);

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading…</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-semibold text-lg">Room Centre</h2>
          <p className="text-sm text-muted-foreground">
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={openCreateBulk}>
            <Copy className="h-4 w-4" />
            Bulk Create
          </Button>
          <Button size="sm" className="gap-2" onClick={openCreateSingle}>
            <Plus className="h-4 w-4" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search room number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterFloor} onValueChange={setFilterFloor}>
          <SelectTrigger className="w-[140px]">
            <Layers className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Floor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Floors</SelectItem>
            {floors.map(f => (
              <SelectItem key={f} value={String(f)}>Floor {f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]">
            <BedDouble className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ROOM_TYPES.map(rt => (
              <SelectItem key={rt} value={rt} className="capitalize">{rt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Room list grouped by floor */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <BedDouble className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No rooms found</p>
          <p className="text-sm mt-1">
            {rooms.length === 0
              ? 'Get started by adding rooms individually or use Bulk Create to set up your entire hotel.'
              : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(roomsByFloor).sort(([a], [b]) => Number(a) - Number(b)).map(([floor, floorRooms]) => (
            <div key={floor}>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm">Floor {floor}</h3>
                <Badge variant="secondary" className="text-xs">{floorRooms.length} rooms</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {floorRooms.map(room => (
                  <div
                    key={room.id}
                    className="p-4 rounded-xl bg-secondary/50 border border-border/50 hover:border-border transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-lg">{room.room_number}</span>
                        <Badge variant="outline" className="capitalize text-xs">{room.room_type}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(room)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingId(room.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Hash className="h-3 w-3" />
                        <span>Capacity: {room.capacity}</span>
                      </div>
                      {Array.isArray(room.amenities) && (room.amenities as string[]).length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3 w-3" />
                          <span>{(room.amenities as string[]).length} amenities</span>
                        </div>
                      )}
                      {room.notes && (
                        <p className="text-xs italic truncate">{room.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? `Edit Room ${editingRoom.room_number}` : dialogMode === 'bulk' ? 'Bulk Create Rooms' : 'Add Room'}
            </DialogTitle>
            <DialogDescription>
              {editingRoom
                ? 'Update room details and amenities.'
                : dialogMode === 'bulk'
                  ? 'Create multiple rooms at once with the same configuration.'
                  : 'Add a single room to the hotel.'}
            </DialogDescription>
          </DialogHeader>

          {!editingRoom && !editingRoom && (
            <Tabs value={dialogMode} onValueChange={v => setDialogMode(v as 'single' | 'bulk')}>
              <TabsList className="w-full">
                <TabsTrigger value="single" className="flex-1">Single Room</TabsTrigger>
                <TabsTrigger value="bulk" className="flex-1">Bulk Create</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Single Room Form */}
          {(dialogMode === 'single' || editingRoom) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Room Number *</Label>
                  <Input
                    value={singleForm.room_number}
                    onChange={e => setSingleForm(f => ({ ...f, room_number: e.target.value }))}
                    placeholder="e.g. 101"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={singleForm.room_type} onValueChange={v => setSingleForm(f => ({ ...f, room_type: v as RoomType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map(rt => (
                        <SelectItem key={rt} value={rt} className="capitalize">{rt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Floor</Label>
                  <Input type="number" min={-2} max={100} value={singleForm.floor} onChange={e => setSingleForm(f => ({ ...f, floor: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input type="number" min={1} max={20} value={singleForm.capacity} onChange={e => setSingleForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>

              {/* Amenity Packs */}
              <div>
                <Label className="mb-2 block">Amenity Pack</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {Object.entries(DEFAULT_AMENITY_PACKS).map(([key, pack]) => (
                    <Button
                      key={key}
                      variant={selectedAmenityPack === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => applyAmenityPack(key)}
                    >
                      {pack.label} ({pack.items.length})
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 rounded-lg border border-border bg-secondary/30">
                  {allAmenities.map(item => (
                    <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={singleForm.amenities.includes(item)}
                        onCheckedChange={() => toggleAmenity(item)}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={singleForm.notes}
                  onChange={e => setSingleForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional room notes..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Bulk Create Form */}
          {dialogMode === 'bulk' && !editingRoom && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Prefix</Label>
                  <Input
                    value={bulkForm.prefix}
                    onChange={e => setBulkForm(f => ({ ...f, prefix: e.target.value }))}
                    placeholder="e.g. A, B, or empty"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional (e.g. "A" → A101)</p>
                </div>
                <div>
                  <Label>Start Number *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={bulkForm.start_number}
                    onChange={e => setBulkForm(f => ({ ...f, start_number: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label>Room Count *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    value={bulkForm.count}
                    onChange={e => setBulkForm(f => ({ ...f, count: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Room Type</Label>
                  <Select value={bulkForm.room_type} onValueChange={v => setBulkForm(f => ({ ...f, room_type: v as RoomType }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map(rt => (
                        <SelectItem key={rt} value={rt} className="capitalize">{rt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Starting Floor</Label>
                  <Input
                    type="number"
                    min={-2}
                    max={100}
                    value={bulkForm.floor_start}
                    onChange={e => setBulkForm(f => ({ ...f, floor_start: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label>Rooms per Floor</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkForm.rooms_per_floor}
                    onChange={e => setBulkForm(f => ({ ...f, rooms_per_floor: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Capacity</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={bulkForm.capacity}
                    onChange={e => setBulkForm(f => ({ ...f, capacity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label>Amenity Pack</Label>
                  <Select value={bulkForm.amenity_pack} onValueChange={v => setBulkForm(f => ({ ...f, amenity_pack: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(DEFAULT_AMENITY_PACKS).map(([key, pack]) => (
                        <SelectItem key={key} value={key}>{pack.label} ({pack.items.length} items)</SelectItem>
                      ))}
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {bulkForm.amenity_pack === 'custom' && (
                <div>
                  <Label>Custom Amenities (comma-separated)</Label>
                  <Textarea
                    value={bulkForm.custom_amenities.join(', ')}
                    onChange={e => setBulkForm(f => ({ ...f, custom_amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="Towels, Soap, Shampoo..."
                    rows={2}
                  />
                </div>
              )}

              {/* Preview */}
              {bulkPreview.length > 0 && (
                <div className="p-3 rounded-lg border border-border bg-secondary/30">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Preview — {bulkForm.count} rooms will be created:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bulkPreview.map((p, i) => (
                      <Badge key={i} variant={p.number === '...' ? 'secondary' : 'outline'} className="text-xs">
                        {p.number === '...' ? '...' : `${p.number} (F${p.floor})`}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Amenities: {bulkForm.amenity_pack !== 'custom'
                      ? `${DEFAULT_AMENITY_PACKS[bulkForm.amenity_pack]?.label} pack`
                      : `${bulkForm.custom_amenities.length} custom items`}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingRoom(null); }}>Cancel</Button>
            <Button
              onClick={editingRoom || dialogMode === 'single' ? handleSaveSingle : handleSaveBulk}
              disabled={
                createRoom.isPending || updateRoom.isPending ||
                (dialogMode === 'single' && !singleForm.room_number.trim()) ||
                (dialogMode === 'bulk' && !editingRoom && bulkForm.count < 1)
              }
            >
              {createRoom.isPending || updateRoom.isPending
                ? 'Saving...'
                : editingRoom
                  ? 'Save'
                  : dialogMode === 'bulk'
                    ? `Create ${bulkForm.count} Rooms`
                    : 'Create Room'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={open => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Room?</AlertDialogTitle>
            <AlertDialogDescription>
              This room will be deactivated and hidden from operations. It can be reactivated later.
              Active reservations and housekeeping tasks will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && deleteRoom.mutate(deletingId)}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
