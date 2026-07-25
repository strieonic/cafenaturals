import mongoose from 'mongoose';
import dbConnect from '../lib/mongodb';
import DayClose from '../models/DayClose';
import DayOpen from '../models/DayOpen';
import Offer from '../models/Offer';
import Review from '../models/Review';
import SystemConfig from '../models/SystemConfig';
import LoginLog from '../models/LoginLog';

export const adminService = {
  async getDayCloses(): Promise<any[]> {
    await dbConnect();
    const dcs = await DayClose.find({}).sort({ created_at: -1 }).lean();
    return dcs.map(dc => ({
      ...dc,
      id: dc._id.toString()
    }));
  },

  async closeDay(
    date: string,
    revenue: number,
    expenses: number,
    profit: number,
    notes: string,
    cashRevenue: number = 0,
    onlineRevenue: number = 0
  ): Promise<any> {
    await dbConnect();
    
    const exists = await DayClose.findOne({ date });
    if (exists) {
      throw new Error(`Day ${date} is already closed.`);
    }

    const dc = await DayClose.create({
      date,
      revenue,
      expenses,
      profit,
      notes,
      cash_revenue: cashRevenue,
      online_revenue: onlineRevenue
    });
    
    return { ...dc.toObject(), id: dc._id.toString() };
  },

  async isDayClosed(date: string): Promise<boolean> {
    await dbConnect();
    const dc = await DayClose.findOne({ date }).lean();
    return !!dc;
  },

  async getDayOpens(): Promise<any[]> {
    await dbConnect();
    const dos = await DayOpen.find({}).sort({ created_at: -1 }).lean();
    return dos.map(d => ({
      ...d,
      id: d._id.toString()
    }));
  },

  async openDay(date: string, openingCash: number = 0): Promise<any> {
    await dbConnect();
    const exists = await DayOpen.findOne({ date });
    if (exists) {
      throw new Error(`Day ${date} is already open.`);
    }
    const d = await DayOpen.create({ date, opening_cash: openingCash });
    return { ...d.toObject(), id: d._id.toString() };
  },

  async isDayOpen(date: string): Promise<boolean> {
    await dbConnect();
    const d = await DayOpen.findOne({ date }).lean();
    return !!d;
  },

  async reopenDay(date: string): Promise<void> {
    await dbConnect();
    await DayClose.deleteOne({ date });
  },

  async getSystemStatus(date: string): Promise<{ isOpen: boolean; isClosed: boolean; isLocked: boolean }> {
    await dbConnect();
    const [openDoc, closeDoc] = await Promise.all([
      DayOpen.findOne({ date }).lean(),
      DayClose.findOne({ date }).lean()
    ]);
    const isOpen = !!openDoc;
    const isClosed = !!closeDoc;
    // Locked if not opened yet, OR if already closed.
    const isLocked = !isOpen || isClosed;
    return { isOpen, isClosed, isLocked };
  },

  async getOffer(): Promise<any | null> {
    await dbConnect();
    const offer = await Offer.findOne({}).sort({ updatedAt: -1 }).lean();
    if (!offer) return null;
    return { ...offer, id: (offer._id as any).toString() };
  },

  async saveOffer(offerData: any): Promise<void> {
    await dbConnect();
    // Delete existing offers to maintain single active offer
    await Offer.deleteMany({});
    await Offer.create(offerData);
  },

  async getOffers(): Promise<any[]> {
    await dbConnect();
    const offers = await Offer.find({}).sort({ updatedAt: -1 }).lean();
    return offers.map(o => ({ ...o, id: (o._id as any).toString() }));
  },

  async createOffer(offerData: any): Promise<any> {
    await dbConnect();
    const offer = await Offer.create(offerData);
    return { ...offer.toObject(), id: offer._id.toString() };
  },

  async updateOffer(id: string, offerData: any): Promise<any> {
    await dbConnect();
    const updated = await Offer.findByIdAndUpdate(id, offerData, { new: true, runValidators: true }).lean();
    if (!updated) throw new Error('Offer not found');
    return { ...updated, id: (updated._id as any).toString() };
  },

  async deleteOffer(id: string): Promise<void> {
    await dbConnect();
    await Offer.findByIdAndDelete(id);
  },

  async getReviews(): Promise<any[]> {
    await dbConnect();
    const reviews = await Review.find({}).sort({ created_at: -1 }).lean();
    return reviews.map(r => ({
      ...r,
      id: r._id.toString()
    }));
  },

  async addReview(reviewData: { rating: number; comment: string; table_number: number | null }): Promise<void> {
    await dbConnect();
    await Review.create(reviewData);
  },

  async getPasscode(): Promise<string> {
    await dbConnect();
    const config = await SystemConfig.findOne({ key: 'passcode' }).lean();
    return config ? config.value : 'cafe7707';
  },

  async updatePasscode(oldPasscode: string, newPasscode: string): Promise<{ success: boolean; error: string | null }> {
    await dbConnect();
    const current = await this.getPasscode();
    if (current !== oldPasscode) {
      return { success: false, error: 'Current passcode is incorrect.' };
    }
    if (!newPasscode || newPasscode.trim().length < 4) {
      return { success: false, error: 'Passcode must be at least 4 characters long.' };
    }
    await SystemConfig.updateOne(
      { key: 'passcode' },
      { value: newPasscode },
      { upsert: true }
    );
    return { success: true, error: null };
  },

  async getOwnerPasscode(): Promise<string> {
    await dbConnect();
    const config = await SystemConfig.findOne({ key: 'owner_passcode' }).lean();
    return config ? config.value : 'cafe7707';
  },

  async updateOwnerPasscode(oldPasscode: string, newPasscode: string): Promise<{ success: boolean; error: string | null }> {
    await dbConnect();
    const current = await this.getOwnerPasscode();
    if (current !== oldPasscode) {
      return { success: false, error: 'Current passcode is incorrect.' };
    }
    if (!newPasscode || newPasscode.trim().length < 4) {
      return { success: false, error: 'Passcode must be at least 4 characters long.' };
    }
    await SystemConfig.updateOne(
      { key: 'owner_passcode' },
      { value: newPasscode },
      { upsert: true }
    );
    return { success: true, error: null };
  },

  async recordLoginSession(deviceInfo: string, ipAddress: string): Promise<string> {
    await dbConnect();
    const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const session = await LoginLog.create({
      sessionId: newSessionId,
      user_role: 'Staff Portal',
      device_info: deviceInfo || 'Unknown Device',
      ip_address: ipAddress || 'Local Network',
      login_at: new Date(),
      last_seen_at: new Date(),
      status: 'active'
    });
    return session.sessionId || session._id.toString();
  },

  async sendSessionHeartbeat(sessionId: string): Promise<{ valid: boolean; forceLogout: boolean }> {
    if (!sessionId) return { valid: false, forceLogout: false };
    await dbConnect();
    const session = await LoginLog.findOne({
      $or: [
        { sessionId: sessionId },
        { _id: mongoose.Types.ObjectId.isValid(sessionId) ? sessionId : null }
      ]
    });
    if (!session) return { valid: false, forceLogout: false };

    if (session.status === 'force_logged_out') {
      return { valid: false, forceLogout: true };
    }

    if (session.status !== 'active') {
      return { valid: false, forceLogout: false };
    }

    session.last_seen_at = new Date();
    await session.save();
    return { valid: true, forceLogout: false };
  },

  async recordLogoutSession(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await dbConnect();
    await LoginLog.updateMany(
      {
        $or: [
          { sessionId: sessionId },
          { _id: mongoose.Types.ObjectId.isValid(sessionId) ? sessionId : null }
        ]
      },
      {
        $set: {
          status: 'logged_out',
          logout_at: new Date()
        }
      }
    );
  },

  async forceLogoutSession(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await dbConnect();
    await LoginLog.updateMany(
      {
        $or: [
          { sessionId: sessionId },
          { _id: mongoose.Types.ObjectId.isValid(sessionId) ? sessionId : null }
        ]
      },
      {
        $set: {
          status: 'force_logged_out',
          logout_at: new Date()
        }
      }
    );
  },

  async getLoginSessions(): Promise<any[]> {
    await dbConnect();
    const now = Date.now();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);

    // Auto-expire active sessions that missed heartbeats for over 5 minutes
    await LoginLog.updateMany(
      { status: 'active', last_seen_at: { $lt: fiveMinutesAgo } },
      { $set: { status: 'expired' } }
    );

    const logs = await LoginLog.find({}).sort({ login_at: -1 }).limit(100).lean();
    return logs.map(l => {
      const idStr = l.sessionId || l._id.toString();
      return {
        ...l,
        id: idStr,
        _id: l._id.toString(),
        sessionId: idStr
      };
    });
  },

  async clearLoginHistory(): Promise<void> {
    await dbConnect();
    await LoginLog.deleteMany({ status: { $ne: 'active' } });
  }
};
