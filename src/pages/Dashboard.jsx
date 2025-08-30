
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Settings,
  LogOut,
  PlusCircle,
  MinusCircle,
  Eye,
  BarChart3,
  ArrowRightLeft,
  ArrowUpRight,
  Wallet,
  Zap,
  Clock,
  RefreshCw,
  ArrowDownLeft,
  AlertTriangle,
  Loader2,
  Menu, // For mobile nav
  User as UserIcon, // For Account Icon
  Shield, // For Admin View in mobile
  Crown // For Super Admin View in mobile
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import WalletCard from '../components/dashboard/WalletCard';
import ActionCard from '../components/dashboard/ActionCard';
import TransferCard from '../components/dashboard/TransferCard';
import TransactionItem from '../components/dashboard/TransactionItem';
import DepositModal from '../components/modals/DepositModal';
import WithdrawalModal from '../components/modals/WithdrawalModal';
import TransferModal from '../components/modals/TransferModal';
import WithdrawFunds from '../components/modals/WithdrawFunds';
import AllTransactionsModal from '../components/modals/AllTransactionsModal';
import PendingTransactionsModal from '../components/modals/PendingTransactionsModal';
import FeedbackModal from '../components/modals/FeedbackModal';
import WalletNotConnected from '../components/modals/WalletNotConnected';
import WalletPending from '../components/modals/WalletPending';
import WalletRejected from '../components/modals/WalletRejected';
import WalletValidated from '../components/modals/WalletValidated';
import WalletActivationStatusModal from '../components/modals/WalletActivationStatusModal';
import AccountModal from '../components/modals/AccountModal';
import { useLanguage } from '../components/LanguageProvider';
import { useApp } from '../components/AppProvider';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferFromWallet, setTransferFromWallet] = useState('');
  const [isWithdrawFundsModalOpen, setIsWithdrawFundsModalOpen] = useState(false);
  const [isAllTransactionsModalOpen, setIsAllTransactionsModalOpen] = useState(false);
  const [isPendingTransactionsModalOpen, setIsPendingTransactionsModalOpen] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [isWithdrawalLoading, setIsWithdrawalLoading] = useState(false);
  const [isWithdrawalPreValidated, setIsWithdrawalPreValidated] = useState(false);

  // New state variables for wallet submission modals
  const [isWalletNotConnectedModalOpen, setIsWalletNotConnectedModalOpen] = useState(false);
  const [isWalletPendingModalOpen, setIsWalletPendingModalOpen] = useState(false);
  const [isWalletRejectedModalOpen, setIsWalletRejectedModalOpen] = useState(false);
  const [isWalletValidatedModalOpen, setIsWalletValidatedModalOpen] = useState(false);

  // New state variables for wallet activation
  const [isWalletActivationModalOpen, setIsWalletActivationModalOpen] = useState(false);
  const [activationFee, setActivationFee] = useState(100);

  // New state variable for account modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile nav state
  const [currentWithdrawalOption, setCurrentWithdrawalOption] = useState('withdrawal_code'); // Track current withdrawal option

  const { t } = useLanguage();
  const { appConfig } = useApp();
  const { user: authUser, userProfile, signOut } = useAuth();

  // Debug logging to verify context
  console.log('Dashboard rendering with app:', appConfig);

  useEffect(() => {
    // Only load dashboard data if we have an authenticated user with valid email
    if (authUser && authUser.email && authUser.email !== 'mock@example.com') {
      console.log('Dashboard: Authenticated user found, loading data');
      loadDashboardData();
    } else {
      console.log('Dashboard: No authenticated user or mock user detected, skipping data load');
      setIsLoading(false);
    }
  }, [appConfig.id, authUser]); // Reload data when appConfig.id or authenticated user changes

  // Load activation fee from localStorage
  useEffect(() => {
    const savedFee = localStorage.getItem('wallet_activation_fee');
    if (savedFee) {
      setActivationFee(parseFloat(savedFee));
    }
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading dashboard data from Supabase...');
      
      // Use the authenticated user from context instead of calling User.me()
      const currentUser = authUser;
      
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user found');
      }
      
             // Fetch user profile from Supabase to get latest wallet balances
       let updatedUser = null;
       try {
         console.log('🔍 Fetching user profile for:', currentUser.email);
         const { data: userProfile, error: userError } = await supabase
           .from('users')
           .select('*')
           .eq('email', currentUser.email)
           .single();

         if (userError) {
           console.error('❌ Error fetching user profile:', userError);
           if (userError.code === 'PGRST116') {
             console.log('⚠️ User not found in database, redirecting to login');
             // User doesn't exist in database, force logout
             await signOut();
             return;
           }
           // Use current user data if profile fetch fails, but don't create mock data
           const correctTotalBalance = (currentUser.deposit_wallet || 0) + (currentUser.profit_wallet || 0) + (currentUser.trading_wallet || 0);
           updatedUser = {
             ...currentUser,
             total_balance: correctTotalBalance
           };
         } else {
           console.log('✅ User profile fetched successfully:', userProfile);
           // Use fetched profile data from Supabase
           const correctTotalBalance = (userProfile.deposit_wallet || 0) + (userProfile.profit_wallet || 0) + (userProfile.trading_wallet || 0);
           updatedUser = {
             ...userProfile,
             total_balance: correctTotalBalance
           };
         }
       } catch (err) {
         console.error('❌ Exception in user profile fetch:', err);
         console.log('User profile fetch failed, using current user data');
         const correctTotalBalance = (currentUser.deposit_wallet || 0) + (currentUser.profit_wallet || 0) + (currentUser.trading_wallet || 0);
         updatedUser = {
           ...currentUser,
           total_balance: correctTotalBalance
         };
       }
      
             // Validate that we have a proper user object
       if (!updatedUser || !updatedUser.email) {
         console.error('❌ Invalid user object, forcing logout');
         await signOut();
         return;
       }
       
      console.log('✅ Setting user state:', updatedUser);
      setUser(updatedUser);

      // Ensure user has a withdrawal code
      if (!updatedUser.withdrawal_code) {
        console.log('⚠️ User has no withdrawal code, generating one...');
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        try {
          const { error } = await supabase
            .from('users')
            .update({ withdrawal_code: newCode })
            .eq('id', updatedUser.id);
          
          if (error) {
            console.error('Failed to generate withdrawal code:', error);
          } else {
            console.log('✅ New withdrawal code generated:', newCode);
            // Update the local user object
            updatedUser.withdrawal_code = newCode;
            setUser(updatedUser);
          }
        } catch (err) {
          console.error('Exception generating withdrawal code:', err);
        }
      } else {
        console.log('✅ User already has withdrawal code:', updatedUser.withdrawal_code);
      }

      // Fetch all transactions for the current user from Supabase
      let allUserTransactions = [];
      try {
        console.log('🔍 Fetching transactions for user:', currentUser.email);
        
        // Fetch all transactions for the current user from Supabase
        const { data: allTransactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_email', currentUser.email)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching transactions:', error);
          console.error('❌ Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          allUserTransactions = [];
        } else {
          console.log('✅ Raw transactions fetched:', allTransactions?.length || 0);
          if (allTransactions && allTransactions.length > 0) {
            console.log('📋 Sample transaction:', allTransactions[0]);
          } else {
            console.log('⚠️ No transactions found in database for user:', currentUser.email);
          }
          allUserTransactions = allTransactions || [];
        }
      } catch (err) {
        console.error('❌ Exception fetching transactions:', err);
        console.log('Transactions table not available, using empty array');
        allUserTransactions = [];
      }

      // No sample data generation - only show real transactions from Supabase

      // Transform transactions to match expected format
      const transformedTransactions = allUserTransactions.map(transaction => {
        console.log('🔄 Processing transaction:', transaction.id, transaction);
        
        const transformed = {
          ...transaction,
          created_date: transaction.created_at || transaction.created_date || new Date().toISOString(),
          user_email: transaction.user_email || currentUser.email,
          amount: parseFloat(transaction.amount) || parseFloat(transaction.amount_invested) || 0,
          status: transaction.status || 'pending',
          type: transaction.type || transaction.transaction_type || 'deposit'
        };
        
        console.log('✅ Transformed to:', transformed);
        return transformed;
      });
      
      console.log('🔄 Transformed transactions:', transformedTransactions.length);
      if (transformedTransactions.length > 0) {
        console.log('📋 Sample transformed transaction:', transformedTransactions[0]);
      } else {
        console.log('⚠️ No transactions to transform - this might indicate a database issue');
      }
      
      // Set the latest 10 transactions for display
      setTransactions(transformedTransactions.slice(0, 10));

      // Filter for pending transactions and set the latest 5
      const pending = transformedTransactions.filter(t => {
        const status = t.status?.toLowerCase();
        const isPending = status === 'pending' || status === 'processing' || status === 'awaiting';
        if (isPending) {
          console.log('✅ Found pending transaction:', t.id, t.type, t.status, t.amount);
        }
        return isPending;
      }).slice(0, 5);
      
      console.log('⏳ Pending transactions found:', pending.length);
      if (pending.length > 0) {
        console.log('📋 Pending transaction sample:', pending[0]);
      } else {
        console.log('⚠️ No pending transactions found');
      }
      
      // Also log all unique statuses to see what we're working with
      const allStatuses = [...new Set(transformedTransactions.map(t => t.status))];
      console.log('📊 All transaction statuses found:', allStatuses);
      
      // Set real data - no sample data fallback
      setPendingTransactions(pending);

      // Fetch initial withdrawal option setting
      try {
        const { data: withdrawalSettings, error: settingsError } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('setting_key', 'withdrawal_option');
        
        if (!settingsError && withdrawalSettings && withdrawalSettings.length > 0) {
          const withdrawalOption = withdrawalSettings[0].setting_value;
          setCurrentWithdrawalOption(withdrawalOption);
          console.log('✅ Initial withdrawal option loaded:', withdrawalOption);
        }
      } catch (err) {
        console.log('⚠️ Could not load initial withdrawal option, using default');
      }

      console.log('✅ Dashboard data loaded successfully:', {
        user: updatedUser?.full_name || 'Unknown',
        transactions: transformedTransactions.length,
        pending: pending.length
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Could not load your dashboard. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Dashboard: Logout button clicked');
      await signOut();
      // AuthContext will handle the redirect
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleTransferClick = (fromWallet) => {
    setTransferFromWallet(fromWallet);
    setIsTransferModalOpen(true);
  };
  
  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };
  
  const handleWithdrawClick = async () => {
    setIsWithdrawalLoading(true);
    try {
      // Ensure user data is available before proceeding
      if (!user || !user.email) {
        setError("User data not available for withdrawal check. Please try refreshing.");
        setIsWithdrawalLoading(false);
        return;
      }

      console.log('🔍 Fetching latest withdrawal option setting from Supabase...');
      console.log('👤 User email:', user.email);
      
      // Check the admin's withdrawal option setting - always fetch fresh
      try {
        // Fetch withdrawal option setting from Supabase with no caching
        const { data: withdrawalSettings, error: settingsError } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('setting_key', 'withdrawal_option');
        
        console.log('📊 Raw admin settings response:', { withdrawalSettings, settingsError });
        
        let withdrawalOption = 'withdrawal_code'; // Default value
        
        if (settingsError) {
          console.error('❌ Error fetching admin settings:', settingsError);
          console.log('⚠️ Using default withdrawal option:', withdrawalOption);
        } else {
          withdrawalOption = withdrawalSettings.length > 0 ? withdrawalSettings[0].setting_value : 'withdrawal_code';
          console.log('✅ Current withdrawal option setting:', withdrawalOption);
          console.log('📝 Full setting record:', withdrawalSettings[0]);
          
          // Update the state to display in the debug section
          setCurrentWithdrawalOption(withdrawalOption);
        }
        
        if (withdrawalOption === 'wallet_connect') {
          // Check user's wallet submission status from Supabase
          const { data: userSubmissions, error: submissionsError } = await supabase
            .from('wallet_submissions')
            .select('*')
            .eq('user_email', user.email);
          
          if (submissionsError) {
            console.error('Error fetching wallet submissions:', submissionsError);
            // Default to no submissions found
            setIsWalletNotConnectedModalOpen(true);
            return; // Exit early on error
          }
          
          console.log('User wallet submissions:', userSubmissions);
          
          if (!userSubmissions || userSubmissions.length === 0) {
            // No wallet submissions found
            setIsWalletNotConnectedModalOpen(true);
          } else {
            // Get the most recent submission
            const latestSubmission = userSubmissions.sort((a, b) => 
              new Date(b.created_at || b.created_date) - new Date(a.created_at || a.created_date)
            )[0];
            
            console.log('Latest submission status:', latestSubmission.status);
            console.log('Latest submission details:', latestSubmission);
            
            // Check if there are any rejected submissions
            const hasRejectedSubmissions = userSubmissions.some(sub => sub.status === 'rejected');
            const hasValidatedSubmissions = userSubmissions.some(sub => sub.status === 'validated');
            const hasPendingSubmissions = userSubmissions.some(sub => sub.status === 'pending');
            
            // Check if ALL submissions are validated (this is the key requirement)
            const allSubmissionsValidated = userSubmissions.every(sub => sub.status === 'validated');
            
            console.log('📊 Wallet submission status analysis:', {
              total: userSubmissions.length,
              rejected: userSubmissions.filter(s => s.status === 'rejected').length,
              validated: userSubmissions.filter(s => s.status === 'validated').length,
              pending: userSubmissions.filter(s => s.status === 'pending').length,
              allValidated: allSubmissionsValidated
            });
            
            if (hasRejectedSubmissions && !hasValidatedSubmissions) {
              // If there are rejected submissions and no validated ones, show rejected modal
              console.log('❌ User has rejected wallet submissions, showing rejected modal');
              setIsWalletRejectedModalOpen(true);
            } else if (allSubmissionsValidated) {
              // ONLY show validated modal if ALL submissions are validated
              console.log('✅ ALL wallet submissions are validated, proceeding to withdrawal');
              setIsWalletValidatedModalOpen(true);
            } else if (hasPendingSubmissions) {
              console.log('⏳ User has pending wallet submissions');
              setIsWalletPendingModalOpen(true);
            } else {
              // Fallback to pending if status is unclear
              console.log('⚠️ Status unclear, defaulting to pending');
              setIsWalletPendingModalOpen(true);
            }
          }
        } else {
          // Use withdrawal code modal (default)
          setIsWithdrawalPreValidated(false); // Ensure this is reset
          setIsWithdrawalModalOpen(true);
        }
      } catch (settingsError) {
        console.error("Error checking admin settings:", settingsError);
        // If we can't load admin settings, default to withdrawal code
        setIsWithdrawalPreValidated(false); // Ensure this is reset
        setIsWithdrawalModalOpen(true);
      }
    } catch (error) {
      console.error("Error checking withdrawal conditions:", error);
      // Fallback to the default withdrawal modal on error
      setIsWithdrawalModalOpen(true);
      showFeedback('error', 'Withdrawal Error', 'Failed to check withdrawal conditions. Please try again.');
    } finally {
      setIsWithdrawalLoading(false);
    }
  };

  // Function to manually refresh admin settings for debugging
  const refreshAdminSettings = async () => {
    try {
      console.log('🔄 Manually refreshing admin settings...');
      const { data: withdrawalSettings, error: settingsError } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('setting_key', 'withdrawal_option');
      
      if (settingsError) {
        console.error('❌ Error refreshing admin settings:', settingsError);
        showFeedback('error', 'Refresh Error', 'Failed to refresh admin settings.');
      } else {
        const withdrawalOption = withdrawalSettings.length > 0 ? withdrawalSettings[0].setting_value : 'withdrawal_code';
        console.log('✅ Refreshed withdrawal option:', withdrawalOption);
        setCurrentWithdrawalOption(withdrawalOption); // Update the state
        showFeedback('success', 'Settings Refreshed', `Current withdrawal option: ${withdrawalOption}`);
      }
    } catch (error) {
      console.error('Error refreshing admin settings:', error);
      showFeedback('error', 'Refresh Error', 'Failed to refresh admin settings.');
    }
  };

  // Debug function to check database connection and table structure
  const debugDatabaseConnection = async () => {
    try {
      console.log('🔍 Debugging database connection...');
      
      // Test 1: Check if we can connect to Supabase
      console.log('🔍 Test 1: Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase connection test failed:', testError);
        showFeedback('error', 'Connection Error', `Database connection failed: ${testError.message}`);
        return;
      }
      console.log('✅ Supabase connection test passed');
      
      // Test 2: Check transactions table structure
      console.log('🔍 Test 2: Checking transactions table...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('transactions')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.error('❌ Transactions table test failed:', tableError);
        showFeedback('error', 'Table Error', `Transactions table access failed: ${tableError.message}`);
        return;
      }
      console.log('✅ Transactions table access test passed');
      
      // Test 3: Check if user has any transactions
      console.log('🔍 Test 3: Checking user transactions...');
      const { data: userTransactions, error: userError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_email', user?.email)
        .limit(5);
      
      if (userError) {
        console.error('❌ User transactions test failed:', userError);
        showFeedback('error', 'Query Error', `User transactions query failed: ${userError.message}`);
        return;
      }
      
      console.log('✅ User transactions test passed');
      console.log('📊 Found transactions for user:', userTransactions?.length || 0);
      
      if (userTransactions && userTransactions.length > 0) {
        console.log('📋 Sample user transaction:', userTransactions[0]);
        showFeedback('success', 'Database OK', `Found ${userTransactions.length} transactions. Check console for details.`);
      } else {
        console.log('⚠️ No transactions found for user - this might be normal if user is new');
        showFeedback('info', 'No Data', 'No transactions found for this user. This is normal for new users.');
      }
      
    } catch (error) {
      console.error('❌ Database debug failed:', error);
      showFeedback('error', 'Debug Error', `Database debug failed: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
             <AlertTriangle className="w-12 h-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Something Went Wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={loadDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and not a mock user
  if (!authUser || !authUser.email || authUser.email === 'mock@example.com' || !user?.id) {
    console.log('Dashboard: No authenticated user, mock user, or invalid user detected, showing auth required message');
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-blue-500 mb-4">
             <AlertTriangle className="w-12 h-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in with a valid account to access your dashboard.</p>
          <Link to="/Auth">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
              ) : (
                               <span className="text-white font-bold text-lg">
                 {user?.full_name?.charAt(0) || 'U'}
               </span>
              )}
            </div>
            <div className="flex-1">
                             <h1 className="text-lg md:text-xl font-bold text-gray-900">
                 {t('welcome')}, {user?.full_name || 'User'}
               </h1>
              <p className="text-sm text-gray-500">{appConfig.subtitle}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            
            {user ? (
              <>
                {user.role === 'admin' && (
                  <Link to={createPageUrl('AdminDashboard')}>
                    <Button variant="ghost" size="sm" className="text-gray-600">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}

                {user && (user.role === 'admin' || user.role === 'superadmin') && (
                  <Link to={createPageUrl('SuperAdminDashboard')}>
                    <Button variant="ghost" size="sm" className="text-gray-600">
                      <Crown className="w-4 h-4 mr-2" />
                      Super Admin
                    </Button>
                  </Link>
                )}

                <Button variant="ghost" size="sm" onClick={debugDatabaseConnection} className="text-gray-600">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Debug DB
                </Button>

                <Button variant="ghost" size="sm" onClick={() => setIsAccountModalOpen(true)} className="text-gray-600">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Account
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/Auth">
                  <Button variant="ghost" size="sm" className="text-gray-600">
                      Login
                  </Button>
                </Link>
                <Link to="/Auth">
                  <Button variant="default" size="sm">
                      Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
          {/* Mobile Navigation */}
          <div className="md:hidden">
             <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Account</SheetTitle>
                  <SheetDescription>
                    Manage your account and settings.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex justify-center my-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-gray-500">
                        {user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 py-4">
                  {user ? (
                    <>
                      {user.role === 'admin' && (
                        <Link to={createPageUrl('AdminDashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start text-blue-600 border-blue-200">
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Dashboard
                          </Button>
                        </Link>
                      )}
                      {user && (user.role === 'admin' || user.role === 'superadmin') && (
                        <Link to={createPageUrl('SuperAdminDashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                          <Button variant="outline" className="w-full justify-start text-purple-600 border-purple-200">
                            <Crown className="w-4 h-4 mr-2" />
                            Super Admin
                          </Button>
                        </Link>
                      )}
                      
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          debugDatabaseConnection();
                          setIsMobileMenuOpen(false);
                        }} 
                        className="justify-start text-blue-600 border-blue-200"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Debug Database
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setIsAccountModalOpen(true);
                          setIsMobileMenuOpen(false);
                        }} 
                        className="justify-start text-gray-600"
                      >
                        <UserIcon className="w-4 h-4 mr-2" />
                        Account
                      </Button>

                      <Button 
                        variant="outline" 
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }} 
                        className="justify-start text-red-600 border-red-200"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </>
                                     ) : (
                     <>
                       <Link to="/Auth" onClick={() => setIsMobileMenuOpen(false)}>
                         <Button variant="ghost" className="justify-start text-gray-600 w-full">
                             Login
                         </Button>
                       </Link>
                       <Link to="/Auth" onClick={() => setIsMobileMenuOpen(false)}>
                         <Button variant="default" className="justify-start w-full">
                             Sign Up
                         </Button>
                       </Link>
                     </>
                   )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* App Debug Info (can be removed later) */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg hidden">
          <p className="text-sm">
            <strong>Debug:</strong> Current App: {appConfig.name} ({appConfig.id})
          </p>
          <p className="text-xs text-gray-600">Subtitle: {appConfig.subtitle}</p>
        </div>

        {/* Conditional Wallet Overview for App 1 ONLY */}
        {appConfig.features.showWalletCards && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <WalletCard
              type="total"
              title={t('total_balance')}
              amount={user?.total_balance || 0.00}
              subtitle="All wallets combined"
            />
            <WalletCard
              type="deposit"
              title={t('deposit_wallet')}
              amount={user?.deposit_wallet || 0.00}
              subtitle="Available for trading"
            />
            <WalletCard
              type="profit"
              title={t('profit_wallet')}
              amount={user?.profit_wallet || 0.00}
              subtitle="Trading profits"
              isProfit={true}
            />
            <WalletCard
              type="trading"
              title={t('trading_wallet')}
              amount={user?.trading_wallet || 0.00}
              subtitle="Active in trades"
            />
          </div>
        )}

        {/* App 2 Combined Cards View */}
        {appConfig.id === 'app2' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Account Balance Card (App 2) */}
            <Card className="p-6 bg-white hover:shadow-md transition-all duration-300 border-gray-100 flex flex-col text-center">
              <div className="flex-grow">
                <div className="flex items-center justify-center gap-3 mb-2">
                   <div className="p-3 rounded-lg bg-blue-50">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                     <h3 className="font-medium text-gray-700 text-sm text-left">Account Balance</h3>
                     <p className="text-xs text-gray-500 text-left">Total available funds</p>
                  </div>
                </div>
                
                <div className="text-3xl font-bold text-gray-900 my-4">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 2
                  }).format(user?.total_balance || 0)}
                </div>
              </div>
              
              <div className="mt-auto">
                 {user?.wallet_activated ? (
                  <Button 
                    size="lg" 
                    className="w-full bg-green-600 hover:bg-green-700 text-white cursor-default"
                    disabled
                  >
                    Wallet Activated
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => setIsWalletActivationModalOpen(true)}
                  >
                    Activate Wallet
                  </Button>
                )}
              </div>
            </Card>

            {/* Add Funds Card (App 2) */}
            <ActionCard
              icon={PlusCircle}
              title="Add Funds"
              description="Add funds to your account balance"
              buttonText="Add Funds"
              buttonIcon={Wallet}
              color="blue"
              onClick={() => setIsDepositModalOpen(true)}
            />

            {/* Withdraw Funds Card (App 2) */}
            <ActionCard
              icon={MinusCircle}
              title="Withdraw Funds"
              description="Withdraw from your account balance"
              buttonText="Request Withdrawal"
              buttonIcon={ArrowUpRight}
              color="red"
              onClick={handleWithdrawClick}
              isLoading={isWithdrawalLoading}
            />

            {/* Connect Wallet Card (App 2) */}
            <Link to={createPageUrl('ConnectWallet')}>
              <ActionCard
                icon={Wallet}
                title="Connect Wallet"
                description="Connect your crypto wallet"
                buttonText="Connect Wallet"
                buttonIcon={Wallet}
                color="purple"
              />
            </Link>
          </div>
        )}

        {/* Conditional Action Cards for App 1 */}
        {appConfig.features.showWalletCards && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <ActionCard
              icon={PlusCircle}
              title="Deposit Funds"
              description="Add funds to your deposit wallet"
              buttonText="Deposit to Wallet"
              buttonIcon={Wallet}
              color="blue"
              onClick={() => setIsDepositModalOpen(true)}
            />

            <div className="space-y-2">
              <ActionCard
                icon={MinusCircle}
                title="Withdraw Funds"
                description="Withdraw from your profit wallet"
                buttonText="Request Withdrawal"
                buttonIcon={ArrowUpRight}
                color="red"
                onClick={handleWithdrawClick}
                isLoading={isWithdrawalLoading}
              />
            </div>

            {appConfig.features.showInvestmentPlans && (
              <Link to={createPageUrl('InvestmentPlans')}>
                <ActionCard
                  icon={Eye}
                  title="Investment Plans"
                  description="Browse investment opportunities"
                  buttonText="View Plans"
                  buttonIcon={BarChart3}
                  color="purple"
                />
              </Link>
            )}

            {appConfig.features.showTrading && (
              <Link to={createPageUrl('TradingPlatform')}>
                <ActionCard
                  icon={Zap}
                  title="Start Trading"
                  description="Access the trading platform"
                  buttonText="Trade Now"
                  buttonIcon={Zap}
                  color="indigo"
                />
              </Link>
            )}
          </div>
        )}

        {/* Conditional Transfer Cards for App 1 only */}
        {appConfig.features.showTransfers && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <TransferCard
              icon={ArrowRightLeft}
              title="Transfer to Trading"
              description="Move deposits to trading wallet"
              buttonText="Transfer from Deposit"
              color="blue"
              onClick={() => handleTransferClick('Deposit Wallet')}
            />

            <TransferCard
              icon={ArrowRightLeft}
              title="Transfer from Profit"
              description="Move profits to trading wallet"
              buttonText="Transfer from Profit"
              color="green"
              onClick={() => handleTransferClick('Profit Wallet')}
            />

            <Link to={createPageUrl('ConnectWallet')}>
              <TransferCard
                icon={Wallet}
                title="Connect Wallet"
                description="Connect your crypto wallet"
                buttonText="Connect Wallet"
                color="purple"
              />
            </Link>
          </div>
        )}

        {/* Pending Transactions */}
        <Card className="bg-white mb-8">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Pending Transactions
                </h2>
                <p className="text-sm text-gray-500 mt-1 hidden md:block">Review pending deposits and withdrawals</p>
                
                {/* Mobile: Move controls under title */}
                <div className="flex items-center gap-2 mt-2 md:hidden">
                  <Button variant="ghost" size="icon" className="text-gray-500 h-8 w-8" onClick={loadDashboardData}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsPendingTransactionsModalOpen(true)}>
                    View All →
                  </Button>
                </div>
              </div>
              
              {/* Desktop: Keep controls on the right */}
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-gray-500" onClick={loadDashboardData}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsPendingTransactionsModalOpen(true)}>
                  View All →
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {pendingTransactions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pendingTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      {transaction.type === 'deposit' ? (
                        <ArrowDownLeft className="w-4 h-4 text-orange-600" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-orange-600" />
                      )}
                      <div>
                        <div className="font-semibold capitalize">{transaction.type}</div>
                        <div className="text-sm text-gray-600">${transaction.amount?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                      </div>
                    </div>
                    <div className="text-sm text-orange-800 capitalize bg-orange-100 px-2 py-1 rounded-md">{transaction.status}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No pending transactions</p>
                <p className="text-sm mt-1">All transactions are up to date</p>
              </div>
            )}
          </div>
        </Card>
        
        {/* Transactions & Activities */}
        <Card className="bg-white">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="hidden md:inline">Transactions & Activities</span>
                  <span className="md:hidden">Transaction History</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1 hidden md:block">Recent account activities and transaction history</p>
                
                {/* Mobile: Move button under title */}
                <div className="mt-2 md:hidden">
                  <Button variant="outline" size="sm" onClick={() => setIsAllTransactionsModalOpen(true)}>
                    View All →
                  </Button>
                </div>
              </div>
              
              {/* Desktop: Keep button on the right */}
              <div className="hidden md:block">
                <Button variant="outline" size="sm" onClick={() => setIsAllTransactionsModalOpen(true)}>
                  View All →
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {transactions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border border-gray-100 rounded-lg p-4">
                    <TransactionItem transaction={transaction} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        </Card>
      </main>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSuccess={loadDashboardData}
        onFeedback={showFeedback}
        user={user}
      />
      
      <WithdrawalModal
        isOpen={isWithdrawalModalOpen}
        onClose={() => {
          setIsWithdrawalModalOpen(false);
          setIsWithdrawalPreValidated(false); // Reset pre-validation on close
        }}
        onSuccess={loadDashboardData}
        user={user}
        preValidated={isWithdrawalPreValidated}
      />
      
      <WalletNotConnected
        isOpen={isWalletNotConnectedModalOpen}
        onClose={() => setIsWalletNotConnectedModalOpen(false)}
      />
      
      <WalletPending
        isOpen={isWalletPendingModalOpen}
        onClose={() => setIsWalletPendingModalOpen(false)}
      />
      
      <WalletRejected
        isOpen={isWalletRejectedModalOpen}
        onClose={() => setIsWalletRejectedModalOpen(false)}
      />
      
      <WalletValidated
        isOpen={isWalletValidatedModalOpen}
        onClose={() => setIsWalletValidatedModalOpen(false)}
        user={user}
        onProceed={() => {
          setIsWalletValidatedModalOpen(false);
          setIsWithdrawalPreValidated(true);
          setIsWithdrawalModalOpen(true);
        }}
      />

      {/* App 2 Specific Modals */}
      {appConfig.id === 'app2' && (
        <WalletActivationStatusModal
          isOpen={isWalletActivationModalOpen}
          onClose={() => setIsWalletActivationModalOpen(false)}
          isActivated={user?.wallet_activated || false}
          activationFee={activationFee}
          onMakeDeposit={() => {
            setIsWalletActivationModalOpen(false);
            setIsDepositModalOpen(true);
          }}
        />
      )}

      {/* Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        fromWallet={transferFromWallet}
        user={user}
        onSuccess={loadDashboardData}
        onFeedback={showFeedback}
      />
      
      <WithdrawFunds
        isOpen={isWithdrawFundsModalOpen}
        onClose={() => setIsWithdrawFundsModalOpen(false)}
        onSuccess={loadDashboardData}
      />
      
      <AllTransactionsModal
        isOpen={isAllTransactionsModalOpen}
        onClose={() => setIsAllTransactionsModalOpen(false)}
        user={user}
      />
      
      <PendingTransactionsModal
        isOpen={isPendingTransactionsModalOpen}
        onClose={() => setIsPendingTransactionsModalOpen(false)}
        user={user}
      />
      
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </div>
  );
}
