import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Upload } from 'lucide-react';
import { ManagedWallet } from '@/api/entities';
import { UploadFile } from '@/api/integrations';

export default function AddWalletModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [iconFile, setIconFile] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const resetForm = () => {
    setName('');
    setIconFile(null);
    setIsActive(true);
    setPreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIconFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Wallet Name is required.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      let icon_url = '';
      if (iconFile) {
        const result = await UploadFile({ file: iconFile });
        icon_url = result.file_url;
      }
      
      await ManagedWallet.create({
        name: name.trim(),
        icon_url,
        is_active: isActive
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Failed to add wallet:', error);
      alert(`Error adding wallet: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Wallet</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="wallet-name">Wallet Name *</Label>
            <Input 
              id="wallet-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter wallet name"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <Label>Wallet Icon</Label>
            <div 
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => !isSubmitting && fileInputRef.current.click()}
            >
              {preview ? (
                <img src={preview} alt="Icon preview" className="h-24 object-contain" />
              ) : (
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload an image</p>
                  <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
            <Input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/png, image/jpeg, image/svg+xml"
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="active-status">Active Status</Label>
            <Switch 
              id="active-status" 
              checked={isActive} 
              onCheckedChange={setIsActive}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Wallet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}