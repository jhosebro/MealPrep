import { create } from 'zustand';
import { FridgeItem } from '@/types';
import { fridgeService } from '@/services/fridgeService';

interface FridgeState {
  items: FridgeItem[];
  loading: boolean;
  error: string | null;
  fetchItems: (userId: string) => Promise<void>;
  addItem: (userId: string, item: Omit<FridgeItem, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateItem: (id: string, item: Partial<FridgeItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getIngredientNames: () => string[];
}

export const useFridgeStore = create<FridgeState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const items = await fridgeService.getByUser(userId);
      set({ items, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addItem: async (userId, item) => {
    set({ loading: true, error: null });
    try {
      const newItem = await fridgeService.create(userId, item);
      set((state) => ({
        items: [newItem, ...state.items],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateItem: async (id, item) => {
    set({ loading: true, error: null });
    try {
      const updated = await fridgeService.update(id, item);
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? updated : i)),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteItem: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await fridgeService.delete(id);
      set((state) => ({
        items: state.items.filter((i) => i.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  getIngredientNames: () => {
    return get().items.map((item) => item.name);
  },
}));