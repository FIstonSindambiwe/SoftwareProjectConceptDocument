// src/components/users/UserFilter.jsx
import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  ChevronDownIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import Input from '../common/Input';
import Button from '../common/Button';

const UserFilter = ({ 
  searchTerm = '', 
  roleFilter = '', 
  statusFilter = '', 
  onSearchChange, 
  onRoleChange, 
  onStatusChange,
  onClearFilters 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasActiveFilters = searchTerm || roleFilter || statusFilter;

  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin', color: 'bg-red-50 text-red-700' },
    { value: 'teacher', label: 'Teacher', color: 'bg-blue-50 text-blue-700' },
    { value: 'program_manager', label: 'Program Manager', color: 'bg-purple-50 text-purple-700' },
    { value: 'donor', label: 'Donor', color: 'bg-green-50 text-green-700' },
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active', color: 'bg-emerald-50 text-emerald-700' },
    { value: 'false', label: 'Inactive', color: 'bg-amber-50 text-amber-700' },
  ];

  const getRoleLabel = (value) => {
    const role = roleOptions.find(r => r.value === value);
    return role ? role.label : value;
  };

  const getStatusLabel = (value) => {
    const status = statusOptions.find(s => s.value === value);
    return status ? status.label : (value === 'true' ? 'Active' : 'Inactive');
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
              <FunnelIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Filter Users</h3>
              <p className="text-sm text-gray-500 mt-0.5">Narrow down your user list</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                icon={XMarkIcon}
                onClick={handleClearFilters}
                className="hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
              >
                Clear All
              </Button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronDownIcon 
                className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      <div className={`px-6 py-5 transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Search Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">
              <div className="flex items-center space-x-2">
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Search Users</span>
              </div>
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 py-3 rounded-xl border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>

          {/* Role Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Role</label>
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => onRoleChange(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 appearance-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </div>
              {roleFilter && (
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <div className={`w-2 h-2 rounded-full ${roleOptions.find(r => r.value === roleFilter)?.color?.replace('bg-', 'bg-').split(' ')[0] || 'bg-blue-500'}`} />
                </div>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-800">Status</label>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 appearance-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                <ChevronDownIcon className="h-5 w-5 text-gray-400" />
              </div>
              {statusFilter && (
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  {statusFilter === 'true' ? (
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Active Filters:</span>
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-full">
                {[searchTerm, roleFilter, statusFilter].filter(Boolean).length} active
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <div className="group relative">
                  <div className="flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-800 font-medium text-sm shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
                    <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                    {searchTerm}
                    <button
                      onClick={() => onSearchChange('')}
                      className="ml-3 p-0.5 hover:bg-blue-200 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform">
                    <CheckIcon className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
              
              {roleFilter && (
                <div className="group relative">
                  <div className="flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 text-purple-800 font-medium text-sm shadow-sm transition-all hover:shadow-md hover:scale-[1.02]">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                    Role: {getRoleLabel(roleFilter)}
                    <button
                      onClick={() => onRoleChange('')}
                      className="ml-3 p-0.5 hover:bg-purple-200 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
              
              {statusFilter && (
                <div className="group relative">
                  <div className={`flex items-center px-4 py-2 rounded-full border font-medium text-sm shadow-sm transition-all hover:shadow-md hover:scale-[1.02] ${
                    statusFilter === 'true' 
                      ? 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-800' 
                      : 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 text-amber-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      statusFilter === 'true' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}></div>
                    Status: {getStatusLabel(statusFilter)}
                    <button
                      onClick={() => onStatusChange('')}
                      className={`ml-3 p-0.5 rounded-full transition-colors ${
                        statusFilter === 'true' ? 'hover:bg-emerald-200' : 'hover:bg-amber-200'
                      }`}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Preview */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <FunnelIcon className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-gray-600">
              {hasActiveFilters ? 'Filters applied' : 'No filters active'}
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Footer Glow Effect */}
      <div className="h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
    </div>
  );
};

export default UserFilter;