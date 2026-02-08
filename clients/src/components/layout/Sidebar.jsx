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
  const user = authService.getCurrentUser();
  const userRole = authService.getUserRole();

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
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-64 
          bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900
          transform transition-transform duration-300 ease-in-out z-50
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white z-10"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* User Profile Section */}
          <div className="px-6 py-8 border-b border-slate-600">
            <div className="flex flex-col items-center">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-slate-600 flex items-center justify-center mb-4 shadow-xl ring-4 ring-slate-700">
                <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              
              {/* User Name */}
              <h3 className="text-white font-bold text-lg uppercase tracking-wide">
                {user?.username || 'JOHN DON'}
              </h3>
              
              {/* User Email */}
              <p className="text-slate-400 text-sm mt-1">
                {user?.email || 'johndon@company.com'}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-lg transition-all
                  ${isActive
                    ? 'bg-slate-600 text-white shadow-lg'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            <p className="text-xs text-slate-400 text-center">
              © 2024 Youth Impact Visualizer
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;