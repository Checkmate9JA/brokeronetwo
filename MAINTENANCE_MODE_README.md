# Maintenance Mode System

## Overview
The Maintenance Mode System allows **ONLY Super Administrators** to put the entire application into maintenance mode. When activated, all users (including regular admins) will see a maintenance page regardless of which page they try to visit.

**Note:** The system uses the role `super_admin` (with underscore) as defined in the database schema.

## Features

### 🔧 **Maintenance Mode Control**
- **Exclusive Super Admin Control**: Only users with `super_admin` role can enable/disable maintenance mode
- **Custom Message**: Set custom maintenance messages for users
- **Duration Estimation**: Specify estimated maintenance duration
- **Real-time Status**: Live status indicator showing current system state

### 🛡️ **Access Control**
- **Super Admins** (`super_admin` role): Can control maintenance mode AND are unaffected by it
- **Regular Admins** (`admin` role): Cannot control maintenance mode and see maintenance page when active
- **Regular Users** (`user` role): See maintenance page when mode is active
- **Unauthenticated Users**: See maintenance page when mode is active

### 📱 **User Experience**
- **Maintenance Page**: Professional, informative maintenance display
- **Status Information**: Shows start time and estimated duration
- **Responsive Design**: Works on all device sizes

## Database Setup

### 1. Run the SQL Setup
```sql
-- Execute the maintenance mode setup script
\i supabase/maintenance-mode-setup.sql
```

### 2. Database Structure
- **`maintenance_mode`** table: Stores maintenance mode settings
- **`is_maintenance_mode_active()`** function: Checks if maintenance is active
- **`get_maintenance_mode_info()`** function: Gets maintenance details
- **`toggle_maintenance_mode()`** function: Enables/disables maintenance mode (Super Admin only)

## Components

### 1. **MaintenanceMode.jsx**
- Displays maintenance page to users
- Shows custom message, start time, and estimated duration
- Professional, user-friendly interface

### 2. **MaintenanceModeControl.jsx**
- **Super Admin only** control panel for maintenance mode
- Toggle switch, message input, duration settings
- Real-time status updates
- Permission warnings for non-super admins

### 3. **useMaintenanceMode.jsx**
- React hook for checking maintenance status
- Automatically handles super admin bypass
- Provides maintenance information

## Integration

### 1. **SuperAdminDashboard Integration**
- Added "Maintenance Mode" card to System Settings
- Click to show/hide maintenance control panel
- **Exclusive to Super Admin interface**

### 2. **Routing Integration**
- Maintenance check happens at the routing level
- Affects all pages except Super Admin routes
- Seamless user experience

### 3. **WhatsApp/LiveChat Settings**
- Moved from SuperAdmin to AdminDashboard
- Added to Quick Actions section
- Accessible to all admins

## Usage

### For Super Administrators

1. **Access Control Panel**
   - Go to SuperAdminDashboard
   - Click "Maintenance Mode" in System Settings
   - Control panel will appear below

2. **Enable Maintenance Mode**
   - Toggle the switch to "Enable Maintenance Mode"
   - Enter custom message (optional)
   - Set estimated duration
   - Click "Enable Maintenance"

3. **Disable Maintenance Mode**
   - Toggle the switch to disable
   - Click "Disable Maintenance"

### For Regular Admins and Users

1. **During Maintenance**
   - All pages redirect to maintenance page
   - See custom message and estimated duration
   - Cannot access any application features
   - **Cannot disable maintenance mode**

2. **After Maintenance**
   - Normal access restored automatically by Super Admin
   - No action required from users

## Security Features

### 1. **Exclusive Super Admin Control**
- **ONLY** users with `super_admin` role can control maintenance mode
- Database functions enforce super admin role checks
- RLS policies protect maintenance settings
- Regular admins have no access to maintenance controls

### 2. **Super Admin Bypass**
- Users with `super_admin` role are never affected by maintenance mode
- Can always access the system
- Can disable maintenance mode if needed

### 3. **Audit Trail**
- Records who enabled/disabled maintenance mode
- Tracks start times and duration estimates
- Maintains history of maintenance events

## Configuration Options

### 1. **Maintenance Message**
- Custom text displayed to users
- Supports multi-line messages
- Professional, informative content

### 2. **Duration Estimation**
- Set estimated completion time
- Range: 1 minute to 24 hours (1440 minutes)
- Helps users plan their return

### 3. **Status Indicators**
- Visual status indicators
- Color-coded badges
- Real-time updates

## Troubleshooting

### 1. **Maintenance Mode Won't Enable**
- Check user role (must be `super_admin`)
- Verify database permissions
- Check console for error messages

### 2. **Users Still See Normal Pages**
- Verify maintenance mode is active in database
- Check if user has `super_admin` role
- Clear browser cache if needed

### 3. **Super Admin Can't Access**
- Check user profile role (`super_admin`)
- Verify authentication status
- Check maintenance mode hook logic

### 4. **Regular Admin Tries to Control**
- System will show permission error
- Only users with `super_admin` role can access maintenance controls
- Regular admins should contact Super Admin

## Best Practices

### 1. **Communication**
- Use clear, professional maintenance messages
- Include realistic duration estimates
- Provide alternative contact methods if needed

### 2. **Timing**
- Schedule maintenance during low-usage periods
- Communicate maintenance windows in advance
- Keep duration estimates accurate

### 3. **Access Control**
- Ensure only Super Admins have access to controls
- Regular admins should not attempt to modify maintenance settings
- Document Super Admin procedures

## Future Enhancements

### 1. **Scheduled Maintenance**
- Pre-schedule maintenance windows
- Automatic activation/deactivation
- Calendar integration

### 2. **Advanced Notifications**
- Email notifications to users
- Push notifications
- Social media announcements

### 3. **Maintenance History**
- Detailed maintenance logs
- Performance impact analysis
- User feedback collection

## Support

For technical support or questions about the maintenance mode system:
- Check database logs for errors
- Verify user permissions and roles (Super Admin only)
- Test with different user types
- Review component integration
- **Remember: Only Super Admins can control maintenance mode**
