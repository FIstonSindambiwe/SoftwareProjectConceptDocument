// src/components/locations/LocationFilters.jsx
import React from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Button from '../common/Button';

const LocationFilters = ({
  searchTerm,
  setSearchTerm,
  countryFilter,
  setCountryFilter,
  activeFilter,
  setActiveFilter,
  countries = [],
}) => {
  const handleClearAll = () => {
    setSearchTerm('');
    setCountryFilter('');
    setActiveFilter('');
  };

  const hasActiveFilters = searchTerm || countryFilter || activeFilter;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Main Filters */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
              Search Locations
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, city, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              icon={XMarkIcon}
              onClick={handleClearAll}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="bg-blue-50 px-6 py-3 border-t border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-blue-900">
                Active Filters:
              </span>
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-200 text-blue-800">
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 hover:text-blue-900"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {countryFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-200 text-blue-800">
                  Country: {countryFilter}
                  <button
                    onClick={() => setCountryFilter('')}
                    className="ml-1 hover:text-blue-900"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-200 text-blue-800">
                  {activeFilter === 'true' ? 'Active' : 'Inactive'}
                  <button
                    onClick={() => setActiveFilter('')}
                    className="ml-1 hover:text-blue-900"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationFilters;