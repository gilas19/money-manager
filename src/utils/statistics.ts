import { Transaction, Category, CategoryWithTransactions, MonthlyStats } from '@/types';

export const calculateMonthlyStats = (
  transactions: Transaction[],
  categories: Category[]
): MonthlyStats => {
  // Calculate total expenses and income
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate balance
  const balance = totalIncome - totalExpenses;
  
  // Calculate category statistics
  const categoriesMap = new Map<string, { 
    category: Category; 
    totalAmount: number;
  }>();
  
  // Initialize categories map
  categories.forEach(category => {
    categoriesMap.set(category.id, {
      category,
      totalAmount: 0
    });
  });
  
  // Calculate total amount per category
  transactions
    .filter(t => t.type === 'expense')
    .forEach(transaction => {
      const categoryData = categoriesMap.get(transaction.categoryId);
      
      if (categoryData) {
        categoryData.totalAmount += transaction.amount;
      } else {
        // Handle transactions with unknown category
        const unknownCategory = categories.find(c => c.name === 'Unknown') || {
          id: 'unknown',
          name: 'Unknown',
          emoji: '❓',
          userId: transaction.userId
        };
        
        categoriesMap.set('unknown', {
          category: unknownCategory,
          totalAmount: transaction.amount
        });
      }
    });
  
  // Convert to array and calculate percentages
  const categoriesStats: CategoryWithTransactions[] = Array.from(categoriesMap.values())
    .filter(({ totalAmount }) => totalAmount > 0) // Only include categories with expenses
    .map(({ category, totalAmount }) => ({
      ...category,
      totalAmount,
      percentage: totalExpenses > 0 ? (totalAmount / totalExpenses) * 100 : 0
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount); // Sort by amount (descending)
  
  return {
    totalExpenses,
    totalIncome,
    balance,
    categoriesStats
  };
};

export const getTopCategories = (
  categoriesStats: CategoryWithTransactions[],
  limit: number = 5
): CategoryWithTransactions[] => {
  return categoriesStats.slice(0, limit);
};

export const getRecentTransactions = (
  transactions: Transaction[],
  limit: number = 5
): Transaction[] => {
  return [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}; 