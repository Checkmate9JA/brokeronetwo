
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, TrendingDown, Users, Play, Pause, BarChart3, Clock, X, CopyIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User } from '@/api/entities';
import { ExpertTrader } from '@/api/entities';
import { TradingPosition } from '@/api/entities';
import { TradingInstrument } from '@/api/entities';
import { TradingSymbol } from '@/api/entities';
import { Transaction } from '@/api/entities';
import { AdminSetting } from '@/api/entities'; // Added import for AdminSetting

import PlaceTradeModal from '../components/modals/PlaceTradeModal';
import FeedbackModal from '../components/modals/FeedbackModal';
import ModifyPositionModal from '../components/modals/ModifyPositionModal';
import ViewSymbolsModal from '../components/modals/ViewSymbolsModal';
import TradingChart from '../components/TradingChart';

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
    <Card className="p-4 bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge variant={position.trade_direction === 'BUY' ? 'default' : 'secondary'} className="text-xs">
            {position.trade_direction}
          </Badge>
          <span className="font-semibold">{position.symbol_code}</span>
          <span className="text-xs text-gray-500">({position.leverage})</span>
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
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">{formatCurrency(position.investment_amount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Entry:</span>
          <span>{formatCurrency(position.entry_price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Current:</span>
          <span>{formatCurrency(position.current_price)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">P&L:</span>
          <span className={`font-semibold ${animatedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {animatedPL >= 0 ? '+' : ''}{formatCurrency(animatedPL)} ({animatedPL >= 0 ? '+' : ''}{((animatedPL / position.investment_amount) * 100).toFixed(2)}%)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Status:</span>
          <Badge variant="outline" className="text-xs">
            {position.status}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Duration:</span>
          <span className="text-xs">{formatDuration(position.opened_date || position.created_date)}</span>
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

const TraderCard = ({ trader, onCopyTrade }) => {
  return (
    <Card className="p-6 bg-white border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow relative">
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
          <h3 className="font-bold text-gray-900">{trader.name}</h3>
          <p className="text-sm text-gray-500">{trader.specialties}</p>
          <p className="text-sm font-semibold text-green-600">{trader.avg_return}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{trader.win_rate}%</div>
          <div className="text-xs text-gray-500">Win Rate</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{trader.trades_count}</div>
          <div className="text-xs text-gray-500">Trades</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{trader.followers}</div>
          <div className="text-xs text-gray-500">Followers</div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Trades</h4>
        <div className="space-y-2">
          {trader.recent_trades?.slice(0, 3).map((trade, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={trade.action === 'BUY' ? 'default' : 'secondary'} className="text-xs">
                  {trade.action}
                </Badge>
                <span className="text-gray-600">{trade.symbol}</span>
              </div>
              <div className="text-green-600 font-semibold">{trade.profit_loss}</div>
            </div>
          ))}
          {(!trader.recent_trades || trader.recent_trades.length === 0) && (
            <div className="text-gray-500 text-sm">No recent trades</div>
          )}
        </div>
      </div>

      <Button 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => onCopyTrade(trader)}
      >
        <Users className="w-4 h-4 mr-2" />
        Copy Trade
      </Button>
    </Card>
  );
};

export default function TradingPlatform() {
  const [user, setUser] = useState(null);
  const [traders, setTraders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [symbols, setSymbols] = useState([]);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use refs to hold the latest state for the interval callback
  const positionsRef = useRef(positions);
  const symbolsRef = useRef(symbols);
  
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

  useEffect(() => {
    loadData();
  }, []); // Run loadData only once on mount

  useEffect(() => {
    // Set up position price updates simulation
    const interval = setInterval(updatePositionPrices, 15000); // Update every 15 seconds
    return () => clearInterval(interval);
  }, []); // Run interval setup only once

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currentUser, traderData, positionData, instrumentData, symbolData] = await Promise.all([
        User.me(),
        ExpertTrader.list(),
        TradingPosition.filter({ 
          status: 'open' // Include both open and paused positions
        }),
        TradingInstrument.filter({ is_active: true }),
        TradingSymbol.filter({ is_active: true })
      ]);
      
      // Calculate correct total balance (only wallet balances)
      const correctTotalBalance = (currentUser.deposit_wallet || 0) + (currentUser.profit_wallet || 0) + (currentUser.trading_wallet || 0);
      
      setUser({
        ...currentUser,
        total_balance: correctTotalBalance
      });
      setTraders(traderData);
      
      // Filter positions to include both open and paused
      const activePositions = positionData.filter(p => p.status === 'open' || p.status === 'paused');
      setPositions(activePositions);
      setInstruments(instrumentData);
      
      // Enhanced price simulation with realistic values
      const pricedSymbolData = symbolData.map(symbol => {
          if (!symbol.current_price || symbol.current_price === 0) {
              // Assign realistic prices based on symbol name
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
          // Add dummy admin control for demonstration
          if (symbol.symbol.includes('BTC')) {
            symbol.admin_controlled_outcome = 'force_profit';
            symbol.profit_percentage = 5;
          } else if (symbol.symbol.includes('ETH')) {
            symbol.admin_controlled_outcome = 'force_loss';
            symbol.loss_percentage = 3;
          }
          return symbol;
      });

      setSymbols(pricedSymbolData);
    } catch (error) {
      console.error('Error loading trading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced position price updates with admin control
  const updatePositionPrices = async () => {
    // Use the refs to get current state, avoiding stale closures
    const currentPositions = positionsRef.current;
    const currentSymbols = symbolsRef.current;

    if (currentPositions.length === 0 || currentSymbols.length === 0) return;
    
    try {
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
        await TradingPosition.update(position.id, {
          profit_loss_amount: profitLossAmount,
          profit_loss_percentage: profitLossPercentage
        });
        
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
    if (!user) return;
    try {
      // 1. Update position status to closed
      await TradingPosition.update(position.id, {
        status: 'closed',
        closed_date: new Date().toISOString()
      });

      // 2. Calculate final settlement with leverage effects
      const totalReturn = position.investment_amount + (position.profit_loss_amount || 0);
      
      // 3. Update user wallets - return funds to trading wallet
      const newTradingWallet = (user.trading_wallet || 0) + totalReturn;
      const newTotalBalance = (user.total_balance || 0) + (position.profit_loss_amount || 0); // Only P&L affects total balance
      
      await User.update(user.id, {
        trading_wallet: newTradingWallet,
        total_balance: newTotalBalance
      });

      // 4. Create transaction record for the result
      await Transaction.create({
        user_email: user.email,
        type: 'profit',
        amount: Math.abs(position.profit_loss_amount || 0),
        status: 'completed',
        description: `${position.profit_loss_amount >= 0 ? 'Profit' : 'Loss'} from closing ${position.symbol_code} trade (${position.leverage} leverage)`
      });

      showFeedback('success', 'Position Closed', `Position for ${position.symbol_code} has been closed. ${position.profit_loss_amount >= 0 ? 'Profit' : 'Loss'}: ${formatCurrency(position.profit_loss_amount || 0)}`);
      loadData(); // Reload data
    } catch (error) {
      console.error('Error closing position:', error);
      showFeedback('error', 'Error', 'Failed to close position.');
    }
  };

  const handlePausePosition = async (position) => {
    const newStatus = position.status === 'paused' ? 'open' : 'paused';
    try {
      await TradingPosition.update(position.id, { status: newStatus });
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

  const handleCopyTrade = async (trader) => {
    if (!user) {
      showFeedback('error', 'Not Logged In', 'Please log in to copy trades.');
      return;
    }

    try {
      // Load minimum copy trade amount from admin settings
      const settings = await AdminSetting.list();
      const minCopyTradeSetting = settings.find(s => s.setting_key === 'min_copy_trade_amount');
      const minCopyTradeAmount = minCopyTradeSetting ? parseFloat(minCopyTradeSetting.setting_value) || 50 : 50;

      // Check if user has sufficient balance
      if (minCopyTradeAmount > (user.trading_wallet || 0)) {
        showFeedback('error', 'Insufficient Balance', `You need at least ${formatCurrency(minCopyTradeAmount)} in your trading wallet to copy this trader.`);
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
        trade_direction: 'BUY', // Most copy trades are BUY
        investment_amount: minCopyTradeAmount,
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

      await TradingPosition.create(positionData);

      // Deduct amount from trading wallet
      await User.update(user.id, {
        trading_wallet: (user.trading_wallet || 0) - minCopyTradeAmount,
        total_balance: (user.total_balance || 0) - minCopyTradeAmount
      });

      showFeedback('success', 'Copy Trade Started!', `Now copying ${trader.name}'s trades with ${randomSymbol.symbol} (${formatCurrency(minCopyTradeAmount)}).`);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error creating copy trade:', error);
      showFeedback('error', 'Copy Trade Failed', 'Failed to start copy trading. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="text-gray-600">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Trading Platform</h1>
              <p className="text-sm text-gray-500 hidden md:block">Trade and follow expert traders</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm text-gray-500">
              <span className="hidden md:inline">Trading </span>Bal:
            </div>
            <div className="text-xl font-bold">{formatCurrency(user?.trading_wallet || 0)}</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Wallet Overview - Hidden on Mobile */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Balance</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(user?.total_balance || 0)}</div>
            <div className="text-xs text-gray-500">All wallets combined</div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">Deposit Wallet</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(user?.deposit_wallet || 0)}</div>
            <div className="text-xs text-gray-500">Available for trading</div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Profit Wallet</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(user?.profit_wallet || 0)}</div>
            <div className="text-xs text-gray-500">Trading profits</div>
          </Card>

          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Trading Wallet</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(user?.trading_wallet || 0)}</div>
            <div className="text-xs text-gray-500">Active in trades</div>
          </Card>
        </div>

        <Tabs defaultValue="trade" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trade" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Trade</span>
            </TabsTrigger>
            <TabsTrigger value="copy-trade" className="flex items-center gap-2">
              <span className="hidden md:inline">Expert Traders</span>
              <CopyIcon className="w-4 h-4 md:hidden" />
            </TabsTrigger>
            <TabsTrigger value="open-positions" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden md:inline">Open Positions</span>
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
              <Card className="p-4 bg-white text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Total P&L</div>
                <div className="text-lg sm:text-xl font-bold text-green-600 mb-1">+$2,456.78</div>
                <div className="text-xs text-green-600">+12.34%</div>
              </Card>

              <Card className="p-4 bg-white text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Open Positions</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{positions.length}</div>
                <div className="text-xs text-green-600">+2</div>
              </Card>

              <Card className="p-4 bg-white text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Win Rate</div>
                <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">68%</div>
                <div className="text-xs text-green-600">+5%</div>
              </Card>

              <Card className="p-4 bg-white text-center">
                <div className="text-xs sm:text-sm text-gray-600 mb-1">Today's P&L</div>
                <div className="text-lg sm:text-xl font-bold text-green-600 mb-1">+$345.67</div>
                <div className="text-xs text-green-600">+8.9%</div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Select Instrument */}
              <Card className="p-6 bg-white">
                <h3 className="text-lg font-semibold mb-4">Select Instrument</h3>
                <div className="space-y-2">
                  {instruments.map((instrument) => (
                    <div key={instrument.id}>
                      <div
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedInstrument?.id === instrument.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                        onClick={() => handleInstrumentSelect(instrument)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{instrument.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold">{instrument.name}</div>
                            <div className={`text-sm ${
                              selectedInstrument?.id === instrument.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {instrument.description}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* View Symbols Button */}
                      <div className="mt-2 px-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs text-blue-600 hover:bg-blue-50"
                          onClick={() => handleViewSymbols(instrument)}
                        >
                          View Symbols ({symbols.filter(s => s.instrument_id === instrument.id).length})
                        </Button>
                      </div>
                    </div>
                  ))}
                  {instruments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No trading instruments available</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Select Symbol */}
              <Card className="p-6 bg-white" id="symbols-section">
                <h3 className="text-lg font-semibold mb-4">Select Symbol</h3>
                <div className="space-y-2">
                  {selectedInstrument ? (
                    filteredSymbols.length > 0 ? (
                      filteredSymbols.map((symbol) => (
                        <div
                          key={symbol.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedSymbol?.id === symbol.id 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => handleSymbolSelect(symbol)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{symbol.symbol}</div>
                              <div className={`text-sm ${
                                selectedSymbol?.id === symbol.id ? 'text-green-100' : 'text-gray-500'
                              }`}>
                                {symbol.name}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(symbol.current_price || 0)}</div>
                              <div className="text-xs text-green-600">+1.2%</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>No assets available</p>
                        <p className="text-xs">for this instrument</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No assets available</p>
                      <p className="text-xs">Select an instrument first</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Trading Chart */}
              <Card className="p-6 bg-white">
                <h3 className="text-lg font-semibold mb-4">Trading Chart</h3>
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
          <TabsContent value="copy-trade" className="mt-6">
            {/* Mobile Section Header */}
            <div className="md:hidden mb-6">
              <h2 className="text-xl font-bold text-gray-900">Expert Trader</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {traders.map((trader) => (
                <TraderCard 
                  key={trader.id} 
                  trader={trader} 
                  onCopyTrade={handleCopyTrade}
                />
              ))}
              {traders.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No expert traders available</p>
                  <p className="text-sm mt-1">Check back later for trading experts</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Open Positions Tab */}
          <TabsContent value="open-positions" className="mt-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Open Positions ({positions.length})</h2>
              <p className="text-sm text-gray-500">Monitor and manage your active trading positions</p>
            </div>

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
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Positions</h3>
                  <p className="text-gray-500">No open positions</p>
                </div>
              </div>
            )}
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
    </div>
  );
}
