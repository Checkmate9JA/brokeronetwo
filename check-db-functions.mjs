import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jgaknhtgpsghebhruxvt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWtuaHRncHNnaGViaHJ1eHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQyNzAsImV4cCI6MjA3MTc3MDI3MH0.8EEG20g9fvkP1OnC7L618q31T1JXx7CGYpZ8aD8lfQ8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabaseFunctions() {
  console.log('🔍 Checking database functions and triggers...')
  
  try {
    // Check if the handle_new_user function exists
    console.log('\n1️⃣ Checking handle_new_user function...')
    try {
      const { data: functionData, error: functionError } = await supabase
        .rpc('handle_new_user', { user_record: { email: 'test@example.com', id: 'test-id' } })
      
      if (functionError) {
        console.log('ℹ️ handle_new_user function exists but has issues:', functionError.message)
      } else {
        console.log('✅ handle_new_user function working')
      }
    } catch (error) {
      console.log('❌ handle_new_user function not available or broken')
    }
    
    // Check if the get_user_profile function exists
    console.log('\n2️⃣ Checking get_user_profile function...')
    try {
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_user_profile', { user_email: 'test@example.com' })
      
      if (profileError) {
        console.log('ℹ️ get_user_profile function exists but has issues:', profileError.message)
      } else {
        console.log('✅ get_user_profile function working')
      }
    } catch (error) {
      console.log('❌ get_user_profile function not available or broken')
    }
    
    // Check if the is_admin function exists
    console.log('\n3️⃣ Checking is_admin function...')
    try {
      const { data: adminData, error: adminError } = await supabase
        .rpc('is_admin')
      
      if (adminError) {
        console.log('ℹ️ is_admin function exists but has issues:', adminError.message)
      } else {
        console.log('✅ is_admin function working')
      }
    } catch (error) {
      console.log('❌ is_admin function not available or broken')
    }
    
    // Check database schema
    console.log('\n4️⃣ Checking database schema...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%user%')
    
    if (tablesError) {
      console.log('⚠️ Could not check tables schema:', tablesError.message)
    } else {
      console.log('📋 User-related tables found:', tables.map(t => t.table_name))
    }
    
  } catch (error) {
    console.error('❌ Check failed with exception:', error)
  }
}

// Run the check
checkDatabaseFunctions()
  .then(() => {
    console.log('\n✅ Database check completed')
  })
  .catch(error => {
    console.error('❌ Database check failed:', error)
  })
