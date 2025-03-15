import { format, parseISO } from 'date-fns';
import { Currency } from '@/types';

export const formatCurrency = (amount: number, currency: Currency = 'USD'): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

export const formatDate = (dateString: string, formatStr: string = 'MMM d, yyyy'): string => {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export const getCurrencySymbol = (currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    ILS: '₪',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
  };
  
  return symbols[currency] || '$';
};

export const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'ILS', label: 'Israeli Shekel (₪)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
]; 