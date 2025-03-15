import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaExchangeAlt, FaTags, FaUsers, FaUser } from 'react-icons/fa';
import { IoMdAdd } from 'react-icons/io';

interface NavigationProps {
  onAddTransaction: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onAddTransaction }) => {
  const pathname = usePathname();
  
  const navItems = [
    { path: '/', label: 'Home', icon: <FaHome size={20} /> },
    { path: '/flow', label: 'Flow', icon: <FaExchangeAlt size={20} /> },
    { path: '/categories', label: 'Categories', icon: <FaTags size={20} /> },
    { path: '/household', label: 'Household', icon: <FaUsers size={20} /> },
    { path: '/profile', label: 'Profile', icon: <FaUser size={20} /> },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === item.path ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
      
      {/* Add Transaction Button */}
      <button
        onClick={onAddTransaction}
        className="fixed bottom-20 right-4 bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        aria-label="Add Transaction"
      >
        <IoMdAdd size={24} />
      </button>
    </div>
  );
};

export default Navigation; 