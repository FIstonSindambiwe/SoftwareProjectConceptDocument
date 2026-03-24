// src/pages/dashboard/participants/RoomsListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  HomeIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  CalendarIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  DocumentDuplicateIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Badge from '../../../components/common/Badge';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import ActionModal from '../../../components/common/ActionModal';
import useAuth from '../../../hooks/useAuth';
import participantService from '../../../services/api/participantService';
import programService from '../../../services/api/programService';

const PAGE_SIZE = 10; // 10 rooms per page

const RoomsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]); // For stats
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  // Action Modal state
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total_count: 0,
    page_size: PAGE_SIZE
  });

  // Check if user can edit (not donor)
  const canEdit = user?.role !== 'donor';

  useEffect(() => {
    fetchData();
    fetchAllRoomsForStats(); // Fetch all rooms for stats
  }, [filterProgram, filterStatus, pagination.page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: pagination.page,
        page_size: PAGE_SIZE
      };
      if (filterProgram) params.program = filterProgram;
      if (filterStatus) params.is_active = filterStatus === 'active';
      
      const [roomsData, programsData] = await Promise.all([
        participantService.getRooms(params),
        programService.getPrograms()
      ]);
      
      // Handle paginated response
      setRooms(roomsData.results || roomsData);
      setPagination(prev => ({
        ...prev,
        total_count: roomsData.count || roomsData.length || 0,
        total_pages: Math.ceil((roomsData.count || roomsData.length || 0) / PAGE_SIZE)
      }));
      
      setPrograms(programsData.results || programsData);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(err.message || 'Failed to load rooms. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllRoomsForStats = async () => {
    try {
      const response = await participantService.getRooms({ page_size: 1000 });
      setAllRooms(response.results || response);
    } catch (err) {
      console.error('Error fetching all rooms for stats:', err);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchData();
    fetchAllRoomsForStats();
  };

  const handleDelete = async (room) => {
    if (room.current_enrollment_count > 0) {
      setError(`Cannot delete "${room.name}" - it has ${room.current_enrollment_count} participant(s) assigned.`);
      setShowActionModal(false);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${room.name}"? This action cannot be undone.`)) {
      try {
        setDeletingId(room.id);
        await participantService.deleteRoom(room.id);
        setSuccess(`Room "${room.name}" deleted successfully`);
        
        // Refresh data
        fetchData();
        fetchAllRoomsForStats();
        
        // Auto-dismiss success message
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error deleting room:', err);
        setError(err.error || err.message || 'Failed to delete room');
      } finally {
        setDeletingId(null);
        setShowActionModal(false);
        setSelectedRoom(null);
      }
    }
  };

  const handleDuplicate = async (room) => {
    try {
      setLoading(true);
      // Create a copy of the room with a new name
      const duplicateData = {
        name: `${room.name} (Copy)`,
        program: room.program,
        capacity: room.capacity,
        schedule: room.schedule,
        description: room.description,
        is_active: true,
        notes: room.notes
      };
      
      await participantService.createRoom(duplicateData);
      setSuccess(`Room "${room.name}" duplicated successfully`);
      
      // Refresh data
      fetchData();
      fetchAllRoomsForStats();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error duplicating room:', err);
      setError(err.message || 'Failed to duplicate room');
    } finally {
      setLoading(false);
      setShowActionModal(false);
      setSelectedRoom(null);
    }
  };

  const handleActionClick = (room, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setModalPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 5
    });
    setSelectedRoom(room);
    setShowActionModal(true);
  };

  const handleClearFilters = () => {
    setFilterProgram('');
    setFilterStatus('');
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasActiveFilters = () => {
    return searchTerm || filterProgram || filterStatus;
  };

  const getActiveFilterCount = () => {
    return [searchTerm, filterProgram, filterStatus].filter(Boolean).length;
  };

  // Filter rooms by search term (client-side filtering for search only)
  const filteredRooms = useMemo(() => {
    if (!searchTerm) return rooms;
    
    const search = searchTerm.toLowerCase();
    return rooms.filter(room => 
      room.name?.toLowerCase().includes(search) ||
      room.program_name?.toLowerCase().includes(search) ||
      room.teacher_name?.toLowerCase().includes(search)
    );
  }, [rooms, searchTerm]);

  const canLoadMore = pagination.page < pagination.total_pages;

  // Calculate room statistics
  const totalRooms = allRooms.length;
  const activeRooms = allRooms.filter(r => r.is_active).length;
  const totalCapacity = allRooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
  const totalEnrolled = allRooms.reduce((sum, r) => sum + (r.current_enrollment_count || 0), 0);
  const averageOccupancy = totalCapacity > 0 ? ((totalEnrolled / totalCapacity) * 100).toFixed(1) : 0;
  const fullRooms = allRooms.filter(r => r.is_full).length;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  if (loading && rooms.length === 0) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ErrorBoundary fallback={<div>Something went wrong loading rooms.</div>}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HomeIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Rooms Management</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage classrooms and teacher assignments
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
                onClick={() => navigate('/dashboard/participants/rooms/create')}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create Room</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
          </div>

          {/* Room Statistics Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{totalRooms}</p>
              <p className="text-sm text-gray-600">Total Rooms</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{activeRooms}</p>
              <p className="text-sm text-gray-600">Active Rooms</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{totalCapacity}</p>
              <p className="text-sm text-gray-600">Total Capacity</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600">{totalEnrolled}</p>
              <p className="text-sm text-gray-600">Enrolled Participants</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-orange-600">{averageOccupancy}%</p>
              <p className="text-sm text-gray-600">Avg. Occupancy</p>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
                <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <button onClick={() => setError('')} className="text-red-500 hover:text-red-600">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {/* Filters Section */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowFilters(!showFilters)}
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
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {showFilters && (
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
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name, program, teacher..."
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

                {/* Program Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Filter by Program
                  </label>
                  <div className="relative">
                    <select
                      value={filterProgram}
                      onChange={(e) => {
                        setFilterProgram(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
                    >
                      <option value="">All Programs</option>
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
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
                      value={filterStatus}
                      onChange={(e) => {
                        setFilterStatus(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
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
          <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  <span>Loading rooms...</span>
                </span>
              ) : (
                <span>
                  Showing <span className="font-semibold text-gray-900">{filteredRooms.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{pagination.total_count}</span> room
                  {pagination.total_count !== 1 ? 's' : ''}
                  {hasActiveFilters() && (
                    <span className="text-gray-400 ml-1">(filtered)</span>
                  )}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.total_pages || 1}
            </div>
          </div>

          {/* Rooms Table */}
          {filteredRooms.length === 0 ? (
            <Card>
              <div className="text-center py-16">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <HomeIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
                <p className="text-sm text-gray-500 mb-6">
                  {hasActiveFilters()
                    ? 'Try adjusting your filters to find what you\'re looking for.'
                    : 'Create your first room to get started.'}
                </p>
                {!hasActiveFilters() ? (
                  canEdit && (
                    <Button onClick={() => navigate('/dashboard/participants/rooms/create')}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Your First Room
                    </Button>
                  )
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
                        Room
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Program
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Capacity
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Schedule
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
                    {filteredRooms.map((room) => (
                      <tr 
                        key={room.id} 
                        className="hover:bg-blue-50/50 transition-colors group relative"
                      >
                        {deletingId === room.id && (
                          <td colSpan="7" className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                            <Spinner size="sm" />
                          </td>
                        )}
                        
                        {/* Room Name */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <HomeIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {room.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                Created: {formatDate(room.created_at)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Program */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <AcademicCapIcon className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{room.program_name}</span>
                          </div>
                        </td>

                        {/* Teacher */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {room.teacher_name || '—'}
                          </div>
                          {room.teacher && (
                            <div className="text-xs text-gray-500">
                              ID: {room.teacher}
                            </div>
                          )}
                        </td>

                        {/* Capacity */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <UserGroupIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm font-medium text-gray-900">
                                {room.current_enrollment_count}/{room.capacity}
                              </span>
                            </div>
                            <Badge 
                              color={room.available_spots > 0 ? "green" : "red"} 
                              size="sm"
                            >
                              {room.available_spots} left
                            </Badge>
                          </div>
                          {/* Progress bar */}
                          <div className="w-32 mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${
                                  room.is_full ? 'bg-red-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min((room.current_enrollment_count / room.capacity) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {room.schedule ? (
                            <div className="flex items-center">
                              <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600">{room.schedule}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge color={room.is_active ? "green" : "gray"}>
                            {room.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={(e) => handleActionClick(room, e)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Actions"
                            disabled={deletingId === room.id}
                          >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Table footer with record count */}
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>
                    Showing {filteredRooms.length} of {pagination.total_count} rooms
                  </span>
                  <span className="text-gray-400">
                    Last updated: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-lg gap-4">
              <div className="text-sm text-gray-700">
                Page {pagination.page} of {pagination.total_pages}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className="px-3 py-2"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!canLoadMore || loading}
                  className="px-3 py-2"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <InformationCircleIcon className="h-4 w-4 mr-1" />
                <span>{PAGE_SIZE} rooms per page</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Modal */}
        <ActionModal
          isOpen={showActionModal}
          onClose={() => {
            setShowActionModal(false);
            setSelectedRoom(null);
          }}
          position={modalPosition}
          items={[
            {
              label: 'View Participants',
              icon: <UsersIcon className="h-4 w-4 mr-2" />,
              onClick: () => {
                navigate(`/dashboard/participants/rooms/${selectedRoom?.id}/participants`);
                setShowActionModal(false);
              }
            },
            ...(canEdit ? [
              {
                label: 'Edit Room',
                icon: <PencilIcon className="h-4 w-4 mr-2" />,
                onClick: () => {
                  navigate(`/dashboard/participants/rooms/${selectedRoom?.id}/edit`);
                  setShowActionModal(false);
                }
              },
              {
                label: 'Duplicate Room',
                icon: <DocumentDuplicateIcon className="h-4 w-4 mr-2" />,
                onClick: () => handleDuplicate(selectedRoom)
              },
              {
                label: 'Delete Room',
                icon: <TrashIcon className="h-4 w-4 mr-2" />,
                onClick: () => handleDelete(selectedRoom),
                className: 'text-red-600 hover:bg-red-50',
                disabled: selectedRoom?.current_enrollment_count > 0
              }
            ] : [])
          ]}
        />
      </ErrorBoundary>
    </Layout>
  );
};

export default RoomsListPage;