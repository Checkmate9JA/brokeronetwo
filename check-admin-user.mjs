import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jgaknhtgpsghebhruxvt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWtuaHRncHNnaGViaHJ1eHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQyNzAsImV4cCI6MjA3MTc3MDI3MH0.8EEG20g9fvkP1OnC7L618q31T1JXx7CGYpZ8aD8lfQ8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdminUsers() {
  console.log('🔍 Checking admin users in database...')

  try {
    // Check all users
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*')

    if (allUsersError) {
      console.error('❌ Error fetching all users:', allUsersError)
      return
    }

    console.log(`📋 Total users found: ${allUsers.length}`)
    
    // Show all users
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.role}) - ID: ${user.id}`)
    })

    // Check specifically for admin users
    const adminUsers = allUsers.filter(user => user.role === 'admin' || user.role === 'super_admin')
    console.log(`\n👑 Admin users found: ${adminUsers.length}`)
    
    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email} (${admin.role}) - ID: ${admin.id}`)
    })

    // Check for specific admin emails
    const adminEmails = ['admin@example.com', 'superadmin@example.com'] // Add your actual admin emails
    console.log('\n🔍 Checking specific admin emails...')
    
    adminEmails.forEach(email => {
      const user = allUsers.find(u => u.email === email)
      if (user) {
        console.log(`✅ ${email} found: ${user.role}`)
      } else {
        console.log(`❌ ${email} NOT found in users table`)
      }
    })

  } catch (error) {
    console.error('❌ Check failed with exception:', error)
  }
}

// Run the check
checkAdminUsers()
  .then(() => {
    console.log('\n✅ Admin user check completed')
  })
  .catch(error => {
    console.error('❌ Admin user check failed:', error)
  })
