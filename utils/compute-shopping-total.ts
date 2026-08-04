import { FridgeItem } from '@/types';

export function computeShoppingTotal(items: FridgeItem[]): number {
  return items.reduce((sum, item) => sum + (item.price || 0), 0);
}
