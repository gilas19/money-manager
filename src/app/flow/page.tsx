'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTransactionStore } from '@/store/transactionStore';
import { useCategoryStore } from '@/store/categoryStore';
import AppLayout from '@/components/AppLayout';
import TransactionList from '@/components/TransactionList';
import TransactionForm from '@/components/TransactionForm';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { FaFilter, FaSearch, FaTimes } from 'react-icons/fa';
import { Currency, Transaction, TransactionWithCategory } from '@/types';

export default function Flow() {
  const { userData } = useAuth();
  const { filteredTransactions, setFilterOptions, deleteTransaction } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<string>(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState<string>(
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  
  useEffect(() => {
    if (userData) {
      fetchCategories(userData.id);
      setIsLoading(false);
    }
  }, [userData, fetchCategories]);
  
  useEffect(() => {
    setFilterOptions({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      type: selectedType,
      categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
      search: searchTerm || undefined,
    });
  }, [startDate, endDate, selectedType, selectedCategories, searchTerm, setFilterOptions]);
  
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategories([]);
    setStartDate(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    setEndDate(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  };
  
  const handleEdit = (transaction: TransactionWithCategory) => {
    setEditTransaction(transaction);
  };
  
  const handleDelete = async (transaction: TransactionWithCategory) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(transaction.id);
    }
  };
  
  return (
    <AppLayout title="Flow" showHouseholdSelector>
      <div className="space-y-4">
        {/* Search and Filter */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              <FaFilter className={showFilters ? 'text-blue-500' : 'text-gray-500'} />
            </button>
          </div>
          
          {showFilters && (
            <div className="space-y-4">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSelectedType('all')}
                    className={`py-2 px-4 rounded-md ${
                      selectedType === 'all' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelectedType('expense')}
                    className={`py-2 px-4 rounded-md ${
                      selectedType === 'expense' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Expenses
                  </button>
                  <button
                    onClick={() => setSelectedType('income')}
                    className={`py-2 px-4 rounded-md ${
                      selectedType === 'income' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Income
                  </button>
                </div>
              </div>
              
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryToggle(category.id)}
                      className={`flex items-center py-1 px-2 rounded-full text-sm ${
                        selectedCategories.includes(category.id)
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <span className="mr-1">{category.emoji}</span>
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Clear Filters */}
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center text-sm text-red-600 hover:text-red-800"
                >
                  <FaTimes className="mr-1" /> Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <TransactionList 
            transactions={filteredTransactions} 
            currency={userData?.currency as Currency || 'USD'} 
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
      
      {editTransaction && (
        <TransactionForm 
          onClose={() => setEditTransaction(null)} 
          editTransaction={editTransaction} 
        />
      )}
    </AppLayout>
  );
} 