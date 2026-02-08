// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  MapPinIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import authService from '../../services/api/authService';

const Sidebar = ({ isOpen, onClose }) => {
  const userRole = authService.getUserRole();
  const canEditData = authService.canEditData();
  const isAdmin = authService.isAdmin();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['all'] },
    { 
      name: 'Users', 
      href: '/users', 
      icon: UserGroupIcon, 
      roles: ['admin'] 
    },
    { 
      name: 'Locations', 
      href: '/locations', 
      icon: MapPinIcon, 
      roles: ['admin', 'program_manager'] 
    },
    { 
      name: 'Programs', 
      href: '/programs', 
      icon: AcademicCapIcon, 
      roles: ['all'] 
    },
    { 
      name: 'Participants', 
      href: '/participants', 
      icon: UsersIcon, 
      roles: ['admin', 'teacher', 'program_manager'] 
    },
    { 
      name: 'Attendance', 
      href: '/attendance', 
      icon: ClipboardDocumentCheckIcon, 
      roles: ['admin', 'teacher', 'program_manager'] 
    },
    { 
      name: 'Assessments', 
      href: '/assessments', 
      icon: ChartBarIcon, 
      roles: ['admin', 'teacher', 'program_manager'] 
    },
    { 
      name: 'Reports', 
      href: '/reports', 
      icon: DocumentTextIcon, 
      roles: ['all'] 
    },
  ];

  const hasAccess = (item) => {
    if (item.roles.includes('all')) return true;
    return item.roles.includes(userRole);
  };

  const filteredNavigation = navigation.filter(hasAccess);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:inset-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
            <span className="text-white font-bold text-lg">YIV</span>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-400 text-center">
              © 2024 Youth Impact Visualizer
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;