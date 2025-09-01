
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
import { X, Edit, RefreshCw } from 'lucide-react';
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

export default function EditUserModal({ isOpen, onClose, user, onUpdate, currentUserRole }) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [withdrawalCode, setWithdrawalCode] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [currencies, setCurrencies] = useState([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('••••••••');


  // Check if current user can edit this user
  const canEditUser = currentUserRole === 'super_admin' || 
                     (currentUserRole === 'admin' && user?.role !== 'super_admin');

  // Force enable editing for super admins
  const forceEnableEditing = currentUserRole === 'super_admin';

  useEffect(() => {
    if (isOpen && user) {
      // Parse full name into first and last name
      const nameParts = user.full_name ? user.full_name.split(' ') : ['', ''];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setRole(user.role || 'user');
      setWithdrawalCode(user.withdrawal_code || '');
      setPreferredCurrency(user.preferred_currency || 'USD');
      setPassword('');
      setConfirmPassword('');
      setCurrentPassword('••••••••');
      
      loadCurrencies();
    }
  }, [isOpen, user]);



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



  const handleUpdate = async () => {
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

    if (password && password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password && password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const updateData = {
        full_name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        role: role,
        preferred_currency: preferredCurrency,
        withdrawal_code: withdrawalCode || generateWithdrawalCode()
      };

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update password if provided
      if (password) {
        const { error: passwordError } = await supabase.auth.admin.updateUserById(user.id, {
          password: password
        });
        
        if (passwordError) {
          console.warn('Password update failed:', passwordError);
          toast({
            title: "Warning",
            description: "Profile updated but password change failed. Please try updating password separately.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success!",
        description: "User updated successfully!",
      });

      if (onUpdate) {
        onUpdate();
      }

      onClose();

    } catch (error) {
      console.error('Error updating user:', error);
      
      let errorMessage = 'Failed to update user. Please try again.';
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
      setIsUpdating(false);
    }
  };

  const generateNewWithdrawalCode = () => {
    const newCode = generateWithdrawalCode();
    setWithdrawalCode(newCode);
  };





  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold">Edit User: {user.full_name}</DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon">
              <X className="w-4 h-4" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first-name" className="font-semibold">First Name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-2"
                disabled={!canEditUser && !forceEnableEditing}
              />
            </div>

            <div>
              <Label htmlFor="last-name" className="font-semibold">Last Name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-2"
                disabled={!canEditUser && !forceEnableEditing}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="font-semibold">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
              disabled={!canEditUser && !forceEnableEditing}
            />
          </div>

          <div>
            <Label htmlFor="user-role" className="font-semibold">User Role</Label>
            <Select value={role} onValueChange={setRole} disabled={!forceEnableEditing && !canEditUser}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                {/* Super Admin option only available to Super Admins */}
                {currentUserRole === 'super_admin' && (
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                )}
              </SelectContent>
            </Select>
            {/* Show warning if Admin is trying to edit a Super Admin */}
            {currentUserRole === 'admin' && user?.role === 'super_admin' && (
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ You cannot modify Super Admin users
              </p>
            )}
          </div>

          {/* Enhanced Currency Selection */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="preferred-currency" className="font-semibold">Preferred Currency</Label>
              <Select value={preferredCurrency} onValueChange={setPreferredCurrency} disabled={!canEditUser && !forceEnableEditing}>
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
            <Label htmlFor="withdrawal-code" className="font-semibold">Withdrawal Code</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="withdrawal-code"
                value={withdrawalCode}
                onChange={(e) => setWithdrawalCode(e.target.value)}
                disabled={!canEditUser && !forceEnableEditing}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={generateNewWithdrawalCode}
                disabled={!canEditUser && !forceEnableEditing}
                title="Generate new withdrawal code"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Password Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password" className="font-semibold">New Password (Optional)</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="mt-2"
                disabled={!canEditUser && !forceEnableEditing}
              />
              {password && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              )}
            </div>

            {password && (
              <div>
                <Label htmlFor="confirm-password" className="font-semibold">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="mt-2"
                  disabled={!canEditUser && !forceEnableEditing}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate}
            disabled={isUpdating || !canEditUser}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {isUpdating ? 'Updating...' : 'Update User'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
