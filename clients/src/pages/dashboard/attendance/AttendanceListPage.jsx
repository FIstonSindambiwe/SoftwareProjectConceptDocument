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
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  IdentificationIcon,
  HomeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Table from '../../../components/common/Table';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import attendanceService from '../../../services/api/attendanceService';
import programService from '../../../services/api/programService';
import roomService from '../../../services/api/roomService';
import useAuth from '../../../hooks/useAuth';

const AttendanceListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Permission checks
  const userRole = user?.role;
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';
  const isProgramManager = userRole === 'program_manager';
  const isStaff = userRole === 'staff';
  const isDonor = userRole === 'donor';
  
  const canEdit = ['admin', 'teacher', 'program_manager', 'staff'].includes(userRole);
  const isReadOnly = isDonor;
  
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
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total_count: 0
  });

  // Teacher-specific state
  const [teacherRooms, setTeacherRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Filter State
  const [filters, setFilters] = useState({
    program: '',
    date_from: '',
    date_to: '',
    status: '',
    verified_by_face: '',
    search: '',
    room: '' // Add room filter
  });

  // Simple debounce implementation
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Fetch teacher's assigned rooms if user is teacher
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
      
      // Auto-select first room if only one
      if (rooms.length === 1) {
        setFilters(prev => ({ ...prev, room: rooms[0].id.toString() }));
      }
    } catch (err) {
      console.error('Error fetching teacher rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  // Fetch attendance when filters, page, or debounced search changes
  useEffect(() => {
    fetchAttendance();
  }, [filters.program, filters.date_from, filters.date_to, filters.status, filters.verified_by_face, filters.room, pagination.page, debouncedSearch]);

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
      
      // If teacher, filter by their rooms
      if (isTeacher) {
        if (teacherRooms.length > 0) {
          if (filters.room) {
            // Filter by specific room
            params.room_id = filters.room;
          } else {
            // Filter by all teacher's rooms
            params.room_ids = teacherRooms.map(r => r.id).join(',');
          }
        } else {
          // No rooms assigned - show empty state
          setAttendance([]);
          setPagination({
            page: 1,
            total_pages: 1,
            total_count: 0
          });
          setLoading(false);
          return;
        }
      }
      
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
        try {
          const statsData = await attendanceService.getAttendanceStats(params);
          setStats(statsData);
        } catch (statsErr) {
          console.warn('Could not fetch stats:', statsErr);
          // Set default stats if API fails
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
    
    if (window.confirm(`Are you sure you want to delete this attendance record for ${record.participant_id}? This action cannot be undone.`)) {
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

  // Format full name from participant data
  const formatFullName = (participant) => {
    if (!participant) return null;
    
    const firstName = participant.first_name || participant.participant_first_name || '';
    const lastName = participant.last_name || participant.participant_last_name || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    return null;
  };

  // Render teacher info banner
  const renderTeacherInfo = () => {
    if (!isTeacher) return null;
    
    if (loadingRooms) {
      return (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-center">
              <Spinner size="sm" className="mr-3" />
              <p className="text-sm text-blue-800">Loading your assigned rooms...</p>
            </div>
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

  // Action Menu Component
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
          className="fixed z-50 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 animate-slideDown"
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

  // Status Badge Component
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

  // Verification Badge Component
  const VerificationBadge = ({ record }) => {
    if (record.verified_by_face) {
      const confidence = record.confidence_score || 0;
      const quality = 
        confidence >= 80 ? 'Good' : 
        confidence >= 60 ? 'Fair' : 'Low';
      
      const confidenceColor = 
        quality === 'Good' ? 'green' :
        quality === 'Fair' ? 'yellow' : 'red';
      
      return (
        <Badge color={confidenceColor} size="sm" className="flex items-center gap-1">
          <CameraIcon className="h-3 w-3" />
          <span>Face ({confidence.toFixed(1)}%)</span>
        </Badge>
      );
    }

    const getMethodDisplay = (method) => {
      if (!method) return 'Manual';
      
      const methodMap = {
        'manual': 'Manual',
        'face': 'Face',
        'qr': 'QR Code',
        'rfid': 'RFID',
        'biometric': 'Biometric'
      };
      
      return methodMap[method.toLowerCase()] || method;
    };

    return (
      <Badge color="gray" size="sm" className="flex items-center gap-1">
        <span className="text-xs">{getMethodDisplay(record.verification_method)}</span>
      </Badge>
    );
  };

  // Format Date
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

  // Table Columns
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
            title={new Date(value).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          >
            {formatDateCompact(value)}
          </Link>
        </div>
      )
    },
    {
      key: 'participant_id',
      header: 'Participant ID',
      render: (value, record) => {
        const participant = record.participant_details || record;
        const participantId = participant.participant_id || record.participant_id || value;
        
        const fullName = participant.first_name || participant.last_name 
          ? `${participant.first_name || ''} ${participant.last_name || ''}`.trim()
          : null;
        
        const participantIdForLink = participant.id || record.participant;
        
        if (!participantIdForLink) {
          return (
            <div>
              <span className="text-gray-700 font-medium block">
                {participantId || 'No ID'}
              </span>
              {fullName && (
                <span className="text-sm text-gray-500 block truncate max-w-[200px]" title={fullName}>
                  {fullName}
                </span>
              )}
            </div>
          );
        }
        
        return (
          <div>
            <Link 
              to={`/dashboard/participants/${participantIdForLink}`}
              className="text-blue-600 hover:text-blue-800 font-medium block hover:underline truncate max-w-[200px]"
              title={`${participantId} - ${fullName || ''}`}
            >
              {participantId || 'No ID'}
            </Link>
            {fullName && (
              <span className="text-sm text-gray-500 block truncate max-w-[200px]" title={fullName}>
                {fullName}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'room',
      header: 'Room',
      render: (_, record) => {
        const roomName = record.room_name || record.room?.name;
        return roomName ? (
          <div className="flex items-center">
            <HomeIcon className="h-4 w-4 text-gray-400 mr-1 flex-shrink-0" />
            <span className="text-sm text-gray-600 truncate max-w-[150px]" title={roomName}>
              {roomName}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        );
      }
    },
    {
      key: 'program',
      header: 'Program',
      render: (_, record) => (
        <div className="flex items-start gap-2">
          <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-gray-900 truncate max-w-[200px]" title={record.program_name}>
              {record.program_name}
            </div>
            {record.session_name && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                <DocumentTextIcon className="h-3 w-3 flex-shrink-0" />
                <span className="truncate max-w-[180px]" title={record.session_name}>
                  {record.session_name}
                </span>
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
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      
      <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
            <p className="text-gray-600">
              {isTeacher 
                ? 'View attendance for participants in your assigned rooms'
                : isReadOnly 
                  ? 'View attendance records'
                  : 'Track and manage participant attendance'}
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
            {canEdit && !isTeacher && ( // Teachers use the check-in page from their room view
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
            {isTeacher && teacherRooms.length > 0 && (
              <Button
                variant="primary"
                onClick={() => {
                  // Navigate to check-in with pre-filtered room
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
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccess('')}
                  className="text-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-lg"
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
                <XCircleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-lg"
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards - Only show for non-teachers or if teacher has data */}
        {stats && (canEdit || attendance.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((stat, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.iconColor}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4 min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-gray-600 truncate">{stat.title}</h3>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{stat.subtitle}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search by participant ID, name, or program..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button
                variant={showFilters ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
                {Object.values(filters).some(value => value !== '' && value !== 'true' && value !== 'false' && value !== (isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : '')) && (
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </Button>
              
              {Object.values(filters).some(value => value !== '' && value !== 'true' && value !== 'false' && value !== (isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : '')) && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Room Filter - Show for teachers and admins */}
                {(isTeacher || isAdmin || isProgramManager) && teacherRooms.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room
                    </label>
                    <select
                      name="room"
                      value={filters.room}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      name="date_from"
                      value={filters.date_from}
                      onChange={handleFilterChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="From"
                    />
                    <input
                      type="date"
                      name="date_to"
                      value={filters.date_to}
                      onChange={handleFilterChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="To"
                    />
                  </div>
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
                    {isTeacher && teacherRooms.length === 0
                      ? 'You don\'t have any rooms assigned yet.'
                      : Object.values(filters).some(value => value !== '' && value !== 'true' && value !== 'false' && value !== (isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : ''))
                        ? 'No records match your current filters. Try adjusting your search criteria.'
                        : isTeacher
                          ? 'No attendance records found in your rooms.'
                          : 'Start tracking attendance by recording your first check-in.'}
                  </p>
                  <div className="space-x-3">
                    {Object.values(filters).some(value => value !== '' && value !== 'true' && value !== 'false' && value !== (isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : '')) && (
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                      >
                        <XMarkIcon className="h-5 w-5 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                    {canEdit && !isTeacher && !Object.values(filters).some(value => value !== '' && value !== 'true' && value !== 'false') && (
                      <Button
                        onClick={() => navigate('/dashboard/attendance/check-in')}
                      >
                        <CameraIcon className="h-5 w-5 mr-2" />
                        Face Check-in
                      </Button>
                    )}
                    {isTeacher && teacherRooms.length > 0 && (
                      <Button
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
              }
            />
          </div>
          
          {/* Table Footer */}
          {attendance.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 gap-4">
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
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
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