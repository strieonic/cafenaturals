'use server';

import { tableService } from '../services/table.service';
import { menuService } from '../services/menu.service';
import { orderService } from '../services/order.service';
import { billingService } from '../services/billing.service';
import { expenseService } from '../services/expense.service';
import { adminService } from '../services/admin.service';
import { pigmyService } from '../services/pigmy.service';

// ── SERVER BOOT TRACKING ─────────────────────────────────────────────
if (!(globalThis as any).__SERVER_BOOT_TIME) {
  (globalThis as any).__SERVER_BOOT_TIME = Date.now();
}
const SERVER_BOOT_TIME = (globalThis as any).__SERVER_BOOT_TIME;

export async function getServerBootTime() {
  return SERVER_BOOT_TIME;
}

// ── IN-MEMORY MOCK DATABASE FALLBACK ─────────────────────────────────
// Allows the UI to be fully interactive even if MongoDB is not running.
let mockTables = Array.from({ length: 12 }, (_, i) => ({
  id: `mock-table-${i + 1}`,
  _id: `mock-table-${i + 1}`,
  table_number: i + 1,
  status: 'free' as 'free' | 'occupied',
  activeOrder: null as any
}));

const mockCategories = [
  { id: 'cat-1', _id: 'cat-1', name: 'French Fries', sort_order: 1 },
  { id: 'cat-2', _id: 'cat-2', name: 'Burgers', sort_order: 2 },
  { id: 'cat-3', _id: 'cat-3', name: 'Grilled Sandwiches', sort_order: 3 },
  { id: 'cat-4', _id: 'cat-4', name: 'Pasta', sort_order: 4 },
  { id: 'cat-5', _id: 'cat-5', name: 'Cold Coffee', sort_order: 5 },
  { id: 'cat-6', _id: 'cat-6', name: 'Hot Coffee', sort_order: 6 },
  { id: 'cat-7', _id: 'cat-7', name: 'Milk Shake', sort_order: 7 },
  { id: 'cat-8', _id: 'cat-8', name: 'Mocktail', sort_order: 8 }
];

const mockMenuItems = [
  { id: 'item-1', _id: 'item-1', category_id: 'cat-1', name: 'Plain Salted Fries', description: 'Classic salted potato fries', price: 80, is_veg: true, is_available: true, sort_order: 1 },
  { id: 'item-2', _id: 'item-2', category_id: 'cat-1', name: 'Peri Peri Masala Fries', description: 'Spicy peri-peri seasoned fries', price: 90, is_veg: true, is_available: true, sort_order: 2 },
  { id: 'item-3', _id: 'item-3', category_id: 'cat-2', name: 'Classic Veg Burger', description: 'Standard veg patty burger', price: 80, is_veg: true, is_available: true, sort_order: 1 },
  { id: 'item-4', _id: 'item-4', category_id: 'cat-5', name: 'Thick Cold Coffee', description: 'Thick creamy blended cold coffee', price: 70, is_veg: true, is_available: true, sort_order: 1 }
];

let mockOffers: any[] = [
  {
    id: 'offer-1',
    _id: 'offer-1',
    is_active: true,
    title: 'Combo Offer',
    description: 'Burger + Fries + Cold Coffee',
    badge: 'Popular',
    price: 199,
    original_price: 249,
    image_url: '/offer_combo.jpg',
    included_items: []
  }
];

let mockDayOpen = (globalThis as any).__mockDayOpen ?? true;
let mockDayClosed = (globalThis as any).__mockDayClosed ?? false;
let mockExpenses: any[] = [];
let mockBills: any[] = [];
let mockDayCloses: any[] = [];
let mockDayOpens: any[] = [{ date: new Date().toLocaleDateString('en-CA'), opening_cash: 1000 }];
let mockPigmyAccounts: any[] = [];
let mockPigmyTransactions: any[] = [];

