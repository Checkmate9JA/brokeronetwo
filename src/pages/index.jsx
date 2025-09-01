import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import MaintenanceMode from '@/components/MaintenanceMode';

// Import all pages
import Dashboard from "./Dashboard";
import ConnectWallet from "./ConnectWallet";
import InvestmentPlans from "./InvestmentPlans";
import TradingPlatform from "./TradingPlatform";
import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminPendingDeposits from "./AdminPendingDeposits";
import AdminPendingWithdrawals from "./AdminPendingWithdrawals";
import AdminInvestmentPlans from "./AdminInvestmentPlans";
import TradingManagement from "./TradingManagement";
import AdminManageWallets from "./AdminManageWallets";
import SuperAdminDashboard from "./SuperAdminDashboard";
import SuperAdashboard from "./SuperAdashboard";
import AdminEmailManagement from "./AdminEmailManagement";
import Auth from "./Auth";
import AdminAuth from "./AdminAuth";
import SuperAdminAuth from "./SuperAdminAuth";
import SuperAdminSocialProof from "./SuperAdminSocialProof";
import SupabaseConnectionTest from "@/components/SupabaseConnectionTest";

import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "./Layout";

const PAGES = {
    Dashboard: Dashboard,
    ConnectWallet: ConnectWallet,
    InvestmentPlans: InvestmentPlans,
    TradingPlatform: TradingPlatform,
    AdminDashboard: AdminDashboard,
    AdminUsers: AdminUsers,
    AdminPendingDeposits: AdminPendingDeposits,
    AdminPendingWithdrawals: AdminPendingWithdrawals,
    AdminInvestmentPlans: AdminInvestmentPlans,
    TradingManagement: TradingManagement,
    AdminManageWallets: AdminManageWallets,
    SuperAdminDashboard: SuperAdminDashboard,
    SuperAdashboard: SuperAdashboard,
    AdminEmailManagement: AdminEmailManagement,
    Auth: Auth,
    AdminAuth: AdminAuth,
    SuperAdminAuth: SuperAdminAuth,
    SuperAdminSocialProof: SuperAdminSocialProof,
    SupabaseConnectionTest: SupabaseConnectionTest,

}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    const { user, userProfile } = useAuth();
    const { isMaintenanceMode, maintenanceInfo, isLoading } = useMaintenanceMode();

    console.log('🔧 PagesContent - Maintenance Mode Check:');
    console.log('Location:', location.pathname);
    console.log('User:', user);
    console.log('User Profile:', userProfile);
    console.log('User Role:', userProfile?.role);
    console.log('Is Maintenance Mode:', isMaintenanceMode);
    console.log('Is Loading:', isLoading);

    // Define auth pages that should NEVER be blocked by maintenance mode
    const authPages = ['/Auth', '/AdminAuth', '/SuperAdminAuth'];
    const isAuthPage = authPages.includes(location.pathname);

    // Show maintenance mode if active, user is not super admin, AND not on an auth page
    if (isMaintenanceMode && userProfile?.role !== 'super_admin' && !isAuthPage) {
        console.log('🚧 SHOWING MAINTENANCE MODE - User blocked:', userProfile?.role, 'on page:', location.pathname);
        return <MaintenanceMode maintenanceInfo={maintenanceInfo} />;
    }

    // Show loading while checking maintenance mode
    if (isLoading) {
        console.log('⏳ Loading maintenance mode check...');
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking system status...</p>
                </div>
            </div>
        );
    }

    console.log('✅ Proceeding to normal page - Maintenance mode inactive, user is super admin, or auth page');

    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                <Route path="/" element={<ProtectedRoute redirectTo="/Auth"><Dashboard /></ProtectedRoute>} />
                <Route path="/Dashboard" element={<ProtectedRoute redirectTo="/Auth"><Dashboard /></ProtectedRoute>} />
                <Route path="/ConnectWallet" element={<ProtectedRoute redirectTo="/Auth"><ConnectWallet /></ProtectedRoute>} />
                <Route path="/InvestmentPlans" element={<ProtectedRoute redirectTo="/Auth"><InvestmentPlans /></ProtectedRoute>} />
                <Route path="/TradingPlatform" element={<ProtectedRoute redirectTo="/Auth"><TradingPlatform /></ProtectedRoute>} />
                <Route path="/AdminDashboard" element={<ProtectedRoute requiredRole="admin" redirectTo="/AdminAuth"><AdminDashboard /></ProtectedRoute>} />
                <Route path="/AdminUsers" element={<ProtectedRoute requiredRole="admin" redirectTo="/AdminAuth"><AdminUsers /></ProtectedRoute>} />
                <Route path="/AdminPendingDeposits" element={<ProtectedRoute requiredRole="admin" redirectTo="/AdminAuth"><AdminPendingDeposits /></ProtectedRoute>} />
                <Route path="/AdminPendingWithdrawals" element={<ProtectedRoute requiredRole="admin" redirectTo="/AdminAuth"><AdminPendingWithdrawals /></ProtectedRoute>} />
                <Route path="/AdminInvestmentPlans" element={<ProtectedRoute requiredRole="admin" redirectTo="/AdminAuth"><AdminInvestmentPlans /></ProtectedRoute>} />
                <Route path="/TradingManagement" element={<ProtectedRoute requiredRole="admin" redirectTo="/AdminAuth"><TradingManagement /></ProtectedRoute>} />
                <Route path="/AdminManageWallets" element={<ProtectedRoute requiredRole="admin" redirectTo="/AdminAuth"><AdminManageWallets /></ProtectedRoute>} />
                <Route path="/SuperAdminDashboard" element={<ProtectedRoute requiredRole="super_admin" redirectTo="/SuperAdminAuth"><SuperAdminDashboard /></ProtectedRoute>} />
                <Route path="/SuperAdashboard" element={<ProtectedRoute requiredRole="super_admin" redirectTo="/SuperAdminAuth"><SuperAdashboard /></ProtectedRoute>} />
                <Route path="/superadmin/social-proof" element={<ProtectedRoute requiredRole="super_admin" redirectTo="/SuperAdminAuth"><SuperAdminSocialProof /></ProtectedRoute>} />
                <Route path="/AdminEmailManagement" element={<ProtectedRoute requiredRole="admin" redirectTo="/AdminAuth"><AdminEmailManagement /></ProtectedRoute>} />
      
                <Route path="/Auth" element={<Auth />} />
                <Route path="/AdminAuth" element={<AdminAuth />} />
                <Route path="/SuperAdminAuth" element={<SuperAdminAuth />} />
                <Route path="/test-connection" element={<SupabaseConnectionTest />} />
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}