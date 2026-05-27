export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null;
          id: string;
          name_en: string;
          name_fr: string | null;
          restaurant_id: string | null;
          sort_order: number | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name_en: string;
          name_fr?: string | null;
          restaurant_id?: string | null;
          sort_order?: number | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name_en?: string;
          name_fr?: string | null;
          restaurant_id?: string | null;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      daily_specials: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          restaurant_id: string | null;
          title: string;
          valid_date: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          restaurant_id?: string | null;
          title: string;
          valid_date?: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          restaurant_id?: string | null;
          title?: string;
          valid_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "daily_specials_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_items: {
        Row: {
          category_id: string | null;
          created_at: string | null;
          customization_options: Json | null;
          description_en: string | null;
          description_fr: string | null;
          id: string;
          image_url: string;
          is_available: boolean | null;
          is_starter: boolean | null;
          name_en: string;
          name_fr: string | null;
          price: number;
          restaurant_id: string | null;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string | null;
          customization_options?: Json | null;
          description_en?: string | null;
          description_fr?: string | null;
          id?: string;
          image_url: string;
          is_available?: boolean | null;
          is_starter?: boolean | null;
          name_en: string;
          name_fr?: string | null;
          price: number;
          restaurant_id?: string | null;
        };
        Update: {
          category_id?: string | null;
          created_at?: string | null;
          customization_options?: Json | null;
          description_en?: string | null;
          description_fr?: string | null;
          id?: string;
          image_url?: string;
          is_available?: boolean | null;
          is_starter?: boolean | null;
          name_en?: string;
          name_fr?: string | null;
          price?: number;
          restaurant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      novanode_admins: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          created_at: string | null;
          customer_name: string | null;
          customer_whatsapp: string | null;
          id: string;
          is_starter_order: boolean | null;
          items: Json;
          restaurant_id: string | null;
          session_token: string | null;
          status: string | null;
          table_number: string;
          total_amount: number;
          estimated_minutes?: number | null;
          preparation_started_at?: string | null;
        };
        Insert: {
          created_at?: string | null;
          customer_name?: string | null;
          customer_whatsapp?: string | null;
          id?: string;
          is_starter_order?: boolean | null;
          items: Json;
          restaurant_id?: string | null;
          session_token?: string | null;
          status?: string | null;
          table_number: string;
          total_amount: number;
          estimated_minutes?: number | null;
          preparation_started_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          customer_name?: string | null;
          customer_whatsapp?: string | null;
          id?: string;
          is_starter_order?: boolean | null;
          items?: Json;
          restaurant_id?: string | null;
          session_token?: string | null;
          status?: string | null;
          table_number?: string;
          total_amount?: number;
          estimated_minutes?: number | null;
          preparation_started_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      qr_codes: {
        Row: {
          created_at: string | null;
          id: string;
          qr_url: string;
          restaurant_id: string | null;
          table_number: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          qr_url: string;
          restaurant_id?: string | null;
          table_number: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          qr_url?: string;
          restaurant_id?: string | null;
          table_number?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qr_codes_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurant_staff: {
        Row: {
          created_at: string | null;
          id: string;
          restaurant_id: string | null;
          role: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          restaurant_id?: string | null;
          role?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          restaurant_id?: string | null;
          role?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_staff_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurants: {
        Row: {
          created_at: string | null;
          currency: string | null;
          id: string;
          is_active: boolean | null;
          logo_url: string | null;
          name: string;
          slug: string;
          suspended_at: string | null;
          suspended_by: string | null;
          suspension_reason: string | null;
          whatsapp_api_key: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name: string;
          slug: string;
          suspended_at?: string | null;
          suspended_by?: string | null;
          suspension_reason?: string | null;
          whatsapp_api_key?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          is_active?: boolean | null;
          logo_url?: string | null;
          name?: string;
          slug?: string;
          suspended_at?: string | null;
          suspended_by?: string | null;
          suspension_reason?: string | null;
          whatsapp_api_key?: string | null;
        };
        Relationships: [];
      };
      table_sessions: {
        Row: {
          id: string;
          restaurant_id: string | null;
          table_number: string;
          customer_name: string;
          session_token: string;
          is_active: boolean | null;
          browser_fingerprint: string | null;
          last_seen_at: string | null;
          bill_status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id?: string | null;
          table_number: string;
          customer_name: string;
          session_token: string;
          is_active?: boolean | null;
          browser_fingerprint?: string | null;
          last_seen_at?: string | null;
          bill_status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string | null;
          table_number?: string;
          customer_name?: string;
          session_token?: string;
          is_active?: boolean | null;
          browser_fingerprint?: string | null;
          last_seen_at?: string | null;
          bill_status?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "table_sessions_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };

      
      waiter_signals: {
        Row: {
          id: string;
          restaurant_id: string | null;
          table_number: string;
          customer_name: string | null;
          signal_type: string;
          is_resolved: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id?: string | null;
          table_number: string;
          customer_name?: string | null;
          signal_type: string;
          is_resolved?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string | null;
          table_number?: string;
          customer_name?: string | null;
          signal_type?: string;
          is_resolved?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "waiter_signals_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

// ── VIEW TYPES ──
export interface RestaurantStats {
  restaurant_id: string;
  restaurant_name: string;
  slug: string;
  order_date: string | null;
  order_week: string | null;
  order_month: string | null;
  total_orders: number | null;
  tables_served: number | null;
  unique_sessions: number | null;
  gross_revenue: number | null;
  total_platform_fees: number | null;
  net_revenue: number | null;
  avg_order_value: number | null;
  completed_orders: number | null;
  cancelled_orders: number | null;
  pending_orders: number | null;
}

export interface MenuItemStats {
  restaurant_id: string;
  restaurant_name: string;
  item_id: string;
  item_name: string;
  price: number;
  category_name: string | null;
  order_date: string | null;
  order_month: string | null;
  times_ordered: number | null;
  total_quantity: number | null;
  total_revenue: number | null;
}

export interface PeakHourStats {
  restaurant_id: string;
  hour_of_day: number | null;
  day_of_week: string | null;
  order_count: number | null;
  revenue: number | null;
}
