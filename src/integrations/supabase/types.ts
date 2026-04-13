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
      attendance_logs: {
        Row: {
          avg_wait_time: number
          created_at: string
          current_attendance: number
          entry_rate: number
          event_id: string
          gate_statuses: Json
          id: string
          surge_risk_score: number
        }
        Insert: {
          avg_wait_time?: number
          created_at?: string
          current_attendance?: number
          entry_rate?: number
          event_id: string
          gate_statuses?: Json
          id?: string
          surge_risk_score?: number
        }
        Update: {
          avg_wait_time?: number
          created_at?: string
          current_attendance?: number
          entry_rate?: number
          event_id?: string
          gate_statuses?: Json
          id?: string
          surge_risk_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audit_log: {
        Row: {
          created_at: string
          details: string | null
          event_id: string
          id: string
          resolved: boolean
          severity: string
          violation_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          event_id: string
          id?: string
          resolved?: boolean
          severity?: string
          violation_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          event_id?: string
          id?: string
          resolved?: boolean
          severity?: string
          violation_type?: string
        }
        Relationships: []
      }
      evacuation_logs: {
        Row: {
          congestion_score: number
          created_at: string
          event_id: string
          flow_rate_per_minute: number
          id: string
          people_remaining: number
          zone_id: string
        }
        Insert: {
          congestion_score?: number
          created_at?: string
          event_id: string
          flow_rate_per_minute?: number
          id?: string
          people_remaining?: number
          zone_id: string
        }
        Update: {
          congestion_score?: number
          created_at?: string
          event_id?: string
          flow_rate_per_minute?: number
          id?: string
          people_remaining?: number
          zone_id?: string
        }
        Relationships: []
      }
      event_daily_snapshots: {
        Row: {
          archived_at: string
          attendance: number
          avg_wait: number
          day_number: number
          event_id: string
          id: string
          incidents: number
          peak_surge: number
        }
        Insert: {
          archived_at?: string
          attendance?: number
          avg_wait?: number
          day_number: number
          event_id: string
          id?: string
          incidents?: number
          peak_surge?: number
        }
        Update: {
          archived_at?: string
          attendance?: number
          avg_wait?: number
          day_number?: number
          event_id?: string
          id?: string
          incidents?: number
          peak_surge?: number
        }
        Relationships: []
      }
      event_snapshots: {
        Row: {
          archived_at: string
          avg_wait_time: number
          event_id: string
          final_attendance: number
          id: string
          incident_count: number
          peak_attendance: number
          peak_surge_risk: number
          revenue_estimate: number
        }
        Insert: {
          archived_at?: string
          avg_wait_time?: number
          event_id: string
          final_attendance?: number
          id?: string
          incident_count?: number
          peak_attendance?: number
          peak_surge_risk?: number
          revenue_estimate?: number
        }
        Update: {
          archived_at?: string
          avg_wait_time?: number
          event_id?: string
          final_attendance?: number
          id?: string
          incident_count?: number
          peak_attendance?: number
          peak_surge_risk?: number
          revenue_estimate?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          current_attendance: number
          current_day_number: number
          delay_started_at: string | null
          delay_status: Database["public"]["Enums"]["delay_status"]
          delay_total_minutes: number
          end_time: string
          evacuation_estimated_completion: string | null
          evacuation_mode: boolean
          evacuation_started_at: string | null
          event_date: string
          event_end_date: string | null
          event_name: string
          expected_attendance: number
          id: string
          is_locked: boolean
          is_multi_day: boolean
          is_paused: boolean
          lifecycle_state: Database["public"]["Enums"]["lifecycle_state"]
          overtime_active: boolean
          overtime_minutes_added: number
          overtime_reason: Database["public"]["Enums"]["overtime_reason"] | null
          risk_score: number | null
          stadium_id: string
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_attendance?: number
          current_day_number?: number
          delay_started_at?: string | null
          delay_status?: Database["public"]["Enums"]["delay_status"]
          delay_total_minutes?: number
          end_time: string
          evacuation_estimated_completion?: string | null
          evacuation_mode?: boolean
          evacuation_started_at?: string | null
          event_date: string
          event_end_date?: string | null
          event_name: string
          expected_attendance: number
          id?: string
          is_locked?: boolean
          is_multi_day?: boolean
          is_paused?: boolean
          lifecycle_state?: Database["public"]["Enums"]["lifecycle_state"]
          overtime_active?: boolean
          overtime_minutes_added?: number
          overtime_reason?:
            | Database["public"]["Enums"]["overtime_reason"]
            | null
          risk_score?: number | null
          stadium_id: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_attendance?: number
          current_day_number?: number
          delay_started_at?: string | null
          delay_status?: Database["public"]["Enums"]["delay_status"]
          delay_total_minutes?: number
          end_time?: string
          evacuation_estimated_completion?: string | null
          evacuation_mode?: boolean
          evacuation_started_at?: string | null
          event_date?: string
          event_end_date?: string | null
          event_name?: string
          expected_attendance?: number
          id?: string
          is_locked?: boolean
          is_multi_day?: boolean
          is_paused?: boolean
          lifecycle_state?: Database["public"]["Enums"]["lifecycle_state"]
          overtime_active?: boolean
          overtime_minutes_added?: number
          overtime_reason?:
            | Database["public"]["Enums"]["overtime_reason"]
            | null
          risk_score?: number | null
          stadium_id?: string
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_stadium_id_fkey"
            columns: ["stadium_id"]
            isOneToOne: false
            referencedRelation: "stadiums"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_stream: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          sensor_type: string
          stadium_id: string
          value: number
          zone_id: string
        }
        Insert: {
          confidence_score?: number
          created_at?: string
          id?: string
          sensor_type: string
          stadium_id: string
          value?: number
          zone_id: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          sensor_type?: string
          stadium_id?: string
          value?: number
          zone_id?: string
        }
        Relationships: []
      }
      stadiums: {
        Row: {
          capacity: number
          city: string
          created_at: string
          crowd_status: Database["public"]["Enums"]["crowd_status"]
          id: string
          image_url: string | null
          latitude: number
          longitude: number
          name: string
          state: string
          updated_at: string
        }
        Insert: {
          capacity: number
          city: string
          created_at?: string
          crowd_status?: Database["public"]["Enums"]["crowd_status"]
          id?: string
          image_url?: string | null
          latitude: number
          longitude: number
          name: string
          state: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          city?: string
          created_at?: string
          crowd_status?: Database["public"]["Enums"]["crowd_status"]
          id?: string
          image_url?: string | null
          latitude?: number
          longitude?: number
          name?: string
          state?: string
          updated_at?: string
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      crowd_status: "low" | "medium" | "high"
      delay_status: "none" | "weather" | "technical" | "security"
      event_status: "upcoming" | "live" | "completed"
      lifecycle_state: "scheduled" | "active" | "finalizing" | "archived"
      overtime_reason: "super_over" | "tie_break" | "ceremony_extension"
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
      app_role: ["admin", "moderator", "user"],
      crowd_status: ["low", "medium", "high"],
      delay_status: ["none", "weather", "technical", "security"],
      event_status: ["upcoming", "live", "completed"],
      lifecycle_state: ["scheduled", "active", "finalizing", "archived"],
      overtime_reason: ["super_over", "tie_break", "ceremony_extension"],
    },
  },
} as const
