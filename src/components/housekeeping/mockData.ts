/**
 * Mock data for Housekeeping module testing.
 * This file provides realistic demo data when no real DB data exists.
 * Remove this file and the useMock flags before production.
 */

import type { HousekeepingTask, MaintenanceRequest } from '@/hooks/useHousekeeping';

const today = new Date().toISOString().split('T')[0];
const now = new Date().toISOString();
const ago = (mins: number) => new Date(Date.now() - mins * 60_000).toISOString();

// Staff IDs (fake UUIDs)
export const MOCK_STAFF = [
  { user_id: 'mock-staff-maria', name: 'Maria Jensen' },
  { user_id: 'mock-staff-lars', name: 'Lars Andersen' },
  { user_id: 'mock-staff-anna', name: 'Anna Petersen' },
  { user_id: 'mock-staff-mikkel', name: 'Mikkel Sørensen' },
];

export const MOCK_TASKS: HousekeepingTask[] = [
  // --- DIRTY rooms (awaiting cleaning) ---
  {
    id: 'mock-t-101', room_id: 'mock-r-101', task_date: today, status: 'dirty',
    priority: 'vip', task_type: 'checkout_clean', assigned_to: 'mock-staff-maria',
    started_at: null, completed_at: null, inspected_by: null, inspected_at: null,
    notes: 'VIP guest arriving at 14:00. Extra attention to bathroom.', estimated_minutes: 45, paused_reason: null,
    room: { room_number: '101', floor: 1, room_type: 'Suite' },
  },
  {
    id: 'mock-t-204', room_id: 'mock-r-204', task_date: today, status: 'dirty',
    priority: 'urgent', task_type: 'checkout_clean', assigned_to: 'mock-staff-maria',
    started_at: null, completed_at: null, inspected_by: null, inspected_at: null,
    notes: null, estimated_minutes: 35, paused_reason: null,
    room: { room_number: '204', floor: 2, room_type: 'Double' },
  },
  {
    id: 'mock-t-301', room_id: 'mock-r-301', task_date: today, status: 'dirty',
    priority: 'normal', task_type: 'checkout_clean', assigned_to: null,
    started_at: null, completed_at: null, inspected_by: null, inspected_at: null,
    notes: null, estimated_minutes: 30, paused_reason: null,
    room: { room_number: '301', floor: 3, room_type: 'Single' },
  },
  {
    id: 'mock-t-305', room_id: 'mock-r-305', task_date: today, status: 'dirty',
    priority: 'normal', task_type: 'checkout_clean', assigned_to: null,
    started_at: null, completed_at: null, inspected_by: null, inspected_at: null,
    notes: null, estimated_minutes: 30, paused_reason: null,
    room: { room_number: '305', floor: 3, room_type: 'Double' },
  },
  {
    id: 'mock-t-401', room_id: 'mock-r-401', task_date: today, status: 'dirty',
    priority: 'vip', task_type: 'checkout_clean', assigned_to: null,
    started_at: null, completed_at: null, inspected_by: null, inspected_at: null,
    notes: 'Honeymoon suite — champagne setup requested.', estimated_minutes: 50, paused_reason: null,
    room: { room_number: '401', floor: 4, room_type: 'Suite' },
  },

  // --- IN_PROGRESS rooms ---
  {
    id: 'mock-t-102', room_id: 'mock-r-102', task_date: today, status: 'in_progress',
    priority: 'normal', task_type: 'stay_over', assigned_to: 'mock-staff-lars',
    started_at: ago(18), completed_at: null, inspected_by: null, inspected_at: null,
    notes: null, estimated_minutes: 20, paused_reason: null,
    room: { room_number: '102', floor: 1, room_type: 'Double' },
  },
  {
    id: 'mock-t-205', room_id: 'mock-r-205', task_date: today, status: 'in_progress',
    priority: 'normal', task_type: 'checkout_clean', assigned_to: 'mock-staff-anna',
    started_at: ago(25), completed_at: null, inspected_by: null, inspected_at: null,
    notes: 'Guest reported sticky residue on desk.', estimated_minutes: 35, paused_reason: null,
    room: { room_number: '205', floor: 2, room_type: 'Twin' },
  },
  {
    id: 'mock-t-103', room_id: 'mock-r-103', task_date: today, status: 'in_progress',
    priority: 'normal', task_type: 'deep_clean', assigned_to: 'mock-staff-mikkel',
    started_at: ago(40), completed_at: null, inspected_by: null, inspected_at: null,
    notes: 'Quarterly deep clean. Move furniture and clean underneath.', estimated_minutes: 90, paused_reason: null,
    room: { room_number: '103', floor: 1, room_type: 'Single' },
  },

  // --- PAUSED rooms ---
  {
    id: 'mock-t-302', room_id: 'mock-r-302', task_date: today, status: 'paused',
    priority: 'normal', task_type: 'stay_over', assigned_to: 'mock-staff-lars',
    started_at: ago(45), completed_at: null, inspected_by: null, inspected_at: null,
    notes: 'Guest inside — DND. Return after 13:00.', estimated_minutes: 20, paused_reason: 'DND - Guest inside',
    room: { room_number: '302', floor: 3, room_type: 'Double' },
  },

  // --- CLEAN rooms (awaiting inspection) ---
  {
    id: 'mock-t-201', room_id: 'mock-r-201', task_date: today, status: 'clean',
    priority: 'normal', task_type: 'checkout_clean', assigned_to: 'mock-staff-maria',
    started_at: ago(70), completed_at: ago(35), inspected_by: null, inspected_at: null,
    notes: null, estimated_minutes: 35, paused_reason: null,
    room: { room_number: '201', floor: 2, room_type: 'Double' },
  },
  {
    id: 'mock-t-202', room_id: 'mock-r-202', task_date: today, status: 'clean',
    priority: 'vip', task_type: 'checkout_clean', assigned_to: 'mock-staff-anna',
    started_at: ago(90), completed_at: ago(50), inspected_by: null, inspected_at: null,
    notes: 'VIP return guest — verify welcome amenity is placed.', estimated_minutes: 40, paused_reason: null,
    room: { room_number: '202', floor: 2, room_type: 'Suite' },
  },
  {
    id: 'mock-t-303', room_id: 'mock-r-303', task_date: today, status: 'clean',
    priority: 'normal', task_type: 'stay_over', assigned_to: 'mock-staff-mikkel',
    started_at: ago(60), completed_at: ago(40), inspected_by: null, inspected_at: null,
    notes: null, estimated_minutes: 20, paused_reason: null,
    room: { room_number: '303', floor: 3, room_type: 'Single' },
  },
  {
    id: 'mock-t-402', room_id: 'mock-r-402', task_date: today, status: 'clean',
    priority: 'urgent', task_type: 'checkout_clean', assigned_to: 'mock-staff-lars',
    started_at: ago(80), completed_at: ago(45), inspected_by: null, inspected_at: null,
    notes: 'Early check-in guest waiting.', estimated_minutes: 35, paused_reason: null,
    room: { room_number: '402', floor: 4, room_type: 'Double' },
  },

  // --- INSPECTED rooms (done) ---
  {
    id: 'mock-t-104', room_id: 'mock-r-104', task_date: today, status: 'inspected',
    priority: 'normal', task_type: 'checkout_clean', assigned_to: 'mock-staff-maria',
    started_at: ago(180), completed_at: ago(145), inspected_by: 'mock-supervisor', inspected_at: ago(130),
    notes: null, estimated_minutes: 35, paused_reason: null,
    room: { room_number: '104', floor: 1, room_type: 'Double' },
  },
  {
    id: 'mock-t-105', room_id: 'mock-r-105', task_date: today, status: 'inspected',
    priority: 'normal', task_type: 'stay_over', assigned_to: 'mock-staff-lars',
    started_at: ago(160), completed_at: ago(140), inspected_by: 'mock-supervisor', inspected_at: ago(120),
    notes: null, estimated_minutes: 20, paused_reason: null,
    room: { room_number: '105', floor: 1, room_type: 'Single' },
  },
  {
    id: 'mock-t-203', room_id: 'mock-r-203', task_date: today, status: 'inspected',
    priority: 'vip', task_type: 'checkout_clean', assigned_to: 'mock-staff-anna',
    started_at: ago(200), completed_at: ago(165), inspected_by: 'mock-supervisor', inspected_at: ago(150),
    notes: null, estimated_minutes: 35, paused_reason: null,
    room: { room_number: '203', floor: 2, room_type: 'Suite' },
  },

  // --- Stayover tasks (various floors) ---
  {
    id: 'mock-t-304', room_id: 'mock-r-304', task_date: today, status: 'dirty',
    priority: 'normal', task_type: 'stay_over', assigned_to: 'mock-staff-anna',
    started_at: null, completed_at: null, inspected_by: null, inspected_at: null,
    notes: null, estimated_minutes: 20, paused_reason: null,
    room: { room_number: '304', floor: 3, room_type: 'Twin' },
  },
  {
    id: 'mock-t-403', room_id: 'mock-r-403', task_date: today, status: 'dirty',
    priority: 'normal', task_type: 'stay_over', assigned_to: null,
    started_at: null, completed_at: null, inspected_by: null, inspected_at: null,
    notes: null, estimated_minutes: 20, paused_reason: null,
    room: { room_number: '403', floor: 4, room_type: 'Double' },
  },

  // --- Turndown tasks ---
  {
    id: 'mock-t-106', room_id: 'mock-r-106', task_date: today, status: 'dirty',
    priority: 'normal', task_type: 'turndown', assigned_to: null,
    started_at: null, completed_at: null, inspected_by: null, inspected_at: null,
    notes: null, estimated_minutes: 10, paused_reason: null,
    room: { room_number: '106', floor: 1, room_type: 'Suite' },
  },
];

