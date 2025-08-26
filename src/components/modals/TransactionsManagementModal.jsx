
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogClose,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Transaction } from '@/api/entities';
import { Plus, Trash2, Edit, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge"; // Import Badge

export default function TransactionsManagementModal({ isOpen, onClose }) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await Transaction.list('-created_date');
      setTransactions(data);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setCurrentTransaction({ type: 'deposit', status: 'completed', amount: 0, description: '', created_by: '' });
    setIsEditing(true);
  };

  const handleEdit = (transaction) => {
    setCurrentTransaction(transaction);
    setIsEditing(true);
  };

  const handleDelete = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await Transaction.delete(transactionId);
        loadTransactions();
      } catch (error) {
        console.error('Failed to delete transaction:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (currentTransaction.id) {
        const { id, ...data } = currentTransaction;
        await Transaction.update(id, data);
      } else {
        await Transaction.create(currentTransaction);
      }
      setIsEditing(false);
      setCurrentTransaction(null);
      loadTransactions();
    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert('Error saving transaction.');
    }
  };

  const handleFieldChange = (field, value) => {
    setCurrentTransaction(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  if (isEditing) {
    return (
      <Dialog open={isEditing} onOpenChange={() => setIsEditing(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentTransaction?.id ? 'Edit' : 'Add'} Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>User Email (created_by)</Label>
              <Input value={currentTransaction.created_by} onChange={(e) => handleFieldChange('created_by', e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={currentTransaction.type} onValueChange={(val) => handleFieldChange('type', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                    <SelectItem value="profit">Profit</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={currentTransaction.status} onValueChange={(val) => handleFieldChange('status', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                     <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Amount ($)</Label>
              <Input type="number" value={currentTransaction.amount} onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={currentTransaction.description} onChange={(e) => handleFieldChange('description', e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Transaction</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Transactions Management</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end my-4">
          <Button onClick={handleAddNew}><Plus className="w-4 h-4 mr-2" /> Add New</Button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Desktop Table View */}
          <table className="w-full text-sm hidden md:table">
            <thead className="text-left bg-gray-50">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">User</th>
                <th className="p-2">Type</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="6" className="text-center p-4">Loading...</td></tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="border-b">
                    <td className="p-2">{formatDate(tx.created_date)}</td>
                    <td className="p-2 truncate max-w-xs">{tx.created_by}</td>
                    <td className="p-2 capitalize">{tx.type}</td>
                    <td className="p-2">${tx.amount?.toLocaleString()}</td>
                    <td className="p-2"><Badge variant="outline" className="capitalize">{tx.status}</Badge></td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(tx)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(tx.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {isLoading ? (
              <p className="text-center p-4">Loading...</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold capitalize">{tx.type} - ${tx.amount?.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{formatDate(tx.created_date)}</div>
                    </div>
                    <Badge variant="outline" className="capitalize">{tx.status}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    <span className="font-medium">User:</span> {tx.created_by}
                  </div>
                   <div className="flex justify-end gap-2 pt-2 border-t">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(tx)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(tx.id)} className="text-red-500"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
                    </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
