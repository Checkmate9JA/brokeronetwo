# BrokerOne Application Deployment Guide

This guide will help you deploy the BrokerOne application with Supabase backend.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Supabase project created
- GitHub account (for Codespaces)

## Option 1: Deploy to GitHub Codespaces (Recommended)

### 1. Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit: BrokerOne application with Supabase integration"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Open in GitHub Codespaces

1. Go to your GitHub repository
2. Click the green "Code" button
3. Select "Codespaces" tab
4. Click "Create codespace on main"

### 3. Install Dependencies

```bash
npm install
```

### 4. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=https://jgaknhtgpsghebhruxvt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYWtuaHRncHNnaGViaHJ1eHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTQyNzAsImV4cCI6MjA3MTc3MDI3MH0.8EEG20g9fvkP1OnC7L618q31T1JXx7CGYpZ8aD8lfQ8
```

### 5. Run the Application

```bash
npm run dev
```

The application will be available at the Codespaces URL provided.

## Option 2: Deploy to Vercel

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
vercel
```

Follow the prompts to configure your deployment.

### 3. Set Environment Variables

In your Vercel dashboard, go to Settings > Environment Variables and add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Option 3: Deploy to Netlify

### 1. Build the Application

```bash
npm run build
```

### 2. Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `dist` folder from your build
3. Or connect your GitHub repository for automatic deployments

### 3. Set Environment Variables

In your Netlify dashboard, go to Site settings > Environment variables and add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Supabase Setup

### 1. Run the Complete Setup Script

In your Supabase SQL Editor, run:

```sql
-- Copy and paste the contents of supabase/setup.sql
-- This will create all tables, policies, and sample data
```

### 2. Create Auth Users

In Supabase Dashboard > Authentication > Users, create:

- **Super Admin**: `creativeco9ja@gmail.com` / `1Sabi9JA!!!`
- **Admin**: `ledgercoinshield@gmail.com` / `1Declan!`
- **User**: `sabibroker@gmail.com` / `1234567890`

### 3. Verify Setup

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

## Application Features

### Authentication Routes

- `/Auth` - User login/signup (Login + Sign Up tabs)
- `/AdminAuth` - Admin login only
- `/SuperAdminAuth` - Super Admin login only

### Main Routes

- `/Dashboard` - User dashboard
- `/InvestmentPlans` - Investment opportunities
- `/TradingPlatform` - Trading interface
- `/AdminDashboard` - Admin panel
- `/SuperAdminDashboard` - Super admin panel

### Role-Based Access

- **Users**: Can access dashboard, investments, trading
- **Admins**: Can manage users, transactions, investments
- **Super Admins**: Full system access and user management

## Testing the Application

### 1. Test User Registration

1. Go to `/Auth`
2. Click "Sign Up" tab
3. Create a new user account
4. Verify email (check Supabase Auth settings)

### 2. Test Admin Access

1. Go to `/AdminAuth`
2. Login with admin credentials
3. Verify access to admin dashboard

### 3. Test Super Admin Access

1. Go to `/SuperAdminAuth`
2. Login with super admin credentials
3. Verify full system access

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check Supabase URL and keys
   - Verify RLS policies are created
   - Check user roles in database

2. **Database Connection Issues**
   - Verify Supabase project is active
   - Check SQL setup was completed
   - Verify tables exist and have data

3. **Build Errors**
   - Check Node.js version (18+ required)
   - Clear node_modules and reinstall
   - Check for syntax errors in components

### Debug Commands

```bash
# Check Supabase connection
npm run dev

# Check build process
npm run build

# Check for linting errors
npm run lint
```

## Security Considerations

- All tables have RLS enabled
- Users can only access their own data
- Admins have appropriate access levels
- Sensitive operations require authentication
- API keys are environment variables

## Performance Optimization

- Database indexes are created for common queries
- RLS policies are optimized for performance
- Functions handle complex business logic
- Triggers automate data updates

## Support

If you encounter issues:

1. Check Supabase logs in dashboard
2. Verify SQL setup was completed correctly
3. Check browser console for errors
4. Verify environment variables are set

The application is production-ready with proper security, performance optimization, and comprehensive error handling.
