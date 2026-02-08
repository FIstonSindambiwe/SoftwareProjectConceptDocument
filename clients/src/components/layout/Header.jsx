// src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bars3Icon,
  Cog6ToothIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import authService from '../../services/api/authService';

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6">
      <div className="flex items-center justify-between w-full">
        {/* Left - Mobile menu + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Bars3Icon className="h-6 w-6 text-gray-600" />
          </button>
          
          <h1 className="text-lg font-medium text-gray-600">
            Dashboard User
          </h1>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button className="p-2 rounded-lg hover:bg-gray-100 relative">
            <BellIcon className="h-6 w-6 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Settings Menu Button */}
          <button 
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <Bars3Icon className="h-6 w-6 text-gray-500" />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div ref={menuRef} className="absolute right-6 top-14 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <UserCircleIcon className="h-5 w-5" />
                My Profile
              </button>
              <button
                onClick={() => {
                  navigate('/profile/change-password');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Cog6ToothIcon className="h-5 w-5" />
                Change Password
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;