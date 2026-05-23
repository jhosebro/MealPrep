import { create } from 'zustand';
import { Status } from '@/types';
import { budgetService, BudgetSession, BudgetPurchase } from '@/services/budgetService';
import { fridgeService } from '@/services/fridgeService';

interface BudgetState {
  session: BudgetSession | null;
  purchases: BudgetPurchase[];
  loading: boolean;
  error: string | null;
  fetchActive: (userId: string) => Promise<void>;
  startBudget: (userId: string, amount: number) => Promise<void>;
  markBought: (sessionId: string, itemId: string, price: number, prevStatus: Status) => Promise<{ purchaseId: string; spent: number }>;
  undoPurchase: (purchase: BudgetPurchase) => Promise<void>;
  finishShopping: (sessionId: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  session: null,
  purchases: [],
  loading: false,
  error: null,

  fetchActive: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const session = await budgetService.getActive(userId);
      let purchases: BudgetPurchase[] = [];
      if (session) {
        purchases = await budgetService.getPurchases(session.id);
      }
      set({ session, purchases, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  startBudget: async (userId: string, amount: number) => {
    set({ loading: true, error: null });
    try {
      const session = await budgetService.create(userId, amount);
      set({ session, purchases: [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  markBought: async (sessionId, itemId, price, prevStatus) => {
    set({ loading: true, error: null });
    try {
      const today = new Date().toISOString().split('T')[0];
      await fridgeService.update(itemId, { status: 'available', purchase_date: today });

      const { purchase, session } = await budgetService.addPurchase(
        sessionId, itemId, price, prevStatus,
      );

      set((state) => ({
        purchases: [purchase, ...state.purchases],
        session,
        loading: false,
      }));

      return { purchaseId: purchase.id, spent: session.spent };
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  undoPurchase: async (purchase) => {
    set({ loading: true, error: null });
    try {
      await fridgeService.update(purchase.item_id, {
        status: purchase.previous_status,
      });

      const updatedSession = await budgetService.removePurchase(
        purchase.id, purchase.session_id, purchase.price,
      );

      set((state) => ({
        purchases: state.purchases.filter((p) => p.id !== purchase.id),
        session: updatedSession,
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  finishShopping: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      await budgetService.complete(sessionId);
      set({ session: null, purchases: [], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },
}));
