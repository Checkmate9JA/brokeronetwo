
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
import { Textarea } from "@/components/ui/textarea";
import { X, Mail } from 'lucide-react';
import { SendEmail } from '@/api/integrations';

export default function SendEmailModal({ isOpen, onClose, userName, userEmail }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !message) {
      alert('Please fill in all fields');
      return;
    }

    setIsSending(true);
    try {
      await SendEmail({
        to: userEmail,
        subject: subject,
        body: message
      });
      
      alert('Email sent successfully!');
      onClose();
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'User';
    return fullName.split(' ')[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold">
              Send Email to {getFirstName(userName)}
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email-to" className="font-semibold">To</Label>
            <Input
              id="email-to"
              value={userEmail || ''}
              disabled
              className="mt-2 bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="email-subject" className="font-semibold">Subject</Label>
            <Input
              id="email-subject"
              placeholder="Enter email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="email-message" className="font-semibold">Message</Label>
            <Textarea
              id="email-message"
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 min-h-32"
            />
          </div>

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
              disabled={isSending || !subject || !message}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
