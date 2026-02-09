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
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Modal from '../../../components/common/Modal';
import ProgramFilters from '../../../components/programs/ProgramFilters';
import ProgramStatistics from '../../../components/programs/ProgramStatistics';
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
  
  // Modal states
  const [showToggleModal, setShowToggleModal] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

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
      
      // Handle both paginated and non-paginated responses
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
      
      // Update the program in the list
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
      
      // Update the program in the list
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
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={() => navigate('/programs/create')}
            size="lg"
          >
            Create Program
          </Button>
        </div>

        {/* Statistics */}
        <ProgramStatistics programs={programs} />

        {/* Filters */}
        <ProgramFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          locationFilter={locationFilter}
          setLocationFilter={setLocationFilter}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          ongoingFilter={ongoingFilter}
          setOngoingFilter={setOngoingFilter}
        />

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
              {searchTerm || statusFilter || locationFilter || activeFilter || ongoingFilter
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Get started by creating your first program.'}
            </p>
            {!searchTerm && !statusFilter && !locationFilter && !activeFilter && !ongoingFilter && (
              <Button
                variant="primary"
                icon={PlusIcon}
                onClick={() => navigate('/programs/create')}
              >
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
                      className={`transition-all duration-200 hover:bg-blue-50 hover:shadow-md ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {program.name}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            {program.is_ongoing && (
                              <span className="inline-flex items-center text-xs text-green-600">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                Ongoing
                              </span>
                            )}
                            {!program.is_active && (
                              <span className="inline-flex items-center text-xs text-gray-500">
                                <XCircleIcon className="h-3 w-3 mr-1" />
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <div>
                            <div>{program.location_name}</div>
                            <div className="text-xs text-gray-500">{program.location_city}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
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
                          <UsersIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {program.enrollment_count || 0}
                          </span>
                          <span className="text-gray-500 mx-1">/</span>
                          <span className="text-gray-600">{program.target_participants}</span>
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
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => navigate(`/programs/${program.id}`)}
                            className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => navigate(`/programs/${program.id}/edit`)}
                            className="p-2.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                            title="Edit Program"
                          >
                            <PencilIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </button>
                          {/* <button
                            onClick={() => handleOpenToggleModal(program)}
                            className={`p-2.5 ${
                              program.is_active 
                                ? 'text-red-600 hover:bg-red-100' 
                                : 'text-green-600 hover:bg-green-100'
                            } rounded-lg transition-all duration-200 hover:scale-110 group`}
                            title={program.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {program.is_active ? (
                              <XCircleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            ) : (
                              <CheckCircleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            )}
                          </button> */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
{/* 
        Toggle Active/Inactive Modal
        <Modal
          isOpen={showToggleModal}
          onClose={() => setShowToggleModal(false)}
          title={`${selectedProgram?.is_active ? 'Deactivate' : 'Activate'} Program`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {selectedProgram?.is_active ? (
                <>
                  Are you sure you want to deactivate <strong>{selectedProgram?.name}</strong>?
                  <br /><br />
                  This will prevent new enrollments and hide the program from active listings.
                </>
              ) : (
                <>
                  Are you sure you want to activate <strong>{selectedProgram?.name}</strong>?
                  <br /><br />
                  This will make the program visible and allow new enrollments.
                </>
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
                variant={selectedProgram?.is_active ? 'danger' : 'primary'}
                onClick={handleToggleActive}
                isLoading={isUpdating}
              >
                {selectedProgram?.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </Modal> */}
      </div>
    </Layout>
  );
};

export default ProgramsListPage;