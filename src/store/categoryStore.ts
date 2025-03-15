import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category } from '@/types';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchCategories: (userId: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  createDefaultCategories: (userId: string) => Promise<void>;
}

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId'>[] = [
  { name: 'Food & Dining', emoji: '🍔', isDefault: true },
  { name: 'Transportation', emoji: '🚗', isDefault: true },
  { name: 'Housing', emoji: '🏠', isDefault: true },
  { name: 'Utilities', emoji: '💡', isDefault: true },
  { name: 'Entertainment', emoji: '🎬', isDefault: true },
  { name: 'Shopping', emoji: '🛍️', isDefault: true },
  { name: 'Health', emoji: '🏥', isDefault: true },
  { name: 'Travel', emoji: '✈️', isDefault: true },
  { name: 'Education', emoji: '📚', isDefault: true },
  { name: 'Personal Care', emoji: '💇', isDefault: true },
  { name: 'Gifts & Donations', emoji: '🎁', isDefault: true },
  { name: 'Salary', emoji: '💰', isDefault: true },
  { name: 'Investments', emoji: '📈', isDefault: true },
  { name: 'Other Income', emoji: '💵', isDefault: true },
];

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  
  fetchCategories: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const categoriesRef = collection(db, 'categories');
      const q = query(
        categoriesRef, 
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const categories: Category[] = [];
      
      querySnapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() } as Category);
      });
      
      set({ categories, isLoading: false });
    } catch (error) {
      console.error('Error fetching categories:', error);
      set({ error: 'Failed to fetch categories', isLoading: false });
    }
  },
  
  addCategory: async (category) => {
    set({ isLoading: true, error: null });
    try {
      const categoriesRef = collection(db, 'categories');
      await addDoc(categoriesRef, category);
      
      // Refresh categories
      await get().fetchCategories(category.userId);
    } catch (error) {
      console.error('Error adding category:', error);
      set({ error: 'Failed to add category', isLoading: false });
    }
  },
  
  updateCategory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const categoryRef = doc(db, 'categories', id);
      await updateDoc(categoryRef, data);
      
      // Update local state
      const { categories } = get();
      const updatedCategories = categories.map(c => 
        c.id === id ? { ...c, ...data } : c
      );
      
      set({ categories: updatedCategories, isLoading: false });
    } catch (error) {
      console.error('Error updating category:', error);
      set({ error: 'Failed to update category', isLoading: false });
    }
  },
  
  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const categoryRef = doc(db, 'categories', id);
      await deleteDoc(categoryRef);
      
      // Update local state
      const { categories } = get();
      const updatedCategories = categories.filter(c => c.id !== id);
      
      set({ categories: updatedCategories, isLoading: false });
    } catch (error) {
      console.error('Error deleting category:', error);
      set({ error: 'Failed to delete category', isLoading: false });
    }
  },
  
  createDefaultCategories: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const categoriesRef = collection(db, 'categories');
      
      // Check if user already has categories
      const q = query(categoriesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.size === 0) {
        // Create default categories
        const batch = [];
        for (const category of DEFAULT_CATEGORIES) {
          batch.push(addDoc(categoriesRef, {
            ...category,
            userId
          }));
        }
        
        await Promise.all(batch);
      }
      
      // Refresh categories
      await get().fetchCategories(userId);
    } catch (error) {
      console.error('Error creating default categories:', error);
      set({ error: 'Failed to create default categories', isLoading: false });
    }
  }
})); 