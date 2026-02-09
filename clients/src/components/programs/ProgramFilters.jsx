// src/components/programs/ProgramFilters.jsx
import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import programService from '../../services/api/programService';

const ProgramFilters = ({ 
  searchTerm, 
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  locationFilter,
  setLocationFilter,
  activeFilter,
  setActiveFilter,
  ongoingFilter,
  setOngoingFilter,
}) => {
  const [locations, setLocations] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await programService.getLocations();
      const locationsList = data.results || data || [];
      setLocations(locationsList);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleClearAll = () => {
    setSearchTerm('');
    setStatusFilter('');
    setLocationFilter('');
    setActiveFilter('');
    setOngoingFilter('');
  };

  const hasActiveFilters = searchTerm || statusFilter || locationFilter || activeFilter || ongoingFilter;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Main Filters */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MagnifyingGlassIcon className="h-4 w-4 inline mr-1" />
              Search Programs
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex flex-col justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={FunnelIcon}
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                icon={XMarkIcon}
                onClick={handleClearAll}
                className="w-full"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Locations</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Active Status
                </label>
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Programs</option>
                  <option value="true">Active Only</option>
                  <option value="false">Inactive Only</option>
                </select>
              </div>

              {/* Ongoing Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timeline
                </label>
                <select
                  value={ongoingFilter}
                  onChange={(e) => setOngoingFilter(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Timelines</option>
                  <option value="ongoing">Ongoing Only</option>
                  <option value="upcoming">Upcoming Only</option>
                  <option value="past">Past Only</option>
                </select>
              </div>
            </div>
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
              {statusFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-200 text-blue-800">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter('')}
                    className="ml-1 hover:text-blue-900"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {locationFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-200 text-blue-800">
                  Location: {locations.find(l => l.id === parseInt(locationFilter))?.name}
                  <button
                    onClick={() => setLocationFilter('')}
                    className="ml-1 hover:text-blue-900"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-200 text-blue-800">
                  {activeFilter === 'true' ? 'Active Only' : 'Inactive Only'}
                  <button
                    onClick={() => setActiveFilter('')}
                    className="ml-1 hover:text-blue-900"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {ongoingFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-200 text-blue-800">
                  {ongoingFilter.charAt(0).toUpperCase() + ongoingFilter.slice(1)}
                  <button
                    onClick={() => setOngoingFilter('')}
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

export default ProgramFilters;