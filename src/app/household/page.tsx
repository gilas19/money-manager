'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTransactionStore } from '@/store/transactionStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useHouseholdStore } from '@/store/householdStore';
import AppLayout from '@/components/AppLayout';
import StatsCard from '@/components/StatsCard';
import CategoryList from '@/components/CategoryList';
import TransactionList from '@/components/TransactionList';
import HouseholdForm from '@/components/HouseholdForm';
import { calculateMonthlyStats, getTopCategories, getRecentTransactions } from '@/utils/statistics';
import { FaWallet, FaArrowUp, FaArrowDown, FaPlus, FaUsers, FaEnvelope, FaHome, FaEdit, FaTrash, FaCheck, FaTimes, FaSignOutAlt } from 'react-icons/fa';
import { Currency, Household } from '@/types';
import { toast } from 'react-hot-toast';

export default function HouseholdPage() {
  const { userData } = useAuth();
  const { transactions, fetchTransactions, setFilterOptions } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { 
    households, 
    invitations,
    currentHousehold, 
    fetchHouseholds,
    fetchInvitations,
    setCurrentHousehold,
    removeMember,
    joinHousehold,
    cancelInvitation,
    quitHousehold
  } = useHouseholdStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showHouseholdForm, setShowHouseholdForm] = useState(false);
  const [editHousehold, setEditHousehold] = useState<Household | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      if (userData) {
        setIsLoading(true);
        await Promise.all([
          fetchTransactions(userData.id),
          fetchCategories(userData.id),
          fetchHouseholds(userData.id),
          fetchInvitations(userData.email)
        ]);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [userData, fetchTransactions, fetchCategories, fetchHouseholds, fetchInvitations]);
  
  useEffect(() => {
    setFilterOptions({
      householdId: currentHousehold?.id
    });
    
    // Fetch transactions for the current household when it changes
    if (userData && currentHousehold) {
      fetchTransactions(userData.id, currentHousehold.id);
    }
  }, [currentHousehold, setFilterOptions, fetchTransactions, userData]);
  
  const handleCreateHousehold = () => {
    setEditHousehold(null);
    setShowHouseholdForm(true);
  };
  
  const handleEditHousehold = () => {
    if (currentHousehold) {
      setEditHousehold(currentHousehold);
      setShowHouseholdForm(true);
    }
  };
  
  const handleRemoveMember = async (userId: string) => {
    if (!currentHousehold) return;
    
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeMember(currentHousehold.id, userId);
      } catch (error) {
        console.error('Error removing member:', error);
        alert('Failed to remove member');
      }
    }
  };
  
  const handleCancelInvitation = async (email: string) => {
    if (!currentHousehold) return;
    
    if (window.confirm(`Are you sure you want to cancel the invitation to ${email}?`)) {
      try {
        await cancelInvitation(currentHousehold.id, email);
      } catch (error) {
        console.error('Error canceling invitation:', error);
        alert('Failed to cancel invitation');
      }
    }
  };
  
  const handleJoinHousehold = async (householdId: string) => {
    if (!userData) return;
    
    try {
      await joinHousehold(householdId, userData.id, userData.email);
      alert('You have joined the household');
    } catch (error) {
      console.error('Error joining household:', error);
      alert('Failed to join household');
    }
  };
  
  // Filter transactions for the current household
  const householdTransactions = transactions.filter(t => 
    t.householdId === currentHousehold?.id
  );
  
  const stats = calculateMonthlyStats(householdTransactions, categories);
  const topCategories = getTopCategories(stats.categoriesStats);
  const recentTransactions = getRecentTransactions(householdTransactions);
  
  // Add a function to handle quitting the household
  const handleQuitHousehold = () => {
    if (!userData?.id || !currentHousehold?.id) return;
    
    const isOwner = currentHousehold.ownerId === userData.id;
    const message = isOwner 
      ? 'As the owner, quitting will delete the household for all members. Are you sure?'
      : 'Are you sure you want to quit this household?';
    
    if (window.confirm(message)) {
      quitHousehold(currentHousehold.id, userData.id);
      toast.success('You have left the household');
    }
  };
  
  return (
    <AppLayout title="Household" showHouseholdSelector>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !households.length && !invitations.length ? (
        <div className="flex flex-col items-center justify-center py-12">
          <FaUsers className="text-gray-400 mb-4" size={48} />
          <h2 className="text-xl font-medium text-gray-700 mb-2">No Household Yet</h2>
          <p className="text-gray-500 mb-6 text-center">
            Create a household to share expenses with family or roommates
          </p>
          <button
            onClick={handleCreateHousehold}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FaPlus className="mr-2" /> Create Household
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Invitations Section */}
          {invitations.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-medium mb-4">Household Invitations</h2>
              <div className="space-y-4">
                {invitations.map(invitation => (
                  <div key={invitation.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">{invitation.name}</h3>
                      <span className="text-xs text-gray-500">
                        Owner: {invitation.ownerId === userData?.id ? 'You' : invitation.ownerId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-600">
                        {invitation.members.length} member{invitation.members.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => handleJoinHousehold(invitation.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Accept Invitation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Current Household Section - Only show if there's a current household */}
          {currentHousehold && (
            <>
              {/* Household Info */}
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-medium">{currentHousehold.name}</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleEditHousehold}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit className="mr-1" /> Edit
                    </button>
                    <button
                      onClick={handleQuitHousehold}
                      className="text-sm text-error hover:text-error"
                    >
                      <FaSignOutAlt className="mr-1" /> Quit Household
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Members</h3>
                  </div>
                  <div className="space-y-2">
                    {currentHousehold.members.map(memberId => (
                      <div key={memberId} className="flex items-center">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <FaUsers className="text-gray-500" />
                        </div>
                        <span className="ml-2 text-sm">
                          {memberId === userData?.id ? 'You' : memberId}
                          {memberId === currentHousehold.ownerId && ' (Owner)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {currentHousehold.invitedEmails.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Pending Invitations</h3>
                    <div className="space-y-2">
                      {currentHousehold.invitedEmails.map(email => (
                        <div key={email} className="flex items-center">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <FaEnvelope className="text-gray-500" />
                          </div>
                          <span className="ml-2 text-sm">{email}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
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
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <CategoryList 
                    categories={topCategories} 
                    showAmounts={true} 
                    currency={userData?.currency as Currency || 'USD'} 
                  />
                </div>
              </div>
              
              {/* Recent Transactions */}
              <div>
                <h2 className="text-lg font-medium mb-3">Recent Transactions</h2>
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
            </>
          )}
          
          {/* Show message if no current household is selected but households exist */}
          {!currentHousehold && households.length > 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-6">
                Please select a household from the dropdown above
              </p>
            </div>
          )}
        </div>
      )}
      
      {showHouseholdForm && (
        <HouseholdForm 
          onClose={() => setShowHouseholdForm(false)} 
          editHousehold={editHousehold || undefined} 
        />
      )}
    </AppLayout>
  );
} 