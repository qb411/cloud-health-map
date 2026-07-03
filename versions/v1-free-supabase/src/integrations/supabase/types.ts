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
      aws_health_events: {
        Row: {
          id: string
          guid: string
          title: string
          description: string | null
          pub_date: string
          region_code: string | null
          status: 'operational' | 'issue' | 'outage' | null
          source: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          guid: string
          title: string
          description?: string | null
          pub_date: string
          region_code?: string | null
          status?: 'operational' | 'issue' | 'outage' | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          guid?: string
          title?: string
          description?: string | null
          pub_date?: string
          region_code?: string | null
          status?: 'operational' | 'issue' | 'outage' | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      region_status: {
        Row: {
          region_code: string
          region_name: string
          current_status: 'operational' | 'issue' | 'outage'
          last_status_change: string | null
          last_event_id: string | null
          latitude: number
          longitude: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          region_code: string
          region_name: string
          current_status: 'operational' | 'issue' | 'outage'
          last_status_change?: string | null
          last_event_id?: string | null
          latitude: number
          longitude: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          region_code?: string
          region_name?: string
          current_status?: 'operational' | 'issue' | 'outage'
          last_status_change?: string | null
          last_event_id?: string | null
          latitude?: number
          longitude?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "region_status_last_event_id_fkey"
            columns: ["last_event_id"]
            isOneToOne: false
            referencedRelation: "aws_health_events"
            referencedColumns: ["id"]
          }
        ]
      }
      test_simulations: {
        Row: {
          id: string
          region_code: string
          simulated_status: 'issue' | 'outage'
          description: string | null
          created_by: string | null
          expires_at: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          region_code: string
          simulated_status: 'issue' | 'outage'
          description?: string | null
          created_by?: string | null
          expires_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          region_code?: string
          simulated_status?: 'issue' | 'outage'
          description?: string | null
          created_by?: string | null
          expires_at?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      recent_events_with_regions: {
        Row: {
          id: string | null
          guid: string | null
          title: string | null
          description: string | null
          pub_date: string | null
          region_code: string | null
          status: 'operational' | 'issue' | 'outage' | null
          source: string | null
          region_name: string | null
          latitude: number | null
          longitude: number | null
          created_at: string | null
          updated_at: string | null
        }
        Relationships: []
      }
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

// Helper types for the application
export type AWSHealthEvent = Database['public']['Tables']['aws_health_events']['Row']
export type RegionStatus = Database['public']['Tables']['region_status']['Row']
export type TestSimulation = Database['public']['Tables']['test_simulations']['Row']
export type RecentEventWithRegion = Database['public']['Views']['recent_events_with_regions']['Row']

// Insert types
export type AWSHealthEventInsert = Database['public']['Tables']['aws_health_events']['Insert']
export type RegionStatusInsert = Database['public']['Tables']['region_status']['Insert']
export type TestSimulationInsert = Database['public']['Tables']['test_simulations']['Insert']

// Update types
export type AWSHealthEventUpdate = Database['public']['Tables']['aws_health_events']['Update']
export type RegionStatusUpdate = Database['public']['Tables']['region_status']['Update']
export type TestSimulationUpdate = Database['public']['Tables']['test_simulations']['Update']