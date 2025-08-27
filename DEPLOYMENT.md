# BrokerOne Application Setup Guide

This guide will help you set up the BrokerOne application with Supabase backend for **local development**.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Supabase project created
- **IMPORTANT**: Set up Supabase database FIRST before running the React app

## Setup Order - CRITICAL!

### **Step 1: Set Up Supabase Database (Do this FIRST!)**

1. Go to your Supabase project: `https://jgaknhtgpsghebhruxvt.supabase.co`
2. Open SQL Editor
3. Run the SQL files in this **exact order**:

#### **1.1 Create Database Schema**
- Copy and paste the **entire contents** of `supabase/schema.sql`
- Click "Run" to execute

#### **1.2 Set Up RLS Policies**
- Copy and paste the **entire contents** of `supabase/rls_policies.sql`
- Click "Run" to execute

#### **1.3 Create Functions and Triggers**
- Copy and paste the **entire contents** of `supabase/functions.sql`
- Click "Run" to execute

#### **1.4 Insert Initial Data**
- Copy and paste the **entire contents** of `supabase/initial_data.sql`
- Click "Run" to execute

#### **1.5 Verify Database Setup**
Run these verification queries in SQL Editor:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT COUNT(*) as total_policies FROM pg_policies WHERE schemaname = 'public';

-- Check functions
SELECT COUNT(*) as total_functions FROM information_schema.routines WHERE routine_schema = 'public';
```

### **Step 2: Create Auth Users in Supabase Dashboard**

1. Go to **Authentication > Users** in your Supabase dashboard
2. Create these users manually:

#### **Super Admin**
- Email: `creativeco9ja@gmail.com`
- Password: `1Sabi9JA!!!`
- User UID: `765029a7-d78d-4a31-a262-6c2ecb1043a1`

#### **Admin**
- Email: `ledgercoinshield@gmail.com`
- Password: `1Declan!`
- User UID: `6c06e7d1-4b5d-492d-835d-32ee35b38adc`

#### **Regular User**
- Email: `sabibroker@gmail.com`
- Password: `1234567890`
- User UID: `69a815ac-66b9-49fe-96fe-5b4ed793a18f`

### **Step 3: Set Up React App for Local Development**

#### **3.1 Install Dependencies**
```bash
npm install
```

#### **3.2 Create Environment File**
Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://jgaknhtgpsghebhruxvt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWtuaHRncHNnaGViaHJ1eHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQyNzAsImV4cCI6MjA3MTc3MDI3MH0.8EEG20g9fvkP1OnC7L618q31T1JXx7CGYpZ8aD8lfQ8
```

#### **3.3 Run the Application**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Testing the Application

### **1. Test User Registration**
1. Go to `http://localhost:5173/Auth`
2. Click "Sign Up" tab
3. Create a new user account
4. Check Supabase Auth logs for any issues

### **2. Test Admin Access**
1. Go to `http://localhost:5173/AdminAuth`
2. Login with admin credentials: `ledgercoinshield@gmail.com` / `1Declan!`
3. Verify access to admin dashboard

### **3. Test Super Admin Access**
1. Go to `http://localhost:5173/SuperAdminAuth`
2. Login with super admin credentials: `creativeco9ja@gmail.com` / `1Sabi9JA!!!`
3. Verify full system access

## Troubleshooting

### **Common Issues**

1. **"Table doesn't exist" errors**
   - **Solution**: You haven't run the SQL files yet. Go back to Step 1.

2. **Authentication errors**
   - **Solution**: Check that auth users were created in Supabase dashboard
   - Verify environment variables are correct

3. **RLS policy errors**
   - **Solution**: Ensure RLS policies were created in the correct order
   - Check that all tables have RLS enabled

4. **Function errors**
   - **Solution**: Ensure functions were created before triggers
   - Check SQL syntax in the functions file

### **Debug Commands**

```bash
# Check Supabase connection
npm run dev

# Check build process
npm run build

# Check for linting errors
npm run lint
```

### **Database Debug Queries**

Run these in Supabase SQL Editor to diagnose issues:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check functions
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## Important Notes

- **NEVER run the React app before setting up the database**
- **Copy and paste SQL files completely** - don't use `\i` commands
- **Run SQL files in the exact order specified**
- **Verify each step** before moving to the next
- **Check Supabase logs** for any errors during setup

## Support

If you encounter issues:

1. **First**: Check that you've completed all database setup steps
2. **Second**: Verify auth users exist in Supabase dashboard
3. **Third**: Check browser console for React errors
4. **Fourth**: Check Supabase logs for database errors

The application is designed to work locally with proper database setup. Follow the steps in order and you'll have a working system!
