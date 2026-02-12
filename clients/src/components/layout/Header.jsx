// src/components/layout/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bars3Icon,
  Cog6ToothIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
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

  // Get user display name
  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.username) return user.username;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  // Get user role display
  const getRoleDisplay = () => {
    const role = user?.role || 'user';
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Get avatar initial
  const getAvatarInitial = () => {
    if (user?.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 sm:px-6 sticky top-0 z-30">
      <div className="flex items-center justify-between w-full">
        {/* Left - Mobile menu + Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
          </button>
          
          {/* Page title will be injected by child components or route config */}
          <div id="page-title" className="text-lg font-semibold text-gray-900">
            {/* This will be populated by individual pages */}
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group">
            <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 group-hover:text-gray-700" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Profile Button */}
          <button 
            className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg hover:bg-gray-100 transition-colors group"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {/* Avatar */}
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ring-2 ring-transparent group-hover:ring-blue-200 transition-all">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={getDisplayName()}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {getAvatarInitial()}
                </span>
              )}
            </div>
            
            {/* User Info - Hidden on mobile */}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                {getDisplayName()}
              </p>
              <p className="text-xs text-gray-500 group-hover:text-gray-700">
                {getRoleDisplay()}
              </p>
            </div>
            
            <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div 
              ref={menuRef} 
              className="absolute right-4 top-14 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-fade-in"
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{getDisplayName()}</p>
                <p className="text-xs text-gray-500 mt-0.5">{user?.email || 'No email'}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {getRoleDisplay()}
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <button
                onClick={() => {
                  navigate('/dashboard/profile');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UserCircleIcon className="h-5 w-5 text-gray-400" />
                My Profile
              </button>
              
              <button
                onClick={() => {
                  navigate('/dashboard/profile/change-password');
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Cog6ToothIcon className="h-5 w-5 text-gray-400" />
                Change Password
              </button>
              
              <div className="border-t border-gray-100 my-1.5"></div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-red-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </header>
  );
};

export default Header;