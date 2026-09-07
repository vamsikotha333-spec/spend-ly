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
      assets: {
        Row: {
          created_at: string
          id: string
          member: string | null
          name: string
          notes: string | null
          type: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          member?: string | null
          name: string
          notes?: string | null
          type: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          member?: string | null
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      budgets: {
        Row: {
          budget_amount: number
          category: string
          created_at: string
          id: string
          month: string
          person: string
          user_id: string
        }
        Insert: {
          budget_amount: number
          category: string
          created_at?: string
          id?: string
          month: string
          person?: string
          user_id?: string
        }
        Update: {
          budget_amount?: number
          category?: string
          created_at?: string
          id?: string
          month?: string
          person?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          budget_tracking: boolean
          created_at: string
          emoji: string | null
          id: string
          is_default: boolean
          name: string
          type: string
          user_id: string
        }
        Insert: {
          budget_tracking?: boolean
          created_at?: string
          emoji?: string | null
          id?: string
          is_default?: boolean
          name: string
          type: string
          user_id?: string
        }
        Update: {
          budget_tracking?: boolean
          created_at?: string
          emoji?: string | null
          id?: string
          is_default?: boolean
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      category_templates: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          name: string
          sort_order: number | null
          type: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          sort_order?: number | null
          type: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
      financial_goals: {
        Row: {
          category: string
          created_at: string
          current_amount: number
          id: string
          name: string
          notes: string | null
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_amount?: number
          id?: string
          name: string
          notes?: string | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_amount?: number
          id?: string
          name?: string
          notes?: string | null
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_policies: {
        Row: {
          coverage_amount: number
          created_at: string
          id: string
          name: string
          notes: string | null
          policy_number: string | null
          premium_amount: number
          premium_frequency: string
          provider: string | null
          renewal_date: string | null
          start_date: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          coverage_amount?: number
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          policy_number?: string | null
          premium_amount?: number
          premium_frequency?: string
          provider?: string | null
          renewal_date?: string | null
          start_date?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          coverage_amount?: number
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          policy_number?: string | null
          premium_amount?: number
          premium_frequency?: string
          provider?: string | null
          renewal_date?: string | null
          start_date?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          bank_name: string | null
          borrower_name: string | null
          category: string
          created_at: string
          current_value: number
          due_date: string | null
          id: string
          interest_frequency: string | null
          interest_rate: number | null
          interest_received: number
          interest_type: string | null
          invested_amount: number
          invested_on: string
          name: string
          notes: string | null
          principal_amount: number | null
          purpose: string | null
          start_date: string | null
          status: string
          tags: string[]
          type_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_name?: string | null
          borrower_name?: string | null
          category: string
          created_at?: string
          current_value?: number
          due_date?: string | null
          id?: string
          interest_frequency?: string | null
          interest_rate?: number | null
          interest_received?: number
          interest_type?: string | null
          invested_amount?: number
          invested_on?: string
          name: string
          notes?: string | null
          principal_amount?: number | null
          purpose?: string | null
          start_date?: string | null
          status?: string
          tags?: string[]
          type_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_name?: string | null
          borrower_name?: string | null
          category?: string
          created_at?: string
          current_value?: number
          due_date?: string | null
          id?: string
          interest_frequency?: string | null
          interest_rate?: number | null
          interest_received?: number
          interest_type?: string | null
          invested_amount?: number
          invested_on?: string
          name?: string
          notes?: string | null
          principal_amount?: number | null
          purpose?: string | null
          start_date?: string | null
          status?: string
          tags?: string[]
          type_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      liabilities: {
        Row: {
          amount: number
          created_at: string
          id: string
          interest_rate: number | null
          member: string | null
          name: string
          notes: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          interest_rate?: number | null
          member?: string | null
          name: string
          notes?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          interest_rate?: number | null
          member?: string | null
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      master_data_items: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          kind: string
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          kind: string
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          kind?: string
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      net_worth_snapshots: {
        Row: {
          assets_total: number
          created_at: string
          id: string
          liabilities_total: number
          net_worth: number
          snapshot_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assets_total?: number
          created_at?: string
          id?: string
          liabilities_total?: number
          net_worth?: number
          snapshot_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assets_total?: number
          created_at?: string
          id?: string
          liabilities_total?: number
          net_worth?: number
          snapshot_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          added_by: string
          amount: number
          applicable_to: string | null
          category: string
          created_at: string
          description: string | null
          frequency: string
          id: string
          is_active: boolean
          next_run_date: string
          transaction_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          added_by: string
          amount: number
          applicable_to?: string | null
          category: string
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          next_run_date: string
          transaction_type?: string | null
          type: string
          user_id?: string
        }
        Update: {
          added_by?: string
          amount?: number
          applicable_to?: string | null
          category?: string
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          next_run_date?: string
          transaction_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_contributions: {
        Row: {
          amount: number
          contributed_at: string
          created_at: string
          goal_id: string
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          amount: number
          contributed_at?: string
          created_at?: string
          goal_id: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Update: {
          amount?: number
          contributed_at?: string
          created_at?: string
          goal_id?: string
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "savings_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_goals: {
        Row: {
          category: string | null
          created_at: string
          current_amount: number
          deadline: string | null
          id: string
          name: string
          person: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name: string
          person: string
          target_amount: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name?: string
          person?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          added_by: string
          amount: number
          applicable_to: string | null
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          transaction_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          added_by: string
          amount: number
          applicable_to?: string | null
          category: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          transaction_type?: string | null
          type: string
          user_id?: string
        }
        Update: {
          added_by?: string
          amount?: number
          applicable_to?: string | null
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          transaction_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_master_data_for_user: {
        Args: { _user_id: string }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
