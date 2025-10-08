import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaCog, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaTh } from 'react-icons/fa';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  createdAt?: string;
}

interface AccountDropdownProps {
  user: User | null;
  isLoading: boolean;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  onAccountSettings: () => void;
}

export const AccountDropdown: React.FC<AccountDropdownProps> = ({
  user,
  isLoading,
  onLogin,
  onRegister,
  onLogout,
  onAccountSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleItemClick = (action: () => void, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    action();
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <li>
        <div className="btn btn-ghost">
          <div className="loading loading-spinner loading-sm"></div>
        </div>
      </li>
    );
  }

  return (
    <div 
      ref={dropdownRef}
      tabIndex={0}
      className="z-10 hidden md:block dropdown dropdown-end"
    >
      <label 
        className="btn btn-ghost"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen(!isOpen);
          }
        }}
      >
        <FaUser className="w-4 h-4 sm:w-5 sm:h-5" />
        {user && (
          <span className="hidden sm:inline ml-1">
            {user.username}
          </span>
        )}
      </label>
      
      {isOpen && (
        <ul className="p-2 mt-1 rounded-md bg-gradient-to-bl drop-shadow text:base-content from-base-300 to-base-100 dropdown-content"
        >
          <li className="btn-ghost hover:drop-shadow-md text-base-content">
            <Link 
              href="/ironingBeads"
              onClick={() => setIsOpen(false)}
            >
              <FaTh className="w-4 h-4" />
              Ironing Beads Designer
            </Link>
          </li>
          
          {user ? (
            <>
              <li className="btn-ghost hover:drop-shadow-md text-base-content">
                <button 
                  onClick={(e) => handleItemClick(onAccountSettings, e)}
                >
                  <FaCog className="w-4 h-4" />
                  Account Settings
                </button>
              </li>
              <li className="btn-ghost hover:drop-shadow-md text-base-content">
                <button 
                  onClick={(e) => handleItemClick(onLogout, e)}
                >
                  <FaSignOutAlt className="w-4 h-4" />
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="btn-ghost hover:drop-shadow-md text-base-content">
                <button 
                  onClick={(e) => handleItemClick(onLogin, e)}
                >
                  <FaSignInAlt className="w-4 h-4" />
                  Login
                </button>
              </li>
              <li className="btn-ghost hover:drop-shadow-md text-base-content">
                <button 
                  onClick={(e) => handleItemClick(onRegister, e)}
                >
                  <FaUserPlus className="w-4 h-4" />
                  Register
                </button>
              </li>
            </>
          )}
          </ul>
        )}
    </div>
  );
};