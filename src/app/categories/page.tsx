'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCategoryStore } from '@/store/categoryStore';
import AppLayout from '@/components/AppLayout';
import CategoryList from '@/components/CategoryList';
import CategoryForm from '@/components/CategoryForm';
import { Category } from '@/types';
import { FaPlus } from 'react-icons/fa';

export default function Categories() {
  const { userData } = useAuth();
  const { categories, fetchCategories, deleteCategory } = useCategoryStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      if (userData) {
        setIsLoading(true);
        await fetchCategories(userData.id);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [userData, fetchCategories]);
  
  const handleAddCategory = () => {
    setEditCategory(null);
    setShowCategoryForm(true);
  };
  
  const handleEditCategory = (category: Category) => {
    setEditCategory(category);
    setShowCategoryForm(true);
  };
  
  const handleDeleteCategory = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      await deleteCategory(category.id);
    }
  };
  
  return (
    <AppLayout title="Categories">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium">Your Categories</h2>
          <button
            onClick={handleAddCategory}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FaPlus className="mr-1" size={14} /> Add Category
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <CategoryList 
              categories={categories} 
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
            />
          </div>
        )}
      </div>
      
      {showCategoryForm && (
        <CategoryForm 
          onClose={() => setShowCategoryForm(false)} 
          editCategory={editCategory || undefined} 
        />
      )}
    </AppLayout>
  );
} 