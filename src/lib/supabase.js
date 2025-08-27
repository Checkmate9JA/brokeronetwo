import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Supabase config:', { supabaseUrl, supabaseAnonKey: supabaseAnonKey ? '***' : 'undefined' })

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for admin operations (use carefully)
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
