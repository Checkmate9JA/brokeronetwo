
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash, ArrowLeft, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import AddWalletModal from '../components/modals/AddWalletModal';
import EditWalletModal from '../components/modals/EditWalletModal';
import FeedbackModal from '../components/modals/FeedbackModal';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

export default function AdminManageWallets() {
  const [wallets, setWallets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState({});
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

  useEffect(() => {
    loadWallets();
  }, []);

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadWallets = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading wallets from Supabase...');
      const { data: walletsData, error } = await supabase
        .from('managed_wallets')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('❌ Error loading wallets:', error);
        showFeedback('error', 'Error', 'Failed to load wallets. Please refresh the page.');
        return;
      }
      
      console.log('✅ Loaded wallets:', walletsData);
      // Sort alphabetically
      const sortedWallets = (walletsData || []).sort((a, b) => a.name.localeCompare(b.name));
      setWallets(sortedWallets);
    } catch (error) {
      console.error('❌ Error loading wallets:', error);
      showFeedback('error', 'Error', 'Failed to load wallets. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (wallet) => {
    const operationKey = `toggle_${wallet.id}`;
    setOperationLoading(prev => ({ ...prev, [operationKey]: true }));
    
    try {
      console.log('Toggling wallet status for:', wallet);
      
      const { data: updatedWallet, error: updateError } = await supabase
        .from('managed_wallets')
        .update({
          name: wallet.name, // Include name to avoid potential issues
          icon_url: wallet.icon_url || '', // Include icon_url
          is_active: !wallet.is_active
        })
        .eq('id', wallet.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update wallet: ${updateError.message}`);
      }
      
      console.log('Successfully toggled wallet status:', updatedWallet);
      showFeedback('success', 'Success', `Wallet ${wallet.name} has been ${!wallet.is_active ? 'activated' : 'deactivated'}.`);
      
      // Refresh the list
      await loadWallets();
    } catch (error) {
      console.error('Error toggling wallet status:', error);
      showFeedback('error', 'Error', `Failed to update ${wallet.name} status. ${error.message || 'Please try again.'}`);
    } finally {
      setOperationLoading(prev => ({ ...prev, [operationKey]: false }));
    }
  };

  const handleDeleteRequest = (wallet) => {
    setSelectedWallet(wallet);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedWallet) return;

    const wallet = selectedWallet;
    setIsDeleteModalOpen(false);
    setSelectedWallet(null);
    
    const operationKey = `delete_${wallet.id}`;
    setOperationLoading(prev => ({ ...prev, [operationKey]: true }));
      
      try {
        console.log('Attempting to delete wallet:', wallet);
        
        // First, try to get any related wallet submissions from Supabase
        const { data: relatedSubmissions, error: submissionsError } = await supabase
          .from('wallet_submissions')
          .select('*')
          .eq('wallet_name', wallet.name);
        
        if (submissionsError) {
          console.log('Could not fetch related submissions:', submissionsError);
        }
        
        console.log('Found related submissions:', relatedSubmissions?.length || 0);
        
        // Delete related submissions first
        if (relatedSubmissions && relatedSubmissions.length > 0) {
          const submissionIds = relatedSubmissions.map(s => s.id);
          const { error: deleteSubmissionsError } = await supabase
            .from('wallet_submissions')
            .delete()
            .in('id', submissionIds);
          
          if (deleteSubmissionsError) {
            console.log('Could not delete some submissions:', deleteSubmissionsError);
          } else {
            console.log(`Deleted ${relatedSubmissions.length} related submissions`);
          }
        }
        
        // Now try to delete the wallet from Supabase
        const { error: deleteWalletError } = await supabase
          .from('managed_wallets')
          .delete()
          .eq('id', wallet.id);
        
        if (deleteWalletError) {
          throw new Error(`Failed to delete wallet: ${deleteWalletError.message}`);
        }
        
        console.log('Successfully deleted wallet');
        
        showFeedback('success', 'Success', `${wallet.name} wallet and ${relatedSubmissions.length} related submissions have been deleted successfully.`);
        
        // Refresh the list
        await loadWallets();
        
      } catch (error) {
        console.error('Error deleting wallet:', error);
        
        // Try an alternative approach - just mark as inactive
        try {
          console.log('Deletion failed, trying to deactivate instead...');
          const { error: deactivateError } = await supabase
            .from('managed_wallets')
            .update({
              name: wallet.name,
              icon_url: wallet.icon_url || '',
              is_active: false
            })
            .eq('id', wallet.id);
          
          if (deactivateError) {
            throw new Error(`Failed to deactivate wallet: ${deactivateError.message}`);
          }
          
          showFeedback('success', 'Wallet Deactivated', `${wallet.name} could not be deleted but has been deactivated instead. It will no longer be available to users.`);
          await loadWallets();
          
        } catch (updateError) {
          console.error('Even deactivation failed:', updateError);
          
          let errorMessage = 'Unable to delete or deactivate the wallet. ';
          if (error.message && error.message.includes('Network Error')) {
            errorMessage += 'This may be due to network connectivity issues. Please check your connection and try again.';
          } else if (error.message && error.message.includes('403')) {
            errorMessage += 'Permission denied. Please ensure you have admin privileges.';
          } else if (error.message && error.message.includes('409')) {
            errorMessage += 'This wallet may be referenced by other records and cannot be deleted.';
          } else {
            errorMessage += 'Please try again or contact support if the problem persists.';
          }
          
          showFeedback('error', 'Operation Failed', errorMessage);
        }
      } finally {
        setOperationLoading(prev => ({ ...prev, [operationKey]: false }));
      }
  };

  const handleEdit = (wallet) => {
    setSelectedWallet(wallet);
    setIsEditModalOpen(true);
  };

  const filteredWallets = wallets.filter(wallet =>
    wallet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('AdminDashboard')}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Wallets</h1>
                {/* Hide subtitle on mobile */}
                <p className="text-gray-600 hidden md:block">Add, edit, and manage available wallet options</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile: Icon only, Desktop: Full button */}
              <Button variant="outline" onClick={loadWallets}>
                <RefreshCw className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Refresh</span>
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Add Wallet</span>
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search wallets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-2xl font-bold text-gray-900">{wallets.length}</div>
            <div className="text-sm text-gray-600">Total Wallets</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-green-600">{wallets.filter(w => w.is_active).length}</div>
            <div className="text-sm text-gray-600">Active Wallets</div>
          </Card>
          <Card className="p-6">
            <div className="text-2xl font-bold text-red-600">{wallets.filter(w => !w.is_active).length}</div>
            <div className="text-sm text-gray-600">Inactive Wallets</div>
          </Card>
        </div>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredWallets.map((wallet) => {
            const toggleLoading = operationLoading[`toggle_${wallet.id}`];
            const deleteLoading = operationLoading[`delete_${wallet.id}`];
            
            return (
              <Card key={wallet.id} className="p-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {wallet.icon_url ? (
                      <img 
                        src={wallet.icon_url} 
                        alt={wallet.name}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-12 h-12 bg-gray-200 rounded-full items-center justify-center text-gray-500 text-lg font-semibold ${wallet.icon_url ? 'hidden' : 'flex'}`}
                    >
                      {wallet.name.charAt(0)}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{wallet.name}</h3>
                  
                  <Badge className={wallet.is_active ? 'bg-green-100 text-green-800' : 'bg-red-600 text-white'}>
                    {wallet.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEdit(wallet)}
                    disabled={toggleLoading || deleteLoading}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={`flex-1 ${wallet.is_active ? 'text-red-600' : 'text-green-600'}`}
                    onClick={() => handleToggleActive(wallet)}
                    disabled={toggleLoading || deleteLoading}
                  >
                    {toggleLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      wallet.is_active ? 'Deactivate' : 'Activate'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => handleDeleteRequest(wallet)}
                    disabled={toggleLoading || deleteLoading}
                  >
                    {deleteLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredWallets.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No wallets found</div>
            <p className="text-gray-500 mt-2">
              {searchTerm ? 'Try adjusting your search terms.' : 'Start by adding your first wallet.'}
            </p>
          </div>
        )}
      </main>

      <AddWalletModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          loadWallets();
          showFeedback('success', 'Success', 'Wallet added successfully!');
        }}
      />

      <EditWalletModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          loadWallets();
          showFeedback('success', 'Success', 'Wallet updated successfully!');
        }}
        wallet={selectedWallet}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Wallet"
        message={`Are you sure you want to delete the wallet "${selectedWallet?.name}"? This will also delete all associated user submissions. This action cannot be undone.`}
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
