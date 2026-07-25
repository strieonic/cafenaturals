'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserCheck } from 'lucide-react';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';

export default function CustomerLandingPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between text-foreground font-sans overflow-x-hidden">
      {/* Background Image with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url('/cafe_interior.jpg')` }}
      />
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[1.5px] z-0" />

      {/* Top Floating Logo Area */}
      <header className="relative z-10 w-full px-6 py-4 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-primary bg-[#FFFDF9] p-0.5 shadow-sm">
            <Image src="/cafe_logo_new.png" alt="Cafe Naturaleza Logo" width={40} height={40} className="object-cover h-full w-full rounded-full" />
          </div>
          <span className="font-serif text-xl font-bold tracking-wider text-[#FFFDF9]">Cafe Naturaleza</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-[#FFFDF9]">
            <DateTimeDisplay />
          </div>
        </div>
      </header>

      {/* Center Hero Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 sm:p-12 text-center shadow-2xl flex flex-col items-center">
          {/* Large Logo Badge */}
          <div className="relative h-28 w-28 overflow-hidden rounded-full border-2 border-primary bg-[#FFFDF9] p-1 mb-6 shadow-lg">
            <Image src="/cafe_logo_new.png" alt="Cafe Naturaleza Logo" width={112} height={112} className="object-cover h-full w-full rounded-full" />
          </div>

          <h1 className="font-serif text-4xl text-primary font-bold leading-none mb-2 tracking-wide">
            Cafe Naturaleza
          </h1>
          <p className="text-[10px] font-sans tracking-[0.25em] uppercase text-white/75 font-semibold mb-4">
            Ishwarpur
          </p>

          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-primary to-transparent mb-6" />

          <p className="font-serif italic text-lg sm:text-xl text-white/90 leading-relaxed mb-8 max-w-sm">
            "Sip natural warmth, cultivate organic peace."
          </p>

          {/* Call-to-actions */}
          <div className="w-full">
            <Link
              href="/admin"
              className="flex w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#C8A97E] to-[#8B6B4A] text-white hover:opacity-95 text-base font-bold font-sans uppercase tracking-wider transition-all cursor-pointer py-4 shadow-md hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
            >
              <UserCheck className="h-5 w-5" />
              Staff Access
            </Link>
          </div>
        </div>
      </main>

      {/* Footer Area */}
      <footer className="relative z-10 w-full text-center py-6 text-xs text-white/40 font-sans tracking-wide">
        <p>© {new Date().getFullYear()} Cafe Naturaleza · Ishwarpur. All rights reserved.</p>
        <p className="text-[10px] mt-1 opacity-60">Call us: 7038411001 · Visit on Instagram @cafe_naturaleza</p>
      </footer>

    </div>
  );
}
