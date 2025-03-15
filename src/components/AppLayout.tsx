import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCategoryStore } from '@/store/categoryStore';
import { useHouseholdStore } from '@/store/householdStore';
import { useTransactionStore } from '@/store/transactionStore';
import Header from './Header';
import Navigation from './Navigation';
import TransactionForm from './TransactionForm';
import LoginPage from './LoginPage';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  showHouseholdSelector?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  title,
  showHouseholdSelector = false
}) => {
  const { userData, loading } = useAuth();
  const { createDefaultCategories } = useCategoryStore();
  const { fetchHouseholds, fetchInvitations } = useHouseholdStore();
  const { fetchTransactions } = useTransactionStore();
  const router = useRouter();
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  
  useEffect(() => {
    if (userData) {
      // Initialize data
      createDefaultCategories(userData.id);
      fetchHouseholds(userData.id);
      fetchTransactions(userData.id);
      
      // Fetch invitations using user's email
      fetchInvitations(userData.email);
    }
  }, [userData, createDefaultCategories, fetchHouseholds, fetchInvitations, fetchTransactions]);
  
  // Fetch household transactions when the current household changes
  useEffect(() => {
    const { currentHousehold } = useHouseholdStore.getState();
    if (userData && currentHousehold) {
      fetchTransactions(userData.id, currentHousehold.id);
    }
  }, [userData, fetchTransactions]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!userData) {
    return <LoginPage />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header title={title} showHouseholdSelector={showHouseholdSelector} />
      
      <main className="container mx-auto px-4 py-4">
        {children}
      </main>
      
      <Navigation onAddTransaction={() => setShowTransactionForm(true)} />
      
      {showTransactionForm && (
        <TransactionForm onClose={() => setShowTransactionForm(false)} />
      )}
    </div>
  );
};

export default AppLayout; 