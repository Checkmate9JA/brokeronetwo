
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
import { User } from '@/api/entities';

const generateWithdrawalCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function EditUserModal({ isOpen, onClose, user, onUpdate }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [withdrawalCode, setWithdrawalCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      const nameParts = user.full_name ? user.full_name.split(' ') : ['', ''];
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setRole(user.role || 'user');
      setWithdrawalCode(user.withdrawal_code || generateWithdrawalCode());
      setPassword('');
      setConfirmPassword('');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!firstName || !email) {
      alert('Please fill in first name and email.');
      return;
    }

    if (password && password !== confirmPassword) {
      alert('Passwords do not match.');
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

      await User.update(user.id, updateData);
      
      alert('User updated successfully!');
      onUpdate && onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefreshCode = () => {
    const newCode = generateWithdrawalCode();
    setWithdrawalCode(newCode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
            />
          </div>

          <div>
            <Label htmlFor="last-name" className="font-semibold">Last Name (Optional)</Label>
            <Input
              id="last-name"
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="user-role" className="font-semibold">User Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="superadmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="withdrawal-code" className="font-semibold">Withdrawal Code</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="withdrawal-code"
                value={withdrawalCode}
                onChange={(e) => setWithdrawalCode(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRefreshCode}
                title="Refresh withdrawal code"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="new-password" className="font-semibold">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2"
              placeholder="Leave blank to keep unchanged"
            />
          </div>

          <div>
            <Label htmlFor="confirm-password" className="font-semibold">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2"
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
              disabled={isUpdating || !firstName || !email}
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
