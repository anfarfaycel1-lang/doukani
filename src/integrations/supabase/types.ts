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
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          source: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          source?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_cost: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          unit_cost?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city: string | null
          cod_risk_score: number
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          shipping_address: string | null
          shipping_company: string | null
          shipping_fee: number
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          total: number
          total_cost: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          cod_risk_score?: number
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shipping_address?: string | null
          shipping_company?: string | null
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal?: number
          total?: number
          total_cost?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          cod_risk_score?: number
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shipping_address?: string | null
          shipping_company?: string | null
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          total?: number
          total_cost?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "store_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ads: {
        Row: {
          created_at: string
          description_ar: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          placement: string
          starts_at: string | null
          target_url: string | null
          title_ar: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          placement?: string
          starts_at?: string | null
          target_url?: string | null
          title_ar: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          placement?: string
          starts_at?: string | null
          target_url?: string | null
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_content: {
        Row: {
          body_ar: string
          data: Json
          key: string
          title_ar: string
          updated_at: string
        }
        Insert: {
          body_ar: string
          data?: Json
          key: string
          title_ar: string
          updated_at?: string
        }
        Update: {
          body_ar?: string
          data?: Json
          key?: string
          title_ar?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost: number
          created_at: string
          description: string | null
          id: string
          images: string[]
          is_active: boolean
          is_featured: boolean
          low_stock_threshold: number
          name: string
          price: number
          stock: number
          store_id: string
          updated_at: string
          variants: Json
        }
        Insert: {
          category_id?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          low_stock_threshold?: number
          name: string
          price?: number
          stock?: number
          store_id: string
          updated_at?: string
          variants?: Json
        }
        Update: {
          category_id?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_featured?: boolean
          low_stock_threshold?: number
          name?: string
          price?: number
          stock?: number
          store_id?: string
          updated_at?: string
          variants?: Json
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
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipping_providers: {
        Row: {
          api_endpoint: string | null
          config: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          config?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_customers: {
        Row: {
          blacklist_reason: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          is_blacklisted: boolean
          name: string
          phone: string
          store_id: string
          user_id: string | null
        }
        Insert: {
          blacklist_reason?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_blacklisted?: boolean
          name: string
          phone: string
          store_id: string
          user_id?: string | null
        }
        Update: {
          blacklist_reason?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_blacklisted?: boolean
          name?: string
          phone?: string
          store_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_reviews: {
        Row: {
          comment: string
          created_at: string
          customer_name: string
          id: string
          is_approved: boolean
          is_featured: boolean
          rating: number
          store_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string
          customer_name: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          rating?: number
          store_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string
          customer_name?: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          rating?: number
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_templates: {
        Row: {
          access: Database["public"]["Enums"]["template_access"]
          category: string
          created_at: string
          description_ar: string
          id: string
          is_active: boolean
          layout: Json
          name_ar: string
          preview_theme: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          access?: Database["public"]["Enums"]["template_access"]
          category: string
          created_at?: string
          description_ar: string
          id?: string
          is_active?: boolean
          layout?: Json
          name_ar: string
          preview_theme?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          access?: Database["public"]["Enums"]["template_access"]
          category?: string
          created_at?: string
          description_ar?: string
          id?: string
          is_active?: boolean
          layout?: Json
          name_ar?: string
          preview_theme?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          approved_at: string | null
          bank_account: Json
          banned_reason: string | null
          brand_colors: Json
          business_type: string | null
          city: string | null
          created_at: string
          custom_domain: string | null
          id: string
          identity_document_url: string | null
          logo_url: string | null
          name: string
          owner_user_id: string
          rejection_reason: string | null
          slug: string
          social_links: Json
          status: Database["public"]["Enums"]["store_status"]
          subscription_tier: Database["public"]["Enums"]["subscription_tier"]
          tax_number: string | null
          template_id: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          approved_at?: string | null
          bank_account?: Json
          banned_reason?: string | null
          brand_colors?: Json
          business_type?: string | null
          city?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          identity_document_url?: string | null
          logo_url?: string | null
          name: string
          owner_user_id: string
          rejection_reason?: string | null
          slug: string
          social_links?: Json
          status?: Database["public"]["Enums"]["store_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          tax_number?: string | null
          template_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          approved_at?: string | null
          bank_account?: Json
          banned_reason?: string | null
          brand_colors?: Json
          business_type?: string | null
          city?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          identity_document_url?: string | null
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          rejection_reason?: string | null
          slug?: string
          social_links?: Json
          status?: Database["public"]["Enums"]["store_status"]
          subscription_tier?: Database["public"]["Enums"]["subscription_tier"]
          tax_number?: string | null
          template_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "store_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          advanced_analytics: boolean
          ai_credits: number
          bank_transfer_enabled: boolean
          created_at: string
          custom_domain: boolean
          id: string
          is_active: boolean
          monthly_price: number
          name_ar: string
          product_limit: number
          staff_limit: number
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          advanced_analytics?: boolean
          ai_credits?: number
          bank_transfer_enabled?: boolean
          created_at?: string
          custom_domain?: boolean
          id?: string
          is_active?: boolean
          monthly_price?: number
          name_ar: string
          product_limit?: number
          staff_limit?: number
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          advanced_analytics?: boolean
          ai_credits?: number
          bank_transfer_enabled?: boolean
          created_at?: string
          custom_domain?: boolean
          id?: string
          is_active?: boolean
          monthly_price?: number
          name_ar?: string
          product_limit?: number
          staff_limit?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      super_admin_accounts: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          password_hash?: string
          username?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_store_owner: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "merchant" | "customer"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "returned"
        | "cancelled"
      payment_method:
        | "cod"
        | "bank_transfer"
        | "card"
        | "paypal"
        | "moroccan_gateway"
      store_status:
        | "draft"
        | "pending_verification"
        | "active"
        | "rejected"
        | "suspended"
      subscription_tier: "free" | "starter" | "pro" | "enterprise"
      template_access: "free" | "starter" | "pro" | "enterprise"
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
      app_role: ["super_admin", "merchant", "customer"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "returned",
        "cancelled",
      ],
      payment_method: [
        "cod",
        "bank_transfer",
        "card",
        "paypal",
        "moroccan_gateway",
      ],
      store_status: [
        "draft",
        "pending_verification",
        "active",
        "rejected",
        "suspended",
      ],
      subscription_tier: ["free", "starter", "pro", "enterprise"],
      template_access: ["free", "starter", "pro", "enterprise"],
    },
  },
} as const
