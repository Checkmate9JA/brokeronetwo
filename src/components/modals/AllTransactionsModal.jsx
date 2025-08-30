
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Zap, TrendingUp, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const iconMap = {
  deposit: ArrowDownLeft,
  withdrawal: ArrowUpRight,
  transfer: ArrowRightLeft,
  profit: TrendingUp,
  bonus: Gift,
};

export default function AllTransactionsModal({ isOpen, onClose, user }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUserAndTransactions = async () => {
        setIsLoading(true);
        try {
            console.log('🔍 Loading user and transactions from Supabase...');
            
            // Use the user prop if available, otherwise get from auth
            let currentUserData = user;
            if (!currentUserData) {
                const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
                if (userError || !authUser) {
                    console.error('Error getting user:', userError);
                    setCurrentUser(null);
                    setTransactions([]);
                    return;
                }
                currentUserData = authUser;
            }

            // Get user profile from users table
            const { data: userProfile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUserData.email)
                .single();

            if (profileError) {
                console.error('Error fetching user profile:', profileError);
                // Use basic user info if profile fetch fails
                setCurrentUser({ ...currentUserData, role: 'user' });
            } else {
                setCurrentUser(userProfile);
            }

            let fetchedTransactions = [];
            
            if (userProfile && userProfile.role === 'admin') {
                // Admin can see all transactions
                const { data: allTransactions, error: transactionsError } = await supabase
                    .from('transactions')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (transactionsError) {
                    console.error('Error fetching all transactions:', transactionsError);
                } else {
                    fetchedTransactions = allTransactions || [];
                }
            } else if (currentUserData) {
                // Regular user sees only their transactions
                const { data: userTransactions, error: transactionsError } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_email', currentUserData.email)
                    .order('created_at', { ascending: false });
                
                if (transactionsError) {
                    console.error('Error fetching user transactions:', transactionsError);
                } else {
                    fetchedTransactions = userTransactions || [];
                }
            }

            console.log('✅ Transactions loaded:', fetchedTransactions.length);
            setTransactions(fetchedTransactions);
        } catch (error) {
            console.error('Error loading user and transactions:', error);
            setTransactions([]);
        } finally {
            setIsLoading(false);
        }
    };

    if (isOpen) {
        fetchUserAndTransactions();
    }
  }, [isOpen, user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  const formatAmount = (amount, type) => {
    const formatted = amount?.toLocaleString() || '0';
    return type === 'withdrawal' ? `-$${formatted}` : `+$${formatted}`;
  };

  const getIcon = (type) => {
    const Icon = iconMap[type] || ArrowRightLeft;
    const color = type === 'bonus' ? 'text-purple-600' : '';
    return <Icon className={`w-4 h-4 ${color}`} />;
  };

  const getSummaryStats = () => {
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const pendingTransactions = transactions.filter(t => t.status === 'pending');
    const totalIn = completedTransactions
      .filter(t => t.type === 'deposit' || t.type === 'profit' || t.type === 'transfer' || t.type === 'bonus')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalOut = completedTransactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    return {
      totalCompleted: completedTransactions.length,
      totalPending: pendingTransactions.length,
      totalIn,
      totalOut
    };
  };

  const stats = getSummaryStats();
  const isAdmin = currentUser && currentUser.role === 'admin';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <div>
              <DialogTitle className="text-xl font-bold">All Transactions</DialogTitle>
              <p className="text-sm text-gray-500 pt-2">View your complete transaction history and activity records</p>
            </div>
          </div>
        </DialogHeader>

        {/* Desktop Table / Mobile Cards */}
        <div className="flex-1 overflow-auto">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-600">
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-left py-3 px-2">Amount</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-left py-3 px-2">Description</th>
                  <th className="text-left py-3 px-2">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(10).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-3 px-2"><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></td>
                      <td className="py-3 px-2"><div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div></td>
                      <td className="py-3 px-2"><div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div></td>
                      <td className="py-3 px-2"><div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div></td>
                      <td className="py-3 px-2"><div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div></td>
                    </tr>
                  ))
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {getIcon(transaction.type)}
                          <span className="capitalize font-medium">{transaction.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`font-bold ${
                          transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatAmount(transaction.amount, transaction.type)}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {transaction.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-600">
                        {transaction.description || 'No description provided'}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-500">
                        {formatDate(transaction.created_at || transaction.created_date)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <div key={i} className="bg-white border rounded-lg p-4 animate-pulse">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              ))
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {getIcon(transaction.type)}
                      <div>
                        <div className="font-medium capitalize">{transaction.type}</div>
                        <div className={`text-sm font-bold ${
                          transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {formatAmount(transaction.amount, transaction.type)}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {transaction.description || 'No description provided'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.created_at || transaction.created_date)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary Stats - ADMIN ONLY */}
        {isAdmin && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.totalCompleted}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{stats.totalPending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-4 lg:col-span-2">
                <div>
                    <div className="text-2xl font-bold text-green-600">${stats.totalIn.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total In</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-red-600">${stats.totalOut.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Out</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
