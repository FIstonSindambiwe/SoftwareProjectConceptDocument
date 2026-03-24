// src/pages/dashboard/locations/LocationsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon,
  PencilIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Spinner from '../../../components/common/Spinner';
import Badge from '../../../components/common/Badge';
import programService from '../../../services/api/programService';

const LocationsListPage = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setIsLoading(true);
    
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (countryFilter) params.country = countryFilter;
      if (activeFilter) params.is_active = activeFilter === 'active';

      const data = await programService.getLocations(params);
      setLocations(data.results || data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
      setLocations([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!isLoading) loadLocations();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, countryFilter, activeFilter]);

  const handleRefresh = () => {
    loadLocations(true);
  };

  const handleToggleActive = async (location) => {
    try {
      const response = await programService.toggleLocationActive(location.id);
      const updatedLocation = response.location || response;
      
      toast.success(
        `${location.name} ${updatedLocation.is_active ? 'activated' : 'deactivated'} successfully`
      );
      
      setLocations(locations.map(loc => 
        loc.id === location.id ? updatedLocation : loc
      ));
    } catch (error) {
      console.error('Error toggling location:', error);
      toast.error('Failed to update location status');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCountryFilter('');
    setActiveFilter('');
  };

  const hasActiveFilters = () => {
    return searchTerm || countryFilter || activeFilter;
  };

  const getActiveFilterCount = () => {
    return [searchTerm, countryFilter, activeFilter].filter(Boolean).length;
  };

  // Get unique countries for filter
  const uniqueCountries = [...new Set(locations.map(loc => loc.country).filter(Boolean))].sort();

  const formatAddress = (location) => {
    const parts = [];
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.postal_code) parts.push(location.postal_code);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage program locations and facilities
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard/locations/create')}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add Location</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Simple Statistics Card */}
        {/* <Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-3">
              <p className="text-2xl font-bold text-indigo-600">{locations.length}</p>
              <p className="text-sm text-gray-600">Total Locations</p>
            </div>
            <div className="text-center p-3">
              <p className="text-2xl font-bold text-green-600">
                {locations.filter(l => l.is_active).length}
              </p>
              <p className="text-sm text-gray-600">Active Locations</p>
            </div>
            <div className="text-center p-3">
              <p className="text-2xl font-bold text-gray-600">
                {[...new Set(locations.map(l => l.country).filter(Boolean))].length}
              </p>
              <p className="text-sm text-gray-600">Countries</p>
            </div>
          </div>
        </Card> */}

        {/* Filters Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Filter Header */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
              {hasActiveFilters() && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                  {getActiveFilterCount()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters() && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFilters();
                  }}
                  className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50"
                >
                  Clear all
                </button>
              )}
              <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Filter Content */}
          {isFilterOpen && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, city, or country..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Country Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Country
                </label>
                <div className="relative">
                  <select
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none bg-white"
                  >
                    <option value="">All Countries</option>
                    {uniqueCountries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm appearance-none bg-white"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <Card className="flex items-center justify-between px-6 py-3">
          <div className="text-sm text-gray-600">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Spinner size="sm" />
                <span>Loading locations...</span>
              </span>
            ) : (
              <span>
                Showing <span className="font-semibold text-gray-900">{locations.length}</span> location{locations.length !== 1 ? 's' : ''}
                {hasActiveFilters() && (
                  <span className="text-gray-400"> (filtered)</span>
                )}
              </span>
            )}
          </div>
          <button 
            onClick={handleRefresh} 
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 lg:hidden"
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </Card>

        {/* Locations Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-lg border border-gray-200">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" />
              <p className="text-sm text-gray-500">Loading locations...</p>
            </div>
          </div>
        ) : locations.length === 0 ? (
          <Card className="text-center py-16">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <MapPinIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
              <p className="text-sm text-gray-500 mb-6">
                {hasActiveFilters()
                  ? 'Try adjusting your filters to find what you\'re looking for.'
                  : 'Get started by adding your first location.'}
              </p>
              {!hasActiveFilters() ? (
                <Button
                  variant="primary"
                  onClick={() => navigate('/dashboard/locations/create')}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Your First Location
                </Button>
              ) : (
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden" padding={false}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Address
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Programs
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.map((location) => {
                    const address = formatAddress(location);
                    return (
                      <tr 
                        key={location.id} 
                        className="hover:bg-indigo-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <MapPinIcon className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {location.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {location.city}, {location.country}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate" title={address}>
                            {address || <span className="text-gray-400">No address provided</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {location.contact_person && (
                              <div className="text-gray-900 font-medium">
                                {location.contact_person}
                              </div>
                            )}
                            {location.contact_email && (
                              <div className="text-xs text-gray-500 truncate max-w-[180px]" title={location.contact_email}>
                                {location.contact_email}
                              </div>
                            )}
                            {location.contact_phone && (
                              <div className="text-xs text-gray-500">
                                {location.contact_phone}
                              </div>
                            )}
                            {!location.contact_person && !location.contact_email && !location.contact_phone && (
                              <span className="text-gray-400 text-sm">No contact</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <span className="font-semibold text-indigo-600">
                              {location.active_programs_count || 0}
                            </span>
                            <span className="text-gray-500 text-xs ml-1">
                              active
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={location.is_active ? 'success' : 'default'} size="sm">
                            <span className={`mr-1.5 h-2 w-2 rounded-full ${location.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                            {location.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/dashboard/locations/${location.id}`)}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            
                            <button
                              onClick={() => navigate(`/dashboard/locations/${location.id}/edit`)}
                              className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                              title="Edit Location"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            
                            <button
                              onClick={() => handleToggleActive(location)}
                              className={`p-2 rounded-lg transition-all ${
                                location.is_active
                                  ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                  : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                              }`}
                              title={location.is_active ? 'Deactivate' : 'Activate'}
                            >
                              {location.is_active ? (
                                <XCircleIcon className="h-5 w-5" />
                              ) : (
                                <CheckCircleIcon className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              <div className="flex items-center justify-between">
                <span>
                  Showing {locations.length} of {locations.length} locations
                </span>
                <span className="text-gray-400">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default LocationsListPage;