'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Coffee, Key, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { updatePasscode } from '../../actions';

export default function LoginPage() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Passcode Update Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { error } = await login(password);
      if (error) {
        setErrorMsg(error.message || 'Invalid passcode');
      }
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');

    if (newPass !== confirmPass) {
      setModalError('New passcodes do not match.');
      return;
    }

    setModalLoading(true);
    try {
      const result = await updatePasscode(currentPass, newPass);
      if (result.success) {
        setModalSuccess('Passcode updated successfully!');
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
        setTimeout(() => {
          setShowUpdateModal(false);
          setModalSuccess('');
        }, 1500);
      } else {
        setModalError(result.error || 'Failed to update passcode.');
      }
    } catch (err) {
      setModalError('An unexpected error occurred.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-background animate-fade-in">
      <div className="w-full max-w-md space-y-8">
        <Link href="/" className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-accent mb-2">
            <Coffee className="h-8 w-8" />
          </div>
          <h2 className="text-center font-serif text-4xl text-foreground font-bold tracking-wide">
            Cafe Naturaleza
          </h2>
          <p className="mt-1 text-center text-xs font-sans tracking-widest uppercase text-muted-foreground">
            Staff Portal — Ishwarpur
          </p>
        </Link>

        <div className="bg-card border border-border shadow-md rounded-2xl p-8 sm:p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="rounded-xl bg-danger/10 p-4 border border-danger/20">
                <div className="text-sm font-medium text-danger text-center">
                  {errorMsg}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 font-sans text-center">
                System Passcode
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-[#E6D8C8] bg-background px-3 py-2.5 text-[#3E3023] shadow-sm placeholder-muted-foreground/30 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm font-sans text-center tracking-widest text-lg"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-full bg-gradient-to-r from-[#C8A97E] to-[#8B6B4A] text-white px-4 py-2.5 text-sm font-bold font-sans tracking-wide uppercase cursor-pointer hover:shadow-md hover:opacity-95 transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Access Portal'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center space-y-4">
          <p className="text-xs text-muted-foreground font-sans">
            Note: Ask the administrator if you do not know the system passcode.
          </p>
          <div>
            <button
              onClick={() => {
                setModalError('');
                setModalSuccess('');
                setShowUpdateModal(true);
              }}
              className="text-xs text-[#8B6B4A] font-bold hover:underline cursor-pointer font-sans inline-flex items-center gap-1 bg-[#E8D9C5]/40 hover:bg-[#E8D9C5]/75 px-3.5 py-1.5 rounded-full transition-all border border-[#E6D8C8]/60 shadow-sm"
            >
              <Key className="h-3 w-3" />
              Update Passcode
            </button>
          </div>
        </div>
      </div>

      {/* Passcode Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3E3023]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFDF9] border border-[#E6D8C8] rounded-3xl shadow-2xl p-6 w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E8D9C5]/50 text-[#8B6B4A] mb-2">
                <Lock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#3E3023]">Update Passcode</h3>
              <p className="text-xs text-[#6D5B4A] font-sans mt-0.5">Change the staff portal access code</p>
            </div>

            {/* Error / Success Notifications */}
            {modalError && (
              <div className="rounded-xl bg-danger/10 p-3.5 border border-danger/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-danger shrink-0" />
                <span className="text-xs font-semibold text-danger">{modalError}</span>
              </div>
            )}
            {modalSuccess && (
              <div className="rounded-xl bg-success/10 p-3.5 border border-success/20 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                <span className="text-xs font-semibold text-success">{modalSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleUpdateSubmit} className="space-y-4 font-sans text-sm">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6D5B4A] mb-1.5">
                  Current Passcode
                </label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="block w-full rounded-xl border border-[#E6D8C8] bg-background px-3 py-2 text-[#3E3023] shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent tracking-widest text-center"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6D5B4A] mb-1.5">
                  New Passcode
                </label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="block w-full rounded-xl border border-[#E6D8C8] bg-background px-3 py-2 text-[#3E3023] shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent tracking-widest text-center"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6D5B4A] mb-1.5">
                  Confirm New Passcode
                </label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="block w-full rounded-xl border border-[#E6D8C8] bg-background px-3 py-2 text-[#3E3023] shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent tracking-widest text-center"
                  placeholder="••••••••"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-full border border-[#E6D8C8] text-xs font-bold uppercase tracking-wider text-[#6D5B4A] hover:bg-[#E8D9C5]/40 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-full bg-gradient-to-r from-[#E8D9C5] to-[#C8A97E] hover:from-[#C8A97E] hover:to-[#8B6B4A] text-[#3E3023] hover:text-[#FFFDF9] text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
