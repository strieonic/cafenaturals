import dbConnect from '../lib/mongodb';
import PigmyAccount from '../models/PigmyAccount';
import PigmyTransaction from '../models/PigmyTransaction';
import mongoose from 'mongoose';

export const pigmyService = {
  async getAccounts(): Promise<any[]> {
    await dbConnect();
    
    const accounts = await PigmyAccount.find({ isArchived: false }).lean();
    const accountsWithStats = await Promise.all(accounts.map(async (acc: any) => {
      const transactions = await PigmyTransaction.find({ accountId: acc._id }).sort({ date: 1 }).lean();
      
      let balance = 0;
      let totalDeposits = 0;
      let totalWithdrawals = 0;
      let todayDeposit = 0;
      let lastDeposit: Date | null = null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const t of transactions) {
        if (t.type === 'deposit' || t.type === 'opening_balance' || t.type === 'adjustment') {
          // Simplification: adjustment adds/subtracts depending on context, but let's assume adjustments are positive if amount > 0?
          // Actually, amount is positive. For adjustment, we could just replace the balance, but standard ledger means adjustment is a delta.
          // Let's treat adjustment as addition if amount > 0, but user requested 'amount > 0' only.
          // Wait, user specs: "Adjustment: Admin correction. Yellow".
          // If we need to reduce balance via adjustment, amount could be negative? Spec says "Amount Must be > 0".
          // So if adjustment is needed, they use Deposit or Withdrawal type, or Adjustment is just a positive delta.
          // For simplicity, deposit & opening_balance add to balance. Withdrawal subtracts.
          // Let's assume adjustment can be either, but let's make it add for now, or just not affect totalDeposits stat.
          balance += t.amount;
          if (t.type === 'deposit') {
            totalDeposits += t.amount;
            const tDate = new Date(t.date);
            tDate.setHours(0, 0, 0, 0);
            if (tDate.getTime() === today.getTime()) {
              todayDeposit += t.amount;
            }
            if (!lastDeposit || new Date(t.date) > lastDeposit) {
              lastDeposit = new Date(t.date);
            }
          }
        } else if (t.type === 'withdrawal') {
          balance -= t.amount;
          totalWithdrawals += t.amount;
        }
      }

      return {
        ...acc,
        id: acc._id.toString(),
        currentBalance: balance,
        totalDeposits,
        totalWithdrawals,
        todayDeposit,
        lastDepositAt: lastDeposit ? lastDeposit.toISOString() : null
      };
    }));

    return accountsWithStats;
  },

  async getAllTransactions(): Promise<any[]> {
    await dbConnect();
    const txs = await PigmyTransaction.find({}).sort({ date: 1, createdAt: 1 }).lean();
    // We need the account name for the UI log.
    const accounts = await PigmyAccount.find({}).lean();
    const accountMap = accounts.reduce((map: any, acc: any) => {
      map[acc._id.toString()] = acc.name;
      return map;
    }, {});

    return txs.map((t: any) => ({
      ...t,
      id: t._id.toString(),
      accountId: t.accountId.toString(),
      accountName: accountMap[t.accountId.toString()] || 'Unknown'
    }));
  },

  async getAccountDetails(accountId: string): Promise<any> {
    await dbConnect();
    const acc = await PigmyAccount.findById(accountId).lean();
    if (!acc) throw new Error('Account not found');

    const transactions = await PigmyTransaction.find({ accountId }).sort({ date: 1, createdAt: 1 }).lean();
    
    let balance = 0;
    let totalDeposits = 0;
    let totalWithdrawals = 0;

    const ledger = transactions.map((t: any) => {
      if (t.type === 'deposit' || t.type === 'opening_balance' || t.type === 'adjustment') {
        balance += t.amount;
        if (t.type === 'deposit') totalDeposits += t.amount;
      } else if (t.type === 'withdrawal') {
        balance -= t.amount;
        totalWithdrawals += t.amount;
      }
      return {
        ...t,
        id: t._id.toString(),
        runningBalance: balance,
        accountId: t.accountId.toString()
      };
    });

    return {
      account: {
        ...acc,
        id: acc._id.toString(),
        currentBalance: balance,
        totalDeposits,
        totalWithdrawals,
        netSavings: balance,
        transactionCount: ledger.length
      },
      ledger: ledger.reverse() // Newest first for UI
    };
  },

  async createAccount(name: string): Promise<any> {
    await dbConnect();
    const acc = await PigmyAccount.create({ name });
    return { ...acc.toObject(), id: acc._id.toString() };
  },

  async updateAccount(id: string, name: string): Promise<any> {
    await dbConnect();
    const acc = await PigmyAccount.findByIdAndUpdate(id, { name }, { new: true }).lean();
    if (!acc) throw new Error('Account not found');
    return { ...acc, id: acc._id.toString() };
  },

  async addTransaction(data: any): Promise<any> {
    await dbConnect();
    // Verification: if withdrawal, check balance
    if (data.type === 'withdrawal') {
      const details = await this.getAccountDetails(data.accountId);
      if (details.account.currentBalance < data.amount) {
        throw new Error(`Insufficient balance. Current balance is ₹${details.account.currentBalance}`);
      }
    }
    const t = await PigmyTransaction.create(data);
    return { ...t.toObject(), id: t._id.toString() };
  },

  async updateTransaction(id: string, data: any): Promise<any> {
    await dbConnect();
    const t = await PigmyTransaction.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!t) throw new Error('Transaction not found');
    return { ...t, id: t._id.toString() };
  },

  async deleteTransaction(id: string): Promise<void> {
    await dbConnect();
    await PigmyTransaction.findByIdAndDelete(id);
  },
  
  async archiveAccount(id: string): Promise<void> {
    await dbConnect();
    await PigmyAccount.findByIdAndUpdate(id, { isArchived: true });
  }
};
