import React from 'react';
import { Category, CategoryWithTransactions, Currency } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface CategoryListProps {
  categories: Category[] | CategoryWithTransactions[];
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  showAmounts?: boolean;
  currency?: Currency;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  onEdit,
  onDelete,
  showAmounts = false,
  currency = 'USD'
}) => {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No categories found
      </div>
    );
  }

  // Check if the category has transaction data
  const hasTransactionData = (category: any): category is CategoryWithTransactions => {
    return 'totalAmount' in category && 'percentage' in category;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {categories.map((category) => (
        <div 
          key={category.id} 
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full mr-3">
                <span className="text-lg">{category.emoji}</span>
              </div>
              <h3 className="font-medium">{category.name}</h3>
            </div>
            
            {showAmounts && hasTransactionData(category) && (
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(category.totalAmount, currency)}
                </p>
                <p className="text-xs text-gray-500">
                  {category.percentage.toFixed(1)}%
                </p>
              </div>
            )}
          </div>
          
          {(onEdit || onDelete) && (
            <div className="flex justify-end mt-3 space-x-2">
              {onEdit && (
                <button 
                  onClick={() => onEdit(category)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              )}
              {onDelete && !category.isDefault && (
                <button 
                  onClick={() => onDelete(category)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CategoryList; 