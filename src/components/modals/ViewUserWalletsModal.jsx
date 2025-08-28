
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Wallet, Copy, Check, Trash2 } from 'lucide-react'; // Added Trash2 import
import { supabase } from '@/lib/supabase';
import FeedbackModal from './FeedbackModal';
import DeleteConfirmationModal from './DeleteConfirmationModal'; // Import confirmation modal

export default function ViewUserWalletsModal({ isOpen, onClose, user }) {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState({});
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionTarget, setRejectionTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false); // State for "Clear All" confirmation modal
  const [isConfirmingSingleDelete, setIsConfirmingSingleDelete] = useState(false); // New state for single delete confirmation
  const [submissionToDelete, setSubmissionToDelete] = useState(null); // New state to hold submission for single delete

  useEffect(() => {
    if (isOpen && user) {
      loadSubmissions();
    } else if (!isOpen) {
      // Reset state when modal closes
      setSubmissions([]);
      setCopyStatus({});
      // Also reset states related to sub-modals for clean slate on re-open
      setIsRejecting(false);
      setRejectionTarget(null);
      setRejectionReason('');
      setIsConfirmingDelete(false);
      setIsConfirmingSingleDelete(false);
      setSubmissionToDelete(null);
    }
  }, [isOpen, user]);

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Loading wallet submissions for user:', user?.email);
      
      // Try to fetch submissions directly first
      let allSubmissions = [];
      let submissionsError = null;
      
      try {
        // Try with created_at first (modern Supabase standard)
        const { data, error } = await supabase
          .from('wallet_submissions')
          .select('*')
          .order('created_at', { ascending: false });
        
        allSubmissions = data || [];
        submissionsError = error;
        
        if (!error) {
          console.log('✅ Successfully ordered by created_at');
        }
      } catch (err) {
        console.log('⚠️ created_at ordering failed, trying created_date...');
        
        // Fallback to created_date if created_at fails
        const { data, error } = await supabase
          .from('wallet_submissions')
          .select('*')
          .order('created_date', { ascending: false });
        
        allSubmissions = data || [];
        submissionsError = error;
        
        if (!error) {
          console.log('✅ Successfully ordered by created_date');
        }
      }
      
      if (submissionsError) {
        console.error('❌ Submissions fetch error:', submissionsError);
        throw new Error(`Failed to fetch submissions: ${submissionsError.message}`);
      }
      
      console.log('✅ Raw submissions fetched:', allSubmissions?.length || 0);
      
      // Filter submissions for the current user
      const userSubmissions = allSubmissions?.filter(s => {
        const matches = s.user_email?.toLowerCase() === user.email?.toLowerCase();
        if (matches) {
          console.log('✅ Found submission:', s.id, s.wallet_name, s.status);
        }
        return matches;
      }) || [];
      
      console.log('✅ User submissions filtered:', userSubmissions.length);
      setSubmissions(userSubmissions);
      
    } catch (error) {
      console.error('❌ Error loading wallet submissions:', error);
      
      // More specific error messages
      let errorMessage = 'Failed to load wallet submissions.';
      if (error.message.includes('Table access error')) {
        errorMessage = 'Database table not accessible. Please check permissions.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error while loading data. Please try again.';
      } else if (error.message.includes('relation "wallet_submissions" does not exist')) {
        errorMessage = 'Wallet submissions table does not exist. Please contact support.';
      }
      
      showFeedback('error', 'Load Error', errorMessage);
      setSubmissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    setIsConfirmingDelete(true); // Open the "Clear All" confirmation modal
  };

  const confirmClearAll = async () => {
    setIsConfirmingDelete(false); // Close "Clear All" confirmation modal
    try {
      const submissionIds = submissions.map(s => s.id);
      if (submissionIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('wallet_submissions')
          .delete()
          .in('id', submissionIds);
        
        if (deleteError) {
          throw new Error(`Failed to delete submissions: ${deleteError.message}`);
        }
        showFeedback('success', 'Cleared!', 'All submissions for this user have been deleted.');
        loadSubmissions(); // Reload the submissions after deletion
      } else {
        showFeedback('info', 'No Submissions', 'There are no submissions to clear for this user.');
      }
    } catch (error) {
      console.error('Failed to clear all submissions:', error);
      showFeedback('error', 'Delete Error', 'An error occurred while deleting all submissions.');
    }
  };

  const handleDeleteSubmission = (submission) => {
    setSubmissionToDelete(submission);
    setIsConfirmingSingleDelete(true); // Open single delete confirmation modal
  };

  const confirmSingleDelete = async () => {
    if (!submissionToDelete) return; // Should not happen if modal is opened correctly

    try {
              const { error: deleteError } = await supabase
          .from('wallet_submissions')
          .delete()
          .eq('id', submissionToDelete.id);
        
        if (deleteError) {
          throw new Error(`Failed to delete submission: ${deleteError.message}`);
        }
      setSubmissions(prev => prev.filter(s => s.id !== submissionToDelete.id));
      showFeedback('success', 'Deleted!', 'Wallet submission has been deleted.');
    } catch (error) {
      console.error('Error deleting wallet submission:', error);
      showFeedback('error', 'Delete Error', 'Failed to delete wallet submission.');
    } finally {
      setIsConfirmingSingleDelete(false); // Close modal
      setSubmissionToDelete(null); // Clear target
    }
  };

  const handleStatusUpdate = async (submissionId, newStatus) => {
    try {
              const { error: updateError } = await supabase
          .from('wallet_submissions')
          .update({ status: newStatus, rejection_reason: '' })
          .eq('id', submissionId);
        
        if (updateError) {
          throw new Error(`Failed to update submission: ${updateError.message}`);
        }
      setSubmissions(prev =>
        prev.map(s => s.id === submissionId ? { ...s, status: newStatus, rejection_reason: '' } : s)
      );
    } catch (error) {
      console.error(`Failed to update status to ${newStatus}:`, error);
      showFeedback('error', 'Update Error', 'Failed to update submission status.');
    }
  };

  const openRejectModal = (submission) => {
    setRejectionTarget(submission);
    setRejectionReason('');
    setIsRejecting(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionTarget) return;
    try {
              const { error: updateError } = await supabase
          .from('wallet_submissions')
          .update({
            status: 'rejected',
            rejection_reason: rejectionReason
          })
          .eq('id', rejectionTarget.id);
        
        if (updateError) {
          throw new Error(`Failed to update submission: ${updateError.message}`);
        }
      setSubmissions(prev =>
        prev.map(s => s.id === rejectionTarget.id ? { ...s, status: 'rejected', rejection_reason: rejectionReason } : s)
      );
    } catch (error) {
       console.error(`Failed to update status to rejected:`, error);
       showFeedback('error', 'Update Error', 'Failed to reject submission.');
    } finally {
      setIsRejecting(false);
      setRejectionTarget(null);
      setRejectionReason(''); // Clear rejection reason after submit
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus(prev => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [id]: false }));
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const StatusBadge = ({ status }) => {
    const statusStyles = {
      pending: "bg-gray-600 text-white",
      validated: "bg-green-600 text-white",
      rejected: "bg-red-600 text-white",
    };
    const capitalizedStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    return <Badge className={`absolute top-2 right-2 z-10 ${statusStyles[status]}`}>{capitalizedStatus}</Badge>;
  };

  const CopyButton = ({ text, id }) => (
    <Button size="sm" variant="ghost" onClick={() => handleCopy(text, id)} className="text-xs h-7">
      {copyStatus[id] ? (
        <>
          <Check className="w-3 h-3 mr-1 text-green-600"/> Copied!
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 mr-1"/> Copy Details
        </>
      )}
    </Button>
  );

  const testSupabaseConnection = async () => {
    try {
      console.log('🧪 Testing Supabase connection...');
      const { data, error } = await supabase.from('wallet_submissions').select('*').limit(1);
      if (error) {
        console.error('❌ Database test failed:', error);
        showFeedback('error', 'Database Error', `Failed to fetch data: ${error.message}`);
      } else {
        console.log('✅ Database test successful:', data);
        showFeedback('success', 'Database OK', `Successfully fetched ${data.length} wallet submissions.`);
      }
    } catch (error) {
      console.error('❌ Unexpected error during test:', error);
      showFeedback('error', 'Database Error', `An unexpected error occurred: ${error.message}`);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pr-6">
          <div className="flex-1">
            <DialogTitle className="text-xl font-bold">
              Wallet Submissions - {user?.full_name}
            </DialogTitle>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => testSupabaseConnection()}
              title="Test database connection"
            >
              Test DB
            </Button>
            {submissions.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Wallet Submissions</h3>
              <p className="text-gray-500">This user hasn't submitted any wallet details yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissions.map((submission) => (
                <Card key={submission.id} className="p-4 flex flex-col relative overflow-hidden">
                  <StatusBadge status={submission.status || 'pending'} />
                  <div className="flex-1 mb-3">
                    <div className="flex items-baseline justify-between mb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {submission.wallet_name}
                        <sup className="ml-1 text-xs font-medium text-gray-500 capitalize">
                          {submission.submission_type?.replace('_', ' ') || 'unknown type'}
                        </sup>
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Submitted {formatDate(submission.created_at || submission.created_date)}
                    </p>

                    {submission.phrase && (
                      <div>
                        <Label className="text-xs font-medium text-gray-500">Recovery Phrase:</Label>
                        <div className="flex items-start justify-between bg-gray-50 p-2 rounded border">
                          <p className="text-xs font-mono break-all flex-1 h-20 overflow-y-auto pr-2">{submission.phrase}</p>
                          <CopyButton text={submission.phrase} id={`phrase-${submission.id}`} />
                        </div>
                      </div>
                    )}
                    {submission.keystore_json && (
                      <div className="mt-2">
                        <Label className="text-xs font-medium text-gray-500">Keystore:</Label>
                         <div className="flex items-start justify-between bg-gray-50 p-2 rounded border">
                          <p className="text-xs font-mono break-all flex-1 h-20 overflow-y-auto pr-2">{submission.keystore_json}</p>
                          <CopyButton text={submission.keystore_json} id={`keystore-${submission.id}`} />
                        </div>
                      </div>
                    )}
                    {submission.keystore_password && (
                      <div className="mt-2">
                        <Label className="text-xs font-medium text-gray-500">Keystore Password:</Label>
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded border">
                          <p className="text-xs font-mono break-all flex-1 pr-2">{submission.keystore_password}</p>
                          <CopyButton text={submission.keystore_password} id={`password-${submission.id}`} />
                        </div>
                      </div>
                    )}
                    {submission.private_key && (
                      <div className="mt-2">
                        <Label className="text-xs font-medium text-gray-500">Private Key:</Label>
                        <div className="flex items-start justify-between bg-gray-50 p-2 rounded border">
                          <p className="text-xs font-mono break-all flex-1 h-20 overflow-y-auto pr-2">{submission.private_key}</p>
                          <CopyButton text={submission.private_key} id={`privatekey-${submission.id}`} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                      onClick={() => handleDeleteSubmission(submission)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {/* Status Update Buttons */}
                    <div className="flex gap-2">
                      {submission.status === 'rejected' ? (
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(submission.id, 'pending')}>Unreject</Button>
                      ) : (
                        <Button size="sm" variant="destructive" onClick={() => openRejectModal(submission)}>Reject</Button>
                      )}
                      {submission.status === 'validated' ? (
                        <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(submission.id, 'pending')}>Unvalidate</Button>
                      ) : (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate(submission.id, 'validated')}>Validate</Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Rejection Reason Modal */}
    <Dialog open={isRejecting} onOpenChange={setIsRejecting}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reject Wallet Submission</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="rejection-reason">Reason (Optional)</Label>
                <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejecting this wallet submission..."
                    className="mt-2"
                />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => { setIsRejecting(false); setRejectionReason(''); setRejectionTarget(null); }}>Cancel</Button>
                <Button variant="destructive" onClick={handleRejectSubmit}>Confirm Rejection</Button>
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

    {/* Confirmation Modal for Clear All */}
    <DeleteConfirmationModal
      isOpen={isConfirmingDelete}
      onClose={() => setIsConfirmingDelete(false)}
      onConfirm={confirmClearAll}
      title="Confirm Deletion"
      message={`Are you sure you want to delete all ${submissions.length} wallet submissions for this user? This action cannot be undone.`}
    />

    {/* Confirmation Modal for Single Delete */}
    <DeleteConfirmationModal
      isOpen={isConfirmingSingleDelete}
      onClose={() => {
        setIsConfirmingSingleDelete(false);
        setSubmissionToDelete(null);
      }}
      onConfirm={confirmSingleDelete}
      title="Confirm Delete Submission"
      message={`Are you sure you want to delete the wallet submission for "${submissionToDelete?.wallet_name || 'this wallet'}"? This action cannot be undone.`}
    />
    </>
  );
}