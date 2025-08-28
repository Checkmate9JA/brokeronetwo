import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jgaknhtgpsghebhruxvt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWtuaHRncHNnaGViaHJ1eHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQyNzAsImV4cCI6MjA3MTc3MDI3MH0.8EEG20g9fvkP1OnC7L618q31T1JXx7CGYpZ8aD8lfQ8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUser() {
  const email = 'sabibanky02@gmail.com'
  
  console.log(`🔍 Checking if user ${email} already exists...`)
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
    
    if (error) {
      console.error('❌ Error checking user:', error)
      return
    }
    
    if (data && data.length > 0) {
      console.log('❌ User already exists:', data[0])
      console.log('💡 Try using a different email address')
    } else {
      console.log('✅ Email is available for registration')
    }
    
  } catch (error) {
    console.error('❌ Exception checking user:', error)
  }
}

checkUser()
