'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { db } from '@/lib/db';
import {
  ArrowLeft, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Tag, ChevronRight, Layers
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Modal } from '@/components/Modal';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';
import { ViraTechWatermark } from '@/components/ViraTechWatermark';

export default function OffersListPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean; title: string; message: string; type: 'alert' | 'confirm'; onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'alert' });

  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setModalConfig({ isOpen: true, title, message, type: 'confirm', onConfirm });
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await db.getOffers();
      setOffers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOffers(); }, []);

  const handleToggleActive = (offer: any) => {
    startTransition(async () => {
      await db.updateOffer(offer.id, { ...offer, is_active: !offer.is_active });
      await loadOffers();
    });
  };

  const handleDelete = (offer: any) => {
    showConfirm(
      'Delete Offer',
      `Are you sure you want to delete "${offer.title}"? This cannot be undone.`,
      async () => {
        closeModal();
        await db.deleteOffer(offer.id);
        await loadOffers();
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#FFFDF9] via-[#FFFDF9] to-[#E8D9C5] border-b border-[#E6D8C8] text-[#3E3023] sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="p-1.5 hover:bg-[#E8D9C5]/50 rounded-full text-[#3E3023] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#8B6B4A] bg-[#FFFDF9] p-0.5 shadow-sm">
              <Image src="/cafe_logo_new.png" alt="Cafe Naturaleza Logo" width={32} height={32} className="object-cover h-full w-full rounded-full" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold leading-none tracking-wide text-[#3E3023]">Running Offers</h1>
              <p className="text-[9px] uppercase tracking-widest text-[#6D5B4A] font-sans mt-0.5">Cafe Naturaleza · Menu Control</p>
            </div>
          </Link>
          <div className="ml-auto border-l border-[#E6D8C8] pl-3 text-[#3E3023] flex items-center gap-2">
            <DateTimeDisplay />
            <ViraTechWatermark />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">All Offers</h2>
            <p className="text-sm text-muted-foreground font-sans mt-1">
              Manage promotional combo offers shown on the customer menu.
            </p>
          </div>
          <Link
            href="/offers/new"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-bold font-sans hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Offer
          </Link>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : offers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
              <Layers className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-serif text-lg font-bold text-foreground">No offers yet</p>
              <p className="text-sm text-muted-foreground font-sans mt-1">Create your first promotional offer to display it on the customer menu.</p>
            </div>
            <Link
              href="/offers/new"
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold font-sans hover:bg-primary/90 transition-colors mt-2"
            >
              <Plus className="h-4 w-4" /> Create First Offer
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {offers.map(offer => (
              <div
                key={offer.id}
                className={`group relative bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${!offer.is_active ? 'opacity-60' : ''}`}
              >
                {/* Image */}
                <div className="relative h-40 w-full bg-muted overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={offer.image_url}
                    alt={offer.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200" fill="%23f1f5f9"><rect width="400" height="200" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">No Image</text></svg>';
                    }}
                  />
                  {/* Badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-md px-2 py-1 shadow-sm">
                    <Tag className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-bold tracking-widest text-primary uppercase">{offer.badge}</span>
                  </div>
                  {/* Active status pill */}
                  <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${offer.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                    {offer.is_active ? 'ACTIVE' : 'HIDDEN'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-serif text-base font-bold text-foreground leading-tight">{offer.title}</h3>
                  <p className="text-xs text-muted-foreground font-sans mt-1 line-clamp-2">{offer.description}</p>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="font-mono font-black text-lg text-primary">₹{offer.price}</span>
                    {offer.original_price && (
                      <span className="font-mono text-sm text-muted-foreground line-through">₹{offer.original_price}</span>
                    )}
                    {offer.original_price && offer.original_price > offer.price && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                        {Math.round(((offer.original_price - offer.price) / offer.original_price) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  {offer.included_items?.length > 0 && (
                    <p className="text-[10px] text-muted-foreground font-sans mt-1">
                      {offer.included_items.length} item{offer.included_items.length !== 1 ? 's' : ''} included
                    </p>
                  )}
                </div>

                {/* Actions — mobile-first layout */}
                <div className="px-4 pb-4 pt-0 space-y-2">
                  {/* Row 1: toggle + delete */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(offer)}
                      disabled={isPending}
                      title={offer.is_active ? 'Hide from menu' : 'Show on menu'}
                      className={`flex items-center gap-1.5 text-xs font-sans font-semibold px-3 py-2 rounded-xl border transition-colors disabled:opacity-50 flex-1 justify-center cursor-pointer ${
                        offer.is_active
                          ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {offer.is_active
                        ? <ToggleRight className="h-4 w-4 shrink-0" />
                        : <ToggleLeft className="h-4 w-4 shrink-0" />}
                      {offer.is_active ? 'Active' : 'Hidden'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(offer)}
                      className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                      title="Delete offer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Row 2: Edit — full width */}
                  <Link
                    href={`/offers/${offer.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#E8D9C5] to-[#C8A97E] hover:from-[#C8A97E] hover:to-[#8B6B4A] text-[#3E3023] hover:text-[#FFFDF9] text-xs font-bold font-sans py-2.5 rounded-xl transition-all duration-200 shadow-sm"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit Offer
                    <ChevronRight className="h-3 w-3 opacity-60" />
                  </Link>
                </div>
              </div>
            ))}

            {/* Add new card */}
            <Link
              href="/offers/new"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-2xl min-h-[260px] text-muted-foreground hover:text-primary hover:border-primary transition-all duration-200 hover:bg-primary/5 group"
            >
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Plus className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold font-sans">Add New Offer</p>
            </Link>
          </div>
        )}
      </main>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
}
