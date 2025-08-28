
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  DollarSign,
  CreditCard,
  TrendingUp,
  LogOut,
  Settings, 
  FileText,
  Wallet,
  Mail,
  Copy as CopyIcon,
  MessageCircle,
  Crown,
  Menu, // For mobile nav
  User as UserIcon, // For Account Icon
  Shield, // For Admin View in mobile
  RefreshCw
} from 'lucide-react';
import WithdrawalOptionModal from '../components/modals/WithdrawalOptionModal';
import PaymentSettingsModal from '../components/modals/PaymentSettingsModal';
import CopyTradeManagementModal from '../components/modals/CopyTradeManagementModal';
import TransactionsManagementModal from '../components/modals/TransactionsManagementModal';
import AccountModal from '../components/modals/AccountModal';
import MinimumInvestmentModal from '../components/modals/MinimumInvestmentModal';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingDepositsAmount: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalsAmount: 0,
    investmentPlans: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawalOptionModalOpen, setIsWithdrawalOptionModalOpen] = useState(false);
  const [isPaymentSettingsModalOpen, setIsPaymentSettingsModalOpen] = useState(false);
  const [isCopyTradeModalOpen, setIsCopyTradeModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile nav state
  const [isMinimumInvestmentModalOpen, setIsMinimumInvestmentModalOpen] = useState(false);


  useEffect(() => {
    const initialize = async () => {
      try {
        // Get current user from Supabase auth
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch user profile from users table
          const { data: userProfile, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
          
          if (error) {
            console.error('Error fetching user profile:', error);
            setCurrentUser(user);
          } else {
            setCurrentUser(userProfile);
          }
        }
      } catch (error) {
        console.error('Error initializing admin dashboard:', error);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser]);

  const loadStats = async () => {
    try {
      console.log('🔍 Loading admin dashboard stats from Supabase...');
      
      // Admin should fetch ALL data from Supabase
      let users = [];
      let allTransactions = [];
      let plans = [];

      // Fetch users
      try {
        console.log('📊 Fetching users...');
        const { data: usersData, error: usersError } = await supabase.from('users').select('*');
        if (usersError) {
          console.error('❌ Error fetching users:', usersError);
          if (usersError.code === 'PGRST116') {
            console.log('⚠️ Users table does not exist');
          }
        } else {
          users = usersData || [];
          console.log(`✅ Users fetched: ${users.length}`);
        }
      } catch (err) {
        console.log('⚠️ Users table not available, using empty array');
      }

      // Fetch transactions
      try {
        console.log('📊 Fetching transactions...');
        const { data: transactionsData, error: transactionsError } = await supabase.from('transactions').select('*');
        if (transactionsError) {
          console.error('❌ Error fetching transactions:', transactionsError);
          if (transactionsError.code === 'PGRST116') {
            console.log('⚠️ Transactions table does not exist');
          }
        } else {
          allTransactions = transactionsData || [];
          console.log(`✅ Transactions fetched: ${allTransactions.length}`);
        }
      } catch (err) {
        console.log('⚠️ Transactions table not available, using empty array');
      }

      // Fetch investment plans
      try {
        console.log('📊 Fetching investment plans...');
        const { data: plansData, error: plansError } = await supabase.from('investment_plans').select('*');
        if (plansError) {
          console.error('❌ Error fetching investment plans:', plansError);
          if (plansError.code === 'PGRST116') {
            console.log('⚠️ Investment plans table does not exist');
          }
        } else {
          plans = plansData || [];
          console.log(`✅ Investment plans fetched: ${plans.length}`);
        }
      } catch (err) {
        console.log('⚠️ Investment plans table not available, using empty array');
      }

      const deposits = allTransactions.filter(t => t.type === 'deposit' && t.status === 'pending');
      const withdrawals = allTransactions.filter(t => t.type === 'withdrawal' && t.status === 'pending');

      const pendingDepositsAmount = deposits.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
      const pendingWithdrawalsAmount = withdrawals.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);

      // Use real data from Supabase
      const finalStats = {
        totalUsers: users.length,
        pendingDeposits: deposits.length,
        pendingDepositsAmount: pendingDepositsAmount,
        pendingWithdrawals: withdrawals.length,
        pendingWithdrawalsAmount: pendingWithdrawalsAmount,
        investmentPlans: plans.length
      };

      console.log('✅ Admin stats loaded successfully:', finalStats);
      setStats(finalStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const quickActions = [
    { icon: Users, title: 'Manage All Users', href: 'AdminUsers' },
    { icon: DollarSign, title: 'Process Deposits', href: 'AdminPendingDeposits' },
    { icon: CreditCard, title: 'Process Withdrawals', href: 'AdminPendingWithdrawals' },
    { icon: CreditCard, title: 'Withdrawal Settings', action: () => setIsWithdrawalOptionModalOpen(true) },
    { icon: TrendingUp, title: 'Manage Investment Plans', href: 'AdminInvestmentPlans' },
    { icon: Settings, title: 'Payment Settings', action: () => setIsPaymentSettingsModalOpen(true) },
    { icon: TrendingUp, title: 'Trading Management', href: 'TradingManagement' },
    { icon: CopyIcon, title: 'Copy/Expert Trade Management', action: () => setIsCopyTradeModalOpen(true) },
    { icon: DollarSign, title: 'Minimum Investment Settings', action: () => setIsMinimumInvestmentModalOpen(true) },
    { icon: Wallet, title: 'Manage Wallets', href: 'AdminManageWallets' },
    { icon: Mail, title: 'Email Management', href: 'AdminEmailManagement' },
    { icon: FileText, title: 'Transactions Management', action: () => setIsTransactionsModalOpen(true) }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
                     <div>
             <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
             <p className="text-sm text-gray-500 hidden md:block">Manage users, monitor activities, and oversee platform operations.</p>
           </div>
           
           {/* Refresh Button */}
           <Button 
             variant="outline" 
             size="sm" 
             onClick={loadStats}
             disabled={isLoading}
             className="text-blue-600 border-blue-200 hover:bg-blue-50"
           >
             <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
             Refresh Stats
           </Button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <Link to={createPageUrl('SuperAdminDashboard')}>
              <Button variant="outline" size="sm" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                <Crown className="w-4 h-4 mr-2" />
                Super Admin
              </Button>
            </Link>
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <UserIcon className="w-4 h-4 mr-2" />
                User
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setIsAccountModalOpen(true)} className="text-gray-600">
              <UserIcon className="w-4 h-4 mr-2" />
              Account
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
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
                  <SheetTitle>Admin Navigation</SheetTitle>
                  <SheetDescription>
                    Quick access to other dashboards and settings.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <Link to={createPageUrl('SuperAdminDashboard')}>
                    <Button variant="outline" className="w-full justify-start text-purple-600 border-purple-200" onClick={() => setIsMobileMenuOpen(false)}>
                      <Crown className="w-4 h-4 mr-2" />
                      Super Admin
                    </Button>
                  </Link>

                  <Link to={createPageUrl('Dashboard')}>
                    <Button variant="outline" className="w-full justify-start text-blue-600 border-blue-200" onClick={() => setIsMobileMenuOpen(false)}>
                      <UserIcon className="w-4 h-4 mr-2" />
                      User View
                    </Button>
                  </Link>
                  
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                 {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <Link to={createPageUrl('AdminUsers')}>
             <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-100 rounded-lg">
                   <Users className="w-6 h-6 text-blue-600" />
                 </div>
                 <div>
                   <div className="text-sm font-medium text-gray-600">Total Users</div>
                   <div className="text-2xl font-bold text-gray-900">
                     {isLoading ? (
                       <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                     ) : (
                       stats.totalUsers
                     )}
                   </div>
                 </div>
               </div>
             </Card>
           </Link>

                     <Link to={createPageUrl('AdminPendingDeposits')}>
             <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-green-100 rounded-lg">
                   <DollarSign className="w-6 h-6 text-green-600" />
                 </div>
                 <div>
                   <div className="text-sm font-medium text-gray-600">Pending Deposits</div>
                   <div className="text-2xl font-bold text-green-600">
                     {isLoading ? (
                       <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                     ) : (
                       `${stats.pendingDeposits} ($${stats.pendingDepositsAmount.toFixed(2)})`
                     )}
                   </div>
                 </div>
               </div>
             </Card>
           </Link>

                     <Link to={createPageUrl('AdminPendingWithdrawals')}>
             <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-red-100 rounded-lg">
                   <CreditCard className="w-6 h-6 text-red-600" />
                 </div>
                 <div>
                   <div className="text-sm font-medium text-gray-600">Pending Withdrawals</div>
                   <div className="text-2xl font-bold text-red-600">
                     {isLoading ? (
                       <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                     ) : (
                       `${stats.pendingWithdrawals} ($${stats.pendingWithdrawalsAmount.toFixed(2)})`
                     )}
                   </div>
                 </div>
               </div>
             </Card>
           </Link>

                     <Link to={createPageUrl('AdminInvestmentPlans')}>
             <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-purple-100 rounded-lg">
                   <TrendingUp className="w-6 h-6 text-purple-600" />
                 </div>
                 <div>
                   <div className="text-sm font-medium text-gray-600">Investment Plans</div>
                   <div className="text-2xl font-bold text-purple-600">
                     {isLoading ? (
                       <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                     ) : (
                       `${stats.investmentPlans} Active`
                     )}
                   </div>
                 </div>
               </div>
             </Card>
           </Link>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Quick Actions</h2>
          <p className="text-sm text-gray-500 mb-6">Common administrative tasks</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              action.href && action.href !== '#' ? (
                <Link key={index} to={createPageUrl(action.href)}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <action.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                        {action.title}
                      </span>
                    </div>
                  </Card>
                </Link>
              ) : (
                <Card
                  key={index}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={action.action}
                >
                  <div className="flex items-center gap-3">
                    <action.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                      {action.title}
                    </span>
                  </div>
                </Card>
              )
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
      <WithdrawalOptionModal
        isOpen={isWithdrawalOptionModalOpen}
        onClose={() => setIsWithdrawalOptionModalOpen(false)}
      />
      <PaymentSettingsModal
        isOpen={isPaymentSettingsModalOpen}
        onClose={() => setIsPaymentSettingsModalOpen(false)}
      />
      <CopyTradeManagementModal
        isOpen={isCopyTradeModalOpen}
        onClose={() => setIsCopyTradeModalOpen(false)}
      />
      <TransactionsManagementModal
        isOpen={isTransactionsModalOpen}
        onClose={() => setIsTransactionsModalOpen(false)}
      />
      <MinimumInvestmentModal
        isOpen={isMinimumInvestmentModalOpen}
        onClose={() => setIsMinimumInvestmentModalOpen(false)}
      />
    </div>
  );
}
