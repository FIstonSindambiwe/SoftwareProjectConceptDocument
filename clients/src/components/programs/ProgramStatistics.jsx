// src/components/programs/ProgramStatistics.jsx
import React, { useState, useEffect } from 'react';
import {
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import Spinner from '../common/Spinner';
import programService from '../../services/api/programService';

const ProgramStatistics = ({ programs }) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await programService.getProgramStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate local stats from programs prop
  const localStats = React.useMemo(() => {
    if (!programs || programs.length === 0) return null;

    const totalParticipants = programs.reduce(
      (sum, p) => sum + (p.enrollment_count || 0),
      0
    );
    const targetParticipants = programs.reduce(
      (sum, p) => sum + (p.target_participants || 0),
      0
    );
    const totalBudget = programs.reduce(
      (sum, p) => sum + (parseFloat(p.budget) || 0),
      0
    );
    const ongoingCount = programs.filter(p => p.is_ongoing).length;
    const activeCount = programs.filter(p => p.is_active).length;
    const completedCount = programs.filter(p => p.status === 'completed').length;

    return {
      totalParticipants,
      targetParticipants,
      totalBudget,
      ongoingCount,
      activeCount,
      completedCount,
      averageEnrollment: programs.length > 0 ? totalParticipants / programs.length : 0,
    };
  }, [programs]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Programs',
      value: stats?.total_programs || programs?.length || 0,
      icon: AcademicCapIcon,
      color: 'blue',
      description: 'All programs',
    },
    {
      title: 'Active Programs',
      value: stats?.active_programs || localStats?.activeCount || 0,
      icon: CheckCircleIcon,
      color: 'green',
      description: 'Currently active',
    },
    {
      title: 'Ongoing Now',
      value: stats?.ongoing_programs || localStats?.ongoingCount || 0,
      icon: ClockIcon,
      color: 'yellow',
      description: 'Running programs',
    },
    {
      title: 'Completed',
      value: stats?.programs_by_status?.completed || localStats?.completedCount || 0,
      icon: ChartBarIcon,
      color: 'purple',
      description: 'Finished programs',
    },
    {
      title: 'Total Participants',
      value: formatNumber(localStats?.totalParticipants || 0),
      icon: UserGroupIcon,
      color: 'indigo',
      description: 'Enrolled participants',
    },
    {
      title: 'Target Capacity',
      value: formatNumber(localStats?.targetParticipants || 0),
      icon: ArrowTrendingUpIcon,
      color: 'pink',
      description: 'Total capacity',
    },
    {
      title: 'Total Budget',
      value: formatCurrency(localStats?.totalBudget || 0),
      icon: CurrencyDollarIcon,
      color: 'emerald',
      description: 'Combined budget',
    },
    {
      title: 'Avg Enrollment',
      value: Math.round(localStats?.averageEnrollment || 0),
      icon: MapPinIcon,
      color: 'orange',
      description: 'Per program',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      purple: 'bg-purple-100 text-purple-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      pink: 'bg-pink-100 text-pink-600',
      emerald: 'bg-emerald-100 text-emerald-600',
      orange: 'bg-orange-100 text-orange-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Breakdown */}
      {stats?.programs_by_status && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Programs by Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Object.entries(stats.programs_by_status).map(([status, count]) => (
              <div
                key={status}
                className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize mt-1">
                  {status.replace('_', ' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Locations */}
      {stats?.programs_by_location && stats.programs_by_location.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Locations
          </h3>
          <div className="space-y-3">
            {stats.programs_by_location.slice(0, 5).map((location, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {location.location__name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {location.location__city}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-gray-900">
                    {location.count}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">
                    programs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enrollment Progress */}
      {localStats && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Overall Enrollment Progress
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Enrolled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(localStats.totalParticipants)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Target Capacity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(localStats.targetParticipants)}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progress
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {localStats.targetParticipants > 0
                    ? Math.round(
                        (localStats.totalParticipants / localStats.targetParticipants) * 100
                      )
                    : 0}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      localStats.targetParticipants > 0
                        ? (localStats.totalParticipants / localStats.targetParticipants) * 100
                        : 0,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramStatistics;