import Layout from "./Layout.jsx";

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

import SupabaseConnectionTest from "@/components/SupabaseConnectionTest";

import ProtectedRoute from "@/components/ProtectedRoute";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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