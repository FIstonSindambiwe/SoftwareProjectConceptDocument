// src/pages/dashboard/Rooms/RoomStatisticsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  HomeIcon,
  UserGroupIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  AcademicCapIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Badge from '../../../components/common/Badge';
import useAuth from '../../../hooks/useAuth';
import roomService from '../../../services/api/roomService';
import programService from '../../../services/api/programService';
import { format, subDays, subMonths, subYears } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const RoomStatisticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [dateRange, setDateRange] = useState('month'); // week, month, year, all
  const [selectedProgram, setSelectedProgram] = useState('all');
  
  // Statistics state
  const [stats, setStats] = useState({
    totalRooms: 0,
    activeRooms: 0,
    inactiveRooms: 0,
    totalCapacity: 0,
    totalEnrolled: 0,
    utilizationRate: 0,
    fullRooms: 0,
    emptyRooms: 0,
    roomsWithTeachers: 0,
    roomsWithoutTeachers: 0,
    averageCapacity: 0,
    roomsByProgram: {},
    roomsByStatus: { active: 0, inactive: 0 },
    capacityByProgram: {},
    enrollmentTrend: [],
    topPrograms: []
  });

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedProgram]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch rooms with all data (no pagination for stats)
      const [roomsData, programsData] = await Promise.all([
        roomService.getRooms({ page_size: 1000 }), // Get all rooms
        programService.getPrograms({ page_size: 1000 })
      ]);
      
      const allRooms = roomsData.results || roomsData;
      const allPrograms = programsData.results || programsData;
      
      setRooms(allRooms);
      setPrograms(allPrograms);
      
      // Calculate statistics
      calculateStatistics(allRooms, allPrograms);
      
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStatistics = (roomsData, programsData) => {
    // Filter by program if selected
    const filteredRooms = selectedProgram === 'all' 
      ? roomsData 
      : roomsData.filter(room => room.program === parseInt(selectedProgram));

    // Basic counts
    const totalRooms = filteredRooms.length;
    const activeRooms = filteredRooms.filter(r => r.is_active).length;
    const inactiveRooms = totalRooms - activeRooms;
    
    // Capacity calculations
    const totalCapacity = filteredRooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const totalEnrolled = filteredRooms.reduce((sum, r) => sum + (r.current_enrollment_count || 0), 0);
    const utilizationRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;
    
    // Room status
    const fullRooms = filteredRooms.filter(r => r.is_full).length;
    const emptyRooms = filteredRooms.filter(r => (r.current_enrollment_count || 0) === 0).length;
    
    // Teacher assignment
    const roomsWithTeachers = filteredRooms.filter(r => r.teacher).length;
    const roomsWithoutTeachers = totalRooms - roomsWithTeachers;
    
    // Average capacity
    const averageCapacity = totalRooms > 0 ? Math.round(totalCapacity / totalRooms) : 0;

    // Rooms by program
    const roomsByProgram = {};
    const capacityByProgram = {};
    
    filteredRooms.forEach(room => {
      const programId = room.program;
      const programName = programsData.find(p => p.id === programId)?.name || 'Unknown';
      
      roomsByProgram[programName] = (roomsByProgram[programName] || 0) + 1;
      capacityByProgram[programName] = (capacityByProgram[programName] || 0) + (room.capacity || 0);
    });

    // Top programs by room count
    const topPrograms = Object.entries(roomsByProgram)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Generate enrollment trend data
    const enrollmentTrend = generateEnrollmentTrend(filteredRooms);

    setStats({
      totalRooms,
      activeRooms,
      inactiveRooms,
      totalCapacity,
      totalEnrolled,
      utilizationRate: utilizationRate.toFixed(1),
      fullRooms,
      emptyRooms,
      roomsWithTeachers,
      roomsWithoutTeachers,
      averageCapacity,
      roomsByProgram,
      roomsByStatus: { active: activeRooms, inactive: inactiveRooms },
      capacityByProgram,
      enrollmentTrend,
      topPrograms
    });
  };

  const generateEnrollmentTrend = (roomsData) => {
    // This is a simplified trend - in production, you'd use actual historical data
    const now = new Date();
    const trend = [];
    
    let intervals = 7;
    let intervalDays = 7;
    
    if (dateRange === 'week') {
      intervals = 7;
      intervalDays = 1;
    } else if (dateRange === 'month') {
      intervals = 4;
      intervalDays = 7;
    } else if (dateRange === 'year') {
      intervals = 12;
      intervalDays = 30;
    } else {
      intervals = 6;
      intervalDays = 60;
    }
    
    for (let i = intervals - 1; i >= 0; i--) {
      const date = subDays(now, i * intervalDays);
      const totalEnrolled = roomsData.reduce((sum, r) => {
        // Simulate growth over time
        const simulatedEnrollment = Math.floor((r.current_enrollment_count || 0) * (0.7 + (i * 0.05)));
        return sum + Math.min(simulatedEnrollment, r.capacity || 0);
      }, 0);
      
      trend.push({
        date: format(date, 'MMM d'),
        enrolled: totalEnrolled,
        capacity: roomsData.reduce((sum, r) => sum + (r.capacity || 0), 0)
      });
    }
    
    return trend;
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleExport = () => {
    // Create CSV data
    const headers = ['Room Name', 'Program', 'Teacher', 'Capacity', 'Enrolled', 'Available', 'Status', 'Schedule'];
    const csvData = rooms.map(room => [
      room.name,
      room.program_name || 'N/A',
      room.teacher_name || 'Not Assigned',
      room.capacity,
      room.current_enrollment_count || 0,
      room.available_spots || 0,
      room.is_active ? 'Active' : 'Inactive',
      room.schedule || 'N/A'
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `room-statistics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Chart configurations
  const roomsByProgramChart = {
    labels: Object.keys(stats.roomsByProgram),
    datasets: [
      {
        label: 'Number of Rooms',
        data: Object.values(stats.roomsByProgram),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  const capacityByProgramChart = {
    labels: Object.keys(stats.capacityByProgram),
    datasets: [
      {
        label: 'Total Capacity',
        data: Object.values(stats.capacityByProgram),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1
      }
    ]
  };

  const statusPieChart = {
    labels: ['Active Rooms', 'Inactive Rooms'],
    datasets: [
      {
        data: [stats.activeRooms, stats.inactiveRooms],
        backgroundColor: ['rgba(34, 197, 94, 0.5)', 'rgba(156, 163, 175, 0.5)'],
        borderColor: ['rgb(34, 197, 94)', 'rgb(156, 163, 175)'],
        borderWidth: 1
      }
    ]
  };

  const teacherAssignmentChart = {
    labels: ['With Teachers', 'Without Teachers'],
    datasets: [
      {
        data: [stats.roomsWithTeachers, stats.roomsWithoutTeachers],
        backgroundColor: ['rgba(59, 130, 246, 0.5)', 'rgba(156, 163, 175, 0.5)'],
        borderColor: ['rgb(59, 130, 246)', 'rgb(156, 163, 175)'],
        borderWidth: 1
      }
    ]
  };

  const enrollmentTrendChart = {
    labels: stats.enrollmentTrend.map(d => d.date),
    datasets: [
      {
        label: 'Total Enrolled',
        data: stats.enrollmentTrend.map(d => d.enrolled),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Total Capacity',
        data: stats.enrollmentTrend.map(d => d.capacity),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  if (loading) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/participants/rooms')}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Rooms
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Room Statistics</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Analytics and insights for all classrooms
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Program Filter
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last 12 Months</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Rooms</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <HomeIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1" />
                <span>{stats.activeRooms} active</span>
                <XCircleIcon className="h-3 w-3 text-gray-400 ml-2 mr-1" />
                <span>{stats.inactiveRooms} inactive</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Capacity</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCapacity}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <span>{stats.totalEnrolled} enrolled</span>
                <span className="mx-2">•</span>
                <span>{stats.totalCapacity - stats.totalEnrolled} available</span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Utilization Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.utilizationRate}%</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <Badge color={stats.utilizationRate > 80 ? 'red' : stats.utilizationRate > 50 ? 'yellow' : 'green'} size="sm">
                  {stats.utilizationRate > 80 ? 'High' : stats.utilizationRate > 50 ? 'Medium' : 'Low'} usage
                </Badge>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Room Status</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.fullRooms} Full</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <span>{stats.emptyRooms} empty</span>
                <span className="mx-2">•</span>
                <span>{stats.totalRooms - stats.fullRooms - stats.emptyRooms} partial</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Rooms by Program */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rooms by Program</h3>
              <div className="h-80">
                <Bar data={roomsByProgramChart} options={chartOptions} />
              </div>
            </div>
          </Card>

          {/* Capacity by Program */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Capacity by Program</h3>
              <div className="h-80">
                <Bar data={capacityByProgramChart} options={chartOptions} />
              </div>
            </div>
          </Card>

          {/* Teacher Assignment */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teacher Assignment</h3>
              <div className="h-80">
                <Pie data={teacherAssignmentChart} options={chartOptions} />
              </div>
            </div>
          </Card>

          {/* Room Status */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Status</h3>
              <div className="h-80">
                <Pie data={statusPieChart} options={chartOptions} />
              </div>
            </div>
          </Card>

          {/* Enrollment Trend */}
          <Card className="lg:col-span-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trend</h3>
              <div className="h-80">
                <Line data={enrollmentTrendChart} options={chartOptions} />
              </div>
            </div>
          </Card>
        </div>

        {/* Top Programs List */}
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Programs by Room Count</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.topPrograms.map((program, index) => (
                <div key={program.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-900">{program.name}</span>
                  </div>
                  <Badge color="blue">{program.count} rooms</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Detailed Rooms Table */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Room Information</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilization</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rooms.map(room => {
                    const utilization = ((room.current_enrollment_count || 0) / (room.capacity || 1)) * 100;
                    return (
                      <tr key={room.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{room.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{room.program_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{room.teacher_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{room.capacity}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{room.current_enrollment_count || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{room.available_spots || 0}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center">
                            <span className="mr-2">{utilization.toFixed(1)}%</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  utilization > 90 ? 'bg-red-500' : utilization > 70 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge color={room.is_active ? 'green' : 'gray'} size="sm">
                            {room.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default RoomStatisticsPage;
