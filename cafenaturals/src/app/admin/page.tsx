'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Coffee, History, Clock, TrendingUp, LogOut, Percent, RefreshCw, Wallet, 
  Settings, Key, ShieldCheck, Trash2, Eye, EyeOff, Smartphone, Monitor, UserCheck, CheckCircle2, X, Lock
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';
import { ViraTechWatermark } from '@/components/ViraTechWatermark';
import { getPasswords, updatePassword, verifyPassword } from '@/lib/passwords';

type TableData = {
  id: string;
  table_number: number;
  status: 'free' | 'occupied';
  activeOrder?: {
    id: string;
    status: string;
    itemsCount: number;
    totalAmount: number;
    created_at: string;
  } | null;
};

export default function TableBoardPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingTable, setOpeningTable] = useState<string | null>(null);
  const [prevTotalItems, setPrevTotalItems] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [todayRevenue, setTodayRevenue] = useState(0);

  // ── Password & Login History Settings Modal ─────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'passwords' | 'history'>('passwords');
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [sessionToForceLogout, setSessionToForceLogout] = useState<{ id: string; device: string } | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Security gate for Login History tab (requires inventory password)
  const [isAuditUnlocked, setIsAuditUnlocked] = useState(false);
  const [auditPasscode, setAuditPasscode] = useState('');
  const [showAuditPasscode, setShowAuditPasscode] = useState(false);
  const [auditPassError, setAuditPassError] = useState('');

  const [staffNew, setStaffNew] = useState('');
  const [staffConfirm, setStaffConfirm] = useState('');
  const [showStaffNew, setShowStaffNew] = useState(false);
  const [staffMsg, setStaffMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [invNew, setInvNew] = useState('');
  const [invConfirm, setInvConfirm] = useState('');
  const [showInvNew, setShowInvNew] = useState(false);
  const [invMsg, setInvMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const fetchLoginLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await db.getLoginSessions();
      setLoginLogs(logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (showSettings && settingsTab === 'history' && isAuditUnlocked) {
      fetchLoginLogs();
    }
  }, [showSettings, settingsTab, isAuditUnlocked]);

  const handleCloseSettings = () => {
    setShowSettings(false);
    setIsAuditUnlocked(false);
    setAuditPasscode('');
    setAuditPassError('');
    setLoginLogs([]);
  };

  const handleForceLogout = async (sessionId: string) => {
    await db.forceLogoutSession(sessionId);
    await fetchLoginLogs();
  };

  const handleClearLogs = async () => {
    await db.clearLoginHistory();
    await fetchLoginLogs();
  };

  const handleChangeStaffPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffNew.trim()) { setStaffMsg({ ok: false, text: 'Password cannot be empty.' }); return; }
    if (staffNew !== staffConfirm) { setStaffMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    if (staffNew.length < 4) { setStaffMsg({ ok: false, text: 'Must be at least 4 characters.' }); return; }
    updatePassword('staff', staffNew);
    setStaffMsg({ ok: true, text: 'Staff password updated successfully!' });
    setStaffNew(''); setStaffConfirm('');
  };

  const handleChangeInvPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invNew.trim()) { setInvMsg({ ok: false, text: 'Password cannot be empty.' }); return; }
    if (invNew !== invConfirm) { setInvMsg({ ok: false, text: 'Passwords do not match.' }); return; }
    if (invNew.length < 4) { setInvMsg({ ok: false, text: 'Must be at least 4 characters.' }); return; }
    updatePassword('inventory', invNew);
    setInvMsg({ ok: true, text: 'Inventory password updated successfully!' });
    setInvNew(''); setInvConfirm('');
  };

  const playOrderSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime);
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.6);
      }, 120);
    } catch (e) {
      console.error('Failed to play audio chime:', e);
    }
  };

  const fetchTables = async () => {
    try {
      await db.sync();
      const todayDate = new Date().toLocaleDateString('en-CA');
      const status = await db.getSystemStatus(todayDate);
      setIsLocked(status.isLocked);
      const data = await db.getTables();
      setTables(data as TableData[]);
      const currentTotal = data.reduce((sum, t) => sum + (t.activeOrder?.itemsCount || 0), 0);
      setPrevTotalItems(prev => {
        if (prev !== null && currentTotal > prev) playOrderSound();
        return currentTotal;
      });
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 8000);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cafe_blossom_new_order_placed') { playOrderSound(); fetchTables(); }
    };
    window.addEventListener('storage', handleStorageChange);
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('cafe_blossom_orders');
      channel.onmessage = () => { playOrderSound(); fetchTables(); };
    } catch { /* fallback to polling */ }
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      channel?.close();
    };
  }, []);

  const handleTableClick = async (table: TableData) => {
    if (openingTable) return;
    if (isLocked) {
      alert("System is Locked. Please Open the Day from Inventory -> Day Close System to take orders.");
      return;
    }
    if (table.activeOrder) {
      router.push(`/tables/${table.id}`);
    } else {
      setOpeningTable(table.id);
      try {
        await db.createOrder(table.id);
        router.push(`/tables/${table.id}`);
      } catch (err) {
        console.error('Error creating order:', err);
        setOpeningTable(null);
      }
    }
  };

  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const freeCount = tables.filter(t => t.status === 'free').length;

  return (
    <div className="min-h-screen bg-[#F9F6F1] flex flex-col">
      {isLocked && (
        <div className="bg-[#B85C4A] text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-wider shadow-md z-50 flex items-center justify-center gap-2">
          <span>⚠️ System Locked.</span>
          <Link href="/inventory" className="underline hover:text-white/80 transition-colors">Open Day →</Link>
        </div>
      )}

      {/* Header — icon-only on mobile, label+icon on sm+ */}
      <header className="bg-gradient-to-r from-[#FFFDF9] via-[#FFFDF9] to-[#E8D9C5] border-b border-[#E6D8C8] text-[#3E3023] sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-5xl px-3 py-2.5 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 min-w-0 hover:opacity-85 transition-opacity cursor-pointer shrink-0">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#8B6B4A] bg-[#FFFDF9] p-0.5 shadow-sm">
              <Image src="/cafe_logo_new.png" alt="Cafe Naturaleza Logo" width={36} height={36} className="object-cover h-full w-full rounded-full" />
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-base sm:text-xl font-bold leading-none tracking-wide text-[#3E3023] truncate">Cafe Naturaleza</h1>
              <p className="text-[8px] uppercase tracking-widest text-[#6D5B4A] font-sans mt-0.5 hidden sm:block">Ishwarpur · Staff Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <Link href="/inventory" title="Profit & Inventory"
              className="flex items-center gap-1 bg-gradient-to-r from-[#E8D9C5] to-[#C8A97E] hover:from-[#C8A97E] hover:to-[#8B6B4A] text-[#3E3023] hover:text-[#FFFDF9] p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold font-sans transition-all shadow-sm">
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Inventory</span>
            </Link>
            <Link href="/admin/pigmy" title="Pigmy Savings"
              className="flex items-center gap-1 bg-gradient-to-r from-[#E8D9C5] to-[#C8A97E] hover:from-[#C8A97E] hover:to-[#8B6B4A] text-[#3E3023] hover:text-[#FFFDF9] p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold font-sans transition-all shadow-sm">
              <Wallet className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Pigmy</span>
            </Link>
            <Link href="/offers" title="Running Offers"
              className="flex items-center gap-1 bg-gradient-to-r from-[#E8D9C5] to-[#C8A97E] hover:from-[#C8A97E] hover:to-[#8B6B4A] text-[#3E3023] hover:text-[#FFFDF9] p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold font-sans transition-all shadow-sm">
              <Percent className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">Offers</span>
            </Link>
            <Link href="/history" title="Bill History"
              className="flex items-center gap-1 bg-gradient-to-r from-[#E8D9C5] to-[#C8A97E] hover:from-[#C8A97E] hover:to-[#8B6B4A] text-[#3E3023] hover:text-[#FFFDF9] p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold font-sans transition-all shadow-sm">
              <History className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">History</span>
            </Link>
            <button onClick={logout} title="Logout"
              className="flex items-center gap-1 bg-gradient-to-r from-[#E8D9C5] to-[#C8A97E] hover:from-[#C8A97E] hover:to-[#8B6B4A] text-[#3E3023] hover:text-[#FFFDF9] p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold font-sans transition-all shadow-sm cursor-pointer">
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">Logout</span>
            </button>
            <button
              onClick={() => { setShowSettings(true); setStaffMsg(null); setInvMsg(null); }}
              className="flex items-center gap-1 bg-gradient-to-r from-[#E8D9C5] to-[#C8A97E] hover:from-[#C8A97E] hover:to-[#8B6B4A] text-[#3E3023] hover:text-[#FFFDF9] p-2 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold font-sans transition-all shadow-sm cursor-pointer"
              title="Admin & Security Settings"
            >
              <Settings className="h-4 w-4 shrink-0" />
            </button>
            <div className="border-l border-[#E6D8C8] pl-2 ml-1 text-[#3E3023] hidden sm:flex items-center gap-2">
              <DateTimeDisplay />
              <ViraTechWatermark />
            </div>
          </div>
        </div>
      </header>

      {/* Quick Stats */}
      <div className="mx-auto max-w-5xl w-full px-3 pt-4 font-sans">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { label: 'Total', value: tables.length, letter: 'T', icon: <Coffee className="h-3 w-3" />, color: '' },
            { label: 'Occupied', value: occupiedCount, letter: 'O', dot: 'bg-[#B85C4A]', color: 'text-[#B85C4A]' },
            { label: 'Free', value: freeCount, letter: 'F', dot: 'bg-[#6B8E5A]', color: 'text-[#6B8E5A]' },
            { label: 'Orders', value: tables.filter(t => t.activeOrder).length, letter: 'A', icon: <Clock className="h-3 w-3" />, color: '' },
          ].map(stat => (
            <div key={stat.label} className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-2xl p-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between h-20 sm:h-24">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#6D5B4A]">{stat.label}</span>
                {stat.dot
                  ? <span className={`h-2.5 w-2.5 rounded-full ${stat.dot} mt-1 ring-4 ${stat.dot}/20 ${stat.label === 'Occupied' ? 'animate-pulse' : ''}`} />
                  : <span className="p-1 rounded-lg bg-[#E8D9C5]/50 text-[#8B6B4A]">{stat.icon}</span>}
              </div>
              <p className="text-2xl font-bold text-[#3E3023] font-serif">{stat.value}</p>
              <div className="absolute -right-3 -bottom-3 text-[#E8D9C5]/20 font-serif font-black text-5xl pointer-events-none select-none">{stat.letter}</div>
            </div>
          ))}
          {/* Today sales — full width on mobile */}
          <div className="bg-gradient-to-br from-[#FFFDF9] to-[#E8D9C5] border border-[#E6D8C8] rounded-2xl p-3.5 shadow-sm relative overflow-hidden flex flex-col justify-between h-20 sm:h-24 col-span-2 sm:col-span-1">
            <div className="flex justify-between items-start">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#6D5B4A]">Today's Sales</span>
              <span className="p-1 rounded-lg bg-[#FFFDF9] text-[#8B6B4A] shadow-sm font-bold text-xs">₹</span>
            </div>
            <div className="flex justify-between items-baseline">
              <p className="text-xl font-bold text-[#3E3023] font-serif">₹{todayRevenue}</p>
              <button onClick={fetchTables} className="text-accent cursor-pointer hover:text-[#8B6B4A]"><RefreshCw className="h-3 w-3" /></button>
            </div>
            <div className="absolute -right-3 -bottom-3 text-[#8B6B4A]/5 font-serif font-black text-5xl pointer-events-none select-none">R</div>
          </div>
        </div>
      </div>

      {/* Table Grid — 3 cols on mobile, 4 on sm+ */}
      <main className="mx-auto max-w-5xl w-full px-3 py-5">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#C8A97E] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-5">
            {tables.map((table) => {
              const isOccupied = table.status === 'occupied';
              const isOpening = openingTable === table.id;
              const isBilled = table.activeOrder?.status === 'billed';
              return (
                <div key={table.id}
                  className={`relative flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-[#E6D8C8] p-3 sm:p-5 text-center bg-[#FFFDF9] shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 ${openingTable && openingTable !== table.id ? 'opacity-50' : ''}`}
                >
                  <button type="button" onClick={() => handleTableClick(table)} disabled={!!openingTable}
                    className="flex flex-col items-center justify-center w-full cursor-pointer disabled:cursor-not-allowed">
                    <div className={`h-11 w-11 sm:h-14 sm:w-14 rounded-full flex items-center justify-center mb-2 sm:mb-3 font-serif font-black text-lg sm:text-xl shadow-inner ${isOccupied ? (isBilled ? 'bg-[#D6A34A]/10 text-[#D6A34A]' : 'bg-[#B85C4A]/10 text-[#B85C4A]') : 'bg-[#6B8E5A]/10 text-[#6B8E5A]'}`}>
                      {table.table_number === 11 ? 'Z' : table.table_number === 12 ? 'P' : table.table_number}
                    </div>
                    <p className="font-serif font-bold text-sm sm:text-base text-[#3E3023] leading-tight">
                      {table.table_number === 11 ? 'Zomato' : table.table_number === 12 ? 'Parcel' : `T${table.table_number}`}
                    </p>
                    {isOpening ? (
                      <p className="text-[10px] text-muted-foreground mt-1 font-sans animate-pulse">Opening…</p>
                    ) : isOccupied && table.activeOrder ? (
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-[10px] font-semibold text-[#8B6B4A] font-sans">{isBilled ? '🧾 Billed' : `${table.activeOrder.itemsCount} item${table.activeOrder.itemsCount !== 1 ? 's' : ''}`}</p>
                        <p className="text-xs font-black text-[#3E3023] font-mono">₹{table.activeOrder.totalAmount}</p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1 font-sans">Tap</p>
                    )}
                  </button>
                  <div className={`absolute top-2.5 right-2.5 h-2 w-2 rounded-full ring-2 ${isOccupied ? (isBilled ? 'bg-[#D6A34A] ring-[#D6A34A]/30' : 'bg-[#B85C4A] ring-[#B85C4A]/30 animate-pulse') : 'bg-[#6B8E5A] ring-[#6B8E5A]/30'}`} />
                </div>
              );
            })}
          </div>
        )}
        <p className="text-center text-xs text-[#6D5B4A] mt-8 font-sans opacity-70">Tap any table to open it and start adding items.</p>
      </main>

      <footer className="w-full text-center py-6 text-xs text-[#6D5B4A] font-sans border-t border-[#E6D8C8] bg-[#FFFDF9]/60 mt-auto">
        <p>© {new Date().getFullYear()} Cafe Naturaleza. All rights reserved.</p>
      </footer>

      {/* ── Settings & Login Security Modal ─────────────────────────────── */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={handleCloseSettings}
        >
          <div
            className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6D8C8] bg-[#F9F6F1]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#E8D9C5] text-[#3E3023]">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-lg text-[#3E3023] leading-tight">Admin &amp; Staff Portal Settings</h2>
                  <p className="text-xs text-[#6D5B4A] font-sans">Security, passcodes, and active sessions tracker</p>
                </div>
              </div>
              <button
                onClick={handleCloseSettings}
                className="p-1.5 rounded-full hover:bg-[#E8D9C5]/50 text-[#6D5B4A] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-[#E6D8C8] bg-[#FFFDF9] px-6 pt-2 gap-2">
              <button
                onClick={() => setSettingsTab('passwords')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-sans font-bold text-xs transition-colors cursor-pointer ${
                  settingsTab === 'passwords'
                    ? 'border-[#8B6B4A] text-[#3E3023]'
                    : 'border-transparent text-[#6D5B4A] hover:text-[#3E3023]'
                }`}
              >
                <Key className="h-4 w-4" />
                <span>Password Management</span>
              </button>
              <button
                onClick={() => setSettingsTab('history')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-sans font-bold text-xs transition-colors cursor-pointer ${
                  settingsTab === 'history'
                    ? 'border-[#8B6B4A] text-[#3E3023]'
                    : 'border-transparent text-[#6D5B4A] hover:text-[#3E3023]'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Login History &amp; Devices</span>
                {loginLogs.filter(l => l.status === 'active').length > 0 && (
                  <span className="ml-1 bg-green-100 text-green-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-green-300">
                    {loginLogs.filter(l => l.status === 'active').length} Active
                  </span>
                )}
              </button>
            </div>

            {/* Modal Tab Contents */}
            <div className="p-6 overflow-y-auto space-y-6">
              {settingsTab === 'passwords' ? (
                <div className="space-y-6">
                  {/* Staff Password */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-sans font-bold text-sm text-[#3E3023]">Staff Portal Password</h3>
                      <p className="text-xs text-[#6D5B4A] mt-0.5">Used to log in to /admin, /tables, /history.</p>
                    </div>
                    <form onSubmit={handleChangeStaffPass} className="space-y-2.5">
                      <div className="relative">
                        <input
                          type={showStaffNew ? 'text' : 'password'}
                          value={staffNew}
                          onChange={e => { setStaffNew(e.target.value); setStaffMsg(null); }}
                          placeholder="New staff password"
                          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[#E6D8C8] bg-[#FFFDF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] font-mono"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowStaffNew(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D5B4A] hover:text-[#3E3023] cursor-pointer">
                          {showStaffNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <input
                        type={showStaffNew ? 'text' : 'password'}
                        value={staffConfirm}
                        onChange={e => { setStaffConfirm(e.target.value); setStaffMsg(null); }}
                        placeholder="Confirm new staff password"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E6D8C8] bg-[#FFFDF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] font-mono"
                      />
                      {staffMsg && (
                        <p className={`text-xs flex items-center gap-1 font-sans ${staffMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                          {staffMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          {staffMsg.text}
                        </p>
                      )}
                      <button type="submit"
                        className="w-full bg-[#3E3023] hover:bg-[#2B2117] text-white font-bold uppercase tracking-wider py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm">
                        Update Staff Password
                      </button>
                    </form>
                  </div>

                  <div className="h-px bg-[#E6D8C8]" />

                  {/* Inventory Password */}
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-sans font-bold text-sm text-[#3E3023]">Inventory &amp; Financial Password</h3>
                      <p className="text-xs text-[#6D5B4A] mt-0.5">Required every time you open /inventory and access audit logs.</p>
                    </div>
                    <form onSubmit={handleChangeInvPass} className="space-y-2.5">
                      <div className="relative">
                        <input
                          type={showInvNew ? 'text' : 'password'}
                          value={invNew}
                          onChange={e => { setInvNew(e.target.value); setInvMsg(null); }}
                          placeholder="New inventory password"
                          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[#E6D8C8] bg-[#FFFDF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] font-mono"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowInvNew(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D5B4A] hover:text-[#3E3023] cursor-pointer">
                          {showInvNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <input
                        type={showInvNew ? 'text' : 'password'}
                        value={invConfirm}
                        onChange={e => { setInvConfirm(e.target.value); setInvMsg(null); }}
                        placeholder="Confirm new inventory password"
                        className="w-full px-3 py-2.5 rounded-xl border border-[#E6D8C8] bg-[#FFFDF9] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] font-mono"
                      />
                      {invMsg && (
                        <p className={`text-xs flex items-center gap-1 font-sans ${invMsg.ok ? 'text-green-600' : 'text-red-600'}`}>
                          {invMsg.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          {invMsg.text}
                        </p>
                      )}
                      <button type="submit"
                        className="w-full bg-[#3E3023] hover:bg-[#2B2117] text-white font-bold uppercase tracking-wider py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm">
                        Update Inventory Password
                      </button>
                    </form>
                  </div>
                </div>
              ) : !isAuditUnlocked ? (
                /* Password Gate for Login History & Audit Log */
                <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4 max-w-sm mx-auto">
                  <div className="p-3 bg-[#E8D9C5] text-[#3E3023] rounded-full border border-[#8B6B4A]/20">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#3E3023]">Protected Session Audit Log</h3>
                    <p className="text-xs text-[#6D5B4A] mt-1 font-sans leading-relaxed">
                      Enter your Inventory &amp; Financial Password to view active devices and staff login history.
                    </p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (verifyPassword('inventory', auditPasscode)) {
                        setIsAuditUnlocked(true);
                        setAuditPassError('');
                        fetchLoginLogs();
                      } else {
                        setAuditPassError('Incorrect inventory password.');
                      }
                    }}
                    className="w-full space-y-3"
                  >
                    <div className="relative">
                      <input
                        type={showAuditPasscode ? 'text' : 'password'}
                        value={auditPasscode}
                        onChange={e => { setAuditPasscode(e.target.value); setAuditPassError(''); }}
                        placeholder="Enter inventory password"
                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[#E6D8C8] bg-[#FFFDF9] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#8B6B4A] font-mono"
                        autoFocus
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowAuditPasscode(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6D5B4A] hover:text-[#3E3023] cursor-pointer"
                      >
                        {showAuditPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {auditPassError && (
                      <p className="text-xs text-red-600 font-sans font-bold flex items-center justify-center gap-1">
                        <X className="h-3.5 w-3.5" />
                        {auditPassError}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-[#3E3023] hover:bg-[#2B2117] text-white font-bold uppercase tracking-wider py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm font-sans"
                    >
                      Unlock Audit Log
                    </button>
                  </form>
                </div>
              ) : (
                /* Login History & Devices Tab Content */
                <div className="space-y-6">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-sans font-bold text-sm text-[#3E3023]">Logged-in Devices &amp; Staff History</h3>
                      <p className="text-xs text-[#6D5B4A] mt-0.5">Real-time session audit log with remote logout controls.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchLoginLogs}
                        disabled={loadingLogs}
                        className="p-2 rounded-xl border border-[#E6D8C8] hover:bg-[#F9F6F1] text-[#6D5B4A] transition-colors cursor-pointer"
                        title="Refresh session logs"
                      >
                        <RefreshCw className={`h-4 w-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => setShowClearConfirmModal(true)}
                        className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Clear log history"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Active Devices Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-ping" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#6D5B4A] font-sans">
                        Currently Active Sessions ({loginLogs.filter(l => l.status === 'active').length})
                      </h4>
                    </div>

                    {loginLogs.filter(l => l.status === 'active').length === 0 ? (
                      <div className="bg-[#F9F6F1] border border-[#E6D8C8] rounded-xl p-4 text-center text-xs text-[#6D5B4A] font-sans">
                        No active device sessions registered.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {loginLogs.filter(l => l.status === 'active').map(session => {
                          const currentTabId = typeof window !== 'undefined' ? sessionStorage.getItem('cafe_tab_session_id') : null;
                          const isCurrentWindow = currentTabId && (session.id === currentTabId || session.sessionId === currentTabId);

                          return (
                            <div key={session.id} className={`bg-[#FFFDF9] border ${isCurrentWindow ? 'border-blue-400 bg-blue-50/20 ring-1 ring-blue-300' : 'border-green-200'} rounded-xl p-3.5 shadow-sm space-y-2.5 relative overflow-hidden`}>
                              <div className={`absolute top-0 left-0 right-0 h-1 ${isCurrentWindow ? 'bg-blue-500' : 'bg-green-500'}`} />

                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-lg ${isCurrentWindow ? 'bg-blue-100 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                    {session.device_info.includes('Mobile') || session.device_info.includes('iPhone') || session.device_info.includes('Android')
                                      ? <Smartphone className="h-4 w-4" />
                                      : <Monitor className="h-4 w-4" />}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold font-sans text-[#3E3023]">{session.device_info}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] text-[#6D5B4A] font-mono bg-[#E6D8C8]/40 px-1.5 py-0.2 rounded">
                                        🌐 {session.ip_address}
                                      </span>
                                      <span className="text-[9px] text-[#8B6B4A] font-mono">
                                        #{session.id.substring(0, 8)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                  {isCurrentWindow ? (
                                    <span className="text-[9px] font-bold text-blue-700 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-ping" />
                                      THIS WINDOW (YOU)
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-green-600 animate-ping" />
                                      ACTIVE NOW
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-[#E6D8C8]/50 text-[10px] text-[#6D5B4A] font-sans">
                                <div className="flex flex-col">
                                  <span>Logged in: <strong>{new Date(session.login_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                                  {session.last_seen_at && (
                                    <span className="text-[9px] text-[#8B6B4A]">
                                      Last active: {Math.max(0, Math.floor((Date.now() - new Date(session.last_seen_at).getTime()) / 1000))}s ago
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => setSessionToForceLogout({ id: session.id, device: session.device_info })}
                                  className="flex items-center gap-1 text-red-600 hover:text-red-700 font-bold hover:bg-red-50 px-2 py-1 rounded-md border border-red-200 transition-colors cursor-pointer"
                                >
                                  <LogOut className="h-3 w-3" />
                                  Force Logout
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Complete History Table */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#6D5B4A] font-sans">
                      Session Audit History Log
                    </h4>

                    <div className="border border-[#E6D8C8] rounded-xl overflow-hidden bg-[#FFFDF9]">
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs font-sans">
                          <thead className="bg-[#F9F6F1] border-b border-[#E6D8C8] sticky top-0 font-bold uppercase text-[10px] text-[#6D5B4A] tracking-wider">
                            <tr>
                              <th className="p-3">Device / OS</th>
                              <th className="p-3">Login Time</th>
                              <th className="p-3">Logout Time</th>
                              <th className="p-3 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E6D8C8]">
                            {loginLogs.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-6 text-center text-[#6D5B4A]">
                                  No session log history available.
                                </td>
                              </tr>
                            ) : (
                              loginLogs.map(log => (
                                <tr key={log.id} className="hover:bg-[#F9F6F1]/50 transition-colors">
                                  <td className="p-3 font-medium text-[#3E3023]">
                                    <div className="flex items-center gap-2">
                                      <UserCheck className="h-3.5 w-3.5 text-[#6D5B4A] shrink-0" />
                                      <div>
                                        <p className="font-bold text-xs">{log.device_info}</p>
                                        <p className="text-[10px] text-[#6D5B4A] font-mono">{log.ip_address}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-[#6D5B4A] font-mono text-[11px]">
                                    {new Date(log.login_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                  </td>
                                  <td className="p-3 text-[#6D5B4A] font-mono text-[11px]">
                                    {log.logout_at
                                      ? new Date(log.logout_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                      : log.status === 'active' ? '— (Active Now)' : 'Expired'}
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      log.status === 'active' ? 'bg-green-100 text-green-700 border border-green-300' :
                                      log.status === 'force_logged_out' ? 'bg-red-100 text-red-700 border border-red-300' :
                                      log.status === 'logged_out' ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                                      'bg-amber-100 text-amber-700 border border-amber-300'
                                    }`}>
                                      {log.status === 'force_logged_out' ? 'FORCED LOGOUT' : log.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Modal: Force Logout Confirmation ─────────────────────── */}
      {sessionToForceLogout && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSessionToForceLogout(null)}
        >
          <div
            className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 shrink-0">
                <LogOut className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#3E3023]">Force Logout Device?</h3>
                <p className="text-xs text-[#6D5B4A] font-sans">Remote session termination</p>
              </div>
            </div>

            <p className="text-xs text-[#6D5B4A] font-sans leading-relaxed">
              Are you sure you want to remotely disconnect <strong className="text-[#3E3023] font-semibold">{sessionToForceLogout.device}</strong>? The device will be logged out automatically.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSessionToForceLogout(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#E6D8C8] text-xs font-bold text-[#6D5B4A] hover:bg-[#F9F6F1] transition-colors cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = sessionToForceLogout.id;
                  setSessionToForceLogout(null);
                  await handleForceLogout(targetId);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer font-sans"
              >
                Force Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Modal: Clear History Confirmation ────────────────────── */}
      {showClearConfirmModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setShowClearConfirmModal(false)}
        >
          <div
            className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#3E3023]">Clear Audit History?</h3>
                <p className="text-xs text-[#6D5B4A] font-sans">Delete historical login logs</p>
              </div>
            </div>

            <p className="text-xs text-[#6D5B4A] font-sans leading-relaxed">
              Are you sure you want to delete all historical login logs? This action cannot be undone.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E6D8C8] text-xs font-bold text-[#6D5B4A] hover:bg-[#F9F6F1] transition-colors cursor-pointer font-sans"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowClearConfirmModal(false);
                  await handleClearLogs();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer font-sans"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
