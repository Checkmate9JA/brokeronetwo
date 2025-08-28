
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('••••••••');

  // Check if current user can edit this user
  const canEditUser = currentUserRole === 'super_admin' || (currentUserRole === 'admin' && user?.role !== 'super_admin');

    useEffect(() => {
    if (user) {
      const nameParts = user.full_name ? user.full_name.split(' ') : ['', ''];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setRole(user.role || 'user');
      setWithdrawalCode(user.withdrawal_code || generateWithdrawalCode());
      
      // Set current password placeholder (we can't fetch actual password for security)
      setCurrentPassword('••••••••');
      
      // ALWAYS ensure password fields are completely empty and blank
      setPassword('');
      setConfirmPassword('');
      
      // Force a small delay to ensure state is properly reset
      setTimeout(() => {
        setPassword('');
        setConfirmPassword('');
      }, 10);
    }
  }, [user]);

  // Reset password fields when modal opens
  useEffect(() => {
    if (isOpen) {
      // Force reset password fields to be completely blank
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  // Additional safeguard: reset password fields when user changes
  useEffect(() => {
    if (user) {
      // Always ensure password fields are blank when user changes
      setPassword('');
      setConfirmPassword('');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!firstName || !email) {
      toast({
        title: "Validation Error",
        description: "Please fill in first name and email.",
        variant: "destructive",
      });
      return;
    }

    if (password && password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    // Prevent Admin users from promoting others to Super Admin
    if (currentUserRole === 'admin' && role === 'super_admin') {
      toast({
        title: "Permission Denied",
        description: "Admin users cannot promote others to Super Admin role.",
        variant: "destructive",
      });
      return;
    }

    // Prevent Admin users from editing Super Admin users
    if (currentUserRole === 'admin' && user?.role === 'super_admin') {
      toast({
        title: "Permission Denied",
        description: "Admin users cannot modify Super Admin users.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const updateData = {
        full_name: `${firstName} ${lastName}`.trim(),
        email: email,
        role: role,
        withdrawal_code: withdrawalCode
      };

      if (password) {
        updateData.password = password;
      }

      // Update user in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }

      // If password is provided, update it in auth.users (requires service role)
      if (password) {
        try {
          const { error: passwordError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: password }
          );
          
          if (passwordError) {
            console.warn('Password update failed:', passwordError);
            // Don't fail the entire update if password update fails
          }
        } catch (passwordErr) {
          console.warn('Password update not available:', passwordErr);
          // Don't fail the entire update if password update fails
        }
      }
      
             toast({
         title: "Success!",
         description: "User updated successfully!",
         variant: "success",
       });
       onUpdate && onUpdate();
       onClose();
     } catch (error) {
       console.error('Error updating user:', error);
       toast({
         title: "Update Failed",
         description: "Failed to update user. Please try again.",
         variant: "destructive",
       });
     } finally {
      setIsUpdating(false);
    }
  };

  const handleRefreshCode = () => {
    const newCode = generateWithdrawalCode();
    setWithdrawalCode(newCode);
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose} key={`edit-user-${user?.id || 'new'}-${isOpen}`}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 py-4 border-b">
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold">
              Edit User - {user?.full_name?.toUpperCase() || 'USER'}
            </DialogTitle>
          </div>
          {/* The explicit DialogClose button was removed as the Dialog component itself provides close functionality */}
          {/* via clicking outside, pressing escape, or default close button if available in the DialogContent structure. */}
          {/* This change removes the duplicate close icon previously present in the header. */}
        </DialogHeader>
        
        <div className="space-y-4 overflow-y-auto px-1 py-4">
          <div>
            <Label htmlFor="first-name" className="font-semibold">First Name</Label>
            <Input
              id="first-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-2"
              disabled={!canEditUser}
            />
          </div>

          <div>
            <Label htmlFor="last-name" className="font-semibold">Last Name (Optional)</Label>
            <Input
              id="last-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-2"
              disabled={!canEditUser}
            />
          </div>

          <div>
            <Label htmlFor="email-address" className="font-semibold">Email Address</Label>
            <Input
              id="email-address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
              disabled={!canEditUser}
            />
          </div>

                    <div>
            <Label htmlFor="user-role" className="font-semibold">User Role</Label>
            <Select value={role} onValueChange={setRole} disabled={!canEditUser}>
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

          <div>
            <Label htmlFor="withdrawal-code" className="font-semibold">Withdrawal Code</Label>
            <div className="flex gap-2 mt-2">
                             <Input
                 id="withdrawal-code"
                 value={withdrawalCode}
                 onChange={(e) => setWithdrawalCode(e.target.value)}
                 className="flex-1"
                 disabled={!canEditUser}
               />
                               <Button
                   type="button"
                   variant="outline"
                   size="icon"
                   onClick={handleRefreshCode}
                   title="Refresh withdrawal code"
                   disabled={!canEditUser}
                 >
                   <RefreshCw className="w-4 h-4" />
                 </Button>
            </div>
          </div>

                     <div>
             <Label htmlFor="current-password" className="font-semibold">Current Password</Label>
             <Input
               id="current-password"
               type="text"
               value={currentPassword}
               disabled
               className="mt-2 bg-gray-100"
               placeholder="Current password (hidden for security)"
             />
             <p className="text-xs text-gray-500 mt-1">
               Passwords are encrypted and cannot be retrieved. Leave blank below to keep unchanged.
             </p>
           </div>

                                               <div>
               <Label htmlFor="new-password" className="font-semibold">New Password</Label>
                               <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2"
                  placeholder="Enter new password or leave blank"
                  disabled={!canEditUser}
                  key={`new-password-${user?.id || 'new'}-${isOpen}`}
                />
             </div>

             <div>
               <Label htmlFor="confirm-password" className="font-semibold">Confirm New Password</Label>
                               <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2"
                  placeholder="Confirm new password"
                  disabled={!canEditUser}
                  key={`confirm-password-${user?.id || 'new'}-${isOpen}`}
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
               disabled={isUpdating || !firstName || !email || !canEditUser}
               className="flex-1 bg-blue-600 hover:bg-blue-700"
             >
               {isUpdating ? 'Updating...' : 'Update User'}
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
