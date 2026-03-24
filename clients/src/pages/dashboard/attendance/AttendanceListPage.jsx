// src/pages/dashboard/attendance/AttendanceListPage.jsx
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
  BuildingOfficeIcon,
  HomeIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import attendanceService from '../../../services/api/attendanceService';
import programService from '../../../services/api/programService';
import roomService from '../../../services/api/roomService';
import useAuth from '../../../hooks/useAuth';

const PAGE_SIZE = 10;

const AttendanceListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const userRole = user?.role;
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';
  const isProgramManager = userRole === 'program_manager';
  const isStaff = userRole === 'staff';
  const isDonor = userRole === 'donor';
  
  const canEdit = ['admin', 'teacher', 'program_manager', 'staff'].includes(userRole);
  const isReadOnly = isDonor;
  
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
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total_count: 0,
    page_size: PAGE_SIZE,
    has_next: false,
    has_previous: false
  });

  const [teacherRooms, setTeacherRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const [filters, setFilters] = useState({
    program: '',
    date_from: '',
    date_to: '',
    status: '',
    verified_by_face: '',
    search: '',
    room: ''
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    if (isTeacher) {
      fetchTeacherRooms();
    }
  }, [isTeacher]);

  const fetchTeacherRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await roomService.getRooms({ teacher: user.id, is_active: true, page_size: 100 });
      const rooms = response.results || response || [];
      setTeacherRooms(rooms);
      if (rooms.length === 1) {
        setFilters(prev => ({ ...prev, room: rooms[0].id.toString() }));
      }
    } catch (err) {
      console.error('Error fetching teacher rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [filters.program, filters.date_from, filters.date_to, filters.status, filters.verified_by_face, filters.room, pagination.page, debouncedSearch]);

  const fetchPrograms = async () => {
    try {
      const response = await programService.getPrograms({ limit: 100, is_active: true });
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
        page_size: PAGE_SIZE
      };
      
      if (isTeacher) {
        if (teacherRooms.length > 0) {
          if (filters.room) {
            params.room_id = filters.room;
          } else {
            params.room_ids = teacherRooms.map(r => r.id).join(',');
          }
        } else {
          setAttendance([]);
          setPagination({
            page: 1,
            total_pages: 1,
            total_count: 0,
            page_size: PAGE_SIZE,
            has_next: false,
            has_previous: false
          });
          setLoading(false);
          return;
        }
      }
      
      if (filters.program) params.program_id = filters.program;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.status) params.present = filters.status === 'present';
      if (filters.verified_by_face) params.verified_by_face = filters.verified_by_face === 'yes';
      if (debouncedSearch) params.search = debouncedSearch;
      
      const response = await attendanceService.getAttendanceRecords(params);
      
      const attendanceList = response.results || response || [];
      const validRecords = attendanceList.filter(r => r && r.id);
      
      setAttendance(validRecords);
      
      const totalCount = response.count || validRecords.length || 0;
      const totalPages = Math.ceil(totalCount / PAGE_SIZE);
      
      setPagination({
        page: response.page || pagination.page,
        total_pages: totalPages,
        total_count: totalCount,
        page_size: PAGE_SIZE,
        has_next: response.next !== null && response.next !== undefined,
        has_previous: response.previous !== null && response.previous !== undefined
      });
      
      if (!debouncedSearch) {
        try {
          const statsData = await attendanceService.getAttendanceStats(params);
          setStats(statsData);
        } catch (statsErr) {
          setStats({
            total_records: validRecords.length,
            present_count: validRecords.filter(r => r.present).length,
            face_verified_count: validRecords.filter(r => r.verified_by_face).length,
            attendance_rate: validRecords.length > 0 
              ? Math.round((validRecords.filter(r => r.present).length / validRecords.length) * 100)
              : 0,
            active_programs_count: programs.length
          });
        }
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

  const handleSearchChange = (e) => {
    const { value } = e.target;
    setSearchInput(value);
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      program: '',
      date_from: '',
      date_to: '',
      status: '',
      verified_by_face: '',
      search: '',
      room: isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : ''
    });
    setSearchInput('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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

  const hasActiveFilters = () => {
    const defaultRoom = isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : '';
    return Object.entries(filters).some(([key, value]) => 
      value !== '' && value !== 'true' && value !== 'false' && value !== defaultRoom
    );
  };

  const getActiveFilterCount = () => {
    const defaultRoom = isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : '';
    return Object.entries(filters).filter(([key, value]) => 
      value !== '' && value !== 'true' && value !== 'false' && value !== defaultRoom
    ).length;
  };

  const formatFullName = (participant) => {
    if (!participant) return null;
    const firstName = participant.first_name || participant.participant_first_name || '';
    const lastName = participant.last_name || participant.participant_last_name || '';
    if (firstName || lastName) return `${firstName} ${lastName}`.trim();
    return null;
  };

  const renderTeacherInfo = () => {
    if (!isTeacher) return null;
    
    if (loadingRooms) {
      return (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4 flex items-center">
            <Spinner size="sm" className="mr-3" />
            <p className="text-sm text-blue-800">Loading your assigned rooms...</p>
          </div>
        </Card>
      );
    }
    
    if (teacherRooms.length === 0) {
      return (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">No Rooms Assigned</p>
                <p className="text-xs text-yellow-700 mt-1">
                  You don't have any rooms assigned yet. Please contact an administrator to assign rooms.
                </p>
              </div>
            </div>
          </div>
        </Card>
      );
    }
    
    return (
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <HomeIcon className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Your Assigned Rooms: {teacherRooms.length}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {teacherRooms.map(room => (
                    <span 
                      key={room.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-md bg-white text-xs text-blue-700 border border-blue-200"
                    >
                      {room.name}
                      {room.current_enrollment_count > 0 && (
                        <span className="ml-1 text-blue-400">
                          ({room.current_enrollment_count})
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {teacherRooms.length > 1 && (
              <p className="text-xs text-blue-600 bg-white px-3 py-1.5 rounded-full">
                Use room filter to view attendance for specific rooms
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const ActionMenu = () => {
    if (!selectedRecord || !showActionMenu) return null;

    const participantName = formatFullName(selectedRecord.participant_details || selectedRecord);

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
          className="fixed z-50 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
          style={{
            top: actionMenuPosition.y,
            left: Math.max(10, Math.min(actionMenuPosition.x - 200, window.innerWidth - 210)),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1" role="menu">
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
              <div className="font-medium text-gray-700">{selectedRecord.participant_id}</div>
              {participantName && (
                <div className="truncate text-gray-600">{participantName}</div>
              )}
              <div className="mt-1 text-gray-500">
                {selectedRecord.date ? new Date(selectedRecord.date).toLocaleDateString() : 'No date'}
              </div>
              {selectedRecord.room_name && (
                <div className="mt-1 text-gray-400 flex items-center">
                  <HomeIcon className="h-3 w-3 mr-1" />
                  {selectedRecord.room_name}
                </div>
              )}
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

  const VerificationBadge = ({ record }) => {
    if (record.verified_by_face) {
      const confidence = record.confidence_score || 0;
      const confidenceColor = confidence >= 80 ? 'green' : confidence >= 60 ? 'yellow' : 'red';
      return (
        <Badge color={confidenceColor} size="sm" className="flex items-center gap-1">
          <CameraIcon className="h-3 w-3" />
          <span>Face ({confidence.toFixed(1)}%)</span>
        </Badge>
      );
    }
    return (
      <Badge color="gray" size="sm" className="flex items-center gap-1">
        <span className="text-xs">Manual</span>
      </Badge>
    );
  };

  const formatDateCompact = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pagination.total_pages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const getRecordRange = () => {
    const start = (pagination.page - 1) * PAGE_SIZE + 1;
    const end = Math.min(start + attendance.length - 1, pagination.total_count);
    return { start, end };
  };

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

  const { start, end } = getRecordRange();

  return (
    <Layout>
      {showActionMenu && <ActionMenu />}
      
      <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
              <p className="text-sm text-gray-600 mt-1">
                {isTeacher 
                  ? 'View attendance for participants in your assigned rooms'
                  : isReadOnly 
                    ? 'View attendance records'
                    : 'Track and manage participant attendance'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            {canEdit && !isTeacher && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/attendance/check-in')}
                >
                  <CameraIcon className="h-5 w-5 mr-2" />
                  Face Check-in
                </Button>
                <Button onClick={() => navigate('/dashboard/attendance/check-in')}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Record
                </Button>
              </>
            )}
            {isTeacher && teacherRooms.length > 0 && (
              <Button
                variant="primary"
                onClick={() => {
                  const roomId = filters.room || teacherRooms[0].id;
                  navigate(`/dashboard/attendance/check-in?room=${roomId}`);
                }}
              >
                <CameraIcon className="h-5 w-5 mr-2" />
                Take Attendance
              </Button>
            )}
          </div>
        </div>

        {/* Teacher Info Banner */}
        {renderTeacherInfo()}

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
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
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 text-red-400 mr-3" />
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (canEdit || attendance.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total_records?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">Total Records</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.present_count?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">Present</p>
              <p className="text-xs text-gray-500">{stats.attendance_rate || 0}% rate</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.face_verified_count?.toLocaleString() || 0}</p>
              <p className="text-sm text-gray-600">Face Verified</p>
              <p className="text-xs text-gray-500">{stats.total_records ? `${Math.round((stats.face_verified_count / stats.total_records) * 100) || 0}%` : '0%'}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.active_programs_count || programs.length}</p>
              <p className="text-sm text-gray-600">Active Programs</p>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search by participant ID, name, or program..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

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
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(isTeacher || isAdmin || isProgramManager) && teacherRooms.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Room</label>
                    <select
                      name="room"
                      value={filters.room}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="">All My Rooms</option>
                      {teacherRooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name} ({room.current_enrollment_count}/{room.capacity})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Program</label>
                  <select
                    name="program"
                    value={filters.program}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Programs</option>
                    {programs.map(program => (
                      <option key={program.id} value={program.id}>{program.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification</label>
                  <select
                    name="verified_by_face"
                    value={filters.verified_by_face}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">All Methods</option>
                    <option value="yes">Face Recognition</option>
                    <option value="no">Manual Entry</option>
                  </select>
                </div>

                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      name="date_from"
                      value={filters.date_from}
                      onChange={handleFilterChange}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="date"
                      name="date_to"
                      value={filters.date_to}
                      onChange={handleFilterChange}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
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
                <span>Loading records...</span>
              </span>
            ) : (
              <span>
                Showing <span className="font-semibold text-gray-900">{start}</span> to{' '}
                <span className="font-semibold text-gray-900">{end}</span> of{' '}
                <span className="font-semibold text-gray-900">{pagination.total_count.toLocaleString()}</span> records
                {hasActiveFilters() && <span className="text-gray-400 ml-1">(filtered)</span>}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.total_pages}
          </div>
        </div>

        {/* Attendance Table */}
        {attendance.length === 0 ? (
          <Card>
            <div className="text-center py-16">
              <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {isTeacher && teacherRooms.length === 0
                  ? 'You don\'t have any rooms assigned yet.'
                  : hasActiveFilters()
                    ? 'No records match your current filters. Try adjusting your search criteria.'
                    : isTeacher
                      ? 'No attendance records found in your rooms.'
                      : 'Start tracking attendance by recording your first check-in.'}
              </p>
              <div className="space-x-3">
                {hasActiveFilters() && (
                  <Button variant="outline" onClick={handleClearFilters}>
                    <XMarkIcon className="h-5 w-5 mr-2" />
                    Clear Filters
                  </Button>
                )}
                {canEdit && !isTeacher && !hasActiveFilters() && (
                  <Button onClick={() => navigate('/dashboard/attendance/check-in')}>
                    <CameraIcon className="h-5 w-5 mr-2" />
                    Face Check-in
                  </Button>
                )}
                {isTeacher && teacherRooms.length > 0 && (
                  <Button onClick={() => {
                    const roomId = filters.room || teacherRooms[0].id;
                    navigate(`/dashboard/attendance/check-in?room=${roomId}`);
                  }}>
                    <CameraIcon className="h-5 w-5 mr-2" />
                    Take Attendance
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden" padding={false}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Participant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Room</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Program</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Verification</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <Link 
                            to={`/dashboard/attendance/${record.id}`}
                            className="text-gray-700 hover:text-blue-600 hover:underline"
                          >
                            {formatDateCompact(record.date)}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <Link 
                            to={`/dashboard/participants/${record.participant}`}
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            {record.participant_id || record.participant}
                          </Link>
                          {formatFullName(record.participant_details || record) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatFullName(record.participant_details || record)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.room_name ? (
                          <div className="flex items-center">
                            <HomeIcon className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-600">{record.room_name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 truncate max-w-[200px]" title={record.program_name}>
                            {record.program_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge present={record.present} />
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <VerificationBadge record={record} />
                       </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => handleActionMenuClick(record, e)}
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
            {pagination.total_pages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 gap-4">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-semibold">{start}</span> to{' '}
                  <span className="font-semibold">{end}</span> of{' '}
                  <span className="font-semibold">{pagination.total_count.toLocaleString()}</span> records
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="px-2 py-2"
                    title="First Page"
                  >
                    <ChevronDoubleLeftIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2"
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-all ${
                          pagination.page === page
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
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
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePageChange(pagination.total_pages)}
                    disabled={pagination.page === pagination.total_pages}
                    className="px-2 py-2"
                    title="Last Page"
                  >
                    <ChevronDoubleRightIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <InformationCircleIcon className="h-4 w-4 mr-1" />
                  <span>{PAGE_SIZE} records per page</span>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AttendanceListPage;