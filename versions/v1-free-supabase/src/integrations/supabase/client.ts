import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We don't need user authentication for this public monitoring tool
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Limit real-time events to stay within free tier
    },
  },
})

// Helper function to check Supabase connection
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('region_status')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Supabase connection error:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Failed to connect to Supabase:', error)
    return false
  }
}

// Helper function to get database health status
export const getDatabaseHealth = async () => {
  try {
    const { data, error } = await supabase
      .from('region_status')
      .select('region_code')
      .limit(1)
    
    if (error) {
      return { healthy: false, error: error.message }
    }
    
    return { healthy: true, regionsCount: data?.length || 0 }
  } catch (error) {
    return { healthy: false, error: (error as Error).message }
  }
}