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
      leads: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          google_url: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string | null
          phone: string | null
          phone_normalized: string | null
          rating: number | null
          raw: Json | null
          reviews_count: number | null
          search_id: string
          state: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          google_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          phone_normalized?: string | null
          rating?: number | null
          raw?: Json | null
          reviews_count?: number | null
          search_id: string
          state?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          google_url?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          phone_normalized?: string | null
          rating?: number | null
          raw?: Json | null
          reviews_count?: number | null
          search_id?: string
          state?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "searches"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_leads: {
        Row: {
          company_linkedin_url: string | null
          created_at: string
          current_company: string | null
          current_position: string | null
          education: Json | null
          email: string | null
          experience: Json | null
          full_name: string | null
          headline: string | null
          id: string
          linkedin_url: string | null
          location: string | null
          profile_image: string | null
          raw: Json | null
          search_id: string
          skills: string[] | null
          user_id: string
        }
        Insert: {
          company_linkedin_url?: string | null
          created_at?: string
          current_company?: string | null
          current_position?: string | null
          education?: Json | null
          email?: string | null
          experience?: Json | null
          full_name?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          profile_image?: string | null
          raw?: Json | null
          search_id: string
          skills?: string[] | null
          user_id: string
        }
        Update: {
          company_linkedin_url?: string | null
          created_at?: string
          current_company?: string | null
          current_position?: string | null
          education?: Json | null
          email?: string | null
          experience?: Json | null
          full_name?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          location?: string | null
          profile_image?: string | null
          raw?: Json | null
          search_id?: string
          skills?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      searches: {
        Row: {
          apify_run_id: string | null
          cost_credits: number | null
          created_at: string
          duplicates_skipped: number
          error_message: string | null
          filters: Json
          id: string
          location: string | null
          max_results: number
          niche: string | null
          parent_search_id: string | null
          results_count: number
          search_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apify_run_id?: string | null
          cost_credits?: number | null
          created_at?: string
          duplicates_skipped?: number
          error_message?: string | null
          filters?: Json
          id?: string
          location?: string | null
          max_results?: number
          niche?: string | null
          parent_search_id?: string | null
          results_count?: number
          search_type?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apify_run_id?: string | null
          cost_credits?: number | null
          created_at?: string
          duplicates_skipped?: number
          error_message?: string | null
          filters?: Json
          id?: string
          location?: string | null
          max_results?: number
          niche?: string | null
          parent_search_id?: string | null
          results_count?: number
          search_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          apify_token: string | null
          apify_validated_at: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apify_token?: string | null
          apify_validated_at?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apify_token?: string | null
          apify_validated_at?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
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
