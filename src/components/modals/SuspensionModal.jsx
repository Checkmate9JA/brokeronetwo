import React from 'react';
import { 
  Dialog, 
  DialogContent
} from "@/components/ui/dialog";
import { AlertCircle } from 'lucide-react';

export default function SuspensionModal({ isOpen }) {
  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Prevents closing by clicking outside */ }}>
      <DialogContent className="sm:max-w-md p-0" hideCloseButton>
        <div className="text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Suspended</h2>
          <p className="text-gray-600 mb-8">
            Your account has been temporarily suspended. Please, contact our support team via <a href="mailto:support@supportteam.com" className="text-blue-600 hover:underline">support@supportteam.com</a> for more information and assistance.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}