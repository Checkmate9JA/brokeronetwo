// Simple Supabase connection test script
// Run with: node test-supabase.mjs

import { createClient } from '@supabase/supabase-js'

// Configuration
const supabaseUrl = 'https://jgaknhtgpsghebhruxvt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWtuaHRncHNnaGViaHJ1eHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQyNzAsImV4cCI6MjA3MTc3MDI3MH0.8EEG20g9fvkP1OnC7L618q31T1JXx7CGYpZ8aD8lfQ8'

console.log('🔍 Testing Supabase Connection...')
console.log('URL:', supabaseUrl)
console.log('Anon Key:', `${supabaseAnonKey.substring(0, 30)}...`)
console.log('')

// Create client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('1️⃣ Testing basic connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      console.error('Details:', error)
      return false
    }
    
    console.log('✅ Database connection successful!')
    return true
    
  } catch (error) {
    console.error('❌ Connection test exception:', error.message)
    return false
  }
}

async function testAuth() {
  try {
    console.log('2️⃣ Testing authentication system...')
    
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Auth system failed:', error.message)
      console.error('Details:', error)
      return false
    }
    
    console.log('✅ Auth system accessible!')
    console.log('Session:', data.session ? 'Active' : 'None')
    return true
    
  } catch (error) {
    console.error('❌ Auth test exception:', error.message)
    return false
  }
}

async function testTables() {
  try {
    console.log('3️⃣ Testing table access...')
    
    // Test if we can access the users table
    const { data, error } = await supabase
      .from('users')
      .select('email, role')
      .limit(5)
    
    if (error) {
      console.error('❌ Table access failed:', error.message)
      console.error('Details:', error)
      return false
    }
    
    console.log('✅ Table access successful!')
    console.log(`Found ${data.length} users`)
    if (data.length > 0) {
      console.log('Sample users:', data.map(u => ({ email: u.email, role: u.role })))
    }
    return true
    
  } catch (error) {
    console.error('❌ Table test exception:', error.message)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting Supabase connection tests...\n')
  
  const results = {
    connection: await testConnection(),
    auth: await testAuth(),
    tables: await testTables()
  }
  
  console.log('\n📊 Test Results:')
  console.log('================')
  console.log(`Database Connection: ${results.connection ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Authentication: ${results.auth ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Table Access: ${results.tables ? '✅ PASS' : '❌ FAIL'}`)
  
  const allPassed = Object.values(results).every(r => r)
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Supabase is properly connected.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.')
  }
  
  return allPassed
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  })
