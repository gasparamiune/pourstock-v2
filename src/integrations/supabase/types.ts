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
      guests: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
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
          id?: string
          last_name?: string
          nationality?: string | null
          notes?: string | null
          passport_number?: string | null
          phone?: string | null
          updated_at?: string
          visit_count?: number
        }
        Relationships: []
      }
      housekeeping_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          performed_by: string
          task_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          performed_by: string
          task_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          performed_by?: string
          task_id?: string
        }
        Relationships: [
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
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_requests: {
        Row: {
          created_at: string
          description: string
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
            foreignKeyName: "maintenance_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
        Relationships: []
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
        Relationships: []
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
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
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
          id: string
          reservation_id: string
        }
        Insert: {
          amount?: number
          charge_type?: Database["public"]["Enums"]["charge_type"]
          charged_by?: string | null
          created_at?: string
          description: string
          id?: string
          reservation_id: string
        }
        Update: {
          amount?: number
          charge_type?: Database["public"]["Enums"]["charge_type"]
          charged_by?: string | null
          created_at?: string
          description?: string
          id?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_charges_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
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
          id?: string
          is_active?: boolean
          notes?: string | null
          room_number?: string
          room_type?: Database["public"]["Enums"]["room_type"]
          status?: Database["public"]["Enums"]["room_status"]
          updated_at?: string
        }
        Relationships: []
      }
      stock_levels: {
        Row: {
          created_at: string
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
      table_plan_changes: {
        Row: {
          change_data: Json
          change_type: string
          created_at: string
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
          id?: string
          plan_date?: string
          previous_data?: Json | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          table_id?: string
        }
        Relationships: []
      }
      table_plans: {
        Row: {
          assignments_json: Json
          created_at: string
          created_by: string
          id: string
          name: string
          plan_date: string
          updated_at: string
        }
        Insert: {
          assignments_json?: Json
          created_at?: string
          created_by: string
          id?: string
          name?: string
          plan_date: string
          updated_at?: string
        }
        Update: {
          assignments_json?: Json
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          plan_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_departments: {
        Row: {
          created_at: string
          department: Database["public"]["Enums"]["department"]
          department_role: Database["public"]["Enums"]["department_role"]
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: Database["public"]["Enums"]["department"]
          department_role?: Database["public"]["Enums"]["department_role"]
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: Database["public"]["Enums"]["department"]
          department_role?: Database["public"]["Enums"]["department_role"]
          id?: string
          user_id?: string
        }
        Relationships: []
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
