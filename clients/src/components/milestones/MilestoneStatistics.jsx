// src/components/milestones/MilestoneStatistics.jsx
import React from 'react';
import {
  FlagIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const MilestoneStatistics = ({ milestones }) => {
  // Calculate statistics
  const stats = {
    total: milestones.length,
    completed: milestones.filter(m => m.is_completed).length,
    pending: milestones.filter(m => !m.is_completed).length,
    overdue: milestones.filter(m => m.is_overdue).length,
    completionRate: milestones.length > 0 
      ? Math.round((milestones.filter(m => m.is_completed).length / milestones.length) * 100)
      : 0,
  };

  // Get upcoming milestones (next 7 days)
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcoming = milestones.filter(m => {
    if (m.is_completed) return false;
    const targetDate = new Date(m.target_date);
    return targetDate >= today && targetDate <= nextWeek;
  }).length;

  const statCards = [
    {
      title: 'Total Milestones',
      value: stats.total,
      icon: FlagIcon,
      color: 'blue',
      description: 'All milestones',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircleIcon,
      color: 'green',
      description: 'Successfully finished',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: ClockIcon,
      color: 'yellow',
      description: 'In progress',
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: ExclamationTriangleIcon,
      color: 'red',
      description: 'Past target date',
    },
    {
      title: 'Completion Rate',
      value: `${stats.completionRate}%`,
      icon: ChartBarIcon,
      color: 'purple',
      description: 'Success rate',
    },
    {
      title: 'Due This Week',
      value: upcoming,
      icon: CalendarDaysIcon,
      color: 'indigo',
      description: 'Next 7 days',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600',
      indigo: 'bg-indigo-100 text-indigo-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
  );
};

export default MilestoneStatistics;