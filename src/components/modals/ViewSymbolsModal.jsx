import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/lib/supabase';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export default function ViewSymbolsModal({ isOpen, onClose, instrument, onAddSymbol, onEditSymbol, onDeleteSymbol }) {
  const [symbols, setSymbols] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [symbolToDelete, setSymbolToDelete] = useState(null);

  useEffect(() => {
    if (isOpen && instrument) {
      loadSymbols();
    }
  }, [isOpen, instrument]);

  const loadSymbols = async () => {
    if (!instrument) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('trading_symbols')
        .select('*')
        .eq('instrument_id', instrument.id)
        .order('symbol', { ascending: true });

      if (error) {
        console.error('Error loading symbols:', error);
        throw error;
      }

      setSymbols(data || []);
    } catch (error) {
      console.error('Failed to load symbols:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSymbol = () => {
    onAddSymbol(instrument);
    onClose();
  };

  const handleEditSymbol = (symbol) => {
    onEditSymbol(instrument, symbol);
    onClose();
  };

  const handleDeleteSymbol = (symbol) => {
    setSymbolToDelete(symbol);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSymbol = async () => {
    if (!symbolToDelete) return;
    
    try {
      const { error } = await supabase
        .from('trading_symbols')
        .delete()
        .eq('id', symbolToDelete.id);

      if (error) {
        console.error('Error deleting symbol:', error);
        throw error;
      }

      // Reload symbols
      loadSymbols();
      setIsDeleteModalOpen(false);
      setSymbolToDelete(null);
    } catch (error) {
      console.error('Failed to delete symbol:', error);
      setIsDeleteModalOpen(false);
      setSymbolToDelete(null);
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case 'force_profit':
        return 'bg-green-100 text-green-800';
      case 'force_loss':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (!instrument) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Trading Symbols: {instrument.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header with Add Symbol button */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {symbols.length === 0 ? 'No symbols found' : `${symbols.length} symbol(s) found`}
            </div>
            <Button onClick={handleAddSymbol} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Symbol
            </Button>
          </div>

          {/* Symbols Grid */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading symbols...</p>
            </div>
          ) : symbols.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Trading Symbols Found</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first trading symbol for this instrument.</p>
              <Button onClick={handleAddSymbol} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create First Symbol
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {symbols.map((symbol) => (
                <Card key={symbol.id} className="bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold">{symbol.symbol}</CardTitle>
                        <p className="text-sm text-gray-600">{symbol.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(symbol.is_active)}>
                          {symbol.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge className={getOutcomeColor(symbol.admin_controlled_outcome)}>
                          {symbol.admin_controlled_outcome === 'auto' ? 'Auto' : 
                           symbol.admin_controlled_outcome === 'force_profit' ? 'Force Profit' : 'Force Loss'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Current Price</p>
                        <p className="font-semibold">${symbol.current_price?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Profit %</p>
                        <p className="font-semibold text-green-600">{symbol.profit_percentage}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Loss %</p>
                        <p className="font-semibold text-red-600">{symbol.loss_percentage}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Volatility</p>
                        <p className="font-semibold">{symbol.price_volatility}%</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditSymbol(symbol)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteSymbol(symbol)}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSymbolToDelete(null);
        }}
        onConfirm={confirmDeleteSymbol}
        title="Delete Symbol"
        description={`Are you sure you want to delete the symbol "${symbolToDelete?.symbol}"? This action cannot be undone.`}
      />
    </Dialog>
  );
}