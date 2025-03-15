import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  serverTimestamp,
  or,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction, FilterOptions, TransactionWithCategory, Category } from '@/types';
import { startOfMonth, endOfMonth } from 'date-fns';
import { useHouseholdStore } from './householdStore';
import { Firestore } from 'firebase/firestore';

interface TransactionState {
  transactions: Transaction[];
  filteredTransactions: TransactionWithCategory[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  filterOptions: FilterOptions;
  
  // Actions
  fetchTransactions: (userId: string, householdId?: string) => Promise<void>;
  fetchCategories: (userId: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setFilterOptions: (options: Partial<FilterOptions>) => void;
  getFilteredTransactions: () => TransactionWithCategory[];
  getMonthlyTransactions: (userId: string, date?: Date) => Promise<Transaction[]>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  filteredTransactions: [],
  categories: [],
  isLoading: false,
  error: null,
  filterOptions: {
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    type: 'all',
  },
  
  fetchTransactions: async (userId: string, householdId?: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      try {
        // Try with the composite index first (requires index)
        const transactionsRef = collection(db as Firestore, 'transactions');
        
        let q;
        
        if (householdId) {
          // If householdId is provided, fetch both user's personal transactions and household transactions
          q = query(
            transactionsRef,
            or(
              where('userId', '==', userId),
              where('householdId', '==', householdId)
            ),
            orderBy('date', 'desc')
          );
        } else {
          // Otherwise, just fetch user's personal transactions
          q = query(
            transactionsRef, 
            where('userId', '==', userId),
            orderBy('date', 'desc')
          );
        }
        
        const querySnapshot = await getDocs(q);
        const transactions: Transaction[] = [];
        
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data();
            // Ensure all required fields exist and have the correct type
            if (data && typeof data.amount === 'number' && typeof data.description === 'string') {
              transactions.push({ 
                id: doc.id, 
                amount: data.amount || 0,
                description: data.description || '',
                date: data.date || new Date().toISOString(),
                categoryId: data.categoryId || '',
                userId: data.userId || '',
                type: data.type === 'income' ? 'income' : 'expense',
                ...(data.householdId ? { householdId: data.householdId } : {}),
                ...(data.splitInfo && Array.isArray(data.splitInfo) ? { splitInfo: data.splitInfo } : {}),
                ...(data.isSplitPortion ? { isSplitPortion: data.isSplitPortion } : {}),
                ...(data.mainTransactionId ? { mainTransactionId: data.mainTransactionId } : {})
              });
            }
          } catch (docError) {
            console.error('Error processing transaction document:', docError, doc.id);
            // Skip this document and continue with others
          }
        });
        
        set({ transactions, isLoading: false });
        get().getFilteredTransactions();
      } catch (indexError) {
        console.error('Index error, falling back to client-side sorting:', indexError);
        
        // Fallback to a simpler query if the index doesn't exist yet
        const transactionsRef = collection(db as Firestore, 'transactions');
        
        // Fetch all transactions for the user and for the household (if provided)
        const userTransactionsQuery = query(
          transactionsRef, 
          where('userId', '==', userId)
        );
        
        const userQuerySnapshot = await getDocs(userTransactionsQuery);
        const transactions: Transaction[] = [];
        
        userQuerySnapshot.forEach((doc) => {
          try {
            const data = doc.data();
            if (data && typeof data.amount === 'number' && typeof data.description === 'string') {
              transactions.push({ 
                id: doc.id, 
                amount: data.amount || 0,
                description: data.description || '',
                date: data.date || new Date().toISOString(),
                categoryId: data.categoryId || '',
                userId: data.userId || '',
                type: data.type === 'income' ? 'income' : 'expense',
                ...(data.householdId ? { householdId: data.householdId } : {}),
                ...(data.splitInfo && Array.isArray(data.splitInfo) ? { splitInfo: data.splitInfo } : {}),
                ...(data.isSplitPortion ? { isSplitPortion: data.isSplitPortion } : {}),
                ...(data.mainTransactionId ? { mainTransactionId: data.mainTransactionId } : {})
              });
            }
          } catch (docError) {
            console.error('Error processing transaction document:', docError, doc.id);
            // Skip this document and continue with others
          }
        });
        
        // If householdId is provided, also fetch household transactions
        if (householdId) {
          try {
            const householdTransactionsQuery = query(
              transactionsRef, 
              where('householdId', '==', householdId)
            );
            
            const householdQuerySnapshot = await getDocs(householdTransactionsQuery);
            
            householdQuerySnapshot.forEach((doc) => {
              try {
                // Skip if this transaction is already in the array (user's own transaction)
                if (transactions.some(t => t.id === doc.id)) {
                  return;
                }
                
                const data = doc.data();
                if (data && typeof data.amount === 'number' && typeof data.description === 'string') {
                  transactions.push({ 
                    id: doc.id, 
                    amount: data.amount || 0,
                    description: data.description || '',
                    date: data.date || new Date().toISOString(),
                    categoryId: data.categoryId || '',
                    userId: data.userId || '',
                    type: data.type === 'income' ? 'income' : 'expense',
                    householdId: data.householdId,
                    ...(data.splitInfo && Array.isArray(data.splitInfo) ? { splitInfo: data.splitInfo } : {}),
                    ...(data.isSplitPortion ? { isSplitPortion: data.isSplitPortion } : {}),
                    ...(data.mainTransactionId ? { mainTransactionId: data.mainTransactionId } : {})
                  });
                }
              } catch (docError) {
                console.error('Error processing household transaction document:', docError, doc.id);
                // Skip this document and continue with others
              }
            });
          } catch (householdError) {
            console.error('Error fetching household transactions:', householdError);
            // Continue with user transactions even if household transactions fail
          }
        }
        
        // Sort by date on the client side
        transactions.sort((a, b) => {
          try {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          } catch (sortError) {
            console.error('Error sorting transactions:', sortError);
            return 0; // Keep original order if sort fails
          }
        });
        
        set({ transactions, isLoading: false });
        get().getFilteredTransactions();
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      set({ error: 'Failed to fetch transactions', isLoading: false });
    }
  },
  
  fetchCategories: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const categoriesRef = collection(db, 'categories');
      const q = query(
        categoriesRef, 
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const categories: Category[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data && typeof data.name === 'string') {
          categories.push({ 
            id: doc.id, 
            name: data.name,
            emoji: data.emoji || '❓',
            userId: data.userId,
            color: data.color || '#999'
          });
        }
      });
      
      set({ categories, isLoading: false });
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ error: 'Failed to fetch categories', isLoading: false });
    }
  },
  
  addTransaction: async (transaction) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      if (!transaction.userId) {
        throw new Error('User ID is required');
      }
      
      // Ensure transaction data is properly formatted for Firestore
      const sanitizedTransaction = {
        amount: Number(transaction.amount) || 0,
        description: String(transaction.description || '').trim(),
        date: transaction.date || new Date().toISOString(),
        categoryId: String(transaction.categoryId || ''),
        userId: String(transaction.userId || ''),
        type: transaction.type === 'income' ? 'income' : 'expense',
        createdAt: serverTimestamp(), // Add server timestamp
        // Only include householdId if it's defined and not empty
        ...(transaction.householdId ? { householdId: String(transaction.householdId) } : {}),
        // Include splitInfo if it exists and is valid
        ...(transaction.splitInfo && 
           Array.isArray(transaction.splitInfo) && 
           transaction.splitInfo.length > 0 ? { 
          splitInfo: transaction.splitInfo
            .filter(split => split && split.userId) // Filter out invalid splits
            .map(split => ({
              userId: String(split.userId),
              amount: Number(split.amount) || 0,
              percentage: Number(split.percentage) || 0
            }))
        } : {})
      };
      
      const transactionsRef = collection(db as Firestore, 'transactions');
      
      // If this is a split transaction, create individual transactions for each user
      if (transaction.householdId && 
          transaction.splitInfo && 
          Array.isArray(transaction.splitInfo) && 
          transaction.splitInfo.length > 0) {
        
        // First, create the main household transaction
        const mainTransactionRef = await addDoc(transactionsRef, sanitizedTransaction);
        const mainTransactionId = mainTransactionRef.id;
        
        // Validate that split amounts add up to the total amount
        const totalSplitAmount = transaction.splitInfo.reduce((sum, split) => 
          sum + (Number(split.amount) || 0), 0);
        
        // Round to 2 decimal places to avoid floating point comparison issues
        const totalAmount = Math.round(Number(transaction.amount) * 100) / 100;
        const roundedSplitAmount = Math.round(totalSplitAmount * 100) / 100;
        
        // If split amounts don't match the total, adjust them proportionally
        let adjustedSplitInfo = [...transaction.splitInfo];
        if (Math.abs(totalAmount - roundedSplitAmount) > 0.01) {
          const ratio = totalAmount / (roundedSplitAmount || 1); // Avoid division by zero
          adjustedSplitInfo = transaction.splitInfo.map(split => ({
            ...split,
            amount: Math.round((Number(split.amount) || 0) * ratio * 100) / 100
          }));
        }
        
        // Then create individual transactions for each user with their portion
        const splitPromises = adjustedSplitInfo
          .filter(split => split && split.userId && split.userId !== transaction.userId && split.amount > 0) // Skip invalid splits, the creator, and zero amounts
          .map(async (split) => {
            try {
              const userTransaction = {
                amount: Number(split.amount) || 0,
                description: String(transaction.description || '').trim(),
                date: transaction.date || new Date().toISOString(),
                categoryId: String(transaction.categoryId || ''),
                userId: String(split.userId),
                type: transaction.type === 'income' ? 'income' : 'expense',
                createdAt: serverTimestamp(),
                householdId: String(transaction.householdId),
                // Reference to the main transaction
                mainTransactionId: mainTransactionId,
                // Flag to indicate this is a split portion
                isSplitPortion: true
              };
              
              await addDoc(transactionsRef, userTransaction);
            } catch (splitError) {
              console.error('Error creating split portion:', splitError);
              // Continue with other splits even if one fails
            }
          });
        
        await Promise.all(splitPromises);
      } else {
        // If not a split transaction, just add it normally
        await addDoc(transactionsRef, sanitizedTransaction);
      }
      
      // Refresh transactions
      await get().fetchTransactions(transaction.userId);
    } catch (error) {
      console.error('Error adding transaction:', error);
      set({ error: 'Failed to add transaction', isLoading: false });
    }
  },
  
  updateTransaction: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      if (!id) {
        throw new Error('Transaction ID is required');
      }
      
      // Get the current transaction to check if it's a main household transaction
      const transactionRef = doc(db as Firestore, 'transactions', id);
      const transactionSnap = await getDoc(transactionRef);
      
      if (!transactionSnap.exists()) {
        throw new Error('Transaction not found');
      }
      
      const currentTransaction = { id, ...transactionSnap.data() } as Transaction;
      
      // Sanitize the update data
      const sanitizedData: Record<string, any> = {};
      
      if (data.amount !== undefined) sanitizedData.amount = Number(data.amount) || 0;
      if (data.description !== undefined) sanitizedData.description = String(data.description || '').trim();
      if (data.date !== undefined) sanitizedData.date = data.date || new Date().toISOString();
      if (data.categoryId !== undefined) sanitizedData.categoryId = String(data.categoryId || '');
      if (data.type !== undefined) sanitizedData.type = data.type === 'income' ? 'income' : 'expense';
      if (data.householdId !== undefined) {
        if (data.householdId) {
          sanitizedData.householdId = String(data.householdId);
        } else {
          // If householdId is null/undefined/empty, remove it from the document
          sanitizedData.householdId = null;
        }
      }
      
      // Handle splitInfo
      if (data.splitInfo !== undefined) {
        if (data.splitInfo && Array.isArray(data.splitInfo) && data.splitInfo.length > 0) {
          // Validate that split amounts add up to the total amount
          const totalSplitAmount = data.splitInfo.reduce((sum, split) => 
            sum + (Number(split.amount) || 0), 0);
          
          // Round to 2 decimal places to avoid floating point comparison issues
          const totalAmount = Math.round(Number(data.amount || currentTransaction.amount) * 100) / 100;
          const roundedSplitAmount = Math.round(totalSplitAmount * 100) / 100;
          
          // If split amounts don't match the total, adjust them proportionally
          let adjustedSplitInfo = [...data.splitInfo];
          if (Math.abs(totalAmount - roundedSplitAmount) > 0.01) {
            const ratio = totalAmount / (roundedSplitAmount || 1); // Avoid division by zero
            adjustedSplitInfo = data.splitInfo.map(split => ({
              ...split,
              amount: Math.round((Number(split.amount) || 0) * ratio * 100) / 100
            }));
          }
          
          // Update splitInfo in sanitizedData with adjusted values
          sanitizedData.splitInfo = adjustedSplitInfo.map(split => ({
            userId: String(split.userId),
            amount: Number(split.amount) || 0,
            percentage: Number(split.percentage) || 0
          }));
        } else {
          // If splitInfo is null/undefined/empty, remove it from the document
          sanitizedData.splitInfo = null;
        }
      }
      
      // Add update timestamp
      sanitizedData.updatedAt = serverTimestamp();
      
      // Update the main transaction
      await updateDoc(transactionRef, sanitizedData);
      
      // If this is a household transaction with split info, update or create individual transactions
      if (currentTransaction.householdId && 
          data.splitInfo && 
          Array.isArray(data.splitInfo) && 
          data.splitInfo.length > 0) {
        try {
          const transactionsRef = collection(db as Firestore, 'transactions');
          
          // Validate that split amounts add up to the total amount
          const totalSplitAmount = data.splitInfo.reduce((sum, split) => 
            sum + (Number(split.amount) || 0), 0);
          
          // Round to 2 decimal places to avoid floating point comparison issues
          const totalAmount = Math.round(Number(data.amount || currentTransaction.amount) * 100) / 100;
          const roundedSplitAmount = Math.round(totalSplitAmount * 100) / 100;
          
          // If split amounts don't match the total, adjust them proportionally
          let adjustedSplitInfo = [...data.splitInfo];
          if (Math.abs(totalAmount - roundedSplitAmount) > 0.01) {
            const ratio = totalAmount / (roundedSplitAmount || 1); // Avoid division by zero
            adjustedSplitInfo = data.splitInfo.map(split => ({
              ...split,
              amount: Math.round((Number(split.amount) || 0) * ratio * 100) / 100
            }));
          }
          
          // Update splitInfo in sanitizedData with adjusted values
          sanitizedData.splitInfo = adjustedSplitInfo.map(split => ({
            userId: String(split.userId),
            amount: Number(split.amount) || 0,
            percentage: Number(split.percentage) || 0
          }));
          
          // Find existing split portions
          const splitPortionsQuery = query(
            transactionsRef,
            where('mainTransactionId', '==', id),
            where('isSplitPortion', '==', true)
          );
          
          const splitPortionsSnapshot = await getDocs(splitPortionsQuery);
          const existingSplitPortions = new Map();
          
          splitPortionsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data && data.userId) {
              existingSplitPortions.set(data.userId, { id: doc.id, ...data });
            }
          });
          
          // Update or create split portions for each user
          const splitPromises = adjustedSplitInfo
            .filter(split => split && split.userId && split.userId !== currentTransaction.userId) // Skip invalid splits and the creator
            .map(async (split) => {
              try {
                const existingPortion = existingSplitPortions.get(split.userId);
                
                if (existingPortion) {
                  // Update existing portion
                  const portionRef = doc(db as Firestore, 'transactions', existingPortion.id);
                  await updateDoc(portionRef, {
                    amount: Number(split.amount) || 0,
                    description: sanitizedData.description || currentTransaction.description || '',
                    date: sanitizedData.date || currentTransaction.date,
                    categoryId: sanitizedData.categoryId || currentTransaction.categoryId || '',
                    type: sanitizedData.type || currentTransaction.type,
                    updatedAt: serverTimestamp()
                  });
                  
                  // Remove from map to track which ones need to be deleted
                  existingSplitPortions.delete(split.userId);
                } else {
                  // Create new portion
                  const userTransaction = {
                    amount: Number(split.amount) || 0,
                    description: sanitizedData.description || currentTransaction.description || '',
                    date: sanitizedData.date || currentTransaction.date,
                    categoryId: sanitizedData.categoryId || currentTransaction.categoryId || '',
                    userId: String(split.userId),
                    type: sanitizedData.type || currentTransaction.type,
                    createdAt: serverTimestamp(),
                    householdId: currentTransaction.householdId,
                    mainTransactionId: id,
                    isSplitPortion: true
                  };
                  
                  await addDoc(transactionsRef, userTransaction);
                }
              } catch (splitError) {
                console.error('Error updating split portion:', splitError);
                // Continue with other splits even if one fails
              }
            });
          
          await Promise.all(splitPromises);
          
          // Delete any remaining split portions that are no longer needed
          const deletePromises = Array.from(existingSplitPortions.values())
            .filter(portion => portion && portion.id) // Filter out invalid portions
            .map(async (portion) => {
              try {
                const portionRef = doc(db as Firestore, 'transactions', portion.id);
                await deleteDoc(portionRef);
              } catch (deleteError) {
                console.error('Error deleting split portion:', deleteError);
                // Continue with other deletes even if one fails
              }
            });
          
          await Promise.all(deletePromises);
        } catch (splitError) {
          console.error('Error managing split portions:', splitError);
          // Continue with the main transaction update even if split portions fail
        }
      } else if (currentTransaction.householdId && (!data.splitInfo || !Array.isArray(data.splitInfo) || data.splitInfo.length === 0)) {
        // If split info was removed, delete all split portions
        try {
          const transactionsRef = collection(db as Firestore, 'transactions');
          const splitPortionsQuery = query(
            transactionsRef,
            where('mainTransactionId', '==', id),
            where('isSplitPortion', '==', true)
          );
          
          const splitPortionsSnapshot = await getDocs(splitPortionsQuery);
          
          const deletePromises = splitPortionsSnapshot.docs.map(async (doc) => {
            try {
              await deleteDoc(doc.ref);
            } catch (deleteError) {
              console.error('Error deleting split portion:', deleteError);
              // Continue with other deletes even if one fails
            }
          });
          
          await Promise.all(deletePromises);
        } catch (deleteError) {
          console.error('Error deleting split portions:', deleteError);
          // Continue with the main transaction update even if split portions deletion fails
        }
      }
      
      // Update local state
      const { transactions } = get();
      const updatedTransactions = transactions.map(t => 
        t.id === id ? { ...t, ...data } : t
      );
      
      set({ transactions: updatedTransactions, isLoading: false });
      get().getFilteredTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      set({ error: 'Failed to update transaction', isLoading: false });
    }
  },
  
  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      if (!id) {
        throw new Error('Transaction ID is required');
      }
      
      const transactionRef = doc(db as Firestore, 'transactions', id);
      const transactionSnap = await getDoc(transactionRef);
      
      if (!transactionSnap.exists()) {
        throw new Error('Transaction not found');
      }
      
      // Check if this is a main transaction with split portions
      const transactionData = transactionSnap.data();
      
      if (transactionData && 
          transactionData.householdId && 
          transactionData.splitInfo && 
          Array.isArray(transactionData.splitInfo) && 
          transactionData.splitInfo.length > 0) {
        try {
          // Delete all split portions first
          const transactionsRef = collection(db as Firestore, 'transactions');
          const splitPortionsQuery = query(
            transactionsRef,
            where('mainTransactionId', '==', id),
            where('isSplitPortion', '==', true)
          );
          
          const splitPortionsSnapshot = await getDocs(splitPortionsQuery);
          
          const deletePromises = splitPortionsSnapshot.docs.map(async (doc) => {
            try {
              await deleteDoc(doc.ref);
            } catch (deleteError) {
              console.error('Error deleting split portion:', deleteError);
              // Continue with other deletes even if one fails
            }
          });
          
          await Promise.all(deletePromises);
        } catch (splitError) {
          console.error('Error deleting split portions:', splitError);
          // Continue with the main transaction deletion even if split portions deletion fails
        }
      }
      
      // Delete the main transaction
      await deleteDoc(transactionRef);
      
      // Update local state
      const { transactions } = get();
      const updatedTransactions = transactions.filter(t => t.id !== id);
      
      set({ transactions: updatedTransactions, isLoading: false });
      get().getFilteredTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      set({ error: 'Failed to delete transaction', isLoading: false });
    }
  },
  
  setFilterOptions: (options) => {
    set({ 
      filterOptions: { ...get().filterOptions, ...options } 
    });
    get().getFilteredTransactions();
  },
  
  getFilteredTransactions: () => {
    const { transactions, categories, filterOptions } = get();
    
    if (!transactions || !Array.isArray(transactions)) {
      set({ filteredTransactions: [] });
      return [];
    }
    
    // Apply filters
    const filtered = transactions.filter(transaction => {
      if (!transaction) return false;
      
      try {
        const transactionDate = transaction.date ? new Date(transaction.date) : new Date();
        
        // Date range filter
        const isInDateRange = 
          (!filterOptions.startDate || transactionDate >= filterOptions.startDate) && 
          (!filterOptions.endDate || transactionDate <= filterOptions.endDate);
        
        // Transaction type filter
        const matchesType = 
          !filterOptions.type || 
          filterOptions.type === 'all' || 
          transaction.type === filterOptions.type;
        
        // Household filter - if householdId is specified, only show transactions for that household
        const matchesHousehold = 
          !filterOptions.householdId || 
          transaction.householdId === filterOptions.householdId;
        
        return isInDateRange && matchesType && matchesHousehold;
      } catch (error) {
        console.error('Error filtering transaction:', error, transaction);
        return false;
      }
    });
    
    // Combine with category data
    const transactionsWithCategory = filtered.map(transaction => {
      try {
        const category = categories.find(c => c && c.id === transaction.categoryId) || {
          id: 'unknown',
          name: 'Unknown',
          emoji: '❓',
          color: '#999',
          userId: transaction.userId,
        };
        
        return {
          ...transaction,
          category,
        };
      } catch (error) {
        console.error('Error adding category to transaction:', error, transaction);
        return {
          ...transaction,
          category: {
            id: 'unknown',
            name: 'Unknown',
            emoji: '❓',
            color: '#999',
            userId: transaction.userId || '',
          }
        };
      }
    });
    
    set({ filteredTransactions: transactionsWithCategory });
    return transactionsWithCategory;
  },
  
  getMonthlyTransactions: async (userId: string, date = new Date()) => {
    try {
      if (!db) {
        throw new Error('Firestore database is not initialized');
      }
      
      if (!userId) {
        throw new Error('User ID is required');
      }
      
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      
      try {
        // Try with the composite index first (requires index)
        const transactionsRef = collection(db, 'transactions');
        const q = query(
          transactionsRef,
          where('userId', '==', userId),
          where('date', '>=', startDate.toISOString()),
          where('date', '<=', endDate.toISOString())
        );
        
        const querySnapshot = await getDocs(q);
        const transactions: Transaction[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data && typeof data.amount === 'number') {
            transactions.push({ 
              id: doc.id, 
              ...data 
            } as Transaction);
          }
        });
        
        return transactions;
      } catch (indexError) {
        console.error('Index error, falling back to client-side filtering:', indexError);
        
        // Fallback to a simpler query if the index doesn't exist yet
        // This will get all user transactions and filter on the client side
        const transactionsRef = collection(db, 'transactions');
        const q = query(
          transactionsRef,
          where('userId', '==', userId)
        );
        
        const querySnapshot = await getDocs(q);
        const allTransactions: Transaction[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data && typeof data.amount === 'number') {
            allTransactions.push({ 
              id: doc.id, 
              ...data 
            } as Transaction);
          }
        });
        
        // Filter by date on the client side
        return allTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        });
      }
    } catch (error) {
      console.error('Error fetching monthly transactions:', error);
      return [];
    }
  },
})); 