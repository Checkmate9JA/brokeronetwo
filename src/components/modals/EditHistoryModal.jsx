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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Edit } from 'lucide-react';
import { Transaction } from '@/api/entities';

export default function EditHistoryModal({ isOpen, onClose, user, onSuccess }) {
  const [transactions, setTransactions] = useState([]);
  const [selectedTxId, setSelectedTxId] = useState('');
  const [currentTx, setCurrentTx] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.email) {
      loadTransactions();
    } else {
      // Reset state when closing
      setTransactions([]);
      setSelectedTxId('');
      setCurrentTx(null);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (selectedTxId) {
      const tx = transactions.find(t => t.id === selectedTxId);
      setCurrentTx(tx ? { ...tx, created_date: tx.created_date.split('T')[0] } : null);
    } else {
      setCurrentTx(null);
    }
  }, [selectedTxId, transactions]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await Transaction.filter({ user_email: user.email }, '-created_date');
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions for user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!currentTx) return;

    setIsSubmitting(true);
    try {
      const { id, created_by, ...updateData } = currentTx;
      await Transaction.update(id, {
        ...updateData,
        amount: parseFloat(updateData.amount)
      });
      alert('Transaction updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setCurrentTx(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            <DialogTitle className="text-xl font-bold">Edit Trading History - {user?.full_name}</DialogTitle>
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="select-tx" className="font-semibold">Select Transaction</Label>
            <Select value={selectedTxId} onValueChange={setSelectedTxId} disabled={isLoading}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select a transaction to edit"} />
              </SelectTrigger>
              <SelectContent>
                {transactions.map(tx => (
                  <SelectItem key={tx.id} value={tx.id}>
                    {new Date(tx.created_date).toLocaleDateString()} - {tx.type.toUpperCase()} - ${tx.amount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentTx && (
            <div className="space-y-4 pt-4 border-t">
               <div>
                  <Label htmlFor="transaction-type" className="font-semibold">Transaction Type</Label>
                  <Select value={currentTx.type} onValueChange={(val) => handleFieldChange('type', val)}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="profit">Profit</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount" className="font-semibold">Amount ($)</Label>
                  <Input id="amount" type="number" value={currentTx.amount} onChange={(e) => handleFieldChange('amount', e.target.value)} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="description" className="font-semibold">Description</Label>
                  <Textarea id="description" value={currentTx.description} onChange={(e) => handleFieldChange('description', e.target.value)} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="date" className="font-semibold">Date</Label>
                  <Input id="date" type="date" value={currentTx.created_date} onChange={(e) => handleFieldChange('created_date', e.target.value)} className="mt-2" />
                </div>

                <div>
                  <Label htmlFor="status" className="font-semibold">Status</Label>
                  <Select value={currentTx.status} onValueChange={(val) => handleFieldChange('status', val)}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                  <Button onClick={handleUpdate} disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {isSubmitting ? 'Updating...' : 'Update Transaction'}
                  </Button>
                </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}