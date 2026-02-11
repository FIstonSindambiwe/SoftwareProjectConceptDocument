import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  PlusIcon,
  CameraIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  InformationCircleIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import attendanceService from '../../../services/api/attendanceService';
import programService from '../../../services/api/programService';
import useAuth from '../../../hooks/useAuth';

const AttendanceListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Permission checks matching route patterns
  const userRole = user?.role;
  const canEdit = ['admin', 'teacher', 'program_manager', 'staff'].includes(userRole);
  const isReadOnly = userRole === 'donor';
  
  // State Management
  const [attendance, setAttendance] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ x: 0, y: 0 });
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total_count: 0
  });

  // Filter State
  const [filters, setFilters] = useState({
    program: '',
    date_from: '',
    date_to: '',
    status: '',
    verified_by_face: '',
    search: ''
  });

  // Simple debounce implementation
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  // Fetch attendance when filters, page, or debounced search changes
  useEffect(() => {
    fetchAttendance();
  }, [filters.program, filters.date_from, filters.date_to, filters.status, filters.verified_by_face, pagination.page, debouncedSearch]);

  const fetchPrograms = async () => {
    try {
      const response = await programService.getPrograms({ 
        limit: 100,
        is_active: true 
      });
      setPrograms(response.results || response || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: pagination.page,
        page_size: 10
      };
      
      if (filters.program) params.program_id = filters.program;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.status) params.present = filters.status === 'present';
      if (filters.verified_by_face) {
        params.verified_by_face = filters.verified_by_face === 'yes';
      }
      if (debouncedSearch) params.search = debouncedSearch;
      
      const response = await attendanceService.getAttendanceRecords(params);
      
      // Handle the API response structure
      const attendanceList = response.results || response || [];
      
      // Filter valid records
      const validRecords = attendanceList.filter(r => r && r.id);
      
      setAttendance(validRecords);
      setPagination({
        page: response.page || 1,
        total_pages: response.total_pages || 1,
        total_count: response.count || response.results?.length || 0
      });
      
      if (!debouncedSearch) {
        const statsData = await attendanceService.getAttendanceStats(params);
        setStats(statsData);
      }
      
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setError(err.message || 'Failed to load attendance records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      program: '',
      date_from: '',
      date_to: '',
      status: '',
      verified_by_face: '',
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
    fetchAttendance();
  };

  const handleActionMenuClick = (record, event) => {
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    setActionMenuPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 5
    });
    
    setSelectedRecord(record);
    setShowActionMenu(true);
  };

  const handleDelete = async (record) => {
    if (!record?.id) {
      setError('Cannot delete record: Missing ID');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete this attendance record? This action cannot be undone.`)) {
      try {
        await attendanceService.deleteAttendanceRecord(record.id);
        setSuccess('Attendance record deleted successfully');
        setShowActionMenu(false);
        setSelectedRecord(null);
        fetchAttendance();
      } catch (err) {
        console.error('Error deleting attendance record:', err);
        setError(err.message || 'Failed to delete attendance record');
        setSuccess('');
      }
    }
  };

  // Action Menu Component
  const ActionMenu = () => {
    if (!selectedRecord || !showActionMenu) return null;

    const menuItems = [
      {
        label: 'View Details',
        icon: <EyeIcon className="h-4 w-4 mr-2" />,
        onClick: () => {
          navigate(`/dashboard/attendance/${selectedRecord.id}`);
          setShowActionMenu(false);
        }
      },
      ...(canEdit ? [
        {
          label: 'Edit',
          icon: <PencilIcon className="h-4 w-4 mr-2" />,
          onClick: () => {
            navigate(`/dashboard/attendance/${selectedRecord.id}/edit`);
            setShowActionMenu(false);
          }
        },
        {
          label: 'Delete',
          icon: <XCircleIcon className="h-4 w-4 mr-2" />,
          onClick: () => handleDelete(selectedRecord),
          className: 'text-red-600 hover:bg-red-50'
        }
      ] : [])
    ];

    return (
      <>
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowActionMenu(false);
            setSelectedRecord(null);
          }}
        />
        
        <div 
          className="fixed z-50 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 animate-slideDown"
          style={{
            top: actionMenuPosition.y,
            left: actionMenuPosition.x,
            transform: 'translateX(-100%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1" role="menu">
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
              Record #{selectedRecord.id}
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

  // Status Badge Component - Exact match from DetailPage
  const StatusBadge = ({ present }) => {
    if (present) {
      return (
        <Badge color="green" size="md" className="flex items-center gap-1 px-2.5 py-1">
          <CheckCircleIcon className="h-4 w-4" />
          <span>Present</span>
        </Badge>
      );
    }
    return (
      <Badge color="red" size="md" className="flex items-center gap-1 px-2.5 py-1">
        <XCircleIcon className="h-4 w-4" />
        <span>Absent</span>
      </Badge>
    );
  };

  // Verification Badge Component - Exact match from DetailPage
  const VerificationBadge = ({ record }) => {
    if (record.verified_by_face) {
      const quality = attendanceService.getConfidenceLevel?.(record.confidence_score || 0) || 
                     (record.confidence_score >= 80 ? 'Good' : 
                      record.confidence_score >= 60 ? 'Fair' : 'Low');
      
      const confidenceColor = 
        quality === 'Excellent' || quality === 'Good' ? 'green' :
        quality === 'Fair' || quality === 'Acceptable' ? 'yellow' : 'red';
      
      return (
        <Badge color={confidenceColor} size="sm" className="flex items-center gap-1">
          <CameraIcon className="h-3 w-3" />
          <span>Face ({record.confidence_score?.toFixed(1)}%)</span>
        </Badge>
      );
    }

    // Get verification method display - matches DetailPage
    const getMethodDisplay = (method) => {
      if (!method) return 'Manual Entry';
      
      const methodMap = {
        'manual': 'Manual Entry',
        'face': 'Face Recognition',
        'qr': 'QR Code',
        'rfid': 'RFID',
        'biometric': 'Biometric'
      };
      
      return methodMap[method.toLowerCase()] || method;
    };

    const methodDisplay = getMethodDisplay(record.verification_method);
    
    return (
      <Badge color="gray" size="sm" className="flex items-center gap-1">
        <span className="text-xs">{methodDisplay}</span>
      </Badge>
    );
  };

  // Format Date - Exact match from DetailPage
  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }); // "Wednesday, February 11, 2026"
    } catch {
      return dateString;
    }
  };

  // Format Date for table (compact version)
  const formatDateCompact = (dateString) => {
    if (!dateString) return null;
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }); // "Wed, Feb 11, 2026"
    } catch {
      return dateString;
    }
  };

  // Table Columns - Updated without Record ID, Recorded At, and Recorded By
  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <Link 
            to={`/dashboard/attendance/${record.id}`}
            className="text-gray-700 hover:text-blue-600 hover:underline"
            title={formatDate(value)}
          >
            {formatDateCompact(value)}
          </Link>
        </div>
      )
    },
    {
      key: 'participant',
      header: 'Participant',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {record.participant_id?.charAt(0) || 'P'}
          </div>
          <div>
            {/* Link to Participant Detail Page */}
            <Link 
              to={`/dashboard/participants/${record.participant}`}
              className="font-medium text-gray-900 hover:text-blue-600 hover:underline"
              title="View participant details"
            >
              {record.participant_id}
            </Link>
            {record.participant_name && (
              <div className="text-xs text-gray-500">
                {record.participant_name}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'program',
      header: 'Program',
      render: (_, record) => (
        <div className="flex items-start gap-2">
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-gray-900">{record.program_name}</div>
            {record.session_name && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <DocumentTextIcon className="h-3 w-3" />
                <span>{record.session_name}</span>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, record) => <StatusBadge present={record.present} />
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (_, record) => <VerificationBadge record={record} />
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (_, record) => (
        <button
          onClick={(e) => handleActionMenuClick(record, e)}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title="Actions"
        >
          <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
        </button>
      )
    }
  ];

  // Stats Cards
  const statsCards = stats ? [
    {
      title: 'Total Records',
      value: stats.total_records?.toLocaleString() || '0',
      icon: CalendarIcon,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Present',
      value: stats.present_count?.toLocaleString() || '0',
      icon: CheckCircleIcon,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      subtitle: `${stats.attendance_rate || 0}% rate`
    },
    {
      title: 'Face Verified',
      value: stats.face_verified_count?.toLocaleString() || '0',
      icon: CameraIcon,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subtitle: stats.total_records ? `${Math.round((stats.face_verified_count / stats.total_records) * 100) || 0}%` : '0%'
    },
    {
      title: 'Active Programs',
      value: stats.active_programs_count || programs.length,
      icon: ChartBarIcon,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    }
  ] : [];

  if (loading && attendance.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-64">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Loading attendance records...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Floating Action Menu */}
      {showActionMenu && <ActionMenu />}
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
            <p className="text-gray-600">
              {isReadOnly ? 'View attendance records' : 'Track and manage participant attendance'}
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
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/attendance/check-in')}
                >
                  <CameraIcon className="h-5 w-5 mr-2" />
                  Face Check-in
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/attendance/bulk')}
                >
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Bulk Entry
                </Button>
                <Button onClick={() => navigate('/dashboard/attendance/check-in')}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Record
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccess('')}
                  className="text-green-500 hover:text-green-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statsCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.iconColor}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-600">{stat.title}</h3>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 mt-0.5">{stat.subtitle}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

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
                {Object.values(filters).some(value => value !== '' && value !== 'true') && (
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </Button>
              
              {Object.values(filters).some(value => value !== '' && value !== 'true') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {attendance.length} of {pagination.total_count} records
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="animate-slideDown p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      name="date_from"
                      value={filters.date_from}
                      onChange={handleFilterChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="From"
                    />
                    <input
                      type="date"
                      name="date_to"
                      value={filters.date_to}
                      onChange={handleFilterChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="To"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification
                  </label>
                  <select
                    name="verified_by_face"
                    value={filters.verified_by_face}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Methods</option>
                    <option value="yes">Face Recognition</option>
                    <option value="no">Manual Entry</option>
                  </select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Attendance Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={attendance.filter(r => r && r.id)}
              rowClassName="hover:bg-gray-50 transition-colors group"
              emptyMessage={
                <div className="text-center py-16">
                  <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {Object.values(filters).some(value => value !== '' && value !== 'true')
                      ? 'No records match your current filters. Try adjusting your search criteria.'
                      : 'Start tracking attendance by recording your first check-in.'}
                  </p>
                  <div className="space-x-3">
                    {Object.values(filters).some(value => value !== '' && value !== 'true') && (
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                      >
                        <XMarkIcon className="h-5 w-5 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                    {canEdit && !Object.values(filters).some(value => value !== '' && value !== 'true') && (
                      <Button
                        onClick={() => navigate('/dashboard/attendance/check-in')}
                      >
                        <CameraIcon className="h-5 w-5 mr-2" />
                        Face Check-in
                      </Button>
                    )}
                  </div>
                </div>
              }
            />
          </div>
          
          {/* Table Footer */}
          {attendance.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{attendance.length}</span> of{' '}
                <span className="font-medium">{pagination.total_count}</span> records
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  ← Previous
                </Button>
                <span className="text-sm text-gray-500 mx-2">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.total_pages}
                >
                  Next →
                </Button>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <InformationCircleIcon className="h-4 w-4 mr-1" />
                Click date to view details
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default AttendanceListPage;