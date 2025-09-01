
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
import { X, User as UserIcon, Mail, Crown, Shield, Users, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import { UploadFile } from '@/api/integrations'; // Import UploadFile integration
import { CurrencyAPI } from '@/api/currencies';
import { supabase } from '@/lib/supabase';
import FeedbackModal from './FeedbackModal';
import { DEFAULT_CURRENCY } from '@/utils/currencyUtils';

export default function AccountModal({ isOpen, onClose }) {
  const { userProfile, user, refreshProfile } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar_url: '',
    preferred_currency: DEFAULT_CURRENCY
  });
  const [currencies, setCurrencies] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadCurrencies();
      // Reset password visibility states
      setShowPassword(false);
      setShowConfirmPassword(false);
      console.log('AccountModal: userProfile from context:', userProfile);
      console.log('AccountModal: user from context:', user);
      
      // Use userProfile from context instead of fetching
      if (userProfile) {
        console.log('AccountModal: Using userProfile data:', userProfile);
        setEditData({
          full_name: userProfile.full_name || '',
          email: userProfile.email || '',
          password: '',
          confirmPassword: '',
          avatar_url: userProfile.avatar_url || '',
          preferred_currency: userProfile.preferred_currency || DEFAULT_CURRENCY
        });
        setIsLoading(false);
      } else {
        // If no userProfile, try to use user from context
        if (user) {
          console.log('AccountModal: Using user data as fallback:', user);
          setEditData({
            full_name: user.full_name || '',
            email: user.email || '',
            password: '',
            confirmPassword: '',
            avatar_url: user.avatar_url || '',
            preferred_currency: user.preferred_currency || DEFAULT_CURRENCY
          });
        } else {
          console.log('AccountModal: No user data available');
        }
        setIsLoading(false);
      }
    }
  }, [isOpen, userProfile, user]);



  const loadCurrencies = async () => {
    try {
      const currenciesData = await CurrencyAPI.getAll();
      setCurrencies(currenciesData);
    } catch (error) {
      console.error('Error loading currencies:', error);
    }
  };



  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const handleSave = async () => {
    if (editData.password && editData.password !== editData.confirmPassword) {
      showFeedback('error', 'Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    try {
      const updatePayload = {
        full_name: editData.full_name,
        email: editData.email,
        avatar_url: editData.avatar_url,
        preferred_currency: editData.preferred_currency
      };

      if (editData.password) {
        updatePayload.password = editData.password;
      }

      console.log('Attempting to update user with payload:', updatePayload);
      
      // Use direct Supabase update instead of User entity
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('No authenticated user found');
      }
      
      const { error } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', authUser.id);
      
      if (error) throw error;
      
      console.log('User updated successfully');
      
      // Update password in auth if provided
      if (editData.password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: editData.password
        });
        
        if (passwordError) {
          console.warn('Password update failed:', passwordError);
        }
      }
      
      // Update the local editData to reflect the saved changes
      setEditData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
        // Keep the updated values so they show in the modal
        full_name: updatePayload.full_name,
        email: updatePayload.email,
        avatar_url: updatePayload.avatar_url,
        preferred_currency: updatePayload.preferred_currency
      }));
      
      // Force a refresh of the currencies to ensure the display is updated
      await loadCurrencies();
      
      // Refresh the user profile in AuthContext to ensure currency changes are reflected everywhere
      console.log('🔄 Refreshing profile after currency update...');
      await refreshProfile();
      console.log('✅ Profile refresh completed');
      
      showFeedback('success', 'Profile Updated', 'Your profile has been updated successfully! Currency changes will be applied immediately.');
      
      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error updating user:', error);
      showFeedback('error', 'Update Failed', 'Failed to update profile. Please try again.');
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const uploadedUrl = await UploadFile(file);
      setEditData(prev => ({ ...prev, avatar_url: uploadedUrl }));
      setIsLoading(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      setIsLoading(false);
      showFeedback('error', 'Upload Failed', 'Failed to upload avatar. Please try again.');
    }
  };

  const handleCurrencyChange = (newCurrency) => {
    setEditData(prev => ({ ...prev, preferred_currency: newCurrency }));
  };

  const formatExchangeRate = (rate) => {
    if (rate === 1) return '1.0000';
    return rate.toFixed(4);
  };



  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-blue-600" />
              <DialogTitle className="text-xl font-bold">Account Settings</DialogTitle>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* User Role Badge */}
            <div className="flex items-center gap-2">
              <Label className="text-gray-700 dark:text-gray-300 w-32 flex-shrink-0">Role</Label>
              <div className="flex items-center gap-2">
                {userProfile?.role === 'super_admin' && (
                  <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                    <Crown className="w-3 h-3 mr-1" />
                    Super Admin
                  </Badge>
                )}
                {userProfile?.role === 'admin' && (
                  <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
                {userProfile?.role === 'user' && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <Users className="w-3 h-3 mr-1" />
                    User
                  </Badge>
                )}
              </div>
            </div>

            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <Label className="text-gray-700 dark:text-gray-300 w-32 flex-shrink-0">Avatar</Label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  {editData.avatar_url ? (
                    <img src={editData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-gray-500">
                      {editData.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                {isEditing && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Uploading...' : 'Change Avatar'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Label htmlFor="full-name" className="text-gray-700 dark:text-white w-32 flex-shrink-0">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="full-name"
                    value={editData.full_name}
                    onChange={(e) => setEditData({...editData, full_name: e.target.value})}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                    {editData.full_name}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="email" className="text-gray-700 dark:text-white w-32 flex-shrink-0">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                    <Mail className="w-4 h-4 text-gray-500" />
                    {editData.email}
                  </div>
                )}
              </div>

              {/* Password Fields - Only show when editing */}
              {isEditing && (
                <>
                  <div className="flex items-center gap-4">
                    <Label htmlFor="password" className="text-gray-700 dark:text-white w-32 flex-shrink-0">New Password</Label>
                    <div className="flex-1 relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={editData.password}
                        onChange={(e) => setEditData({...editData, password: e.target.value})}
                        placeholder="Leave blank to keep current password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Label htmlFor="confirm-password" className="text-gray-700 dark:text-white w-32 flex-shrink-0">Confirm Password</Label>
                    <div className="flex-1 relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={editData.confirmPassword}
                        onChange={(e) => setEditData({...editData, confirmPassword: e.target.value})}
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Enhanced Currency Selection */}
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label htmlFor="preferred-currency" className="text-gray-700 dark:text-white w-32 flex-shrink-0">Preferred Currency</Label>
                  {isEditing ? (
                    <div className="flex-1">
                      <select
                        id="preferred-currency"
                        value={editData.preferred_currency}
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.flag} {currency.code} - {currency.name}
                            
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-200">
                                              {(() => {
                          const currency = currencies.find(c => c.code === editData.preferred_currency);
                          return (
                            <>
                              <span>{currency?.flag || '🌐'}</span>
                              <span className="font-medium">{editData.preferred_currency}</span>
                              <span className="text-gray-600 dark:text-gray-400">- {currency?.name || editData.preferred_currency}</span>
 
                            </>
                          );
                        })()}
                    </div>
                  )}
                </div>


              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 px-6">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              {isEditing ? (
                <Button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
              ) : (
                <Button onClick={() => setIsEditing(true)} className="flex-1">
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
    </>
  );
}
