import { supabase } from './supabase';
import { FridgeItem, Status } from '@/types';

interface CreateFridgeItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  price?: number | null;
  purchase_date?: string | null;
  store_name?: string | null;
  expiry_date?: string | null;
  status?: Status;
  avg_days_per_unit?: number | null;
  total_consumed?: number;
}

interface UpdateFridgeItem extends Partial<CreateFridgeItem> {}

export const fridgeService = {
  async getByUser(userId: string): Promise<FridgeItem[]> {
    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(userId: string, item: CreateFridgeItem): Promise<FridgeItem> {
    const { data, error } = await supabase
      .from('fridge_items')
      .insert({
        user_id: userId,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        price: item.price ?? null,
        purchase_date: item.purchase_date || null,
        store_name: item.store_name || null,
        expiry_date: item.expiry_date || null,
        status: item.status ?? 'available',
        avg_days_per_unit: item.avg_days_per_unit ?? null,
        total_consumed: item.total_consumed ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, item: UpdateFridgeItem): Promise<FridgeItem> {
    const { data, error } = await supabase
      .from('fridge_items')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<FridgeItem | null> {
    const { data, error } = await supabase
      .from('fridge_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('fridge_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};