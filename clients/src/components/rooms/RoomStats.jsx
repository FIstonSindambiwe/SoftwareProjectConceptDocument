// src/components/rooms/RoomStats.jsx
import React, { useState, useEffect } from 'react';
import { 
  HomeIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import participantService from '../../services/api/participantService';

const RoomStats = ({ rooms = [] }) => {
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
    averageCapacity: 0
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rooms && rooms.length > 0) {
      calculateStats(rooms);
    } else {
      fetchStats();
    }
  }, [rooms]);

  const calculateStats = (roomsData) => {
    const totalRooms = roomsData.length;
    const activeRooms = roomsData.filter(r => r.is_active).length;
    const inactiveRooms = totalRooms - activeRooms;
    
    const totalCapacity = roomsData.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const totalEnrolled = roomsData.reduce((sum, r) => sum + (r.current_enrollment_count || 0), 0);
    const utilizationRate = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;
    
    const fullRooms = roomsData.filter(r => r.is_full).length;
    const emptyRooms = roomsData.filter(r => (r.current_enrollment_count || 0) === 0).length;
    
    const roomsWithTeachers = roomsData.filter(r => r.teacher).length;
    const roomsWithoutTeachers = totalRooms - roomsWithTeachers;
    
    const averageCapacity = totalRooms > 0 ? Math.round(totalCapacity / totalRooms) : 0;

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
      averageCapacity
    });
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await participantService.getRooms({ page_size: 1000 });
      const allRooms = response.results || response;
      calculateStats(allRooms);
    } catch (error) {
      console.error('Error fetching room stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <div className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Don't render if no data
  if (stats.totalRooms === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Rooms */}
      <Card className="hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HomeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRooms}</p>
          <p className="text-sm text-gray-600 mt-1">Total Rooms</p>
          <div className="flex items-center mt-2 text-xs">
            <CheckCircleIcon className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-gray-600">{stats.activeRooms} active</span>
            <XCircleIcon className="h-3 w-3 text-gray-400 ml-2 mr-1" />
            <span className="text-gray-600">{stats.inactiveRooms} inactive</span>
          </div>
        </div>
      </Card>

      {/* Capacity */}
      <Card className="hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserGroupIcon className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Capacity
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalCapacity}</p>
          <p className="text-sm text-gray-600 mt-1">Total Capacity</p>
          <div className="flex items-center mt-2 text-xs">
            <span className="text-gray-600">{stats.totalEnrolled} enrolled</span>
            <span className="mx-1 text-gray-300">•</span>
            <span className="text-gray-600">Avg {stats.averageCapacity}/room</span>
          </div>
        </div>
      </Card>

      {/* Utilization */}
      <Card className="hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-yellow-600" />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              stats.utilizationRate > 80 ? 'bg-red-50 text-red-600' : 
              stats.utilizationRate > 50 ? 'bg-yellow-50 text-yellow-600' : 
              'bg-green-50 text-green-600'
            }`}>
              {stats.utilizationRate}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.utilizationRate}%</p>
          <p className="text-sm text-gray-600 mt-1">Utilization Rate</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  stats.utilizationRate > 80 ? 'bg-red-500' : 
                  stats.utilizationRate > 50 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(stats.utilizationRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Room Status */}
      <Card className="hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
              Status
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.fullRooms}</p>
          <p className="text-sm text-gray-600 mt-1">Full Rooms</p>
          <div className="flex items-center mt-2 text-xs">
            <span className="text-gray-600">{stats.emptyRooms} empty</span>
            <span className="mx-1 text-gray-300">•</span>
            <span className="text-gray-600">{stats.totalRooms - stats.fullRooms - stats.emptyRooms} partial</span>
          </div>
        </div>
      </Card>

      {/* Teacher Assignment - Full width card */}
      <Card className="hover:shadow-md transition-shadow md:col-span-2 lg:col-span-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AcademicCapIcon className="h-5 w-5 text-gray-600 mr-2" />
              <h3 className="text-sm font-medium text-gray-700">Teacher Assignment</h3>
            </div>
            <span className="text-xs text-gray-500">
              {stats.roomsWithTeachers} with teachers • {stats.roomsWithoutTeachers} without
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">With Teachers</span>
                <span className="font-medium text-gray-900">
                  {Math.round((stats.roomsWithTeachers / stats.totalRooms) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(stats.roomsWithTeachers / stats.totalRooms) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.roomsWithTeachers} rooms assigned
              </p>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Without Teachers</span>
                <span className="font-medium text-gray-900">
                  {Math.round((stats.roomsWithoutTeachers / stats.totalRooms) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-400 h-2 rounded-full"
                  style={{ width: `${(stats.roomsWithoutTeachers / stats.totalRooms) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats.roomsWithoutTeachers} rooms need teachers
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RoomStats;