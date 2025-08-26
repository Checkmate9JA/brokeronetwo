
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, MoreHorizontal, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Transaction } from '@/api/entities';
import { User } from '@/api/entities';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ViewWalletModal from '../components/modals/ViewWalletModal';
import FeedbackModal from '../components/modals/FeedbackModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';

const RejectWithdrawalModal = ({ isOpen, onClose, onReject }) => {
  const [reason, setReason] = useState('');

  const handleRejectClick = () => {
    onReject(reason);
    setReason('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reason for Rejection</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="rejection-reason">Reason</Label>
          <Textarea 
            id="rejection-reason" 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            placeholder="Provide a reason for rejecting this withdrawal. This will be visible to the user." 
            className="mt-1"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleRejectClick} disabled={!reason.trim()}>Reject Withdrawal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminPendingWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isViewWalletModalOpen, setIsViewWalletModalOpen] = useState(false);
  const [selectedWalletInfo, setSelectedWalletInfo] = useState(null);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [isConfirmingApproval, setIsConfirmingApproval] = useState(false);
  const [withdrawalToProcess, setWithdrawalToProcess] = useState(null);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadWithdrawals = async () => {
    setIsLoading(true);
    try {
      const [allTransactions, allUsers] = await Promise.all([
        Transaction.list(),
        User.list(),
      ]);
      const fetchedWithdrawals = allTransactions.filter(t => t.type === 'withdrawal' && t.status === 'pending')
                                                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      // Create user lookup map using email as key
      const usersMap = {};
      allUsers.forEach(user => {
        if (user.email) {
          usersMap[user.email.toLowerCase()] = user;
        }
      });

      setUsers(usersMap);
      setWithdrawals(fetchedWithdrawals);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getUserInfo = (withdrawal) => {
    // First try to use user_email if it exists
    const emailToLookup = withdrawal.user_email || withdrawal.created_by;
    if (!emailToLookup) return null;
    
    return users[emailToLookup.toLowerCase()] || null;
  };

  const truncateUserInfo = (user, userEmail) => {
    const userName = user?.full_name || 'Unknown User';
    const email = userEmail || 'No email available';
    const fullText = `User: ${userName} (${email})`;
    
    if (fullText.length <= 40) return fullText;
    return fullText.substring(0, 37) + '...';
  };

  const handleApproveClick = (withdrawal) => {
    setWithdrawalToProcess(withdrawal);
    setIsConfirmingApproval(true);
  };
  
  const handleViewWallet = (withdrawal) => {
    setSelectedWalletInfo({
      walletAddress: withdrawal.wallet_address,
      cryptoType: withdrawal.crypto_type
    });
    setIsViewWalletModalOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!withdrawalToProcess) return;

    try {
      await Transaction.update(withdrawalToProcess.id, { status: 'completed' });
      showFeedback('success', 'Success!', 'Withdrawal approved successfully!');
      loadWithdrawals();
    } catch (error) {
      console.error("Failed to approve withdrawal:", error);
      showFeedback('error', 'Error', 'Failed to approve withdrawal. Please try again.');
    } finally {
      setIsConfirmingApproval(false);
      setWithdrawalToProcess(null);
    }
  };

  const handleReject = async (reason) => {
    if (!selectedWithdrawal) return;
    try {
      // 1. Update transaction status
      await Transaction.update(selectedWithdrawal.id, { status: 'rejected', rejection_reason: reason });
      
      // 2. Refund the user
      const user = getUserInfo(selectedWithdrawal);
      if (user) {
        const newProfitWallet = (user.profit_wallet || 0) + selectedWithdrawal.amount;
        const newTotalBalance = (user.total_balance || 0) + selectedWithdrawal.amount;
        await User.update(user.id, {
          profit_wallet: newProfitWallet,
          total_balance: newTotalBalance
        });
      } else {
        console.warn(`User not found for withdrawal refund.`);
      }

      showFeedback('success', 'Success!', 'Withdrawal rejected and funds returned to user.');
      loadWithdrawals();
      setIsRejectModalOpen(false);
      setSelectedWithdrawal(null);
    } catch (error) {
      console.error("Failed to reject withdrawal:", error);
      showFeedback('error', 'Error', 'Failed to reject withdrawal. Please try again.');
    }
  };

  const openRejectModal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setIsRejectModalOpen(true);
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const user = getUserInfo(withdrawal);
    const userName = user?.full_name || '';
    const userEmail = withdrawal.user_email || withdrawal.created_by || '';

    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-50">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pending Withdrawals</h1>
            <p className="text-sm text-gray-500">Review and process withdrawal requests</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search withdrawals (e.g., user, description, ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Withdrawals List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWithdrawals.map((withdrawal) => {
              const user = getUserInfo(withdrawal);
              return (
              <Card key={withdrawal.id} className="p-4 md:p-6 bg-white border border-gray-200">
                <div className="flex flex-col md:flex-row items-start justify-between">
                  <div className="flex-1 mb-4 md:mb-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        Withdrawal Request - ${withdrawal.amount?.toLocaleString()}
                      </h3>
                      <Badge 
                        variant="outline"
                        className='text-yellow-700 border-yellow-200 bg-yellow-50'
                      >
                        {withdrawal.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {truncateUserInfo(user, withdrawal.user_email || withdrawal.created_by)}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-gray-500">
                        {withdrawal.description || `Withdrawal to ${withdrawal.crypto_type || 'crypto'} wallet`}
                      </p>
                      {withdrawal.wallet_address && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-2"
                          onClick={() => handleViewWallet(withdrawal)}
                        >
                          View
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Requested: {new Date(withdrawal.created_date).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" title="More actions">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleApproveClick(withdrawal)}>
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRejectModal(withdrawal)}>
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
              );
            })}
            
            {filteredWithdrawals.length === 0 && (
              <Card className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No pending withdrawals found</h3>
                <p className="text-gray-500">There are no pending withdrawal requests matching your criteria.</p>
              </Card>
            )}
          </div>
        )}
      </main>
      
      <RejectWithdrawalModal 
        isOpen={isRejectModalOpen} 
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedWithdrawal(null);
        }} 
        onReject={handleReject} 
      />
      
      <ViewWalletModal
        isOpen={isViewWalletModalOpen}
        onClose={() => {
          setIsViewWalletModalOpen(false);
          setSelectedWalletInfo(null);
        }}
        walletAddress={selectedWalletInfo?.walletAddress}
        cryptoType={selectedWalletInfo?.cryptoType}
      />

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />

      <ConfirmationModal
        isOpen={isConfirmingApproval}
        onClose={() => setIsConfirmingApproval(false)}
        onConfirm={handleConfirmApproval}
        title="Approve Withdrawal"
        message={`Are you sure you want to approve this withdrawal of $${withdrawalToProcess?.amount?.toLocaleString()} for ${withdrawalToProcess?.user_email || 'this user'}? This action cannot be undone.`}
        confirmText="Approve"
        confirmVariant="default"
      />
    </div>
  );
}
