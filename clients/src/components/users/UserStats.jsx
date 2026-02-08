// src/components/users/UserStats.jsx
import React, { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Spinner from '../common/Spinner';
import userService from '../../services/api/userService';

const UserStats = ({ stats: providedStats }) => {
  const [stats, setStats] = useState(providedStats || null);
  const [isLoading, setIsLoading] = useState(!providedStats);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!providedStats) {
      fetchStats();
    }
  }, [providedStats]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userService.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    const icons = {
      admin: ShieldCheckIcon,
      teacher: AcademicCapIcon,
      program_manager: BriefcaseIcon,
      donor: CurrencyDollarIcon,
    };
    return icons[role] || UserGroupIcon;
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'text-red-600 bg-red-100',
      teacher: 'text-blue-600 bg-blue-100',
      program_manager: 'text-yellow-600 bg-yellow-100',
      donor: 'text-green-600 bg-green-100',
    };
    return colors[role] || 'text-gray-600 bg-gray-100';
  };

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8 text-red-600">
          {error}
        </div>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.total_users || 0,
      icon: UsersIcon,
      color: 'text-blue-600 bg-blue-100',
      change: null,
    },
    {
      label: 'Active Users',
      value: stats.active_users || 0,
      icon: CheckCircleIcon,
      color: 'text-green-600 bg-green-100',
      change: stats.total_users 
        ? `${Math.round((stats.active_users / stats.total_users) * 100)}%`
        : null,
    },
    {
      label: 'Inactive Users',
      value: stats.inactive_users || 0,
      icon: XCircleIcon,
      color: 'text-gray-600 bg-gray-100',
      change: stats.total_users 
        ? `${Math.round((stats.inactive_users / stats.total_users) * 100)}%`
        : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stat.value.toLocaleString()}
                </p>
                {stat.change && (
                  <p className="text-sm text-gray-500 mt-1">
                    {stat.change} of total
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <Icon className="h-8 w-8" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default UserStats;