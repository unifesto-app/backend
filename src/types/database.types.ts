export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      access_roles: {
        Row: {
          code: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          scope: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          scope: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_crashes: {
        Row: {
          affected_users: number
          app_version: string
          crash_date: string
          crash_id: string | null
          crash_type: string
          created_at: string
          device_model: string | null
          error_message: string | null
          exception_type: string | null
          first_occurred_at: string
          id: string
          last_occurred_at: string
          occurrence_count: number
          os_version: string | null
          platform: string
          raw_data: Json | null
          source: string
          stack_trace: string | null
          status: string
          synced_at: string
          updated_at: string
        }
        Insert: {
          affected_users?: number
          app_version: string
          crash_date: string
          crash_id?: string | null
          crash_type: string
          created_at?: string
          device_model?: string | null
          error_message?: string | null
          exception_type?: string | null
          first_occurred_at: string
          id?: string
          last_occurred_at: string
          occurrence_count?: number
          os_version?: string | null
          platform: string
          raw_data?: Json | null
          source: string
          stack_trace?: string | null
          status?: string
          synced_at?: string
          updated_at?: string
        }
        Update: {
          affected_users?: number
          app_version?: string
          crash_date?: string
          crash_id?: string | null
          crash_type?: string
          created_at?: string
          device_model?: string | null
          error_message?: string | null
          exception_type?: string | null
          first_occurred_at?: string
          id?: string
          last_occurred_at?: string
          occurrence_count?: number
          os_version?: string | null
          platform?: string
          raw_data?: Json | null
          source?: string
          stack_trace?: string | null
          status?: string
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_daily_metrics: {
        Row: {
          active_subscriptions: number
          active_users: number
          anr_count: number
          avg_session_duration_secs: number
          churned_subscriptions: number
          crash_free_users_pct: number
          crashes: number
          created_at: string
          currency: string
          dau: number
          downloads: number
          id: string
          installs: number
          mau: number
          metric_date: string
          new_subscriptions: number
          new_users: number
          platform: string
          proceeds_cents: number
          raw_data: Json | null
          retention_day_1: number
          retention_day_30: number
          retention_day_7: number
          revenue_cents: number
          screen_views: number
          sessions: number
          source: string
          subscription_revenue_cents: number
          synced_at: string
          uninstalls: number
          updated_at: string
        }
        Insert: {
          active_subscriptions?: number
          active_users?: number
          anr_count?: number
          avg_session_duration_secs?: number
          churned_subscriptions?: number
          crash_free_users_pct?: number
          crashes?: number
          created_at?: string
          currency?: string
          dau?: number
          downloads?: number
          id?: string
          installs?: number
          mau?: number
          metric_date: string
          new_subscriptions?: number
          new_users?: number
          platform: string
          proceeds_cents?: number
          raw_data?: Json | null
          retention_day_1?: number
          retention_day_30?: number
          retention_day_7?: number
          revenue_cents?: number
          screen_views?: number
          sessions?: number
          source: string
          subscription_revenue_cents?: number
          synced_at?: string
          uninstalls?: number
          updated_at?: string
        }
        Update: {
          active_subscriptions?: number
          active_users?: number
          anr_count?: number
          avg_session_duration_secs?: number
          churned_subscriptions?: number
          crash_free_users_pct?: number
          crashes?: number
          created_at?: string
          currency?: string
          dau?: number
          downloads?: number
          id?: string
          installs?: number
          mau?: number
          metric_date?: string
          new_subscriptions?: number
          new_users?: number
          platform?: string
          proceeds_cents?: number
          raw_data?: Json | null
          retention_day_1?: number
          retention_day_30?: number
          retention_day_7?: number
          revenue_cents?: number
          screen_views?: number
          sessions?: number
          source?: string
          subscription_revenue_cents?: number
          synced_at?: string
          uninstalls?: number
          updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_category: string | null
          event_count: number
          event_date: string
          event_name: string
          event_params: Json | null
          id: string
          platform: string
          raw_data: Json | null
          synced_at: string
          unique_users: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_category?: string | null
          event_count?: number
          event_date: string
          event_name: string
          event_params?: Json | null
          id?: string
          platform: string
          raw_data?: Json | null
          synced_at?: string
          unique_users?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_category?: string | null
          event_count?: number
          event_date?: string
          event_name?: string
          event_params?: Json | null
          id?: string
          platform?: string
          raw_data?: Json | null
          synced_at?: string
          unique_users?: number
          updated_at?: string
        }
        Relationships: []
      }
      analytics_reviews: {
        Row: {
          app_version: string | null
          created_at: string | null
          developer_response: string | null
          developer_response_date: string | null
          id: string
          modified_date: string | null
          platform: string
          rating: number
          raw_data: Json | null
          review_date: string
          review_id: string
          review_text: string | null
          reviewer_id: string | null
          reviewer_name: string | null
          source: string
          synced_at: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          app_version?: string | null
          created_at?: string | null
          developer_response?: string | null
          developer_response_date?: string | null
          id?: string
          modified_date?: string | null
          platform: string
          rating: number
          raw_data?: Json | null
          review_date: string
          review_id: string
          review_text?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          source: string
          synced_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          app_version?: string | null
          created_at?: string | null
          developer_response?: string | null
          developer_response_date?: string | null
          id?: string
          modified_date?: string | null
          platform?: string
          rating?: number
          raw_data?: Json | null
          review_date?: string
          review_id?: string
          review_text?: string | null
          reviewer_id?: string | null
          reviewer_name?: string | null
          source?: string
          synced_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_sync_status: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          metadata: Json | null
          records_failed: number | null
          records_synced: number | null
          source: string
          started_at: string
          status: string
          sync_end_date: string | null
          sync_start_date: string | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_failed?: number | null
          records_synced?: number | null
          source: string
          started_at: string
          status: string
          sync_end_date?: string | null
          sync_start_date?: string | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          records_failed?: number | null
          records_synced?: number | null
          source?: string
          started_at?: string
          status?: string
          sync_end_date?: string | null
          sync_start_date?: string | null
          sync_type?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_01: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_02: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_03: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_04: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_05: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_06: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_07: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_08: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_09: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_10: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_11: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_2024_12: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_01: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_02: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_03: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_04: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_05: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_06: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_07: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_08: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_09: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_10: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_11: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2025_12: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_01: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_02: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_03: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_04: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_05: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_06: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_07: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_08: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_09: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_10: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_11: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2026_12: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2027_01: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2027_02: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2027_03: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2027_04: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2027_05: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_logs_p2027_06: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string
          details: Json
          error_message: string | null
          event_id: string | null
          id: string
          organization_id: string | null
          project: string
          resource_id: string | null
          resource_type: string
          session_id: string | null
          status: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project: string
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          status?: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string
          details?: Json
          error_message?: string | null
          event_id?: string | null
          id?: string
          organization_id?: string | null
          project?: string
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          status?: string
        }
        Relationships: []
      }
      content_removal_requests: {
        Row: {
          action: string
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          status: string | null
          transfer_to_user_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action: string
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string | null
          transfer_to_user_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action?: string
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string | null
          transfer_to_user_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_removal_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_removal_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_removal_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_access_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          event_id: string
          id: string
          performed_by: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          event_id: string
          id?: string
          performed_by?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          event_id?: string
          id?: string
          performed_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_access_audit_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_access_requests: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string | null
          requested_permissions: Json
          response_message: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string | null
          requested_permissions?: Json
          response_message?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string | null
          requested_permissions?: Json
          response_message?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_access_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_agenda: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          end_time: string | null
          event_id: string
          id: string
          location: string | null
          speaker_ids: string[] | null
          start_time: string
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          end_time?: string | null
          event_id: string
          id?: string
          location?: string | null
          speaker_ids?: string[] | null
          start_time: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          end_time?: string | null
          event_id?: string
          id?: string
          location?: string | null
          speaker_ids?: string[] | null
          start_time?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_agenda_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_approval_history: {
        Row: {
          action: string
          created_at: string | null
          event_id: string
          id: string
          performed_by: string
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          event_id: string
          id?: string
          performed_by: string
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          event_id?: string
          id?: string
          performed_by?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_approval_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_collaborators: {
        Row: {
          can_edit_details: boolean | null
          can_manage_access: boolean | null
          can_manage_attendees: boolean | null
          can_manage_campaigns: boolean | null
          can_manage_certificates: boolean | null
          can_manage_checkin: boolean | null
          can_manage_content: boolean | null
          can_manage_discussion: boolean | null
          can_manage_payments: boolean | null
          can_manage_settings: boolean | null
          can_manage_tickets: boolean | null
          can_manage_volunteers: boolean | null
          can_view_analytics: boolean | null
          can_view_overview: boolean | null
          created_at: string | null
          deleted_at: string | null
          event_id: string
          granted_at: string | null
          granted_by: string
          id: string
          is_active: boolean | null
          notes: string | null
          permissions: string[] | null
          revoked_at: string | null
          status: Database["public"]["Enums"]["active_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_edit_details?: boolean | null
          can_manage_access?: boolean | null
          can_manage_attendees?: boolean | null
          can_manage_campaigns?: boolean | null
          can_manage_certificates?: boolean | null
          can_manage_checkin?: boolean | null
          can_manage_content?: boolean | null
          can_manage_discussion?: boolean | null
          can_manage_payments?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_tickets?: boolean | null
          can_manage_volunteers?: boolean | null
          can_view_analytics?: boolean | null
          can_view_overview?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          event_id: string
          granted_at?: string | null
          granted_by: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          permissions?: string[] | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["active_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_edit_details?: boolean | null
          can_manage_access?: boolean | null
          can_manage_attendees?: boolean | null
          can_manage_campaigns?: boolean | null
          can_manage_certificates?: boolean | null
          can_manage_checkin?: boolean | null
          can_manage_content?: boolean | null
          can_manage_discussion?: boolean | null
          can_manage_payments?: boolean | null
          can_manage_settings?: boolean | null
          can_manage_tickets?: boolean | null
          can_manage_volunteers?: boolean | null
          can_view_analytics?: boolean | null
          can_view_overview?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          event_id?: string
          granted_at?: string | null
          granted_by?: string
          id?: string
          is_active?: boolean | null
          notes?: string | null
          permissions?: string[] | null
          revoked_at?: string | null
          status?: Database["public"]["Enums"]["active_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_collaborators_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_faq: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          event_id: string
          id: string
          is_published: boolean | null
          question: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          is_published?: boolean | null
          question: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          is_published?: boolean | null
          question?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_faq_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_prizes: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          event_id: string
          id: string
          image_url: string | null
          name: string
          position: number | null
          prize_type: string | null
          quantity: number | null
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          event_id: string
          id?: string
          image_url?: string | null
          name: string
          position?: number | null
          prize_type?: string | null
          quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          event_id?: string
          id?: string
          image_url?: string | null
          name?: string
          position?: number | null
          prize_type?: string | null
          quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_prizes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          event_id: string
          group_id: string | null
          id: string
          is_group_leader: boolean | null
          notes: string | null
          organization_id: string | null
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          qr_code: string | null
          registration_number: string | null
          status: string | null
          ticket_id: string
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          buyer_email: string
          buyer_name: string
          buyer_phone?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          event_id: string
          group_id?: string | null
          id?: string
          is_group_leader?: boolean | null
          notes?: string | null
          organization_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          qr_code?: string | null
          registration_number?: string | null
          status?: string | null
          ticket_id: string
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          buyer_email?: string
          buyer_name?: string
          buyer_phone?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          event_id?: string
          group_id?: string | null
          id?: string
          is_group_leader?: boolean | null
          notes?: string | null
          organization_id?: string | null
          paid_at?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          qr_code?: string | null
          registration_number?: string | null
          status?: string | null
          ticket_id?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "mv_event_ticket_capacity"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      event_speakers: {
        Row: {
          bio: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          email: string | null
          event_id: string
          id: string
          is_featured: boolean | null
          name: string
          phone: string | null
          profile_image_url: string | null
          social_links: Json | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          email?: string | null
          event_id: string
          id?: string
          is_featured?: boolean | null
          name: string
          phone?: string | null
          profile_image_url?: string | null
          social_links?: Json | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          email?: string | null
          event_id?: string
          id?: string
          is_featured?: boolean | null
          name?: string
          phone?: string | null
          profile_image_url?: string | null
          social_links?: Json | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          allow_partial_group: boolean | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          description: string | null
          display_order: number | null
          event_id: string
          group_leader_required: boolean | null
          group_size: number | null
          id: string
          is_early_bird: boolean | null
          is_refundable: boolean | null
          max_purchase: number | null
          min_purchase: number | null
          name: string
          price: number
          price_type: string
          promo_code_applicable: boolean | null
          qr_enabled: boolean | null
          quantity_available: number
          quantity_reserved: number
          quantity_sold: number | null
          require_all_member_details: boolean | null
          sales_end: string | null
          sales_start: string | null
          seat_selection_enabled: boolean | null
          tax_included: boolean | null
          type: string
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          allow_partial_group?: boolean | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          event_id: string
          group_leader_required?: boolean | null
          group_size?: number | null
          id?: string
          is_early_bird?: boolean | null
          is_refundable?: boolean | null
          max_purchase?: number | null
          min_purchase?: number | null
          name: string
          price?: number
          price_type?: string
          promo_code_applicable?: boolean | null
          qr_enabled?: boolean | null
          quantity_available: number
          quantity_reserved?: number
          quantity_sold?: number | null
          require_all_member_details?: boolean | null
          sales_end?: string | null
          sales_start?: string | null
          seat_selection_enabled?: boolean | null
          tax_included?: boolean | null
          type?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          allow_partial_group?: boolean | null
          created_at?: string | null
          currency?: string | null
          deleted_at?: string | null
          description?: string | null
          display_order?: number | null
          event_id?: string
          group_leader_required?: boolean | null
          group_size?: number | null
          id?: string
          is_early_bird?: boolean | null
          is_refundable?: boolean | null
          max_purchase?: number | null
          min_purchase?: number | null
          name?: string
          price?: number
          price_type?: string
          promo_code_applicable?: boolean | null
          qr_enabled?: boolean | null
          quantity_available?: number
          quantity_reserved?: number
          quantity_sold?: number | null
          require_all_member_details?: boolean | null
          sales_end?: string | null
          sales_start?: string | null
          seat_selection_enabled?: boolean | null
          tax_included?: boolean | null
          type?: string
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          banner_url: string | null
          base_price: number | null
          category: string | null
          city: string | null
          country: string
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          description: string | null
          end_date: string
          event_type: string
          id: string
          image_url: string | null
          is_featured: boolean
          is_free: boolean
          is_private: boolean | null
          is_trending: boolean
          latitude: number | null
          longitude: number | null
          max_attendees: number | null
          metadata: Json | null
          online_link: string | null
          organization_id: string
          price: number | null
          registration_end: string | null
          registration_start: string | null
          rejected_at: string | null
          rejection_reason: string | null
          short_description: string | null
          slug: string | null
          start_date: string
          state: string | null
          status: string
          submitted_for_approval_at: string | null
          tags: Json | null
          title: string
          updated_at: string
          updated_by: string | null
          venue: string | null
          venue_address: string | null
          ownership_status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          base_price?: number | null
          category?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          end_date: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_free?: boolean
          is_private?: boolean | null
          is_trending?: boolean
          latitude?: number | null
          longitude?: number | null
          max_attendees?: number | null
          metadata?: Json | null
          online_link?: string | null
          organization_id: string
          price?: number | null
          registration_end?: string | null
          registration_start?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          short_description?: string | null
          slug?: string | null
          start_date: string
          state?: string | null
          status?: string
          submitted_for_approval_at?: string | null
          tags?: Json | null
          title: string
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
          venue_address?: string | null
          ownership_status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          banner_url?: string | null
          base_price?: number | null
          category?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string
          event_type?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_free?: boolean
          is_private?: boolean | null
          is_trending?: boolean
          latitude?: number | null
          longitude?: number | null
          max_attendees?: number | null
          metadata?: Json | null
          online_link?: string | null
          organization_id?: string
          price?: number | null
          registration_end?: string | null
          registration_start?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          short_description?: string | null
          slug?: string | null
          start_date?: string
          state?: string | null
          status?: string
          submitted_for_approval_at?: string | null
          tags?: Json | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          venue?: string | null
          venue_address?: string | null
          ownership_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          status: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          role: string
          status?: string | null
          token: string
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          status?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_invitations_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_invitations_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_invitations_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          analytics_scope: string | null
          can_approve_events: boolean | null
          can_export_reports: boolean | null
          can_manage_events: boolean | null
          can_manage_sub_orgs: boolean | null
          can_view_analytics: boolean | null
          created_at: string | null
          deleted_at: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          relationship_type: string | null
          status: Database["public"]["Enums"]["active_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analytics_scope?: string | null
          can_approve_events?: boolean | null
          can_export_reports?: boolean | null
          can_manage_events?: boolean | null
          can_manage_sub_orgs?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          relationship_type?: string | null
          status?: Database["public"]["Enums"]["active_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analytics_scope?: string | null
          can_approve_events?: boolean | null
          can_export_reports?: boolean | null
          can_manage_events?: boolean | null
          can_manage_sub_orgs?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          relationship_type?: string | null
          status?: Database["public"]["Enums"]["active_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_members_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          banner_url: string | null
          city: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          depth_level: number | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          metadata: Json | null
          name: string
          parent_org_id: string | null
          path: unknown
          phone: string | null
          slug: string
          state: string | null
          super_admin_id: string | null
          type: string
          updated_at: string | null
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          depth_level?: number | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          name: string
          parent_org_id?: string | null
          path?: unknown
          phone?: string | null
          slug: string
          state?: string | null
          super_admin_id?: string | null
          type: string
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          depth_level?: number | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          parent_org_id?: string | null
          path?: unknown
          phone?: string | null
          slug?: string
          state?: string | null
          super_admin_id?: string | null
          type?: string
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_expires_at: string | null
          ban_reason: string | null
          bio: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_banned: boolean | null
          is_verified: boolean | null
          last_login: string | null
          last_login_at: string | null
          last_login_ip: string | null
          name: string | null
          normalized_phone: string | null
          phone: string | null
          preferences: Json | null
          role: Database["public"]["Enums"]["platform_role"] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          ban_expires_at?: string | null
          ban_reason?: string | null
          bio?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id: string
          is_active?: boolean | null
          is_banned?: boolean | null
          is_verified?: boolean | null
          last_login?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          name?: string | null
          normalized_phone?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["platform_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          ban_expires_at?: string | null
          ban_reason?: string | null
          bio?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_banned?: boolean | null
          is_verified?: boolean | null
          last_login?: string | null
          last_login_at?: string | null
          last_login_ip?: string | null
          name?: string | null
          normalized_phone?: string | null
          phone?: string | null
          preferences?: Json | null
          role?: Database["public"]["Enums"]["platform_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      rate_limit_tracking: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          updated_at: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          updated_at?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      redeem_code_uses: {
        Row: {
          coin_amount: number
          created_at: string | null
          id: string
          redeem_code_id: string
          user_id: string
        }
        Insert: {
          coin_amount: number
          created_at?: string | null
          id?: string
          redeem_code_id: string
          user_id: string
        }
        Update: {
          coin_amount?: number
          created_at?: string | null
          id?: string
          redeem_code_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redeem_code_uses_redeem_code_id_fkey"
            columns: ["redeem_code_id"]
            isOneToOne: false
            referencedRelation: "redeem_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      redeem_codes: {
        Row: {
          aliases: string[] | null
          code: string
          coin_amount: number
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          metadata: Json | null
          type: string
          updated_at: string | null
        }
        Insert: {
          aliases?: string[] | null
          code: string
          coin_amount: number
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          type: string
          updated_at?: string | null
        }
        Update: {
          aliases?: string[] | null
          code?: string
          coin_amount?: number
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          total_referrals: number | null
          total_rewards: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          total_referrals?: number | null
          total_rewards?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          total_referrals?: number | null
          total_rewards?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount: number | null
          rewarded_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount?: number | null
          rewarded_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number | null
          rewarded_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      registration_field_answers: {
        Row: {
          created_at: string | null
          field_id: string
          file_url: string | null
          id: string
          registration_id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          file_url?: string | null
          id?: string
          registration_id: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          file_url?: string | null
          id?: string
          registration_id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_field_answers_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "ticket_custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_field_answers_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean
          key: string
          scope: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          key: string
          scope?: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          key?: string
          scope?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      ticket_custom_fields: {
        Row: {
          applies_to_ticket_ids: string[] | null
          created_at: string | null
          default_value: string | null
          display_order: number | null
          event_id: string
          field_type: string
          help_text: string | null
          id: string
          is_required: boolean | null
          label: string
          options_json: Json | null
          placeholder: string | null
          updated_at: string | null
          validation_rules: Json | null
        }
        Insert: {
          applies_to_ticket_ids?: string[] | null
          created_at?: string | null
          default_value?: string | null
          display_order?: number | null
          event_id: string
          field_type: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          label: string
          options_json?: Json | null
          placeholder?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Update: {
          applies_to_ticket_ids?: string[] | null
          created_at?: string | null
          default_value?: string | null
          display_order?: number | null
          event_id?: string
          field_type?: string
          help_text?: string | null
          id?: string
          is_required?: boolean | null
          label?: string
          options_json?: Json | null
          placeholder?: string | null
          updated_at?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_custom_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_2024_01: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_2024_02: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_2024_03: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_2024_04: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_2024_05: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_2024_06: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_2024_07: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_2024_08: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_2024_09: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_2024_10: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_2024_11: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_2024_12: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_01: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_02: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_03: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_04: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_05: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_06: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_07: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_08: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_09: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_10: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_11: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      transactions_p2025_12: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          delta: number
          description: string
          id: string
          idempotency_key: string
          metadata: Json
          reference_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          delta: number
          description: string
          id?: string
          idempotency_key: string
          metadata?: Json
          reference_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          delta?: number
          description?: string
          id?: string
          idempotency_key?: string
          metadata?: Json
          reference_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      user_access: {
        Row: {
          created_at: string
          deleted_at: string | null
          event_id: string | null
          expires_at: string | null
          granted_by: string | null
          id: string
          metadata: Json
          organization_id: string | null
          role_id: string
          role_scope: string
          scope: Database["public"]["Enums"]["role_scope"] | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          event_id?: string | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          role_id: string
          role_scope: string
          scope?: Database["public"]["Enums"]["role_scope"] | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          event_id?: string | null
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          metadata?: Json
          organization_id?: string | null
          role_id?: string
          role_scope?: string
          scope?: Database["public"]["Enums"]["role_scope"] | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_access_event_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_access_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_access_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_access_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_access_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_access_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "access_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_access_audit_log: {
        Row: {
          action: string
          change_details: Json
          created_at: string
          event_id: string | null
          id: string
          new_status: string | null
          old_status: string | null
          organization_id: string | null
          performed_by: string | null
          role_id: string
          user_access_id: string
          user_id: string
        }
        Insert: {
          action: string
          change_details?: Json
          created_at?: string
          event_id?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          organization_id?: string | null
          performed_by?: string | null
          role_id: string
          user_access_id: string
          user_id: string
        }
        Update: {
          action?: string
          change_details?: Json
          created_at?: string
          event_id?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          organization_id?: string | null
          performed_by?: string | null
          role_id?: string
          user_access_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          app_version: string | null
          created_at: string | null
          deleted_at: string | null
          device_fingerprint: string | null
          device_model: string | null
          device_name: string
          device_token: string
          device_type: string
          first_seen: string | null
          first_seen_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_active: string | null
          last_active_at: string | null
          os_version: string | null
          push_enabled: boolean | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string | null
          deleted_at?: string | null
          device_fingerprint?: string | null
          device_model?: string | null
          device_name: string
          device_token: string
          device_type: string
          first_seen?: string | null
          first_seen_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active?: string | null
          last_active_at?: string | null
          os_version?: string | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string | null
          deleted_at?: string | null
          device_fingerprint?: string | null
          device_model?: string | null
          device_name?: string
          device_token?: string
          device_type?: string
          first_seen?: string | null
          first_seen_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active?: string | null
          last_active_at?: string | null
          os_version?: string | null
          push_enabled?: boolean | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          attempt_count: number
          created_at: string | null
          direction: string
          error_code: string | null
          error_message: string | null
          event_id: string | null
          from_phone: string
          id: string
          last_attempted_at: string | null
          message: string
          next_retry_at: string | null
          organization_id: string | null
          status: string
          to_phone: string
          updated_at: string | null
          user_id: string | null
          wamid: string | null
        }
        Insert: {
          attempt_count?: number
          created_at?: string | null
          direction: string
          error_code?: string | null
          error_message?: string | null
          event_id?: string | null
          from_phone: string
          id?: string
          last_attempted_at?: string | null
          message: string
          next_retry_at?: string | null
          organization_id?: string | null
          status?: string
          to_phone: string
          updated_at?: string | null
          user_id?: string | null
          wamid?: string | null
        }
        Update: {
          attempt_count?: number
          created_at?: string | null
          direction?: string
          error_code?: string | null
          error_message?: string | null
          event_id?: string | null
          from_phone?: string
          id?: string
          last_attempted_at?: string | null
          message?: string
          next_retry_at?: string | null
          organization_id?: string | null
          status?: string
          to_phone?: string
          updated_at?: string | null
          user_id?: string | null
          wamid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_org_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: string
          components: Json
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string
          last_synced_at: string | null
          meta_quality_score: string | null
          meta_status: string | null
          meta_template_id: string | null
          name: string
          parameter_format: string
          updated_at: string | null
          variables: string[] | null
          template_type: string | null
          message_send_ttl_seconds: number | null
        }
        Insert: {
          category?: string
          components?: Json
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string
          last_synced_at?: string | null
          meta_quality_score?: string | null
          meta_status?: string | null
          meta_template_id?: string | null
          name: string
          parameter_format?: string
          updated_at?: string | null
          variables?: string[] | null
          template_type?: string | null
          message_send_ttl_seconds?: number | null
        }
        Update: {
          category?: string
          components?: Json
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string
          last_synced_at?: string | null
          meta_quality_score?: string | null
          meta_status?: string | null
          meta_template_id?: string | null
          name?: string
          parameter_format?: string
          updated_at?: string | null
          variables?: string[] | null
          template_type?: string | null
          message_send_ttl_seconds?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      active_whatsapp_templates: {
        Row: {
          category: string | null
          components: Json | null
          content: string | null
          created_at: string | null
          id: string | null
          language: string | null
          last_synced_at: string | null
          meta_quality_score: string | null
          meta_status: string | null
          meta_template_id: string | null
          name: string | null
          parameter_format: string | null
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          category?: string | null
          components?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          language?: string | null
          last_synced_at?: string | null
          meta_quality_score?: string | null
          meta_status?: string | null
          meta_template_id?: string | null
          name?: string | null
          parameter_format?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          category?: string | null
          components?: Json | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          language?: string | null
          last_synced_at?: string | null
          meta_quality_score?: string | null
          meta_status?: string | null
          meta_template_id?: string | null
          name?: string | null
          parameter_format?: string | null
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      analytics_crashes_2025_view: {
        Row: {
          affected_users: number | null
          app_version: string | null
          crash_date: string | null
          crash_id: string | null
          crash_type: string | null
          created_at: string | null
          device_model: string | null
          error_message: string | null
          exception_type: string | null
          first_occurred_at: string | null
          id: string | null
          last_occurred_at: string | null
          occurrence_count: number | null
          os_version: string | null
          platform: string | null
          raw_data: Json | null
          source: string | null
          stack_trace: string | null
          status: string | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          affected_users?: number | null
          app_version?: string | null
          crash_date?: string | null
          crash_id?: string | null
          crash_type?: string | null
          created_at?: string | null
          device_model?: string | null
          error_message?: string | null
          exception_type?: string | null
          first_occurred_at?: string | null
          id?: string | null
          last_occurred_at?: string | null
          occurrence_count?: number | null
          os_version?: string | null
          platform?: string | null
          raw_data?: Json | null
          source?: string | null
          stack_trace?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          affected_users?: number | null
          app_version?: string | null
          crash_date?: string | null
          crash_id?: string | null
          crash_type?: string | null
          created_at?: string | null
          device_model?: string | null
          error_message?: string | null
          exception_type?: string | null
          first_occurred_at?: string | null
          id?: string | null
          last_occurred_at?: string | null
          occurrence_count?: number | null
          os_version?: string | null
          platform?: string | null
          raw_data?: Json | null
          source?: string | null
          stack_trace?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_crashes_2026_view: {
        Row: {
          affected_users: number | null
          app_version: string | null
          crash_date: string | null
          crash_id: string | null
          crash_type: string | null
          created_at: string | null
          device_model: string | null
          error_message: string | null
          exception_type: string | null
          first_occurred_at: string | null
          id: string | null
          last_occurred_at: string | null
          occurrence_count: number | null
          os_version: string | null
          platform: string | null
          raw_data: Json | null
          source: string | null
          stack_trace: string | null
          status: string | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          affected_users?: number | null
          app_version?: string | null
          crash_date?: string | null
          crash_id?: string | null
          crash_type?: string | null
          created_at?: string | null
          device_model?: string | null
          error_message?: string | null
          exception_type?: string | null
          first_occurred_at?: string | null
          id?: string | null
          last_occurred_at?: string | null
          occurrence_count?: number | null
          os_version?: string | null
          platform?: string | null
          raw_data?: Json | null
          source?: string | null
          stack_trace?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          affected_users?: number | null
          app_version?: string | null
          crash_date?: string | null
          crash_id?: string | null
          crash_type?: string | null
          created_at?: string | null
          device_model?: string | null
          error_message?: string | null
          exception_type?: string | null
          first_occurred_at?: string | null
          id?: string | null
          last_occurred_at?: string | null
          occurrence_count?: number | null
          os_version?: string | null
          platform?: string | null
          raw_data?: Json | null
          source?: string | null
          stack_trace?: string | null
          status?: string | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_daily_metrics_2025_view: {
        Row: {
          active_subscriptions: number | null
          active_users: number | null
          anr_count: number | null
          avg_session_duration_secs: number | null
          churned_subscriptions: number | null
          crash_free_users_pct: number | null
          crashes: number | null
          created_at: string | null
          currency: string | null
          dau: number | null
          downloads: number | null
          id: string | null
          installs: number | null
          mau: number | null
          metric_date: string | null
          new_subscriptions: number | null
          new_users: number | null
          platform: string | null
          proceeds_cents: number | null
          raw_data: Json | null
          retention_day_1: number | null
          retention_day_30: number | null
          retention_day_7: number | null
          revenue_cents: number | null
          screen_views: number | null
          sessions: number | null
          source: string | null
          subscription_revenue_cents: number | null
          synced_at: string | null
          uninstalls: number | null
          updated_at: string | null
        }
        Insert: {
          active_subscriptions?: number | null
          active_users?: number | null
          anr_count?: number | null
          avg_session_duration_secs?: number | null
          churned_subscriptions?: number | null
          crash_free_users_pct?: number | null
          crashes?: number | null
          created_at?: string | null
          currency?: string | null
          dau?: number | null
          downloads?: number | null
          id?: string | null
          installs?: number | null
          mau?: number | null
          metric_date?: string | null
          new_subscriptions?: number | null
          new_users?: number | null
          platform?: string | null
          proceeds_cents?: number | null
          raw_data?: Json | null
          retention_day_1?: number | null
          retention_day_30?: number | null
          retention_day_7?: number | null
          revenue_cents?: number | null
          screen_views?: number | null
          sessions?: number | null
          source?: string | null
          subscription_revenue_cents?: number | null
          synced_at?: string | null
          uninstalls?: number | null
          updated_at?: string | null
        }
        Update: {
          active_subscriptions?: number | null
          active_users?: number | null
          anr_count?: number | null
          avg_session_duration_secs?: number | null
          churned_subscriptions?: number | null
          crash_free_users_pct?: number | null
          crashes?: number | null
          created_at?: string | null
          currency?: string | null
          dau?: number | null
          downloads?: number | null
          id?: string | null
          installs?: number | null
          mau?: number | null
          metric_date?: string | null
          new_subscriptions?: number | null
          new_users?: number | null
          platform?: string | null
          proceeds_cents?: number | null
          raw_data?: Json | null
          retention_day_1?: number | null
          retention_day_30?: number | null
          retention_day_7?: number | null
          revenue_cents?: number | null
          screen_views?: number | null
          sessions?: number | null
          source?: string | null
          subscription_revenue_cents?: number | null
          synced_at?: string | null
          uninstalls?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_daily_metrics_2026_view: {
        Row: {
          active_subscriptions: number | null
          active_users: number | null
          anr_count: number | null
          avg_session_duration_secs: number | null
          churned_subscriptions: number | null
          crash_free_users_pct: number | null
          crashes: number | null
          created_at: string | null
          currency: string | null
          dau: number | null
          downloads: number | null
          id: string | null
          installs: number | null
          mau: number | null
          metric_date: string | null
          new_subscriptions: number | null
          new_users: number | null
          platform: string | null
          proceeds_cents: number | null
          raw_data: Json | null
          retention_day_1: number | null
          retention_day_30: number | null
          retention_day_7: number | null
          revenue_cents: number | null
          screen_views: number | null
          sessions: number | null
          source: string | null
          subscription_revenue_cents: number | null
          synced_at: string | null
          uninstalls: number | null
          updated_at: string | null
        }
        Insert: {
          active_subscriptions?: number | null
          active_users?: number | null
          anr_count?: number | null
          avg_session_duration_secs?: number | null
          churned_subscriptions?: number | null
          crash_free_users_pct?: number | null
          crashes?: number | null
          created_at?: string | null
          currency?: string | null
          dau?: number | null
          downloads?: number | null
          id?: string | null
          installs?: number | null
          mau?: number | null
          metric_date?: string | null
          new_subscriptions?: number | null
          new_users?: number | null
          platform?: string | null
          proceeds_cents?: number | null
          raw_data?: Json | null
          retention_day_1?: number | null
          retention_day_30?: number | null
          retention_day_7?: number | null
          revenue_cents?: number | null
          screen_views?: number | null
          sessions?: number | null
          source?: string | null
          subscription_revenue_cents?: number | null
          synced_at?: string | null
          uninstalls?: number | null
          updated_at?: string | null
        }
        Update: {
          active_subscriptions?: number | null
          active_users?: number | null
          anr_count?: number | null
          avg_session_duration_secs?: number | null
          churned_subscriptions?: number | null
          crash_free_users_pct?: number | null
          crashes?: number | null
          created_at?: string | null
          currency?: string | null
          dau?: number | null
          downloads?: number | null
          id?: string | null
          installs?: number | null
          mau?: number | null
          metric_date?: string | null
          new_subscriptions?: number | null
          new_users?: number | null
          platform?: string | null
          proceeds_cents?: number | null
          raw_data?: Json | null
          retention_day_1?: number | null
          retention_day_30?: number | null
          retention_day_7?: number | null
          revenue_cents?: number | null
          screen_views?: number | null
          sessions?: number | null
          source?: string | null
          subscription_revenue_cents?: number | null
          synced_at?: string | null
          uninstalls?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_events_2025_view: {
        Row: {
          created_at: string | null
          event_category: string | null
          event_count: number | null
          event_date: string | null
          event_name: string | null
          event_params: Json | null
          id: string | null
          platform: string | null
          raw_data: Json | null
          synced_at: string | null
          unique_users: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_category?: string | null
          event_count?: number | null
          event_date?: string | null
          event_name?: string | null
          event_params?: Json | null
          id?: string | null
          platform?: string | null
          raw_data?: Json | null
          synced_at?: string | null
          unique_users?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_category?: string | null
          event_count?: number | null
          event_date?: string | null
          event_name?: string | null
          event_params?: Json | null
          id?: string | null
          platform?: string | null
          raw_data?: Json | null
          synced_at?: string | null
          unique_users?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_events_2026_view: {
        Row: {
          created_at: string | null
          event_category: string | null
          event_count: number | null
          event_date: string | null
          event_name: string | null
          event_params: Json | null
          id: string | null
          platform: string | null
          raw_data: Json | null
          synced_at: string | null
          unique_users: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_category?: string | null
          event_count?: number | null
          event_date?: string | null
          event_name?: string | null
          event_params?: Json | null
          id?: string | null
          platform?: string | null
          raw_data?: Json | null
          synced_at?: string | null
          unique_users?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_category?: string | null
          event_count?: number | null
          event_date?: string | null
          event_name?: string | null
          event_params?: Json | null
          id?: string | null
          platform?: string | null
          raw_data?: Json | null
          synced_at?: string | null
          unique_users?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_recent_reviews: {
        Row: {
          app_version: string | null
          has_response: boolean | null
          platform: string | null
          rating: number | null
          review_date: string | null
          review_text: string | null
          reviewer_name: string | null
          title: string | null
        }
        Relationships: []
      }
      audit_logs_2025_01_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_02_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_03_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_04_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_05_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_06_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_07_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_08_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_09_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_10_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_11_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2025_12_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_01_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_02_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_03_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_04_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_05_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      audit_logs_2026_06_view: {
        Row: {
          action: string | null
          actor_email: string | null
          actor_id: string | null
          actor_ip: unknown
          actor_user_agent: string | null
          created_at: string | null
          details: Json | null
          error_message: string | null
          event_id: string | null
          id: string | null
          organization_id: string | null
          project: string | null
          resource_id: string | null
          resource_type: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          action?: string | null
          actor_email?: string | null
          actor_id?: string | null
          actor_ip?: unknown
          actor_user_agent?: string | null
          created_at?: string | null
          details?: Json | null
          error_message?: string | null
          event_id?: string | null
          id?: string | null
          organization_id?: string | null
          project?: string | null
          resource_id?: string | null
          resource_type?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      mv_event_ticket_capacity: {
        Row: {
          currency: string | null
          event_id: string | null
          is_sold_out: boolean | null
          price: number | null
          quantity_available: number | null
          quantity_remaining: number | null
          quantity_reserved: number | null
          quantity_sold: number | null
          sales_end: string | null
          sales_start: string | null
          ticket_id: string | null
          ticket_name: string | null
          visibility: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_org_hierarchy: {
        Row: {
          depth_level: number | null
          direct_children_count: number | null
          id: string | null
          is_active: boolean | null
          member_count: number | null
          name: string | null
          parent_org_id: string | null
          path: unknown
          slug: string | null
          total_events: number | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_hierarchy: {
        Row: {
          depth_level: number | null
          event_count: number | null
          id: string | null
          is_active: boolean | null
          member_count: number | null
          name: string | null
          parent_org_id: string | null
          slug: string | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "mv_org_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organization_hierarchy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_2025_q1_view: {
        Row: {
          amount: number | null
          balance_after: number | null
          created_at: string | null
          delta: number | null
          description: string | null
          id: string | null
          idempotency_key: string | null
          metadata: Json | null
          reference_id: string | null
          type: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_2025_q2_view: {
        Row: {
          amount: number | null
          balance_after: number | null
          created_at: string | null
          delta: number | null
          description: string | null
          id: string | null
          idempotency_key: string | null
          metadata: Json | null
          reference_id: string | null
          type: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_2025_q3_view: {
        Row: {
          amount: number | null
          balance_after: number | null
          created_at: string | null
          delta: number | null
          description: string | null
          id: string | null
          idempotency_key: string | null
          metadata: Json | null
          reference_id: string | null
          type: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_2025_q4_view: {
        Row: {
          amount: number | null
          balance_after: number | null
          created_at: string | null
          delta: number | null
          description: string | null
          id: string | null
          idempotency_key: string | null
          metadata: Json | null
          reference_id: string | null
          type: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_2026_q1_view: {
        Row: {
          amount: number | null
          balance_after: number | null
          created_at: string | null
          delta: number | null
          description: string | null
          id: string | null
          idempotency_key: string | null
          metadata: Json | null
          reference_id: string | null
          type: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_2026_q2_view: {
        Row: {
          amount: number | null
          balance_after: number | null
          created_at: string | null
          delta: number | null
          description: string | null
          id: string | null
          idempotency_key: string | null
          metadata: Json | null
          reference_id: string | null
          type: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number | null
          balance_after?: number | null
          created_at?: string | null
          delta?: number | null
          description?: string | null
          id?: string | null
          idempotency_key?: string | null
          metadata?: Json | null
          reference_id?: string | null
          type?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices_summary: {
        Row: {
          active_devices: number | null
          devices: Json[] | null
          last_device_activity: string | null
          total_devices: number | null
          user_id: string | null
        }
        Relationships: []
      }
      user_roles_summary: {
        Row: {
          email: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          org_count: number | null
          org_relationships: string[] | null
          role: Database["public"]["Enums"]["platform_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_referral_with_configurable_reward: {
        Args: {
          p_referral_code: string
          p_referred_id: string
          p_referrer_id: string
        }
        Returns: Json
      }
      calculate_org_depth: { Args: { p_org_id: string }; Returns: number }
      can_manage_event: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: Json
      }
      check_user_event_access: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: boolean
      }
      cleanup_old_audit_logs: { Args: never; Returns: undefined }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      fn_apply_wallet_transaction: {
        Args: {
          p_amount: number
          p_delta: number
          p_description: string
          p_idempotency_key?: string
          p_metadata?: Json
          p_reference_id?: string
          p_type: string
          p_user_id: string
          p_wallet_id: string
        }
        Returns: string
      }
      fn_checkin_registration: {
        Args: { p_checked_in_by: string; p_registration_id: string }
        Returns: {
          buyer_email: string
          buyer_name: string
          buyer_phone: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string | null
          currency: string | null
          deleted_at: string | null
          event_id: string
          group_id: string | null
          id: string
          is_group_leader: boolean | null
          notes: string | null
          organization_id: string | null
          paid_at: string | null
          payment_id: string | null
          payment_method: string | null
          payment_status: string | null
          qr_code: string | null
          registration_number: string | null
          status: string | null
          ticket_id: string
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "event_registrations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_referral_code: {
        Args: { user_id_param: string }
        Returns: string
      }
      generate_referral_code_from_username: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_analytics_metrics: {
        Args: { p_end_date: string; p_platform?: string; p_start_date: string }
        Returns: {
          active_users: number
          downloads: number
          installs: number
          metric_date: string
          platform: string
          revenue_cents: number
          sessions: number
        }[]
      }
      get_event_stats: {
        Args: { event_id_param: string }
        Returns: {
          checked_in_count: number
          tickets_available: number
          tickets_sold: number
          total_registrations: number
          total_revenue_cents: number
        }[]
      }
      get_organization_hierarchy: {
        Args: { org_id: string }
        Returns: {
          id: string
          level: number
          name: string
          type: string
        }[]
      }
      get_organization_path: {
        Args: { org_id: string }
        Returns: {
          id: string
          level: number
          name: string
          type: string
        }[]
      }
      get_organization_stats: {
        Args: { org_id_param: string }
        Returns: {
          active_event_count: number
          event_count: number
          last_event_created: string
          member_count: number
          sub_org_count: number
          total_registrations: number
        }[]
      }
      get_pending_events_for_admin: {
        Args: { p_user_id: string }
        Returns: {
          created_by_id: string
          created_by_name: string
          event_description: string
          event_id: string
          event_title: string
          org_id: string
          org_name: string
          submitted_at: string
        }[]
      }
      get_retention_cohorts: {
        Args: { p_end_date: string; p_platform?: string; p_start_date: string }
        Returns: {
          cohort_date: string
          day_1_retention: number
          day_30_retention: number
          day_7_retention: number
          platform: string
        }[]
      }
      get_system_setting: { Args: { p_key: string }; Returns: Json }
      get_user_accessible_orgs: {
        Args: { p_relationship_filter?: string; p_user_id: string }
        Returns: {
          access_type: string
          can_manage: boolean
          depth_level: number
          org_id: string
          org_name: string
          org_slug: string
          org_type: string
          user_relationship: string
        }[]
      }
      get_user_admin_permissions: {
        Args: { p_user_id: string }
        Returns: {
          expires_at: string
          granted_at: string
          permission: string
          source: string
        }[]
      }
      get_user_event_permissions: {
        Args: { p_event_id: string; p_user_id: string }
        Returns: Json
      }
      get_user_org_hierarchy: {
        Args: { user_id_param: string }
        Returns: {
          depth_level: number
          is_super_admin: boolean
          org_id: string
          org_name: string
          org_slug: string
          org_type: string
          permissions: Json
          relationship_type: string
        }[]
      }
      get_user_permissions: {
        Args: { user_uuid: string }
        Returns: {
          can_access_admin_dashboard: boolean
          can_access_organiser_dashboard: boolean
          can_manage_all_organizations: boolean
          can_manage_users: boolean
          organizations_with_access: string[]
          role: Database["public"]["Enums"]["platform_role"]
        }[]
      }
      has_admin_permission: {
        Args: { p_permission: string; p_user_id: string }
        Returns: boolean
      }
      has_event_permission: {
        Args: { p_event_id: string; p_permission: string }
        Returns: boolean
      }
      has_org_role: {
        Args: {
          p_min_role: Database["public"]["Enums"]["org_relationship_type"]
          p_org_id: string
        }
        Returns: boolean
      }
      has_scoped_permission: {
        Args: {
          p_event_id?: string
          p_org_id?: string
          p_role_code: string
          p_user_id: string
        }
        Returns: boolean
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_details: Json
          p_error_message: string
          p_ip_address: string
          p_project: string
          p_resource_id: string
          p_resource_type: string
          p_status: string
          p_user_agent: string
          p_user_id: string
        }
        Returns: string
      }
      normalize_phone: { Args: { phone_input: string }; Returns: string }
      regenerate_referral_code: { Args: { p_user_id: string }; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      text2ltree: { Args: { "": string }; Returns: unknown }
      unaccent: { Args: { "": string }; Returns: string }
      update_profile_last_login: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      update_wallet_balance:
        | {
            Args: {
              p_amount: number
              p_description: string
              p_metadata?: Json
              p_type: string
              p_user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_amount: number
              p_description: string
              p_idempotency_key?: string
              p_metadata?: Json
              p_reference_id?: string
              p_type: string
              p_user_id: string
            }
            Returns: {
              error_message: string
              new_balance: number
              success: boolean
              transaction_id: string
            }[]
          }
      user_has_hierarchy_access: {
        Args: {
          p_org_id: string
          p_required_relationship?: string
          p_user_id: string
        }
        Returns: boolean
      }
      user_has_org_permission: {
        Args: {
          p_org_id: string
          p_required_relationship?: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      active_status: "active" | "inactive" | "suspended"
      analytics_platform: "ios" | "android" | "web" | "desktop"
      analytics_scope:
        | "none"
        | "events"
        | "organization"
        | "hierarchy"
        | "platform"
      analytics_source: "apple" | "google" | "firebase" | "internal"
      approval_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "revised"
      audit_action:
        | "insert"
        | "update"
        | "delete"
        | "soft_delete"
        | "restore"
        | "login"
        | "logout"
        | "failed_login"
        | "permission_grant"
        | "permission_revoke"
        | "permission_modify"
        | "access_requested"
        | "request_approved"
        | "request_rejected"
        | "request_cancelled"
        | "checkin"
        | "ticket_issued"
        | "payment_made"
        | "refund_issued"
        | "export"
        | "impersonate"
      content_type: "event" | "post" | "comment" | "profile" | "organization"
      crash_status: "open" | "investigating" | "resolved" | "ignored"
      crash_type: "crash" | "anr" | "exception" | "non_fatal"
      device_type: "ios" | "android" | "web" | "desktop" | "unknown"
      event_status:
        | "draft"
        | "pending"
        | "approved"
        | "rejected"
        | "published"
        | "cancelled"
        | "completed"
      event_type: "online" | "offline" | "hybrid"
      field_type:
        | "text"
        | "textarea"
        | "email"
        | "phone"
        | "number"
        | "dropdown"
        | "multi_select"
        | "radio"
        | "date"
        | "datetime"
        | "file"
        | "checkbox"
        | "url"
        | "country"
        | "id_proof_type"
        | "id_proof_upload"
      invitation_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "expired"
        | "revoked"
      org_member_role: "member" | "organizer" | "admin" | "volunteer"
      org_relationship_type: "owner" | "admin" | "member"
      org_type: "college" | "university" | "club" | "community"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
        | "partially_refunded"
      platform_role:
        | "attendee"
        | "super_admin"
        | "support"
        | "organizer"
        | "admin"
        | "org_admin"
        | "org_super_admin"
      redeem_code_type: "promotional" | "gift" | "event" | "partner" | "system"
      registration_status:
        | "confirmed"
        | "cancelled"
        | "waitlisted"
        | "checked_in"
        | "pending_payment"
        | "expired"
      removal_action: "transfer" | "delete" | "anonymize" | "archive"
      removal_status: "pending" | "approved" | "rejected" | "completed"
      role_scope: "global" | "platform" | "organization" | "event"
      sync_status: "running" | "success" | "failed" | "partial"
      ticket_price_type: "per_person" | "per_group" | "free" | "donation"
      ticket_type: "individual" | "group"
      ticket_visibility: "public" | "private" | "invite_only" | "draft"
      transaction_type:
        | "credit_earned"
        | "credit_spent"
        | "refund"
        | "referral_bonus"
        | "event_reward"
        | "purchase"
        | "admin_adjustment"
        | "expiry_deduction"
        | "earned"
        | "spent"
      wa_direction: "inbound" | "outbound"
      wa_message_status:
        | "queued"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
        | "received"
      wa_param_format: "named" | "positional"
      wa_quality_score: "GREEN" | "YELLOW" | "RED" | "UNKNOWN"
      wa_template_category: "AUTHENTICATION" | "MARKETING" | "UTILITY"
      wa_template_status:
        | "APPROVED"
        | "PENDING"
        | "REJECTED"
        | "PAUSED"
        | "DISABLED"
        | "IN_APPEAL"
        | "PENDING_DELETION"
        | "DELETED"
        | "ARCHIVED"
        | "LIMIT_EXCEEDED"
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
      active_status: ["active", "inactive", "suspended"],
      analytics_platform: ["ios", "android", "web", "desktop"],
      analytics_scope: [
        "none",
        "events",
        "organization",
        "hierarchy",
        "platform",
      ],
      analytics_source: ["apple", "google", "firebase", "internal"],
      approval_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "revised",
      ],
      audit_action: [
        "insert",
        "update",
        "delete",
        "soft_delete",
        "restore",
        "login",
        "logout",
        "failed_login",
        "permission_grant",
        "permission_revoke",
        "permission_modify",
        "access_requested",
        "request_approved",
        "request_rejected",
        "request_cancelled",
        "checkin",
        "ticket_issued",
        "payment_made",
        "refund_issued",
        "export",
        "impersonate",
      ],
      content_type: ["event", "post", "comment", "profile", "organization"],
      crash_status: ["open", "investigating", "resolved", "ignored"],
      crash_type: ["crash", "anr", "exception", "non_fatal"],
      device_type: ["ios", "android", "web", "desktop", "unknown"],
      event_status: [
        "draft",
        "pending",
        "approved",
        "rejected",
        "published",
        "cancelled",
        "completed",
      ],
      event_type: ["online", "offline", "hybrid"],
      field_type: [
        "text",
        "textarea",
        "email",
        "phone",
        "number",
        "dropdown",
        "multi_select",
        "radio",
        "date",
        "datetime",
        "file",
        "checkbox",
        "url",
        "country",
        "id_proof_type",
        "id_proof_upload",
      ],
      invitation_status: [
        "pending",
        "accepted",
        "rejected",
        "expired",
        "revoked",
      ],
      org_member_role: ["member", "organizer", "admin", "volunteer"],
      org_relationship_type: ["owner", "admin", "member"],
      org_type: ["college", "university", "club", "community"],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      platform_role: [
        "attendee",
        "super_admin",
        "support",
        "organizer",
        "admin",
        "org_admin",
        "org_super_admin",
      ],
      redeem_code_type: ["promotional", "gift", "event", "partner", "system"],
      registration_status: [
        "confirmed",
        "cancelled",
        "waitlisted",
        "checked_in",
        "pending_payment",
        "expired",
      ],
      removal_action: ["transfer", "delete", "anonymize", "archive"],
      removal_status: ["pending", "approved", "rejected", "completed"],
      role_scope: ["global", "platform", "organization", "event"],
      sync_status: ["running", "success", "failed", "partial"],
      ticket_price_type: ["per_person", "per_group", "free", "donation"],
      ticket_type: ["individual", "group"],
      ticket_visibility: ["public", "private", "invite_only", "draft"],
      transaction_type: [
        "credit_earned",
        "credit_spent",
        "refund",
        "referral_bonus",
        "event_reward",
        "purchase",
        "admin_adjustment",
        "expiry_deduction",
        "earned",
        "spent",
      ],
      wa_direction: ["inbound", "outbound"],
      wa_message_status: [
        "queued",
        "sent",
        "delivered",
        "read",
        "failed",
        "received",
      ],
      wa_param_format: ["named", "positional"],
      wa_quality_score: ["GREEN", "YELLOW", "RED", "UNKNOWN"],
      wa_template_category: ["AUTHENTICATION", "MARKETING", "UTILITY"],
      wa_template_status: [
        "APPROVED",
        "PENDING",
        "REJECTED",
        "PAUSED",
        "DISABLED",
        "IN_APPEAL",
        "PENDING_DELETION",
        "DELETED",
        "ARCHIVED",
        "LIMIT_EXCEEDED",
      ],
    },
  },
} as const
