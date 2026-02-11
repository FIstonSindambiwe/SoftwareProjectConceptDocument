import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  MapPinIcon
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

const SessionsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [sessions, setSessions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    program: '',
    is_completed: '',
    is_cancelled: ''
  });

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [filters]);

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
      
      if (filters.program) params.program = filters.program;
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

  const handleCompleteSession = async (sessionId) => {
    if (!window.confirm('Mark this session as completed?')) return;
    
    try {
      await attendanceService.completeSession(sessionId);
      fetchSessions();
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to complete session');
    }
  };

  const handleCancelSession = async (sessionId) => {
    const reason = window.prompt('Please enter cancellation reason:');
    if (reason === null) return;
    
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
      return <Badge color="red">Cancelled</Badge>;
    }
    if (session.is_completed) {
      return <Badge color="purple">Completed</Badge>;
    }
    
    const isOngoing = attendanceService.isSessionOngoing(session);
    const isUpcoming = attendanceService.isSessionUpcoming(session);
    
    if (isOngoing) {
      return <Badge color="green">Ongoing</Badge>;
    }
    if (isUpcoming) {
      return <Badge color="blue">Upcoming</Badge>;
    }
    return <Badge color="gray">Past</Badge>;
  };

  const columns = [
    {
      key: 'session_date',
      header: 'Date',
      render: (value) => (
        <span className="font-medium text-gray-900">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'program_name',
      header: 'Program',
      render: (value) => <span className="text-gray-900">{value}</span>
    },
    {
      key: 'session_name',
      header: 'Session',
      render: (value) => <span className="font-medium">{value}</span>
    },
    {
      key: 'time',
      header: 'Time',
      render: (_, session) => (
        <div className="flex items-center text-sm text-gray-600">
          <ClockIcon className="h-4 w-4 mr-1" />
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
            <MapPinIcon className="h-4 w-4 mr-1" />
            {value}
          </div>
        ) : (
          <span className="text-gray-400">N/A</span>
        )
      )
    },
    {
      key: 'attendance_rate',
      header: 'Attendance',
      render: (value) => (
        <span className={`font-medium ${
          value >= 80 ? 'text-green-600' :
          value >= 60 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {value ? value.toFixed(1) : '0.0'}%
        </span>
      )
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
            onClick={() => navigate(`/dashboard/sessions/${session.id}/attendance`)}
          >
            View Attendance
          </Button>
          
          {user && user.role !== 'donor' && !session.is_completed && !session.is_cancelled && (
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Sessions</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage scheduled program sessions
            </p>
          </div>
          
          {user && user.role !== 'donor' && (
            <Button onClick={() => navigate('/dashboard/sessions/create')}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Session
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program
              </label>
              <select
                name="program"
                value={filters.program}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                Completed
              </label>
              <select
                name="is_completed"
                value={filters.is_completed}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
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
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-500">No sessions found</p>
              {user && user.role !== 'donor' && (
                <Button
                  onClick={() => navigate('/dashboard/sessions/create')}
                  className="mt-4"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create First Session
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table columns={columns} data={sessions} />
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default SessionsListPage;