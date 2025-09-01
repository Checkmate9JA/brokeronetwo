import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import { getWalletIconUrlSync, hasWalletIcon, getWalletFallbackDisplay } from '@/utils/walletIconDisplay';
import ConnectWalletModal from '../components/modals/ConnectWalletModal';
import FeedbackModal from '../components/modals/FeedbackModal';

export default function ConnectWallet() {
  const [wallets, setWallets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('ConnectWallet: Starting to load data...');
      
      const { data: allWallets, error } = await supabase
        .from('managed_wallets')
        .select('*');
      
      if (error) {
        console.error('ConnectWallet: Error loading wallets:', error);
        setError(`Failed to load wallets: ${error.message}`);
        return;
      }
      
      console.log('ConnectWallet: All wallets from database:', allWallets);
      
      if (!allWallets || allWallets.length === 0) {
        console.log('ConnectWallet: No wallets found in the database.');
        setWallets([]);
      } else {
        const activeWallets = allWallets.filter(w => w.is_active === true);
        console.log('ConnectWallet: Active wallets:', activeWallets);
        
        const sortedWallets = activeWallets.sort((a, b) => a.name.localeCompare(b.name));
        setWallets(sortedWallets);
      }
      
    } catch (error) {
      console.error('ConnectWallet: Error loading data:', error);
      setError(`Failed to load wallets: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredWallets = wallets.filter(wallet =>
    wallet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleWalletClick = (wallet) => {
    setSelectedWallet(wallet);
    setIsConnectModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading wallets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-6 transition-colors">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Connect Wallet</h1>
              <p className="text-gray-600 dark:text-white dark:font-semibold">Choose a wallet to connect to your account</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <Input
              placeholder="Search wallets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
        {error ? (
          <div className="text-center py-12 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <Wallet className="w-16 h-16 text-red-300 dark:text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 dark:text-red-200 mb-2">Error Loading Wallets</h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <Button onClick={loadData} className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
              Retry Loading
            </Button>
          </div>
        ) : filteredWallets.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Wallets Available</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No wallets match your search.' : 'No wallets are currently available for connection.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredWallets.map((wallet) => (
                <Card
                  key={wallet.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-300"
                  onClick={() => handleWalletClick(wallet)}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                      {hasWalletIcon(wallet) ? (
                        <img 
                          src={getWalletIconUrlSync(wallet)} 
                          alt={wallet.name}
                          className="w-12 h-12 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full items-center justify-center text-gray-500 dark:text-gray-300 text-lg font-semibold ${hasWalletIcon(wallet) ? 'hidden' : 'flex'}`}
                      >
                        {getWalletFallbackDisplay(wallet)}
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{wallet.name}</h3>
                  </div>
                </Card>
            ))}
          </div>
        )}
      </main>

      {selectedWallet && (
        <ConnectWalletModal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          wallet={selectedWallet}
          onSuccess={() => {
            // No need to reload this page, as it doesn't show submission status
          }}
          onFeedback={showFeedback}
        />
      )}

      {feedback.isOpen && (
        <FeedbackModal
          isOpen={feedback.isOpen}
          onClose={() => setFeedback({ ...feedback, isOpen: false })}
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
        />
      )}
    </div>
  );
}