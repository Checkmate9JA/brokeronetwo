# BrokerOne Supabase Database Setup

## Overview
This directory contains the SQL files needed to set up the BrokerOne database in Supabase.

## Files
- `schema.sql` - Database schema and table definitions
- `setup.sql` - Functions, triggers, and RLS policies (NEW - run this after schema.sql)
- `rls_policies.sql` - Row Level Security policies for other tables
- `initial_data.sql` - Sample data including admin users
- `functions.sql` - Additional database functions

## Setup Order (IMPORTANT)
1. **First**: Run `schema.sql` to create tables
2. **Second**: Run `setup.sql` to create functions and fix RLS policies
3. **Third**: Run `rls_policies.sql` for other table policies
4. **Fourth**: Run `initial_data.sql` to insert sample data
5. **Finally**: Run `functions.sql` for additional functions

## Authentication Issues Fixed

### 1. User Signup Failing
- **Problem**: RLS policies were too restrictive, preventing new user registration
- **Solution**: Created `handle_new_user()` trigger function that automatically creates user profiles
- **Result**: Users can now sign up successfully

### 2. Admin/Super Admin Access Denied
- **Problem**: User profiles not found due to RLS policy conflicts
- **Solution**: Created `get_user_profile()` function with `SECURITY DEFINER` to bypass RLS
- **Result**: Admin and Super Admin users can now authenticate properly

### 3. Profile Fetching Issues
- **Problem**: Direct table access was blocked by RLS
- **Solution**: Implemented fallback mechanism in AuthContext
- **Result**: User profiles load correctly even when RLS is strict

## Key Functions

### `handle_new_user()`
- Automatically creates user profile when someone signs up
- Runs with `SECURITY DEFINER` to bypass RLS restrictions
- Sets default role to 'user'

### `get_user_profile(user_email)`
- Safely fetches user profile data
- Bypasses RLS for authentication purposes
- Returns complete user profile information

## RLS Policies
- Users can view/update their own profiles
- Admins can view/update all users
- New user registration is allowed via trigger
- All policies are properly configured to avoid conflicts

## Testing
After setup, test with:
1. **Regular user signup** - Should work without database errors
2. **Admin login** - Should authenticate and find user profile
3. **Super Admin login** - Should authenticate and find user profile
4. **Profile loading** - Should work for all user types

## Troubleshooting
If you still have issues:
1. Check that `setup.sql` was run after `schema.sql`
2. Verify the trigger function exists: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';`
3. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'users';`
4. Ensure functions exist: `SELECT * FROM information_schema.routines WHERE routine_name IN ('handle_new_user', 'get_user_profile');`
