import React, { useState } from 'react';
import { TransactionWithCategory, Currency } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { FaChevronDown, FaChevronUp, FaUserFriends, FaExchangeAlt } from 'react-icons/fa';

interface TransactionListProps {
  transactions: TransactionWithCategory[];
  currency: Currency;
  onEdit?: (transaction: TransactionWithCategory) => void;
  onDelete?: (transaction: TransactionWithCategory) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  currency,
  onEdit,
  onDelete
}) => {
  const [expandedTransactions, setExpandedTransactions] = useState<Record<string, boolean>>({});
  
  const toggleExpand = (transactionId: string) => {
    setExpandedTransactions(prev => ({
      ...prev,
      [transactionId]: !prev[transactionId]
    }));
  };
  
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {transactions.map((transaction) => {
        if (!transaction) return null;
        
        const isExpanded = expandedTransactions[transaction.id] || false;
        const hasSplitInfo = transaction.householdId && 
                            transaction.splitInfo && 
                            Array.isArray(transaction.splitInfo) && 
                            transaction.splitInfo.length > 0;
        const isSplitPortion = !!transaction.isSplitPortion;
        
        // Ensure category exists
        const category = transaction.category || {
          id: 'unknown',
          name: 'Unknown',
          emoji: '❓',
          color: '#999',
          userId: transaction.userId,
        };
        
        return (
          <div key={transaction.id} className={`py-4 px-2 ${isSplitPortion ? 'bg-purple-50' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full mr-3">
                  <span className="text-lg">{category.emoji}</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 flex items-center">
                    {transaction.description || 'No description'}
                    {isSplitPortion && (
                      <span className="ml-2 text-xs text-purple-600 flex items-center">
                        <FaExchangeAlt className="mr-1" size={10} /> Split portion
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {formatDate(transaction.date)} • {category.name}
                  </p>
                  <div className="flex items-center mt-1 space-x-1">
                    {transaction.householdId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Household
                      </span>
                    )}
                    {hasSplitInfo && !isSplitPortion && (
                      <button 
                        onClick={() => toggleExpand(transaction.id)}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                      >
                        <FaUserFriends className="mr-1" /> Split
                        {isExpanded ? <FaChevronUp className="ml-1" size={10} /> : <FaChevronDown className="ml-1" size={10} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount || 0, currency)}
                </p>
                
                {/* Only show edit/delete buttons for non-split portions */}
                {!isSplitPortion && (onEdit || onDelete) && (
                  <div className="flex space-x-2 mt-1">
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(transaction)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(transaction)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Split details */}
            {isExpanded && hasSplitInfo && transaction.splitInfo && (
              <div className="mt-3 ml-13 pl-3 border-l-2 border-purple-100">
                <h4 className="text-xs font-medium text-gray-700 mb-1">Split Details</h4>
                <div className="space-y-1">
                  {transaction.splitInfo.map((split, index) => {
                    if (!split) return null;
                    return (
                      <div key={index} className="flex justify-between text-xs">
                        <span>{split.userId || 'Unknown user'}</span>
                        <div className="flex space-x-2">
                          <span className="text-gray-500">{split.percentage || 0}%</span>
                          <span className="font-medium">{formatCurrency(split.amount || 0, currency)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TransactionList; 