
import React, { useState, useRef, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadFile } from "@/api/integrations";

import { supabase } from '@/lib/supabase';
import { DollarSign, Copy, Upload, Check, Info, PlusCircle, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger, // Added TooltipTrigger import
} from "@/components/ui/tooltip";
import FeedbackModal from './FeedbackModal';

const CopyButton = ({ value, instruction }) => {
    const [copied, setCopied] = useState(false);
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex justify-end items-center gap-4 mt-2">
            {instruction && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="link" className="p-0 h-auto text-blue-600">Instructions</Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{instruction}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-600 hover:text-blue-700 h-auto p-1"
                onClick={copyToClipboard}
            >
                {copied ? (
                    <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied!
                    </>
                ) : (
                    <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Details
                    </>
                )}
            </Button>
        </div>
    );
};

export default function DepositModal({ isOpen, onClose, onSuccess, user }) {
  const [activeTab, setActiveTab] = useState('crypto');
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState({ crypto: null, bank: null, paypal: null });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]); // Keep dependency on isOpen for loading settings

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadSettings = async () => {
    setLoadingSettings(true);
    try {
        console.log('🔍 Loading payment settings for deposit modal...');
        
        // Fetch payment settings from Supabase
        const { data: allSettings, error } = await supabase
          .from('payment_settings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching payment settings:', error);
          showFeedback('error', 'Error', 'Failed to load payment methods.');
          return;
        }

        console.log('✅ Payment settings loaded for deposit:', allSettings);

        // Find settings by type
        const cryptoSetting = allSettings?.find(s => s.setting_type === 'crypto');
        const bankSetting = allSettings?.find(s => s.setting_type === 'bank');
        const paypalSetting = allSettings?.find(s => s.setting_type === 'paypal');

        // Parse wallets JSON for crypto settings
        if (cryptoSetting && cryptoSetting.wallets) {
          try {
            cryptoSetting.wallets = JSON.parse(cryptoSetting.wallets);
          } catch (e) {
            console.warn('Failed to parse crypto wallets JSON:', e);
            cryptoSetting.wallets = [];
          }
        }

        const newSettings = {
            crypto: cryptoSetting?.is_enabled ? cryptoSetting : null,
            bank: bankSetting?.is_enabled ? bankSetting : null,
            paypal: paypalSetting?.is_enabled ? paypalSetting : null,
        };
        setSettings(newSettings);

        const firstAvailableMethod = 
            newSettings.crypto ? 'crypto' :
            newSettings.bank ? 'bank' :
            newSettings.paypal ? 'paypal' : '';
        setActiveTab(firstAvailableMethod); // Set initial active tab

        if (newSettings.crypto && newSettings.crypto.wallets && newSettings.crypto.wallets.length > 0) {
            setSelectedCrypto(newSettings.crypto.wallets[0].name);
        }

    } catch (error) {
        console.error("Failed to load payment settings", error);
        showFeedback('error', 'Error', 'Failed to load payment settings.');
    } finally {
        setLoadingSettings(false);
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size <= 1024 * 1024) { // Max 1MB
        setUploadedFile(file);
      } else {
        showFeedback('error', 'File Too Large', 'File is too large. Max 1MB.');
        setUploadedFile(null); // Clear file if too large
      }
    }
  };
  
  const handleSubmit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
        showFeedback('error', 'Invalid Amount', 'Please enter a valid deposit amount.');
        return;
    }
    if (activeTab === 'crypto' && (!selectedCrypto || !settings.crypto?.wallets?.find(w => w.name === selectedCrypto))) {
        showFeedback('error', 'Selection Needed', 'Please select a cryptocurrency wallet.');
        return;
    }
    if (!uploadedFile) {
        showFeedback('error', 'File Required', 'Please upload proof of payment.');
        return;
    }
    
    setIsSubmitting(true);
    try {
        const { file_url } = await UploadFile({ file: uploadedFile });
        
        const transactionData = {
            user_email: user.email, // Add user's email
            type: 'deposit',
            amount: parseFloat(depositAmount),
            status: 'pending',
            proof_of_payment_url: file_url,
            payment_method: activeTab,
            description: `Deposit via ${activeTab}`
        };

        if (activeTab === 'crypto') {
            const currentSelectedWallet = settings.crypto?.wallets?.find(w => w.name === selectedCrypto);
            if (currentSelectedWallet) {
                transactionData.crypto_type = currentSelectedWallet.name;
                transactionData.wallet_address = currentSelectedWallet.address;
            }
        }
        
        // Create transaction in Supabase
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert(transactionData);
        
        if (transactionError) {
          throw new Error(`Transaction creation failed: ${transactionError.message}`);
        }
        
        showFeedback('success', 'Success!', 'Deposit submitted successfully! Your deposit will be reviewed and processed.');
        onSuccess();
        onClose();
        // Reset form
        setDepositAmount('');
        setUploadedFile(null);

    } catch (error) {
        console.error("Deposit failed:", error);
        showFeedback('error', 'Deposit Failed', 'There was an error submitting your deposit. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const selectedWallet = settings.crypto?.wallets?.find(w => w.name === selectedCrypto);

  const hasPaymentMethods = settings.crypto || settings.bank || settings.paypal;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              <DialogTitle className="text-xl font-bold">Deposit Funds</DialogTitle>
            </div>
        </DialogHeader>

        {loadingSettings ? <div className="flex-1 overflow-y-auto py-8 text-center">Loading payment methods...</div> : (
        <>
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-6">
            Select a payment method, make payment and upload/submit proof of payment.
          </p>

          <div className="mb-6">
            <Label htmlFor="deposit-amount" className="font-semibold">Deposit Amount</Label>
            <Input 
                id="deposit-amount" 
                type="number"
                placeholder="0.00" 
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="mt-2"
            />
          </div>
          
          {hasPaymentMethods ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                {settings.crypto && <TabsTrigger value="crypto">Crypto</TabsTrigger>}
                {settings.bank && <TabsTrigger value="bank">Bank Transfer</TabsTrigger>}
                {settings.paypal && <TabsTrigger value="paypal">PayPal</TabsTrigger>}
              </TabsList>
              
              {settings.crypto && (
              <TabsContent value="crypto" className="pt-6 space-y-4">
                <div>
                  <Label className="font-semibold">Select Cryptocurrency</Label>
                  <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                      <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select a crypto" />
                      </SelectTrigger>
                      <SelectContent>
                          {settings.crypto.wallets?.map(wallet => (
                              <SelectItem key={wallet.name} value={wallet.name}>{wallet.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-semibold">Wallet Address</Label>
                   <div className="p-4 bg-gray-50 border rounded-md">
                      <span className="font-mono text-gray-800 break-all">{selectedWallet?.address || ''}</span>
                      <CopyButton value={selectedWallet?.address || ''} />
                  </div>
                </div>
              </TabsContent>
              )}

              {settings.bank && (
              <TabsContent value="bank" className="pt-6">
                  <Label className="font-semibold">Bank Details</Label>
                  <div className="p-4 mt-2 space-y-3 bg-gray-50 border rounded-md text-gray-800">
                      <p><strong className="text-gray-900">Account:</strong> {settings.bank.account_name}</p>
                      <p><strong className="text-gray-900">Number:</strong> {settings.bank.account_number}</p>
                      <p><strong className="text-gray-900">Bank:</strong> {settings.bank.bank_name}</p>
                      <p><strong className="text-gray-900">SWIFT:</strong> {settings.bank.swift_code}</p>
                      <CopyButton 
                          value={
                              `Account: ${settings.bank.account_name}\nNumber: ${settings.bank.account_number}\nBank: ${settings.bank.bank_name}\nSWIFT: ${settings.bank.swift_code}`
                          }
                          instruction={settings.bank.instructions}
                      />
                  </div>
              </TabsContent>
              )}

              {settings.paypal && (
              <TabsContent value="paypal" className="pt-6">
                  <Label className="font-semibold">PayPal Details</Label>
                  <div className="p-4 mt-2 space-y-3 bg-gray-50 border rounded-md">
                      <p className="font-mono">{settings.paypal.paypal_email}</p>
                      <CopyButton 
                          value={settings.paypal.paypal_email} 
                          instruction={settings.paypal.instructions}
                      />
                  </div>
              </TabsContent>
              )}
            </Tabs>
          ) : (
            <div className="py-8 text-center text-gray-500 bg-gray-50 rounded-lg">
              No payment methods have been configured by the administrator.
            </div>
          )}

          <div className="mt-6">
            <Label className="font-semibold">Proof of Payment</Label>
            <div 
              className="mt-2 flex items-center justify-between border rounded-md p-2 cursor-pointer hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-gray-600 truncate">
                {uploadedFile ? uploadedFile.name : 'Choose File'}
              </span>
              <Upload className="w-5 h-5 text-gray-500" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange}
              accept="image/jpeg, image/png"
            />
            <p className="text-xs text-gray-500 mt-2">JPG, PNG only. Max 1MB.</p>
          </div>
        </div>
        
        <DialogFooter className="p-6 border-t">
            <div className="flex justify-end gap-2 w-full">
                <Button variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !depositAmount || !uploadedFile}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {isSubmitting ? 'Submitting...' : 'Submit Deposit'}
                </Button>
            </div>
        </DialogFooter>
        </>
        )}
      </DialogContent>
    </Dialog>
    
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
