import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Crown, Shield, CheckCircle, X } from 'lucide-react';
import { useApp } from '../AppProvider';

export default function SwitchAppModal({ isOpen, onClose, onSuccess }) {
  const { currentApp, switchToApp } = useApp();
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedApp(currentApp);
    }
  }, [isOpen, currentApp]);

  const handleSwitchApp = (appId) => {
    setSelectedApp(appId);
  };

  const confirmSwitch = () => {
    if (selectedApp && selectedApp !== currentApp) {
      switchToApp(selectedApp);
      onSuccess && onSuccess(`Successfully switched to ${selectedApp === 'app1' ? 'Advance Investment Platform' : 'Advance Investment Protection Platform'}`);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-600" />
              Switch Application Mode
            </DialogTitle>
            <p className="text-sm text-gray-500 pt-2">
              Choose which application mode to activate. Current: <span className="font-semibold text-purple-600">{currentApp === 'app1' ? 'App 1' : 'App 2'}</span>
            </p>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div 
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedApp === 'app1' 
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
            }`}
            onClick={() => handleSwitchApp('app1')}
          >
            <div className="flex items-center gap-3">
              <Crown className="w-8 h-8 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">App 1: Advance Investment Platform</h3>
                <p className="text-sm text-gray-600">Manage your investments and trading</p>
                <p className="text-xs text-blue-600 mt-1">Features: Wallets, Trading, Investment Plans</p>
              </div>
              {selectedApp === 'app1' && (
                <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
              )}
            </div>
          </div>

          <div 
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedApp === 'app2' 
                ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
            }`}
            onClick={() => handleSwitchApp('app2')}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">App 2: Advance Investment Protection Platform</h3>
                <p className="text-sm text-gray-600">Shield your crypto assets</p>
                <p className="text-xs text-purple-600 mt-1">Features: Account Balance, Fund Management</p>
              </div>
              {selectedApp === 'app2' && (
                <CheckCircle className="w-5 h-5 text-purple-600 ml-auto" />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={confirmSwitch}
            disabled={!selectedApp || selectedApp === currentApp}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {selectedApp === currentApp ? 'Current App' : 'Switch App'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}