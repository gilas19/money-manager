import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useHouseholdStore } from '@/store/householdStore';
import Image from 'next/image';
import { FaBell } from 'react-icons/fa';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  showHouseholdSelector?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showHouseholdSelector = false }) => {
  const { userData } = useAuth();
  const { households, invitations, currentHousehold, setCurrentHousehold } = useHouseholdStore();
  
  const handleHouseholdChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const householdId = e.target.value;
    
    if (householdId === 'personal') {
      setCurrentHousehold(null);
    } else {
      const household = households.find(h => h.id === householdId);
      if (household) {
        setCurrentHousehold(household);
      }
    }
  };
  
  // Function to validate URL
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  return (
    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center">
        {userData?.photoURL && isValidUrl(userData.photoURL) ? (
          <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
            <Image 
              src={userData.photoURL} 
              alt={userData.displayName || 'User'} 
              width={32} 
              height={32}
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
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
            <span className="text-gray-500 text-sm">
              {userData?.displayName?.charAt(0) || 'U'}
            </span>
          </div>
        )}
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      
      <div className="flex items-center">
        {/* Notification Bell */}
        {invitations.length > 0 && (
          <Link href="/household" className="relative mr-4">
            <FaBell className="text-gray-600 hover:text-blue-600" size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {invitations.length}
            </span>
          </Link>
        )}
        
        {/* Household Selector */}
        {showHouseholdSelector && households.length > 0 && (
          <select
            value={currentHousehold?.id || 'personal'}
            onChange={handleHouseholdChange}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          >
            <option value="personal">Personal</option>
            {households.map(household => (
              <option key={household.id} value={household.id}>
                {household.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
};

export default Header; 