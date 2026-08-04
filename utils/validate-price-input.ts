import { PriceValidationResult } from '@/types';

export function validatePriceInput(input: string): PriceValidationResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { valid: true, value: null };
  }
  const num = parseInt(trimmed, 10);
  if (isNaN(num) || num <= 0 || num > 99_999_999 || String(num) !== trimmed) {
    return { valid: false, value: null };
  }
  return { valid: true, value: num };
}
