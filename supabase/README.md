# BrokerOne Supabase Setup

This directory contains all the SQL files needed to set up your BrokerOne application database in Supabase.

## Prerequisites

- Supabase project already created
- Supabase Auth enabled
- Access to Supabase SQL Editor

## Setup Instructions

### 1. Create Database Schema

First, run the main schema file to create all tables, types, and indexes:

```sql
-- Run this in Supabase SQL Editor
\i supabase/schema.sql
```

### 2. Set Up Row Level Security (RLS)

Enable RLS policies for all tables:

```sql
-- Run this in Supabase SQL Editor
\i supabase/rls_policies.sql
```

### 3. Create Functions and Triggers

Set up business logic functions and automation:

```sql
-- Run this in Supabase SQL Editor
\i supabase/functions.sql
```

### 4. Insert Initial Data

Add sample data and initial users:

```sql
-- Run this in Supabase SQL Editor
\i supabase/initial_data.sql
```

### 5. Set Up Auth Users

In your Supabase dashboard, go to Authentication > Users and create these users:

#### Super Admin
- Email: `creativeco9ja@gmail.com`
- Password: `1Sabi9JA!!!`
- User UID: `765029a7-d78d-4a31-a262-6c2ecb1043a1`

#### Admin
- Email: `ledgercoinshield@gmail.com`
- Password: `1Declan!`
- User UID: `6c06e7d1-4b5d-492d-835d-32ee35b38adc`

#### Regular User
- Email: `sabibroker@gmail.com`
- Password: `1234567890`
- User UID: `69a815ac-66b9-49fe-96fe-5b4ed793a18f`

### 6. Verify Setup

Check that all tables are created and RLS is enabled:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## Database Structure

### Core Tables

1. **users** - User profiles and wallet balances
2. **transactions** - All financial transactions
3. **investment_plans** - Available investment options
4. **user_investments** - User investment records
5. **trading_instruments** - Trading asset types
6. **trading_symbols** - Specific trading pairs/assets
7. **trading_positions** - User trading positions
8. **expert_traders** - Professional trader profiles
9. **trades** - Trader activity records
10. **wallet_submissions** - User wallet verification
11. **payment_settings** - Payment method configurations
12. **managed_wallets** - Supported wallet types
13. **admin_settings** - System configuration
14. **chat_settings** - Communication options

### Key Features

- **Row Level Security (RLS)** - Ensures users can only access their own data
- **Automatic balance updates** - Triggers update total_balance when wallets change
- **Investment maturity handling** - Automatic profit calculation and distribution
- **Transaction processing** - Automatic wallet updates based on transaction status
- **Trading position management** - Real-time P&L calculation
- **User profile creation** - Automatic profile creation after auth signup

## Security

- All tables have RLS enabled
- Users can only access their own data
- Admins can view and manage all data
- Super admins have full system access
- Sensitive operations require proper authentication

## API Usage

The database is designed to work with the Supabase JavaScript client:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, anonKey)

// Example: Get user profile
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', userEmail)
  .single()

// Example: Get user dashboard stats
const { data, error } = await supabase
  .rpc('get_user_dashboard_stats', { p_user_email: userEmail })
```

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Ensure all policies are created before enabling RLS
2. **Function Errors**: Check that all functions are created before creating triggers
3. **Auth Integration**: Verify that the `handle_new_user` trigger is working correctly

### Debug Queries

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check functions
SELECT routine_name, routine_type, data_type
FROM information_schema.routines
WHERE routine_schema = 'public';
```

## Support

If you encounter any issues during setup, check:

1. Supabase logs in the dashboard
2. SQL Editor error messages
3. RLS policy conflicts
4. Function syntax errors

The database is designed to be production-ready with proper security, performance optimization, and business logic automation.