// Helper to update mock order totals
function updateMockOrderTotals(order: any) {
  if (!order) return;
  order.itemsCount = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  order.totalAmount = order.items.reduce((sum: number, item: any) => sum + (item.quantity * item.price_at_order), 0);
}

// ── TABLE ACTIONS ────────────────────────────────────────────────────
export async function getTables() {
  try {
    return await tableService.getTables();
  } catch (e) {
    console.warn('[Offline Mode] Using mock tables.');
    return mockTables;
  }
}

export async function getTable(tableId: string) {
  try {
    return await tableService.getTable(tableId);
  } catch (e) {
    return mockTables.find(t => t.id === tableId || t._id === tableId) || mockTables[0];
  }
}

// ── MENU ACTIONS ─────────────────────────────────────────────────────
export async function getCategories() {
  try {
    return await menuService.getCategories();
  } catch (e) {
    return mockCategories;
  }
}

export async function getMenuItems() {
  try {
    return await menuService.getMenuItems();
  } catch (e) {
    return mockMenuItems;
  }
}

// ── ORDER ACTIONS ────────────────────────────────────────────────────
export async function getActiveOrder(tableId: string) {
  try {
    return await orderService.getActiveOrder(tableId);
  } catch (e) {
    const table = mockTables.find(t => t.id === tableId || t._id === tableId);
    return table?.activeOrder || null;
  }
}

export async function createOrder(tableId: string) {
  try {
    return await orderService.createOrder(tableId);
  } catch (e) {
    const table = mockTables.find(t => t.id === tableId || t._id === tableId);
    if (table) {
      table.status = 'occupied';
      table.activeOrder = {
        id: `mock-order-${tableId}`,
        _id: `mock-order-${tableId}`,
        itemsCount: 0,
        totalAmount: 0,
        created_at: new Date().toISOString(),
        status: 'open',
        timer_start: null,
        timer_charge: 0,
        timer_duration_seconds: 0,
        items: []
      };
      return table.activeOrder;
    }
    return null;
  }
}

export async function addOrderItem(orderId: string, menuItemId: string, quantity: number, notes: string | null, priceAtOrder: number) {
  try {
    return await orderService.addOrderItem(orderId, menuItemId, quantity, notes, priceAtOrder);
  } catch (e) {
    const table = mockTables.find(t => t.activeOrder?.id === orderId || t.activeOrder?._id === orderId);
    if (table && table.activeOrder) {
      const menuItem = mockMenuItems.find(m => m.id === menuItemId || m._id === menuItemId);
      const newItem = {
        id: `mock-item-${Date.now()}`,
        _id: `mock-item-${Date.now()}`,
        menu_item_id: menuItemId,
        quantity,
        notes,
        price_at_order: priceAtOrder,
        menu_items: menuItem
      };
      table.activeOrder.items.push(newItem);
      updateMockOrderTotals(table.activeOrder);
      return newItem;
    }
    return null;
  }
}

export async function updateOrderItem(itemId: string, quantity: number, notes: string | null) {
  try {
    return await orderService.updateOrderItem(itemId, quantity, notes);
  } catch (e) {
    for (const table of mockTables) {
      if (table.activeOrder) {
        const itemIdx = table.activeOrder.items.findIndex((i: any) => i.id === itemId || i._id === itemId);
        if (itemIdx > -1) {
          table.activeOrder.items[itemIdx].quantity = quantity;
          table.activeOrder.items[itemIdx].notes = notes;
          updateMockOrderTotals(table.activeOrder);
          return table.activeOrder.items[itemIdx];
        }
      }
    }
    return null;
  }
}

export async function deleteOrderItem(itemId: string) {
  try {
    return await orderService.deleteOrderItem(itemId);
  } catch (e) {
    for (const table of mockTables) {
      if (table.activeOrder) {
        const itemIdx = table.activeOrder.items.findIndex((i: any) => i.id === itemId || i._id === itemId);
        if (itemIdx > -1) {
          table.activeOrder.items.splice(itemIdx, 1);
          updateMockOrderTotals(table.activeOrder);
          return { success: true };
        }
      }
    }
    return null;
  }
}

