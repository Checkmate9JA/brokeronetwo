
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
import { Badge } from "@/components/ui/badge";
import { X, User as UserIcon, Mail, Crown, Shield, Users, Calendar } from 'lucide-react';
import { User } from '@/api/entities';
import { UploadFile } from '@/api/integrations'; // Import UploadFile integration

export default function AccountModal({ isOpen, onClose }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar_url: ''
  });
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      setEditData({
        full_name: currentUser.full_name || '',
        email: currentUser.email || '',
        password: '',
        confirmPassword: '',
        avatar_url: currentUser.avatar_url || ''
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (editData.password && editData.password !== editData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const updatePayload = {
        full_name: editData.full_name,
        email: editData.email,
        avatar_url: editData.avatar_url
      };

      if (editData.password) {
        updatePayload.password = editData.password;
      }

      await User.updateMyUserData(updatePayload);
      setUser({ ...user, ...updatePayload });
      setIsEditing(false);
      // Reset password fields after successful save
      setEditData(prev => ({ ...prev, password: '', confirmPassword: '' })); 
    } catch (error) {
      console.error('Error updating user data:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await UploadFile({ file });
      setEditData(prev => ({ ...prev, avatar_url: file_url }));
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar.");
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'superadmin': return <Crown className="w-5 h-5 text-purple-600" />;
      case 'admin': return <Shield className="w-5 h-5 text-blue-600" />;
      default: return <Users className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'superadmin':
        return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800">Admin</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10 py-4 border-b">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-gray-600" />
            <DialogTitle className="text-xl font-bold">Account Profile</DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading profile...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4 overflow-y-auto">
            {/* Profile Header */}
            <div className="text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              <div 
                className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer group relative overflow-hidden"
                onClick={isEditing ? handleAvatarClick : undefined} // Only allow click if in editing mode
              >
                {editData.avatar_url ? (
                  <img src={editData.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-gray-500">
                    {user?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                  </span>
                )}
                {isEditing && ( // Only show change overlay if in editing mode
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs">Change</span>
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{user?.full_name}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="mt-2">
                {getRoleBadge(user?.role)}
              </div>
            </div>

            {/* Account Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="full-name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="full-name"
                    value={editData.full_name}
                    onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 p-2 bg-gray-50 rounded border">{user?.full_name || 'Not set'}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 p-2 bg-gray-50 rounded border">{user?.email || 'Not set'}</p>
                )}
              </div>

              {isEditing && (
                <>
                  <div>
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={editData.password}
                      onChange={(e) => setEditData({...editData, password: e.target.value})}
                      className="mt-1"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={editData.confirmPassword}
                      onChange={(e) => setEditData({...editData, confirmPassword: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Member Since</Label>
                <div className="mt-1 flex items-center gap-2 p-2 bg-gray-50 rounded border">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>{new Date(user?.created_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      // Reset editData to current user data if canceled
                      setEditData({
                        full_name: user?.full_name || '',
                        email: user?.email || '',
                        password: '',
                        confirmPassword: '',
                        avatar_url: user?.avatar_url || ''
                      });
                    }} 
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="w-full">
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
