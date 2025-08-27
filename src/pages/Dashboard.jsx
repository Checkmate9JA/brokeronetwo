
import React, { useState, useEffect } from 'react';
import { Transaction } from '@/api/entities';
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
// import WalletValidated from '../components/modals/WalletValidated'; // This modal is no longer used directly in this flow
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
  // const [isWalletValidatedModalOpen, setIsWalletValidatedModalOpen] = useState(false); // This state is no longer needed

  // New state variables for wallet activation
  const [isWalletActivationModalOpen, setIsWalletActivationModalOpen] = useState(false);
  const [activationFee, setActivationFee] = useState(100);

  // New state variable for account modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile nav state

  const { t } = useLanguage();
  const { appConfig } = useApp();
  const { user: authUser, userProfile, signOut } = useAuth();

  // Debug logging to verify context
  console.log('Dashboard rendering with app:', appConfig);

  useEffect(() => {
    // Only load dashboard data if we have an authenticated user
    if (authUser && authUser.email) {
      console.log('Dashboard: Authenticated user found, loading data');
      loadDashboardData();
    } else {
      console.log('Dashboard: No authenticated user, skipping data load');
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
      // Use the authenticated user from context instead of calling User.me()
      const currentUser = authUser;
      
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user found');
      }
      
      // Calculate correct total balance
      const correctTotalBalance = (currentUser.deposit_wallet || 0) + (currentUser.profit_wallet || 0) + (currentUser.trading_wallet || 0);
      
      // Update user object with correct total balance
      const updatedUser = {
        ...currentUser,
        total_balance: correctTotalBalance
      };
      
      setUser(updatedUser);

      // Fetch all transactions for the current user, sorted by date
      // Use created_by field instead of user_email for filtering
      const allUserTransactions = await Transaction.filter({ created_by: currentUser.email }, '-created_date');
      
      // Set the latest 10 transactions for display
      setTransactions(allUserTransactions.slice(0, 10));

      // Filter for pending transactions and set the latest 5
      const pending = allUserTransactions.filter(t => t.status === 'pending').slice(0, 5);
      setPendingTransactions(pending);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Could not load your dashboard. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const result = await signOut();
      if (result.success) {
        // Redirect to Auth page after successful logout
        window.location.href = '/Auth';
      } else {
        console.error('Logout failed:', result.error);
      }
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

      // Check the admin's withdrawal option setting
      try {
        const { AdminSetting } = await import('@/api/entities');
        const withdrawalSettings = await AdminSetting.filter({ setting_key: 'withdrawal_option' });
        const withdrawalOption = withdrawalSettings.length > 0 ? withdrawalSettings[0].setting_value : 'withdrawal_code';
        
        console.log('Current withdrawal option setting:', withdrawalOption);
        
        if (withdrawalOption === 'wallet_connect') {
          // Check user's wallet submission status
          const { WalletSubmission } = await import('@/api/entities');
          const userSubmissions = await WalletSubmission.filter({
            user_email: user.email
          });
          
          console.log('User wallet submissions:', userSubmissions);
          
          if (userSubmissions.length === 0) {
            // No wallet submissions found
            setIsWalletNotConnectedModalOpen(true);
          } else {
            // Get the most recent submission
            const latestSubmission = userSubmissions.sort((a, b) => 
              new Date(b.created_date) - new Date(a.created_date)
            )[0];
            
            console.log('Latest submission status:', latestSubmission.status);
            
            if (latestSubmission.status === 'rejected') {
              setIsWalletRejectedModalOpen(true);
            } else if (latestSubmission.status === 'pending') {
              setIsWalletPendingModalOpen(true);
            } else if (latestSubmission.status === 'validated') {
              // For validated wallets, go DIRECTLY to withdrawal form, pre-validated
              setIsWithdrawalPreValidated(true);
              setIsWithdrawalModalOpen(true);
            } else {
              // Fallback to pending if status is unclear
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

  // Check if user is authenticated
  if (!authUser || !authUser.email) {
    console.log('Dashboard: No authenticated user, showing auth required message');
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-blue-500 mb-4">
             <AlertTriangle className="w-12 h-12 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access your dashboard.</p>
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
                  {user?.full_name?.charAt(0) || 'K'}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-bold text-gray-900">
                {t('welcome')}, {user?.full_name || 'Kelvin'}
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
      
      {/* WalletValidated modal is removed as per the new flow, directly opens WithdrawalModal */}

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
      />
      
      <PendingTransactionsModal
        isOpen={isPendingTransactionsModalOpen}
        onClose={() => setIsPendingTransactionsModalOpen(false)}
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