export async function cancelOrder(orderId: string) {
  try {
    return await orderService.cancelOrder(orderId);
  } catch (e) {
    const table = mockTables.find(t => t.activeOrder?.id === orderId || t.activeOrder?._id === orderId);
    if (table) {
      table.status = 'free';
      table.activeOrder = null;
    }
    return { success: true };
  }
}

export async function unlockOrder(orderId: string) {
  try {
    return await orderService.unlockOrder(orderId);
  } catch (e) {
    const table = mockTables.find(t => t.activeOrder?.id === orderId || t.activeOrder?._id === orderId);
    if (table && table.activeOrder) {
      table.activeOrder.status = 'open';
    }
    return { success: true };
  }
}

export async function startTimer(orderId: string) {
  try {
    return await orderService.startTimer(orderId);
  } catch (e) {
    const table = mockTables.find(t => t.activeOrder?.id === orderId || t.activeOrder?._id === orderId);
    if (table && table.activeOrder) {
      const now = new Date().toISOString();
      table.activeOrder.timer_start = now;
      return now;
    }
    return null;
  }
}

export async function stopTimer(orderId: string, finalCharge: number = 0, reset: boolean = false) {
  try {
    return await orderService.stopTimer(orderId, finalCharge, reset);
  } catch (e) {
    const table = mockTables.find(t => t.activeOrder?.id === orderId || t.activeOrder?._id === orderId);
    if (table && table.activeOrder) {
      let addSecs = 0;
      if (table.activeOrder.timer_start) {
        addSecs = Math.floor((Date.now() - new Date(table.activeOrder.timer_start).getTime()) / 1000);
      }
      table.activeOrder.timer_duration_seconds = reset ? 0 : (table.activeOrder.timer_duration_seconds || 0) + addSecs;
      table.activeOrder.timer_start = null;
      table.activeOrder.timer_charge = reset ? 0 : finalCharge;
    }
    return { success: true };
  }
}

// ── BILLING ACTIONS ──────────────────────────────────────────────────
export async function generateBill(orderId: string, customerPhone: string | null, customerName: string | null, discount: number, parcelCharge: number, extraCharge: number, extraChargeLabel: string | null) {
  try {
    const result = await billingService.generateBill(orderId, customerPhone, customerName, discount, parcelCharge, extraCharge, extraChargeLabel);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    const table = mockTables.find(t => t.activeOrder?.id === orderId || t.activeOrder?._id === orderId);
    if (table && table.activeOrder) {
      table.activeOrder.status = 'billed';
      table.activeOrder.customer_phone = customerPhone;
      table.activeOrder.customer_name = customerName;
      table.activeOrder.discount = discount;
      table.activeOrder.parcel_charge = parcelCharge;
      table.activeOrder.extra_charge = extraCharge;
      table.activeOrder.extra_charge_label = extraChargeLabel;
      return { order: table.activeOrder };
    }
    return null;
  }
}

export async function getBillByOrderId(orderId: string) {
  try {
    const result = await billingService.getBillByOrderId(orderId);
    return result ? JSON.parse(JSON.stringify(result)) : null;
  } catch (e) {
    return mockBills.find(b => b.order_id === orderId) || null;
  }
}

