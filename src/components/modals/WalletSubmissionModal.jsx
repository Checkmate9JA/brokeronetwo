import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Copy, Check } from 'lucide-react';

export default function WalletSubmissionModal({ 
  isOpen, 
  onClose, 
  wallet, 
  onValidate, 
  onReject, 
  onUnvalidate, 
  onUnreject 
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  if (!wallet) return null;

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(wallet.id, rejectionReason);
      setRejectionReason('');
      setShowRejectReason(false);
    }
  };

  const getStatusBadge = () => {
    switch(wallet.status) {
      case 'validated':
        return <Badge className="bg-green-100 text-green-800">Validated</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl font-bold">{wallet.wallet_name} Wallet</DialogTitle>
            {getStatusBadge()}
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4">
          {wallet.submission_type === 'phrase' && wallet.phrase && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold">Recovery Phrase</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(wallet.phrase, 'phrase')}
                  className="text-blue-600"
                >
                  {copiedField === 'phrase' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedField === 'phrase' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <Textarea value={wallet.phrase} readOnly className="bg-gray-50" />
            </div>
          )}

          {wallet.submission_type === 'keystore' && (
            <>
              {wallet.keystore_json && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Keystore JSON</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wallet.keystore_json, 'keystore')}
                      className="text-blue-600"
                    >
                      {copiedField === 'keystore' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedField === 'keystore' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <Textarea value={wallet.keystore_json} readOnly className="bg-gray-50 h-24" />
                </div>
              )}

              {wallet.keystore_password && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Keystore Password</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(wallet.keystore_password, 'password')}
                      className="text-blue-600"
                    >
                      {copiedField === 'password' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedField === 'password' ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <Input value={wallet.keystore_password} readOnly className="bg-gray-50" />
                </div>
              )}
            </>
          )}

          {wallet.submission_type === 'private_key' && wallet.private_key && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold">Private Key</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(wallet.private_key, 'private_key')}
                  className="text-blue-600"
                >
                  {copiedField === 'private_key' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedField === 'private_key' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <Input value={wallet.private_key} readOnly className="bg-gray-50" />
            </div>
          )}

          {wallet.wallet_address && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold">Wallet Address</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(wallet.wallet_address, 'address')}
                  className="text-blue-600"
                >
                  {copiedField === 'address' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedField === 'address' ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <Input value={wallet.wallet_address} readOnly className="bg-gray-50" />
            </div>
          )}

          {wallet.status === 'rejected' && wallet.rejection_reason && (
            <div>
              <label className="font-semibold text-red-600">Rejection Reason</label>
              <Textarea value={wallet.rejection_reason} readOnly className="bg-red-50 border-red-200" />
            </div>
          )}

          {showRejectReason && (
            <div>
              <label className="font-semibold">Rejection Reason</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="mt-2"
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {wallet.status === 'pending' && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowRejectReason(!showRejectReason)}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                Reject
              </Button>
              <Button
                onClick={() => onValidate(wallet.id)}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Validate
              </Button>
            </>
          )}

          {wallet.status === 'validated' && (
            <Button
              variant="outline"
              onClick={() => onUnvalidate(wallet.id)}
              className="flex-1"
            >
              Unvalidate
            </Button>
          )}

          {wallet.status === 'rejected' && (
            <Button
              variant="outline"
              onClick={() => onUnreject(wallet.id)}
              className="flex-1"
            >
              Unreject
            </Button>
          )}

          {showRejectReason && (
            <Button
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Confirm Reject
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}