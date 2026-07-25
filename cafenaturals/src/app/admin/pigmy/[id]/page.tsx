'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ArrowLeft, Plus, Edit2, Trash2, ArrowUpRight, ArrowDownRight, RefreshCcw, Landmark, Receipt, Calendar, User, Settings } from 'lucide-react';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';
import { ViraTechWatermark } from '@/components/ViraTechWatermark';
import { Modal } from '@/components/Modal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function PigmyLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: accountId } = use(params);
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  
  const [showTxModal, setShowTxModal] = useState(false);
  const [txMode, setTxMode] = useState<'add' | 'edit'>('add');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  
  // Transaction Form State
  const [txType, setTxType] = useState<'deposit' | 'withdrawal' | 'adjustment' | 'opening_balance'>('deposit');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [txNotes, setTxNotes] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Account Settings State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editAccountName, setEditAccountName] = useState('');
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false);

  useEffect(() => {
    loadLedger();
  }, [accountId]);

  const loadLedger = async () => {
    try {
      const result = await db.getPigmyAccountDetails(accountId);
      setData(result);
    } catch (e) {
      console.error(e);
      router.push('/admin/pigmy');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTxType('deposit');
    setTxAmount('');
    setTxDate(new Date().toISOString().slice(0, 10));
    setTxNotes('');
    setEditingTxId(null);
  };

  const openAddModal = () => {
    resetForm();
    setTxMode('add');
    setShowTxModal(true);
  };

  const openEditModal = (tx: any) => {
    setTxMode('edit');
    setEditingTxId(tx.id);
    setTxType(tx.type);
    setTxAmount(tx.amount);
    setTxDate(new Date(tx.date).toISOString().slice(0, 10));
    setTxNotes(tx.notes || '');
    setShowTxModal(true);
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || Number(txAmount) <= 0 || busy) return;
    setBusy(true);
    try {
      const payload = {
        accountId,
        type: txType,
        amount: Number(txAmount),
        date: new Date(txDate).toISOString(),
        notes: txNotes
      };
      
      if (txMode === 'add') {
        await db.addPigmyTransaction(payload);
      } else if (txMode === 'edit' && editingTxId) {
        await db.updatePigmyTransaction(editingTxId, payload);
      }
      
      setShowTxModal(false);
      resetForm();
      await loadLedger();
    } catch (e: any) {
      alert(e.message || 'Error saving transaction');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId || busy) return;
    setBusy(true);
    try {
      await db.deletePigmyTransaction(deleteConfirmId);
      setDeleteConfirmId(null);
      await loadLedger();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const openAccountSettings = () => {
    setEditAccountName(data?.account?.name || '');
    setDeleteAccountConfirm(false);
    setShowAccountModal(true);
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccountName.trim() || busy) return;
    setBusy(true);
    try {
      await db.updatePigmyAccount(accountId, editAccountName.trim());
      setShowAccountModal(false);
      await loadLedger();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await db.archivePigmyAccount(accountId);
      router.push('/admin/pigmy');
    } catch (e) {
      console.error(e);
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading ledger...</div>;
  }

  const { account, ledger } = data;

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-8">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#FFFDF9] via-[#FFFDF9] to-[#E8D9C5] border-b border-[#E6D8C8] sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/pigmy" className="p-1.5 hover:bg-[#E8D9C5]/50 rounded-full text-[#3E3023] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-[#8B6B4A] text-white flex items-center justify-center font-serif font-bold">
                {account.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-xl font-bold leading-none tracking-wide text-[#3E3023]">{account.name}</h1>
                  <button onClick={openAccountSettings} className="p-1 text-[#8B6B4A]/60 hover:text-[#8B6B4A] hover:bg-[#E8D9C5]/30 rounded-md transition-colors cursor-pointer" title="Account Settings">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[9px] uppercase tracking-widest text-[#6D5B4A] font-sans mt-0.5">Account Ledger</p>
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 border-l border-[#E6D8C8] pl-3 text-[#3E3023]">
            <DateTimeDisplay />
            <ViraTechWatermark />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        
        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-2xl p-4 shadow-sm flex flex-col justify-between h-24">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#6D5B4A]">Total Gone to Pigmy</span>
              <span className="p-1.5 rounded-lg bg-[#E8D9C5]/50 text-[#8B6B4A]"><Landmark className="h-4 w-4" /></span>
            </div>
            <p className="text-2xl font-bold text-[#3E3023] font-serif">₹{account.totalDeposits.toLocaleString()}</p>
          </div>

          <div className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-2xl p-4 shadow-sm flex flex-col justify-between h-24">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#6D5B4A]">Total Taken Back</span>
              <span className="p-1.5 rounded-lg bg-red-50 text-red-600"><ArrowUpRight className="h-4 w-4" /></span>
            </div>
            <p className="text-2xl font-bold text-[#3E3023] font-serif">₹{account.totalWithdrawals.toLocaleString()}</p>
          </div>

          <div className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-2xl p-4 shadow-sm flex flex-col justify-between h-24">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#6D5B4A]">Net Balance</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><ArrowUpRight className="h-4 w-4" /></span>
            </div>
            <p className="text-2xl font-bold text-[#3E3023] font-serif">₹{account.currentBalance.toLocaleString()}</p>
          </div>

          <div className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-2xl p-4 shadow-sm flex flex-col justify-between h-24">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#6D5B4A]">Transactions</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><Receipt className="h-4 w-4" /></span>
            </div>
            <p className="text-2xl font-bold text-[#3E3023] font-serif">{account.transactionCount}</p>
          </div>
        </div>

        {/* LEDGER HEADER */}
        <div className="flex items-center justify-between mt-8 mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#3E3023] flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#8B6B4A]" /> Transaction History
          </h2>
          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-[#8B6B4A] hover:bg-[#6D5B4A] text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Add Transaction
          </button>
        </div>

        {/* LEDGER TABLE */}
        <div className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead className="bg-[#F9F6F0] border-b border-[#E6D8C8]">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#6D5B4A]">Date</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#6D5B4A]">Type</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#6D5B4A]">Amount</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[#6D5B4A]">Balance</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#6D5B4A]">Notes</th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-widest text-[#6D5B4A]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6D8C8]">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-xs">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  ledger.map((tx: any) => {
                    const isDeposit = tx.type === 'deposit' || tx.type === 'opening_balance' || tx.type === 'adjustment';
                    return (
                      <tr key={tx.id} className="hover:bg-[#F9F6F0]/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-[#3E3023]">
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            tx.type === 'deposit' ? 'bg-red-100 text-red-700' :
                            tx.type === 'withdrawal' ? 'bg-green-100 text-green-700' :
                            tx.type === 'adjustment' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {tx.type === 'deposit' ? 'PIGMY' : tx.type === 'withdrawal' ? 'RETURNED' : tx.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${tx.type === 'deposit' ? 'text-red-600' : 'text-green-600'}`}>
                          {tx.type === 'deposit' ? '-' : '+'}₹{tx.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[#3E3023]">
                          ₹{tx.runningBalance.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#6D5B4A] max-w-[200px] truncate" title={tx.notes}>
                          {tx.notes || '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openEditModal(tx)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDeleteConfirmId(tx.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* ADD/EDIT MODAL */}
      <Modal isOpen={showTxModal} onClose={() => !busy && setShowTxModal(false)} title={txMode === 'add' ? 'Add Transaction' : 'Edit Transaction'} type="custom">
        <form onSubmit={handleTxSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Type</label>
              <select 
                value={txType} 
                onChange={e => setTxType(e.target.value as any)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B6B4A]"
              >
                <option value="deposit">Given to Pigmy (Deposit)</option>
                <option value="withdrawal">Taken Back (Withdrawal)</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Date</label>
              <input 
                type="date" 
                required
                value={txDate} 
                onChange={e => setTxDate(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B6B4A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Amount (₹)</label>
            <input 
              type="number" 
              required
              min="1"
              value={txAmount} 
              onChange={e => setTxAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="0"
              className="w-full px-3 py-2 font-mono bg-background border border-border rounded-lg text-lg focus:outline-none focus:ring-1 focus:ring-[#8B6B4A]"
            />
            {/* Quick amounts */}
            <div className="flex gap-2 mt-2">
              {[100, 200, 500, 1000].map(amt => (
                <button 
                  key={amt} 
                  type="button" 
                  onClick={() => setTxAmount(amt)}
                  className="px-2 py-1 bg-muted/50 hover:bg-muted text-xs font-mono rounded border border-border transition-colors cursor-pointer"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Notes (Optional)</label>
            <input 
              type="text" 
              value={txNotes} 
              onChange={e => setTxNotes(e.target.value)}
              placeholder="e.g. Daily Pigmy"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B6B4A]"
            />
          </div>

          <button
            type="submit"
            disabled={busy || !txAmount}
            className={`w-full py-3 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-sm ${
              txType === 'deposit' ? 'bg-green-600 hover:bg-green-700' :
              txType === 'withdrawal' ? 'bg-red-600 hover:bg-red-700' :
              'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {busy ? 'Saving...' : 'Save Transaction'}
          </button>
        </form>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => !busy && setDeleteConfirmId(null)} title="Delete Transaction" type="custom">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 flex items-start gap-3">
            <Trash2 className="h-5 w-5 shrink-0" />
            <p><strong>Are you sure?</strong><br/>Deleting this transaction will instantly recalculate all subsequent running balances for this account.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              disabled={busy}
              className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
            >
              {busy ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ACCOUNT SETTINGS MODAL */}
      <Modal isOpen={showAccountModal} onClose={() => !busy && setShowAccountModal(false)} title="Account Settings" type="custom">
        {!deleteAccountConfirm ? (
          <div className="space-y-6">
            <form onSubmit={handleUpdateAccount} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Person / Account Name</label>
                <input 
                  type="text" 
                  required
                  value={editAccountName} 
                  onChange={e => setEditAccountName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B6B4A]"
                />
              </div>
              <button
                type="submit"
                disabled={busy || !editAccountName.trim() || editAccountName === account.name}
                className="w-full py-2.5 bg-[#8B6B4A] hover:bg-[#6D5B4A] text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {busy ? 'Saving...' : 'Update Name'}
              </button>
            </form>

            <div className="pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setDeleteAccountConfirm(true)}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold uppercase tracking-wider text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Delete Account
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100 flex items-start gap-3">
              <Trash2 className="h-5 w-5 shrink-0" />
              <p><strong>Delete {account.name}?</strong><br/>This will archive the account and remove it from the dashboard. This action cannot be undone.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteAccountConfirm(false)}
                disabled={busy}
                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={busy}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                {busy ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