export async function closeTable(orderId: string, paymentMethod: 'cash' | 'online' | 'split' = 'cash', cashAmount: number = 0, onlineAmount: number = 0, whatsappSent: boolean = false, customerPhone: string | null = null, customerName: string | null = null) {
  try {
    return await billingService.closeTable(orderId, paymentMethod, cashAmount, onlineAmount, whatsappSent, customerPhone, customerName);
  } catch (e) {
    const table = mockTables.find(t => t.activeOrder?.id === orderId || t.activeOrder?._id === orderId);
    if (table) {
      table.status = 'free';
      const o = table.activeOrder;
      if (o) {
        o.status = 'closed';
        o.customer_phone = customerPhone || o.customer_phone;
        o.customer_name = customerName || o.customer_name;
        
        const subtotal = o.totalAmount;
        const discount = o.discount || 0;
        const parcelCharge = o.parcel_charge || 0;
        const extraCharge = o.extra_charge || 0;
        const total = subtotal - discount + parcelCharge + extraCharge;

        const mockBill = {
          id: `mock-bill-${Date.now()}`,
          _id: `mock-bill-${Date.now()}`,
          order_id: orderId,
          customer_phone: o.customer_phone,
          customer_name: o.customer_name,
          subtotal,
          discount,
          parcel_charge: parcelCharge,
          extra_charge: extraCharge,
          extra_charge_label: o.extra_charge_label,
          total,
          payment_method: paymentMethod,
          cash_amount: cashAmount,
          online_amount: onlineAmount,
          whatsapp_sent_at: whatsappSent ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          orders: {
            id: orderId,
            table_id: table.id,
            customer_phone: o.customer_phone,
            tables: {
              id: table.id,
              table_number: table.table_number,
              status: 'free'
            }
          }
        };
        mockBills.push(mockBill);
      }
      table.activeOrder = null;
    }
    return { success: true };
  }
}

export async function getBillHistory() {
  try {
    const result = await billingService.getBillHistory();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return mockBills;
  }
}

export async function deleteBill(billId: string, orderId: string) {
  try {
    return await billingService.deleteBill(billId, orderId);
  } catch (e) {
    mockBills = mockBills.filter(b => b.id !== billId && b._id !== billId);
    return { success: true };
  }
}

export async function getBillWhatsAppLink(billId: string, customPhone?: string) {
  try {
    return await billingService.getBillWhatsAppLink(billId, customPhone);
  } catch (e) {
    const digits = (customPhone || '9999999999').replace(/\D/g, '');
    return `https://wa.me/91${digits}?text=Receipt`;
  }
}

// ── EXPENSE ACTIONS ──────────────────────────────────────────────────
export async function getExpenses() {
  try {
    const result = await expenseService.getExpenses();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return mockExpenses;
  }
}

export async function addExpense(category: 'raw_material' | 'electricity' | 'other' | 'adjustment', amount: number, description: string) {
  try {
    const result = await expenseService.addExpense(category, amount, description);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    const newExpense = {
      id: `mock-expense-${Date.now()}`,
      _id: `mock-expense-${Date.now()}`,
      category,
      amount,
      description,
      created_at: new Date().toISOString()
    };
    mockExpenses.push(newExpense);
    return newExpense;
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    return await expenseService.deleteExpense(expenseId);
  } catch (e) {
    mockExpenses = mockExpenses.filter(ex => ex.id !== expenseId && ex._id !== expenseId);
    return { success: true };
  }
}

// ── ADMIN ACTIONS ────────────────────────────────────────────────────
export async function getDayCloses() {
  try {
    const result = await adminService.getDayCloses();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return mockDayCloses;
  }
}

export async function closeDay(date: string, revenue: number, expenses: number, profit: number, notes: string, cashRevenue: number = 0, onlineRevenue: number = 0) {
  try {
    const result = await adminService.closeDay(date, revenue, expenses, profit, notes, cashRevenue, onlineRevenue);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    const newClose = {
      id: `mock-close-${Date.now()}`,
      _id: `mock-close-${Date.now()}`,
      date,
      revenue,
      expenses,
      profit,
      notes,
      cash_revenue: cashRevenue,
      online_revenue: onlineRevenue,
      created_at: new Date().toISOString()
    };
    mockDayCloses.push(newClose);
    mockDayClosed = true;
    mockDayOpen = false;
    (globalThis as any).__mockDayClosed = true;
    (globalThis as any).__mockDayOpen = false;
    return newClose;
  }
}

export async function isDayClosed(date: string) {
  try {
    return await adminService.isDayClosed(date);
  } catch (e) {
    return mockDayClosed;
  }
}

export async function getDayOpens() {
  try {
    const result = await adminService.getDayOpens();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return mockDayOpens;
  }
}

