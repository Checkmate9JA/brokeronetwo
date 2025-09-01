import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, DollarSign, Copy, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SocialProof = ({ pageType = 'dashboard', useDatabase = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [databaseActivities, setDatabaseActivities] = useState([]);
  const [isSystemEnabled, setIsSystemEnabled] = useState(true);

  // Check if social proof system is enabled
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('get_social_proof_setting', {
        setting_key_param: 'system_enabled'
      });
      
      if (error) {
        console.warn('Failed to check social proof system status:', error);
        return;
      }
      
      setIsSystemEnabled(data === 'true');
    } catch (error) {
      console.warn('Error checking social proof system status:', error);
    }
  };

  // Load activities from database if enabled
  useEffect(() => {
    if (useDatabase && isSystemEnabled) {
      loadDatabaseActivities();
    }
  }, [useDatabase, isSystemEnabled]);

  // If system is disabled, don't render anything
  if (!isSystemEnabled) {
    return null;
  }

  const loadDatabaseActivities = async () => {
    try {
      // Try to get random activities from database
      const { data, error } = await supabase.rpc('get_random_social_proof_activities', {
        limit_count: 20
      });
      
      if (error) {
        console.warn('Failed to load database activities:', error);
        return;
      }
      
      if (data && data.length > 0) {
        setDatabaseActivities(data);
      }
    } catch (error) {
      console.warn('Error loading database activities:', error);
    }
  };

  // Generate a random social proof notification
  const generateNotification = useCallback(() => {
    // If using database and we have activities, use them
    if (useDatabase && databaseActivities.length > 0) {
      const randomActivity = databaseActivities[Math.floor(Math.random() * databaseActivities.length)];
      
      // Convert database activity to notification format
      return {
        id: Date.now() + Math.random(),
        name: randomActivity.user_name,
        country: randomActivity.country,
        flag: randomActivity.flag_emoji,
        action: randomActivity.activity_text,
        type: randomActivity.activity_type,
        icon: getIconForType(randomActivity.activity_type),
        color: getColorForType(randomActivity.activity_type),
        textColor: getTextColorForType(randomActivity.activity_type),
        timeAgo: getTimeAgo(randomActivity.created_at),
        amount: randomActivity.amount
      };
    }

    // Fallback to hardcoded generation
    const names = [
      { name: 'Stanley Smith', country: 'London', flag: '🇬🇧' },
      { name: 'Dana Brownson', country: 'Stockholm', flag: '🇸🇪' },
      { name: 'Ferdinand', country: 'Barcelona', flag: '🇪🇸' },
      { name: 'Ronny', country: 'Rio de Janeiro', flag: '🇧🇷' },
      { name: 'Yuki Tanaka', country: 'Tokyo', flag: '🇯🇵' },
      { name: 'Maria Santos', country: 'São Paulo', flag: '🇧🇷' },
      { name: 'Hans Mueller', country: 'Berlin', flag: '🇩🇪' },
      { name: 'Sophie Dubois', country: 'Paris', flag: '🇫🇷' },
      { name: 'Alessandro Rossi', country: 'Milan', flag: '🇮🇹' },
      { name: 'Emma Wilson', country: 'Melbourne', flag: '🇦🇺' },
      { name: 'Carlos Rodriguez', country: 'Madrid', flag: '🇪🇸' },
      { name: 'Anna Kowalski', country: 'Warsaw', flag: '🇵🇱' },
      { name: 'Lars Andersen', country: 'Copenhagen', flag: '🇩🇰' },
      { name: 'Elena Popov', country: 'Moscow', flag: '🇷🇺' },
      { name: 'Ahmed Hassan', country: 'Cairo', flag: '🇪🇬' },
      { name: 'Priya Patel', country: 'Mumbai', flag: '🇮🇳' },
      { name: 'Jin Park', country: 'Seoul', flag: '🇰🇷' },
      { name: 'Isabella Silva', country: 'Lisbon', flag: '🇵🇹' },
      { name: 'Niklas Berg', country: 'Helsinki', flag: '🇫🇮' },
      { name: 'Zara Khan', country: 'Dubai', flag: '🇦🇪' }
    ];

    const actions = [
      { type: 'investment', text: 'invested in {plan}', icon: TrendingUp, color: 'bg-green-500', textColor: 'text-green-600' },
      { type: 'withdrawal', text: 'just withdrew earnings', icon: TrendingDown, color: 'bg-blue-500', textColor: 'text-blue-600' },
      { type: 'deposit', text: 'just deposited {amount}', icon: DollarSign, color: 'bg-purple-500', textColor: 'text-purple-600' },
      { type: 'copy_trade', text: 'just copied {trader}', icon: Copy, color: 'bg-orange-500', textColor: 'text-orange-600' },
      { type: 'profit', text: 'earned {amount} profit', icon: TrendingUp, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
      { type: 'trade', text: 'opened {symbol} position', icon: Users, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
      { type: 'bonus', text: 'received welcome bonus', icon: DollarSign, color: 'bg-pink-500', textColor: 'text-pink-600' },
      { type: 'referral', text: 'invited a friend', icon: Users, color: 'bg-teal-500', textColor: 'text-teal-600' }
    ];

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    // Generate random amounts for financial actions
    const amounts = ['$250', '$500', '$1,200', '$2,500', '$4,500', '$7,800', '$12,000', '$25,000'];
    const randomAmount = amounts[Math.floor(Math.random() * amounts.length)];

    // Generate random time ago
    const timeAgo = [
      'just now', '2 minutes ago', '5 minutes ago', '10 minutes ago', 
      '15 minutes ago', '30 minutes ago', '1 hour ago', '2 hours ago'
    ];
    const randomTime = timeAgo[Math.floor(Math.random() * timeAgo.length)];

    let actionText = randomAction.text;
    
    // Replace placeholders with actual values
    if (actionText.includes('{amount}')) {
      actionText = actionText.replace('{amount}', randomAmount);
    }
    if (actionText.includes('{plan}')) {
      const plans = ['Gold Plan', 'Platinum Plan', 'Diamond Plan', 'Premium Plan', 'Elite Plan'];
      actionText = actionText.replace('{plan}', plans[Math.floor(Math.random() * plans.length)]);
    }
    if (actionText.includes('{trader}')) {
      const traders = ['Alex Thompson', 'Sarah Chen', 'Mike Johnson', 'Lisa Wang', 'David Kim'];
      actionText = actionText.replace('{trader}', traders[Math.floor(Math.random() * traders.length)]);
    }
    if (actionText.includes('{symbol}')) {
      const symbols = ['BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD', 'AAPL', 'TSLA', 'NVDA'];
      actionText = actionText.replace('{symbol}', symbols[Math.floor(Math.random() * symbols.length)]);
    }

    return {
      id: Date.now() + Math.random(),
      name: randomName.name,
      country: randomName.country,
      flag: randomName.flag,
      action: actionText,
      type: randomAction.type,
      icon: randomAction.icon,
      color: randomAction.color,
      textColor: randomAction.textColor,
      timeAgo: randomTime,
      amount: randomAmount
    };
  }, [useDatabase, databaseActivities]);

  // Helper functions for database activities
  const getIconForType = (type) => {
    const iconMap = {
      'investment': TrendingUp,
      'withdrawal': TrendingDown,
      'deposit': DollarSign,
      'copy_trade': Copy,
      'profit': TrendingUp,
      'trade': Users,
      'bonus': DollarSign,
      'referral': Users,
      'account': Users
    };
    return iconMap[type] || TrendingUp;
  };

  const getColorForType = (type) => {
    const colorMap = {
      'investment': 'bg-green-500',
      'withdrawal': 'bg-blue-500',
      'deposit': 'bg-purple-500',
      'copy_trade': 'bg-orange-500',
      'profit': 'bg-emerald-500',
      'trade': 'bg-indigo-500',
      'bonus': 'bg-pink-500',
      'referral': 'bg-teal-500',
      'account': 'bg-gray-500'
    };
    return colorMap[type] || 'bg-blue-500';
  };

  const getTextColorForType = (type) => {
    const textColorMap = {
      'investment': 'text-green-600',
      'withdrawal': 'text-blue-600',
      'deposit': 'text-purple-600',
      'copy_trade': 'text-orange-600',
      'profit': 'text-emerald-600',
      'trade': 'text-indigo-600',
      'bonus': 'text-pink-600',
      'referral': 'text-teal-600',
      'account': 'text-gray-600'
    };
    return textColorMap[type] || 'text-blue-600';
  };

  const getTimeAgo = (createdAt) => {
    if (!createdAt) return 'just now';
    
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  // Add a new notification
  const addNotification = useCallback(() => {
    const newNotification = generateNotification();
    setNotifications(prev => [...prev, newNotification]);
    
    // Remove notification after 6 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 6000);
  }, [generateNotification]);

  // Start the notification cycle
  useEffect(() => {
    if (!isVisible) return;

    // Add first notification immediately
    addNotification();

    // Add new notification every 8-15 seconds
    const interval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to show notification
        addNotification();
      }
    }, 8000 + Math.random() * 7000);

    return () => clearInterval(interval);
  }, [isVisible, addNotification]);

  // Pause notifications when user is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-32 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`${notification.color} text-white p-4 shadow-lg border-0 transform transition-all duration-500 ease-in-out animate-in slide-in-from-right-full`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <notification.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{notification.name}</span>
                <span className="text-xs opacity-80 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {notification.country}
                </span>
                <span className="text-xs opacity-60">{notification.timeAgo}</span>
              </div>
              <p className="text-sm leading-relaxed">
                {notification.action}
              </p>
              {notification.amount && (
                <div className="mt-2 text-xs opacity-80">
                  Amount: {typeof notification.amount === 'number' ? `$${notification.amount.toLocaleString()}` : notification.amount}
                </div>
              )}
            </div>
            <div className="text-2xl">{notification.flag}</div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SocialProof;
