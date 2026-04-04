export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_cache: {
        Row: {
          content_hash: string
          created_at: string
          expires_at: string
          hit_count: number
          hotel_id: string
          id: string
          job_type: string
          result: Json
        }
        Insert: {
          content_hash: string
          created_at?: string
          expires_at?: string
          hit_count?: number
          hotel_id: string
          id?: string
          job_type?: string
          result: Json
        }
        Update: {
          content_hash?: string
          created_at?: string
          expires_at?: string
          hit_count?: number
          hotel_id?: string
          id?: string
          job_type?: string
          result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_cache_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_cache_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      ai_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          duration_ms: number | null
          estimated_cost: number | null
          hotel_id: string
          id: string
          input: Json | null
          job_type: string
          model: string | null
          output: Json | null
          status: string | null
          tokens_used: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          estimated_cost?: number | null
          hotel_id: string
          id?: string
          input?: Json | null
          job_type: string
          model?: string | null
          output?: Json | null
          status?: string | null
          tokens_used?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          estimated_cost?: number | null
          hotel_id?: string
          id?: string
          input?: Json | null
          job_type?: string
          model?: string | null
          output?: Json | null
          status?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          hotel_id: string | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          hotel_id?: string | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          hotel_id?: string | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      checkin_events: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          method: string | null
          notes: string | null
          performed_at: string
          performed_by: string
          reservation_id: string | null
          stay_id: string | null
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          method?: string | null
          notes?: string | null
          performed_at?: string
          performed_by: string
          reservation_id?: string | null
          stay_id?: string | null
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          method?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string
          reservation_id?: string | null
          stay_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkin_events_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_events_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "checkin_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "checkin_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_reconciliation_candidates"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "checkin_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "checkin_events_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "stays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkin_events_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["stay_id"]
          },
          {
            foreignKeyName: "checkin_events_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["stay_id"]
          },
        ]
      }
      checkout_events: {
        Row: {
          balance_status: string | null
          created_at: string
          hotel_id: string
          id: string
          notes: string | null
          performed_at: string
          performed_by: string
          reservation_id: string | null
          stay_id: string | null
        }
        Insert: {
          balance_status?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by: string
          reservation_id?: string | null
          stay_id?: string | null
        }
        Update: {
          balance_status?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string
          reservation_id?: string | null
          stay_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_events_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_events_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "checkout_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "checkout_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_reconciliation_candidates"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "checkout_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "checkout_events_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "stays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkout_events_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["stay_id"]
          },
          {
            foreignKeyName: "checkout_events_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["stay_id"]
          },
        ]
      }
      daily_menus: {
        Row: {
          created_at: string | null
          desserts: Json
          hotel_id: string
          id: string
          mains: Json
          mellemret: Json
          menu_date: string
          notes: string | null
          published_at: string | null
          published_by: string | null
          starters: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          desserts?: Json
          hotel_id: string
          id?: string
          mains?: Json
          mellemret?: Json
          menu_date: string
          notes?: string | null
          published_at?: string | null
          published_by?: string | null
          starters?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          desserts?: Json
          hotel_id?: string
          id?: string
          mains?: Json
          mellemret?: Json
          menu_date?: string
          notes?: string | null
          published_at?: string | null
          published_by?: string | null
          starters?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_menus_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_menus_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      deep_clean_schedules: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          interval_days: number
          last_completed_at: string | null
          next_due: string | null
          room_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          interval_days?: number
          last_completed_at?: string | null
          next_due?: string | null
          room_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          interval_days?: number
          last_completed_at?: string | null
          next_due?: string | null
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deep_clean_schedules_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deep_clean_schedules_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "deep_clean_schedules_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          config: Json
          created_at: string
          display_name: string
          hotel_id: string
          id: string
          is_active: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          display_name: string
          hotel_id: string
          id?: string
          is_active?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          display_name?: string
          hotel_id?: string
          id?: string
          is_active?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      dual_write_failures: {
        Row: {
          created_at: string
          domain: string
          error_code: string | null
          error_message: string | null
          hotel_id: string | null
          id: string
          operation: string
          payload: Json | null
          resolved_at: string | null
          retryable: boolean | null
          source_record_id: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          error_code?: string | null
          error_message?: string | null
          hotel_id?: string | null
          id?: string
          operation: string
          payload?: Json | null
          resolved_at?: string | null
          retryable?: boolean | null
          source_record_id?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          error_code?: string | null
          error_message?: string | null
          hotel_id?: string | null
          id?: string
          operation?: string
          payload?: Json | null
          resolved_at?: string | null
          retryable?: boolean | null
          source_record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dual_write_failures_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dual_write_failures_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      folio_items: {
        Row: {
          amount: number
          charge_type: string
          created_at: string
          created_by: string | null
          description: string
          folio_id: string
          id: string
          source_id: string | null
          source_type: string | null
        }
        Insert: {
          amount: number
          charge_type: string
          created_at?: string
          created_by?: string | null
          description: string
          folio_id: string
          id?: string
          source_id?: string | null
          source_type?: string | null
        }
        Update: {
          amount?: number
          charge_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          folio_id?: string
          id?: string
          source_id?: string | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folio_items_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
        ]
      }
      folios: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string | null
          guest_id: string | null
          hotel_id: string
          id: string
          reservation_id: string | null
          status: string
          stay_id: string | null
          total: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          guest_id?: string | null
          hotel_id: string
          id?: string
          reservation_id?: string | null
          status?: string
          stay_id?: string | null
          total?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          guest_id?: string | null
          hotel_id?: string
          id?: string
          reservation_id?: string | null
          status?: string
          stay_id?: string | null
          total?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "folios_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folios_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folios_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_reconciliation_candidates"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "folios_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "stays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folios_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["stay_id"]
          },
          {
            foreignKeyName: "folios_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["stay_id"]
          },
        ]
      }
      guest_preferences: {
        Row: {
          created_at: string
          guest_id: string
          hotel_id: string
          id: string
          notes: string | null
          preference_type: string
          preference_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          hotel_id: string
          id?: string
          notes?: string | null
          preference_type: string
          preference_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          preference_type?: string
          preference_value?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_preferences_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_preferences_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_preferences_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      guests: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          hotel_id: string
          id: string
          last_name: string
          nationality: string | null
          notes: string | null
          passport_number: string | null
          phone: string | null
          updated_at: string
          visit_count: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          hotel_id: string
          id?: string
          last_name: string
          nationality?: string | null
          notes?: string | null
          passport_number?: string | null
          phone?: string | null
          updated_at?: string
          visit_count?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          hotel_id?: string
          id?: string
          last_name?: string
          nationality?: string | null
          notes?: string | null
          passport_number?: string | null
          phone?: string | null
          updated_at?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "guests_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      hk_checklists: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          is_active: boolean
          items: Json
          name: string
          room_type: string | null
          task_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          is_active?: boolean
          items?: Json
          name: string
          room_type?: string | null
          task_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          is_active?: boolean
          items?: Json
          name?: string
          room_type?: string | null
          task_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hk_checklists_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hk_checklists_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      hk_incidents: {
        Row: {
          category: string
          created_at: string
          description: string
          financial_note: string | null
          hotel_id: string
          id: string
          is_blocking: boolean
          photos: Json | null
          reported_by: string
          resolved_at: string | null
          room_id: string | null
          severity: string
          status: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          financial_note?: string | null
          hotel_id: string
          id?: string
          is_blocking?: boolean
          photos?: Json | null
          reported_by: string
          resolved_at?: string | null
          room_id?: string | null
          severity?: string
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          financial_note?: string | null
          hotel_id?: string
          id?: string
          is_blocking?: boolean
          photos?: Json | null
          reported_by?: string
          resolved_at?: string | null
          room_id?: string | null
          severity?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "hk_incidents_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hk_incidents_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "hk_incidents_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hk_zones: {
        Row: {
          assigned_staff: string[] | null
          created_at: string
          floors: number[] | null
          hotel_id: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          assigned_staff?: string[] | null
          created_at?: string
          floors?: number[] | null
          hotel_id: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          assigned_staff?: string[] | null
          created_at?: string
          floors?: number[] | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hk_zones_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hk_zones_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      hotel_members: {
        Row: {
          created_at: string
          hotel_id: string
          hotel_role: Database["public"]["Enums"]["hotel_role"]
          id: string
          is_approved: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          hotel_role?: Database["public"]["Enums"]["hotel_role"]
          id?: string
          is_approved?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          hotel_role?: Database["public"]["Enums"]["hotel_role"]
          id?: string
          is_approved?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_members_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_members_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      hotel_modules: {
        Row: {
          config: Json
          created_at: string
          hotel_id: string
          id: string
          is_enabled: boolean
          module: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          hotel_id: string
          id?: string
          is_enabled?: boolean
          module: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          hotel_id?: string
          id?: string
          is_enabled?: boolean
          module?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_modules_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_modules_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      hotel_settings: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "hotel_settings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hotel_settings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      hotels: {
        Row: {
          country: string
          created_at: string
          id: string
          is_active: boolean
          language_default: string
          name: string
          slug: string
          subscription_plan: string
          timezone: string
          updated_at: string
        }
        Insert: {
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          language_default?: string
          name: string
          slug: string
          subscription_plan?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          language_default?: string
          name?: string
          slug?: string
          subscription_plan?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      housekeeping_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          hotel_id: string
          id: string
          performed_by: string
          task_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          hotel_id: string
          id?: string
          performed_by: string
          task_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          hotel_id?: string
          id?: string
          performed_by?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_logs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_logs_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "housekeeping_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "housekeeping_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      housekeeping_tasks: {
        Row: {
          area_id: string | null
          assigned_to: string | null
          checklist_progress: Json | null
          completed_at: string | null
          created_at: string
          estimated_minutes: number | null
          hotel_id: string
          id: string
          inspected_at: string | null
          inspected_by: string | null
          notes: string | null
          paused_reason: string | null
          priority: Database["public"]["Enums"]["hk_priority"]
          room_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["hk_status"]
          task_date: string
          task_type: Database["public"]["Enums"]["hk_task_type"]
          triggered_by_event_id: string | null
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          assigned_to?: string | null
          checklist_progress?: Json | null
          completed_at?: string | null
          created_at?: string
          estimated_minutes?: number | null
          hotel_id: string
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          notes?: string | null
          paused_reason?: string | null
          priority?: Database["public"]["Enums"]["hk_priority"]
          room_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["hk_status"]
          task_date?: string
          task_type?: Database["public"]["Enums"]["hk_task_type"]
          triggered_by_event_id?: string | null
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          assigned_to?: string | null
          checklist_progress?: Json | null
          completed_at?: string | null
          created_at?: string
          estimated_minutes?: number | null
          hotel_id?: string
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          notes?: string | null
          paused_reason?: string | null
          priority?: Database["public"]["Enums"]["hk_priority"]
          room_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["hk_status"]
          task_date?: string
          task_type?: Database["public"]["Enums"]["hk_task_type"]
          triggered_by_event_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_tasks_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "public_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "housekeeping_tasks_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          integration_id: string
          payload: Json | null
          processed_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          integration_id: string
          payload?: Json | null
          processed_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          integration_id?: string
          payload?: Json | null
          processed_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json | null
          created_at: string
          hotel_id: string
          id: string
          last_sync_at: string | null
          provider: string
          status: string | null
          type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          hotel_id: string
          id?: string
          last_sync_at?: string | null
          provider: string
          status?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          hotel_id?: string
          id?: string
          last_sync_at?: string | null
          provider?: string
          status?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integrations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      kitchen_orders: {
        Row: {
          course: string
          created_at: string
          hotel_id: string
          id: string
          items: Json
          notes: string | null
          plan_date: string
          status: string
          table_id: string | null
          table_label: string | null
          updated_at: string
          waiter_id: string | null
        }
        Insert: {
          course: string
          created_at?: string
          hotel_id: string
          id?: string
          items?: Json
          notes?: string | null
          plan_date?: string
          status?: string
          table_id?: string | null
          table_label?: string | null
          updated_at?: string
          waiter_id?: string | null
        }
        Update: {
          course?: string
          created_at?: string
          hotel_id?: string
          id?: string
          items?: Json
          notes?: string | null
          plan_date?: string
          status?: string
          table_id?: string | null
          table_label?: string | null
          updated_at?: string
          waiter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kitchen_orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string
          description: string | null
          hotel_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      lost_found_items: {
        Row: {
          category: string
          claimed_by_guest: string | null
          created_at: string
          description: string
          discarded_at: string | null
          found_by: string
          found_date: string
          hotel_id: string
          id: string
          notes: string | null
          photos: Json | null
          returned_at: string | null
          room_id: string | null
          status: string
          storage_location: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          claimed_by_guest?: string | null
          created_at?: string
          description: string
          discarded_at?: string | null
          found_by: string
          found_date?: string
          hotel_id: string
          id?: string
          notes?: string | null
          photos?: Json | null
          returned_at?: string | null
          room_id?: string | null
          status?: string
          storage_location?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          claimed_by_guest?: string | null
          created_at?: string
          description?: string
          discarded_at?: string | null
          found_by?: string
          found_date?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          photos?: Json | null
          returned_at?: string | null
          room_id?: string | null
          status?: string
          storage_location?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_found_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_found_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "lost_found_items_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          created_at: string
          description: string
          hotel_id: string
          id: string
          photos: Json | null
          priority: Database["public"]["Enums"]["maintenance_priority"]
          reported_by: string
          resolved_at: string | null
          resolved_by: string | null
          room_id: string
          status: Database["public"]["Enums"]["maintenance_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          hotel_id: string
          id?: string
          photos?: Json | null
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          reported_by: string
          resolved_at?: string | null
          resolved_by?: string | null
          room_id: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          hotel_id?: string
          id?: string
          photos?: Json | null
          priority?: Database["public"]["Enums"]["maintenance_priority"]
          reported_by?: string
          resolved_at?: string | null
          resolved_by?: string | null
          room_id?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "maintenance_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          membership_id: string
          role: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          membership_id: string
          role: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          membership_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_roles_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "hotel_members"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergens: string | null
          available_units: number | null
          course: string
          created_at: string
          description: string | null
          hotel_id: string
          id: string
          is_active: boolean
          name: string
          price: number
          product_id: string | null
          reserved_units: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          allergens?: string | null
          available_units?: number | null
          course?: string
          created_at?: string
          description?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          name: string
          price?: number
          product_id?: string | null
          reserved_units?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          allergens?: string | null
          available_units?: number | null
          course?: string
          created_at?: string
          description?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          product_id?: string | null
          reserved_units?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      parser_profiles: {
        Row: {
          config_json: Json
          created_at: string
          hotel_id: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          config_json?: Json
          created_at?: string
          hotel_id: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          config_json?: Json
          created_at?: string
          hotel_id?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parser_profiles_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parser_profiles_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          folio_id: string
          id: string
          method: string
          reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          folio_id: string
          id?: string
          method: string
          reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          folio_id?: string
          id?: string
          method?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          hotel_id: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "product_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          avg_cost: number | null
          barcode: string | null
          category: Database["public"]["Enums"]["beverage_category"]
          category_id: string | null
          container_size: number | null
          container_unit: string | null
          cost_per_unit: number | null
          created_at: string
          hotel_id: string
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          notes: string | null
          subtype: string | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          vendor: string | null
          vendor_id: string | null
        }
        Insert: {
          avg_cost?: number | null
          barcode?: string | null
          category: Database["public"]["Enums"]["beverage_category"]
          category_id?: string | null
          container_size?: number | null
          container_unit?: string | null
          cost_per_unit?: number | null
          created_at?: string
          hotel_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          subtype?: string | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          vendor?: string | null
          vendor_id?: string | null
        }
        Update: {
          avg_cost?: number | null
          barcode?: string | null
          category?: Database["public"]["Enums"]["beverage_category"]
          category_id?: string | null
          container_size?: number | null
          container_unit?: string | null
          cost_per_unit?: number | null
          created_at?: string
          hotel_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          subtype?: string | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          vendor?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_approved: boolean
          last_update_seen: string | null
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_approved?: boolean
          last_update_seen?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_approved?: boolean
          last_update_seen?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      public_areas: {
        Row: {
          area_type: string
          created_at: string
          floor: number | null
          hotel_id: string
          id: string
          is_active: boolean
          name: string
          zone: string | null
        }
        Insert: {
          area_type?: string
          created_at?: string
          floor?: number | null
          hotel_id: string
          id?: string
          is_active?: boolean
          name: string
          zone?: string | null
        }
        Update: {
          area_type?: string
          created_at?: string
          floor?: number | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          name?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_areas_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_areas_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          received_quantity: number | null
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          received_quantity?: number | null
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          received_quantity?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string
          hotel_id: string
          id: string
          notes: string | null
          received_at: string | null
          received_by: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_cost: number | null
          updated_at: string
          vendor_id: string | null
          vendor_name: string | null
          vendor_ref_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          hotel_id: string
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cost?: number | null
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_ref_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          received_at?: string | null
          received_by?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_cost?: number | null
          updated_at?: string
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_ref_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_ref_id_fkey"
            columns: ["vendor_ref_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_log: {
        Row: {
          action: string
          created_at: string
          hotel_id: string
          id: string
          result: Json
          source_record_id: string | null
          triggered_by: string
        }
        Insert: {
          action: string
          created_at?: string
          hotel_id: string
          id?: string
          result?: Json
          source_record_id?: string | null
          triggered_by: string
        }
        Update: {
          action?: string
          created_at?: string
          hotel_id?: string
          id?: string
          result?: Json
          source_record_id?: string | null
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_log_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_log_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      release_announcements: {
        Row: {
          ai_model: string | null
          audience_hotels: string[] | null
          audience_modules: string[] | null
          audience_roles: string[] | null
          audience_type: string
          commit_messages: Json | null
          content: Json
          created_at: string
          created_by: string | null
          filtered_commit_messages: Json | null
          generation_status: string
          id: string
          is_mandatory: boolean
          is_published: boolean
          is_silent: boolean
          published_at: string | null
          raw_release_notes: string | null
          release_fingerprint: string | null
          severity: string
          source: string | null
          summary: string | null
          title: string
          updated_at: string
          user_facing_notes: string | null
          version: string
        }
        Insert: {
          ai_model?: string | null
          audience_hotels?: string[] | null
          audience_modules?: string[] | null
          audience_roles?: string[] | null
          audience_type?: string
          commit_messages?: Json | null
          content?: Json
          created_at?: string
          created_by?: string | null
          filtered_commit_messages?: Json | null
          generation_status?: string
          id?: string
          is_mandatory?: boolean
          is_published?: boolean
          is_silent?: boolean
          published_at?: string | null
          raw_release_notes?: string | null
          release_fingerprint?: string | null
          severity?: string
          source?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          user_facing_notes?: string | null
          version: string
        }
        Update: {
          ai_model?: string | null
          audience_hotels?: string[] | null
          audience_modules?: string[] | null
          audience_roles?: string[] | null
          audience_type?: string
          commit_messages?: Json | null
          content?: Json
          created_at?: string
          created_by?: string | null
          filtered_commit_messages?: Json | null
          generation_status?: string
          id?: string
          is_mandatory?: boolean
          is_published?: boolean
          is_silent?: boolean
          published_at?: string | null
          raw_release_notes?: string | null
          release_fingerprint?: string | null
          severity?: string
          source?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_facing_notes?: string | null
          version?: string
        }
        Relationships: []
      }
      release_metrics: {
        Row: {
          acknowledge_count: number
          created_at: string
          dismiss_count: number
          id: string
          release_id: string
          updated_at: string
          view_count: number
        }
        Insert: {
          acknowledge_count?: number
          created_at?: string
          dismiss_count?: number
          id?: string
          release_id: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          acknowledge_count?: number
          created_at?: string
          dismiss_count?: number
          id?: string
          release_id?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "release_metrics_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: true
            referencedRelation: "release_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      reorder_rules: {
        Row: {
          auto_order: boolean
          created_at: string
          hotel_id: string
          id: string
          is_active: boolean
          location_id: string | null
          min_threshold: number
          product_id: string
          reorder_quantity: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          auto_order?: boolean
          created_at?: string
          hotel_id: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          min_threshold?: number
          product_id: string
          reorder_quantity?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          auto_order?: boolean
          created_at?: string
          hotel_id?: string
          id?: string
          is_active?: boolean
          location_id?: string | null
          min_threshold?: number
          product_id?: string
          reorder_quantity?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reorder_rules_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_rules_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "reorder_rules_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_rules_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_imports: {
        Row: {
          created_at: string
          file_name: string | null
          file_url: string | null
          hotel_id: string
          id: string
          import_date: string
          imported_by: string
          parser_profile_id: string | null
          restaurant_id: string | null
          result_summary: Json
          service_period_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          hotel_id: string
          id?: string
          import_date?: string
          imported_by: string
          parser_profile_id?: string | null
          restaurant_id?: string | null
          result_summary?: Json
          service_period_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          hotel_id?: string
          id?: string
          import_date?: string
          imported_by?: string
          parser_profile_id?: string | null
          restaurant_id?: string | null
          result_summary?: Json
          service_period_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_imports_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_imports_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "reservation_imports_parser_profile_id_fkey"
            columns: ["parser_profile_id"]
            isOneToOne: false
            referencedRelation: "parser_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_imports_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_imports_service_period_id_fkey"
            columns: ["service_period_id"]
            isOneToOne: false
            referencedRelation: "service_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          adults: number
          assigned_by: string | null
          check_in_date: string
          check_out_date: string
          children: number
          created_at: string
          guest_id: string
          hotel_id: string
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          rate_per_night: number | null
          room_id: string
          source: string | null
          special_requests: string | null
          status: Database["public"]["Enums"]["reservation_status"]
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          adults?: number
          assigned_by?: string | null
          check_in_date: string
          check_out_date: string
          children?: number
          created_at?: string
          guest_id: string
          hotel_id: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          rate_per_night?: number | null
          room_id: string
          source?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          adults?: number
          assigned_by?: string | null
          check_in_date?: string
          check_out_date?: string
          children?: number
          created_at?: string
          guest_id?: string
          hotel_id?: string
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          rate_per_night?: number | null
          room_id?: string
          source?: string | null
          special_requests?: string | null
          status?: Database["public"]["Enums"]["reservation_status"]
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_reservations: {
        Row: {
          course: string | null
          created_at: string
          dietary: string | null
          guest_name: string
          hotel_id: string
          id: string
          notes: string | null
          party_size: number
          plan_date: string
          restaurant_id: string | null
          room_number: string | null
          service_period_id: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          course?: string | null
          created_at?: string
          dietary?: string | null
          guest_name?: string
          hotel_id: string
          id?: string
          notes?: string | null
          party_size?: number
          plan_date: string
          restaurant_id?: string | null
          room_number?: string | null
          service_period_id?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          course?: string | null
          created_at?: string
          dietary?: string | null
          guest_name?: string
          hotel_id?: string
          id?: string
          notes?: string | null
          party_size?: number
          plan_date?: string
          restaurant_id?: string | null
          room_number?: string | null
          service_period_id?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "restaurant_reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_reservations_service_period_id_fkey"
            columns: ["service_period_id"]
            isOneToOne: false
            referencedRelation: "service_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          capacity: number
          config: Json
          created_at: string
          description: string | null
          hotel_id: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          capacity?: number
          config?: Json
          created_at?: string
          description?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          capacity?: number
          config?: Json
          created_at?: string
          description?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      room_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          id: string
          released_at: string | null
          room_id: string
          stay_id: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          id?: string
          released_at?: string | null
          room_id: string
          stay_id: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          id?: string
          released_at?: string | null
          room_id?: string
          stay_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assignments_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "stays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_assignments_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["stay_id"]
          },
          {
            foreignKeyName: "room_assignments_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["stay_id"]
          },
        ]
      }
      room_charges: {
        Row: {
          amount: number
          charge_type: Database["public"]["Enums"]["charge_type"]
          charged_by: string | null
          created_at: string
          description: string
          hotel_id: string
          id: string
          reservation_id: string
        }
        Insert: {
          amount?: number
          charge_type?: Database["public"]["Enums"]["charge_type"]
          charged_by?: string | null
          created_at?: string
          description: string
          hotel_id: string
          id?: string
          reservation_id: string
        }
        Update: {
          amount?: number
          charge_type?: Database["public"]["Enums"]["charge_type"]
          charged_by?: string | null
          created_at?: string
          description?: string
          hotel_id?: string
          id?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_charges_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_charges_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_reconciliation_candidates"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["reservation_id"]
          },
        ]
      }
      room_types: {
        Row: {
          amenities: Json
          base_rate: number | null
          created_at: string
          default_capacity: number
          description: string | null
          hotel_id: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          amenities?: Json
          base_rate?: number | null
          created_at?: string
          default_capacity?: number
          description?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amenities?: Json
          base_rate?: number | null
          created_at?: string
          default_capacity?: number
          description?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_types_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: Json | null
          capacity: number
          created_at: string
          floor: number
          hotel_id: string
          id: string
          is_active: boolean
          notes: string | null
          room_number: string
          room_type: Database["public"]["Enums"]["room_type"]
          status: Database["public"]["Enums"]["room_status"]
          updated_at: string
        }
        Insert: {
          amenities?: Json | null
          capacity?: number
          created_at?: string
          floor?: number
          hotel_id: string
          id?: string
          is_active?: boolean
          notes?: string | null
          room_number: string
          room_type?: Database["public"]["Enums"]["room_type"]
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Update: {
          amenities?: Json | null
          capacity?: number
          created_at?: string
          floor?: number
          hotel_id?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          room_number?: string
          room_type?: Database["public"]["Enums"]["room_type"]
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      service_periods: {
        Row: {
          created_at: string
          end_time: string
          hotel_id: string
          id: string
          is_active: boolean
          name: string
          restaurant_id: string | null
          slug: string
          sort_order: number
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string
          hotel_id: string
          id?: string
          is_active?: boolean
          name: string
          restaurant_id?: string | null
          slug: string
          sort_order?: number
          start_time?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          hotel_id?: string
          id?: string
          is_active?: boolean
          name?: string
          restaurant_id?: string | null
          slug?: string
          sort_order?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_periods_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_periods_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "service_periods_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_guests: {
        Row: {
          created_at: string
          guest_id: string
          id: string
          is_primary: boolean | null
          relation: string | null
          stay_id: string
        }
        Insert: {
          created_at?: string
          guest_id: string
          id?: string
          is_primary?: boolean | null
          relation?: string | null
          stay_id: string
        }
        Update: {
          created_at?: string
          guest_id?: string
          id?: string
          is_primary?: boolean | null
          relation?: string | null
          stay_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stay_guests_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_guests_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "stays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_guests_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["stay_id"]
          },
          {
            foreignKeyName: "stay_guests_stay_id_fkey"
            columns: ["stay_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["stay_id"]
          },
        ]
      }
      stays: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          created_by: string | null
          hotel_id: string
          id: string
          notes: string | null
          reservation_id: string | null
          room_id: string
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          created_by?: string | null
          hotel_id: string
          id?: string
          notes?: string | null
          reservation_id?: string | null
          room_id: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          created_by?: string | null
          hotel_id?: string
          id?: string
          notes?: string | null
          reservation_id?: string | null
          room_id?: string
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stays_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stays_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_reconciliation_candidates"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "stays_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_levels: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          last_counted_at: string | null
          last_counted_by: string | null
          location_id: string
          on_hand: number
          par_level: number
          partial_amount: number | null
          product_id: string
          reorder_threshold: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          last_counted_at?: string | null
          last_counted_by?: string | null
          location_id: string
          on_hand?: number
          par_level?: number
          partial_amount?: number | null
          product_id: string
          reorder_threshold?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          last_counted_at?: string | null
          last_counted_by?: string | null
          location_id?: string
          on_hand?: number
          par_level?: number
          partial_amount?: number | null
          product_id?: string
          reorder_threshold?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_levels_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_levels_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "stock_levels_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          location_id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          new_quantity: number
          notes: string | null
          previous_quantity: number
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          location_id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          product_id: string
          quantity: number
          user_id: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          location_id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "stock_movements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      system_notices: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          notice_type: string
          title: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          notice_type?: string
          title: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          notice_type?: string
          title?: string
        }
        Relationships: []
      }
      table_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          position_index: number
          reservation_id: string
          status: string
          table_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          position_index?: number
          reservation_id: string
          status?: string
          table_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          position_index?: number
          reservation_id?: string
          status?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_assignments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "restaurant_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      table_layouts: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          is_default: boolean
          layout_json: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          is_default?: boolean
          layout_json?: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          is_default?: boolean
          layout_json?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_layouts_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_layouts_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      table_order_lines: {
        Row: {
          course: string
          created_at: string
          hotel_id: string
          id: string
          item_id: string
          item_name: string
          order_id: string
          quantity: number
          special_notes: string | null
          status: string
          unit_price: number
        }
        Insert: {
          course: string
          created_at?: string
          hotel_id: string
          id?: string
          item_id: string
          item_name: string
          order_id: string
          quantity?: number
          special_notes?: string | null
          status?: string
          unit_price?: number
        }
        Update: {
          course?: string
          created_at?: string
          hotel_id?: string
          id?: string
          item_id?: string
          item_name?: string
          order_id?: string
          quantity?: number
          special_notes?: string | null
          status?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "table_order_lines_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_order_lines_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "table_order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "table_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      table_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          folio_id: string | null
          hotel_id: string
          id: string
          notes: string | null
          opened_at: string
          plan_date: string
          status: string
          submitted_at: string | null
          table_id: string
          table_label: string | null
          updated_at: string
          waiter_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          folio_id?: string | null
          hotel_id: string
          id?: string
          notes?: string | null
          opened_at?: string
          plan_date?: string
          status?: string
          submitted_at?: string | null
          table_id: string
          table_label?: string | null
          updated_at?: string
          waiter_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          folio_id?: string | null
          hotel_id?: string
          id?: string
          notes?: string | null
          opened_at?: string
          plan_date?: string
          status?: string
          submitted_at?: string | null
          table_id?: string
          table_label?: string | null
          updated_at?: string
          waiter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      table_plan_changes: {
        Row: {
          change_data: Json
          change_type: string
          created_at: string
          hotel_id: string
          id: string
          plan_date: string
          previous_data: Json | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          table_id: string
        }
        Insert: {
          change_data?: Json
          change_type: string
          created_at?: string
          hotel_id: string
          id?: string
          plan_date: string
          previous_data?: Json | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          table_id: string
        }
        Update: {
          change_data?: Json
          change_type?: string
          created_at?: string
          hotel_id?: string
          id?: string
          plan_date?: string
          previous_data?: Json | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_plan_changes_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_plan_changes_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      table_plans: {
        Row: {
          assignments_json: Json
          created_at: string
          created_by: string
          hotel_id: string
          id: string
          name: string
          plan_date: string
          updated_at: string
        }
        Insert: {
          assignments_json?: Json
          created_at?: string
          created_by: string
          hotel_id: string
          id?: string
          name?: string
          plan_date: string
          updated_at?: string
        }
        Update: {
          assignments_json?: Json
          created_at?: string
          created_by?: string
          hotel_id?: string
          id?: string
          name?: string
          plan_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_plans_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_plans_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      user_departments: {
        Row: {
          created_at: string
          department: Database["public"]["Enums"]["department"]
          department_role: Database["public"]["Enums"]["department_role"]
          hotel_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: Database["public"]["Enums"]["department"]
          department_role?: Database["public"]["Enums"]["department_role"]
          hotel_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: Database["public"]["Enums"]["department"]
          department_role?: Database["public"]["Enums"]["department_role"]
          hotel_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_departments_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_departments_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      user_release_reads: {
        Row: {
          acknowledged_at: string | null
          dismissed_at: string | null
          id: string
          read_at: string
          release_id: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          dismissed_at?: string | null
          id?: string
          read_at?: string
          release_id: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          dismissed_at?: string | null
          id?: string
          read_at?: string
          release_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_release_reads_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "release_announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          hotel_id: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          hotel_id: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          hotel_id?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
    }
    Views: {
      v_daily_occupancy: {
        Row: {
          date: string | null
          hotel_id: string | null
          reservation_count: number | null
          rooms_occupied: number | null
          total_adults: number | null
          total_children: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      v_duplicate_folio_mirrors: {
        Row: {
          folio_count: number | null
          folio_ids: string[] | null
          hotel_id: string | null
          reservation_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folios_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folios_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_reconciliation_candidates"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "folios_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["reservation_id"]
          },
        ]
      }
      v_duplicate_stay_mirrors: {
        Row: {
          hotel_id: string | null
          reservation_id: string | null
          stay_count: number | null
          stay_ids: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "stays_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stays_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_reconciliation_candidates"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["reservation_id"]
          },
        ]
      }
      v_dw_failure_groups: {
        Row: {
          affected_records: string[] | null
          domain: string | null
          error_code: string | null
          error_signature: string | null
          first_seen: string | null
          hotel_id: string | null
          last_seen: string | null
          occurrence_count: number | null
          operation: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dual_write_failures_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dual_write_failures_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      v_dw_failure_hotspots: {
        Row: {
          domain: string | null
          failures_24h: number | null
          failures_7d: number | null
          failures_total: number | null
          hotel_id: string | null
          last_failure_at: string | null
          operation: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dual_write_failures_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dual_write_failures_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      v_dw_failures_by_hotel: {
        Row: {
          hotel_id: string | null
          hotel_name: string | null
          newest_failure: string | null
          oldest_failure: string | null
          unresolved_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dual_write_failures_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dual_write_failures_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      v_folio_parity: {
        Row: {
          amount_drift: number | null
          charge_amount: number | null
          charge_created_at: string | null
          charge_description: string | null
          charge_id: string | null
          charge_type: Database["public"]["Enums"]["charge_type"] | null
          folio_amount: number | null
          folio_id: string | null
          folio_item_id: string | null
          hotel_id: string | null
          parity_status: string | null
          reservation_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folio_items_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_charges_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_charges_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_reconciliation_candidates"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["reservation_id"]
          },
        ]
      }
      v_migration_health: {
        Row: {
          ai_failed_jobs_7d: number | null
          evaluated_at: string | null
          folio_amount_mismatches: number | null
          folio_matched: number | null
          folio_missing: number | null
          folio_parity_pct: number | null
          folio_total_primary: number | null
          hotel_id: string | null
          hotel_name: string | null
          integration_failed_7d: number | null
          last_failure_at: string | null
          recommendation: string | null
          stay_matched: number | null
          stay_mismatched: number | null
          stay_missing: number | null
          stay_parity_pct: number | null
          stay_total_primary: number | null
          unresolved_dw_failures: number | null
        }
        Relationships: []
      }
      v_parity_summary: {
        Row: {
          evaluated_at: string | null
          folio_amount_mismatch_count: number | null
          folio_matched: number | null
          folio_missing_count: number | null
          folio_total_primary: number | null
          hotel_id: string | null
          stay_matched: number | null
          stay_mismatch_count: number | null
          stay_missing_count: number | null
          stay_total_primary: number | null
        }
        Relationships: []
      }
      v_recent_folio_drift: {
        Row: {
          amount_drift: number | null
          charge_amount: number | null
          charge_created_at: string | null
          charge_description: string | null
          charge_id: string | null
          charge_type: Database["public"]["Enums"]["charge_type"] | null
          folio_amount: number | null
          folio_id: string | null
          folio_item_id: string | null
          hotel_id: string | null
          parity_status: string | null
          reservation_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folio_items_folio_id_fkey"
            columns: ["folio_id"]
            isOneToOne: false
            referencedRelation: "folios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_charges_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_charges_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_reconciliation_candidates"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["reservation_id"]
          },
        ]
      }
      v_recent_stay_drift: {
        Row: {
          hotel_id: string | null
          parity_status: string | null
          reservation_check_in: string | null
          reservation_check_out: string | null
          reservation_id: string | null
          reservation_room_id: string | null
          reservation_status:
            | Database["public"]["Enums"]["reservation_status"]
            | null
          reservation_updated_at: string | null
          stay_check_in: string | null
          stay_check_out: string | null
          stay_id: string | null
          stay_room_id: string | null
          stay_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["reservation_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stays_room_id_fkey"
            columns: ["stay_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      v_reconciliation_candidates: {
        Row: {
          charge_count: number | null
          charges_total: number | null
          check_in_date: string | null
          check_out_date: string | null
          folio_item_count: number | null
          folio_items_total: number | null
          folio_status: string | null
          hotel_id: string | null
          hotel_name: string | null
          reservation_id: string | null
          reservation_status:
            | Database["public"]["Enums"]["reservation_status"]
            | null
          stay_status: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      v_revenue_summary: {
        Row: {
          charge_count: number | null
          charge_type: Database["public"]["Enums"]["charge_type"] | null
          date: string | null
          hotel_id: string | null
          total_amount: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_charges_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_charges_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
        ]
      }
      v_stay_duplicates: {
        Row: {
          hotel_id: string | null
          reservation_id: string | null
          stay_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stays_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stays_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_recent_stay_drift"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_reconciliation_candidates"
            referencedColumns: ["reservation_id"]
          },
          {
            foreignKeyName: "stays_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "v_stay_parity"
            referencedColumns: ["reservation_id"]
          },
        ]
      }
      v_stay_parity: {
        Row: {
          hotel_id: string | null
          parity_status: string | null
          reservation_check_in: string | null
          reservation_check_out: string | null
          reservation_id: string | null
          reservation_room_id: string | null
          reservation_status:
            | Database["public"]["Enums"]["reservation_status"]
            | null
          reservation_updated_at: string | null
          stay_check_in: string | null
          stay_check_out: string | null
          stay_id: string | null
          stay_room_id: string | null
          stay_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "v_migration_health"
            referencedColumns: ["hotel_id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["reservation_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stays_room_id_fkey"
            columns: ["stay_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_department: {
        Args: {
          _department: Database["public"]["Enums"]["department"]
          _user_id: string
        }
        Returns: boolean
      }
      has_hotel_department: {
        Args: {
          _department: Database["public"]["Enums"]["department"]
          _hotel_id: string
          _user_id: string
        }
        Returns: boolean
      }
      has_hotel_module: {
        Args: { _hotel_id: string; _module: string }
        Returns: boolean
      }
      has_hotel_role: {
        Args: {
          _hotel_id: string
          _role: Database["public"]["Enums"]["hotel_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_membership_role: {
        Args: { _membership_id: string; _role: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_authenticated: { Args: never; Returns: boolean }
      is_department_manager: {
        Args: {
          _department: Database["public"]["Enums"]["department"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hotel_admin_or_manager: {
        Args: { _hotel_id: string; _user_id: string }
        Returns: boolean
      }
      is_hotel_dept_manager: {
        Args: {
          _department: Database["public"]["Enums"]["department"]
          _hotel_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_hotel_member: {
        Args: { _hotel_id: string; _user_id: string }
        Returns: boolean
      }
      is_manager_or_admin: { Args: never; Returns: boolean }
      reconcile_folio_from_charges: {
        Args: { _reservation_id: string }
        Returns: Json
      }
      reconcile_stay_from_reservation: {
        Args: { _reservation_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "staff"
      beverage_category:
        | "wine"
        | "beer"
        | "spirits"
        | "coffee"
        | "soda"
        | "syrup"
      charge_type: "room" | "minibar" | "restaurant" | "laundry" | "other"
      department: "reception" | "housekeeping" | "restaurant"
      department_role: "manager" | "receptionist" | "hk_worker" | "staff"
      hk_priority: "normal" | "urgent" | "vip"
      hk_status: "dirty" | "in_progress" | "clean" | "inspected" | "paused"
      hk_task_type:
        | "checkout_clean"
        | "stay_over"
        | "deep_clean"
        | "turndown"
        | "public_area"
        | "post_maintenance"
        | "linen_delivery"
        | "minibar_restock"
        | "amenity_setup"
        | "vip_setup"
      hotel_role: "hotel_admin" | "manager" | "staff"
      maintenance_priority: "low" | "medium" | "high" | "critical"
      maintenance_status: "open" | "in_progress" | "resolved"
      movement_type:
        | "adjustment"
        | "receiving"
        | "transfer"
        | "wastage"
        | "breakage"
        | "pos_sale"
        | "count"
      order_status: "draft" | "sent" | "received" | "cancelled"
      payment_status: "pending" | "partial" | "paid" | "refunded"
      reservation_status:
        | "confirmed"
        | "checked_in"
        | "checked_out"
        | "cancelled"
        | "no_show"
      room_status:
        | "available"
        | "occupied"
        | "checkout"
        | "maintenance"
        | "reserved"
      room_type: "single" | "double" | "twin" | "suite" | "family"
      unit_type: "count" | "liters" | "grams" | "ml" | "kg"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "staff"],
      beverage_category: ["wine", "beer", "spirits", "coffee", "soda", "syrup"],
      charge_type: ["room", "minibar", "restaurant", "laundry", "other"],
      department: ["reception", "housekeeping", "restaurant"],
      department_role: ["manager", "receptionist", "hk_worker", "staff"],
      hk_priority: ["normal", "urgent", "vip"],
      hk_status: ["dirty", "in_progress", "clean", "inspected", "paused"],
      hk_task_type: [
        "checkout_clean",
        "stay_over",
        "deep_clean",
        "turndown",
        "public_area",
        "post_maintenance",
        "linen_delivery",
        "minibar_restock",
        "amenity_setup",
        "vip_setup",
      ],
      hotel_role: ["hotel_admin", "manager", "staff"],
      maintenance_priority: ["low", "medium", "high", "critical"],
      maintenance_status: ["open", "in_progress", "resolved"],
      movement_type: [
        "adjustment",
        "receiving",
        "transfer",
        "wastage",
        "breakage",
        "pos_sale",
        "count",
      ],
      order_status: ["draft", "sent", "received", "cancelled"],
      payment_status: ["pending", "partial", "paid", "refunded"],
      reservation_status: [
        "confirmed",
        "checked_in",
        "checked_out",
        "cancelled",
        "no_show",
      ],
      room_status: [
        "available",
        "occupied",
        "checkout",
        "maintenance",
        "reserved",
      ],
      room_type: ["single", "double", "twin", "suite", "family"],
      unit_type: ["count", "liters", "grams", "ml", "kg"],
    },
  },
} as const
