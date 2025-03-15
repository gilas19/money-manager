'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AppLayout from '@/components/AppLayout';
import { currencyOptions } from '@/utils/formatters';
import { Currency } from '@/types';
import { FaSignOutAlt, FaTrash } from 'react-icons/fa';
import Image from 'next/image';

export default function Profile() {
  const { userData, updateUserData, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Function to validate URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!userData) return;
    
    setIsLoading(true);
    try {
      await updateUserData({ currency: e.target.value as Currency });
    } catch (error) {
      console.error('Error updating currency:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignOut = async () => {
    await signOut();
  };
  
  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      if (window.confirm('All your data will be permanently deleted. Are you absolutely sure?')) {
        // In a real app, you would implement account deletion here
        alert('Account deletion is not implemented in this demo');
      }
    }
  };
  
  return (
    <AppLayout title="Profile">
      <div className="max-w-md mx-auto space-y-6">
        {/* Profile Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4 mb-6">
            {userData?.photoURL && isValidUrl(userData.photoURL) ? (
              <div className="w-16 h-16 rounded-full overflow-hidden">
                <Image 
                  src={userData.photoURL} 
                  alt={userData.displayName || 'User'} 
                  width={64} 
                  height={64}
                  className="object-cover"
                  unoptimized={true}
                  onError={(e) => {
                    // Replace with fallback on error
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; // Prevent infinite loop
                    target.style.display = 'none'; // Hide the image
                  }}
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-500 text-xl">
                  {userData?.displayName?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-medium">{userData?.displayName}</h2>
              <p className="text-gray-500">{userData?.email}</p>
            </div>
          </div>
          
          {/* Currency Preference */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Currency
            </label>
            <select
              value={userData?.currency || 'USD'}
              onChange={handleCurrencyChange}
              disabled={isLoading}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {currencyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Account Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium mb-4">Account</h3>
          
          <div className="space-y-4">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <FaSignOutAlt className="mr-2 text-gray-500" />
              Sign Out
            </button>
            
            <button
              onClick={handleDeleteAccount}
              className="flex items-center w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 rounded-md"
            >
              <FaTrash className="mr-2" />
              Delete Account
            </button>
          </div>
        </div>
        
        {/* App Info */}
        <div className="text-center text-sm text-gray-500">
          <p>Money Manager v1.0.0</p>
          <p>&copy; {new Date().getFullYear()} Money Manager. All rights reserved.</p>
        </div>
      </div>
    </AppLayout>
  );
} 