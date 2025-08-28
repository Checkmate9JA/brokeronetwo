
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WalletRejected({ isOpen, onClose }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReason, setShowReason] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchReason = async () => {
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          throw new Error('Failed to get current user');
        }
                  const { data: submissions, error } = await supabase
          .from('wallet_submissions')
          .select('*')
          .eq('user_email', user.email)
          .eq('status', 'rejected');
        
        if (error) {
          throw new Error(`Failed to fetch submissions: ${error.message}`);
        }
          if (submissions.length > 0) {
            // Show the reason from the most recent rejected submission
            setRejectionReason(submissions[0].rejection_reason || 'No reason provided by administrator.');
          }
        } catch (error) {
          console.error("Failed to fetch rejection reason:", error);
          setRejectionReason('Could not load rejection reason.');
        }
      };
      fetchReason();
      setShowReason(false); // Reset on open
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <div></div> {/* Placeholder for left alignment */}
            <DialogClose asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
          <div className="flex items-center justify-center flex-col gap-4 text-center">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-bold">Wallet Submission Rejected</DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4 text-center">
          <p className="text-gray-600 mb-6">
            Your recent wallet submission has been rejected. Please review the reason below and submit your wallet details again.
          </p>

          {rejectionReason && (
            <div className="mb-6">
              <Button variant="link" onClick={() => setShowReason(!showReason)} className="text-blue-600">
                {showReason ? 'Hide Reason' : 'See Reason'}
              </Button>
              {showReason && (
                <div className="mt-2 p-3 bg-gray-50 border rounded-md text-sm text-gray-700">
                  {rejectionReason}
                </div>
              )}
            </div>
          )}
          
          <Link to={createPageUrl('ConnectWallet')}>
            <Button className="w-full" onClick={onClose}>
              Re-Submit Wallet
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