export async function openDay(date: string, openingCash: number = 0) {
  try {
    const result = await adminService.openDay(date, openingCash);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    const newOpen = {
      id: `mock-open-${Date.now()}`,
      _id: `mock-open-${Date.now()}`,
      date,
      opening_cash: openingCash,
      created_at: new Date().toISOString()
    };
    mockDayOpens.push(newOpen);
    mockDayOpen = true;
    mockDayClosed = false;
    (globalThis as any).__mockDayOpen = true;
    (globalThis as any).__mockDayClosed = false;
    return newOpen;
  }
}

export async function isDayOpen(date: string) {
  try {
    return await adminService.isDayOpen(date);
  } catch (e) {
    return mockDayOpen;
  }
}

export async function reopenDay(date: string) {
  try {
    return await adminService.reopenDay(date);
  } catch (e) {
    mockDayClosed = false;
    (globalThis as any).__mockDayClosed = false;
    mockDayCloses = mockDayCloses.filter(c => c.date !== date);
  }
}

export async function getSystemStatus(date: string) {
  try {
    const result = await adminService.getSystemStatus(date);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return { isOpen: mockDayOpen, isClosed: mockDayClosed, isLocked: !mockDayOpen || mockDayClosed };
  }
}

export async function getOffer() {
  try {
    const result = await adminService.getOffer();
    return result ? JSON.parse(JSON.stringify(result)) : null;
  } catch (e) {
    return mockOffers[0] ?? null;
  }
}

export async function saveOffer(offerData: any) {
  try {
    return await adminService.saveOffer(offerData);
  } catch (e) {
    if (mockOffers.length > 0) Object.assign(mockOffers[0], offerData);
  }
}

export async function getOffers() {
  try {
    const result = await adminService.getOffers();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return mockOffers;
  }
}

export async function createOffer(offerData: any) {
  try {
    const result = await adminService.createOffer(offerData);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    const newOffer = {
      id: `offer-${Date.now()}`,
      _id: `offer-${Date.now()}`,
      ...offerData
    };
    mockOffers.push(newOffer);
    return newOffer;
  }
}

export async function updateOffer(id: string, offerData: any) {
  try {
    const result = await adminService.updateOffer(id, offerData);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    const idx = mockOffers.findIndex(o => o.id === id || o._id === id);
    if (idx > -1) Object.assign(mockOffers[idx], offerData);
    return mockOffers[idx] ?? null;
  }
}

export async function deleteOffer(id: string) {
  try {
    return await adminService.deleteOffer(id);
  } catch (e) {
    mockOffers = mockOffers.filter(o => o.id !== id && o._id !== id);
    return { success: true };
  }
}

export async function getReviews() {
  try {
    const result = await adminService.getReviews();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return [];
  }
}

export async function addReview(reviewData: any) {
  try {
    return await adminService.addReview(reviewData);
  } catch (e) {
    return;
  }
}

export async function verifyPasscode(password: string) {
  try {
    const current = await adminService.getPasscode();
    return current === password;
  } catch (e) {
    // Database connection failed, fallback to default passcode 'cafe7707'
    return password === 'cafe7707';
  }
}

export async function updatePasscode(currentPasscode: string, newPasscode: string) {
  try {
    return await adminService.updatePasscode(currentPasscode, newPasscode);
  } catch (e) {
    // If database connection is offline, we let them know they need MongoDB running to change passcode.
    return { success: false, error: 'Database is offline. Start MongoDB to update passcode.' };
  }
}

export async function verifyOwnerPasscode(password: string) {
  try {
    const current = await adminService.getOwnerPasscode();
    return current === password;
  } catch (e) {
    // Database connection failed, fallback to default passcode 'cafe7707'
    return password === 'cafe7707';
  }
}

export async function updateOwnerPasscode(currentPasscode: string, newPasscode: string) {
  try {
    return await adminService.updateOwnerPasscode(currentPasscode, newPasscode);
  } catch (e) {
    return { success: false, error: 'Database is offline. Start MongoDB to update passcode.' };
  }
}

