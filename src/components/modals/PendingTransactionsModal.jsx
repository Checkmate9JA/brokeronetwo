
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Clock, Trash2, ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ConfirmationModal from './ConfirmationModal';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ViewReasonTooltip = ({ reason }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="link" size="sm" className="text-xs p-0 h-auto text-blue-600">
          View Reason
        </Button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="p-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="font-semibold text-red-700">Rejection Reason</span>
          </div>
          <p className="text-sm">{reason || "No specific reason provided by admin."}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function PendingTransactionsModal({ isOpen, onClose, user }) {
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [rejectedDeposits, setRejectedDeposits] = useState([]);
  const [rejectedWithdrawals, setRejectedWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearingList, setIsClearingList] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPendingTransactions();
    }
  }, [isOpen, user]);

  const loadPendingTransactions = async () => {
    setIsLoading(true); // Ensure loading state is true when starting load
    try {
      console.log('🔍 Loading pending transactions from Supabase...');
      
      // Use the user prop if available, otherwise get from auth
      let currentUser = user;
      if (!currentUser) {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !authUser) {
          console.error('Error getting user:', userError);
          setPendingDeposits([]);
          setPendingWithdrawals([]);
          setRejectedDeposits([]);
          setRejectedWithdrawals([]);
          return;
        }
        currentUser = authUser;
      }

      // Fetch only the current user's transactions from Supabase
      const { data: allTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_email', currentUser.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        setPendingDeposits([]);
        setPendingWithdrawals([]);
        setRejectedDeposits([]);
        setRejectedWithdrawals([]);
        return;
      }

      console.log('✅ User transactions loaded:', allTransactions?.length || 0);

      // Filter transactions by type and status
      const deposits = allTransactions?.filter(t => t.type === 'deposit' && t.status === 'pending') || [];
      const withdrawals = allTransactions?.filter(t => t.type === 'withdrawal' && t.status === 'pending') || [];
      const rejectedDep = allTransactions?.filter(t => t.type === 'deposit' && t.status === 'rejected') || [];
      const rejectedWith = allTransactions?.filter(t => t.type === 'withdrawal' && t.status === 'rejected') || [];
      
      console.log('📊 Transaction counts:', {
        pendingDeposits: deposits.length,
        pendingWithdrawals: withdrawals.length,
        rejectedDeposits: rejectedDep.length,
        rejectedWithdrawals: rejectedWith.length
      });
      
      setPendingDeposits(deposits);
      setPendingWithdrawals(withdrawals);
      setRejectedDeposits(rejectedDep);
      setRejectedWithdrawals(rejectedWith);
    } catch (error) {
      console.error('Error loading pending transactions:', error);
      // Set empty arrays on error
      setPendingDeposits([]);
      setPendingWithdrawals([]);
      setRejectedDeposits([]);
      setRejectedWithdrawals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearRejectedList = async () => {
    setShowConfirmModal(false); // Close confirmation modal first
    setIsClearingList(true);
    try {
      // Get all rejected transaction IDs
      const rejectedIds = [
        ...rejectedDeposits.map(t => t.id),
        ...rejectedWithdrawals.map(t => t.id)
      ];

      if (rejectedIds.length === 0) {
        // No transactions to delete, simply return
        setIsClearingList(false); // Ensure loading state is reset
        return;
      }

      // Delete each rejected transaction permanently from Supabase
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .in('id', rejectedIds);
      
      if (deleteError) {
        throw new Error(`Failed to delete transactions: ${deleteError.message}`);
      }

      // Clear the local state
      setRejectedDeposits([]);
      setRejectedWithdrawals([]);
    } catch (error) {
      console.error('Error deleting rejected transactions:', error);
      alert('Failed to delete rejected transactions. Please try again.');
    } finally {
      setIsClearingList(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount) => {
    return `$${amount?.toLocaleString() || '0'}`;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl max-w-[90vw] max-h-[85vh] flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader className="flex flex-row items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Pending Transactions</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="pending" className="w-full h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                                 <TabsTrigger 
                   value="pending" 
                   className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
                 >
                   <Clock className="w-4 h-4" />
                   <span className="data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">Pending ({pendingDeposits.length + pendingWithdrawals.length})</span>
                 </TabsTrigger>
                 <TabsTrigger 
                   value="rejected"
                   className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-sm"
                 >
                   <X className="w-4 h-4" />
                   <span className="data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">Rejected ({rejectedDeposits.length + rejectedWithdrawals.length})</span>
                 </TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="mt-6 flex-1 overflow-auto">
                <div className="space-y-6">
                  {/* Pending Deposits */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowDownLeft className="w-4 h-4 text-green-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Pending Deposits ({pendingDeposits.length})</h3>
                    </div>
                    {isLoading ? (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        Loading pending deposits...
                      </div>
                    ) : pendingDeposits.length > 0 ? (
                      <div className="space-y-2">
                        {pendingDeposits.map((deposit) => (
                          <div key={deposit.id} className="p-4 bg-green-50 dark:bg-orange-50 border border-green-200 dark:border-orange-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <ArrowDownLeft className="w-4 h-4 text-green-600" />
                                <div>
                                  <div className="font-semibold dark:text-gray-900">{formatAmount(deposit.amount)}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-900">{formatDate(deposit.created_at || deposit.created_date)}</div>
                                </div>
                              </div>
                              <Badge className="bg-orange-100 dark:bg-green-100 text-orange-800 dark:text-green-800">Pending</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        No pending deposits
                      </div>
                    )}
                  </div>

                  {/* Pending Withdrawals */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowUpRight className="w-4 h-4 text-orange-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Pending Withdrawals ({pendingWithdrawals.length})</h3>
                    </div>
                    {isLoading ? (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        Loading pending withdrawals...
                      </div>
                    ) : pendingWithdrawals.length > 0 ? (
                      <div className="space-y-2">
                        {pendingWithdrawals.map((withdrawal) => (
                          <div key={withdrawal.id} className="p-4 bg-orange-50 dark:bg-orange-50 border border-orange-200 dark:border-orange-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <ArrowUpRight className="w-4 h-4 text-orange-600" />
                                <div>
                                  <div className="font-semibold dark:text-gray-900">{formatAmount(withdrawal.amount)}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-900">{formatDate(withdrawal.created_at || withdrawal.created_date)}</div>
                                </div>
                              </div>
                              <Badge className="bg-orange-100 dark:bg-green-100 text-orange-800 dark:text-green-800">Pending</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        No pending withdrawals
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="rejected" className="mt-6 flex-1 overflow-auto">
                <div className="space-y-6">
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setShowConfirmModal(true)}
                      disabled={isClearingList || (rejectedDeposits.length === 0 && rejectedWithdrawals.length === 0)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isClearingList ? 'Clearing...' : 'Clear List'}
                    </Button>
                  </div>

                  {/* Rejected Deposits */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowDownLeft className="w-4 h-4 text-red-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Rejected Deposits ({rejectedDeposits.length})</h3>
                    </div>
                    {isLoading ? (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        Loading rejected deposits...
                      </div>
                    ) : rejectedDeposits.length > 0 ? (
                      <div className="space-y-2">
                        {rejectedDeposits.map((deposit) => (
                          <div key={deposit.id} className="p-4 bg-red-50 dark:bg-orange-50 border border-red-200 dark:border-orange-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <ArrowDownLeft className="w-4 h-4 text-red-600" />
                                <div>
                                  <div className="font-semibold dark:text-gray-900">{formatAmount(deposit.amount)}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-900">{formatDate(deposit.created_at || deposit.created_date)}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-red-600 dark:text-gray-900">⚠ Rejected</span>
                                    <ViewReasonTooltip reason={deposit.rejection_reason} />
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        No rejected deposits
                      </div>
                    )}
                  </div>

                  {/* Rejected Withdrawals */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Rejected Withdrawals ({rejectedWithdrawals.length})</h3>
                    </div>
                    {isLoading ? (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        Loading rejected withdrawals...
                      </div>
                    ) : rejectedWithdrawals.length > 0 ? (
                      <div className="space-y-2">
                        {rejectedWithdrawals.map((withdrawal) => (
                          <div key={withdrawal.id} className="p-4 bg-red-50 dark:bg-orange-50 border border-red-200 dark:border-orange-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <ArrowUpRight className="w-4 h-4 text-red-600" />
                                <div>
                                  <div className="font-semibold dark:text-gray-900">{formatAmount(withdrawal.amount)}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-900">{formatDate(withdrawal.created_at || withdrawal.created_date)}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-red-600 dark:text-gray-900">⚠ Rejected</span>
                                    <ViewReasonTooltip reason={withdrawal.rejection_reason} />
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                        No rejected withdrawals
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleClearRejectedList}
        title="Confirm Deletion"
        message="Are you sure you want to permanently delete all rejected transactions? This action cannot be undone."
        confirmText="Yes, Delete All"
        confirmVariant="destructive"
      />
    </>
  );
}
