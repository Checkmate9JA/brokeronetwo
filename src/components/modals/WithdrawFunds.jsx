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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wallet, X, AlertTriangle } from 'lucide-react';
import { Transaction } from '@/api/entities';

export default function WithdrawFunds({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [cryptoType, setCryptoType] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!amount || !cryptoType || !walletAddress) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await Transaction.create({
        type: 'withdrawal',
        amount: parseFloat(amount),
        status: 'pending',
        description: `Withdrawal of ${cryptoType} to ${walletAddress}`,
        payment_method: 'crypto'
      });

      onSuccess && onSuccess();
      onClose();
      setAmount('');
      setCryptoType('');
      setWalletAddress('');
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-purple-600" />
            <DialogTitle className="text-xl font-bold">Withdraw Funds</DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <p className="text-sm text-gray-500 mb-4">
          Enter your withdrawal details to process your request
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="withdrawal-amount" className="font-semibold">Withdrawal Amount</Label>
            <Input
              id="withdrawal-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-2 text-lg py-4 border-2 border-gray-800"
            />
            <div className="text-sm text-gray-500 mt-1">
              Available: $99000000.00
            </div>
          </div>

          <div>
            <Label htmlFor="crypto-type" className="font-semibold">Cryptocurrency Type</Label>
            <Input
              id="crypto-type"
              placeholder="e.g., BTC, USDT, ETH, BNB"
              value={cryptoType}
              onChange={(e) => setCryptoType(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="wallet-address" className="font-semibold">Wallet Address</Label>
            <Input
              id="wallet-address"
              placeholder="Enter your wallet address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="mt-2"
            />
            <div className="text-sm text-gray-500 mt-1">
              Enter your crypto wallet address for receiving funds
            </div>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Important Notice:</strong> Ensure your wallet address and cryptocurrency type are correct.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !amount || !cryptoType || !walletAddress}
              className="flex-1 bg-gray-800 hover:bg-gray-900"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Withdrawal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}