export async function sync() {
  return Promise.resolve();
}

// ── PIGMY ACTIONS ────────────────────────────────────────────────────
export async function getPigmyAccounts() {
  try {
    const result = await pigmyService.getAccounts();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    const accounts = mockPigmyAccounts.filter(a => !a.isArchived);
    return accounts.map(acc => {
      const txs = mockPigmyTransactions.filter(t => t.accountId === acc.id);
      let balance = 0, totalDeposits = 0, totalWithdrawals = 0, todayDeposit = 0;
      let lastDeposit: string | null = null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      txs.forEach(t => {
        if (t.type === 'deposit' || t.type === 'opening_balance' || t.type === 'adjustment') {
          balance += t.amount;
          if (t.type === 'deposit') {
            totalDeposits += t.amount;
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);
            if (tDate.getTime() === today.getTime()) todayDeposit += t.amount;
            if (!lastDeposit || new Date(t.date) > new Date(lastDeposit)) lastDeposit = t.date;
          }
        } else if (t.type === 'withdrawal') {
          balance -= t.amount;
          totalWithdrawals += t.amount;
        }
      });

      return {
        ...acc,
        currentBalance: balance,
        totalDeposits,
        totalWithdrawals,
        todayDeposit,
        lastDepositAt: lastDeposit
      };
    });
  }
}

export async function getAllPigmyTransactions() {
  try {
    const result = await pigmyService.getAllTransactions();
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    return mockPigmyTransactions;
  }
}

