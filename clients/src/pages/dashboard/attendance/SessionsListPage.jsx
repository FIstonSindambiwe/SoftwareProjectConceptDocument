// src/pages/dashboard/attendance/SessionsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon,
  HomeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon
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

const SessionsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Permission checks
  const userRole = user?.role;
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';
  const isProgramManager = userRole === 'program_manager';
  const isDonor = userRole === 'donor';
  
  const canEdit = ['admin', 'teacher', 'program_manager'].includes(userRole);
  const canViewAll = isAdmin || isProgramManager;
  
  const [sessions, setSessions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [teacherRooms, setTeacherRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    program: '',
    room: '',
    is_completed: '',
    is_cancelled: ''
  });

  // Fetch teacher's assigned rooms if user is teacher
  useEffect(() => {
    if (isTeacher) {
      fetchTeacherRooms();
    }
  }, [isTeacher]);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [filters]);

  const fetchTeacherRooms = async () => {
    try {
      setLoadingRooms(true);
      const response = await roomService.getRooms({ teacher: user.id, is_active: true, page_size: 100 });
      const rooms = response.results || response || [];
      setTeacherRooms(rooms);
    } catch (err) {
      console.error('Error fetching teacher rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const data = await programService.getPrograms();
      setPrograms(data.results || data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // If teacher, filter by their rooms
      if (isTeacher && teacherRooms.length > 0) {
        params.room_ids = teacherRooms.map(r => r.id).join(',');
      }
      
      if (filters.program) params.program = filters.program;
      if (filters.room) params.room = filters.room;
      if (filters.is_completed !== '') params.is_completed = filters.is_completed;
      if (filters.is_cancelled !== '') params.is_cancelled = filters.is_cancelled;
      
      const data = await attendanceService.getSessions(params);
      setSessions(data.results || data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      program: '',
      room: '',
      is_completed: '',
      is_cancelled: ''
    });
  };

  const handleCompleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to mark this session as completed? This action cannot be undone.')) return;
    
    try {
      await attendanceService.completeSession(sessionId);
      fetchSessions();
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to complete session');
    }
  };

  const handleCancelSession = async (sessionId) => {
    const reason = window.prompt('Please enter a reason for cancelling this session:');
    if (reason === null) return;
    
    if (!reason.trim()) {
      alert('Cancellation reason is required');
      return;
    }
    
    try {
      await attendanceService.cancelSession(sessionId, reason);
      fetchSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
      alert('Failed to cancel session');
    }
  };

  const getStatusBadge = (session) => {
    if (session.is_cancelled) {
      return (
        <Badge color="red" className="flex items-center gap-1">
          <XCircleIcon className="h-3 w-3" />
          Cancelled
          {session.cancellation_reason && (
            <span className="ml-1 text-xs opacity-75" title={session.cancellation_reason}>
              ⓘ
            </span>
          )}
        </Badge>
      );
    }
    if (session.is_completed) {
      return (
        <Badge color="purple" className="flex items-center gap-1">
          <CheckCircleIcon className="h-3 w-3" />
          Completed
        </Badge>
      );
    }
    
    const isOngoing = attendanceService.isSessionOngoing(session);
    const isUpcoming = attendanceService.isSessionUpcoming(session);
    
    if (isOngoing) {
      return (
        <Badge color="green" className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          Ongoing
        </Badge>
      );
    }
    if (isUpcoming) {
      return (
        <Badge color="blue" className="flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" />
          Upcoming
        </Badge>
      );
    }
    return (
      <Badge color="gray" className="flex items-center gap-1">
        <ClockIcon className="h-3 w-3" />
        Past
      </Badge>
    );
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
                  You don't have any rooms assigned yet. Sessions for all rooms will be shown.
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
          <div className="flex items-center flex-wrap gap-4">
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
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-xs text-blue-600 bg-white px-3 py-1.5 rounded-full">
              Showing sessions for your rooms only
            </p>
          </div>
        </div>
      </Card>
    );
  };

  const columns = [
    {
      key: 'session_date',
      header: 'Date',
      render: (value) => (
        <span className="font-medium text-gray-900">
          {new Date(value).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </span>
      )
    },
    {
      key: 'program_name',
      header: 'Program',
      render: (value, session) => (
        <div>
          <span className="font-medium text-gray-900">{value}</span>
          {session.room_name && (
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <HomeIcon className="h-3 w-3 mr-1" />
              {session.room_name}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'session_name',
      header: 'Session',
      render: (value, session) => (
        <div>
          <span className="font-medium">{value}</span>
          {session.description && (
            <div className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={session.description}>
              {session.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'time',
      header: 'Time',
      render: (_, session) => (
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="h-4 w-4 mr-1 flex-shrink-0" />
          {attendanceService.formatSessionTime(session)}
        </div>
      )
    },
    {
      key: 'location',
      header: 'Location',
      render: (value) => (
        value ? (
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate max-w-[150px]" title={value}>
              {value}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
        )
      )
    },
    {
      key: 'attendance_rate',
      header: 'Attendance',
      render: (value, session) => {
        if (session.is_cancelled) {
          return <span className="text-gray-400">—</span>;
        }
        return (
          <div>
            <span className={`font-medium ${
              value >= 80 ? 'text-green-600' :
              value >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {value ? value.toFixed(1) : '0.0'}%
            </span>
            {session.attendance_count !== undefined && (
              <div className="text-xs text-gray-500">
                {session.attendance_count}/{session.enrolled_count} present
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (_, session) => getStatusBadge(session)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, session) => (
        <div className="flex space-x-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => navigate(`/dashboard/attendance/sessions/${session.id}/attendance`)}
          >
            View Attendance
          </Button>
          
          {canEdit && !session.is_completed && !session.is_cancelled && (
            <>
              <Button
                size="xs"
                variant="outline"
                onClick={() => handleCompleteSession(session.id)}
              >
                Complete
              </Button>
              <Button
                size="xs"
                variant="danger"
                onClick={() => handleCancelSession(session.id)}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <Layout>
      <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Sessions</h1>
            <p className="mt-1 text-sm text-gray-500">
              {isTeacher 
                ? 'Manage scheduled sessions for your rooms'
                : 'Manage scheduled program sessions'}
            </p>
          </div>
          
          {canEdit && (
            <Button onClick={() => navigate('/dashboard/attendance/sessions/create')}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Session
            </Button>
          )}
        </div>

        {/* Teacher Info Banner */}
        {renderTeacherInfo()}

        {/* Filters */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
          
          {showFilters && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Program
                  </label>
                  <select
                    name="program"
                    value={filters.program}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Programs</option>
                    {programs.map(program => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room filter for admins */}
                {(isAdmin || isProgramManager) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room
                    </label>
                    <select
                      name="room"
                      value={filters.room}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Rooms</option>
                      {teacherRooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completed
                  </label>
                  <select
                    name="is_completed"
                    value={filters.is_completed}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cancelled
                  </label>
                  <select
                    name="is_cancelled"
                    value={filters.is_cancelled}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {(filters.program || filters.room || filters.is_completed || filters.is_cancelled) && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                  >
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Sessions Table */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Sessions ({sessions.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <CalendarIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                {isTeacher && teacherRooms.length === 0
                  ? 'You don\'t have any rooms assigned yet. Sessions for all rooms will be shown once created.'
                  : 'No sessions match your current filters. Try adjusting your search criteria.'}
              </p>
              {canEdit && (
                <Button onClick={() => navigate('/dashboard/attendance/sessions/create')}>
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Session
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table 
                columns={columns} 
                data={sessions} 
                rowClassName="hover:bg-gray-50 transition-colors"
              />
              
              {/* Table Footer */}
              <div className="mt-4 px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                <div className="flex items-center justify-between">
                  <span>
                    Showing {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-400">
                    Last updated: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Info Card for Donors */}
        {isDonor && (
          <Card className="bg-blue-50 border-blue-200">
            <div className="p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-900">View-Only Mode</h3>
                  <p className="text-xs text-blue-700 mt-1">
                    As a donor, you can view session information but cannot create, edit, complete, or cancel sessions.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SessionsListPage;