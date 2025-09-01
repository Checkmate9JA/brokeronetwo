
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Users, Play, Pause, BarChart3, Clock, X, CopyIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import WhatsAppLiveChatIntegration from '../components/WhatsAppLiveChatIntegration';

import PlaceTradeModal from '../components/modals/PlaceTradeModal';
import FeedbackModal from '../components/modals/FeedbackModal';
import ModifyPositionModal from '../components/modals/ModifyPositionModal';
import ViewSymbolsModal from '../components/modals/ViewSymbolsModal';
import TradingChart from '../components/TradingChart';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SocialProof from '../components/SocialProof';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

const formatDuration = (startDate) => {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now - start;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

const PositionCard = ({ position, onClose, onPause, onModify }) => {
  const [animatedPL, setAnimatedPL] = useState(position.profit_loss_amount || 0);
  const isProfit = position.profit_loss_amount >= 0;
  
  // Animate profit/loss changes
  useEffect(() => {
    const targetPL = position.profit_loss_amount || 0;
    if (animatedPL !== targetPL) {
      const increment = (targetPL - animatedPL) / 20; // 20 steps for smooth animation
      const animationInterval = setInterval(() => {
        setAnimatedPL(prev => {
          const next = prev + increment;
          // Stop when we're close enough to target
          if (Math.abs(next - targetPL) < Math.abs(increment)) {
            clearInterval(animationInterval);
            return targetPL;
          }
          return next;
        });
      }, 50); // Update every 50ms
      
      return () => clearInterval(animationInterval);
    }
  }, [position.profit_loss_amount, animatedPL]);
  
  return (
    <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant={position.trade_direction === 'BUY' ? 'default' : 'secondary'} className="text-xs">
            {position.trade_direction}
          </Badge>
          <span className="font-semibold dark:text-white">{position.symbol_code}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">({position.leverage})</span>
          {position.status === 'paused' && (
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
              Paused
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onPause(position)}>
            {position.status === 'paused' ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onClose(position)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Amount:</span>
          <span className="font-semibold dark:text-white">{formatCurrency(position.investment_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Entry:</span>
          <span className="dark:text-white">{formatCurrency(position.entry_price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Current:</span>
          <span className="dark:text-white">{formatCurrency(position.current_price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">P&L:</span>
          <span className={`font-semibold ${animatedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {animatedPL >= 0 ? '+' : ''}{formatCurrency(animatedPL)} ({animatedPL >= 0 ? '+' : ''}{((animatedPL / position.investment_amount) * 100).toFixed(2)}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Status:</span>
          <Badge variant="outline" className="text-xs">
            {position.status}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Duration:</span>
          <span className="text-xs dark:text-gray-300">{formatDuration(position.opened_date || position.created_date)}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onClose(position)}>
          Close Position
        </Button>
        <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={() => onModify(position)}>
          Modify
        </Button>
      </div>
    </Card>
  );
};

const TraderCard = ({ trader, onCopyTrade, copyTradeEnabled, minCopyTradeAmount, user }) => {
  const [isTradeSelectionModalOpen, setIsTradeSelectionModalOpen] = useState(false);

  const handleCopyTradeClick = () => {
    setIsTradeSelectionModalOpen(true);
  };

  const handleTradeSelection = (selectedTrade) => {
    setIsTradeSelectionModalOpen(false);
    onCopyTrade(trader, selectedTrade);
  };

  return (
    <>
      <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow relative">
        <div className="flex items-start gap-4 mb-6">
          <div 
            className="w-12 h-12 bg-green-500 rounded-full flex-shrink-0 flex items-center justify-center"
          >
            {trader.avatar_url ? (
                <img src={trader.avatar_url} alt={trader.name} className="w-full h-full rounded-full object-cover" />
            ) : (
                <span className="text-white font-bold text-sm">
                    {trader.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'ET'}
                </span>
            )}
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white">{trader.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{trader.specialties}</p>
            <p className="text-sm font-semibold text-green-600">{trader.avg_return}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{trader.win_rate}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-white">{trader.trades_count}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Trades</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{trader.followers}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Followers</div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Trades</h4>
          <div className="space-y-2">
            {trader.recent_trades?.slice(0, 3).map((trade, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={trade.action === 'BUY' ? 'default' : 'secondary'} className="text-xs">
                    {trade.action}
                  </Badge>
                  <span className="text-gray-600 dark:text-gray-300">{trade.symbol}</span>
                </div>
                <div className={`font-semibold ${trade.profit_loss.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {trade.profit_loss}
                </div>
              </div>
            ))}
            {(!trader.recent_trades || trader.recent_trades.length === 0) && (
              <div className="text-gray-500 dark:text-gray-400 text-sm">No recent trades</div>
            )}
          </div>
        </div>

        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleCopyTradeClick}
          disabled={!copyTradeEnabled}
        >
          <Users className="w-4 h-4 mr-2" />
          {copyTradeEnabled ? 'Copy Trade' : 'Copy Trading Disabled'}
        </Button>
      </Card>

      {/* Trade Selection Modal */}
      <Dialog open={isTradeSelectionModalOpen} onOpenChange={setIsTradeSelectionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Trade to Copy</DialogTitle>
            <DialogDescription>
              Choose which of {trader.name}'s recent trades you'd like to copy:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {trader.recent_trades?.slice(0, 3).map((trade, index) => (
              <div 
                key={index}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleTradeSelection(trade)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={trade.action === 'BUY' ? 'default' : 'secondary'}>
                      {trade.action}
                    </Badge>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{trade.symbol}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Trade #{index + 1}</div>
                    </div>
                  </div>
                  <div className={`font-bold text-lg ${trade.profit_loss.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {trade.profit_loss}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Amount Input Section */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Label htmlFor="copy-trade-amount" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Investment Amount (USD)
            </Label>
            <Input
              id="copy-trade-amount"
              type="number"
              min={minCopyTradeAmount}
              step="10"
              defaultValue={minCopyTradeAmount}
              className="mt-2"
              onChange={(e) => {
                const amount = parseFloat(e.target.value) || minCopyTradeAmount;
                // Store the amount in the trader object for use when copying
                trader.copyTradeAmount = amount;
              }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Minimum: ${minCopyTradeAmount} | Your balance: {formatCurrency(user?.trading_wallet || 0)}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTradeSelectionModalOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function TradingPlatform() {
  const { user: authUser, userProfile } = useAuth();
  const [user, setUser] = useState(null);
  const [traders, setTraders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use refs to hold the latest state for the interval callback
  const positionsRef = useRef(positions);
  const symbolsRef = useRef(symbols);
  const dataLoadedRef = useRef(false); // Track if data has been loaded
  
  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  // Trade modal states
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedTradeDirection, setSelectedTradeDirection] = useState('BUY');
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });

  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const [isViewSymbolsModalOpen, setIsViewSymbolsModalOpen] = useState(false);
  const [selectedInstrumentForSymbols, setSelectedInstrumentForSymbols] = useState(null);
  const [minCopyTradeAmount, setMinCopyTradeAmount] = useState(50); // Default minimum
  const [copyTradeEnabled, setCopyTradeEnabled] = useState(true); // Default enabled
  const [activeTab, setActiveTab] = useState('trade'); // Track active tab

  useEffect(() => {
    if (authUser && userProfile) {
      loadData();
      loadAdminSettings(); // Load admin settings including minimum copy trade amount
    }
  }, [authUser, userProfile]); // Run loadData when user is authenticated

  // Function to manually reload traders data
  const reloadTradersData = () => {
    console.log('Manually reloading traders data...');
    dataLoadedRef.current = false; // Reset the flag
    loadData();
  };

  // Ensure traders data is loaded when copy-trade tab is accessed
  useEffect(() => {
    if (activeTab === 'copy-trade' && traders.length === 0 && !isLoading && authUser && userProfile) {
      console.log('Copy-trade tab accessed but no traders data, loading...');
      reloadTradersData();
    }
  }, [activeTab, traders.length, isLoading, authUser, userProfile]);

  // Debug logging for traders state changes
  useEffect(() => {
    console.log('Traders state changed:', traders.length, 'traders');
  }, [traders]);

  useEffect(() => {
    // Set up position price updates simulation
    const interval = setInterval(updatePositionPrices, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []); // Run interval setup only once

  const loadData = async () => {
    if (!authUser) return;
    
    setIsLoading(true);
    try {
      // Load user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (userError) throw userError;

      // Load trading instruments
      const { data: instrumentData, error: instrumentError } = await supabase
        .from('trading_instruments')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (instrumentError) throw instrumentError;

      // Load trading symbols
      const { data: symbolData, error: symbolError } = await supabase
        .from('trading_symbols')
        .select('*')
        .eq('is_active', true)
        .order('symbol', { ascending: true });

      if (symbolError) throw symbolError;

      // Load open positions
      const { data: openPositionData, error: openPositionError } = await supabase
        .from('trading_positions')
        .select('*')
        .eq('user_email', authUser.email)
        .in('status', ['open', 'paused'])
        .order('created_at', { ascending: false });

      if (openPositionError) throw openPositionError;

      // Load closed positions
      const { data: closedPositionData, error: closedPositionError } = await supabase
        .from('trading_positions')
        .select('*')
        .eq('user_email', authUser.email)
        .eq('status', 'closed')
        .order('closed_date', { ascending: false });

      if (closedPositionError) throw closedPositionError;

      // Add mock closed positions for demonstration (remove this in production)
      const mockClosedPositions = [
        {
          id: 'mock-1',
          symbol_code: 'BTC/USD',
          trade_direction: 'BUY',
          leverage: '5x',
          investment_amount: 1000,
          entry_price: 65000,
          current_price: 62000,
          profit_loss_amount: -300,
          closed_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        },
        {
          id: 'mock-2',
          symbol_code: 'EUR/USD',
          trade_direction: 'SELL',
          leverage: '3x',
          investment_amount: 500,
          entry_price: 1.08,
          current_price: 1.12,
          profit_loss_amount: -200,
          closed_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        },
        {
          id: 'mock-3',
          symbol_code: 'AAPL',
          trade_direction: 'BUY',
          leverage: '2x',
          investment_amount: 800,
          entry_price: 180,
          current_price: 195,
          profit_loss_amount: 150,
          closed_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        }
      ];

      // Combine real closed positions with mock ones for demonstration
      // TODO: Remove mockClosedPositions in production and use: setClosedPositions(closedPositionData || []);
      const allClosedPositions = [...(closedPositionData || []), ...mockClosedPositions];

      // Load expert traders (mock data for now)
      const mockTraders = [
        {
          id: 1,
          name: 'Alex Thompson',
          specialties: 'Forex & Crypto',
          avg_return: '+15.2% monthly',
          win_rate: 78,
          trades_count: 156,
          followers: 1247,
          avatar_url: null,
          recent_trades: [
            { action: 'BUY', symbol: 'EUR/USD', profit_loss: '+$234' },
            { action: 'SELL', symbol: 'BTC/USD', profit_loss: '-$156' },
            { action: 'BUY', symbol: 'GBP/USD', profit_loss: '-$89' }
          ]
        },
        {
          id: 2,
          name: 'Sarah Chen',
          specialties: 'Stocks & ETFs',
          avg_return: '+12.8% monthly',
          win_rate: 82,
          trades_count: 203,
          followers: 2156,
          avatar_url: null,
          recent_trades: [
            { action: 'BUY', symbol: 'AAPL', profit_loss: '+$445' },
            { action: 'BUY', symbol: 'TSLA', profit_loss: '-$312' },
            { action: 'SELL', symbol: 'NVDA', profit_loss: '+$178' }
          ]
        }
      ];

      console.log('Setting traders data:', mockTraders.length, 'traders');
      // Only set traders if they don't already exist to prevent clearing
      if (!dataLoadedRef.current) {
        setTraders(mockTraders);
        dataLoadedRef.current = true;
        console.log('Traders data loaded and marked as loaded');
      } else {
        console.log('Traders already loaded, preserving existing data');
      }
      
      // Calculate total balance
      const totalBalance = (userData.deposit_wallet || 0) + (userData.profit_wallet || 0) + (userData.trading_wallet || 0);
      
      setUser({
        ...userData,
        total_balance: totalBalance
      });
      setPositions(openPositionData || []);
      setClosedPositions(allClosedPositions);
      setInstruments(instrumentData || []);
      
      // Add realistic prices to symbols
      const pricedSymbolData = (symbolData || []).map(symbol => {
        if (!symbol.current_price || symbol.current_price === 0) {
          if (symbol.symbol.toUpperCase().includes('BTC')) {
            symbol.current_price = 67000 + Math.random() * 1000;
          } else if (symbol.symbol.toUpperCase().includes('ETH')) {
            symbol.current_price = 3500 + Math.random() * 100;
          } else if (symbol.symbol.toUpperCase().includes('USD') || symbol.symbol.toUpperCase().includes('EUR')) {
            symbol.current_price = 1.1 + Math.random() * 0.1;
          } else {
            symbol.current_price = 100 + Math.random() * 50;
          }
        }
        return symbol;
      });

      setSymbols(pricedSymbolData);

      console.log('Loaded data:', {
        instruments: instrumentData?.length || 0,
        symbols: symbolData?.length || 0,
        openPositions: openPositionData?.length || 0,
        closedPositions: closedPositionData?.length || 0
      });
    } catch (error) {
      console.error('Error loading trading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['min_copy_trade_amount', 'copy_trade_enabled']);

      if (error) {
        console.error('Error loading admin settings:', error);
        setMinCopyTradeAmount(50); // Fallback to default
        setCopyTradeEnabled(true); // Fallback to default
      } else {
        data?.forEach(setting => {
          if (setting.setting_key === 'min_copy_trade_amount') {
            setMinCopyTradeAmount(parseInt(setting.setting_value) || 50);
          } else if (setting.setting_key === 'copy_trade_enabled') {
            setCopyTradeEnabled(setting.setting_value === 'true');
          }
        });
      }
    } catch (error) {
      console.error('Error loading admin settings:', error);
      setMinCopyTradeAmount(50); // Fallback to default
      setCopyTradeEnabled(true); // Fallback to default
    }
  };

  // Enhanced position price updates with admin control
  const updatePositionPrices = async () => {
    // Use the refs to get current state, avoiding stale closures
    const currentPositions = positionsRef.current;
    const currentSymbols = symbolsRef.current;

    if (currentPositions.length === 0 || currentSymbols.length === 0) return;
    
    try {
      // Load admin settings for loss control
      const { data: adminSettings, error: settingsError } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['user_loss_percentage', 'enforce_user_loss_percentage', 'global_loss_control']);

      if (settingsError) {
        console.error('Error loading admin settings:', settingsError);
      }

      // Extract settings with defaults
      const userLossPercentage = parseFloat(adminSettings?.find(s => s.setting_key === 'user_loss_percentage')?.setting_value || '3');
      const enforceUserLoss = adminSettings?.find(s => s.setting_key === 'enforce_user_loss_percentage')?.setting_value === 'true';
      const globalLossControl = adminSettings?.find(s => s.setting_key === 'global_loss_control')?.setting_value === 'true';

      const updatedPositions = await Promise.all(currentPositions.map(async (position) => {
        if (position.status === 'paused') return position; // Don't update paused positions
        
        // Get the symbol data to check admin controls
        const symbol = currentSymbols.find(s => s.id === position.symbol_id);
        let profitLossAmount, profitLossPercentage;
        
        if (symbol && symbol.admin_controlled_outcome === 'force_loss') {
          // Force loss - gradually decrease value
          const elapsedMinutes = Math.floor((Date.now() - new Date(position.opened_date || position.created_date).getTime()) / (1000 * 60));
          const leverageMultiplier = parseFloat(position.leverage.replace('x', ''));
          const lossPercent = Math.min(symbol.loss_percentage || 3, elapsedMinutes * 0.05); // Gradual loss, e.g., 0.05% per minute
          
          profitLossAmount = -(position.investment_amount * (lossPercent / 100) * leverageMultiplier);
          profitLossPercentage = -(lossPercent * leverageMultiplier);
        } else if (symbol && symbol.admin_controlled_outcome === 'force_profit') {
          // Force profit - gradually increase value
          const elapsedMinutes = Math.floor((Date.now() - new Date(position.opened_date || position.created_date).getTime()) / (1000 * 60));
          const leverageMultiplier = parseFloat(position.leverage.replace('x', ''));
          const profitPercent = Math.min(symbol.profit_percentage || 5, elapsedMinutes * 0.05); // Gradual profit, e.g., 0.05% per minute
          
          profitLossAmount = position.investment_amount * (profitPercent / 100) * leverageMultiplier;
          profitLossPercentage = profitPercent * leverageMultiplier;
        } else if (globalLossControl && enforceUserLoss) {
          // Admin-controlled global loss - enforce user loss percentage
          const elapsedMinutes = Math.floor((Date.now() - new Date(position.opened_date || position.created_date).getTime()) / (1000 * 60));
          const leverageMultiplier = parseFloat(position.leverage.replace('x', ''));
          
          // Calculate loss based on admin setting and time elapsed
          const maxLossPercent = userLossPercentage; // Admin-set maximum loss percentage
          const lossPercent = Math.min(maxLossPercent, elapsedMinutes * 0.02); // Gradual loss, e.g., 0.02% per minute
          
          profitLossAmount = -(position.investment_amount * (lossPercent / 100) * leverageMultiplier);
          profitLossPercentage = -(lossPercent * leverageMultiplier);
        } else {
          // Natural trading - simulate realistic price movement
          const priceChangeFactor = (Math.random() - 0.5) * 0.005; // Simulate a small price change for the asset itself
          const leverageMultiplier = parseFloat(position.leverage.replace('x', ''));
          if (isNaN(leverageMultiplier)) { 
            console.warn(`Invalid leverage for position ${position.id}: ${position.leverage}. Defaulting to 1x.`);
            return position; // Skip update if leverage is invalid
          }
          
          // Calculate P&L based on simulated price movement and leverage
          // For simplicity, we directly simulate the leveraged movement percentage
          let leveragedMovementPercentage = priceChangeFactor * leverageMultiplier;
          
          // Adjust for trade direction (SELL positions profit when price goes down)
          if (position.trade_direction === 'SELL') {
            leveragedMovementPercentage = -leveragedMovementPercentage;
          }
          
          profitLossAmount = position.investment_amount * leveragedMovementPercentage;
          profitLossPercentage = leveragedMovementPercentage * 100;

          // Note: The `current_price` of the position itself is not updated in the DB
          // as per the outline for this specific simulation change.
          // If a market price update was needed, it would be 'symbol.current_price'.
        }
        
        // Update position in database
        const { error: updateError } = await supabase
          .from('trading_positions')
          .update({
            profit_loss_amount: profitLossAmount,
            profit_loss_percentage: profitLossPercentage
          })
          .eq('id', position.id);

        if (updateError) {
          console.error('Error updating position:', updateError);
          return position;
        }
        
        return {
          ...position,
          profit_loss_amount: profitLossAmount,
          profit_loss_percentage: profitLossPercentage
        };
      }));
      
      setPositions(updatedPositions);
    } catch (error) {
      console.error('Error updating position prices:', error);
    }
  };

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const handleBuyClick = () => {
    if (!selectedSymbol) {
      showFeedback('error', 'No Symbol Selected', 'Please select a trading symbol first.');
      return;
    }
    setSelectedTradeDirection('BUY');
    setIsTradeModalOpen(true);
  };

  const handleSellClick = () => {
    if (!selectedSymbol) {
      showFeedback('error', 'No Symbol Selected', 'Please select a trading symbol first.');
      return;
    }
    setSelectedTradeDirection('SELL');
    setIsTradeModalOpen(true);
  };

  const filteredSymbols = selectedInstrument 
    ? symbols.filter(symbol => symbol.instrument_id === selectedInstrument.id)
    : [];

  const handleInstrumentSelect = (instrument) => {
    setSelectedInstrument(instrument);
    setSelectedSymbol(null);
    
    // Mobile auto-scroll to symbols section
    if (window.innerWidth < 1024) { // lg breakpoint
      setTimeout(() => {
        const symbolsSection = document.getElementById('symbols-section');
        if (symbolsSection) {
          symbolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleViewSymbols = (instrument) => {
    setSelectedInstrumentForSymbols(instrument);
    setIsViewSymbolsModalOpen(true);
  };

  const handleSymbolSelect = (symbol) => {
    setSelectedSymbol(symbol);
  };

  const handleClosePosition = async (position) => {
    if (!user || !authUser) return;
    try {
      // 1. Update position status to closed
      const { error: positionError } = await supabase
        .from('trading_positions')
        .update({
          status: 'closed',
          closed_date: new Date().toISOString()
        })
        .eq('id', position.id);

      if (positionError) throw positionError;

      // 2. Calculate final settlement with leverage effects
      // For losses: user gets back (investment_amount - loss_amount)
      // For profits: user gets back (investment_amount + profit_amount)
      const totalReturn = position.investment_amount + (position.profit_loss_amount || 0);
      
      // Ensure user never gets negative return (minimum 0)
      const finalReturn = Math.max(0, totalReturn);
      
      // 3. Update user wallets - return funds to trading wallet
      const newTradingWallet = (user.trading_wallet || 0) + finalReturn;
      const newTotalBalance = (user.total_balance || 0) + (position.profit_loss_amount || 0); // Only P&L affects total balance
      
      const { error: userError } = await supabase
        .from('users')
        .update({
          trading_wallet: newTradingWallet,
          total_balance: newTotalBalance
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // 4. Create transaction record for the result
      const transactionType = position.profit_loss_amount >= 0 ? 'profit' : 'loss';
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_email: user.email,
          type: transactionType,
          amount: Math.abs(position.profit_loss_amount || 0),
          status: 'completed',
          description: `${position.profit_loss_amount >= 0 ? 'Profit' : 'Loss'} from closing ${position.symbol_code} trade (${position.leverage} leverage). Returned: ${formatCurrency(finalReturn)}`
        });

      if (transactionError) throw transactionError;

      // 5. Show detailed feedback about the settlement
      const feedbackMessage = position.profit_loss_amount >= 0 
        ? `Position closed with profit: ${formatCurrency(position.profit_loss_amount)}. Total returned: ${formatCurrency(finalReturn)}`
        : `Position closed with loss: ${formatCurrency(Math.abs(position.profit_loss_amount))}. Remaining balance returned: ${formatCurrency(finalReturn)}`;
      
      showFeedback('success', 'Position Closed', feedbackMessage);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error closing position:', error);
      showFeedback('error', 'Error', 'Failed to close position.');
    }
  };

  const handlePausePosition = async (position) => {
    const newStatus = position.status === 'paused' ? 'open' : 'paused';
    try {
      const { error } = await supabase
        .from('trading_positions')
        .update({ status: newStatus })
        .eq('id', position.id);

      if (error) throw error;

      showFeedback('success', 'Position Updated', `Position for ${position.symbol_code} has been ${newStatus}.`);
      loadData();
    } catch (error) {
      console.error('Error updating position status:', error);
      showFeedback('error', 'Error', 'Failed to update position status.');
    }
  };
  
  const handleModifyPosition = (position) => {
      setSelectedPosition(position);
      setIsModifyModalOpen(true);
  };

  const handleCopyTrade = async (trader, selectedTrade) => {
    if (!user || !authUser) {
      showFeedback('error', 'Not Logged In', 'Please log in to copy trades.');
      return;
    }

    if (!copyTradeEnabled) {
      showFeedback('error', 'Copy Trading Disabled', 'Copy trading is currently disabled by administrators.');
      return;
    }

    try {
      // Use user-specified amount or default to minimum
      const copyTradeAmount = trader.copyTradeAmount || minCopyTradeAmount;

      // Check if user has sufficient balance
      if (copyTradeAmount > (user.trading_wallet || 0)) {
        showFeedback('error', 'Insufficient Balance', `You need at least ${formatCurrency(copyTradeAmount)} in your trading wallet to copy this trader.`);
        return;
      }

      // Validate minimum amount
      if (copyTradeAmount < minCopyTradeAmount) {
        showFeedback('error', 'Invalid Amount', `Minimum copy trade amount is ${formatCurrency(minCopyTradeAmount)}.`);
        return;
      }

      // Get a random symbol for demo purposes
      const availableSymbols = symbols.filter(s => s.is_active);
      if (availableSymbols.length === 0) {
        showFeedback('error', 'No Symbols', 'No trading symbols available.');
        return;
      }

      const randomSymbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];

      // Create position copying the trader's style
      const positionData = {
        user_email: user.email,
        symbol_id: randomSymbol.id,
        symbol_code: randomSymbol.symbol,
        trade_direction: selectedTrade.action, // Use the selected trade's action
        investment_amount: copyTradeAmount, // Use user-specified amount
        leverage: '5x', // Standard leverage for copy trading
        entry_price: randomSymbol.current_price || 100,
        current_price: randomSymbol.current_price || 100,
        profit_loss_amount: 0,
        profit_loss_percentage: 0,
        status: 'open',
        stop_loss_price: (randomSymbol.current_price || 100) * 0.95,
        take_profit_price: (randomSymbol.current_price || 100) * 1.10,
        opened_date: new Date().toISOString()
      };

      const { error: positionError } = await supabase
        .from('trading_positions')
        .insert(positionData);

      if (positionError) throw positionError;

      // Deduct amount from trading wallet
      const { error: userError } = await supabase
        .from('users')
        .update({
          trading_wallet: (user.trading_wallet || 0) - copyTradeAmount,
          total_balance: (user.total_balance || 0) - copyTradeAmount
        })
        .eq('id', user.id);

      if (userError) throw userError;

      showFeedback('success', 'Copy Trade Started!', `Now copying ${trader.name}'s ${selectedTrade.action} trade with ${randomSymbol.symbol} (${formatCurrency(copyTradeAmount)}).`);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error creating copy trade:', error);
      showFeedback('error', 'Copy Trade Failed', 'Failed to start copy trading. Please try again.');
    }
  };

  if (!authUser || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 lg:px-8 py-4 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Trading Platform</h1>
              <p className="text-sm text-gray-500 dark:text-white dark:font-semibold hidden md:block">Trade and follow expert traders</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="hidden md:inline">Trading </span>Bal:
              </div>
              <div className="text-xl font-bold dark:text-white">{formatCurrency(user?.trading_wallet || 0)}</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Wallet Overview - Hidden on Mobile */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Total Balance</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(user?.total_balance || 0)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">All wallets combined</div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Deposit Wallet</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(user?.deposit_wallet || 0)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Available for trading</div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Profit Wallet</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(user?.profit_wallet || 0)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Trading profits</div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Trading Wallet</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(user?.trading_wallet || 0)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Active in trades</div>
          </Card>
        </div>

        <Tabs defaultValue="trade" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trade" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Trade</span>
            </TabsTrigger>
            <TabsTrigger value="copy-trade" className="flex items-center gap-2">
              <span className="hidden md:inline">Expert Traders</span>
              <CopyIcon className="w-4 h-4 md:hidden" />
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Positions</span>
              <span className="md:hidden">Positions</span>
            </TabsTrigger>
          </TabsList>

          {/* Trade Tab - matches screenshot exactly */}
          <TabsContent value="trade" className="mt-6">
            {/* Mobile Section Header */}
            <div className="md:hidden mb-6">
              <h2 className="text-xl font-bold text-gray-900">Trade</h2>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Stats Cards */}
              <Card className="p-4 bg-white dark:bg-gray-800 text-center border-gray-100 dark:border-gray-700">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">Total P&L</div>
                <div className="text-lg sm:text-xl font-bold text-green-600 mb-1">+$2,456.78</div>
                <div className="text-xs text-green-600">+12.34%</div>
              </Card>

              <Card className="p-4 bg-white dark:bg-gray-800 text-center border-gray-100 dark:border-gray-700">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">Open Positions</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">{positions.length}</div>
                <div className="text-xs text-green-600">+2</div>
              </Card>

              <Card className="p-4 bg-white dark:bg-gray-800 text-center border-gray-100 dark:border-gray-700">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">Win Rate</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">68%</div>
                <div className="text-xs text-green-600">+5%</div>
              </Card>

              <Card className="p-4 bg-white dark:bg-gray-800 text-center border-gray-100 dark:border-gray-700">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-1">Today's P&L</div>
                <div className="text-lg sm:text-xl font-bold text-green-600 mb-1">+$345.67</div>
                <div className="text-xs text-green-600">+8.9%</div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Select Instrument */}
              <Card className="p-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Select Instrument</h3>
                <div className="space-y-2">
                  {instruments && instruments.length > 0 ? (
                    instruments.map((instrument) => (
                      <div key={instrument.id}>
                        <div
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedInstrument?.id === instrument.id 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => handleInstrumentSelect(instrument)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{instrument.icon || '📈'}</span>
                            <div className="flex-1">
                              <div className="font-semibold dark:text-white">{instrument.name}</div>
                              <div className={`text-sm ${
                                selectedInstrument?.id === instrument.id ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {instrument.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* View Symbols Button */}
                        <div className="mt-2 px-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => handleViewSymbols(instrument)}
                          >
                            View Symbols ({symbols.filter(s => s.instrument_id === instrument.id).length})
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <p>No trading instruments available</p>
                      <p className="text-xs mt-1">Instruments loaded: {instruments?.length || 0}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Select Symbol */}
              <Card className="p-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700" id="symbols-section">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Select Symbol</h3>
                <div className="space-y-2">
                  {selectedInstrument ? (
                    filteredSymbols.length > 0 ? (
                      filteredSymbols.map((symbol) => (
                        <div
                          key={symbol.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedSymbol?.id === symbol.id 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                          onClick={() => handleSymbolSelect(symbol)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold dark:text-white">{symbol.symbol}</div>
                              <div className={`text-sm ${
                                selectedSymbol?.id === symbol.id ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'
                              }`}>
                                {symbol.name || 'No name'}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold dark:text-white">{formatCurrency(symbol.current_price || 0)}</div>
                              <div className="text-xs text-green-600">+1.2%</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <p>No assets available</p>
                        <p className="text-xs">for this instrument</p>
                        <p className="text-xs mt-1">Symbols loaded: {symbols?.length || 0}</p>
                        <p className="text-xs">Filtered: {filteredSymbols?.length || 0}</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>No assets available</p>
                      <p className="text-xs">Select an instrument first</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Trading Chart */}
              <Card className="p-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Trading Chart</h3>
                <TradingChart symbol={selectedSymbol} />

                {selectedSymbol && (
                  <div className="mt-6 space-y-4">
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleBuyClick}
                      >
                        BUY
                      </Button>
                      <Button 
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={handleSellClick}
                      >
                        SELL
                      </Button>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{formatCurrency(selectedSymbol.current_price || 0)}</div>
                      <div className="text-sm text-gray-500">Current market price</div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Copy Trade Tab */}
          <TabsContent value="copy-trade" key="copy-trade" className="mt-6">
            {/* Mobile Section Header */}
            <div className="md:hidden mb-6">
              <h2 className="text-xl font-bold text-gray-900">Expert Trader</h2>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {traders && traders.length > 0 ? (
                traders.map((trader) => (
                  <TraderCard 
                    key={trader.id} 
                    trader={trader} 
                    onCopyTrade={handleCopyTrade}
                    copyTradeEnabled={copyTradeEnabled}
                    minCopyTradeAmount={minCopyTradeAmount}
                    user={user}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No expert traders available</p>
                  <p className="text-sm mt-1">
                    {isLoading ? 'Loading traders...' : 'Check back later for trading experts'}
                  </p>
                  {!isLoading && traders?.length === 0 && (
                    <Button 
                      onClick={reloadTradersData} 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                    >
                      Reload Data
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Positions Tab */}
          <TabsContent value="positions" className="mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Positions</h2>
              <p className="text-sm text-gray-500 dark:text-white dark:font-semibold">Monitor and manage your trading positions</p>
            </div>

            <Tabs defaultValue="open" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="open">Open Positions ({positions.length})</TabsTrigger>
                <TabsTrigger value="closed">Closed Positions ({closedPositions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="open" className="mt-0">
                {positions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {positions.map((position) => (
                      <PositionCard 
                        key={position.id} 
                        position={position}
                        onClose={handleClosePosition}
                        onPause={handlePausePosition}
                        onModify={handleModifyPosition}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Open Positions</h3>
                      <p className="text-gray-500 dark:text-gray-400">No open positions</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="closed" className="mt-0">
                {closedPositions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {closedPositions.map((position) => (
                      <Card key={position.id} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={position.trade_direction === 'BUY' ? 'default' : 'secondary'} className="text-xs">
                              {position.trade_direction}
                            </Badge>
                            <span className="font-semibold dark:text-white">{position.symbol_code}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">({position.leverage})</span>
                            <Badge variant="outline" className="text-xs text-gray-600 border-gray-200">
                              Closed
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Amount:</span>
                            <span className="font-semibold dark:text-white">{formatCurrency(position.investment_amount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Entry:</span>
                            <span className="dark:text-white">{formatCurrency(position.entry_price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Exit:</span>
                            <span className="dark:text-white">{formatCurrency(position.current_price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Final P&L:</span>
                            <span className={`font-semibold ${position.profit_loss_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {position.profit_loss_amount >= 0 ? '+' : ''}{formatCurrency(position.profit_loss_amount)} ({position.profit_loss_amount >= 0 ? '+' : ''}{((position.profit_loss_amount / position.investment_amount) * 100).toFixed(2)}%)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Closed:</span>
                            <span className="text-xs dark:text-gray-300">{new Date(position.closed_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Closed Positions</h3>
                      <p className="text-gray-500 dark:text-gray-400">No closed positions</p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>

      <PlaceTradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        symbol={selectedSymbol}
        tradeDirection={selectedTradeDirection}
        user={user}
        onSuccess={() => {
          loadData(); // Refresh data to show new position
          showFeedback('success', 'Trade Placed!', 'Your trade has been successfully opened.');
        }}
        onFeedback={showFeedback}
      />

      <ModifyPositionModal
        isOpen={isModifyModalOpen}
        onClose={() => setIsModifyModalOpen(false)}
        position={selectedPosition}
        onSuccess={() => {
          loadData();
          setSelectedPosition(null);
          showFeedback('success', 'Position Modified!', 'Your position has been successfully updated.');
        }}
        onFeedback={showFeedback}
      />

      <ViewSymbolsModal
        isOpen={isViewSymbolsModalOpen}
        onClose={() => setIsViewSymbolsModalOpen(false)}
        instrument={selectedInstrumentForSymbols}
        symbols={symbols.filter(s => s.instrument_id === selectedInstrumentForSymbols?.id)}
        onSelectSymbol={(symbol) => {
          setSelectedSymbol(symbol);
          setSelectedInstrument(selectedInstrumentForSymbols);
          setIsViewSymbolsModalOpen(false);
        }}
      />

      <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />

      {/* Social Proof Notifications */}
      <SocialProof pageType="trading-platform" />

      {/* WhatsApp/LiveChat Integration */}
      <WhatsAppLiveChatIntegration />
    </div>
  );
}