export async function getPigmyAccountDetails(accountId: string) {
  try {
    const result = await pigmyService.getAccountDetails(accountId);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    const acc = mockPigmyAccounts.find(a => a.id === accountId);
    if (!acc) throw new Error('Account not found');

    const txs = mockPigmyTransactions.filter(t => t.accountId === accountId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let balance = 0, totalDeposits = 0, totalWithdrawals = 0;

    const ledger = txs.map(t => {
      if (t.type === 'deposit' || t.type === 'opening_balance' || t.type === 'adjustment') {
        balance += t.amount;
        if (t.type === 'deposit') totalDeposits += t.amount;
      } else if (t.type === 'withdrawal') {
        balance -= t.amount;
        totalWithdrawals += t.amount;
      }
      return { ...t, runningBalance: balance };
    });

    return {
      account: { ...acc, currentBalance: balance, totalDeposits, totalWithdrawals, netSavings: balance, transactionCount: ledger.length },
      ledger: ledger.reverse()
    };
  }
}

export async function createPigmyAccount(name: string) {
  try {
    const result = await pigmyService.createAccount(name);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    const acc = { id: `mock-pigmy-acc-${Date.now()}`, name, isArchived: false, createdAt: new Date().toISOString() };
    mockPigmyAccounts.push(acc);
    return acc;
  }
}

export async function updatePigmyAccount(id: string, name: string) {
  try {
    const result = await pigmyService.updateAccount(id, name);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    const idx = mockPigmyAccounts.findIndex(a => a.id === id);
    if (idx > -1) {
      mockPigmyAccounts[idx].name = name;
      return mockPigmyAccounts[idx];
    }
    throw new Error('Account not found');
  }
}

export async function addPigmyTransaction(data: any) {
  try {
    const result = await pigmyService.addTransaction(data);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    if (data.type === 'withdrawal') {
      const accDetails = await getPigmyAccountDetails(data.accountId);
      if (accDetails.account.currentBalance < data.amount) throw new Error('Insufficient balance');
    }
    const t = { id: `mock-pigmy-tx-${Date.now()}`, ...data, createdAt: new Date().toISOString() };
    mockPigmyTransactions.push(t);
    return t;
  }
}

export async function updatePigmyTransaction(id: string, data: any) {
  try {
    const result = await pigmyService.updateTransaction(id, data);
    return JSON.parse(JSON.stringify(result));
  } catch (e) {
    const idx = mockPigmyTransactions.findIndex(t => t.id === id);
    if (idx > -1) {
      mockPigmyTransactions[idx] = { ...mockPigmyTransactions[idx], ...data, updatedAt: new Date().toISOString() };
      return mockPigmyTransactions[idx];
    }
    throw new Error('Transaction not found');
  }
}

export async function deletePigmyTransaction(id: string) {
  try {
    await pigmyService.deleteTransaction(id);
    return { success: true };
  } catch (e) {
    mockPigmyTransactions = mockPigmyTransactions.filter(t => t.id !== id);
    return { success: true };
  }
}

export async function archivePigmyAccount(id: string) {
  try {
    await pigmyService.archiveAccount(id);
    return { success: true };
  } catch (e) {
    const idx = mockPigmyAccounts.findIndex(a => a.id === id);
    if (idx > -1) mockPigmyAccounts[idx].isArchived = true;
    return { success: true };
  }
}

if (!(globalThis as any).__mockSessions) {
  (globalThis as any).__mockSessions = [];
}
let mockSessions: any[] = (globalThis as any).__mockSessions;

export async function recordLoginSession(deviceInfo: string, ipAddress: string) {
  try {
    const res = await adminService.recordLoginSession(deviceInfo, ipAddress);
    if (res) return res;
  } catch (e) {
    console.warn('[Offline Mode] Recording session offline.');
  }
  const mockId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  mockSessions.unshift({
    id: mockId,
    _id: mockId,
    sessionId: mockId,
    user_role: 'Staff Portal',
    device_info: deviceInfo || 'Unknown Device',
    ip_address: ipAddress || '127.0.0.1',
    login_at: new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    logout_at: null,
    status: 'active'
  });
  return mockId;
}

export async function sendSessionHeartbeat(sessionId: string) {
  if (!sessionId) return { valid: false, forceLogout: false };
  try {
    const res = await adminService.sendSessionHeartbeat(sessionId);
    if (res && typeof res.valid === 'boolean') return res;
  } catch (e) {
    // Offline fallback
  }
  const session = mockSessions.find(s => s.id === sessionId || s.sessionId === sessionId);
  if (!session) return { valid: true, forceLogout: false };
  if (session.status === 'force_logged_out') return { valid: false, forceLogout: true };
  session.last_seen_at = new Date().toISOString();
  return { valid: true, forceLogout: false };
}

export async function recordLogoutSession(sessionId: string) {
  if (!sessionId) return;
  try {
    await adminService.recordLogoutSession(sessionId);
  } catch (e) {
    // ignore
  }
  const session = mockSessions.find(s => s.id === sessionId || s.sessionId === sessionId);
  if (session) {
    session.status = 'logged_out';
    session.logout_at = new Date().toISOString();
  }
}

export async function forceLogoutSession(sessionId: string) {
  if (!sessionId) return;
  try {
    await adminService.forceLogoutSession(sessionId);
  } catch (e) {
    // ignore
  }
  const session = mockSessions.find(s => s.id === sessionId || s.sessionId === sessionId);
  if (session) {
    session.status = 'force_logged_out';
    session.logout_at = new Date().toISOString();
  }
}

export async function getLoginSessions() {
  try {
    const result = await adminService.getLoginSessions();
    if (Array.isArray(result)) {
      return JSON.parse(JSON.stringify(result));
    }
  } catch (e) {
    // ignore
  }
  const now = Date.now();
  mockSessions.forEach(s => {
    if (s.status === 'active' && now - new Date(s.last_seen_at).getTime() > 5 * 60 * 1000) {
      s.status = 'expired';
    }
  });
  return JSON.parse(JSON.stringify(mockSessions));
}

export async function clearLoginHistory() {
  try {
    await adminService.clearLoginHistory();
  } catch (e) {
    // ignore
  }
  mockSessions = mockSessions.filter(s => s.status === 'active');
  (globalThis as any).__mockSessions = mockSessions;
}
