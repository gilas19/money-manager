import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useCategoryStore } from '@/store/categoryStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useHouseholdStore } from '@/store/householdStore';
import { Transaction, Category, Currency } from '@/types';
import { getCurrencySymbol } from '@/utils/formatters';
import { FaUserFriends, FaEquals, FaInfoCircle } from 'react-icons/fa';

interface TransactionFormProps {
  onClose: () => void;
  editTransaction?: Transaction;
}

interface SplitMember {
  id: string;
  name: string;
  amount: string;
  percentage: number;
}

type FormData = {
  amount: string;
  description: string;
  date: string;
  categoryId: string;
  type: 'income' | 'expense';
  isHousehold: boolean;
  splitEqually: boolean;
  splitMembers?: SplitMember[];
};

const TransactionForm: React.FC<TransactionFormProps> = ({ onClose, editTransaction }) => {
  const { userData } = useAuth();
  const { categories, fetchCategories } = useCategoryStore();
  const { addTransaction, updateTransaction } = useTransactionStore();
  const { households, currentHousehold } = useHouseholdStore();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSplitOptions, setShowSplitOptions] = useState(!!editTransaction?.splitInfo);
  const [splitAmountError, setSplitAmountError] = useState<string | null>(null);
  
  // Get household members with names
  const householdMembers = useMemo(() => {
    if (!currentHousehold) return [];
    
    return currentHousehold.members.map(memberId => {
      const isCurrentUser = memberId === userData?.id;
      return {
        id: memberId,
        name: isCurrentUser ? 'You' : memberId
      };
    });
  }, [currentHousehold, userData]);
  
  // Create initial split members with equal distribution
  const createSplitMembers = useCallback((totalAmount: number): SplitMember[] => {
    if (!householdMembers.length) return [];
    
    const memberCount = householdMembers.length;
    const equalAmount = memberCount > 0 ? (totalAmount / memberCount).toFixed(2) : '0.00';
    const equalPercentage = memberCount > 0 ? parseFloat((100 / memberCount).toFixed(2)) : 0;
    
    return householdMembers.map(member => ({
      id: member.id,
      name: member.name,
      amount: equalAmount,
      percentage: equalPercentage
    }));
  }, [householdMembers]);
  
  // Initialize form with default values
  const { control, handleSubmit, setValue, watch, formState: { errors }, getValues, reset } = useForm<FormData>({
    defaultValues: {
      amount: editTransaction ? String(editTransaction.amount) : '',
      description: editTransaction?.description || '',
      date: editTransaction?.date 
        ? new Date(editTransaction.date).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      categoryId: editTransaction?.categoryId || '',
      type: editTransaction?.type || 'expense',
      isHousehold: !!editTransaction?.householdId,
      splitEqually: editTransaction?.splitInfo ? false : true,
      splitMembers: []
    }
  });
  
  const { fields: splitMemberFields, update: updateSplitMember, replace: replaceSplitMembers } = useFieldArray({
    control,
    name: 'splitMembers'
  });
  
  const transactionType = watch('type');
  const isHousehold = watch('isHousehold');
  const splitEqually = watch('splitEqually');
  const amount = watch('amount');
  const amountValue = parseFloat(amount) || 0;
  
  // Initialize split members when editing a transaction with split info
  useEffect(() => {
    if (editTransaction?.splitInfo && editTransaction.householdId) {
      try {
        const splitMembers = editTransaction.splitInfo.map(split => {
          const member = householdMembers.find(m => m.id === split.userId);
          return {
            id: split.userId,
            name: member ? member.name : split.userId,
            amount: split.amount.toFixed(2),
            percentage: parseFloat(split.percentage.toFixed(2))
          };
        });
        
        replaceSplitMembers(splitMembers);
        setValue('splitEqually', false);
      } catch (error) {
        console.error('Error initializing split members from existing transaction:', error);
      }
    }
  }, [editTransaction, householdMembers, replaceSplitMembers, setValue]);
  
  // Update split amounts when total amount changes or split type changes
  useEffect(() => {
    if (!isHousehold || !showSplitOptions || !householdMembers.length) return;
    
    try {
      if (splitEqually) {
        // Create new split members with equal distribution
        const newSplitMembers = createSplitMembers(amountValue);
        replaceSplitMembers(newSplitMembers);
        setSplitAmountError(null);
      } else {
        // When not splitting equally, recalculate percentages based on amounts
        const splitMembers = getValues('splitMembers') || [];
        if (!splitMembers.length) return;
        
        const totalSplitAmount = splitMembers.reduce((sum, member) => {
          return sum + (parseFloat(member.amount) || 0);
        }, 0);
        
        if (totalSplitAmount > 0) {
          const updatedMembers = splitMembers.map(member => {
            const memberAmount = parseFloat(member.amount) || 0;
            const percentage = (memberAmount / totalSplitAmount) * 100;
            
            return {
              ...member,
              percentage: parseFloat(percentage.toFixed(2))
            };
          });
          
          replaceSplitMembers(updatedMembers);
          
          // Check if total split amount matches the transaction amount
          if (Math.abs(totalSplitAmount - amountValue) > 0.01) {
            setSplitAmountError(`Split total (${totalSplitAmount.toFixed(2)}) doesn't match transaction amount (${amountValue.toFixed(2)})`);
          } else {
            setSplitAmountError(null);
          }
        }
      }
    } catch (error) {
      console.error('Error updating split amounts:', error);
    }
  }, [amountValue, splitEqually, isHousehold, showSplitOptions, householdMembers, createSplitMembers, getValues, replaceSplitMembers]);
  
  // Toggle split options when household checkbox changes
  useEffect(() => {
    if (!isHousehold) {
      setShowSplitOptions(false);
    }
  }, [isHousehold]);
  
  // Fetch categories when component mounts
  useEffect(() => {
    if (userData) {
      fetchCategories(userData.id);
    }
  }, [userData, fetchCategories]);
  
  // Handle enabling split options
  const handleEnableSplitOptions = () => {
    if (!showSplitOptions) {
      // Initialize split members when enabling split options
      const newSplitMembers = createSplitMembers(amountValue);
      replaceSplitMembers(newSplitMembers);
    }
    setShowSplitOptions(!showSplitOptions);
  };
  
  // Handle manual amount change for a member
  const handleSplitAmountChange = (index: number, value: string) => {
    try {
      // Update the member's amount
      const newAmount = parseFloat(value) || 0;
      
      // Get all current split members
      const currentSplitMembers = getValues('splitMembers') || [];
      
      // Update the specific member's amount
      const updatedMembers = [...currentSplitMembers];
      updatedMembers[index] = {
        ...updatedMembers[index],
        amount: value
      };
      
      // Calculate total split amount
      const totalSplitAmount = updatedMembers.reduce((sum, member) => {
        return sum + (parseFloat(member.amount) || 0);
      }, 0);
      
      // Update percentages for all members
      if (totalSplitAmount > 0) {
        updatedMembers.forEach((member, i) => {
          const memberAmount = parseFloat(member.amount) || 0;
          const percentage = (memberAmount / totalSplitAmount) * 100;
          updatedMembers[i] = {
            ...member,
            percentage: parseFloat(percentage.toFixed(2))
          };
        });
      }
      
      // Replace all members with updated values
      replaceSplitMembers(updatedMembers);
      
      // Set splitEqually to false since we're manually adjusting
      setValue('splitEqually', false);
      
      // Check if total split amount matches the transaction amount
      if (Math.abs(totalSplitAmount - amountValue) > 0.01) {
        setSplitAmountError(`Split total (${totalSplitAmount.toFixed(2)}) doesn't match transaction amount (${amountValue.toFixed(2)})`);
      } else {
        setSplitAmountError(null);
      }
    } catch (error) {
      console.error('Error handling split amount change:', error);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: FormData) => {
    if (!userData) return;
    
    setIsSubmitting(true);
    
    try {
      // Validate amount is a valid number
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount greater than zero');
      }
      
      // Validate date
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        throw new Error('Please enter a valid date');
      }
      
      // Validate category
      if (!data.categoryId) {
        throw new Error('Please select a category');
      }
      
      // Process split information if applicable
      let splitInfo = undefined;
      
      if (data.isHousehold && showSplitOptions && data.splitMembers && data.splitMembers.length > 0) {
        // Calculate total split amount
        const totalSplitAmount = data.splitMembers.reduce((sum, member) => {
          return sum + (parseFloat(member.amount) || 0);
        }, 0);
        
        // If split amounts don't match the total, adjust them proportionally
        if (Math.abs(totalSplitAmount - amount) > 0.01) {
          const ratio = amount / (totalSplitAmount || 1); // Avoid division by zero
          
          data.splitMembers = data.splitMembers.map(member => {
            const adjustedAmount = ((parseFloat(member.amount) || 0) * ratio).toFixed(2);
            return {
              ...member,
              amount: adjustedAmount
            };
          });
        }
        
        // Create final split info for the transaction
        splitInfo = data.splitMembers.map(member => ({
          userId: member.id,
          amount: parseFloat(member.amount) || 0,
          percentage: member.percentage
        }));
      }
      
      // Create a clean transaction object with proper data types
      const transactionData = {
        amount,
        description: data.description.trim(),
        date: date.toISOString(),
        categoryId: data.categoryId,
        userId: userData.id,
        type: data.type,
        // Only include householdId if it's defined and not empty
        ...(data.isHousehold && currentHousehold ? { 
          householdId: currentHousehold.id,
          // Include split information if available
          ...(splitInfo ? { splitInfo } : {})
        } : {})
      };
      
      if (editTransaction) {
        await updateTransaction(editTransaction.id, transactionData);
      } else {
        await addTransaction(transactionData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      // Show error to user
      alert(error instanceof Error ? error.message : 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const filteredCategories = categories.filter(category => 
    transactionType === 'income' 
      ? ['Salary', 'Investments', 'Other Income'].includes(category.name)
      : !['Salary', 'Investments', 'Other Income'].includes(category.name)
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {editTransaction ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Transaction Type */}
          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="type"
              control={control}
              rules={{ required: 'Type is required' }}
              render={({ field }) => (
                <>
                  <button
                    type="button"
                    className={`py-2 px-4 rounded-md ${
                      field.value === 'expense' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => field.onChange('expense')}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-4 rounded-md ${
                      field.value === 'income' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    onClick={() => field.onChange('income')}
                  >
                    Income
                  </button>
                </>
              )}
            />
          </div>
          
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                {userData ? getCurrencySymbol(userData.currency as Currency) : '$'}
              </span>
              <Controller
                name="amount"
                control={control}
                rules={{ 
                  required: 'Amount is required',
                  pattern: {
                    value: /^\d+(\.\d{1,2})?$/,
                    message: 'Please enter a valid amount'
                  }
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    inputMode="decimal"
                    className={`block w-full pl-8 pr-3 py-2 border ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="0.00"
                  />
                )}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className={`block w-full px-3 py-2 border ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="What was this for?"
                />
              )}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
          
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <Controller
              name="date"
              control={control}
              rules={{ required: 'Date is required' }}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  className={`block w-full px-3 py-2 border ${
                    errors.date ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                />
              )}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>
          
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <Controller
              name="categoryId"
              control={control}
              rules={{ required: 'Category is required' }}
              render={({ field }) => (
                <select
                  {...field}
                  className={`block w-full px-3 py-2 border ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="">Select a category</option>
                  {filteredCategories.map((category: Category) => (
                    <option key={category.id} value={category.id}>
                      {category.emoji} {category.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.categoryId && (
              <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>
            )}
          </div>
          
          {/* Household Toggle */}
          {households.length > 0 && currentHousehold && (
            <div className="space-y-3">
              <div className="flex items-center">
                <Controller
                  name="isHousehold"
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={e => {
                        onChange(e.target.checked);
                        if (!e.target.checked) {
                          setShowSplitOptions(false);
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  )}
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Add to {currentHousehold?.name || 'household'} expenses
                </label>
              </div>
              
              {isHousehold && (
                <div className="pl-6">
                  <button
                    type="button"
                    onClick={handleEnableSplitOptions}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <FaUserFriends className="mr-1" />
                    {showSplitOptions ? 'Hide split options' : 'Split between members'}
                  </button>
                  
                  {!showSplitOptions && (
                    <div className="text-xs text-gray-500 mt-1 flex items-start">
                      <FaInfoCircle className="text-gray-400 mr-1 mt-0.5" />
                      <span>
                        When enabled, this expense will be divided among household members
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Split Options */}
              {isHousehold && showSplitOptions && (
                <div className="pl-6 border-l-2 border-blue-100 mt-2">
                  <div className="mb-2">
                    <div className="flex items-center mb-2">
                      <Controller
                        name="splitEqually"
                        control={control}
                        render={({ field: { value, onChange } }) => (
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={e => onChange(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        )}
                      />
                      <label className="ml-2 flex items-center text-sm text-gray-700">
                        <FaEquals className="mr-1" /> Split equally
                      </label>
                    </div>
                    
                    <div className="space-y-2 mt-3">
                      <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium">
                        <div className="col-span-6">Member</div>
                        <div className="col-span-3">Amount</div>
                        <div className="col-span-3">Percentage</div>
                      </div>
                      
                      {splitMemberFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-6 text-sm">{field.name}</div>
                          <div className="col-span-3 relative">
                            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">
                              {userData ? getCurrencySymbol(userData.currency as Currency) : '$'}
                            </span>
                            <input
                              type="text"
                              value={field.amount}
                              onChange={(e) => handleSplitAmountChange(index, e.target.value)}
                              disabled={splitEqually}
                              className={`block w-full pl-5 pr-2 py-1 text-sm border border-gray-300 rounded-md ${
                                splitEqually ? 'bg-gray-100' : ''
                              }`}
                            />
                          </div>
                          <div className="col-span-3 flex items-center">
                            <span className="text-sm">{field.percentage}%</span>
                          </div>
                        </div>
                      ))}
                      
                      {splitAmountError && (
                        <div className="text-sm text-amber-600 mt-2 flex items-start">
                          <FaInfoCircle className="text-amber-600 mr-1 mt-0.5" />
                          <div>
                            {splitAmountError}
                            <div className="text-xs mt-1">
                              (Will be automatically adjusted when saving)
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm; 