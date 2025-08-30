
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import InvestNowModal from '../components/modals/InvestNowModal';
import { Badge } from "@/components/ui/badge";
import FeedbackModal from '../components/modals/FeedbackModal';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const truncateDescription = (text, maxLines = 2) => {
  if (!text) return '';
  // This approach uses a fixed character limit as `line-clamp` handles the visual truncation
  // but for consistency in data passed to a potentially truncated string,
  // we can limit characters to avoid overly long strings before CSS truncates.
  // A rough estimate: 60-70 characters per line for average text size.
  const maxChars = maxLines * 70; 
  if (text.length > maxChars) {
    return text.substring(0, maxChars).split(' ').slice(0, -1).join(' ') + '...';
  }
  return text;
};

export default function InvestmentPlans() {
  const [plans, setPlans] = useState([]);
  const [myInvestments, setMyInvestments] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, investment: null });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  // Real-time countdown timer - updates every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date();
      setCurrentTime(newTime);
      
      // Log countdown updates for debugging
      const activeInvestments = myInvestments.filter(i => i.status === 'active');
      if (activeInvestments.length > 0) {
        activeInvestments.forEach(inv => {
          const timeRemaining = calculateTimeRemaining(inv.maturity_date);
          if (timeRemaining.days === 0 && timeRemaining.hours < 6) {
            // console.log(`⚠️ Investment "${inv.plan_name}" matures soon: ${formatTimeRemaining(timeRemaining)}`);
          }
        });
      }
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [myInvestments]);

  // More frequent updates for investments close to maturity (less than 1 hour remaining)
  useEffect(() => {
    const hasNearMaturityInvestments = myInvestments.some(investment => {
      if (investment.status !== 'active') return false;
      const timeRemaining = calculateTimeRemaining(investment.maturity_date);
      return timeRemaining.days === 0 && timeRemaining.hours < 1;
    });

    if (hasNearMaturityInvestments) {
      const frequentTimer = setInterval(() => {
        setCurrentTime(new Date());
      }, 10000); // Update every 10 seconds for near-maturity investments

      return () => clearInterval(frequentTimer);
    }
  }, [myInvestments]);

  // Helper function to calculate time remaining with real-time updates
  const calculateTimeRemaining = (maturityDate) => {
    const now = currentTime;
    const maturity = new Date(maturityDate);
    const timeDiff = maturity.getTime() - now.getTime();
    
    if (timeDiff <= 0) {
      return { days: 0, hours: 0, minutes: 0, isExpired: true };
    }
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, isExpired: false };
  };

  // Helper function to format time remaining
  const formatTimeRemaining = (timeRemaining) => {
    if (timeRemaining.isExpired) {
      return 'Expired';
    }
    
    if (timeRemaining.days > 0) {
      return `${timeRemaining.days} day${timeRemaining.days !== 1 ? 's' : ''}`;
    } else if (timeRemaining.hours > 0) {
      return `${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    } else if (timeRemaining.minutes > 0) {
      return `${timeRemaining.minutes}m`;
    } else {
      return 'Less than 1m';
    }
  };

  // New helper function for showing feedback
  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadData = async () => {
    setIsLoading(true); // Set loading true before starting data fetch
    try {
      // console.log('🔍 Loading investment data from Supabase...');
      
      // Fetch active investment plans from Supabase
      const { data: fetchedPlans, error: plansError } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('is_active', true)
        .order('min_deposit', { ascending: true }); // Order by lowest minimum amount first
      
      if (plansError) {
        throw new Error(`Failed to fetch plans: ${plansError.message}`);
      }
      
      // console.log('✅ Investment plans loaded:', fetchedPlans?.length || 0);
      setPlans(fetchedPlans || []);
      
      // Get current user from Supabase auth
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Failed to get current user: ${userError.message}`);
      }
      
      if (currentUser) {
        // Fetch user profile from public.users table
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('email', currentUser.email)
          .single();
        
        if (profileError) {
          // console.warn('Could not fetch user profile:', profileError);
          // Use basic user info from auth
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            full_name: currentUser.user_metadata?.full_name || 'User'
          });
        } else {
          setUser(userProfile);
        }
        
        // Load user's investments from user_investments table
        const { data: investments, error: investmentsError } = await supabase
          .from('user_investments')
          .select('*')
          .eq('user_email', currentUser.email);
        
        if (investmentsError) {
          // console.warn('Could not fetch user investments:', investmentsError);
          setMyInvestments([]);
        } else {
          setMyInvestments(investments || []);
        }
      } else {
        setUser(null);
        setMyInvestments([]);
      }
      
    } catch (error) {
      // console.error('❌ Error loading data:', error);
      showFeedback('error', 'Data Load Error', 'Failed to load investment data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvestClick = (plan) => {
    setSelectedPlan(plan);
    setIsInvestModalOpen(true);
  };
  
  // Function to open the confirmation modal
  const handleConfirmCancel = (investment) => {
    setDeleteConfirmation({ isOpen: true, investment });
  };

  const handleCancelInvestment = async () => {
    const investment = deleteConfirmation.investment; // Get investment from state
    if (!investment) return; // Should not happen if modal is opened correctly
    
    try {
      // Update investment status
      await supabase
        .from('user_investments')
        .update({
          status: 'cancelled',
          profit_earned: 0, // Mark profit as 0 since it's cancelled early
          // Removed actual_maturity_date as per outline
        })
        .eq('id', investment.id);
      
      // Return capital to trading wallet
      const newTradingBalance = (user.trading_wallet || 0) + investment.amount_invested;
      await supabase
        .from('users')
        .update({
          trading_wallet: newTradingBalance
        })
        .eq('id', user.id);
      
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          type: 'transfer', // Changed type to 'transfer' as per outline
          amount: investment.amount_invested,
          status: 'completed',
          description: `Investment cancelled: ${investment.plan_name} - Capital returned`, // Changed description as per outline
          user_email: user.email, // Ensure transaction is linked to user
        });
      
      showFeedback('success', 'Investment Cancelled', 'Capital has been returned to your trading wallet.'); // Use feedback modal
      loadData(); // Reload data to reflect changes
    } catch (error) {
      // console.error('Error cancelling investment:', error);
      showFeedback('error', 'Cancellation Failed', 'Failed to cancel investment. Please try again.'); // Use feedback modal
    } finally {
        setDeleteConfirmation({ isOpen: false, investment: null }); // Close confirmation modal regardless of success/failure
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-50">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Investment Plans</h1>
            <p className="text-sm text-gray-500">Explore and manage your investment opportunities</p>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="available">Available Plans</TabsTrigger>
            <TabsTrigger value="ongoing">Ongoing ({myInvestments.filter(i => i.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="matured">Matured ({myInvestments.filter(i => i.status === 'matured').length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({myInvestments.filter(i => i.status === 'cancelled').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading investment plans...</p>
              </div>
            ) : plans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className="p-6 bg-white border border-gray-200 hover:shadow-lg transition-shadow h-full flex flex-col">
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <Badge 
                          className={`${
                            plan.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                            plan.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {plan.risk_level} risk
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                          <span className="text-gray-600">ROI:</span>
                          <span className="font-semibold text-green-600">{plan.roi_percentage}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-semibold">{plan.duration_days} day{plan.duration_days !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Min - Max:</span>
                          <span className="font-semibold">{formatCurrency(plan.min_deposit)} - {formatCurrency(plan.max_deposit)}</span>
                        </div>
                      </div>

                      <div className="mb-6 h-12">
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                          {truncateDescription(plan.description, 2)}
                        </p>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleInvestClick(plan)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Invest Now
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Investment Plans Available</h3>
                <p className="text-gray-500">Please check back later for new investment opportunities.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="ongoing">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your ongoing investments...</p>
              </div>
            ) : myInvestments.filter(i => i.status === 'active').length > 0 ? (
              <div className="space-y-6">
                {/* Summary section */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{myInvestments.filter(i => i.status === 'active').length}</div>
                      <div className="text-sm text-gray-600">Active Investments</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(myInvestments.filter(i => i.status === 'active').reduce((sum, inv) => sum + parseFloat(inv.amount_invested), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Invested</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(myInvestments.filter(i => i.status === 'active').reduce((sum, inv) => sum + parseFloat(inv.expected_profit), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Expected Profit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {myInvestments.filter(i => i.status === 'active').filter(inv => {
                          const timeRemaining = calculateTimeRemaining(inv.maturity_date);
                          return timeRemaining.days === 0 && timeRemaining.hours < 24;
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600">Matures Today</div>
                    </div>
                  </div>
                </div>
                
                {myInvestments.filter(i => i.status === 'active').map((investment) => {
                  const isActive = investment.status === 'active';
                  const maturityDate = new Date(investment.maturity_date);
                  const timeRemaining = calculateTimeRemaining(investment.maturity_date);
                  
                  return (
                    <Card key={investment.id} className="bg-white p-6 shadow-md border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{investment.plan_name}</h3>
                          <p className="text-gray-500">Invested on {(() => {
                            try {
                              // Try created_at first (correct field), fallback to created_date for backward compatibility
                              const dateValue = investment.created_at || investment.created_date;
                              if (!dateValue) return 'Date unavailable';
                              
                              const investDate = new Date(dateValue);
                              return isNaN(investDate.getTime()) ? 'Date unavailable' : investDate.toLocaleDateString();
                            } catch (error) {
                              return 'Date unavailable';
                            }
                          })()}</p>
                        </div>
                        <Badge 
                          className={
                            investment.status === 'active' ? 'bg-green-100 text-green-800' :
                            investment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            investment.status === 'completed' ? 'bg-purple-100 text-purple-800' : 
                            'bg-blue-100 text-blue-800'
                          }
                        >
                          Active
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <div className="text-sm text-gray-500">Amount Invested</div>
                          <div className="text-lg font-bold">{formatCurrency(investment.amount_invested)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Expected Profit</div>
                          <div className="text-lg font-bold text-green-600">+{formatCurrency(investment.expected_profit)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">ROI</div>
                          <div className="text-lg font-bold text-blue-600">{investment.roi_percentage}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">
                            {isActive ? 'Time Remaining' : 'Duration'}
                          </div>
                          <div className={`text-lg font-bold ${timeRemaining.isExpired ? 'text-red-600' : timeRemaining.days === 0 && timeRemaining.hours < 6 ? 'text-orange-600' : 'text-blue-600'}`}>
                            {isActive ? formatTimeRemaining(timeRemaining) : `${investment.duration_days} day${investment.duration_days !== 1 ? 's' : ''}`}
                          </div>
                          {isActive && timeRemaining.days === 0 && timeRemaining.hours < 6 && (
                            <div className="text-xs text-orange-600 font-medium">
                              ⚠️ Matures soon!
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Progress bar for active investments */}
                      {isActive && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Started: {(() => {
                              try {
                                // Try created_at first (correct field), fallback to created_date for backward compatibility
                                const dateValue = investment.created_at || investment.created_date;
                                if (!dateValue) return 'Date unavailable';
                                
                                const startDate = new Date(dateValue);
                                return isNaN(startDate.getTime()) ? 'Date unavailable' : startDate.toLocaleDateString();
                              } catch (error) {
                                return 'Date unavailable';
                              }
                            })()}</span>
                            <span>Matures: {maturityDate.toLocaleDateString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-1000 ${
                                timeRemaining.isExpired ? 'bg-red-500' : 
                                timeRemaining.days === 0 && timeRemaining.hours < 6 ? 'bg-orange-500' : 'bg-blue-500'
                              }`}
                              style={{
                                width: `${Math.max(0, Math.min(100, ((investment.duration_days * 24 * 60) - (timeRemaining.days * 24 * 60 + timeRemaining.hours * 60 + timeRemaining.minutes)) / (investment.duration_days * 24 * 60) * 100))}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {isActive && (
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="text-sm text-gray-600">
                            Matures on: {maturityDate.toLocaleDateString()}
                            {timeRemaining.days === 0 && timeRemaining.hours < 24 && (
                              <span className="ml-2 text-blue-600 font-medium">
                                (Today at {maturityDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})
                              </span>
                            )}
                          </div>
                          <Button 
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleConfirmCancel(investment)}
                          >
                            Cancel Investment
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Ongoing Investments</h3>
                <p className="text-gray-500 mb-6">Start investing in available plans to see them here.</p>
                <Button onClick={() => setActiveTab('available')} className="bg-blue-600 hover:bg-blue-700">
                  Browse Investment Plans
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="matured">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your matured investments...</p>
              </div>
            ) : myInvestments.filter(i => i.status === 'matured').length > 0 ? (
              <div className="space-y-6">
                {myInvestments.filter(i => i.status === 'matured').map((investment) => (
                  <Card key={investment.id} className="bg-white p-6 shadow-md border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{investment.plan_name}</h3>
                        <p className="text-gray-500">Invested on {(() => {
                          try {
                            // Try created_at first (correct field), fallback to created_date for backward compatibility
                            const dateValue = investment.created_at || investment.created_date;
                            if (!dateValue) return 'Date unavailable';
                            
                            const investDate = new Date(dateValue);
                            return isNaN(investDate.getTime()) ? 'Date unavailable' : investDate.toLocaleDateString();
                          } catch (error) {
                            return 'Date unavailable';
                          }
                        })()}</p>
                      </div>
                      <Badge 
                        className={
                          investment.status === 'active' ? 'bg-green-100 text-green-800' :
                          investment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          investment.status === 'completed' ? 'bg-purple-100 text-purple-800' : 
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        Matured
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <div className="text-sm text-gray-500">Amount Invested</div>
                        <div className="text-lg font-bold">{formatCurrency(investment.amount_invested)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Expected Profit</div>
                        <div className="text-lg font-bold text-green-600">+{formatCurrency(investment.expected_profit)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">ROI</div>
                        <div className="text-lg font-bold text-blue-600">{investment.roi_percentage}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Duration
                        </div>
                        <div className="text-lg font-bold text-gray-600">{investment.duration_days} day{investment.duration_days !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    
                    {/* Progress bar for matured investments */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Invested: {(() => {
                          try {
                            // Try created_at first (correct field), fallback to created_date for backward compatibility
                            const dateValue = investment.created_at || investment.created_date;
                            if (!dateValue) return 'Date unavailable';
                            
                            const investDate = new Date(dateValue);
                            return isNaN(investDate.getTime()) ? 'Date unavailable' : investDate.toLocaleDateString();
                          } catch (error) {
                            return 'Date unavailable';
                          }
                        })()}</span>
                        <span>Matured: {new Date(investment.matured_at || investment.created_at || investment.created_date).toLocaleDateString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-purple-500"
                          style={{
                            width: '100%'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* No action buttons for matured investments */}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Matured Investments</h3>
                <p className="text-gray-500 mb-6">Your matured investments will appear here.</p>
                <Button onClick={() => setActiveTab('available')} className="bg-blue-600 hover:bg-blue-700">
                  Browse Investment Plans
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your cancelled investments...</p>
              </div>
            ) : myInvestments.filter(i => i.status === 'cancelled').length > 0 ? (
              <div className="space-y-6">
                {myInvestments.filter(i => i.status === 'cancelled').map((investment) => (
                  <Card key={investment.id} className="bg-white p-6 shadow-md border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{investment.plan_name}</h3>
                        <p className="text-gray-500">Invested on {(() => {
                          try {
                            // Try created_at first (correct field), fallback to created_date for backward compatibility
                            const dateValue = investment.created_at || investment.created_date;
                            if (!dateValue) return 'Date unavailable';
                            
                            const investDate = new Date(dateValue);
                            return isNaN(investDate.getTime()) ? 'Date unavailable' : investDate.toLocaleDateString();
                          } catch (error) {
                            return 'Date unavailable';
                          }
                        })()}</p>
                      </div>
                      <Badge 
                        className={
                          investment.status === 'active' ? 'bg-green-100 text-green-800' :
                          investment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          investment.status === 'completed' ? 'bg-purple-100 text-purple-800' : 
                          'bg-blue-100 text-blue-800'
                        }
                      >
                        Cancelled
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <div className="text-sm text-gray-500">Amount Invested</div>
                        <div className="text-lg font-bold">{formatCurrency(investment.amount_invested)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Expected Profit</div>
                        <div className="text-lg font-bold text-green-600">+{formatCurrency(investment.expected_profit)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">ROI</div>
                        <div className="text-lg font-bold text-blue-600">{investment.roi_percentage}%</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">
                          Duration
                        </div>
                        <div className="text-lg font-bold text-gray-600">{investment.duration_days} day{investment.duration_days !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    
                    {/* Progress bar for cancelled investments */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Invested: {(() => {
                          try {
                            // Try created_at first (correct field), fallback to created_date for backward compatibility
                            const dateValue = investment.created_at || investment.created_date;
                            if (!dateValue) return 'Date unavailable';
                            
                            const investDate = new Date(dateValue);
                            return isNaN(investDate.getTime()) ? 'Date unavailable' : investDate.toLocaleDateString();
                          } catch (error) {
                            return 'Date unavailable';
                          }
                        })()}</span>
                        <span>Cancelled: {new Date(investment.cancelled_at || investment.created_at || investment.created_date).toLocaleDateString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-red-500"
                          style={{
                            width: '100%'
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* No action buttons for cancelled investments */}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Cancelled Investments</h3>
                <p className="text-gray-500 mb-6">Your cancelled investments will appear here.</p>
                <Button onClick={() => setActiveTab('available')} className="bg-blue-600 hover:bg-blue-700">
                  Browse Investment Plans
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <InvestNowModal
        isOpen={isInvestModalOpen}
        onClose={() => setIsInvestModalOpen(false)}
        plan={selectedPlan}
        user={user}
        onSuccess={() => {
          setIsInvestModalOpen(false);
          loadData(); // Reload data after successful investment
          setActiveTab('ongoing'); // Switch to ongoing investments tab
          showFeedback('success', 'Investment Successful!', 'Your investment has been processed successfully.'); // Use feedback modal
        }}
        onFeedback={showFeedback}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
          isOpen={deleteConfirmation.isOpen}
          onClose={() => setDeleteConfirmation({ isOpen: false, investment: null })}
          onConfirm={handleCancelInvestment}
          title="Cancel Investment"
          message={`Are you sure you want to cancel this investment? You will lose all potential profits (${formatCurrency(deleteConfirmation.investment?.expected_profit || 0)}) and only receive your original investment of ${formatCurrency(deleteConfirmation.investment?.amount_invested || 0)} back.`}
      />
      
      {/* Feedback Modal */}
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
