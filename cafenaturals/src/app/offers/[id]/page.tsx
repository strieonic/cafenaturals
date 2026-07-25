'use client';

import React, { useEffect, useState, use } from 'react';
import { db } from '@/lib/db';
import {
  ArrowLeft, Percent, Image as ImageIcon, CheckCircle, Plus, Trash2, Save, Smartphone
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Modal';
import { DateTimeDisplay } from '@/components/DateTimeDisplay';
import { ViraTechWatermark } from '@/components/ViraTechWatermark';

type IncludedItem = {
  menu_item_id: string;
  name: string;
  original_price: number;
};

const EMPTY_FORM = {
  is_active: true,
  title: '',
  description: '',
  badge: '',
  price: 149,
  original_price: '' as number | '',
  image_url: '/offer_combo.jpg',
  included_items: [] as IncludedItem[],
};

export default function OfferEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';
  const router = useRouter();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [mobileTab, setMobileTab] = useState<'edit' | 'preview'>('edit');

  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [discountInput, setDiscountInput] = useState('');

  const [form, setForm] = useState({ ...EMPTY_FORM });

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean; title: string; message: string; type: 'alert' | 'confirm'; onConfirm?: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'alert' });

  const showAlert = (title: string, message: string) =>
    setModalConfig({ isOpen: true, title, message, type: 'alert' });
  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  /* ── Load data ─────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const [items, cats] = await Promise.all([db.getMenuItems(), db.getCategories()]);
        setMenuItems(items);
        setCategories(cats);

        if (!isNew) {
          const offers: any[] = await db.getOffers();
          const offer = offers.find((o: any) => o.id === id || o._id === id);
          if (offer) {
            setForm({
              is_active: offer.is_active ?? true,
              title: offer.title ?? '',
              description: offer.description ?? '',
              badge: offer.badge ?? '',
              price: offer.price ?? 149,
              original_price: offer.original_price ?? '',
              image_url: offer.image_url ?? '/offer_combo.jpg',
              included_items: offer.included_items ?? [],
            });
            if (offer.original_price && offer.original_price > offer.price) {
              setDiscountInput(
                Math.round(((offer.original_price - offer.price) / offer.original_price) * 100).toString()
              );
            }
          }
        }
      } catch (err) {
        console.error('Error loading:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isNew]);

  /* ── Helpers ───────────────────────────────────── */
  const setField = (key: keyof typeof EMPTY_FORM, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleAddIncludedItem = () => {
    if (!selectedMenuItemId) return;
    const menuItem = menuItems.find(i => i.id === selectedMenuItemId);
    if (!menuItem) return;

    const newItems = [
      ...form.included_items,
      { menu_item_id: menuItem.id, name: menuItem.name, original_price: menuItem.price }
    ];
    const newTotal = newItems.reduce((s, i) => s + i.original_price, 0);

    setForm(prev => ({
      ...prev,
      included_items: newItems,
      description: newItems.map(i => i.name).join(' + '),
      original_price: newTotal,
    }));

    if (newTotal > form.price) {
      setDiscountInput(Math.round(((newTotal - form.price) / newTotal) * 100).toString());
    }
    setSelectedMenuItemId('');
  };

  const handleRemoveIncludedItem = (idx: number) => {
    const newItems = form.included_items.filter((_, i) => i !== idx);
    setForm(prev => ({
      ...prev,
      included_items: newItems,
      description: newItems.length > 0 ? newItems.map(i => i.name).join(' + ') : '',
    }));
  };

  const handleUpdateIncludedItem = (idx: number, field: keyof IncludedItem, value: any) => {
    setForm(prev => {
      const updated = [...prev.included_items];
      updated[idx] = { ...updated[idx], [field]: value };
      return {
        ...prev,
        included_items: updated,
        description: field === 'name' ? updated.map(i => i.name).join(' + ') : prev.description,
      };
    });
  };

  /* ── Save ──────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.badge.trim()) {
      showAlert('Validation Error', 'Please fill in the Offer Title, Badge Text, and Description.');
      return;
    }

    setSaving(true);
    setSuccessMsg('');
    try {
      const payload = {
        is_active: form.is_active,
        title: form.title.trim(),
        description: form.description.trim(),
        badge: form.badge.trim(),
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : undefined,
        image_url: form.image_url,
        included_items: form.included_items,
      };

      if (isNew) {
        await db.createOffer(payload);
        setSuccessMsg('Offer created and published to digital menu!');
        setTimeout(() => router.push('/offers'), 1500);
      } else {
        await db.updateOffer(id, payload);
        setSuccessMsg('Offer updated and published!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
      showAlert('Error', 'Failed to save offer.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#FFFDF9] via-[#FFFDF9] to-[#E8D9C5] border-b border-[#E6D8C8] text-[#3E3023] sticky top-0 z-40 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <Link href="/offers" className="p-1.5 hover:bg-[#E8D9C5]/50 rounded-full text-[#3E3023] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer">
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[#8B6B4A] bg-[#FFFDF9] p-0.5 shadow-sm">
              <Image src="/cafe_logo_new.png" alt="Cafe Naturaleza Logo" width={32} height={32} className="object-cover h-full w-full rounded-full" />
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold leading-none tracking-wide text-[#3E3023]">
                {isNew ? 'New Offer' : 'Edit Offer'}
              </h1>
              <p className="text-[9px] uppercase tracking-widest text-[#6D5B4A] font-sans mt-0.5">Cafe Naturaleza · Menu Control</p>
            </div>
          </Link>
          <div className="ml-auto border-l border-[#E6D8C8] pl-3 text-[#3E3023] flex items-center gap-2">
            <DateTimeDisplay />
            <ViraTechWatermark />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-6">
          {/* Mobile Tab Switcher */}
          <div className="flex lg:hidden bg-[#E8D9C5]/40 p-1.5 rounded-2xl mb-6 border border-[#E6D8C8] sticky top-16 z-30 backdrop-blur-md shadow-sm">
            <button
              type="button"
              onClick={() => setMobileTab('edit')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mobileTab === 'edit'
                  ? 'bg-[#3E3023] text-white shadow-sm'
                  : 'text-[#6D5B4A] hover:text-[#3E3023]'
              }`}
            >
              <span>📝 Edit Form</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mobileTab === 'preview'
                  ? 'bg-[#8B6B4A] text-white shadow-sm'
                  : 'text-[#6D5B4A] hover:text-[#3E3023]'
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>📱 Live Preview</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* ── Left: Form ── */}
            <div className={`space-y-6 pb-20 ${mobileTab === 'edit' ? 'block' : 'hidden'} lg:block`}>
            <div>
              <h2 className="text-2xl font-serif font-bold text-foreground">
                {isNew ? 'Create Offer' : 'Edit Offer'}
              </h2>
              <p className="text-sm text-muted-foreground font-sans mt-1">
                {isNew
                  ? 'Design a new combo meal that customers will see on the digital menu.'
                  : 'Update the details of this promotional offer.'}
              </p>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 p-3 rounded-xl font-sans text-sm font-medium animate-in fade-in slide-in-from-top-4">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {successMsg}
              </div>
            )}

            <div className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-6">

              {/* Active toggle */}
              <div className="flex items-center justify-between bg-muted/40 border border-border rounded-xl px-4 py-4">
                <div>
                  <p className="text-sm font-bold text-foreground font-sans">Show on Menu</p>
                  <p className="text-xs text-muted-foreground font-sans">Toggle visibility for customers</p>
                </div>
                <button
                  type="button"
                  onClick={() => setField('is_active', !form.is_active)}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-200 cursor-pointer ${form.is_active ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-200 ${form.is_active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">Offer Title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setField('title', e.target.value)}
                    placeholder="e.g. Burger & Coffee Combo"
                    className="w-full px-4 py-2.5 text-sm font-sans bg-background text-foreground border border-border rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">Badge Text</label>
                  <input
                    type="text"
                    value={form.badge}
                    onChange={e => setField('badge', e.target.value)}
                    placeholder="e.g. SPECIAL, 40% OFF"
                    className="w-full px-4 py-2.5 text-sm font-sans bg-background text-foreground border border-border rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder="Describe the combo..."
                  className="w-full px-4 py-2.5 text-sm font-sans bg-background text-foreground border border-border rounded-xl focus:border-primary focus:outline-none resize-none"
                />
              </div>

              {/* Included Items */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-bold text-foreground font-sans">Included Items</label>
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {form.included_items.length} {form.included_items.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                {form.included_items.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {form.included_items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded-xl border border-border/50">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => handleUpdateIncludedItem(idx, 'name', e.target.value)}
                          className="flex-1 bg-white border border-border px-3 py-1.5 rounded-lg text-sm font-sans focus:outline-none focus:border-primary"
                          placeholder="Item Name"
                        />
                        <div className="relative w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">₹</span>
                          <input
                            type="number"
                            value={item.original_price}
                            onChange={e => handleUpdateIncludedItem(idx, 'original_price', Number(e.target.value))}
                            className="w-full bg-white border border-border pl-6 pr-2 py-1.5 rounded-lg text-sm font-mono focus:outline-none focus:border-primary"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveIncludedItem(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add item selector */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMenuItemId}
                    onChange={e => setSelectedMenuItemId(e.target.value)}
                    className="flex-1 bg-background border border-border px-3 py-2 rounded-xl text-sm font-sans focus:outline-none focus:border-primary"
                  >
                    <option value="">Select standard menu item...</option>
                    {categories.map(cat => (
                      <optgroup key={cat.id} label={cat.name}>
                        {menuItems
                          .filter(mi => mi.category_id === cat.id)
                          .map(mi => (
                            <option key={mi.id} value={mi.id}>{mi.name} — ₹{mi.price}</option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedMenuItemId}
                    onClick={handleAddIncludedItem}
                    className="bg-secondary text-secondary-foreground p-2 rounded-xl disabled:opacity-50 hover:bg-secondary/90 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">Discounted Price (₹)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setField('price', val);
                      if (form.original_price && val > 0 && Number(form.original_price) > val) {
                        setDiscountInput(Math.round(((Number(form.original_price) - val) / Number(form.original_price)) * 100).toString());
                      } else setDiscountInput('');
                    }}
                    className="w-full px-4 py-2.5 text-sm font-bold font-mono text-primary bg-background border border-border rounded-xl focus:border-primary focus:outline-none"
                  />
                  {/* % calculator */}
                  <div className="mt-2 flex items-center gap-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                    <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="number"
                      placeholder="e.g. 15"
                      value={discountInput}
                      className="w-16 px-2 py-1 text-sm font-mono bg-white border border-border rounded-md focus:border-primary focus:outline-none"
                      onChange={e => {
                        setDiscountInput(e.target.value);
                        const pct = Number(e.target.value);
                        if (form.original_price && pct >= 0 && pct <= 100) {
                          setField('price', Math.round(Number(form.original_price) * (1 - pct / 100)));
                        }
                      }}
                    />
                    <span className="text-[10px] text-muted-foreground leading-tight">Auto-calculate price</span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">
                    <span>Original Price (₹)</span>
                    <span className="text-[9px] opacity-60 normal-case tracking-normal">Optional</span>
                  </label>
                  <input
                    type="number"
                    value={form.original_price}
                    onChange={e => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      setField('original_price', val);
                      if (val && form.price && Number(val) > form.price) {
                        setDiscountInput(Math.round(((Number(val) - form.price) / Number(val)) * 100).toString());
                      } else setDiscountInput('');
                    }}
                    placeholder="299"
                    className="w-full px-4 py-2.5 text-sm font-mono text-muted-foreground line-through bg-background border border-border rounded-xl focus:border-primary focus:outline-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Calculated from items automatically, or override manually.</p>
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 font-sans">Image Path / URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={e => setField('image_url', e.target.value)}
                    placeholder="/offer_combo.jpg"
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-sans bg-background text-foreground border border-border rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Save button */}
              <div className="pt-4 mt-2 flex gap-3">
                <Link
                  href="/offers"
                  className="flex-1 py-3.5 rounded-xl border border-border bg-background text-foreground text-sm font-bold font-sans hover:bg-muted/50 transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold font-sans hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving
                    ? 'Saving...'
                    : isNew ? 'Create & Publish Offer' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: Live preview ── */}
          <div className={`space-y-6 lg:sticky lg:top-24 self-start ${mobileTab === 'preview' ? 'block' : 'hidden'} lg:block`}>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-foreground">Live Mobile Preview</h2>
              <span className="text-xs font-bold text-[#8B6B4A] bg-[#E8D9C5]/50 px-2.5 py-1 rounded-full uppercase tracking-wider font-sans">
                Customer View
              </span>
            </div>

            <div className={`transition-opacity duration-300 ${!form.is_active ? 'opacity-40 grayscale' : ''}`}>
              <div className="relative overflow-hidden rounded-[2rem] border-8 border-slate-900 bg-background shadow-2xl mx-auto max-w-sm flex flex-col pointer-events-none select-none my-2">
                {/* Status bar */}
                <div className="h-7 w-full bg-slate-900 flex justify-center items-center rounded-t-xl shrink-0">
                  <div className="w-1/3 h-4 bg-black rounded-b-xl" />
                </div>

                {/* Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4 max-h-[620px]">
                  {/* Mock header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-xs font-bold">CN</span>
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-lg leading-none text-[#3E3023]">Cafe Naturaleza</h3>
                      <p className="text-[10px] uppercase tracking-widest font-sans text-muted-foreground mt-1">Menu</p>
                    </div>
                  </div>

                  {/* Offer card preview */}
                  <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm border border-border">
                    <div className="relative h-40 w-full bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.image_url}
                        alt="Offer Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160" viewBox="0 0 400 160" fill="%23f1f5f9"><rect width="400" height="160" fill="%23f1f5f9"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%2394a3b8">Invalid Image URL</text></svg>';
                        }}
                      />
                      <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-md px-2 py-1 shadow-sm">
                        <span className="text-[10px] font-bold tracking-widest text-primary uppercase">{form.badge || 'BADGE TEXT'}</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-serif text-lg font-bold leading-tight">{form.title || 'Offer Title'}</h3>
                        <p className="text-xs text-muted-foreground font-sans mt-1 line-clamp-2">
                          {form.description || 'Detailed description of the combo offer.'}
                        </p>
                      </div>

                      {form.included_items.length > 0 && (
                        <div className="pt-2 pb-1 space-y-1.5 border-t border-dashed border-border/60">
                          {form.included_items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] font-sans">
                              <span className="flex items-center gap-1.5 text-slate-700">
                                <span className="h-1 w-1 bg-primary rounded-full" />
                                {item.name}
                              </span>
                              <span className="font-mono text-muted-foreground line-through opacity-70">₹{item.original_price}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-end justify-between pt-3 border-t border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xl text-primary">₹{form.price || 0}</span>
                          {form.original_price && (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-sm text-muted-foreground line-through">₹{form.original_price}</span>
                              <span className="text-[9px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                {Math.round(((Number(form.original_price) - Number(form.price)) / Number(form.original_price)) * 100)}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {form.included_items.length === 0 && (
                    <div className="flex gap-4 p-4 rounded-2xl bg-white shadow-sm border border-border opacity-50">
                      <div className="flex-1">
                        <h4 className="font-serif font-bold">Standard Item</h4>
                        <p className="text-xs text-muted-foreground font-sans mt-1">Normal menu item</p>
                        <p className="font-mono font-black text-primary mt-2">₹99</p>
                      </div>
                      <div className="h-20 w-20 rounded-xl bg-muted shrink-0" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </main>
      )}

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
