import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Settings,
  UserPlus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Search,
  Crown,
  Shield,
  RotateCcw,
  LogOut,
  CheckCircle,
  Ban,
  UserX,
  Mail,
  Server,
  Database,
  Globe,
  AlertTriangle,
  Menu,
  User as UserIcon,
  MessageCircle,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import AddNewUserModal from '../components/modals/AddNewUserModal';
import EditUserModal from '../components/modals/EditUserModal';
import { useApp } from '../components/AppProvider';
import SwitchAppModal from '../components/modals/SwitchAppModal';
import AccountModal from '../components/modals/AccountModal';
import SocialProofModal from '../components/modals/SocialProofModal';
import MaintenanceModeControl from '../components/MaintenanceModeControl';
import WhatsAppLiveChatModal from '../components/modals/WhatsAppLiveChatModal';
import GoogleTranslate from '../components/GoogleTranslate';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function SuperAdminDashboard() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [appCreatorId, setAppCreatorId] = useState(null);

  // Get currentApp from context
  const { currentApp } = useApp();

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isSwitchAppModalOpen, setIsSwitchAppModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSocialProofModalOpen, setIsSocialProofModalOpen] = useState(false);
  const [showMaintenanceControl, setShowMaintenanceControl] = useState(false);
  const [isWhatsAppSettingsModalOpen, setIsWhatsAppSettingsModalOpen] = useState(false);

  // Email settings state
  const [emailSettings, setEmailSettings] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: '',
    use_tls: true
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        setError(`Authentication error: ${authError.message}`);
        return;
      }
      
      if (!authUser) {
        setError('No authenticated user');
        return;
      }
      
      const { data: currentUserProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
        setCurrentUser(authUser);
      } else {
        setCurrentUser(currentUserProfile);
      }
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true, nullsLast: true });
      
      if (usersError) {
        console.error('Users fetch error:', usersError);
        setError(`Failed to fetch users: ${usersError.message}`);
        return;
      }
      
      setUsers(users || []);
      
      const sortedUsers = [...(users || [])].sort((a, b) => {
        const dateA = a.created_at || a.created_date || new Date(0);
        const dateB = b.created_at || b.created_date || new Date(0);
        return new Date(dateA) - new Date(dateB);
      });
      const creator = sortedUsers.find(u => u.role === 'super_admin') || sortedUsers[0];
      if (creator) {
        setAppCreatorId(creator.id);
      }
      
      console.log(`✅ Successfully loaded ${users?.length || 0} users from Supabase`);
      setSuccess(`Successfully loaded ${users?.length || 0} users from Supabase`);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(`Unexpected error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (user, newRole) => {
    if (user.id === appCreatorId) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Cannot Change Role',
        message: 'You cannot change the role of the app creator. The creator must maintain admin privileges.'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) {
        throw error;
      }
      loadData();
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'Role Updated',
        message: `Successfully changed ${user.full_name}'s role to ${newRole}.`
      });
    } catch (error) {
      console.error('Error changing user role:', error);
      
      if (error.message?.includes('creator')) {
        setFeedback({
          isOpen: true,
          type: 'error',
          title: 'Cannot Change Role',
          message: 'You cannot change the role of the app creator.'
        });
      } else {
        setFeedback({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: 'Failed to change user role. Please try again.'
        });
      }
    }
  };

  const handleSuspendUser = async (user) => {
    if (user.id === appCreatorId) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Cannot Suspend User',
        message: 'You cannot suspend the app creator.'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_suspended: !user.is_suspended })
        .eq('id', user.id);

      if (error) {
        throw error;
      }
      loadData();
      setFeedback({
        isOpen: true,
        type: 'success',
        title: 'User Updated',
        message: `Successfully ${user.is_suspended ? 'unsuspended' : 'suspended'} ${user.full_name}.`
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to update user status. Please try again.'
      });
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.id === appCreatorId) {
      setFeedback({
        isOpen: true,
        type: 'error',
        title: 'Cannot Delete User',
        message: 'You cannot delete the app creator.'
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${user.full_name}? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', user.id);

        if (error) {
          throw error;
        }
        loadData();
        setFeedback({
          isOpen: true,
          type: 'success',
          title: 'User Deleted',
          message: `Successfully deleted ${user.full_name}.`
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        setFeedback({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: 'Failed to delete user. Please try again.'
        });
      }
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditUserModalOpen(true);
  };

  const handleSaveEmailSettings = async () => {
    try {
      console.log('Saving email settings:', emailSettings);
      alert('Email settings saved successfully!');
    } catch (error) {
      console.error('Error saving email settings:', error);
      alert('Failed to save email settings.');
    }
  };

  const handleAppSwitchSuccess = (message) => {
    setFeedback({ isOpen: true, type: 'success', title: 'App Switched!', message });
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'super_admin': return <Crown className="w-4 h-4 text-purple-600" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-600" />;
      default: return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'super_admin':
        return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>;
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800">Admin</Badge>;
      default:
        return <Badge variant="outline">User</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 super-admin-page">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-xl font-bold text-gray-900">
                <span className="block sm:hidden">SuperAdmin</span>
                <span className="hidden sm:block">Super Admin Dashboard</span>
              </h1>
              <p className="text-sm text-gray-500">Complete system control</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            <GoogleTranslate variant="icon" />
            <Button
              variant="outline"
              onClick={() => setIsSwitchAppModalOpen(true)}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Switch App
            </Button>

            <Link to={createPageUrl('AdminDashboard')}>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                <Shield className="w-4 h-4 mr-2" />
                Admin View
              </Button>
            </Link>

            <Link to={createPageUrl('Dashboard')}>
              <Button variant="outline" size="sm" className="text-green-600 border-green-200 hover:bg-green-50">
                <UserIcon className="w-4 h-4 mr-2" />
                User View
              </Button>
            </Link>

            <Button variant="ghost" size="sm" onClick={() => setIsAccountModalOpen(true)} className="text-gray-600">
              <UserIcon className="w-4 h-4 mr-2" />
              Account
            </Button>

            <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <GoogleTranslate variant="button" />
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                  <SheetDescription>
                    Access admin functions and settings
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSwitchAppModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="justify-start text-purple-600 border-purple-200"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Switch App
                  </Button>

                  <Link to={createPageUrl('AdminDashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start text-blue-600 border-blue-200">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin View
                    </Button>
                  </Link>

                  <Link to={createPageUrl('Dashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start text-green-600 border-green-200">
                      <UserIcon className="w-4 h-4 mr-2" />
                      User View
                    </Button>
                  </Link>

                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setIsAccountModalOpen(true);
                      setIsMobileMenuOpen(false);
                    }} 
                    className="justify-start text-gray-600"
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Account
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }} 
                    className="justify-start text-red-600 border-red-200"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* User Management */}
        <Card className="p-4 lg:p-6 mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">User Management</h2>
              <p className="text-sm text-gray-500 hidden md:block">Manage all system users and their roles</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadData}
                disabled={isLoading}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <RotateCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setIsAddUserModalOpen(true)} className="bg-green-600 hover:bg-green-700 md:hidden" size="icon">
                <UserPlus className="w-4 h-4" />
              </Button>
              <Button onClick={() => setIsAddUserModalOpen(true)} className="bg-green-600 hover:bg-green-700 hidden md:flex">
                <UserPlus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Users</h3>
              </div>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <Button 
                onClick={() => {
                  setError(null);
                  loadData();
                }} 
                variant="outline" 
                size="sm" 
                className="mt-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500 mb-4">No users have been created yet.</p>
                <Button onClick={() => setIsAddUserModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First User
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Balance</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-4 px-4">
                        {user.is_suspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-700 border-green-200">Active</Badge>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm">
                          ${(user.total_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSuspendUser(user)}
                            disabled={user.id === appCreatorId}
                          >
                            {user.is_suspended ? (
                              <Unlock className="w-4 h-4 text-green-600" />
                            ) : (
                              <Lock className="w-4 h-4 text-orange-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.id === appCreatorId}
                            title={user.id === appCreatorId ? "Cannot delete app creator" : "Delete user"}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                          <Select
                            value={user.role || 'user'}
                            onValueChange={(newRole) => handleRoleChange(user, newRole)}
                            disabled={user.id === appCreatorId}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading users...</p>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-500 mb-4">No users have been created yet.</p>
                <Button onClick={() => setIsAddUserModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add First User
                </Button>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="p-4 bg-gray-50 relative overflow-hidden">
                  {user.is_suspended && (
                    <Badge variant="destructive" className="absolute top-2 right-2 z-10">Suspended</Badge>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {getRoleIcon(user.role)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-gray-500">Role</div>
                      <div className="mt-1">{getRoleBadge(user.role)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Balance</div>
                      <div className="font-mono text-sm font-semibold mt-1">
                        ${(user.total_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(user)} className="flex-1 min-w-[100px]">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuspendUser(user)}
                      className="flex-1 min-w-[100px]"
                      disabled={user.id === appCreatorId}
                    >
                      {user.is_suspended ? (
                        <>
                          <Unlock className="w-3 h-3 mr-1" />
                          Unsuspend
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          Suspend
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      className="flex-1 min-w-[100px]"
                      disabled={user.id === appCreatorId}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>

                  <div className="mt-3">
                    <Select
                      value={user.role || 'user'}
                      onValueChange={(newRole) => handleRoleChange(user, newRole)}
                      disabled={user.id === appCreatorId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>

        {/* System Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card 
            className="p-6 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => setIsSocialProofModalOpen(true)}
          >
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-8 h-8 text-blue-600 group-hover:text-blue-700" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                  Social Proof Settings
                </h3>
                <p className="text-sm text-gray-500">Manage social proof system</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Configure social proof notifications, maintenance, and system controls.
            </p>
          </Card>

          <Card 
            className="p-6 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => setShowMaintenanceControl(true)}
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-purple-600 group-hover:text-purple-700" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-700">
                  Maintenance Mode
                </h3>
                <p className="text-sm text-gray-500">Control system maintenance status</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Temporarily disable the application to perform maintenance or upgrades.
            </p>
          </Card>

          <Card 
            className="p-6 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => setIsWhatsAppSettingsModalOpen(true)}
          >
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-8 h-8 text-green-600 group-hover:text-green-700" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-700">
                  WhatsApp/LiveChat Settings
                </h3>
                <p className="text-sm text-gray-500">Configure communication channels</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Set up WhatsApp integration and live chat system settings.
            </p>
          </Card>
        </div>

        {/* Maintenance Mode Control Section */}
        {showMaintenanceControl && (
          <div className="mt-6 p-6 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Maintenance Mode Control</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMaintenanceControl(false)}
              >
                Close
              </Button>
            </div>
            <MaintenanceModeControl 
              isOpen={showMaintenanceControl} 
              onClose={() => setShowMaintenanceControl(false)} 
            />
          </div>
        )}



        {/* Email Management */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Email Management</h2>
            <p className="text-sm text-gray-500">Configure SMTP settings for system emails</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="smtp-host" className="font-semibold">SMTP Host</Label>
              <Input
                id="smtp-host"
                placeholder="smtp.gmail.com"
                value={emailSettings.smtp_host}
                onChange={(e) => setEmailSettings({...emailSettings, smtp_host: e.target.value})}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="smtp-port" className="font-semibold">SMTP Port</Label>
              <Input
                id="smtp-port"
                placeholder="587"
                value={emailSettings.smtp_port}
                onChange={(e) => setEmailSettings({...emailSettings, smtp_port: e.target.value})}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="smtp-username" className="font-semibold">SMTP Username</Label>
              <Input
                id="smtp-username"
                placeholder="your-email@gmail.com"
                value={emailSettings.smtp_username}
                onChange={(e) => setEmailSettings({...emailSettings, smtp_username: e.target.value})}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="smtp-password" className="font-semibold">SMTP Password</Label>
              <Input
                id="smtp-password"
                type="password"
                placeholder="Your app password"
                value={emailSettings.smtp_password}
                onChange={(e) => setEmailSettings({...emailSettings, smtp_password: e.target.value})}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="from-email" className="font-semibold">From Email</Label>
              <Input
                id="from-email"
                placeholder="noreply@yourcompany.com"
                value={emailSettings.from_email}
                onChange={(e) => setEmailSettings({...emailSettings, from_email: e.target.value})}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="from-name" className="font-semibold">From Name</Label>
              <Input
                id="from-name"
                placeholder="Your Company Name"
                value={emailSettings.from_name}
                onChange={(e) => setEmailSettings({...emailSettings, from_name: e.target.value})}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveEmailSettings} className="bg-blue-600 hover:bg-blue-700">
              Save Email Settings
            </Button>
          </div>
        </Card>
      </main>

      {/* Add New User Modal */}
      <AddNewUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSuccess={loadData}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={isEditUserModalOpen}
        onClose={() => setIsEditUserModalOpen(false)}
        user={selectedUser}
        onUpdate={loadData}
      />

      {/* Switch App Modal */}
      <SwitchAppModal
        isOpen={isSwitchAppModalOpen}
        onClose={() => setIsSwitchAppModalOpen(false)}
        onSuccess={handleAppSwitchSuccess}
      />

      {/* Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      {/* Social Proof Modal */}
      <SocialProofModal
        isOpen={isSocialProofModalOpen}
        onClose={() => setIsSocialProofModalOpen(false)}
      />

      {/* WhatsApp/LiveChat Settings Modal */}
      <WhatsAppLiveChatModal
        isOpen={isWhatsAppSettingsModalOpen}
        onClose={() => setIsWhatsAppSettingsModalOpen(false)}
        onSettingsSaved={() => {
          // Refresh the WhatsApp/LiveChat integration
          if (window.refreshWhatsAppLiveChat) {
            window.refreshWhatsAppLiveChat();
          }
        }}
      />

      {/* Maintenance Mode Control Modal */}
      <MaintenanceModeControl
        isOpen={showMaintenanceControl}
        onClose={() => setShowMaintenanceControl(false)}
      />

      {/* Feedback Modal */}
      <Dialog open={feedback.isOpen} onOpenChange={(open) => setFeedback({ ...feedback, isOpen: open })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {feedback.type === 'success' ? <CheckCircle className="w-6 h-6 text-green-500" /> : <AlertTriangle className="w-6 h-6 text-red-500" />}
              {feedback.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700">{feedback.message}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setFeedback({ ...feedback, isOpen: false })}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
