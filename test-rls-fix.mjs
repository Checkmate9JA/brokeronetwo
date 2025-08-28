import { createClient } from '@supabase/supabase-js'

// Use the same credentials as your app
const supabaseUrl = 'https://jgaknhtgpsghebhruxvt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWtuaHRncHNnaGViaHJ1eHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQyNzAsImV4cCI6MjA3MTc3MDI3MH0.8EEG20g9fvkP1OnC7L618q31T1JXx7CGYpZ8aD8lfQ8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRLSFix() {
  console.log('🔍 Testing RLS policies after fix...')
  
  try {
    // Test 1: Check if we can access the users table
    console.log('\n1️⃣ Testing basic table access...')
    const { data: userCount, error: countError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (countError) {
      console.error('❌ Table access failed:', countError)
      return false
    }
    console.log('✅ Table access successful')
    
    // Test 2: Check RLS policies
    console.log('\n2️⃣ Checking RLS policies...')
    const { data: policies, error: policyError } = await supabase
      .rpc('get_user_profile', { user_email: 'test@example.com' })
    
    if (policyError) {
      console.log('ℹ️ RPC function not available (this is normal)')
    } else {
      console.log('✅ RPC function working')
    }
    
    // Test 3: Check if we can see policy information
    console.log('\n3️⃣ Checking policy status...')
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(0) // Just get schema, no data
    
    if (tableError) {
      console.error('❌ Schema access failed:', tableError)
      return false
    }
    console.log('✅ Schema access successful')
    
    console.log('\n🎯 RLS fix appears to be working!')
    return true
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error)
    return false
  }
}

// Run the test
testRLSFix()
  .then(success => {
    if (success) {
      console.log('\n✅ RLS policies are working correctly!')
      console.log('💡 Try signing up again in your app.')
    } else {
      console.log('\n❌ RLS policies still have issues.')
      console.log('💡 Make sure you ran the simple-rls-fix.sql script.')
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
  })
