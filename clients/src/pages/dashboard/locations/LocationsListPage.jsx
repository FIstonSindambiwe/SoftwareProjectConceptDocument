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
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Modal from '../../../components/common/Modal';
import Badge from '../../../components/common/Badge';
import LocationStatistics from '../../../components/locations/LocationStatistics';
import LocationFilters from '../../../components/locations/LocationFilters';
import programService from '../../../services/api/programService';

const LocationsListPage = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  
  // Modal states
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
      setLocations([]);
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

  const handleOpenToggleModal = (location) => {
    setSelectedLocation(location);
    setShowToggleModal(true);
  };

  const handleToggleActive = async () => {
    if (!selectedLocation) return;

    setIsUpdating(true);
    try {
      const response = await programService.toggleLocationActive(selectedLocation.id);
      const updatedLocation = response.location || response;
      
      toast.success(
        `Location ${updatedLocation.is_active ? 'activated' : 'deactivated'} successfully`
      );
      
      // Update the location in state
      setLocations(locations.map(loc => 
        loc.id === selectedLocation.id ? updatedLocation : loc
      ));
      
      setShowToggleModal(false);
    } catch (error) {
      console.error('Error toggling location:', error);
      toast.error('Failed to update location status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Get unique countries for filter
  const uniqueCountries = [...new Set(locations.map(loc => loc.country))].sort();

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

        {/* Statistics */}
        <LocationStatistics locations={locations} />

        {/* Filters */}
        <LocationFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          countryFilter={countryFilter}
          setCountryFilter={setCountryFilter}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          countries={uniqueCountries}
        />

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

        {/* Locations Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow">
            <Spinner size="lg" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <MapPinIcon className="mx-auto h-20 w-20" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No locations found</h3>
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
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Programs
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {locations.map((location, index) => (
                    <tr 
                      key={location.id} 
                      className={`transition-all duration-200 hover:bg-blue-50 hover:shadow-md ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {location.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {location.city}, {location.country}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {location.address || <span className="text-gray-400">N/A</span>}
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
                            <div className="text-gray-500 text-xs truncate">
                              {location.contact_email}
                            </div>
                          )}
                          {location.contact_phone && (
                            <div className="text-gray-500 text-xs">
                              {location.contact_phone}
                            </div>
                          )}
                          {!location.contact_person && !location.contact_email && !location.contact_phone && (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-blue-600">
                          {location.active_programs_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={location.is_active ? 'success' : 'default'}>
                          {location.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => navigate(`/locations/${location.id}`)}
                            className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => navigate(`/locations/${location.id}/edit`)}
                            className="p-2.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                            title="Edit Location"
                          >
                            <PencilIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleOpenToggleModal(location)}
                            className={`p-2.5 rounded-lg transition-all duration-200 hover:scale-110 group ${
                              location.is_active
                                ? 'text-red-600 hover:bg-red-100'
                                : 'text-green-600 hover:bg-green-100'
                            }`}
                            title={location.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {location.is_active ? (
                              <XCircleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Toggle Active Modal */}
        <Modal
          isOpen={showToggleModal}
          onClose={() => setShowToggleModal(false)}
          title={selectedLocation?.is_active ? 'Deactivate Location' : 'Activate Location'}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to {selectedLocation?.is_active ? 'deactivate' : 'activate'}{' '}
              <strong>{selectedLocation?.name}</strong>?
              <br /><br />
              {selectedLocation?.is_active ? (
                <>
                  This location will be marked as inactive. 
                  {selectedLocation?.active_programs_count > 0 && (
                    <span className="text-orange-600 font-medium">
                      <br />Note: This location has {selectedLocation.active_programs_count} active program(s).
                    </span>
                  )}
                </>
              ) : (
                'This location will be marked as active and available for programs.'
              )}
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowToggleModal(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant={selectedLocation?.is_active ? 'danger' : 'primary'}
                onClick={handleToggleActive}
                isLoading={isUpdating}
              >
                {selectedLocation?.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default LocationsListPage;