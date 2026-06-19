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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          id: string
          name_en: string
          name_fr: string | null
          restaurant_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name_en: string
          name_fr?: string | null
          restaurant_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name_en?: string
          name_fr?: string | null
          restaurant_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_invoices: {
        Row: {
          created_at: string | null
          id: string
          invoice_date: string
          paid_at: string | null
          paystack_access_code: string | null
          paystack_reference: string | null
          restaurant_id: string | null
          status: string
          total_fees: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_date: string
          paid_at?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          restaurant_id?: string | null
          status?: string
          total_fees?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_date?: string
          paid_at?: string | null
          paystack_access_code?: string | null
          paystack_reference?: string | null
          restaurant_id?: string | null
          status?: string
          total_fees?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_invoices_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "daily_invoices_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "daily_invoices_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_ledger: {
        Row: {
          completed_sessions: number | null
          created_at: string | null
          id: string
          is_paid: boolean | null
          ledger_date: string
          paid_amount: number | null
          paid_at: string | null
          paystack_reference: string | null
          platform_fees_owed: number | null
          platform_fees_paid: number | null
          restaurant_id: string | null
          session_fee: number
          session_fees_collected: number | null
          total_owed: number | null
        }
        Insert: {
          completed_sessions?: number | null
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          ledger_date?: string
          paid_amount?: number | null
          paid_at?: string | null
          paystack_reference?: string | null
          platform_fees_owed?: number | null
          platform_fees_paid?: number | null
          restaurant_id?: string | null
          session_fee: number
          session_fees_collected?: number | null
          total_owed?: number | null
        }
        Update: {
          completed_sessions?: number | null
          created_at?: string | null
          id?: string
          is_paid?: boolean | null
          ledger_date?: string
          paid_amount?: number | null
          paid_at?: string | null
          paystack_reference?: string | null
          platform_fees_owed?: number | null
          platform_fees_paid?: number | null
          restaurant_id?: string | null
          session_fee?: number
          session_fees_collected?: number | null
          total_owed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_ledger_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "daily_ledger_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "daily_ledger_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_specials: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          restaurant_id: string | null
          title: string
          valid_date: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          restaurant_id?: string | null
          title: string
          valid_date?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          restaurant_id?: string | null
          title?: string
          valid_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_specials_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "daily_specials_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "daily_specials_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string | null
          customization_options: Json | null
          description_en: string | null
          description_fr: string | null
          id: string
          image_url: string
          is_available: boolean | null
          is_starter: boolean | null
          name_en: string
          name_fr: string | null
          price: number
          restaurant_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          customization_options?: Json | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_url: string
          is_available?: boolean | null
          is_starter?: boolean | null
          name_en: string
          name_fr?: string | null
          price: number
          restaurant_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          customization_options?: Json | null
          description_en?: string | null
          description_fr?: string | null
          id?: string
          image_url?: string
          is_available?: boolean | null
          is_starter?: boolean | null
          name_en?: string
          name_fr?: string | null
          price?: number
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      novanode_admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      order_feedback: {
        Row: {
          created_at: string | null
          customer_name: string | null
          id: string
          rating: number | null
          restaurant_id: string | null
          review: string | null
          session_token: string
          staff_id: string | null
          table_number: string
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          id?: string
          rating?: number | null
          restaurant_id?: string | null
          review?: string | null
          session_token: string
          staff_id?: string | null
          table_number: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          id?: string
          rating?: number | null
          restaurant_id?: string | null
          review?: string | null
          session_token?: string
          staff_id?: string | null
          table_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_feedback_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "order_feedback_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "order_feedback_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_feedback_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "restaurant_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_name: string | null
          customer_whatsapp: string | null
          estimated_minutes: number | null
          fee_percentage: number | null
          id: string
          is_starter_order: boolean | null
          items: Json
          platform_fee: number | null
          preparation_started_at: string | null
          restaurant_id: string | null
          session_token: string | null
          status: string | null
          table_number: string
          total_amount: number
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          customer_whatsapp?: string | null
          estimated_minutes?: number | null
          fee_percentage?: number | null
          id?: string
          is_starter_order?: boolean | null
          items: Json
          platform_fee?: number | null
          preparation_started_at?: string | null
          restaurant_id?: string | null
          session_token?: string | null
          status?: string | null
          table_number: string
          total_amount: number
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          customer_whatsapp?: string | null
          estimated_minutes?: number | null
          fee_percentage?: number | null
          id?: string
          is_starter_order?: boolean | null
          items?: Json
          platform_fee?: number | null
          preparation_started_at?: string | null
          restaurant_id?: string | null
          session_token?: string | null
          status?: string | null
          table_number?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_billing: {
        Row: {
          billing_date: string
          billing_month: string
          billing_week: string
          created_at: string | null
          fee_percentage: number
          id: string
          is_paid: boolean | null
          order_amount: number
          order_id: string | null
          platform_fee: number
          restaurant_id: string | null
        }
        Insert: {
          billing_date?: string
          billing_month: string
          billing_week: string
          created_at?: string | null
          fee_percentage?: number
          id?: string
          is_paid?: boolean | null
          order_amount: number
          order_id?: string | null
          platform_fee: number
          restaurant_id?: string | null
        }
        Update: {
          billing_date?: string
          billing_month?: string
          billing_week?: string
          created_at?: string | null
          fee_percentage?: number
          id?: string
          is_paid?: boolean | null
          order_amount?: number
          order_id?: string | null
          platform_fee?: number
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_billing_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_billing_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "platform_billing_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "platform_billing_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          created_at: string | null
          id: string
          qr_url: string
          restaurant_id: string | null
          table_number: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          qr_url: string
          restaurant_id?: string | null
          table_number: string
        }
        Update: {
          created_at?: string | null
          id?: string
          qr_url?: string
          restaurant_id?: string | null
          table_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "qr_codes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "qr_codes_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          customer_name: string | null
          generated_at: string | null
          id: string
          items_breakdown: Json
          restaurant_id: string | null
          session_fee: number
          session_token: string
          subtotal: number
          table_number: string
          total: number
        }
        Insert: {
          customer_name?: string | null
          generated_at?: string | null
          id?: string
          items_breakdown: Json
          restaurant_id?: string | null
          session_fee?: number
          session_token: string
          subtotal: number
          table_number: string
          total: number
        }
        Update: {
          customer_name?: string | null
          generated_at?: string | null
          id?: string
          items_breakdown?: Json
          restaurant_id?: string | null
          session_fee?: number
          session_token?: string
          subtotal?: number
          table_number?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "receipts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "receipts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_promos: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          image_url: string | null
          is_active: boolean | null
          restaurant_id: string | null
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          restaurant_id?: string | null
          start_date: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          restaurant_id?: string | null
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_promos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_promos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_promos_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_staff: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          created_at: string | null
          display_name: string | null
          id: string
          restaurant_id: string | null
          role: string | null
          total_ratings: number | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          restaurant_id?: string | null
          role?: string | null
          total_ratings?: number | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          restaurant_id?: string | null
          role?: string | null
          total_ratings?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_staff_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_staff_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "restaurant_staff_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          closing_time: string | null
          contact_number: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_suspended: boolean | null
          logo_url: string | null
          name: string
          opening_time: string | null
          owing_funds: number | null
          payment_overdue: boolean | null
          paystack_subaccount_code: string | null
          session_fee: number | null
          slug: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          whatsapp_api_key: string | null
        }
        Insert: {
          address?: string | null
          closing_time?: string | null
          contact_number?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_suspended?: boolean | null
          logo_url?: string | null
          name: string
          opening_time?: string | null
          owing_funds?: number | null
          payment_overdue?: boolean | null
          paystack_subaccount_code?: string | null
          session_fee?: number | null
          slug: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          whatsapp_api_key?: string | null
        }
        Update: {
          address?: string | null
          closing_time?: string | null
          contact_number?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_suspended?: boolean | null
          logo_url?: string | null
          name?: string
          opening_time?: string | null
          owing_funds?: number | null
          payment_overdue?: boolean | null
          paystack_subaccount_code?: string | null
          session_fee?: number | null
          slug?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          whatsapp_api_key?: string | null
        }
        Relationships: []
      }
      table_sessions: {
        Row: {
          bill_status: string | null
          browser_fingerprint: string | null
          closed_at: string | null
          created_at: string | null
          customer_name: string
          id: string
          is_active: boolean | null
          last_seen_at: string | null
          opened_at: string | null
          restaurant_id: string | null
          session_fee_applied: number | null
          session_token: string
          status: string | null
          table_number: string
        }
        Insert: {
          bill_status?: string | null
          browser_fingerprint?: string | null
          closed_at?: string | null
          created_at?: string | null
          customer_name: string
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          opened_at?: string | null
          restaurant_id?: string | null
          session_fee_applied?: number | null
          session_token: string
          status?: string | null
          table_number: string
        }
        Update: {
          bill_status?: string | null
          browser_fingerprint?: string | null
          closed_at?: string | null
          created_at?: string | null
          customer_name?: string
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          opened_at?: string | null
          restaurant_id?: string | null
          session_fee_applied?: number | null
          session_token?: string
          status?: string | null
          table_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "table_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "table_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      table_turnover: {
        Row: {
          cleared_at: string | null
          created_at: string | null
          id: string
          order_count: number | null
          restaurant_id: string | null
          seated_at: string
          session_token: string
          table_number: string
          total_spent: number | null
        }
        Insert: {
          cleared_at?: string | null
          created_at?: string | null
          id?: string
          order_count?: number | null
          restaurant_id?: string | null
          seated_at: string
          session_token: string
          table_number: string
          total_spent?: number | null
        }
        Update: {
          cleared_at?: string | null
          created_at?: string | null
          id?: string
          order_count?: number | null
          restaurant_id?: string | null
          seated_at?: string
          session_token?: string
          table_number?: string
          total_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "table_turnover_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "table_turnover_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "table_turnover_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_acceptance: {
        Row: {
          accepted_at: string | null
          id: string
          ip_hash: string | null
          session_token: string | null
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          ip_hash?: string | null
          session_token?: string | null
        }
        Update: {
          accepted_at?: string | null
          id?: string
          ip_hash?: string | null
          session_token?: string | null
        }
        Relationships: []
      }
      waiter_signals: {
        Row: {
          created_at: string | null
          customer_name: string | null
          id: string
          is_resolved: boolean | null
          restaurant_id: string | null
          signal_type: string
          table_number: string
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          id?: string
          is_resolved?: boolean | null
          restaurant_id?: string | null
          signal_type: string
          table_number: string
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          id?: string
          is_resolved?: boolean | null
          restaurant_id?: string | null
          signal_type?: string
          table_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "waiter_signals_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "waiter_signals_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "waiter_signals_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      menu_item_stats: {
        Row: {
          category_name: string | null
          item_id: string | null
          item_name: string | null
          order_date: string | null
          order_month: string | null
          price: number | null
          restaurant_id: string | null
          restaurant_name: string | null
          times_ordered: number | null
          total_quantity: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      peak_hours_stats: {
        Row: {
          day_of_week: string | null
          hour_of_day: number | null
          order_count: number | null
          restaurant_id: string | null
          revenue: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "menu_item_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurant_stats"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_stats: {
        Row: {
          avg_order_value: number | null
          cancelled_orders: number | null
          completed_orders: number | null
          gross_revenue: number | null
          net_revenue: number | null
          order_date: string | null
          order_month: string | null
          order_week: string | null
          pending_orders: number | null
          restaurant_id: string | null
          restaurant_name: string | null
          slug: string | null
          tables_served: number | null
          total_orders: number | null
          total_platform_fees: number | null
          unique_sessions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      increment_daily_ledger: {
        Args: {
          p_platform_fee: number
          p_restaurant_id: string
          p_session_fee: number
        }
        Returns: undefined
      }
      increment_owing_funds: {
        Args: { p_amount: number; p_restaurant_id: string }
        Returns: undefined
      }
      is_novanode_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
