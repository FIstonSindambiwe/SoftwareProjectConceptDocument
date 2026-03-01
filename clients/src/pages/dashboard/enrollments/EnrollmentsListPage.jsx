// src/pages/dashboard/enrollments/EnrollmentsListPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  UserGroupIcon,
  ChartBarIcon,
  EllipsisVerticalIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  GiftIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import useAuth from '../../../hooks/useAuth';
import enrollmentService from '../../../services/api/enrollmentService';
import programService from '../../../services/api/programService';
import participantService from '../../../services/api/participantService';
import { debounce } from 'lodash';

const PAGE_SIZE = 10;

const EnrollmentsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [enrollments, setEnrollments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ x: 0, y: 0 });
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [stats, setStats] = useState({
    total_enrollments: 0,
    active_count: 0,
    completed_count: 0,
    dropout_count: 0,
    scholarship_count: 0,
    average_attendance: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total_count: 0,
    page_size: PAGE_SIZE
  });
  const [filters, setFilters] = useState({
    program: '',
    participant: '',
    status: '',
    has_dropped_out: '',
    has_scholarship: '',
    has_finished: '',
    date_from: '',
    date_to: '',
    search: ''
  });

  // Check user permissions
  const userRole = user?.role;
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';
  const isProgramManager = userRole === 'program_manager';
  const isDonor = userRole === 'donor';
  
  const canEdit = !isDonor;

  // Simple debounce implementation
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch programs and participants on mount
  useEffect(() => {
    fetchPrograms();
    fetchParticipants();
  }, []);

  // Fetch enrollments when filters, page, or debounced search changes
  useEffect(() => {
    fetchEnrollments();
  }, [
    filters.program, 
    filters.participant, 
    filters.status, 
    filters.has_dropped_out,
    filters.has_scholarship,
    filters.has_finished,
    filters.date_from,
    filters.date_to,
    pagination.page, 
    debouncedSearch
  ]);

  const fetchPrograms = async () => {
    try {
      const data = await programService.getPrograms({ limit: 100, is_active: true });
      setPrograms(data.results || data || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const fetchParticipants = async () => {
    try {
      const data = await participantService.getParticipants({ limit: 100, is_active: 'true' });
      setParticipants(data.results || data || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: pagination.page,
        page_size: PAGE_SIZE
      };
      
      if (filters.program) params.program = filters.program;
      if (filters.participant) params.participant = filters.participant;
      if (filters.status) params.status = filters.status;
      if (filters.has_dropped_out) params.has_dropped_out = filters.has_dropped_out === 'true';
      if (filters.has_scholarship) params.has_scholarship = filters.has_scholarship === 'true';
      if (filters.has_finished) params.has_finished = filters.has_finished === 'true';
      if (filters.date_from) params.enrollment_date__gte = filters.date_from;
      if (filters.date_to) params.enrollment_date__lte = filters.date_to;
      if (debouncedSearch) params.search = debouncedSearch;
      
      const response = await enrollmentService.getEnrollments(params);
      
      const enrollmentsList = response.results || response || [];
      const validEnrollments = enrollmentsList.filter(e => e && e.id);
      
      setEnrollments(validEnrollments);
      
      setPagination({
        page: response.page || 1,
        total_pages: response.total_pages || Math.ceil((response.count || validEnrollments.length) / PAGE_SIZE) || 1,
        total_count: response.count || validEnrollments.length || 0,
        page_size: PAGE_SIZE
      });
      
      // Fetch stats
      fetchStats();
      
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError(err.message || 'Failed to load enrollments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await enrollmentService.getEnrollmentStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Calculate from current data as fallback
      const total = enrollments.length;
      const active = enrollments.filter(e => e.status === 'active' || e.status === 'enrolled').length;
      const completed = enrollments.filter(e => e.has_finished || e.status === 'completed').length;
      const dropped = enrollments.filter(e => e.has_dropped_out).length;
      const scholarship = enrollments.filter(e => e.has_scholarship).length;
      const avgAttendance = enrollments.reduce((sum, e) => sum + (e.attendance_rate || 0), 0) / (total || 1);
      
      setStats({
        total_enrollments: total,
        active_count: active,
        completed_count: completed,
        dropout_count: dropped,
        scholarship_count: scholarship,
        average_attendance: avgAttendance.toFixed(1)
      });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (e) => {
    const { value } = e.target;
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      program: '',
      participant: '',
      status: '',
      has_dropped_out: '',
      has_scholarship: '',
      has_finished: '',
      date_from: '',
      date_to: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEnrollments();
  };

  const handleDelete = async (enrollment) => {
    if (!enrollment?.id) {
      setError('Cannot delete enrollment: Missing ID');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete this enrollment for ${enrollment.participant_name || 'this participant'}?`)) {
      try {
        await enrollmentService.deleteEnrollment(enrollment.id);
        setSuccess('Enrollment deleted successfully');
        setShowActionMenu(false);
        setSelectedEnrollment(null);
        fetchEnrollments();
      } catch (err) {
        console.error('Error deleting enrollment:', err);
        setError(err.message || 'Failed to delete enrollment');
      }
    }
  };

  const handleActionMenuClick = (enrollment, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setActionMenuPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 5
    });
    setSelectedEnrollment(enrollment);
    setShowActionMenu(true);
  };

  const getStatusBadge = (enrollment) => {
    if (enrollment.has_dropped_out) {
      return (
        <Badge color="red" size="sm" className="flex items-center gap-1">
          <XCircleIcon className="h-3 w-3" />
          Dropped
        </Badge>
      );
    }
    
    if (enrollment.has_scholarship) {
      return (
        <Badge color="yellow" size="sm" className="flex items-center gap-1">
          <GiftIcon className="h-3 w-3" />
          Scholarship
        </Badge>
      );
    }
    
    if (enrollment.has_finished) {
      return (
        <Badge color="green" size="sm" className="flex items-center gap-1">
          <CheckCircleIcon className="h-3 w-3" />
          Completed
        </Badge>
      );
    }
    
    switch (enrollment.status) {
      case 'enrolled':
      case 'active':
        return (
          <Badge color="blue" size="sm" className="flex items-center gap-1">
            <AcademicCapIcon className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'transferred':
        return (
          <Badge color="purple" size="sm" className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            Transferred
          </Badge>
        );
      default:
        return (
          <Badge color="gray" size="sm">
            {enrollment.status_display || enrollment.status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const ActionMenu = () => {
    if (!selectedEnrollment || !showActionMenu) return null;

    const menuItems = [
      {
        label: 'View Details',
        icon: <EyeIcon className="h-4 w-4 mr-2" />,
        onClick: () => {
          navigate(`/dashboard/enrollments/${selectedEnrollment.id}`);
          setShowActionMenu(false);
        }
      },
      ...(canEdit ? [
        {
          label: 'Edit',
          icon: <PencilIcon className="h-4 w-4 mr-2" />,
          onClick: () => {
            navigate(`/dashboard/enrollments/${selectedEnrollment.id}/edit`);
            setShowActionMenu(false);
          }
        },
        ...(!selectedEnrollment.has_finished && !selectedEnrollment.has_dropped_out ? [
          {
            label: 'Record Dropout',
            icon: <XCircleIcon className="h-4 w-4 mr-2" />,
            onClick: () => {
              navigate(`/dashboard/enrollments/${selectedEnrollment.id}/dropout`);
              setShowActionMenu(false);
            },
            className: 'text-red-600 hover:bg-red-50'
          },
          {
            label: 'Award Scholarship',
            icon: <GiftIcon className="h-4 w-4 mr-2" />,
            onClick: () => {
              navigate(`/dashboard/enrollments/${selectedEnrollment.id}/award-scholarship`);
              setShowActionMenu(false);
            },
            className: 'text-yellow-600 hover:bg-yellow-50'
          }
        ] : []),
        {
          label: 'Delete',
          icon: <TrashIcon className="h-4 w-4 mr-2" />,
          onClick: () => handleDelete(selectedEnrollment),
          className: 'text-red-600 hover:bg-red-50'
        }
      ] : [])
    ];

    return (
      <>
        <div className="fixed inset-0 z-40" onClick={() => {
          setShowActionMenu(false);
          setSelectedEnrollment(null);
        }} />
        
        <div 
          className="fixed z-50 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 animate-slideDown"
          style={{
            top: actionMenuPosition.y,
            left: Math.max(10, Math.min(actionMenuPosition.x - 200, window.innerWidth - 210)),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1" role="menu">
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
              <div className="font-medium text-gray-900">
                {selectedEnrollment.participant_name || `ID: ${selectedEnrollment.participant}`}
              </div>
              <div className="mt-1 text-gray-600">{selectedEnrollment.program_name}</div>
            </div>
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center ${item.className || ''}`}
                role="menuitem"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  };

  const columns = [
    {
      key: 'participant',
      header: 'Participant',
      render: (_, enrollment) => (
        <div>
          <Link 
            to={`/dashboard/participants/${enrollment.participant}`}
            className="text-blue-600 hover:text-blue-800 font-medium block hover:underline"
          >
            {enrollment.participant_name || `ID: ${enrollment.participant}`}
          </Link>
          {enrollment.participant_id && (
            <span className="text-xs text-gray-500">{enrollment.participant_id}</span>
          )}
        </div>
      )
    },
    {
      key: 'program',
      header: 'Program',
      render: (_, enrollment) => (
        <Link 
          to={`/dashboard/programs/${enrollment.program}`}
          className="text-gray-900 hover:text-blue-600 hover:underline"
        >
          {enrollment.program_name || `ID: ${enrollment.program}`}
        </Link>
      )
    },
    {
      key: 'enrollment_date',
      header: 'Enrolled',
      render: (value) => formatDate(value)
    },
    {
      key: 'attendance_rate',
      header: 'Attendance',
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${
            value >= 80 ? 'text-green-600' :
            value >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {value?.toFixed(1) || 0}%
          </span>
          <div className="w-16 bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                value >= 80 ? 'bg-green-500' :
                value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(value || 0, 100)}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, enrollment) => getStatusBadge(enrollment)
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (_, enrollment) => (
        <button
          onClick={(e) => handleActionMenuClick(enrollment, e)}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title="Actions"
        >
          <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
        </button>
      )
    }
  ];

  if (loading && enrollments.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-64">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Loading enrollments...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {showActionMenu && <ActionMenu />}
      
      <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage participant program enrollments
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {canEdit && (
              <Button onClick={() => navigate('/dashboard/enrollments/create')}>
                <PlusIcon className="h-5 w-5 mr-2" />
                New Enrollment
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total_enrollments}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Active</p>
                  <p className="text-xl font-bold text-gray-900">{stats.active_count}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <AcademicCapIcon className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Completed</p>
                  <p className="text-xl font-bold text-gray-900">{stats.completed_count}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Dropped</p>
                  <p className="text-xl font-bold text-gray-900">{stats.dropout_count}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircleIcon className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Avg Attendance</p>
                  <p className="text-xl font-bold text-gray-900">{stats.average_attendance}%</p>
                </div>
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ChartBarIcon className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
              <p className="text-sm font-medium text-green-800">{success}</p>
              <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm font-medium text-red-800">{error}</p>
              <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by participant name, ID, or program..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant={showFilters ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
                {Object.values(filters).some(value => value !== '' && value !== 'true' && value !== 'false') && (
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </Button>
              
              {Object.values(filters).some(value => value !== '' && value !== 'true' && value !== 'false') && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {enrollments.length} of {pagination.total_count} enrollments
            </div>
          </div>

          {showFilters && (
            <Card className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program
                  </label>
                  <select
                    name="program"
                    value={filters.program}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Programs</option>
                    {programs.map(program => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participant
                  </label>
                  <select
                    name="participant"
                    value={filters.participant}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Participants</option>
                    {participants.map(participant => (
                      <option key={participant.id} value={participant.id}>
                        {participant.full_name || `${participant.first_name} ${participant.last_name}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="enrolled">Enrolled</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped Out</option>
                    <option value="transferred">Transferred</option>
                    <option value="scholarship">Scholarship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Has Dropped Out
                  </label>
                  <select
                    name="has_dropped_out"
                    value={filters.has_dropped_out}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Has Scholarship
                  </label>
                  <select
                    name="has_scholarship"
                    value={filters.has_scholarship}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completed
                  </label>
                  <select
                    name="has_finished"
                    value={filters.has_finished}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date From
                  </label>
                  <input
                    type="date"
                    name="date_from"
                    value={filters.date_from}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date To
                  </label>
                  <input
                    type="date"
                    name="date_to"
                    value={filters.date_to}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Enrollments Table */}
        <Card className="overflow-hidden" padding={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <Link 
                          to={`/dashboard/participants/${enrollment.participant}`}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          {enrollment.participant_name || `ID: ${enrollment.participant}`}
                        </Link>
                        {enrollment.participant_id && (
                          <p className="text-xs text-gray-500 mt-1">{enrollment.participant_id}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        to={`/dashboard/programs/${enrollment.program}`}
                        className="text-gray-900 hover:text-blue-600 hover:underline"
                      >
                        {enrollment.program_name || `ID: ${enrollment.program}`}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(enrollment.enrollment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          enrollment.attendance_rate >= 80 ? 'text-green-600' :
                          enrollment.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {enrollment.attendance_rate?.toFixed(1) || 0}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              enrollment.attendance_rate >= 80 ? 'bg-green-500' :
                              enrollment.attendance_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(enrollment.attendance_rate || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(enrollment)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => handleActionMenuClick(enrollment, e)}
                        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                        title="Actions"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {enrollments.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 gap-4">
              <div className="text-sm text-gray-700">
                Showing {enrollments.length} of {pagination.total_count} enrollments
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-gray-500 mx-2">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-3 py-2"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <InformationCircleIcon className="h-4 w-4 mr-1" />
                <span>{PAGE_SIZE} records per page</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default EnrollmentsListPage;