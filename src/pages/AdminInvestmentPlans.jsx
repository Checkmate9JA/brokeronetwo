
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import AddInvestmentPlanModal from '../components/modals/AddInvestmentPlanModal';
import EditInvestmentPlanModal from '../components/modals/EditInvestmentPlanModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import FeedbackModal from '../components/modals/FeedbackModal'; // Assuming this component exists

export default function AdminInvestmentPlans() {
  const [plans, setPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, planId: null, planName: '' });
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      console.log('🔍 Loading investment plans from Supabase...');
      const { data, error } = await supabase
        .from('investment_plans')
        .select('*')
        .order('min_deposit', { ascending: true }); // Order by lowest minimum amount first

      if (error) {
        throw new Error(`Failed to fetch plans: ${error.message}`);
      }

      console.log('✅ Investment plans loaded:', data?.length || 0);
      setPlans(data || []);
    } catch (error) {
      console.error('❌ Error loading plans:', error);
      showFeedback('error', 'Error', 'Failed to load investment plans.');
    } finally {
      setIsLoading(false);
    }
  };

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (planId) => {
    try {
      const { error } = await supabase
        .from('investment_plans')
        .delete()
        .eq('id', planId);

      if (error) {
        throw new Error(`Failed to delete plan: ${error.message}`);
      }
      showFeedback('success', 'Success!', 'Investment plan deleted successfully!');
      setDeleteConfirmation({ isOpen: false, planId: null, planName: '' });
      loadPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      showFeedback('error', 'Delete Failed', 'Failed to delete investment plan. Please try again.');
    }
  };

  const confirmDelete = (plan) => {
    setDeleteConfirmation({
      isOpen: true,
      planId: plan.id,
      planName: plan.name
    });
  };

  const filteredPlans = plans.filter(plan =>
    plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-50">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Investment Plans</h1>
              {/* Hide subtitle on mobile */}
              <p className="text-gray-500 hidden md:block">Manage investment opportunities for users</p>
            </div>
          </div>
          {/* Mobile: Icon only, Desktop: Full button */}
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Add Investment Plan</span>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Search and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search investment plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Investment Plans Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <Card key={plan.id} className="p-6 bg-white border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <Badge
                    variant={plan.is_active ? "default" : "secondary"}
                    className={plan.is_active ? "bg-green-100 text-green-800" : ""}
                  >
                    {plan.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">ROI: {plan.roi_percentage}%</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Duration: {plan.duration_days} days
                  </div>
                  <div className="text-sm text-gray-600">
                    Min: ${plan.min_deposit?.toLocaleString()} | Max: ${plan.max_deposit?.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Risk Level: <span className="capitalize">{plan.risk_level}</span>
                  </div>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(plan)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => confirmDelete(plan)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredPlans.length === 0 && !isLoading && (
          <Card className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">No investment plans found</h3>
            <p className="text-gray-500">Create your first investment plan to get started.</p>
          </Card>
        )}
      </main>

      <AddInvestmentPlanModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          loadPlans();
          showFeedback('success', 'Success!', 'Investment plan added successfully!');
        }}
      />

      <EditInvestmentPlanModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        plan={editingPlan}
        onSuccess={() => {
          loadPlans();
          showFeedback('success', 'Success!', 'Investment plan updated successfully!');
        }}
      />

      <Dialog open={deleteConfirmation.isOpen} onOpenChange={() => setDeleteConfirmation({ isOpen: false, planId: null, planName: '' })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deleteConfirmation.planName}"? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmation({ isOpen: false, planId: null, planName: '' })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirmation.planId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
