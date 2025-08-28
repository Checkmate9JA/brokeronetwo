import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

// Enhanced logging for debugging
console.log('=== Supabase Configuration ===')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'UNDEFINED')
console.log('Service Key:', supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'UNDEFINED')
console.log('Environment:', import.meta.env.MODE)
console.log('=============================')

// Validate configuration and set final values
let finalSupabaseUrl = supabaseUrl;
let finalSupabaseAnonKey = supabaseAnonKey;
let finalSupabaseServiceKey = supabaseServiceKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration is incomplete!')
  console.error('Missing:', {
    url: !supabaseUrl ? 'VITE_SUPABASE_URL' : 'OK',
    anonKey: !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : 'OK'
  })
  
  // Fallback to hardcoded values if environment variables fail
  const fallbackUrl = 'https://jgaknhtgpsghebhruxvt.supabase.co'
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWtuaHRncHNnaGViaHJ1eHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQyNzAsImV4cCI6MjA3MTc3MDI3MH0.8EEG20g9fvkP1OnC7L618q31T1JXx7CGYpZ8aD8lfQ8'
  
  console.log('🔄 Using fallback configuration...')
  console.log('Fallback URL:', fallbackUrl)
  console.log('Fallback Key:', `${fallbackKey.substring(0, 20)}...`)
  
  // Use fallback values
  finalSupabaseUrl = fallbackUrl
  finalSupabaseAnonKey = fallbackKey
  finalSupabaseServiceKey = finalSupabaseServiceKey || 'fallback-service-key'
} else {
  console.log('✅ Using environment variables for Supabase configuration')
}

// Create clients with final values (export at top level)
export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey)
export const supabaseAdmin = createClient(finalSupabaseUrl, finalSupabaseServiceKey)

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error)
      return {
        success: false,
        error: error.message,
        details: error
      }
    }
    
    console.log('✅ Supabase connection successful!')
    return {
      success: true,
      message: 'Connected to Supabase successfully'
    }
  } catch (error) {
    console.error('❌ Supabase connection test exception:', error)
    return {
      success: false,
      error: error.message,
      details: error
    }
  }
}

// Test auth connection
export const testSupabaseAuth = async () => {
  try {
    console.log('🔍 Testing Supabase Auth...')
    
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Supabase Auth test failed:', error)
      return {
        success: false,
        error: error.message,
        details: error
      }
    }
    
    console.log('✅ Supabase Auth working!')
    return {
      success: true,
      message: 'Auth system accessible',
      session: data.session
    }
  } catch (error) {
    console.error('❌ Supabase Auth test exception:', error)
    return {
      success: false,
      error: error.message,
      details: error
    }
  }
}

// Auto-test connection on import
console.log('🚀 Auto-testing Supabase connection...')
testSupabaseConnection()
testSupabaseAuth()
