import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Trash2, Search } from 'lucide-react';
import { Transaction } from '@/api/entities';

export default function DeleteHistoryModal({ isOpen, onClose, user, onSuccess }) {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.email) {
      loadTransactions();
    }
  }, [isOpen, user]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await Transaction.filter({ user_email: user.email }, '-created_date');
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to permanently delete this transaction?')) {
      try {
        await Transaction.delete(transactionId);
        alert('Transaction deleted successfully!');
        loadTransactions(); // Refresh the list
        onSuccess(); // Refresh the main user list
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.amount.toString().includes(searchTerm) ||
    tx.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-600" />
            <DialogTitle className="text-xl font-bold">Delete Trading History - {user?.full_name}</DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6"><X className="h-4 w-4" /></Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="my-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search by type, amount, status..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
          {isLoading && <p>Loading transactions...</p>}
          {!isLoading && filteredTransactions.length === 0 && <p>No transactions found.</p>}
          {filteredTransactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-semibold">{tx.type.toUpperCase()}</span> - 
                <span className="text-green-600 font-medium"> ${tx.amount}</span> - 
                <span className="text-gray-500 text-sm"> {tx.status}</span>
                <p className="text-xs text-gray-400">{new Date(tx.created_date).toLocaleString()}</p>
              </div>
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => handleDelete(tx.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}