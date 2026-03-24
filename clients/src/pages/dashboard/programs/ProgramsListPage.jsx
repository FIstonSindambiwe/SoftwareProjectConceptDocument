// src/pages/dashboard/programs/ProgramsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon,
  PencilIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EllipsisVerticalIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Dropdown from '../../../components/common/Dropdown';
import programService from '../../../services/api/programService';

const ProgramsListPage = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [ongoingFilter, setOngoingFilter] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Modal states
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const statusOptions = [
    { value: 'planning', label: 'Planning', color: 'gray' },
    { value: 'active', label: 'Active', color: 'green' },
    { value: 'completed', label: 'Completed', color: 'blue' },
    { value: 'on_hold', label: 'On Hold', color: 'yellow' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' },
  ];

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      if (locationFilter) params.location = locationFilter;
      if (activeFilter) params.is_active = activeFilter;

      const data = await programService.getPrograms(params);
      
      let programsList = [];
      if (data && data.results && Array.isArray(data.results)) {
        programsList = data.results;
      } else if (Array.isArray(data)) {
        programsList = data;
      }

      // Apply client-side filters that aren't supported by API
      if (ongoingFilter) {
        programsList = programsList.filter(p => {
          if (ongoingFilter === 'ongoing') return p.is_ongoing;
          if (ongoingFilter === 'upcoming') {
            const today = new Date();
            const startDate = new Date(p.start_date);
            return startDate > today;
          }
          if (ongoingFilter === 'past') {
            const today = new Date();
            const endDate = p.end_date ? new Date(p.end_date) : null;
            return endDate && endDate < today;
          }
          return true;
        });
      }

      setPrograms(programsList);
    } catch (error) {
      console.error('Error loading programs:', error);
      toast.error('Failed to load programs');
      setPrograms([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadPrograms();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter, locationFilter, activeFilter, ongoingFilter]);

  const handleStatusChange = async (program, newStatus) => {
    if (newStatus === program.status) return;

    setIsUpdating(true);
    try {
      const response = await programService.changeProgramStatus(
        program.id,
        newStatus
      );
      
      toast.success(response.message);
      
      setPrograms(programs.map(p => 
        p.id === program.id ? response.program : p
      ));
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error(error.error || 'Failed to change status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenToggleModal = (program) => {
    setSelectedProgram(program);
    setShowToggleModal(true);
  };

  const handleToggleActive = async () => {
    if (!selectedProgram) return;

    setIsUpdating(true);
    try {
      const response = await programService.toggleProgramActive(selectedProgram.id);
      
      toast.success(response.message);
      
      setPrograms(programs.map(p => 
        p.id === selectedProgram.id ? response.program : p
      ));
      
      setShowToggleModal(false);
    } catch (error) {
      console.error('Error toggling active status:', error);
      toast.error('Failed to update program');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenDeleteModal = (program) => {
    setSelectedProgram(program);
    setShowDeleteModal(true);
  };

  const handleDeleteProgram = async () => {
    if (!selectedProgram) return;

    setIsUpdating(true);
    try {
      await programService.deleteProgram(selectedProgram.id);
      
      toast.success('Program deleted successfully');
      
      setPrograms(programs.filter(p => p.id !== selectedProgram.id));
      
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting program:', error);
      toast.error(error.response?.data?.error || 'Failed to delete program');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleArchiveProgram = async (program) => {
    if (!program?.id) return;

    setIsUpdating(true);
    try {
      const response = await programService.toggleProgramActive(program.id);
      
      toast.success(response.message || 'Program archived successfully');
      
      setPrograms(programs.map(p => 
        p.id === program.id ? response.program : p
      ));
    } catch (error) {
      console.error('Error archiving program:', error);
      toast.error('Failed to archive program');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      planning: 'bg-gray-100 text-gray-800 border-gray-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPrograms();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setLocationFilter('');
    setActiveFilter('');
    setOngoingFilter('');
  };

  const hasActiveFilters = () => {
    return searchTerm || statusFilter || locationFilter || activeFilter || ongoingFilter;
  };

  const getActiveFilterCount = () => {
    return [searchTerm, statusFilter, locationFilter, activeFilter, ongoingFilter].filter(Boolean).length;
  };

  // Get unique locations for filter
  const uniqueLocations = [...new Set(programs.map(p => p.location_name).filter(Boolean))].sort();

  const ActionMenu = ({ program }) => {
    const menuItems = [
      {
        label: 'View Details',
        icon: <EyeIcon className="h-4 w-4 mr-2" />,
        onClick: () => navigate(`/dashboard/programs/${program.id}`),
        className: 'text-gray-700 hover:bg-gray-50'
      },
      {
        label: 'Edit Program',
        icon: <PencilIcon className="h-4 w-4 mr-2" />,
        onClick: () => navigate(`/dashboard/programs/${program.id}/edit`),
        className: 'text-gray-700 hover:bg-gray-50'
      },
      {
        divider: true
      }
    ];

    return (
      <Dropdown
        trigger={
          <button 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Actions"
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>
        }
        items={menuItems}
        align="right"
      />
    );
  };

  // Calculate statistics
  const totalPrograms = programs.length;
  const activePrograms = programs.filter(p => p.status === 'active').length;
  const completedPrograms = programs.filter(p => p.status === 'completed').length;
  const totalParticipants = programs.reduce((sum, p) => sum + (p.enrollment_count || 0), 0);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Programs</h1>
            <p className="text-gray-600 mt-1">
              Manage youth development programs
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard/programs/create')}
              size="lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Program
            </Button>
          </div>
        </div>

        {/* Simple Statistics Card */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalPrograms}</p>
            <p className="text-sm text-gray-600">Total Programs</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{activePrograms}</p>
            <p className="text-sm text-gray-600">Active Programs</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-600">{completedPrograms}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{totalParticipants}</p>
            <p className="text-sm text-gray-600">Total Participants</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
                  >
                    <option value="">All Status</option>
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Location Filter */}
              {uniqueLocations.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Location
                  </label>
                  <div className="relative">
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
                    >
                      <option value="">All Locations</option>
                      {uniqueLocations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Active Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Active Status
                </label>
                <div className="relative">
                  <select
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Ongoing Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Timeline
                </label>
                <div className="relative">
                  <select
                    value={ongoingFilter}
                    onChange={(e) => setOngoingFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
                  >
                    <option value="">All Programs</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                  </select>
                  <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">
            {isLoading ? (
              <span className="flex items-center">
                <Spinner size="sm" />
                <span className="ml-2">Loading programs...</span>
              </span>
            ) : (
              <span>
                Showing <span className="font-semibold text-gray-900">{programs.length}</span> program{programs.length !== 1 ? 's' : ''}
                {hasActiveFilters() && <span className="text-gray-400 ml-1">(filtered)</span>}
              </span>
            )}
          </div>
        </div>

        {/* Programs Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow">
            <Spinner size="lg" />
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-20 w-20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No programs found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {hasActiveFilters()
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Get started by creating your first program.'}
            </p>
            {!hasActiveFilters() && (
              <Button
                variant="primary"
                onClick={() => navigate('/dashboard/programs/create')}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Program
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
                      Program
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Timeline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Participants
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
                  {programs.map((program, index) => (
                    <tr 
                      key={program.id} 
                      className={`transition-all duration-200 hover:bg-blue-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div 
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                            onClick={() => navigate(`/dashboard/programs/${program.id}`)}
                          >
                            {program.name}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            {program.is_ongoing && (
                              <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                Ongoing
                              </span>
                            )}
                            {!program.is_active && (
                              <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                <XCircleIcon className="h-3 w-3 mr-1" />
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPinIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          <div className="truncate">
                            <div className="truncate">{program.location_name || 'No location'}</div>
                            {program.location_city && (
                              <div className="text-xs text-gray-500 truncate">{program.location_city}</div>
                            )}
                          </div>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          <div>
                            <div>{new Date(program.start_date).toLocaleDateString()}</div>
                            {program.end_date && (
                              <div className="text-xs text-gray-500">
                                to {new Date(program.end_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm">
                          <UsersIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900">
                              {program.enrollment_count || 0}
                            </span>
                            <span className="text-gray-500 mx-1">/</span>
                            <span className="text-gray-600">{program.target_participants || 'N/A'}</span>
                          </div>
                        </div>
                       </td>
                      <td className="px-6 py-4">
                        <select
                          value={program.status}
                          onChange={(e) => handleStatusChange(program, e.target.value)}
                          disabled={isUpdating}
                          className={`px-3 py-1 text-xs font-semibold rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${getStatusBadgeColor(program.status)}`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <ActionMenu program={program} />
                        </div>
                       </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProgramsListPage;