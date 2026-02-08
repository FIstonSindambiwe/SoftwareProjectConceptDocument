// src/pages/dashboard/DashboardPage.jsx - IMPROVED & ORGANIZED
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UsersIcon, 
  AcademicCapIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import useAuth from '../../hooks/useAuth';
import { formatNumber } from '../../utils/helpers';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, canEditData } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats({
        totalUsers: 45,
        totalPrograms: 12,
        totalParticipants: 358,
        attendanceRate: 87.5,
        userGrowth: 12.5,
        programGrowth: -3.2,
        participantGrowth: 18.7,
        attendanceGrowth: 5.3,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue', onClick }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      yellow: 'bg-yellow-100 text-yellow-600',
    };
    
    return (
      <div 
        className={`bg-white rounded-lg shadow-sm p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            
            {trendValue !== undefined && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(trendValue)}%
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last month</span>
              </div>
            )}
          </div>
          
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </div>
    );
  };

  // Quick Action Component
  const QuickAction = ({ title, description, icon: Icon, onClick, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      red: 'bg-red-100 text-red-600',
    };
    
    return (
      <button
        onClick={onClick}
        className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-start">
          <div className={`p-2 rounded-lg mr-4 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>
      </button>
    );
  };

  // Recent Activity Component
  const RecentActivity = ({ activity }) => (
    <div className="flex items-start py-3 border-b border-gray-200 last:border-0">
      <div className="flex-shrink-0">
        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-blue-600">
            {activity.user.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.user}</span> {activity.action}
        </p>
        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
      </div>
      <Badge variant={activity.type === 'create' ? 'success' : 'info'} size="sm">
        {activity.type}
      </Badge>
    </div>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-blue-100">
            Here's what's happening with your programs today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={formatNumber(stats?.totalUsers)}
            icon={UsersIcon}
            trend={stats?.userGrowth > 0 ? 'up' : 'down'}
            trendValue={stats?.userGrowth}
            color="blue"
            onClick={isAdmin() ? () => navigate('/users') : undefined}
          />
          
          <StatCard
            title="Active Programs"
            value={formatNumber(stats?.totalPrograms)}
            icon={AcademicCapIcon}
            trend={stats?.programGrowth > 0 ? 'up' : 'down'}
            trendValue={stats?.programGrowth}
            color="green"
            onClick={() => navigate('/programs')}
          />
          
          <StatCard
            title="Participants"
            value={formatNumber(stats?.totalParticipants)}
            icon={UserGroupIcon}
            trend={stats?.participantGrowth > 0 ? 'up' : 'down'}
            trendValue={stats?.participantGrowth}
            color="purple"
            onClick={canEditData() ? () => navigate('/participants') : undefined}
          />
          
          <StatCard
            title="Attendance Rate"
            value={`${stats?.attendanceRate}%`}
            icon={ClipboardDocumentCheckIcon}
            trend={stats?.attendanceGrowth > 0 ? 'up' : 'down'}
            trendValue={stats?.attendanceGrowth}
            color="yellow"
            onClick={canEditData() ? () => navigate('/attendance') : undefined}
          />
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Quick Actions</h2>
              <p className="text-sm text-gray-500 mb-6">Common tasks and shortcuts</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {canEditData() && (
                  <>
                    <QuickAction
                      title="Record Attendance"
                      description="Mark today's attendance"
                      icon={ClipboardDocumentCheckIcon}
                      onClick={() => navigate('/attendance')}
                      color="green"
                    />
                    <QuickAction
                      title="Add Participant"
                      description="Enroll new participant"
                      icon={UserGroupIcon}
                      onClick={() => navigate('/participants/create')}
                      color="blue"
                    />
                  </>
                )}
                
                <QuickAction
                  title="View Reports"
                  description="Generate program reports"
                  icon={ChartBarIcon}
                  onClick={() => navigate('/reports')}
                  color="purple"
                />
                
                {isAdmin() && (
                  <QuickAction
                    title="Manage Users"
                    description="Add or edit system users"
                    icon={UsersIcon}
                    onClick={() => navigate('/users')}
                    color="red"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Recent Activity</h2>
            <p className="text-sm text-gray-500 mb-6">Latest system updates</p>
            
            <div className="space-y-2">
              <RecentActivity
                activity={{
                  user: 'John Doe',
                  action: 'marked attendance for Morning Session',
                  time: '5 minutes ago',
                  type: 'update',
                }}
              />
              <RecentActivity
                activity={{
                  user: 'Jane Smith',
                  action: 'added new participant',
                  time: '1 hour ago',
                  type: 'create',
                }}
              />
              <RecentActivity
                activity={{
                  user: 'Mike Johnson',
                  action: 'completed assessment for YP-2024-A1B2C3',
                  time: '2 hours ago',
                  type: 'update',
                }}
              />
              <RecentActivity
                activity={{
                  user: 'Sarah Williams',
                  action: 'created Youth Leadership program',
                  time: '3 hours ago',
                  type: 'create',
                }}
              />
            </div>
            
            <button className="mt-4 text-sm text-blue-600 hover:text-blue-500 font-medium">
              View all activity →
            </button>
          </div>
        </div>

        {/* Program Performance Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Program Performance</h2>
          <p className="text-sm text-gray-500 mb-6">Monthly attendance and completion rates</p>
          
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p>Chart visualization coming soon</p>
              <p className="text-sm mt-2">Connect to analytics service to view trends</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;