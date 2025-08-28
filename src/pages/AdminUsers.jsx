
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User as UserIcon,
  Search,
  ArrowLeft,
  DollarSign,
  CreditCard,
  Gift,
  Briefcase,
  MousePointerClick,
  ChevronDown,
  Mail,
  UserPlus,
  BarChart,
  Trash2,
  Lock,
  Unlock,
  PlusCircle,
  MinusCircle,
  Wallet,
  Eye,
  Copy,
  Check,
  XCircle,
  CheckCircle,
  Key
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import CreditUserModal from '../components/modals/CreditUserModal';
import DebitUserModal from '../components/modals/DebitUserModal';
import EditUserModal from '../components/modals/EditUserModal';
import SendEmailModal from '../components/modals/SendEmailModal';
import AddHistoryModal from '../components/modals/AddHistoryModal';
import AddNewUserModal from '../components/modals/AddNewUserModal';
import SuspensionModal from '../components/modals/SuspensionModal';
import TransactionsManagementModal from '../components/modals/TransactionsManagementModal';
import WalletBreakdownModal from '../components/modals/WalletBreakdownModal';
import ViewUserWalletsModal from '../components/modals/ViewUserWalletsModal';
import WalletActivationStatusModal from '../components/modals/WalletActivationStatusModal';
import ActivationFeeModal from '../components/modals/ActivationFeeModal';
import WithdrawalCodeModal from '../components/modals/WithdrawalCodeModal';
import FeedbackModal from '../components/modals/FeedbackModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { useApp } from '../components/AppProvider';
import { useAuth } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const generateWithdrawalCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function AdminUsers() {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [walletSubmissions, setWalletSubmissions] = useState([]);
  const [managedWallets, setManagedWallets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appCreatorId, setAppCreatorId] = useState(null);

  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isDebitModalOpen, setIsDebitModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isSuspensionModalOpen, setIsSuspensionModalOpen] = useState(false);
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [isWalletBreakdownModalOpen, setIsWalletBreakdownModalOpen] = useState(false);
  const [isViewWalletsModalOpen, setIsViewWalletsModalOpen] = useState(false);
  const [isActivationStatusModalOpen, setIsActivationStatusModalOpen] = useState(false);
  const [isActivationFeeModalOpen, setIsActivationFeeModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawalCodeModalOpen, setIsWithdrawalCodeModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

  const [activationFee, setActivationFee] = useState(100);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspensionAction, setSuspensionAction] = useState('suspend');

  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: '',
    user: null,
    action: '',
    title: '',
    message: ''
  });

  const { appConfig } = useApp();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const savedFee = localStorage.getItem('wallet_activation_fee');
    if (savedFee) {
      setActivationFee(parseFloat(savedFee));
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔍 Loading data from Supabase...');
      
      // Fetch users from Supabase
      const { data: fetchedUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw new Error('Failed to fetch users');
      }

      // Fetch transactions from Supabase (if table exists)
      let allTransactions = [];
      try {
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*');
        
        if (!transactionsError && transactionsData) {
          allTransactions = transactionsData;
        }
      } catch (err) {
        console.log('Transactions table not available, using empty array');
      }

      // Fetch wallet submissions from Supabase (if table exists)
      let allSubmissions = [];
      try {
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('wallet_submissions')
          .select('*');
        
        if (!submissionsError && submissionsData) {
          allSubmissions = submissionsData;
        }
      } catch (err) {
        console.log('Wallet submissions table not available, using empty array');
      }

      // Fetch managed wallets from Supabase (if table exists)
      let allManagedWallets = [];
      try {
        const { data: walletsData, error: walletsError } = await supabase
          .from('managed_wallets')
          .select('*');
        
        if (!walletsError && walletsData) {
          allManagedWallets = walletsData;
        }
      } catch (err) {
        console.log('Managed wallets table not available, using empty array');
      }

      console.log('✅ Data loaded successfully:', {
        users: fetchedUsers?.length || 0,
        transactions: allTransactions.length,
        submissions: allSubmissions.length,
        wallets: allManagedWallets.length
      });

      const usersWithDefaults = (fetchedUsers || []).map(user => ({
        ...user,
        total_balance: user.total_balance || 0,
        deposit_wallet: user.deposit_wallet || 0,
        profit_wallet: user.profit_wallet || 0,
        trading_wallet: user.trading_wallet || 0,
        referrer_bonus: user.referrer_bonus || 0,
        is_suspended: user.is_suspended || false,
        withdrawal_code: user.withdrawal_code || generateWithdrawalCode(),
        wallet_activated: user.wallet_activated || false,
        created_date: user.created_at || new Date().toISOString()
      }));

      // Find app creator (first super_admin or first user)
      const sortedUsers = [...usersWithDefaults].sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());
      const creator = sortedUsers.find(u => u.role === 'super_admin') || sortedUsers[0];
      if (creator) {
        setAppCreatorId(creator.id);
      }

      // Update users with withdrawal codes if they don't have one
      const usersToUpdate = usersWithDefaults.filter(user => !user.withdrawal_code);
      for (const user of usersToUpdate) {
        try {
          const { error: updateError } = await supabase
            .from('users')
            .update({ withdrawal_code: generateWithdrawalCode() })
            .eq('id', user.id);
          
          if (updateError) {
            console.error(`Failed to set withdrawal code for user ${user.id}:`, updateError);
          }
        } catch (error) {
          console.error(`Failed to set withdrawal code for user ${user.id}:`, error);
        }
      }

      setUsers(usersWithDefaults.sort((a, b) => a.full_name?.localeCompare(b.full_name || '') || 0));
      setTransactions(allTransactions);
      setWalletSubmissions(allSubmissions);
      setManagedWallets(allManagedWallets);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load user data. Please check your connection and try again.');
      setUsers([]);
      setTransactions([]);
      setManagedWallets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (modalSetter, user) => {
    setSelectedUser(user);
    modalSetter(true);
  };

  const openSuspensionModal = (user, action) => {
    const isSuspending = action === 'suspend';
    setConfirmationModal({
      isOpen: true,
      type: 'suspension',
      user: user,
      action: action,
      title: isSuspending ? 'Suspend User' : 'Unsuspend User',
      message: isSuspending
        ? `Are you sure you want to suspend ${user.full_name}? They will no longer be able to access their account.`
        : `Are you sure you want to unsuspend ${user.full_name}? They will regain access to their account.`
    });
  };

  const openDeleteConfirmation = (user) => {
    setConfirmationModal({
      isOpen: true,
      type: 'delete',
      user: user,
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.full_name}? This action cannot be undone and will permanently remove all user data.`
    });
  };

  const handleConfirmation = async () => {
    const { type, user, action } = confirmationModal;

    try {
      if (type === 'suspension') {
        const newSuspensionStatus = action === 'suspend';
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_suspended: newSuspensionStatus })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        showFeedback(
          'success',
          'Success!',
          `${user.full_name} has been ${newSuspensionStatus ? 'suspended' : 'unsuspended'} successfully.`
        );
        loadData();
      } else if (type === 'delete') {
        // For now, we'll just suspend the user instead of actually deleting
        const { error: updateError } = await supabase
          .from('users')
          .update({ is_suspended: true })
          .eq('id', user.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        showFeedback('success', 'User Deactivated', `${user.full_name} has been deactivated successfully.`);
        loadData();
      }
    } catch (error) {
      console.error('Error processing user action:', error);
      showFeedback('error', 'Error', `Failed to ${type} user. Please try again.`);
    } finally {
      setConfirmationModal({ isOpen: false, type: '', user: null, action: '', title: '', message: '' });
    }
  };

  const getUserTransactions = (userId) => transactions.filter(t => t.user_id === userId);

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const handleToggleWalletActivation = async (user) => {
    try {
      const newActivationStatus = !user.wallet_activated;
      const { error: updateError } = await supabase
        .from('users')
        .update({ wallet_activated: newActivationStatus })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      loadData();
      showFeedback(
        'success',
        'Success!',
        `Wallet ${newActivationStatus ? 'activated' : 'deactivated'} for ${user.full_name}`
      );
    } catch (error) {
      console.error('Error toggling wallet activation:', error);
      showFeedback('error', 'Error', 'Failed to update wallet activation status.');
    }
  };

  const handleSaveActivationFee = async (fee) => {
    setActivationFee(fee);
    localStorage.setItem('wallet_activation_fee', fee.toString());
    showFeedback('success', 'Success!', `Activation fee updated to $${fee}`);
  };

  const filteredUsers = users.filter(user =>
    (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const UserCard = ({ user }) => {
    const userSubmissionCount = walletSubmissions.filter(s =>
      s.user_email?.toLowerCase() === user.email?.toLowerCase()
    ).length;

    const isCreator = user.id === appCreatorId;

    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
        {user.is_suspended && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 z-10 bg-red-600 text-white border-red-600"
            style={{
              borderTopLeftRadius: '0',
              borderTopRightRadius: '0.375rem',
              borderBottomLeftRadius: '0.375rem',
              borderBottomRightRadius: '0'
            }}
          >
            Suspended
          </Badge>
        )}
        {isCreator && (
          <Badge
            className="absolute top-2 left-2 z-10 bg-purple-100 text-purple-800 border-purple-200"
          >
            Creator
          </Badge>
        )}
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-gray-50" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 truncate">{user.full_name || 'Unknown User'}</h3>
              <p className="text-sm text-gray-500 truncate">{user.email || 'No email'}</p>
            </div>
          </div>

          <div className="mb-4 text-center">
            <p className="text-sm text-gray-500">Total Balance</p>
            <p className="text-2xl font-bold text-gray-900">${(user.total_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <Button
                variant="link"
                className="h-auto p-0 mt-1 text-blue-600"
                onClick={() => openModal(setIsWalletBreakdownModalOpen, user)}
            >
                View All
            </Button>
          </div>

          <div className="h-16 flex flex-col items-center justify-center gap-2 mb-4 bg-gray-50 rounded-lg p-2">
            {userSubmissionCount > 0 ? (
              <>
                <Wallet className="w-8 h-8 text-green-600" />
                <p className="text-xs text-green-600 font-medium">
                  {userSubmissionCount} wallet{userSubmissionCount > 1 ? 's' : ''} submitted
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400 text-center">No wallets submitted</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                Actions
                <MousePointerClick className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => openModal(setIsWithdrawalCodeModalOpen, user)}>
                <Key className="mr-2 h-4 w-4" />
                Withdrawal Code
              </DropdownMenuItem>

              {/* App 2 Specific Options */}
              {appConfig?.id === 'app2' && (
                <>
                  <DropdownMenuItem onClick={() => handleToggleWalletActivation(user)}>
                    {user.wallet_activated ? (
                      <>
                        <XCircle className="mr-2 h-4 w-4 text-red-500" />
                        Deactivate Wallet
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        Activate Wallet
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsActivationFeeModalOpen(true)}>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Activation Fee
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuItem onClick={() => openModal(setIsCreditModalOpen, user)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Credit User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openModal(setIsDebitModalOpen, user)}>
                <MinusCircle className="mr-2 h-4 w-4" /> Debit User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openModal(setIsViewWalletsModalOpen, user)}>
                <Wallet className="mr-2 h-4 w-4" /> View Wallets
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openModal(setIsTransactionsModalOpen, user)}>
                <BarChart className="mr-2 h-4 w-4" /> Manage Transactions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openModal(setIsHistoryModalOpen, user)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openModal(setIsEmailModalOpen, user)}>
                <Mail className="mr-2 h-4 w-4" /> Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openModal(setIsEditModalOpen, user)}>
                <UserIcon className="mr-2 h-4 w-4" /> Edit User
              </DropdownMenuItem>
               {user.is_suspended ? (
                <DropdownMenuItem
                  onClick={() => openSuspensionModal(user, 'unsuspend')}
                  disabled={isCreator}
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  {isCreator ? 'Cannot Unsuspend Creator' : 'Unsuspend User'}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => openSuspensionModal(user, 'suspend')}
                  disabled={isCreator}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {isCreator ? 'Cannot Suspend Creator' : 'Suspend User'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => openDeleteConfirmation(user)}
                disabled={isCreator}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isCreator ? 'Cannot Delete Creator' : 'Delete User'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading users...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Link to={createPageUrl('AdminDashboard')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-600 hidden md:block">Manage all registered users</p>
              </div>
            </div>
            <Button onClick={() => setIsAddUserModalOpen(true)}>
              <UserPlus className="mr-0 h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Add New User</span>
            </Button>
          </div>

          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map(user => <UserCard key={user.id} user={user} />)}
        </div>
      </main>

      {/* Modals */}
      {isCreditModalOpen && <CreditUserModal isOpen={isCreditModalOpen} onClose={() => setIsCreditModalOpen(false)} user={selectedUser} onUpdate={loadData} onFeedback={showFeedback} />}
      {isDebitModalOpen && <DebitUserModal isOpen={isDebitModalOpen} onClose={() => setIsDebitModalOpen(false)} user={selectedUser} onUpdate={loadData} onFeedback={showFeedback} />}
      {isEditModalOpen && <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={selectedUser} onUpdate={loadData} currentUserRole={userProfile?.role} />}
      {isEmailModalOpen && <SendEmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} user={selectedUser} />}
      {isHistoryModalOpen && <AddHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} user={selectedUser} onUpdate={loadData} />}
      {isAddUserModalOpen && <AddNewUserModal isOpen={isAddUserModalOpen} onClose={() => setIsAddUserModalOpen(false)} onUpdate={loadData} />}
      {isSuspensionModalOpen && <SuspensionModal isOpen={isSuspensionModalOpen} onClose={() => setIsSuspensionModalOpen(false)} user={selectedUser} onUpdate={loadData} action={suspensionAction} />}
      {isTransactionsModalOpen && <TransactionsManagementModal isOpen={isTransactionsModalOpen} onClose={() => setIsTransactionsModalOpen(false)} user={selectedUser} transactions={getUserTransactions(selectedUser?.id)} onUpdate={loadData} />}
      {isWalletBreakdownModalOpen && <WalletBreakdownModal isOpen={isWalletBreakdownModalOpen} onClose={() => setIsWalletBreakdownModalOpen(false)} user={selectedUser} onRefresh={loadData} />}
      {isViewWalletsModalOpen && <ViewUserWalletsModal isOpen={isViewWalletsModalOpen} onClose={() => setIsViewWalletsModalOpen(false)} user={selectedUser} />}
      {isDepositModalOpen && <CreditUserModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} user={selectedUser} onUpdate={loadData} onFeedback={showFeedback} />}

      {/* Withdrawal Code Modal */}
      <WithdrawalCodeModal
        isOpen={isWithdrawalCodeModalOpen}
        onClose={() => setIsWithdrawalCodeModalOpen(false)}
        user={selectedUser}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />

      {/* App 2 Specific Modals */}
      {appConfig?.id === 'app2' && (
        <>
          <WalletActivationStatusModal
            isOpen={isActivationStatusModalOpen}
            onClose={() => setIsActivationStatusModalOpen(false)}
            isActivated={selectedUser?.wallet_activated || false}
            activationFee={activationFee}
            onMakeDeposit={() => {
              setIsActivationStatusModalOpen(false);
              openModal(setIsDepositModalOpen, selectedUser);
            }}
          />

          <ActivationFeeModal
            isOpen={isActivationFeeModalOpen}
            onClose={() => setIsActivationFeeModalOpen(false)}
            currentFee={activationFee}
            onSave={handleSaveActivationFee}
          />
        </>
      )}

      {/* Confirmation Modal for Suspend/Unsuspend/Delete */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, type: '', user: null, action: '', title: '', message: '' })}
        onConfirm={handleConfirmation}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.type === 'suspension' && confirmationModal.action === 'suspend' ? 'Suspend' :
                    confirmationModal.type === 'suspension' ? 'Unsuspend' : 'Delete'}
        confirmVariant={confirmationModal.type === 'delete' ? 'destructive' : 'default'}
      />
    </div>
  );
}
