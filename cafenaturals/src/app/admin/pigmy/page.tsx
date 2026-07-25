'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { ArrowLeft, Plus, Wallet, TrendingUp, Users, Calendar, ChevronRight, History } from 'lucide-react';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';
import { ViraTechWatermark } from '@/components/ViraTechWatermark';
import { Modal } from '@/components/Modal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function PigmyDashboard() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await db.getPigmyAccounts();
      setAccounts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim() || busy) return;
    setBusy(true);
    try {
      await db.createPigmyAccount(newAccountName.trim());
      setNewAccountName('');
      setShowAddModal(false);
      await loadAccounts();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);
  const todayDeposits = accounts.reduce((acc, curr) => acc + (curr.todayDeposit || 0), 0);
  const activeCount = accounts.length;

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-8">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#FFFDF9] via-[#FFFDF9] to-[#E8D9C5] border-b border-[#E6D8C8] sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-1.5 hover:bg-[#E8D9C5]/50 rounded-full text-[#3E3023] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#8B6B4A] bg-[#FFFDF9] p-0.5">
                <Image src="/cafe_logo_new.png" alt="Logo" width={32} height={32} className="object-cover h-full w-full rounded-full" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-bold leading-none tracking-wide text-[#3E3023]">Pigmy Savings</h1>
                <p className="text-[9px] uppercase tracking-widest text-[#6D5B4A] font-sans mt-0.5">Daily Deposit Tracker</p>
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

        {/* ACCOUNTS LIST */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#3E3023] flex items-center gap-2">
            <History className="h-4 w-4 text-[#8B6B4A]" /> Account Ledgers
          </h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#8B6B4A] hover:bg-[#6D5B4A] text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> New Account
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-2xl border border-border"></div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 bg-[#FFFDF9] border border-dashed border-[#E6D8C8] rounded-2xl shadow-sm">
            <Wallet className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#3E3023] uppercase tracking-wide">No Pigmy Accounts</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Create an account to start tracking daily savings.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 bg-[#8B6B4A] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create Account
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {accounts.map(acc => (
              <div 
                key={acc.id}
                onClick={() => router.push(`/admin/pigmy/${acc.id}`)}
                className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between group"
              >
                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                  <div className="h-12 w-12 rounded-full bg-[#E8D9C5]/50 flex items-center justify-center border border-[#E6D8C8]">
                    <span className="font-serif font-bold text-lg text-[#8B6B4A] uppercase">{acc.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-[#3E3023] text-lg">{acc.name}</h3>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-sans mt-0.5">
                      Last Deposit: {acc.lastDepositAt ? new Date(acc.lastDepositAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Never'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-[#E6D8C8] sm:border-0 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#6D5B4A]">Current Balance</p>
                    <p className="font-mono font-bold text-lg text-[#3E3023]">₹{(acc.currentBalance || 0).toLocaleString()}</p>
                  </div>
                  <div className="hidden sm:block text-right border-l border-[#E6D8C8] pl-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#6D5B4A]">Today's Deposit</p>
                    <p className="font-mono font-bold text-lg text-green-600">₹{(acc.todayDeposit || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-full p-2 group-hover:bg-[#E8D9C5] transition-colors text-[#8B6B4A]">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal isOpen={showAddModal} onClose={() => !busy && setShowAddModal(false)} title="New Pigmy Account" type="custom">
        <form onSubmit={handleAddAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Person / Account Name</label>
            <input
              type="text"
              required
              value={newAccountName}
              onChange={e => setNewAccountName(e.target.value)}
              placeholder="e.g. Rahul"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#8B6B4A]"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !newAccountName.trim()}
            className="w-full py-2.5 bg-[#8B6B4A] hover:bg-[#6D5B4A] text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            {busy ? 'Creating...' : 'Create Account'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
