export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      ai_analysis: {
        Row: {
          branding_score: number;
          completeness_score: number;
          content_score: number;
          generated_at: string;
          missing_sections: Json;
          networking_score: number;
          overall_score: number;
          recommendations: Json;
          recruiter_readiness: number;
          resume_readiness: number;
          suggestions: Json;
          summary: string | null;
          user_id: string;
        };
        Insert: {
          branding_score?: number;
          completeness_score?: number;
          content_score?: number;
          generated_at?: string;
          missing_sections?: Json;
          networking_score?: number;
          overall_score?: number;
          recommendations?: Json;
          recruiter_readiness?: number;
          resume_readiness?: number;
          suggestions?: Json;
          summary?: string | null;
          user_id: string;
        };
        Update: {
          branding_score?: number;
          completeness_score?: number;
          content_score?: number;
          generated_at?: string;
          missing_sections?: Json;
          networking_score?: number;
          overall_score?: number;
          recommendations?: Json;
          recruiter_readiness?: number;
          resume_readiness?: number;
          suggestions?: Json;
          summary?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      attendance_records: {
        Row: {
          id: string;
          user_id: string;
          date: string | null;
          check_in: string | null;
          check_out: string | null;
          seconds: number | null;
          created_at: string | null;
          session_id: string | null;
          intern_name: string | null;
          college: string | null;
          city: string | null;
          problem_statement: string | null;
          status: string | null;
          latitude: number | null;
          longitude: number | null;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string | null;
          check_in?: string | null;
          check_out?: string | null;
          seconds?: number | null;
          created_at?: string | null;
          session_id?: string | null;
          intern_name?: string | null;
          college?: string | null;
          city?: string | null;
          problem_statement?: string | null;
          status?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          submitted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string | null;
          check_in?: string | null;
          check_out?: string | null;
          seconds?: number | null;
          created_at?: string | null;
          session_id?: string | null;
          intern_name?: string | null;
          college?: string | null;
          city?: string | null;
          problem_statement?: string | null;
          status?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          submitted_at?: string | null;
        };
        Relationships: [];
      };
      colleges: {
        Row: {
          city: string;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          city: string;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          city?: string;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      community_comments: {
        Row: {
          created_at: string;
          id: string;
          post_id: string;
          text: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          post_id: string;
          text: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          post_id?: string;
          text?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      community_post_likes: {
        Row: {
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "community_post_likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "community_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      community_posts: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          tag: string;
          title: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          tag?: string;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          tag?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      diary_entries: {
        Row: {
          content: string;
          created_at: string;
          entry_date: string;
          entry_time: string;
          id: string;
          is_draft: boolean;
          mood: string | null;
          pinned: boolean;
          tags: string[];
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content?: string;
          created_at?: string;
          entry_date?: string;
          entry_time?: string;
          id?: string;
          is_draft?: boolean;
          mood?: string | null;
          pinned?: boolean;
          tags?: string[];
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          entry_date?: string;
          entry_time?: string;
          id?: string;
          is_draft?: boolean;
          mood?: string | null;
          pinned?: boolean;
          tags?: string[];
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          audience: string;
          created_at: string;
          id: string;
          link: string | null;
          message: string;
          sender_id: string | null;
          target_user_id: string | null;
          title: string;
        };
        Insert: {
          audience?: string;
          created_at?: string;
          id?: string;
          link?: string | null;
          message: string;
          sender_id?: string | null;
          target_user_id?: string | null;
          title: string;
        };
        Update: {
          audience?: string;
          created_at?: string;
          id?: string;
          link?: string | null;
          message?: string;
          sender_id?: string | null;
          target_user_id?: string | null;
          title?: string;
        };
        Relationships: [];
      };
      privacy_settings: {
        Row: {
          public_profile: boolean;
          show_ai_analysis: boolean;
          show_contact: boolean;
          show_leaderboard: boolean;
          show_linkedin: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          public_profile?: boolean;
          show_ai_analysis?: boolean;
          show_contact?: boolean;
          show_leaderboard?: boolean;
          show_linkedin?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          public_profile?: boolean;
          show_ai_analysis?: boolean;
          show_contact?: boolean;
          show_leaderboard?: boolean;
          show_linkedin?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          admin_type: string | null;
          attendance_points: number;
          avatar_url: string | null;
          banner_url: string | null;
          bio: string | null;
          college: string | null;
          community_points: number;
          created_at: string;
          degree: string | null;
          dob: string | null;
          email: string | null;
          full_name: string | null;
          gender: string | null;
          id: string;
          linkedin_about: string | null;
          linkedin_education: string | null;
          linkedin_experience: string | null;
          linkedin_headline: string | null;
          linkedin_url: string | null;
          onboarding_completed: boolean;
          phone: string | null;
          problem_statement: string | null;
          role: string | null;
          status: string | null;
          skills: string[] | null;
          updated_at: string;
          year_of_study: string | null;
        };
        Insert: {
          admin_type?: string | null;
          attendance_points?: number;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          college?: string | null;
          community_points?: number;
          created_at?: string;
          degree?: string | null;
          dob?: string | null;
          email?: string | null;
          full_name?: string | null;
          gender?: string | null;
          id: string;
          linkedin_about?: string | null;
          linkedin_education?: string | null;
          linkedin_experience?: string | null;
          linkedin_headline?: string | null;
          linkedin_url?: string | null;
          onboarding_completed?: boolean;
          phone?: string | null;
          problem_statement?: string | null;
          role?: string | null;
          status?: string | null;
          skills?: string[] | null;
          updated_at?: string;
          year_of_study?: string | null;
        };
        Update: {
          admin_type?: string | null;
          attendance_points?: number;
          avatar_url?: string | null;
          banner_url?: string | null;
          bio?: string | null;
          college?: string | null;
          community_points?: number;
          created_at?: string;
          degree?: string | null;
          dob?: string | null;
          email?: string | null;
          full_name?: string | null;
          gender?: string | null;
          id?: string;
          linkedin_about?: string | null;
          linkedin_education?: string | null;
          linkedin_experience?: string | null;
          linkedin_headline?: string | null;
          linkedin_url?: string | null;
          onboarding_completed?: boolean;
          phone?: string | null;
          problem_statement?: string | null;
          role?: string | null;
          status?: string | null;
          skills?: string[] | null;
          updated_at?: string;
          year_of_study?: string | null;
        };
        Relationships: [];
      };
      todos: {
        Row: {
          created_at: string;
          done: boolean;
          id: string;
          priority: string;
          title: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          done?: boolean;
          id?: string;
          priority?: string;
          title: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          done?: boolean;
          id?: string;
          priority?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_notifications: {
        Row: {
          created_at: string;
          id: string;
          is_read: boolean;
          notification_id: string;
          read_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          notification_id: string;
          read_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_read?: boolean;
          notification_id?: string;
          read_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_notifications_notification_id_fkey";
            columns: ["notification_id"];
            isOneToOne: false;
            referencedRelation: "notifications";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      admin_problem_statements: {
        Row: {
          id: string;
          admin_id: string;
          problem_statement_id: string;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          problem_statement_id: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          problem_statement_id?: string;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Relationships: [];
      };
      attendance_audit_logs: {
        Row: {
          id: string;
          record_id: string | null;
          action_type: string;
          old_status: string | null;
          new_status: string | null;
          reason: string;
          marked_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          record_id?: string | null;
          action_type: string;
          old_status?: string | null;
          new_status?: string | null;
          reason: string;
          marked_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          record_id?: string | null;
          action_type?: string;
          old_status?: string | null;
          new_status?: string | null;
          reason?: string;
          marked_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance_extensions: {
        Row: {
          id: string;
          session_id: string | null;
          minutes: number;
          extended_by: string | null;
          extended_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          minutes: number;
          extended_by?: string | null;
          extended_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          minutes?: number;
          extended_by?: string | null;
          extended_at?: string;
        };
        Relationships: [];
      };
      attendance_holidays: {
        Row: {
          id: string;
          holiday_date: string;
          title: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          holiday_date: string;
          title: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          holiday_date?: string;
          title?: string;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance_passwords: {
        Row: {
          id: string;
          session_id: string | null;
          password: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          password: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          password?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      attendance_sessions: {
        Row: {
          id: string;
          title: string;
          session_date: string;
          problem_statement: string | null;
          college: string | null;
          start_time: string;
          end_time: string;
          latitude: number;
          longitude: number;
          radius: number | null;
          gps_verification: boolean | null;
          password_verification: boolean | null;
          password: string | null;
          status: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          session_date: string;
          problem_statement?: string | null;
          college?: string | null;
          start_time?: string;
          end_time?: string;
          latitude: number;
          longitude: number;
          radius?: number | null;
          gps_verification?: boolean | null;
          password_verification?: boolean | null;
          password?: string | null;
          status?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          session_date?: string;
          problem_statement?: string | null;
          college?: string | null;
          start_time?: string;
          end_time?: string;
          latitude?: number;
          longitude?: number;
          radius?: number | null;
          gps_verification?: boolean | null;
          password_verification?: boolean | null;
          password?: string | null;
          status?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      interns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          problem_statement_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          problem_statement_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          problem_statement_id?: string | null;
        };
        Relationships: [];
      };
      problem_statements: {
        Row: {
          id: string;
          name: string;
          category: string;
          description: string | null;
          title: string | null;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          description?: string | null;
          title?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          description?: string | null;
          title?: string | null;
          status?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      ai_analysis_public: {
        Row: {
          branding_score: number | null;
          completeness_score: number | null;
          content_score: number | null;
          missing_sections: Json | null;
          networking_score: number | null;
          overall_score: number | null;
          recommendations: Json | null;
          recruiter_readiness: number | null;
          resume_readiness: number | null;
          suggestions: Json | null;
          summary: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      profiles_public: {
        Row: {
          attendance_points: number | null;
          avatar_url: string | null;
          banner_url: string | null;
          college: string | null;
          community_points: number | null;
          degree: string | null;
          email: string | null;
          full_name: string | null;
          id: string | null;
          linkedin_about: string | null;
          linkedin_headline: string | null;
          linkedin_url: string | null;
          problem_statement: string | null;
          public_profile: boolean | null;
          show_leaderboard: boolean | null;
          skills: string[] | null;
          year_of_study: string | null;
        };
        Relationships: [];
      };
      public_ai_analysis: {
        Row: {
          branding_score: number | null;
          completeness_score: number | null;
          content_score: number | null;
          generated_at: string | null;
          missing_sections: Json | null;
          networking_score: number | null;
          overall_score: number | null;
          recommendations: Json | null;
          recruiter_readiness: number | null;
          resume_readiness: number | null;
          suggestions: Json | null;
          summary: string | null;
          user_id: string | null;
        };
        Relationships: [];
      };
      public_leaderboard: {
        Row: {
          attendance_points: number | null;
          avatar_url: string | null;
          branding_score: number | null;
          college: string | null;
          community_points: number | null;
          full_name: string | null;
          id: string | null;
          overall_score: number | null;
          problem_statement: string | null;
        };
        Relationships: [];
      };
      public_profiles: {
        Row: {
          attendance_points: number | null;
          avatar_url: string | null;
          banner_url: string | null;
          college: string | null;
          community_points: number | null;
          degree: string | null;
          email: string | null;
          full_name: string | null;
          id: string | null;
          linkedin_about: string | null;
          linkedin_headline: string | null;
          linkedin_url: string | null;
          problem_statement: string | null;
          public_profile: boolean | null;
          show_ai_analysis: boolean | null;
          show_leaderboard: boolean | null;
          skills: string[] | null;
          year_of_study: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      add_college: { Args: { _name: string }; Returns: undefined };
      award_attendance_points:
        | { Args: never; Returns: undefined }
        | { Args: { _amount?: number }; Returns: undefined };
      award_community_points:
        | { Args: never; Returns: undefined }
        | { Args: { _amount?: number }; Returns: undefined };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      mark_all_notifications_read: { Args: never; Returns: undefined };
      send_self_notification: {
        Args: { _link?: string; _message: string; _title: string };
        Returns: string;
      };
    };
    Enums: {
      app_role: "intern" | "admin" | "superadmin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    Enums: {
      app_role: ["intern", "admin", "superadmin"],
    },
  },
} as const;
