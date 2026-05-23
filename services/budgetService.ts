import { supabase } from './supabase';
import { Status } from '@/types';

export interface BudgetSession {
  id: string;
  user_id: string;
  amount: number;
  spent: number;
  status: 'active' | 'completed';
  created_at: string;
  completed_at: string | null;
}

export interface BudgetPurchase {
  id: string;
  session_id: string;
  item_id: string;
  price: number;
  previous_status: Status;
  created_at: string;
}

export const budgetService = {
  async getActive(userId: string): Promise<BudgetSession | null> {
    const { data, error } = await supabase
      .from('budget_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(userId: string, amount: number): Promise<BudgetSession> {
    const { data, error } = await supabase
      .from('budget_sessions')
      .insert({ user_id: userId, amount, spent: 0, status: 'active' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPurchases(sessionId: string): Promise<BudgetPurchase[]> {
    const { data, error } = await supabase
      .from('budget_purchases')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addPurchase(
    sessionId: string,
    itemId: string,
    price: number,
    previousStatus: Status,
  ): Promise<{ purchase: BudgetPurchase; session: BudgetSession }> {
    const { data: purchase, error: purchaseError } = await supabase
      .from('budget_purchases')
      .insert({
        session_id: sessionId,
        item_id: itemId,
        price,
        previous_status: previousStatus,
      })
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    const { data: current, error: currentError } = await supabase
      .from('budget_sessions')
      .select('spent')
      .eq('id', sessionId)
      .single();

    if (currentError) throw currentError;

    const newSpent = (current?.spent || 0) + price;

    const { data: updatedSession, error: updateError } = await supabase
      .from('budget_sessions')
      .update({ spent: newSpent })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { purchase, session: updatedSession };
  },

  async removePurchase(purchaseId: string, sessionId: string, price: number): Promise<BudgetSession> {
    const { error: deleteError } = await supabase
      .from('budget_purchases')
      .delete()
      .eq('id', purchaseId);

    if (deleteError) throw deleteError;

    const { data: current, error: currentError } = await supabase
      .from('budget_sessions')
      .select('spent')
      .eq('id', sessionId)
      .single();

    if (currentError) throw currentError;

    const newSpent = Math.max(0, (current?.spent || 0) - price);

    const { data: updatedSession, error: updateError } = await supabase
      .from('budget_sessions')
      .update({ spent: newSpent })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) throw updateError;

    return updatedSession;
  },

  async complete(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('budget_sessions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) throw error;
  },
};
