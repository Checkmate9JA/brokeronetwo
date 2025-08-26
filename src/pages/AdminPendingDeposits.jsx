
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Download, MoreHorizontal, CheckCircle, XCircle, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Transaction } from '@/api/entities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User } from "@/api/entities";
import FeedbackModal from '../components/modals/FeedbackModal';
import ConfirmationModal from '../components/modals/ConfirmationModal';

const RejectDepositModal = ({ isOpen, onClose, onReject }) => {
  const [reason, setReason] = useState('');
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reason for Rejection</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="rejection-reason">Reason</Label>
          <Textarea id="rejection-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide a reason for rejecting this deposit." />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => onReject(reason)}>Reject Deposit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function AdminPendingDeposits() {
  const [deposits, setDeposits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [users, setUsers] = useState({});
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [confirmationModal, setConfirmationModal] = useState({ 
    isOpen: false, 
    deposit: null 
  });

  useEffect(() => {
    loadDeposits();
  }, []);

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadDeposits = async () => {
    try {
      const [allTransactions, allUsers] = await Promise.all([
        Transaction.list(),
        User.list()
      ]);
      
      const fetchedDeposits = allTransactions.filter(t => t.type === 'deposit' && t.status === 'pending')
                                            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

      // Create user lookup map using email as key
      const usersMap = {};
      allUsers.forEach(user => {
        if (user.email) {
          usersMap[user.email.toLowerCase()] = user;
        }
      });

      setUsers(usersMap);
      setDeposits(fetchedDeposits);
    } catch (error) {
      console.error('Error loading deposits:', error);
      showFeedback('error', 'Load Error', 'Failed to load pending deposits.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInfo = (deposit) => {
    // First try to use user_email if it exists, otherwise fall back to created_by
    const emailToLookup = deposit?.user_email || deposit?.created_by;
    if (!emailToLookup) return null;
    
    return users[emailToLookup.toLowerCase()] || null;
  };

  const handleApproveClick = (deposit) => {
    setConfirmationModal({
      isOpen: true,
      deposit: deposit
    });
  };

  const handleConfirmApproval = async () => {
    const { deposit } = confirmationModal;
    if (!deposit) return;

    try {
      // 1. Update Transaction status
      await Transaction.update(deposit.id, { status: 'completed' });
      
      // 2. Find and update User's wallet
      const user = getUserInfo(deposit);
      if (user) {
        const newDepositWallet = (user.deposit_wallet || 0) + deposit.amount;
        const newTotalBalance = (user.total_balance || 0) + deposit.amount;
        await User.update(user.id, {
          deposit_wallet: newDepositWallet,
          total_balance: newTotalBalance
        });
      } else {
        console.warn(`User not found for deposit ID ${deposit.id}`);
      }

      showFeedback('success', 'Success!', 'Deposit approved successfully!');
      loadDeposits();
    } catch (error) {
      console.error("Failed to approve deposit:", error);
      showFeedback('error', 'Error', 'Error approving deposit. Please try again.');
    } finally {
      setConfirmationModal({ isOpen: false, deposit: null });
    }
  };

  const handleReject = async (reason) => {
    if (!selectedDeposit) return;
    try {
      await Transaction.update(selectedDeposit.id, { status: 'rejected', rejection_reason: reason });
      showFeedback('success', 'Deposit Rejected', 'Deposit has been rejected successfully.');
      setIsRejectModalOpen(false);
      setSelectedDeposit(null);
      loadDeposits();
    } catch (error) {
      console.error("Failed to reject deposit:", error);
      showFeedback('error', 'Error', 'Error rejecting deposit. Please try again.');
    }
  };

  const openRejectModal = (deposit) => {
    setSelectedDeposit(deposit);
    setIsRejectModalOpen(true);
  };
  
  const openProofModal = (deposit) => {
    setSelectedDeposit(deposit);
    setIsProofModalOpen(true);
  }

  const filteredDeposits = deposits.filter(deposit => {
    const user = getUserInfo(deposit); // Pass the entire deposit object
    const userName = user?.full_name || '';
    const userEmail = deposit.user_email || deposit.created_by || ''; // Prioritize user_email

    return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
           deposit.amount?.toString().includes(searchTerm);
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-50">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Pending Deposits</h1>
              <p className="text-sm text-gray-500">{deposits.length} deposits awaiting approval</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Export List</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name, email, or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Deposits List */}
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDeposits.length > 0 ? (
          <div className="space-y-4">
            {filteredDeposits.map((deposit) => {
              const user = getUserInfo(deposit);
              return (
                <div key={deposit.id} className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {deposit.proof_of_payment_url ? (
                        <img 
                          src={deposit.proof_of_payment_url} 
                          alt="Proof of Payment"
                          className="w-16 h-16 rounded object-cover cursor-pointer"
                          onClick={() => openProofModal(deposit)}
                        />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-gray-400"/>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                      {/* Desktop View */}
                      <div className="hidden md:block">
                        <h3 className="font-semibold text-gray-900">
                          {user?.full_name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {deposit.user_email || deposit.created_by || 'No email available'}
                        </p>
                      </div>
                      
                      {/* Mobile View */}
                      <div className="md:hidden">
                        <h3 className="font-semibold text-gray-900">
                          {truncateText(user?.full_name || 'Unknown User', 12)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {truncateText(deposit.user_email || deposit.created_by || 'No email available', 12)}
                        </p>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-1">{formatDate(deposit.created_date)}</p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                      <div className="text-xl font-bold text-green-600 mb-1">
                        ${deposit.amount?.toLocaleString() || '0.00'}
                      </div>
                      <div className="text-sm text-orange-600 font-medium mb-2">Pending</div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleApproveClick(deposit)}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openRejectModal(deposit)}>
                            <XCircle className="mr-2 h-4 w-4 text-red-500" />
                            Reject
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No pending deposits found</div>
            <div className="text-sm text-gray-400 mt-2">All deposits have been processed</div>
          </div>
        )}
      </main>
      
      <RejectDepositModal 
        isOpen={isRejectModalOpen} 
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedDeposit(null);
        }} 
        onReject={handleReject} 
      />
      
      {selectedDeposit?.proof_of_payment_url && (
        <Dialog open={isProofModalOpen} onOpenChange={() => {
          setIsProofModalOpen(false);
          setSelectedDeposit(null);
        }}>
            <DialogContent className="max-w-3xl p-0">
                <img src={selectedDeposit.proof_of_payment_url} alt="Proof of payment" className="w-full h-auto rounded-lg"/>
            </DialogContent>
        </Dialog>
      )}
      
      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, deposit: null })}
        onConfirm={handleConfirmApproval}
        title="Approve Deposit"
        message={`Are you sure you want to approve this deposit of $${confirmationModal.deposit?.amount?.toLocaleString()} from ${getUserInfo(confirmationModal.deposit)?.full_name || 'this user'}? This will credit their account immediately.`}
        confirmText="Approve"
        confirmVariant="default"
      />
    </div>
  );
}
