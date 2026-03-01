// src/components/layout/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  // Navigation Icons
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  
  // Module Icons
  MapPinIcon,
  FlagIcon,
  CalendarIcon,
  CameraIcon,
  UserPlusIcon,
  ListBulletIcon,
  BeakerIcon,
  PresentationChartLineIcon,
  BuildingOfficeIcon, // NEW - For Rooms
  
  // UI Icons
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import authService from '../../services/api/authService';
import logoImage from '../../assets/images/l-o-g-o.png';

const Sidebar = ({ isOpen, onClose }) => {
  const user = authService.getCurrentUser();
  const userRole = authService.getUserRole();
  
  // Dropdown States
  const [openDropdowns, setOpenDropdowns] = useState({
    programs: false,
    youthManagement: false,
    attendance: false,
    assessments: false,
    reports: false
  });

  // Toggle dropdown
  const toggleDropdown = (key) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Navigation Configuration
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: HomeIcon, 
      roles: ['all'] 
    },
    
    { 
      name: 'Users', 
      href: '/dashboard/users',
      icon: UserGroupIcon, 
      roles: ['admin'] 
    },
    
    { 
      name: 'Programs', 
      icon: AcademicCapIcon, 
      roles: ['all'],
      isDropdown: true,
      dropdownKey: 'programs',
      children: [
        { 
          name: 'Locations', 
          href: '/dashboard/locations',
          icon: MapPinIcon, 
          roles: ['admin', 'program_manager'] 
        },
        { 
          name: 'Programs', 
          href: '/dashboard/programs',
          icon: AcademicCapIcon, 
          roles: ['all'] 
        },
        { 
          name: 'Milestones', 
          href: '/dashboard/milestones',
          icon: FlagIcon, 
          roles: ['admin', 'teacher', 'program_manager'] 
        },
      ]
    },
    
    { 
      name: 'Youth Management', 
      icon: UsersIcon, 
      roles: ['admin', 'teacher', 'program_manager', 'staff', 'donor'],
      isDropdown: true,
      dropdownKey: 'youthManagement',
      children: [
        { 
          name: 'Participants', 
          href: '/dashboard/participants',
          icon: UsersIcon, 
          roles: ['admin', 'teacher', 'program_manager', 'staff', 'donor'] 
        },
        { 
          name: 'Rooms', 
          href: '/dashboard/participants/rooms',
          icon: BuildingOfficeIcon, 
          roles: ['admin', 'program_manager'] 
        },
        { 
          name: 'Enrollments', 
          href: '/dashboard/enrollments',
          icon: UserPlusIcon, 
          roles: ['admin', 'teacher', 'program_manager', 'staff'] 
        },
      ]
    },

    { 
      name: 'Attendance', 
      icon: ClipboardDocumentCheckIcon, 
      roles: ['admin', 'teacher', 'program_manager', 'staff'],
      isDropdown: true,
      dropdownKey: 'attendance',
      children: [
        { 
          name: 'Attendance List', 
          href: '/dashboard/attendance',
          icon: CalendarIcon, 
          roles: ['admin', 'teacher', 'program_manager', 'staff'] 
        },
        { 
          name: 'Face Check-In', 
          href: '/dashboard/attendance/check-in',
          icon: CameraIcon, 
          roles: ['admin', 'teacher', 'program_manager', 'staff'] 
        },
        { 
          name: 'Bulk Attendance', 
          href: '/dashboard/attendance/bulk',
          icon: UserGroupIcon, 
          roles: ['admin', 'teacher', 'program_manager', 'staff'] 
        },
        { 
          name: 'Sessions', 
          href: '/dashboard/attendance/sessions',
          icon: CalendarIcon, 
          roles: ['admin', 'teacher', 'program_manager', 'staff'] 
        },
      ]
    },
    
    { 
      name: 'Assessments', 
      icon: ChartBarIcon, 
      roles: ['admin', 'teacher', 'program_manager', 'donor'],
      isDropdown: true,
      dropdownKey: 'assessments',
      children: [
        { 
          name: 'All Assessments', 
          href: '/dashboard/assessments',
          icon: ListBulletIcon, 
          roles: ['admin', 'teacher', 'program_manager', 'donor'] 
        },
        { 
          name: 'Indicators', 
          href: '/dashboard/assessments/indicators',
          icon: BeakerIcon, 
          roles: ['admin', 'teacher', 'program_manager', 'donor'] 
        },
      ]
    },
    
    { 
      name: 'Reports', 
      icon: DocumentTextIcon, 
      roles: ['all'],
      isDropdown: true,
      dropdownKey: 'reports',
      children: [
        { 
          name: 'General Report', 
          href: '/dashboard/reports/general',
          icon: PresentationChartLineIcon, 
          roles: ['admin', 'program_manager']
        },
      ]
    },
  ];

  // Role-based access control
  const hasAccess = (item) => {
    if (item.roles.includes('all')) return true;
    return item.roles.includes(userRole);
  };

  // Filter navigation based on user role
  const filteredNavigation = navigation.filter(item => {
    if (!hasAccess(item)) return false;
    if (item.isDropdown && item.children) {
      item.children = item.children.filter(child => hasAccess(child));
      return item.children.length > 0;
    }
    return true;
  });

  // Render dropdown menu
  const renderDropdown = (item) => {
    const isOpen = openDropdowns[item.dropdownKey];
    
    return (
      <div key={item.name}>
        {/* Dropdown Header */}
        <button
          onClick={() => toggleDropdown(item.dropdownKey)}
          className="w-full flex items-center justify-between gap-4 px-4 py-3 text-sm font-medium rounded-lg transition-all text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-md"
        >
          <div className="flex items-center gap-4">
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span>{item.name}</span>
          </div>
          {isOpen ? (
            <ChevronDownIcon className="h-4 w-4 transition-transform duration-200" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 transition-transform duration-200" />
          )}
        </button>

        {/* Dropdown Items */}
        {isOpen && (
          <div className="ml-8 mt-1 space-y-1">
            {item.children.map((child) => (
              <NavLink
                key={child.name}
                to={child.href}
                onClick={() => onClose()}
                end={child.href === '/dashboard/attendance' || child.href === '/dashboard/reports/general'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all
                  ${isActive
                    ? 'bg-slate-600 text-white shadow-inner'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <child.icon className="h-4 w-4 flex-shrink-0 opacity-80" />
                <span className="text-sm">{child.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render regular link
  const renderLink = (item) => (
    <NavLink
      key={item.name}
      to={item.href}
      onClick={() => onClose()}
      end={item.href === '/dashboard'}
      className={({ isActive }) =>
        `flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-lg transition-all
        ${isActive
          ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-inner border-l-4 border-blue-500'
          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white hover:shadow-md'
        }`
      }
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      <span>{item.name}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full w-64 
          bg-slate-900
          transform transition-transform duration-300 ease-in-out z-50
          lg:translate-x-0 shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white z-10 p-2 rounded-full hover:bg-slate-700 transition-colors"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* Logo Section */}
          <div className="px-6 py-8 border-b border-slate-700/50">
            <div className="flex flex-col items-center">
              <div className="w-36 h-36 mb-4 flex items-center justify-center">
                <img 
                  src={logoImage} 
                  alt="Youth Impact Visualizer Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-white font-bold text-2xl tracking-wide text-center">
                Youth Impact
              </h3>
              <p className="text-slate-400 text-xs mt-1 text-center">
                Track • Measure • Visualize
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {filteredNavigation.map((item) => 
              item.isDropdown ? renderDropdown(item) : renderLink(item)
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700/50">
            <p className="text-xs text-slate-400 text-center">
              © {new Date().getFullYear()} Youth Empowerment System
            </p>
            <p className="text-xs text-slate-500 text-center mt-1">
              v1.0.0
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;