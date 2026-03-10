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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
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
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          hotel_id: string
          id: string
          inspected_at: string | null
          inspected_by: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["hk_priority"]
          room_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["hk_status"]
          task_date: string
          task_type: Database["public"]["Enums"]["hk_task_type"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          hotel_id: string
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["hk_priority"]
          room_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["hk_status"]
          task_date?: string
          task_type?: Database["public"]["Enums"]["hk_task_type"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          hotel_id?: string
          id?: string
          inspected_at?: string | null
          inspected_by?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["hk_priority"]
          room_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["hk_status"]
          task_date?: string
          task_type?: Database["public"]["Enums"]["hk_task_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_tasks_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
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
        }
        Insert: {
          avg_cost?: number | null
          barcode?: string | null
          category: Database["public"]["Enums"]["beverage_category"]
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
        }
        Update: {
          avg_cost?: number | null
          barcode?: string | null
          category?: Database["public"]["Enums"]["beverage_category"]
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
        }
        Relationships: [
          {
            foreignKeyName: "products_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
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
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
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
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
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
            foreignKeyName: "service_periods_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
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
        ]
      }
    }
    Views: {
      [_ in never]: never
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
      hk_status: "dirty" | "in_progress" | "clean" | "inspected"
      hk_task_type: "checkout_clean" | "stay_over" | "deep_clean" | "turndown"
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
      hk_status: ["dirty", "in_progress", "clean", "inspected"],
      hk_task_type: ["checkout_clean", "stay_over", "deep_clean", "turndown"],
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
