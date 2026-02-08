// src/components/layout/Header.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon, 
  BellIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import authService from '../../services/api/authService';
import Badge from '../common/Badge';

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const getRoleBadgeVariant = (role) => {
    const variants = {
      admin: 'danger',
      teacher: 'primary',
      program_manager: 'warning',
      donor: 'success',
    };
    return variants[role] || 'default';
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden mr-4 p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <h1 className="text-xl font-bold text-gray-900">
              Youth Impact Visualizer
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            {/* Settings */}
            <button 
              onClick={() => navigate('/settings')}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full"
            >
              <Cog6ToothIcon className="h-6 w-6" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="h-8 w-8 text-gray-500" />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                    <Badge variant={getRoleBadgeVariant(user?.role)} size="sm">
                      {user?.role?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </button>

              {/* Dropdown menu */}
              {showProfileMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowProfileMenu(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20 border border-gray-200">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <UserCircleIcon className="h-5 w-5 mr-3" />
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        navigate('/profile/change-password');
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Cog6ToothIcon className="h-5 w-5 mr-3" />
                      Change Password
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;