export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  currency: string;
  households: string[];
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  userId: string;
  isDefault?: boolean;
  color?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string;
  userId: string;
  type: 'income' | 'expense';
  householdId?: string;
  splitInfo?: TransactionSplit[];
  isSplitPortion?: boolean;
  mainTransactionId?: string;
}

export interface TransactionSplit {
  userId: string;
  amount: number;
  percentage: number;
}

export interface Household {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  invitedEmails: string[];
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'ILS' | 'JPY' | 'CAD' | 'AUD';

export interface CategoryWithTransactions extends Category {
  totalAmount: number;
  percentage: number;
}

export interface TransactionWithCategory extends Transaction {
  category: Category;
}

export interface MonthlyStats {
  totalExpenses: number;
  totalIncome: number;
  balance: number;
  categoriesStats: CategoryWithTransactions[];
}

export interface FilterOptions {
  startDate?: Date;
  endDate?: Date;
  categoryIds?: string[];
  type?: 'income' | 'expense' | 'all';
  householdId?: string;
  search?: string;
} 