export const MOCK_MAINTENANCE: MaintenanceRequest[] = [
  {
    id: 'mock-m-1', room_id: 'mock-r-204', reported_by: 'mock-staff-maria',
    description: 'Bathroom tap dripping continuously. Guest complained.', priority: 'high',
    status: 'open', resolved_by: null, resolved_at: null, photos: [],
    created_at: ago(120),
    room: { room_number: '204', floor: 2 },
  },
  {
    id: 'mock-m-2', room_id: 'mock-r-103', reported_by: 'mock-staff-mikkel',
    description: 'Window seal cracked — cold air draft.', priority: 'medium',
    status: 'in_progress', resolved_by: null, resolved_at: null, photos: [],
    created_at: ago(300),
    room: { room_number: '103', floor: 1 },
  },
  {
    id: 'mock-m-3', room_id: 'mock-r-402', reported_by: 'mock-staff-lars',
    description: 'Minibar not cooling. Compressor noise.', priority: 'low',
    status: 'open', resolved_by: null, resolved_at: null, photos: [],
    created_at: ago(60),
    room: { room_number: '402', floor: 4 },
  },
];

export const MOCK_RESERVATIONS = [
  { id: 'mock-res-1', check_in_date: today, check_out_date: '', status: 'confirmed' },
  { id: 'mock-res-2', check_in_date: today, check_out_date: '', status: 'confirmed' },
  { id: 'mock-res-3', check_in_date: today, check_out_date: '', status: 'confirmed' },
  { id: 'mock-res-4', check_in_date: today, check_out_date: '', status: 'confirmed' },
  { id: 'mock-res-5', check_in_date: today, check_out_date: '', status: 'confirmed' },
  { id: 'mock-res-6', check_in_date: today, check_out_date: '', status: 'confirmed' },
  { id: 'mock-res-7', check_in_date: today, check_out_date: '', status: 'confirmed' },
  { id: 'mock-res-8', check_in_date: today, check_out_date: '', status: 'confirmed' },
  // Departures
  { id: 'mock-res-d1', check_in_date: '2026-03-11', check_out_date: today, status: 'checked_in' },
  { id: 'mock-res-d2', check_in_date: '2026-03-10', check_out_date: today, status: 'checked_in' },
  { id: 'mock-res-d3', check_in_date: '2026-03-12', check_out_date: today, status: 'checked_in' },
  { id: 'mock-res-d4', check_in_date: '2026-03-11', check_out_date: today, status: 'checked_in' },
  { id: 'mock-res-d5', check_in_date: '2026-03-09', check_out_date: today, status: 'checked_in' },
  { id: 'mock-res-d6', check_in_date: '2026-03-12', check_out_date: today, status: 'checked_in' },
  { id: 'mock-res-d7', check_in_date: '2026-03-10', check_out_date: today, status: 'checked_in' },
  { id: 'mock-res-d8', check_in_date: '2026-03-11', check_out_date: today, status: 'checked_in' },
  { id: 'mock-res-d9', check_in_date: '2026-03-12', check_out_date: today, status: 'checked_in' },
  { id: 'mock-res-d10', check_in_date: '2026-03-10', check_out_date: today, status: 'checked_in' },
  { id: 'mock-res-d11', check_in_date: '2026-03-11', check_out_date: today, status: 'checked_in' },
  { id: 'mock-res-d12', check_in_date: '2026-03-09', check_out_date: today, status: 'checked_in' },
  // Stayovers (checked in, checking out later)
  { id: 'mock-res-s1', check_in_date: '2026-03-11', check_out_date: '2026-03-15', status: 'checked_in' },
  { id: 'mock-res-s2', check_in_date: '2026-03-10', check_out_date: '2026-03-16', status: 'checked_in' },
  { id: 'mock-res-s3', check_in_date: '2026-03-12', check_out_date: '2026-03-14', status: 'checked_in' },
  { id: 'mock-res-s4', check_in_date: '2026-03-10', check_out_date: '2026-03-17', status: 'checked_in' },
  { id: 'mock-res-s5', check_in_date: '2026-03-11', check_out_date: '2026-03-15', status: 'checked_in' },
];

export const MOCK_ZONES = [
  { id: 'mock-zone-1', name: 'Wing A (Floors 1–2)', floors: [1, 2], assigned_staff: ['mock-staff-maria', 'mock-staff-lars'], is_active: true, hotel_id: '', created_at: now },
  { id: 'mock-zone-2', name: 'Wing B (Floors 3–4)', floors: [3, 4], assigned_staff: ['mock-staff-anna', 'mock-staff-mikkel'], is_active: true, hotel_id: '', created_at: now },
];

/** Check if we should use mock data (no real data returned) */
export const USE_HK_MOCK = true;
