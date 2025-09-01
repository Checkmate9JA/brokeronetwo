# 🎯 Social Proof System

A comprehensive social proof notification system that shows randomized user activities from around the world to build trust and engagement.

## ✨ Features

- **🌍 Global Names**: 70+ realistic names from 50+ countries across 5 continents
- **🎭 Multiple Activity Types**: Investment, withdrawal, deposit, copy trading, profits, trades, bonuses, referrals
- **🎨 Dynamic Colors**: Each activity type has its own color scheme
- **⏰ Real-time Updates**: Notifications appear every 8-15 seconds
- **📱 Responsive Design**: Works perfectly on desktop and mobile
- **🔄 Smart Randomization**: Avoids repetition and provides variety
- **💾 Database Integration**: Optional database-driven content for more dynamic experiences

## 🚀 Quick Start

### 1. Database Setup

Run the SQL script in your Supabase SQL Editor:

```sql
-- Execute the entire social-proof-setup.sql file
-- This will create all tables, policies, and sample data
```

### 2. Component Usage

```jsx
import SocialProof from '../components/SocialProof';

// Basic usage (uses hardcoded data)
<SocialProof pageType="dashboard" />

// With database integration
<SocialProof pageType="dashboard" useDatabase={true} />
```

### 3. Page Integration

The component is already integrated into:
- ✅ Dashboard (`/dashboard`)
- ✅ Investment Plans (`/investmentplans`) 
- ✅ Trading Platform (`/tradingplatform`)

## 🗄️ Database Structure

### Tables Created

1. **`social_proof_activities`** - Stores actual user activities
2. **`social_proof_names`** - Global names with countries and flags
3. **`social_proof_activity_templates`** - Activity text templates

### Key Functions

- **`get_random_social_proof_activities()`** - Get random activities
- **`generate_dynamic_social_proof()`** - Generate dynamic content
- **`social_proof_view`** - Easy access view

## 🎨 Customization

### Activity Types & Colors

| Type | Color | Icon | Description |
|------|-------|------|-------------|
| `investment` | Green | 📈 | Investment activities |
| `withdrawal` | Blue | 📉 | Withdrawal activities |
| `deposit` | Purple | 💰 | Deposit activities |
| `copy_trade` | Orange | 📋 | Copy trading activities |
| `profit` | Emerald | 📈 | Profit activities |
| `trade` | Indigo | 👥 | Trading activities |
| `bonus` | Pink | 💰 | Bonus activities |
| `referral` | Teal | 👥 | Referral activities |

### Adding New Names

```sql
INSERT INTO social_proof_names (first_name, last_name, country, country_code, flag_emoji, region) 
VALUES ('John', 'Doe', 'New York', 'US', '🇺🇸', 'Americas');
```

### Adding New Templates

```sql
INSERT INTO social_proof_activity_templates (activity_type, template_text, placeholder_count, placeholders, priority) 
VALUES ('custom', '{name} from {country} completed {action}', 3, '["name", "country", "action"]', 8);
```

## 🔧 Configuration

### Component Props

```jsx
<SocialProof 
  pageType="dashboard"           // Page type for context
  useDatabase={false}           // Enable database integration
/>
```

### Timing Configuration

```jsx
// In SocialProof.jsx - adjust these values:

// Notification display duration
setTimeout(() => {
  setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
}, 6000); // 6 seconds

// New notification frequency
const interval = setInterval(() => {
  if (Math.random() > 0.3) { // 70% chance
    addNotification();
  }
}, 8000 + Math.random() * 7000); // 8-15 seconds
```

## 📊 Database Queries

### Get Recent Activities

```sql
SELECT * FROM social_proof_view LIMIT 10;
```

### Get Activities by Type

```sql
SELECT * FROM get_random_social_proof_activities('investment', 5);
```

### Generate Dynamic Content

```sql
SELECT * FROM generate_dynamic_social_proof('deposit');
```

## 🧹 Maintenance

### Cleanup Old Data

```sql
-- Remove activities older than 30 days
DELETE FROM social_proof_activities 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Deactivate old names
UPDATE social_proof_names 
SET is_active = false 
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Refresh Timestamps

```sql
-- Make activities appear more recent
UPDATE social_proof_activities 
SET created_at = NOW() - (RANDOM() * INTERVAL '2 hours') 
WHERE created_at < NOW() - INTERVAL '1 hour';
```

## 🌟 Sample Activities

### Investment
- "Stanley Smith from London invested in Gold Plan just now"
- "Yuki Tanaka just started Platinum Plan investment"
- "Hans Mueller from Berlin joined Diamond Plan plan"

### Financial
- "Dana Brownson from Stockholm just withdrew earnings"
- "Ronny from Rio de Janeiro just deposited $4500"
- "Sophie Dubois just cashed out $1800"

### Trading
- "Ferdinand from Barcelona just copied Alex Thompson"
- "Maria Santos opened BTC/USD position"
- "Alessandro Rossi started following Sarah Chen"

## 🔒 Security

- **RLS Policies**: All tables have Row Level Security enabled
- **Public Read**: Anyone can view social proof content
- **Admin Only**: Only admins can modify content
- **No User Data**: No real user information is stored

## 🎯 Best Practices

1. **Variety**: The system automatically randomizes names, countries, and activities
2. **Realism**: Uses realistic names and locations from actual countries
3. **Performance**: Database queries are optimized with proper indexes
4. **Scalability**: Easy to add new names, countries, and activity types
5. **Maintenance**: Regular cleanup prevents database bloat

## 🚨 Troubleshooting

### Notifications Not Showing

1. Check browser console for errors
2. Verify component is properly imported
3. Check if page is visible (not in background tab)

### Database Integration Issues

1. Verify SQL script was executed successfully
2. Check Supabase RLS policies
3. Verify function permissions

### Performance Issues

1. Reduce notification frequency
2. Limit database query results
3. Add more indexes if needed

## 🔮 Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] User interaction tracking
- [ ] A/B testing different messages
- [ ] Geographic targeting
- [ ] Activity analytics dashboard
- [ ] Custom notification themes

## 📝 License

This social proof system is part of the brokeronetwo project and follows the same licensing terms.

---

**Need Help?** Check the database logs or component console output for detailed error information.
