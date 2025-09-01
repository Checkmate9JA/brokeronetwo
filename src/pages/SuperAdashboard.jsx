import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Activity,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import AddNewUserModal from '../components/modals/AddNewUserModal';
import EditUserModal from '../components/modals/EditUserModal';
import { useApp } from '../components/AppProvider';
import SwitchAppModal from '../components/modals/SwitchAppModal';
import AccountModal from '../components/modals/AccountModal';
import WhatsAppLiveChatModal from '../components/modals/WhatsAppLiveChatModal';
import SocialProofModal from '../components/modals/SocialProofModal';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function SuperAdashboard() {
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isSocialProofModalOpen, setIsSocialProofModalOpen] = useState(false);

  const adminModules = [
    {
      title: 'Social Proof Management',
      description: 'Manage social proof names, templates, and activities',
      icon: <Activity className="h-8 w-8" />,
      link: '/superadmin/social-proof',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'User Management',
      description: 'Manage all users, roles, and permissions',
      icon: <Users className="h-8 w-8" />,
      link: '/superadmin/users',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'System Settings',
      description: 'Configure global system settings and parameters',
      icon: <Settings className="h-8 w-8" />,
      link: '/superadmin/settings',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Database Management',
      description: 'Database maintenance and monitoring tools',
      icon: <Database className="h-8 w-8" />,
      link: '/superadmin/database',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Analytics & Reports',
      description: 'View system analytics and generate reports',
      icon: <BarChart3 className="h-8 w-8" />,
      link: '/superadmin/analytics',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    },
    {
      title: 'Security & Audit',
      description: 'Security settings and audit logs',
      icon: <Shield className="h-8 w-8" />,
      link: '/superadmin/security',
      color: 'bg-red-500 hover:bg-red-600'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to the Super Admin Dashboard. Manage all aspects of the system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminModules.map((module, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${module.color} text-white`}>
                  {module.icon}
                </div>
              </div>
              <CardTitle className="text-xl">{module.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{module.description}</p>
              <Link to={module.link}>
                <Button className="w-full" variant="outline">
                  Access Module
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Settings */}
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="p-6 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => setIsWhatsAppModalOpen(true)}
          >
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-8 h-8 text-green-600 group-hover:text-green-700" />
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-700">
                  WhatsApp/LiveChat Settings
                </h3>
                <p className="text-sm text-gray-500">Configure customer support chat</p>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Set up WhatsApp integration and live chat widgets for customer support.
            </p>
          </Card>

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
        </div>
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-blue-600">Active</div>
            <div className="text-sm text-gray-600">System Status</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl font-bold text-purple-600">Secure</div>
            <div className="text-sm text-gray-600">Security Level</div>
          </div>
        </div>
      </div>

      {/* WhatsApp/LiveChat Modal */}
      <WhatsAppLiveChatModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      {/* Social Proof Modal */}
      <SocialProofModal
        isOpen={isSocialProofModalOpen}
        onClose={() => setIsSocialProofModalOpen(false)}
      />
    </div>
  );
}
