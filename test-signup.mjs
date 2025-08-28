import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jgaknhtgpsghebhruxvt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWtuaHRncHNnaGViaHJ1eHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQyNzAsImV4cCI6MjA3MTc3MDI3MH0.8EEG20g9fvkP1OnC7L618q31T1JXx7CGYpZ8aD8lfQ8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSignup() {
  const testEmail = 'test-signup-' + Date.now() + '@example.com'
  const testPassword = 'testpassword123'
  const testName = 'Test User'
  
  console.log('🔍 Testing signup process step by step...')
  console.log('Test email:', testEmail)
  
  try {
    // Step 1: Test Supabase Auth signup
    console.log('\n1️⃣ Testing Supabase Auth signup...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName,
        },
      },
    })
    
    if (authError) {
      console.error('❌ Auth signup failed:', authError)
      return
    }
    
    console.log('✅ Auth signup successful:', authData.user?.id)
    
    // Step 2: Test profile creation
    console.log('\n2️⃣ Testing profile creation...')
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          email: testEmail,
          full_name: testName,
          role: 'user'
        }
      ])
      .select()
    
    if (profileError) {
      console.error('❌ Profile creation failed:', profileError)
      console.error('Error code:', profileError.code)
      console.error('Error message:', profileError.message)
      console.error('Error details:', profileError.details)
      return
    }
    
    console.log('✅ Profile creation successful:', profileData)
    
    // Step 3: Clean up test user
    console.log('\n3️⃣ Cleaning up test user...')
    try {
      await supabase.auth.signOut()
      console.log('✅ Test user cleaned up')
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message)
    }
    
    console.log('\n🎯 Signup process test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error)
  }
}

// Run the test
testSignup()
  .then(() => {
    console.log('\n✅ Test completed')
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error)
  })
