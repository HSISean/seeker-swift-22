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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string | null
          id: string
          job_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          id?: string
          job_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          id?: string
          job_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      job_sites: {
        Row: {
          created_at: string | null
          id: string
          site_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          site_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          site_name?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          company_id: string
          company_link: string | null
          cover_letter_link: string | null
          description: string
          employment_type: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          j_uuid: string | null
          job_link: string | null
          job_site_id: string | null
          justification: string | null
          location: string | null
          match_rating: number | null
          posted_at: string | null
          requirements: string[] | null
          resume_link: string | null
          salary_max: number | null
          salary_min: number | null
          title: string
          user_profile_id: string | null
        }
        Insert: {
          company_id: string
          company_link?: string | null
          cover_letter_link?: string | null
          description: string
          employment_type?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          j_uuid?: string | null
          job_link?: string | null
          job_site_id?: string | null
          justification?: string | null
          location?: string | null
          match_rating?: number | null
          posted_at?: string | null
          requirements?: string[] | null
          resume_link?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title: string
          user_profile_id?: string | null
        }
        Update: {
          company_id?: string
          company_link?: string | null
          cover_letter_link?: string | null
          description?: string
          employment_type?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          j_uuid?: string | null
          job_link?: string | null
          job_site_id?: string | null
          justification?: string | null
          location?: string | null
          match_rating?: number | null
          posted_at?: string | null
          requirements?: string[] | null
          resume_link?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title?: string
          user_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_job_site_id_fkey"
            columns: ["job_site_id"]
            isOneToOne: false
            referencedRelation: "job_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_user_profile_id_fkey"
            columns: ["user_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          payment_date: string | null
          status: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_date?: string | null
          status?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_date?: string | null
          status?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscription_type"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_active: boolean | null
          created_at: string | null
          drive_id: string | null
          email: string
          enhanced_resume_folder: string | null
          full_name: string | null
          id: string
          job_title: string | null
          jobs_applied: number | null
          jobs_sent: number | null
          location: string | null
          next_billing_month: string | null
          resume_count: number | null
          resume_folder: string | null
          resume_key: string | null
          resume_url: string | null
          salary_max: number | null
          salary_min: number | null
          subscriptions: string | null
          updated_at: string | null
          uuid: string | null
          videos_watched: number | null
          webhook: string | null
        }
        Insert: {
          account_active?: boolean | null
          created_at?: string | null
          drive_id?: string | null
          email: string
          enhanced_resume_folder?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          jobs_applied?: number | null
          jobs_sent?: number | null
          location?: string | null
          next_billing_month?: string | null
          resume_count?: number | null
          resume_folder?: string | null
          resume_key?: string | null
          resume_url?: string | null
          salary_max?: number | null
          salary_min?: number | null
          subscriptions?: string | null
          updated_at?: string | null
          uuid?: string | null
          videos_watched?: number | null
          webhook?: string | null
        }
        Update: {
          account_active?: boolean | null
          created_at?: string | null
          drive_id?: string | null
          email?: string
          enhanced_resume_folder?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          jobs_applied?: number | null
          jobs_sent?: number | null
          location?: string | null
          next_billing_month?: string | null
          resume_count?: number | null
          resume_folder?: string | null
          resume_key?: string | null
          resume_url?: string | null
          salary_max?: number | null
          salary_min?: number | null
          subscriptions?: string | null
          updated_at?: string | null
          uuid?: string | null
          videos_watched?: number | null
          webhook?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_subscriptions_fkey"
            columns: ["subscriptions"]
            isOneToOne: false
            referencedRelation: "subscription_type"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_type: {
        Row: {
          cover_letter_subscription:
            | Database["public"]["Enums"]["cover_letter_subscription_enum"]
            | null
          created_at: string | null
          id: string
          interest_level:
            | Database["public"]["Enums"]["interest_level_enum"]
            | null
          job_subscription:
            | Database["public"]["Enums"]["job_subscription_enum"]
            | null
          resume_subscription:
            | Database["public"]["Enums"]["resume_subscription_enum"]
            | null
        }
        Insert: {
          cover_letter_subscription?:
            | Database["public"]["Enums"]["cover_letter_subscription_enum"]
            | null
          created_at?: string | null
          id?: string
          interest_level?:
            | Database["public"]["Enums"]["interest_level_enum"]
            | null
          job_subscription?:
            | Database["public"]["Enums"]["job_subscription_enum"]
            | null
          resume_subscription?:
            | Database["public"]["Enums"]["resume_subscription_enum"]
            | null
        }
        Update: {
          cover_letter_subscription?:
            | Database["public"]["Enums"]["cover_letter_subscription_enum"]
            | null
          created_at?: string | null
          id?: string
          interest_level?:
            | Database["public"]["Enums"]["interest_level_enum"]
            | null
          job_subscription?:
            | Database["public"]["Enums"]["job_subscription_enum"]
            | null
          resume_subscription?:
            | Database["public"]["Enums"]["resume_subscription_enum"]
            | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          id: string
          is_trial: boolean
          subscription_type_id: string | null
          trial_ends_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_trial?: boolean
          subscription_type_id?: string | null
          trial_ends_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_trial?: boolean
          subscription_type_id?: string | null
          trial_ends_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_subscription_type_id_fkey"
            columns: ["subscription_type_id"]
            isOneToOne: false
            referencedRelation: "subscription_type"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      cover_letter_subscription_enum: "0.00" | "2.99"
      interest_level_enum:
        | "browsing"
        | "actively_looking"
        | "on_the_hunt"
        | "need_a_job_asap"
      job_subscription_enum: "0.00" | "6.99" | "15.99" | "29.99"
      resume_subscription_enum: "0.00" | "2.99" | "3.99" | "5.99"
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
      cover_letter_subscription_enum: ["0.00", "2.99"],
      interest_level_enum: [
        "browsing",
        "actively_looking",
        "on_the_hunt",
        "need_a_job_asap",
      ],
      job_subscription_enum: ["0.00", "6.99", "15.99", "29.99"],
      resume_subscription_enum: ["0.00", "2.99", "3.99", "5.99"],
    },
  },
} as const
