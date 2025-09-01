
import React, { useState, useEffect, useRef } from 'react';
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
import { CurrencyAPI } from '@/api/currencies';


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
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [currencies, setCurrencies] = useState([]);
  const [isCreating, setIsCreating] = useState(false);


  // Refs for password fields to force clear them
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  // Reset form fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('user');
      setPreferredCurrency('USD');
      setExchangeRates({});
      
      // Clear password fields
      if (passwordRef.current) passwordRef.current.value = '';
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = '';
      
      loadCurrencies();
    }
  }, [isOpen]);



  const loadCurrencies = async () => {
    try {
      const currenciesData = await CurrencyAPI.getAll();
      setCurrencies(currenciesData);
    } catch (error) {
      console.error('Error loading currencies:', error);
      toast({
        title: "Error",
        description: "Failed to load currencies. Please try again.",
        variant: "destructive",
      });
    }
  };



  const handleCreateUser = async () => {
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email address is required.",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Validation Error",
        description: "Password is required.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.trim(),
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          role: role,
          preferred_currency: preferredCurrency
        }
      });

      if (authError) {
        throw authError;
      }

      const userId = authData.user.id;

      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          role: role,
          preferred_currency: preferredCurrency,
          withdrawal_code: generateWithdrawalCode(),
          withdrawal_option: 'withdrawal_code'
        });

      if (profileError) {
        // If profile creation fails, delete the auth user
        await supabase.auth.admin.deleteUser(userId);
        throw profileError;
      }

      toast({
        title: "Success!",
        description: `User ${firstName} ${lastName} has been created successfully.`,
      });

      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole('user');
      setPreferredCurrency('USD');
      
      // Clear password fields
      if (passwordRef.current) passwordRef.current.value = '';
      if (confirmPasswordRef.current) confirmPasswordRef.current.value = '';

      // Close modal and refresh user list
      onClose();
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('Error creating user:', error);
      
      let errorMessage = 'Failed to create user. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };





  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            <DialogTitle className="text-xl font-bold">Add New User</DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon">
              <X className="w-4 h-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="first-name" className="font-semibold">First Name</Label>
            <Input
              id="first-name"
              type="text"
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="last-name" className="font-semibold">Last Name</Label>
            <Input
              id="last-name"
              type="text"
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

          {/* Enhanced Currency Selection */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="preferred-currency" className="font-semibold">Preferred Currency</Label>
              <Select value={preferredCurrency} onValueChange={setPreferredCurrency}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select preferred currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <div className="flex items-center gap-2">
                        <span>{currency.flag}</span>
                        <span>{currency.code}</span>
                        <span className="text-gray-500">- {currency.name}</span>
                        
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            
          </div>

          <div>
            <Label htmlFor="password" className="font-semibold">Password</Label>
            <Input
              id="password"
              ref={passwordRef}
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2"
              key={`password-${isOpen}`}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>

          <div>
            <Label htmlFor="confirm-password" className="font-semibold">Confirm Password</Label>
            <Input
              id="confirm-password"
              ref={confirmPasswordRef}
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2"
              key={`confirm-password-${isOpen}`}
            />
          </div>

          <div>
            <Label htmlFor="withdrawal-code" className="font-semibold">Withdrawal Code</Label>
            <Input
              id="withdrawal-code"
              type="text"
              placeholder="Auto-generated withdrawal code"
              value={generateWithdrawalCode()}
              className="mt-2 bg-gray-50 dark:bg-gray-700"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">This code will be generated automatically</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateUser} 
            disabled={isCreating || !firstName.trim() || !lastName.trim() || !email.trim() || !password || password !== confirmPassword}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isCreating ? 'Creating...' : 'Create User'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
