
import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Edit, Trash2, Plus, Upload, Image, Search } from 'lucide-react';
import { ExpertTrader } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import FeedbackModal from './FeedbackModal';

const tradingSymbols = [
    "BTC/USD", "ETH/USD", "XRP/USD", "LTC/USD", "BCH/USD",
    "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD",
    "XAU/USD (Gold)", "XAG/USD (Silver)", "WTI/USD (Oil)",
    "AAPL", "GOOGL", "MSFT", "AMZN", "TSLA"
];

export default function CopyTradeManagementModal({ isOpen, onClose }) {
  const [traders, setTraders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState({ isOpen: false, type: '', title: '', message: '' });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, traderId: null, traderName: '' });
  const fileInputRefs = useRef({});

  useEffect(() => {
    if (isOpen) {
      loadTraders();
    }
  }, [isOpen]);

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const loadTraders = async () => {
    setIsLoading(true);
    try {
      const data = await ExpertTrader.list();
      setTraders(data.map(t => ({...t, recent_trades: t.recent_trades || Array(3).fill({ action: 'BUY', symbol: '', profit_loss: '' }) })));
    } catch (error) {
      console.error("Failed to load expert traders:", error);
      showFeedback('error', 'Loading Error', 'Failed to load expert traders.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (traderId, field, value) => {
    setTraders(prevTraders =>
      prevTraders.map(t => (t.id === traderId ? { ...t, [field]: value } : t))
    );
  };

  const handleTradeChange = (traderId, tradeIndex, field, value) => {
    setTraders(prevTraders =>
      prevTraders.map(t => {
        if (t.id === traderId) {
          const updatedTrades = [...t.recent_trades];
          updatedTrades[tradeIndex] = { ...updatedTrades[tradeIndex], [field]: value };
          return { ...t, recent_trades: updatedTrades };
        }
        return t;
      })
    );
  };
  
  const handleSaveTrader = async (trader) => {
    try {
        // Create a clean payload with only the fields defined in the entity schema
        const cleanPayload = {
            name: trader.name,
            avatar_url: trader.avatar_url,
            avatar_initials: trader.avatar_initials, // Assuming this field exists on the trader object if needed
            specialties: trader.specialties,
            win_rate: trader.win_rate,
            avg_return: trader.avg_return,
            trades_count: trader.trades_count,
            followers: trader.followers,
            bio: trader.bio,
            recent_trades: trader.recent_trades?.filter(t => t.symbol && t.profit_loss) || [],
            force_loss_for_copiers: trader.force_loss_for_copiers || false
        };

        if(trader.isNew) {
            await ExpertTrader.create(cleanPayload);
        } else {
            await ExpertTrader.update(trader.id, cleanPayload);
        }
        
        showFeedback('success', 'Success!', 'Trader saved successfully!');
        loadTraders();
    } catch (error) {
        console.error("Failed to save trader:", error);
        showFeedback('error', 'Save Error', `Failed to save trader: ${error.message || 'Please check permissions.'}`);
    }
  };

  const handleAvatarUpload = async (file, traderId) => {
    if (!file) return;
    try {
      const { file_url } = await UploadFile({ file });
      handleFieldChange(traderId, 'avatar_url', file_url);
    } catch (error) {
      console.error("Avatar upload failed:", error);
      showFeedback('error', 'Upload Failed', 'Failed to upload avatar.');
    }
  };

  const handleRemoveImage = (traderId) => {
    handleFieldChange(traderId, 'avatar_url', null);
  };
  
  const handleDeleteTrader = async (traderId) => {
    try {
      await ExpertTrader.delete(traderId);
      showFeedback('success', 'Success!', 'Trader deleted successfully!');
      setDeleteConfirmation({ isOpen: false, traderId: null, traderName: '' }); // Close confirmation dialog
      loadTraders();
    } catch(error) {
      console.error("Failed to delete trader:", error);
      showFeedback('error', 'Delete Error', 'Failed to delete trader.');
    }
  };

  const confirmDelete = (trader) => {
    setDeleteConfirmation({ 
      isOpen: true, 
      traderId: trader.id, 
      traderName: trader.name 
    });
  };

  const addNewTrader = () => {
    const newTrader = { 
      id: `new-${Date.now()}`, // Temporary client-side ID
      isNew: true,
      name: '', 
      specialties: '', 
      win_rate: 0, 
      avg_return: '', 
      trades_count: 0, 
      followers: 0, 
      bio: '', 
      force_loss_for_copiers: false, 
      recent_trades: Array(3).fill({ action: 'BUY', symbol: '', profit_loss: '' })
    };
    setTraders(prev => [newTrader, ...prev]);
  };

  const filteredTraders = traders.filter(trader => 
    trader.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-lg md:text-xl font-bold">Copy/Expert Trade Management</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
            <Button onClick={addNewTrader} className="order-2 sm:order-1">
              <Plus className="w-4 h-4 mr-2"/> Add New Trader
            </Button>
            {/* Smaller search bar on mobile */}
            <div className="relative w-full sm:w-64 order-1 sm:order-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                    placeholder="Search traders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 mt-4">
          {isLoading ? <p>Loading traders...</p> : (
            <div className="space-y-6">
              {filteredTraders.map((trader, index) => (
                <div key={trader.id} className="p-4 border rounded-lg space-y-4 bg-white">
                  {/* Basic Info - Mobile responsive grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <Label htmlFor={`name-${trader.id}`} className="text-sm">Name</Label>
                        <Input 
                          id={`name-${trader.id}`} 
                          placeholder="Name" 
                          value={trader.name} 
                          onChange={(e) => handleFieldChange(trader.id, 'name', e.target.value)}
                          className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor={`specialties-${trader.id}`} className="text-sm">Specialties</Label>
                        <Input 
                          id={`specialties-${trader.id}`} 
                          placeholder="Specialties" 
                          value={trader.specialties} 
                          onChange={(e) => handleFieldChange(trader.id, 'specialties', e.target.value)}
                          className="mt-1"
                        />
                    </div>
                     <div>
                        <Label htmlFor={`win_rate-${trader.id}`} className="text-sm">Win Rate (%)</Label>
                        <Input 
                          id={`win_rate-${trader.id}`} 
                          type="number" 
                          placeholder="Win Rate (%)" 
                          value={trader.win_rate} 
                          onChange={(e) => handleFieldChange(trader.id, 'win_rate', parseFloat(e.target.value))}
                          className="mt-1"
                        />
                    </div>
                     <div>
                        <Label htmlFor={`avg_return-${trader.id}`} className="text-sm">Avg. Return (%)</Label>
                        <Input 
                          id={`avg_return-${trader.id}`} 
                          placeholder="Avg. Return (%)" 
                          value={trader.avg_return} 
                          onChange={(e) => handleFieldChange(trader.id, 'avg_return', e.target.value)}
                          className="mt-1"
                        />
                    </div>
                  </div>

                  {/* Second row - Mobile responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div>
                        <Label htmlFor={`trades_count-${trader.id}`} className="text-sm">Trades</Label>
                        <Input 
                          id={`trades_count-${trader.id}`} 
                          type="number" 
                          placeholder="Trades" 
                          value={trader.trades_count} 
                          onChange={(e) => handleFieldChange(trader.id, 'trades_count', parseInt(e.target.value))}
                          className="mt-1"
                        />
                    </div>
                     <div>
                        <Label htmlFor={`followers-${trader.id}`} className="text-sm">Followers</Label>
                        <Input 
                          id={`followers-${trader.id}`} 
                          type="number" 
                          placeholder="Followers" 
                          value={trader.followers} 
                          onChange={(e) => handleFieldChange(trader.id, 'followers', parseInt(e.target.value))}
                          className="mt-1"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <Label htmlFor={`bio-${trader.id}`} className="text-sm">Bio</Label>
                        <Input 
                          id={`bio-${trader.id}`} 
                          placeholder="Bio" 
                          value={trader.bio} 
                          onChange={(e) => handleFieldChange(trader.id, 'bio', e.target.value)}
                          className="mt-1"
                        />
                    </div>
                  </div>

                  {/* Profile Image Section */}
                  <div>
                    <Label className="text-sm">Profile Image</Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
                        {trader.avatar_url ? (
                            <img src={trader.avatar_url} alt={trader.name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                <Image className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" onClick={() => fileInputRefs.current[trader.id]?.click()}>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload
                          </Button>
                          {trader.avatar_url && (
                            <Button variant="destructive" size="sm" onClick={() => handleRemoveImage(trader.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Remove
                            </Button>
                          )}
                        </div>
                        <Input 
                          type="file" 
                          className="hidden" 
                          ref={el => fileInputRefs.current[trader.id] = el} 
                          onChange={(e) => handleAvatarUpload(e.target.files[0], trader.id)} 
                          accept="image/*" 
                        />
                    </div>
                  </div>

                  {/* Recent Trades Section */}
                  <div>
                      <Label className="text-sm">Recent Trades</Label>
                      <div className="space-y-2 mt-2">
                        {trader.recent_trades.map((trade, tradeIdx) => (
                           <div key={tradeIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                               <div className="sm:col-span-5">
                                   <Select value={trade.symbol} onValueChange={(value) => handleTradeChange(trader.id, tradeIdx, 'symbol', value)}>
                                      <SelectTrigger><SelectValue placeholder="Select Symbol" /></SelectTrigger>
                                      <SelectContent>
                                        {tradingSymbols.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                      </SelectContent>
                                   </Select>
                               </div>
                                <div className="sm:col-span-4">
                                   <Input 
                                     placeholder="P/L (e.g. +12.5%)" 
                                     value={trade.profit_loss} 
                                     onChange={(e) => handleTradeChange(trader.id, tradeIdx, 'profit_loss', e.target.value)} 
                                   />
                               </div>
                               <div className="sm:col-span-3">
                                    <Select value={trade.action} onValueChange={(value) => handleTradeChange(trader.id, tradeIdx, 'action', value)}>
                                       <SelectTrigger><SelectValue/></SelectTrigger>
                                       <SelectContent>
                                           <SelectItem value="BUY">BUY</SelectItem>
                                           <SelectItem value="SELL">SELL</SelectItem>
                                       </SelectContent>
                                   </Select>
                               </div>
                           </div>
                        ))}
                      </div>
                  </div>

                  {/* Actions Section */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id={`force-loss-${trader.id}`} 
                        checked={trader.force_loss_for_copiers} 
                        onCheckedChange={(checked) => handleFieldChange(trader.id, 'force_loss_for_copiers', checked)}
                      />
                      <Label htmlFor={`force-loss-${trader.id}`} className="text-sm">Force Loss for Copiers</Label>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={() => handleSaveTrader(trader)} className="flex-1 sm:flex-none">Save</Button>
                        {!trader.isNew && (
                          <Button 
                            variant="destructive" 
                            onClick={() => confirmDelete(trader)}
                            className="flex-1 sm:flex-none"
                          >
                            Delete
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Removed DialogFooter and DialogClose */}
      </DialogContent>
    </Dialog>
    
    <FeedbackModal
        isOpen={feedback.isOpen}
        onClose={() => setFeedback({ ...feedback, isOpen: false })}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
      />
      
      {/* DialogFooter has been imported locally here, not globally from shadcn/ui/dialog */}
      <Dialog open={deleteConfirmation.isOpen} onOpenChange={() => setDeleteConfirmation({ isOpen: false, traderId: null, traderName: '' })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deleteConfirmation.traderName}"? This action cannot be undone.</p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4"> {/* Using a div for DialogFooter content */}
            <Button variant="outline" onClick={() => setDeleteConfirmation({ isOpen: false, traderId: null, traderName: '' })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteTrader(deleteConfirmation.traderId)}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
