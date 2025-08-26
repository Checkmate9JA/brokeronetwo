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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { X, Settings, Plus, Trash2 } from 'lucide-react';
import { PaymentSetting } from '@/api/entities';
import FeedbackModal from './FeedbackModal'; // Import FeedbackModal

export default function PaymentSettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    crypto: { id: null, is_enabled: true, wallets: [] },
    bank: { id: null, is_enabled: true, account_name: '', account_number: '', bank_name: '', swift_code: '', instructions: '' },
    paypal: { id: null, is_enabled: true, paypal_email: '', instructions: '' }
  });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' }); // Feedback state

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadSettings = async () => {
    setLoading(true);
    try {
      const allSettings = await PaymentSetting.list();
      let cryptoSetting = allSettings.find(s => s.setting_type === 'crypto');
      let bankSetting = allSettings.find(s => s.setting_type === 'bank');
      let paypalSetting = allSettings.find(s => s.setting_type === 'paypal');

      setSettings({
        crypto: cryptoSetting || { id: null, setting_type: 'crypto', is_enabled: true, wallets: [] },
        bank: bankSetting || { id: null, setting_type: 'bank', is_enabled: true, account_name: '', account_number: '', bank_name: '', swift_code: '', instructions: '' },
        paypal: paypalSetting || { id: null, setting_type: 'paypal', is_enabled: true, paypal_email: '', instructions: '' }
      });
    } catch (error) {
      console.error("Failed to load payment settings:", error);
      showFeedback('error', 'Error', 'Failed to load payment settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (settingType) => {
    try {
      const settingData = { ...settings[settingType], setting_type: settingType };
      
      // Clean up data for non-crypto settings to avoid sending empty wallet array
      if (settingType !== 'crypto') {
        delete settingData.wallets;
      }
      
      if (settingData.id) {
        const { id, ...updateData } = settingData;
        await PaymentSetting.update(id, updateData);
      } else {
        const newSetting = await PaymentSetting.create(settingData);
        setSettings(prev => ({ ...prev, [settingType]: { ...prev[settingType], id: newSetting.id } }));
      }
      showFeedback('success', 'Success', `${settingType.charAt(0).toUpperCase() + settingType.slice(1)} settings saved!`);
    } catch (error) {
      console.error(`Failed to save ${settingType} settings:`, error);
      showFeedback('error', 'Error', `Error saving ${settingType} settings.`);
    }
  };

  const handleCryptoChange = (index, field, value) => {
    const updatedWallets = [...settings.crypto.wallets];
    updatedWallets[index][field] = value;
    setSettings(prev => ({ ...prev, crypto: { ...prev.crypto, wallets: updatedWallets }}));
  }

  const addCryptoWallet = () => {
    setSettings(prev => ({...prev, crypto: {...prev.crypto, wallets: [...prev.crypto.wallets, {name: '', address: ''}]}}));
  }

  const removeCryptoWallet = (index) => {
    const updatedWallets = settings.crypto.wallets.filter((_, i) => i !== index);
    setSettings(prev => ({...prev, crypto: {...prev.crypto, wallets: updatedWallets}}));
  }
  
  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold">Payment Settings</DialogTitle>
          </div>
          <p className="text-sm text-gray-500">Manage payment methods and their configurations for user deposits.</p>
        </DialogHeader>

        {loading ? <div className="py-8 text-center">Loading settings...</div> : (
          <Tabs defaultValue="crypto" className="w-full mt-4">
            <TabsList>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
              <TabsTrigger value="bank">Bank</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="crypto" className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Switch id="enable-crypto" checked={settings.crypto.is_enabled} onCheckedChange={(checked) => setSettings(p => ({...p, crypto: {...p.crypto, is_enabled: checked}}))} />
                  <Label htmlFor="enable-crypto">Enable Cryptocurrency Payments</Label>
                </div>
                <Button onClick={addCryptoWallet}><Plus className="w-4 h-4 mr-2" /> Add Wallet</Button>
              </div>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                {settings.crypto.wallets.map((wallet, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <Input placeholder="Wallet Name (e.g. Bitcoin)" value={wallet.name} onChange={(e) => handleCryptoChange(index, 'name', e.target.value)} />
                    </div>
                    <div className="col-span-7">
                      <Input placeholder="Wallet Address" value={wallet.address} onChange={(e) => handleCryptoChange(index, 'address', e.target.value)} />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" onClick={() => removeCryptoWallet(index)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                  <Button onClick={() => handleSave('crypto')}>Save Crypto Settings</Button>
              </div>
            </TabsContent>

            <TabsContent value="bank" className="pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Switch id="enable-bank" checked={settings.bank.is_enabled} onCheckedChange={(checked) => setSettings(p => ({...p, bank: {...p.bank, is_enabled: checked}}))}/>
                <Label htmlFor="enable-bank">Enable Bank Payments</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Account Name" value={settings.bank.account_name} onChange={(e) => setSettings(p => ({...p, bank: {...p.bank, account_name: e.target.value}}))}/>
                <Input placeholder="Account Number" value={settings.bank.account_number} onChange={(e) => setSettings(p => ({...p, bank: {...p.bank, account_number: e.target.value}}))}/>
                <Input placeholder="Bank Name" value={settings.bank.bank_name} onChange={(e) => setSettings(p => ({...p, bank: {...p.bank, bank_name: e.target.value}}))}/>
                <Input placeholder="SWIFT Code" value={settings.bank.swift_code} onChange={(e) => setSettings(p => ({...p, bank: {...p.bank, swift_code: e.target.value}}))}/>
                <Textarea className="col-span-2" placeholder="Instructions (Optional)" value={settings.bank.instructions} onChange={(e) => setSettings(p => ({...p, bank: {...p.bank, instructions: e.target.value}}))}/>
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={() => handleSave('bank')}>Save Bank Details</Button>
              </div>
            </TabsContent>

            <TabsContent value="paypal" className="pt-4">
               <div className="flex items-center space-x-2 mb-4">
                <Switch id="enable-paypal" checked={settings.paypal.is_enabled} onCheckedChange={(checked) => setSettings(p => ({...p, paypal: {...p.paypal, is_enabled: checked}}))}/>
                <Label htmlFor="enable-paypal">Enable PayPal</Label>
              </div>
              <div className="space-y-4">
                <Input placeholder="PayPal Email" value={settings.paypal.paypal_email} onChange={(e) => setSettings(p => ({...p, paypal: {...p.paypal, paypal_email: e.target.value}}))} />
                <Textarea placeholder="Instructions (Optional)" value={settings.paypal.instructions} onChange={(e) => setSettings(p => ({...p, paypal: {...p.paypal, instructions: e.target.value}}))} />
              </div>
              <div className="mt-6 flex justify-end">
                 <Button onClick={() => handleSave('paypal')}>Save PayPal Details</Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
        
        <div className="mt-4 flex justify-end">
            <DialogClose asChild>
                <Button variant="outline">Close</Button>
            </DialogClose>
        </div>
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