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
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/ConnectWallet" element={<ConnectWallet />} />
                
                <Route path="/InvestmentPlans" element={<InvestmentPlans />} />
                
                <Route path="/TradingPlatform" element={<TradingPlatform />} />
                
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                
                <Route path="/AdminUsers" element={<AdminUsers />} />
                
                <Route path="/AdminPendingDeposits" element={<AdminPendingDeposits />} />
                
                <Route path="/AdminPendingWithdrawals" element={<AdminPendingWithdrawals />} />
                
                <Route path="/AdminInvestmentPlans" element={<AdminInvestmentPlans />} />
                
                <Route path="/TradingManagement" element={<TradingManagement />} />
                
                <Route path="/AdminManageWallets" element={<AdminManageWallets />} />
                
                <Route path="/SuperAdminDashboard" element={<SuperAdminDashboard />} />
                
                <Route path="/SuperAdashboard" element={<SuperAdashboard />} />
                
                <Route path="/AdminEmailManagement" element={<AdminEmailManagement />} />
                
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