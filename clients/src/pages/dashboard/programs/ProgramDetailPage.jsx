// src/pages/dashboard/programs/ProgramDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import programService from '../../../services/api/programService';

const ProgramDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgramData();
  }, [id]);

  const loadProgramData = async () => {
    setIsLoading(true);
    try {
      const [programData, summaryData] = await Promise.all([
        programService.getProgram(id),
        programService.getProgramSummary(id).catch(() => null)
      ]);
      setProgram(programData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading program:', error);
      toast.error('Failed to load program');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!program) {
    return (
      <Layout>
        <div className="text-center py-20">
          <ChartBarIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Program not found</h3>
          <Button
            variant="primary"
            onClick={() => navigate('/programs')}
            className="mt-6"
          >
            Back to Programs
          </Button>
        </div>
      </Layout>
    );
  }

  const getStatusBadgeVariant = (status) => {
    const variants = {
      planning: 'warning',
      active: 'success',
      completed: 'primary',
      on_hold: 'default',
      cancelled: 'danger',
    };
    return variants[status] || 'default';
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="py-3">
      <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
        {Icon && <Icon className="h-4 w-4 mr-2" />}
        {label}
      </div>
      <p className="text-sm text-gray-900 font-medium">{value || '-'}</p>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Button
                variant="ghost"
                icon={ArrowLeftIcon}
                onClick={() => navigate('/programs')}
              >
                Back
              </Button>
              
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {program.name}
                  </h1>
                  <Badge variant={getStatusBadgeVariant(program.status)}>
                    {program.status_display || program.status}
                  </Badge>
                  {program.is_ongoing && (
                    <Badge variant="success">
                      <ClockIcon className="h-3 w-3 inline mr-1" />
                      Ongoing
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {program.location_name}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              icon={PencilIcon}
              onClick={() => navigate(`/programs/${id}/edit`)}
            >
              Edit Program
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Program Details */}
            <Card title="Program Details">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{program.description}</p>
                </div>

                {program.focus_areas && program.focus_areas.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Focus Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {program.focus_areas.map((area, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {program.notes && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{program.notes}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Milestones */}
            <Card title={`Milestones (${program.milestones?.length || 0})`}>
              {!program.milestones || program.milestones.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No milestones added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {program.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`p-4 rounded-lg border ${
                        milestone.is_completed
                          ? 'bg-green-50 border-green-200'
                          : milestone.is_overdue
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <CalendarIcon className="h-3 w-3 mr-1" />
                            Target: {new Date(milestone.target_date).toLocaleDateString()}
                            {milestone.completion_date && (
                              <span className="ml-3">
                                Completed: {new Date(milestone.completion_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={
                            milestone.is_completed
                              ? 'success'
                              : milestone.is_overdue
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {milestone.is_completed
                            ? 'Completed'
                            : milestone.is_overdue
                            ? 'Overdue'
                            : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline & Budget */}
            <Card title="Timeline & Budget">
              <div className="divide-y divide-gray-200">
                <InfoRow
                  label="Start Date"
                  value={new Date(program.start_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  icon={CalendarIcon}
                />
                {program.end_date && (
                  <InfoRow
                    label="End Date"
                    value={new Date(program.end_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    icon={CalendarIcon}
                  />
                )}
                <InfoRow
                  label="Duration"
                  value={`${program.duration_days} days`}
                  icon={ClockIcon}
                />
                {program.budget && (
                  <InfoRow
                    label="Budget"
                    value={`$${parseFloat(program.budget).toLocaleString()}`}
                    icon={CurrencyDollarIcon}
                  />
                )}
                {program.funding_source && (
                  <InfoRow
                    label="Funding Source"
                    value={program.funding_source}
                  />
                )}
              </div>
            </Card>

            {/* Participants */}
            <Card title="Participants">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Enrolled</span>
                  <span className="text-lg font-bold text-gray-900">
                    {program.enrollment_count || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Target</span>
                  <span className="text-lg font-bold text-gray-900">
                    {program.target_participants}
                  </span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round((program.enrollment_count / program.target_participants) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((program.enrollment_count / program.target_participants) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-700">Completion Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {program.completion_rate || 0}%
                  </span>
                </div>
              </div>
            </Card>

            {/* Age Range */}
            <Card title="Age Range">
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-gray-900">
                  {program.age_range_min} - {program.age_range_max}
                </div>
                <div className="text-sm text-gray-500 mt-1">years old</div>
              </div>
            </Card>

            {/* Metrics */}
            {summary?.metrics && (
              <Card title="Metrics">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Active Participants</span>
                    <span className="text-sm font-medium text-gray-900">
                      {summary.metrics.active_participants || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Completed</span>
                    <span className="text-sm font-medium text-gray-900">
                      {summary.metrics.completed || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Dropped</span>
                    <span className="text-sm font-medium text-gray-900">
                      {summary.metrics.dropped || 0}
                    </span>
                  </div>
                  {summary.metrics.average_attendance !== undefined && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <span className="text-sm text-gray-700">Avg. Attendance</span>
                      <span className="text-sm font-medium text-gray-900">
                        {summary.metrics.average_attendance}%
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProgramDetailPage;