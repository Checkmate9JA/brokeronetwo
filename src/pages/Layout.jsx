

import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import SuspensionModal from '@/components/modals/SuspensionModal';
import { LanguageProvider } from '@/components/LanguageProvider';
import { AppProvider } from '@/components/AppProvider';
import ChatWidget from '@/components/ChatWidget'; // Added import for ChatWidget

export default function Layout({ children, currentPageName }) {
  const [isSuspended, setIsSuspended] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const checkUserStatus = async () => {
      // Don't check on admin pages to avoid locking out admin
      if (currentPageName?.toLowerCase().includes('admin')) {
        setIsLoadingUser(false);
        return;
      }
      try {
        const user = await User.me();
        if (user && user.is_suspended) {
          setIsSuspended(true);
        }
      } catch (error) {
        // Not logged in, do nothing
      } finally {
        setIsLoadingUser(false);
      }
    };
    
    checkUserStatus();
  }, [currentPageName]);

  if (isLoadingUser) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-700 text-lg">Loading...</div>;
  }

  if (isSuspended) {
    return <SuspensionModal isOpen={true} />;
  }

  return (
    <LanguageProvider>
      <AppProvider>
        <div className="min-h-screen bg-gray-50">
          {children}
          {/* Add ChatWidget for all pages */}
          <ChatWidget />
        </div>
      </AppProvider>
    </LanguageProvider>
  );
}

