export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      currency_rates: {
        Row: {
          created_at: string | null
          currency_code: string
          id: string
          is_active: boolean | null
          rate: number
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency_code: string
          id?: string
          is_active?: boolean | null
          rate: number
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency_code?: string
          id?: string
          is_active?: boolean | null
          rate?: number
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      historical_rates: {
        Row: {
          currency_code: string
          date: string | null
          id: string
          rate: number
          usdt_ngn_rate: number
        }
        Insert: {
          currency_code: string
          date?: string | null
          id?: string
          rate: number
          usdt_ngn_rate: number
        }
        Update: {
          currency_code?: string
          date?: string | null
          id?: string
          rate?: number
          usdt_ngn_rate?: number
        }
        Relationships: []
      }
      margin_settings: {
        Row: {
          created_at: string | null
          id: string
          other_currencies_margin: number | null
          updated_at: string | null
          usd_margin: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          other_currencies_margin?: number | null
          updated_at?: string | null
          usd_margin?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          other_currencies_margin?: number | null
          updated_at?: string | null
          usd_margin?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          read: boolean | null
          timestamp: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          read?: boolean | null
          timestamp?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          read?: boolean | null
          timestamp?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usdt_ngn_rates: {
        Row: {
          created_at: string | null
          id: string
          rate: number
          source: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          rate: number
          source?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          rate?: number
          source?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vertofx_historical_rates: {
        Row: {
          buy_rate: number
          currency_pair: string
          date: string
          id: string
          percent_change: number | null
          provider: string | null
          sell_rate: number
        }
        Insert: {
          buy_rate: number
          currency_pair: string
          date?: string
          id?: string
          percent_change?: number | null
          provider?: string | null
          sell_rate: number
        }
        Update: {
          buy_rate?: number
          currency_pair?: string
          date?: string
          id?: string
          percent_change?: number | null
          provider?: string | null
          sell_rate?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
