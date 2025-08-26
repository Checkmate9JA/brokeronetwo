import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';

export default function ViewSymbolsModal({ isOpen, onClose, instrument, symbols, onSelectSymbol }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{instrument?.icon}</span>
            <DialogTitle className="text-xl">
              {instrument?.name} Symbols ({symbols?.length || 0})
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2">
          {symbols && symbols.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {symbols.map((symbol) => (
                <Card key={symbol.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{symbol.symbol}</h4>
                      <p className="text-sm text-gray-500">{symbol.name}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">{formatCurrency(symbol.current_price || 0)}</div>
                      <div className="text-xs text-green-600">+1.2%</div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => onSelectSymbol(symbol)}
                  >
                    Select Symbol
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Symbols Available</h3>
              <p>This instrument doesn't have any trading symbols yet.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}