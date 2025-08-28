
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

const generateWithdrawalCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function AddNewUserModal({ isOpen, onClose, onSuccess }) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [isCreating, setIsCreating] = useState(false);

  // Reset form fields when modal opens
  useEffect(() => {
    if (isOpen) {
      // Force reset all fields to be completely blank
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('user');
      
      // Force a small delay to ensure state is properly reset
      setTimeout(() => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setRole('user');
      }, 10);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!firstName || !email) {
      toast({
        title: "Validation Error",
        description: "Please fill in first name and email.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter a password for the new user.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const newUser = {
        full_name: `${firstName} ${lastName}`.trim(),
        email: email,
        role: role,
        withdrawal_code: generateWithdrawalCode(),
        total_balance: 0,
        deposit_wallet: 0,
        profit_wallet: 0,
        trading_wallet: 0,
        referrer_bonus: 0,
        is_suspended: false,
        wallet_activated: false,
        created_at: new Date().toISOString()
      };

      // Create user in Supabase
      const { error: insertError } = await supabase
        .from('users')
        .insert(newUser);

      if (insertError) {
        throw new Error(`Failed to create user: ${insertError.message}`);
      }
      
      toast({
        title: "Success!",
        description: "User created successfully!",
        variant: "success",
      });
      onSuccess && onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "User Creation Failed",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('user');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} key={`add-user-${isOpen}`}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            <DialogTitle className="text-xl font-bold">Add New User</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="first-name" className="font-semibold">First Name</Label>
            <Input
              id="first-name"
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="last-name" className="font-semibold">Last Name (Optional)</Label>
            <Input
              id="last-name"
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="email-address" className="font-semibold">Email Address</Label>
            <Input
              id="email-address"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
              key={`email-${isOpen}`}
            />
          </div>

          <div>
            <Label htmlFor="user-role" className="font-semibold">User Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select user role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                {/* Super Admin option removed - only Super Admins can create Super Admin users */}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="password" className="font-semibold">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2"
              key={`password-${isOpen}`}
            />
          </div>

          <div>
            <Label htmlFor="confirm-password" className="font-semibold">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2"
              key={`confirm-password-${isOpen}`}
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
              disabled={isCreating || !firstName || !email || !password || password !== confirmPassword}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isCreating ? 'Creating...' : 'Create User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
