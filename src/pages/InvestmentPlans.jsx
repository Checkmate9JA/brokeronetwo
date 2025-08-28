
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

  useEffect(() => {
    loadData();
  }, []);

  // New helper function for showing feedback
  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadData = async () => {
    setIsLoading(true); // Set loading true before starting data fetch
    try {
      console.log('🔍 Loading investment data from Supabase...');
      
      // Fetch active investment plans from Supabase
      const { data: fetchedPlans, error: plansError } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('is_active', true)
        .order('min_deposit', { ascending: true }); // Order by lowest minimum amount first
      
      if (plansError) {
        throw new Error(`Failed to fetch plans: ${plansError.message}`);
      }
      
      console.log('✅ Investment plans loaded:', fetchedPlans?.length || 0);
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
          console.warn('Could not fetch user profile:', profileError);
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
          console.warn('Could not fetch user investments:', investmentsError);
          setMyInvestments([]);
        } else {
          setMyInvestments(investments || []);
        }
      } else {
        setUser(null);
        setMyInvestments([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
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
      await supabase
        .from('transactions')
        .insert({
          type: 'transfer', // Changed type to 'transfer' as per outline
          amount: investment.amount_invested,
          status: 'completed',
          description: `Investment cancelled: ${investment.plan_name} - Capital returned`, // Changed description as per outline
          user_email: user.email, // Ensure transaction is linked to user
          created_by: user.email, // Added created_by field
        });
      
      showFeedback('success', 'Investment Cancelled', 'Capital has been returned to your trading wallet.'); // Use feedback modal
      loadData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error cancelling investment:', error);
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
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="available">Available Plans</TabsTrigger>
            <TabsTrigger value="my-investments">My Investments ({myInvestments.filter(i => i.status === 'active').length})</TabsTrigger>
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

          <TabsContent value="my-investments">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your investments...</p>
              </div>
            ) : myInvestments.length > 0 ? (
              <div className="space-y-6">
                {myInvestments.map((investment) => {
                  const isActive = investment.status === 'active';
                  const maturityDate = new Date(investment.maturity_date);
                  const today = new Date();
                  const daysRemaining = Math.ceil((maturityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <Card key={investment.id} className="bg-white p-6 shadow-md border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{investment.plan_name}</h3>
                          <p className="text-gray-500">Invested on {new Date(investment.created_date).toLocaleDateString()}</p>
                        </div>
                        <Badge 
                          className={
                            investment.status === 'active' ? 'bg-green-100 text-green-800' :
                            investment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            investment.status === 'completed' ? 'bg-purple-100 text-purple-800' : 
                            'bg-blue-100 text-blue-800'
                          }
                        >
                          {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
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
                            {isActive ? 'Days Remaining' : 'Duration'}
                          </div>
                          <div className="text-lg font-bold">
                            {isActive ? `${Math.max(0, daysRemaining)} day${Math.max(0, daysRemaining) !== 1 ? 's' : ''}` : `${investment.duration_days} day${investment.duration_days !== 1 ? 's' : ''}`}
                          </div>
                        </div>
                      </div>
                      
                      {isActive && (
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <div className="text-sm text-gray-600">
                            Matures on: {maturityDate.toLocaleDateString()}
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
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Investments Yet</h3>
                <p className="text-gray-500 mb-6">Start building your investment portfolio today.</p>
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
          setActiveTab('my-investments'); // Switch to my investments tab
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
