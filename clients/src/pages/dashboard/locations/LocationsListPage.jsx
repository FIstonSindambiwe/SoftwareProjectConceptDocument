// src/pages/dashboard/locations/LocationsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon,
  PencilIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import programService from '../../../services/api/programService';

const LocationsListPage = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (countryFilter) params.country = countryFilter;
      if (activeFilter) params.is_active = activeFilter;

      const data = await programService.getLocations(params);
      setLocations(data.results || data);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadLocations();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, countryFilter, activeFilter]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
            <p className="text-gray-600 mt-1">
              Manage program locations and facilities
            </p>
          </div>
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={() => navigate('/locations/create')}
            size="lg"
          >
            Add Location
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actions
              </label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setCountryFilter('');
                  setActiveFilter('');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">
            {isLoading ? (
              <span className="flex items-center">
                <Spinner size="sm" />
                <span className="ml-2">Loading locations...</span>
              </span>
            ) : (
              <span>
                Showing <span className="font-semibold text-gray-900">{locations.length}</span> location{locations.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Locations Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow">
            <Spinner size="lg" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-lg border border-gray-200">
            <MapPinIcon className="mx-auto h-20 w-20 text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">No locations found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || countryFilter || activeFilter
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Get started by adding your first location.'}
            </p>
            {!searchTerm && !countryFilter && !activeFilter && (
              <Button
                variant="primary"
                icon={PlusIcon}
                onClick={() => navigate('/locations/create')}
              >
                Add Your First Location
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {location.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <GlobeAltIcon className="h-4 w-4 mr-1" />
                      {location.city}, {location.country}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      location.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {location.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  {location.contact_person && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {location.contact_person}
                    </div>
                  )}
                  {location.contact_email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {location.contact_email}
                    </div>
                  )}
                  {location.contact_phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {location.contact_phone}
                    </div>
                  )}
                </div>

                {/* Programs Count */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Active Programs:</span>
                    <span className="font-semibold text-gray-900">
                      {location.active_programs_count || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => navigate(`/locations/${location.id}`)}
                    className="flex-1 py-2 px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <EyeIcon className="h-4 w-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/locations/${location.id}/edit`)}
                    className="flex-1 py-2 px-4 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LocationsListPage;