import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { fetchRooms, fetchGuests, fetchReservations as apiFetchReservations } from '@/api/queries';
import { mirrorWriteStayOnCheckIn, mirrorWriteStayOnCheckOut } from '@/api/stays';
import { emitCheckInEvent, emitCheckOutEvent } from '@/api/frontOfficeEvents';
import { mirrorChargeToFolio } from '@/api/billing';

// Types
export interface Room {
  id: string;
  room_number: string;
  floor: number;
  room_type: string;
  status: string;
  capacity: number;
  amenities: Record<string, unknown> | null;
  is_active: boolean;
  notes: string | null;
}

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  passport_number: string | null;
  notes: string | null;
  visit_count: number;
}

export interface Reservation {
  id: string;
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  adults: number;
  children: number;
  rate_per_night: number | null;
  total_amount: number | null;
  payment_status: string;
  source: string | null;
  special_requests: string | null;
  assigned_by: string | null;
  guest?: Guest;
  room?: Room;
}

export interface RoomCharge {
  id: string;
  reservation_id: string;
  description: string;
  amount: number;
  charge_type: string;
  charged_by: string | null;
  created_at: string;
}

// Hooks
export function useRooms() {
  const queryClient = useQueryClient();
  const { activeHotelId } = useAuth();

  const query = useQuery({
    queryKey: ['rooms', activeHotelId],
    queryFn: () => fetchRooms(activeHotelId) as Promise<Room[]>,
  });

  useEffect(() => {
    const channel = supabase
      .channel('rooms-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useGuests() {
  const queryClient = useQueryClient();
  const { activeHotelId } = useAuth();

  const query = useQuery({
    queryKey: ['guests', activeHotelId],
    queryFn: () => fetchGuests(activeHotelId) as Promise<Guest[]>,
  });

  useEffect(() => {
    const channel = supabase
      .channel('guests-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, () => {
        queryClient.invalidateQueries({ queryKey: ['guests'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useReservations(dateFilter?: { from: string; to: string }) {
  const queryClient = useQueryClient();
  const { activeHotelId } = useAuth();

  const query = useQuery({
    queryKey: ['reservations', activeHotelId, dateFilter],
    queryFn: () => apiFetchReservations(activeHotelId, dateFilter) as Promise<Reservation[]>,
  });

  useEffect(() => {
    const channel = supabase
      .channel('reservations-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['reservations'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useRoomCharges(reservationId?: string) {
  const { activeHotelId } = useAuth();
  return useQuery({
    queryKey: ['room-charges', activeHotelId, reservationId],
    queryFn: async () => {
      if (!reservationId) return [];
      const { data, error } = await supabase
        .from('room_charges')
        .select('*')
        .eq('hotel_id', activeHotelId)
        .eq('reservation_id', reservationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as RoomCharge[];
    },
    enabled: !!reservationId,
  });
}

// Mutations
export function useRoomMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeHotelId } = useAuth();

  const createRoom = useMutation({
    mutationFn: async (room: Partial<Room>) => {
      const { data, error } = await supabase.from('rooms').insert({ ...room, hotel_id: activeHotelId } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Room created' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateRoom = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Room> & { id: string }) => {
      const { error } = await supabase.from('rooms').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return { createRoom, updateRoom };
}

export function useGuestMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeHotelId } = useAuth();

  const createGuest = useMutation({
    mutationFn: async (guest: Partial<Guest>) => {
      const { data, error } = await supabase.from('guests').insert({ ...guest, hotel_id: activeHotelId } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      toast({ title: 'Guest added' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateGuest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Guest> & { id: string }) => {
      const { error } = await supabase.from('guests').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['guests'] }),
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return { createGuest, updateGuest };
}

export function useReservationMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, activeHotelId } = useAuth();

  const createReservation = useMutation({
    mutationFn: async (res: Partial<Reservation>) => {
      const { data, error } = await supabase.from('reservations').insert({
        ...res,
        assigned_by: user?.id,
        hotel_id: activeHotelId,
      } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({ title: 'Reservation created' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const checkIn = useMutation({
    mutationFn: async (reservationId: string) => {
      const { error: resErr } = await supabase
        .from('reservations')
        .update({ status: 'checked_in' } as any)
        .eq('id', reservationId);
      if (resErr) throw resErr;

      const { data: res } = await supabase
        .from('reservations')
        .select('room_id, guest_id, check_in_date, check_out_date, source, special_requests')
        .eq('id', reservationId)
        .single();
      if (res) {
        await supabase.from('rooms').update({ status: 'occupied' } as any).eq('id', res.room_id);

        // Phase 8: best-effort mirror write to stays
        mirrorWriteStayOnCheckIn({
          hotelId: activeHotelId,
          reservationId,
          roomId: res.room_id,
          guestId: res.guest_id,
          checkIn: res.check_in_date,
          checkOut: res.check_out_date,
          status: 'checked_in',
          source: res.source || undefined,
          notes: res.special_requests || undefined,
        });

        // Phase 9: best-effort event emission
        if (user?.id) {
          emitCheckInEvent({
            hotelId: activeHotelId,
            reservationId,
            performedBy: user.id,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ title: 'Guest checked in' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const checkOut = useMutation({
    mutationFn: async (reservationId: string) => {
      const { data: res } = await supabase.from('reservations').select('room_id').eq('id', reservationId).single();
      
      const { error: resErr } = await supabase
        .from('reservations')
        .update({ status: 'checked_out' } as any)
        .eq('id', reservationId);
      if (resErr) throw resErr;

      if (res) {
        await supabase.from('rooms').update({ status: 'checkout' } as any).eq('id', res.room_id);
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('housekeeping_tasks').upsert({
          room_id: res.room_id,
          task_date: today,
          status: 'dirty',
          task_type: 'checkout_clean',
          priority: 'normal',
          hotel_id: activeHotelId,
        } as any, { onConflict: 'room_id,task_date' });
      }

      // Phase 8: best-effort mirror write
      mirrorWriteStayOnCheckOut(reservationId, activeHotelId);

      // Phase 9: best-effort event emission
      if (user?.id) {
        emitCheckOutEvent({
          hotelId: activeHotelId,
          reservationId,
          performedBy: user.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['housekeeping-tasks'] });
      toast({ title: 'Guest checked out' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const updateReservation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Reservation> & { id: string }) => {
      const { error } = await supabase.from('reservations').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return { createReservation, checkIn, checkOut, updateReservation };
}

export function useChargeMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, activeHotelId } = useAuth();

  const addCharge = useMutation({
    mutationFn: async (charge: Partial<RoomCharge>) => {
      const { data, error } = await supabase.from('room_charges').insert({
        ...charge,
        charged_by: user?.id,
        hotel_id: activeHotelId,
      } as any).select().single();
      if (error) throw error;

      // Phase 10: best-effort folio mirror
      if (data && charge.reservation_id) {
        mirrorChargeToFolio({
          hotelId: activeHotelId,
          reservationId: charge.reservation_id,
          chargeId: data.id,
          description: charge.description || '',
          amount: charge.amount || 0,
          chargeType: charge.charge_type || 'other',
          createdBy: user?.id,
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room-charges'] });
      toast({ title: 'Charge added' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  return { addCharge };
}
