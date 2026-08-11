export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          bio: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
        Relationships: []
      }
      adult_applications: {
        Row: {
          id: string
          name: string
          age: number
          address: string
          contact: string
          fb_acc: string
          message: string | null
          status: string | null
          created_at: string
          birthday: string | null
          guardian: string | null
        }
        Insert: {
          id?: string
          name: string
          age: number
          address: string
          contact: string
          fb_acc: string
          message?: string | null
          status?: string | null
          created_at?: string
          birthday?: string | null
          guardian?: string | null
        }
        Update: {
          id?: string
          name?: string
          age?: number
          address?: string
          contact?: string
          fb_acc?: string
          message?: string | null
          status?: string | null
          created_at?: string
          birthday?: string | null
          guardian?: string | null
        }
        Relationships: []
      }
      contribution_periods: {
        Row: {
          id: string
          label: string
          period_month: string
          meeting_date: string | null
          amount_due: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          label: string
          period_month: string
          meeting_date?: string | null
          amount_due?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          label?: string
          period_month?: string
          meeting_date?: string | null
          amount_due?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          id: string
          period_id: string
          member_id: string
          status: string
          amount_paid: number | null
          paid_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          period_id: string
          member_id: string
          status?: string
          amount_paid?: number | null
          paid_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          period_id?: string
          member_id?: string
          status?: string
          amount_paid?: number | null
          paid_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          file_name: string
          file_url: string
          public_id: string
          file_type: string
          file_size: number | null
          folder: string
          folder_description: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          file_name: string
          file_url: string
          public_id: string
          file_type: string
          file_size?: number | null
          folder?: string
          folder_description?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          file_name?: string
          file_url?: string
          public_id?: string
          file_type?: string
          file_size?: number | null
          folder?: string
          folder_description?: string | null
          uploaded_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          id: string
          donor_name: string | null
          is_anonymous: boolean
          amount: number
          date_received: string
          note: string | null
          proof_image_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          donor_name?: string | null
          is_anonymous?: boolean
          amount?: number
          date_received?: string
          note?: string | null
          proof_image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          donor_name?: string | null
          is_anonymous?: boolean
          amount?: number
          date_received?: string
          note?: string | null
          proof_image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          date: string
          summary: string | null
          banner_url: string | null
          featured: boolean | null
          created_at: string
          updated_at: string
          narrative: string | null
          narrative_image_url: string | null
          narrative_images: string[]
        }
        Insert: {
          id?: string
          title: string
          date: string
          summary?: string | null
          banner_url?: string | null
          featured?: boolean | null
          created_at?: string
          updated_at?: string
          narrative?: string | null
          narrative_image_url?: string | null
          narrative_images?: string[]
        }
        Update: {
          id?: string
          title?: string
          date?: string
          summary?: string | null
          banner_url?: string | null
          featured?: boolean | null
          created_at?: string
          updated_at?: string
          narrative?: string | null
          narrative_image_url?: string | null
          narrative_images?: string[]
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          item_description: string
          category: string
          amount: number
          date_spent: string
          note: string | null
          receipt_image_url: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_description: string
          category?: string
          amount?: number
          date_spent?: string
          note?: string | null
          receipt_image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_description?: string
          category?: string
          amount?: number
          date_spent?: string
          note?: string | null
          receipt_image_url?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      folders: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      gallery: {
        Row: {
          id: string
          image_url: string
          alt_text: string
          created_at: string
          name: string | null
          album: string | null
          album_description: string | null
        }
        Insert: {
          id?: string
          image_url: string
          alt_text: string
          created_at?: string
          name?: string | null
          album?: string | null
          album_description?: string | null
        }
        Update: {
          id?: string
          image_url?: string
          alt_text?: string
          created_at?: string
          name?: string | null
          album?: string | null
          album_description?: string | null
        }
        Relationships: []
      }
      hero_content: {
        Row: {
          id: string
          headline: string
          subtext: string
          background_url: string
          updated_at: string
        }
        Insert: {
          id?: string
          headline: string
          subtext: string
          background_url: string
          updated_at?: string
        }
        Update: {
          id?: string
          headline?: string
          subtext?: string
          background_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          id: string
          full_name: string
          birthday: string
          age: number
          address: string
          guardian: string | null
          contact_number: string
          batch: number | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          birthday: string
          age: number
          address: string
          guardian?: string | null
          contact_number: string
          batch?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          birthday?: string
          age?: number
          address?: string
          guardian?: string | null
          contact_number?: string
          batch?: number | null
          created_at?: string
        }
        Relationships: []
      }
      parent_applications: {
        Row: {
          id: string
          child_name: string
          child_age: number
          address: string
          parent_name: string
          parent_phone: string
          fb_acc: string
          message: string | null
          status: string
          created_at: string
          birthday: string
          guardian: string
        }
        Insert: {
          id?: string
          child_name: string
          child_age: number
          address: string
          parent_name: string
          parent_phone: string
          fb_acc: string
          message?: string | null
          status?: string
          created_at?: string
          birthday: string
          guardian: string
        }
        Update: {
          id?: string
          child_name?: string
          child_age?: number
          address?: string
          parent_name?: string
          parent_phone?: string
          fb_acc?: string
          message?: string | null
          status?: string
          created_at?: string
          birthday?: string
          guardian?: string
        }
        Relationships: []
      }
      parish_clergy: {
        Row: {
          id: string
          name: string
          photo_url: string | null
          description: string
          category: Database["public"]["Enums"]["clergy_category"]
          display_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          photo_url?: string | null
          description: string
          category: Database["public"]["Enums"]["clergy_category"]
          display_order?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          photo_url?: string | null
          description?: string
          category?: Database["public"]["Enums"]["clergy_category"]
          display_order?: number | null
          created_at?: string | null
        }
        Relationships: []
      }
      penalties: {
        Row: {
          id: string
          member_id: string
          date_absent: string
          reason: string | null
          penalty_amount: number
          status: string
          paid_date: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          date_absent: string
          reason?: string | null
          penalty_amount?: number
          status?: string
          paid_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          date_absent?: string
          reason?: string | null
          penalty_amount?: number
          status?: string
          paid_date?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_treasurer: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "treasurer"
      clergy_category:
        | "rector_parish_priest"
        | "parochial_vicar"
        | "assisting_priest"
        | "other"
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
      app_role: ["admin", "treasurer"],
      clergy_category: [
        "rector_parish_priest",
        "parochial_vicar",
        "assisting_priest",
        "other",
      ],
    },
  },
} as const