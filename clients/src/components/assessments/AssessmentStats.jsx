// src/components/assessments/AssessmentStats.jsx
import React from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import assessmentsService from '../../services/api/assessmentsService';

const StatCard = ({ icon: Icon, label, value, sub, iconBg = 'bg-blue-100', iconColor = 'text-blue-600' }) => (
  <Card className="hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className={`flex-shrink-0 ${iconBg} rounded-lg p-3`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  </Card>
);

const AssessmentStats = ({ stats }) => {
  if (!stats) return null;

  const avgPct = stats.max_score > 0
    ? assessmentsService.scoreToPercent(stats.average_score, {
        min_value: 0,
        max_value: stats.max_score,
      })
    : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={ChartBarIcon}
        label="Total Assessments"
        value={stats.total_assessments?.toLocaleString() ?? '—'}
        sub="All time"
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
      />

      <StatCard
        icon={ArrowTrendingUpIcon}
        label="Average Score"
        value={stats.average_score != null ? stats.average_score.toFixed(1) : '—'}
        sub={avgPct != null ? assessmentsService.getPerformanceLabel(avgPct) : undefined}
        iconBg="bg-green-100"
        iconColor="text-green-600"
      />

      <StatCard
        icon={ArrowTrendingUpIcon}
        label="Highest Score"
        value={stats.max_score != null ? stats.max_score.toFixed(1) : '—'}
        sub="Best recorded"
        iconBg="bg-purple-100"
        iconColor="text-purple-600"
      />

      <StatCard
        icon={ArrowTrendingDownIcon}
        label="Lowest Score"
        value={stats.min_score != null ? stats.min_score.toFixed(1) : '—'}
        sub="Needs attention"
        iconBg="bg-yellow-100"
        iconColor="text-yellow-600"
      />
    </div>
  );
};

export default AssessmentStats;