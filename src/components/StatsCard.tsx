import React from 'react';
import { Currency } from '@/types';
import { formatCurrency } from '@/utils/formatters';

interface StatsCardProps {
  title: string;
  amount: number;
  currency: Currency;
  type?: 'default' | 'income' | 'expense' | 'balance';
  icon?: React.ReactNode;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  amount,
  currency,
  type = 'default',
  icon
}) => {
  const getColorClass = () => {
    switch (type) {
      case 'income':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'expense':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'balance':
        return amount >= 0 
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };
  
  const getAmountColorClass = () => {
    switch (type) {
      case 'income':
        return 'text-green-700';
      case 'expense':
        return 'text-red-700';
      case 'balance':
        return amount >= 0 ? 'text-blue-700' : 'text-red-700';
      default:
        return 'text-gray-900';
    }
  };
  
  return (
    <div className={`rounded-lg border p-4 ${getColorClass()}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {icon && <div className="text-xl">{icon}</div>}
      </div>
      <p className={`mt-2 text-2xl font-semibold ${getAmountColorClass()}`}>
        {type === 'balance' && amount >= 0 && '+'}
        {formatCurrency(amount, currency)}
      </p>
    </div>
  );
};

export default StatsCard; 