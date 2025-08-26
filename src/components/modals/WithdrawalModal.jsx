
import React, { useState, useEffect } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Key, X, CheckCircle } from 'lucide-react';
import { Transaction } from '@/api/entities';
import { User } from '@/api/entities'; // User entity is still relevant for type definitions or if its properties are used.
import InvalidWithdrawalCodeModal from './InvalidWithdrawalCodeModal';
import FeedbackModal from './FeedbackModal';

// Modified: 'user' and 'preValidated' props added to the component signature
export default function WithdrawalModal({ isOpen, onClose, onSuccess, user, preValidated = false }) {
  const [withdrawalCode, setWithdrawalCode] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [amount, setAmount] = useState('');
  const [cryptoType, setCryptoType] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Removed: user state no longer needed as user is passed as a prop
  // const [user, setUser] = useState(null); 
  const [isInvalidCodeModalOpen, setIsInvalidCodeModalOpen] = useState(false);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

  useEffect(() => {
    if (isOpen) {
      // Removed: loadUser() call as user data is now expected via props
      resetForm();
      if (preValidated) {
        setIsValidated(true);
      }
    }
  }, [isOpen, preValidated]); // Added preValidated to dependency array

  // Removed: loadUser function no longer needed as user is passed as a prop
  /*
  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      
      // Debug logs to help troubleshoot
      console.log('User loaded for withdrawal:', {
        id: currentUser.id,
        email: currentUser.email,
        withdrawal_code: currentUser.withdrawal_code,
        code_length: currentUser.withdrawal_code?.length
      });
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };
  */

  const resetForm = () => {
    setWithdrawalCode('');
    setIsValidated(false);
    setAmount('');
    setCryptoType('');
    setWalletAddress('');
    setDescription('');
  };

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const handleValidateCode = () => {
    // 'user' is now expected as a prop. Add checks for its existence.
    if (!user || !withdrawalCode.trim()) {
      showFeedback('error', 'Error', 'User data is missing or withdrawal code is empty.');
      return;
    }

    // Enhanced debug logging
    console.log('Code validation attempt:', {
      entered: withdrawalCode.trim(),
      expected: user.withdrawal_code,
      entered_length: withdrawalCode.trim().length,
      expected_length: user.withdrawal_code?.length,
      types: {
        entered: typeof withdrawalCode,
        expected: typeof user.withdrawal_code
      }
    });

    // Ensure both values are strings and trim whitespace for comparison
    const enteredCode = String(withdrawalCode).trim();
    const expectedCode = String(user.withdrawal_code || '').trim();

    if (enteredCode === expectedCode && expectedCode !== '') {
      setIsValidated(true);
      console.log('✅ Code validated successfully');
    } else {
      console.log('❌ Code validation failed:', {
        match: enteredCode === expectedCode,
        expectedNotEmpty: expectedCode !== '',
        enteredCode,
        expectedCode
      });
      setIsInvalidCodeModalOpen(true);
    }
  };

  const handleSubmitWithdrawal = async () => {
    if (!amount || !cryptoType || !walletAddress) {
      showFeedback('error', 'Missing Information', 'Please fill in all required fields.');
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      showFeedback('error', 'Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    // Check if user has sufficient balance in profit wallet
    // 'user' is now a prop, so direct access is safe.
    const availableBalance = user?.profit_wallet || 0;
    if (withdrawalAmount > availableBalance) {
      showFeedback('error', 'Insufficient Balance', 'You do not have sufficient balance in your profit wallet.');
      return;
    }

    setIsSubmitting(true);
    try {
      // First, debit the amount from user's profit wallet immediately
      const newProfitWallet = availableBalance - withdrawalAmount;
      const newTotalBalance = (user.total_balance || 0) - withdrawalAmount;
      
      await User.update(user.id, {
        profit_wallet: newProfitWallet,
        total_balance: newTotalBalance
      });

      // Then create the withdrawal request
      await Transaction.create({
        user_email: user.email,
        type: 'withdrawal',
        amount: withdrawalAmount,
        status: 'pending',
        crypto_type: cryptoType,
        wallet_address: walletAddress,
        description: description || `Withdrawal to ${cryptoType} wallet`
      });

      showFeedback('success', 'Success!', `Withdrawal request submitted! $${withdrawalAmount.toFixed(2)} has been deducted from your profit wallet and is pending approval.`);
      
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 2500);

    } catch (error) {
      console.error('Withdrawal failed:', error);
      showFeedback('error', 'Withdrawal Failed', 'There was an error submitting your withdrawal request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="sticky top-0 bg-white z-10 py-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              {isValidated ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Withdrawal Validated
                </>
              ) : (
                <>
                  <Key className="w-6 h-6 text-blue-600" />
                  Activate Withdrawal
                </>
              )}
            </DialogTitle>
            {/* Removed the DialogClose button as per requirements, assuming the DialogClose prop on Dialog handles closing */}
          </DialogHeader>

          <div className="py-4 space-y-6 overflow-y-auto flex-1 px-1">
            {!isValidated ? (
              // Withdrawal Code Entry Form
              <div className="space-y-4 px-5">
                <p className="text-sm text-gray-500">
                  Enter your unique withdrawal code to proceed with withdrawal.
                </p>
                
                <div>
                  <Label htmlFor="withdrawal-code" className="font-semibold">Withdrawal Code</Label>
                  <Input
                    id="withdrawal-code"
                    type="text"
                    placeholder="Enter your withdrawal code"
                    value={withdrawalCode}
                    onChange={(e) => setWithdrawalCode(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <Button 
                  onClick={handleValidateCode}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!withdrawalCode.trim()}
                >
                  Validate Code
                </Button>
              </div>
            ) : (
              // Withdrawal Form (after validation)
              <div className="space-y-4 px-5">
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-medium">Withdrawal code validated successfully!</p>
                  <p className="text-green-600 text-sm">You can now proceed with your withdrawal.</p>
                </div>

                <div>
                  <Label htmlFor="amount" className="font-semibold">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {/* Access user data from props */}
                    Available: ${(user?.profit_wallet || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </p>
                </div>

                <div>
                  <Label htmlFor="crypto-type" className="font-semibold">Cryptocurrency</Label>
                  <Input
                    id="crypto-type"
                    type="text"
                    placeholder="e.g. Bitcoin (BTC)"
                    value={cryptoType}
                    onChange={(e) => setCryptoType(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="wallet-address" className="font-semibold">Wallet Address</Label>
                  <Input
                    id="wallet-address"
                    type="text"
                    placeholder="Enter your wallet address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="font-semibold">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add any additional notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2 h-20"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={onClose} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitWithdrawal}
                    disabled={isSubmitting || !amount || !cryptoType || !walletAddress}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Processing...' : 'Submit Withdrawal'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <InvalidWithdrawalCodeModal
        isOpen={isInvalidCodeModalOpen}
        onClose={() => setIsInvalidCodeModalOpen(false)}
      />

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </>
  );
}
