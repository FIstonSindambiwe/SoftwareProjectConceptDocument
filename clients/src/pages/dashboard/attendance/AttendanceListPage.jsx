import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  PlusIcon,
  CameraIcon,
  ChartBarIcon
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
  
  const [attendance, setAttendance] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    program: '',
    date_from: '',
    date_to: '',
    present: '',
    verified_by_face: '',
    search: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [attendanceData, programsData, statsData] = await Promise.all([
        attendanceService.getAttendanceRecords(),
        programService.getPrograms(),
        attendanceService.getAttendanceStats()
      ]);
      
      setAttendance(attendanceData.results || attendanceData || []);
      setPrograms(programsData.results || programsData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const params = {};
      
      if (filters.program) params.program = filters.program;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;
      if (filters.present !== '') params.present = filters.present;
      if (filters.verified_by_face !== '') params.verified_by_face = filters.verified_by_face;
      if (filters.search) params.search = filters.search;
      
      const data = await attendanceService.getAttendanceRecords(params);
      setAttendance(data.results || data || []);
      
      // Fetch stats with same filters
      const statsData = await attendanceService.getAttendanceStats(params);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      program: '',
      date_from: '',
      date_to: '',
      present: '',
      verified_by_face: '',
      search: ''
    });
  };

  const getStatusBadge = (present) => {
    return present ? (
      <Badge color="green">
        <CheckCircleIcon className="h-4 w-4 mr-1" />
        Present
      </Badge>
    ) : (
      <Badge color="red">
        <XCircleIcon className="h-4 w-4 mr-1" />
        Absent
      </Badge>
    );
  };

  const getVerificationBadge = (record) => {
    if (record.verified_by_face) {
      const quality = attendanceService.getConfidenceLevel(record.confidence_score || 0);
      return (
        <Badge color="blue" size="sm">
          <CameraIcon className="h-3 w-3 mr-1" />
          Face ({quality})
        </Badge>
      );
    }
    return (
      <Badge color="gray" size="sm">
        {record.verification_method_display || 'Manual'}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (value) => <span>{new Date(value).toLocaleDateString()}</span>
    },
    {
      key: 'participant_id',
      header: 'Participant',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'program_name',
      header: 'Program'
    },
    {
      key: 'session_name',
      header: 'Session',
      render: (value) => <span className="text-sm text-gray-600">{value || 'N/A'}</span>
    },
    {
      key: 'present',
      header: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'verification',
      header: 'Verification',
      render: (_, record) => getVerificationBadge(record)
    },
    {
      key: 'arrival_time',
      header: 'Time',
      render: (value, record) => (
        <span className="text-sm text-gray-600">
          {value || 'N/A'}
          {record.departure_time && ` - ${record.departure_time}`}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button
            size="xs"
            variant="outline"
            onClick={() => navigate(`/dashboard/attendance/${record.id}`)}
          >
            View
          </Button>
          {user && user.role !== 'donor' && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => navigate(`/dashboard/attendance/${record.id}/edit`)}
            >
              Edit
            </Button>
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
            <h1 className="text-2xl font-bold text-gray-900">Attendance Records</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and manage participant attendance
            </p>
          </div>
          
          {user && user.role !== 'donor' && (
            <div className="flex space-x-3">
              <Button
                onClick={() => navigate('/dashboard/attendance/face-check-in')}
                variant="outline"
              >
                <CameraIcon className="h-5 w-5 mr-2" />
                Face Check-in
              </Button>
              <Button
                onClick={() => navigate('/dashboard/attendance/bulk-record')}
                variant="outline"
              >
                <UserGroupIcon className="h-5 w-5 mr-2" />
                Bulk Record
              </Button>
              <Button onClick={() => navigate('/dashboard/attendance/create')}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Record Attendance
              </Button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Records</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total_records}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Present</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.present_count}</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                  <ChartBarIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.attendance_rate}%</p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <CameraIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Face Verified</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.face_verified_count}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-4">
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
                    From Date
                  </label>
                  <input
                    type="date"
                    name="date_from"
                    value={filters.date_from}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    name="date_to"
                    value={filters.date_to}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="present"
                    value={filters.present}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">All</option>
                    <option value="true">Present</option>
                    <option value="false">Absent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Face Verified
                  </label>
                  <select
                    name="verified_by_face"
                    value={filters.verified_by_face}
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
                    Search
                  </label>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Participant ID, Program..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Attendance Table */}
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Attendance Records ({attendance.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-500">No attendance records found</p>
              {user && user.role !== 'donor' && (
                <Button
                  onClick={() => navigate('/dashboard/attendance/create')}
                  className="mt-4"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Record First Attendance
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table columns={columns} data={attendance} />
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default AttendanceListPage;