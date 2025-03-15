'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTransactionStore } from '@/store/transactionStore';
import { useCategoryStore } from '@/store/categoryStore';
import AppLayout from '@/components/AppLayout';
import StatsCard from '@/components/StatsCard';
import CategoryList from '@/components/CategoryList';
import TransactionList from '@/components/TransactionList';
import { calculateMonthlyStats, getTopCategories, getRecentTransactions } from '@/utils/statistics';
import { FaWallet, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { Currency } from '@/types';

export default function Home() {
  const { userData } = useAuth();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      if (userData) {
        setIsLoading(true);
        await Promise.all([
          fetchTransactions(userData.id),
          fetchCategories(userData.id)
        ]);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [userData, fetchTransactions, fetchCategories]);
  
  const stats = calculateMonthlyStats(transactions, categories);
  const topCategories = getTopCategories(stats.categoriesStats);
  const recentTransactions = getRecentTransactions(transactions);
  
  return (
    <AppLayout title="Home">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard 
              title="Balance" 
              amount={stats.balance} 
              currency={userData?.currency as Currency || 'USD'} 
              type="balance"
              icon={<FaWallet />}
            />
            <StatsCard 
              title="Income" 
              amount={stats.totalIncome} 
              currency={userData?.currency as Currency || 'USD'} 
              type="income"
              icon={<FaArrowUp />}
            />
            <StatsCard 
              title="Expenses" 
              amount={stats.totalExpenses} 
              currency={userData?.currency as Currency || 'USD'} 
              type="expense"
              icon={<FaArrowDown />}
            />
          </div>
          
          {/* Top Categories */}
          <div>
            <h2 className="text-lg font-medium mb-3">Top Categories</h2>
            <CategoryList 
              categories={topCategories} 
              showAmounts={true} 
              currency={userData?.currency as Currency || 'USD'} 
            />
          </div>
          
          {/* Recent Transactions */}
          <div>
            <h2 className="text-lg font-medium mb-3">Recent Transactions</h2>
            <TransactionList 
              transactions={recentTransactions.map(t => ({
                ...t,
                category: categories.find(c => c.id === t.categoryId) || {
                  id: 'unknown',
                  name: 'Unknown',
                  emoji: '❓',
                  userId: t.userId
                }
              }))} 
              currency={userData?.currency as Currency || 'USD'} 
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
