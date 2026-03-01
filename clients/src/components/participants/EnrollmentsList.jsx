// src/components/participants/EnrollmentsList.jsx
import React from 'react';
import {
  AcademicCapIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  GiftIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  CurrencyDollarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { useNavigate } from 'react-router-dom';

const EnrollmentsList = ({ 
  enrollments = [], 
  participantId, 
  user, 
  onEnrollmentUpdated,
  onDropoutClick,
  onScholarshipClick,
  onTemporaryClick
}) => {
  const navigate = useNavigate();
  
  const canEdit = user?.role !== 'donor';
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const isProgramManager = user?.role === 'program_manager';

  // Get status badge based on enrollment status
  const getStatusBadge = (enrollment) => {
    // Check for special statuses first
    if (enrollment.has_dropped_out) {
      return (
        <Badge color="red" className="flex items-center gap-1">
          <XCircleIcon className="h-3 w-3" />
          Dropped Out
        </Badge>
      );
    }
    
    if (enrollment.has_scholarship) {
      return (
        <Badge color="yellow" className="flex items-center gap-1">
          <GiftIcon className="h-3 w-3" />
          Scholarship Awarded
        </Badge>
      );
    }
    
    if (enrollment.has_finished) {
      return (
        <Badge color="green" className="flex items-center gap-1">
          <CheckCircleIcon className="h-3 w-3" />
          Completed
        </Badge>
      );
    }
    
    // Use status field for others
    switch (enrollment.status) {
      case 'enrolled':
      case 'active':
        return (
          <Badge color="purple" className="flex items-center gap-1">
            <AcademicCapIcon className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'transferred':
        return (
          <Badge color="blue" className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            Transferred
          </Badge>
        );
      default:
        return (
          <Badge color="gray">
            {enrollment.status_display || enrollment.status}
          </Badge>
        );
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (enrollments.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <AcademicCapIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Enrollments Found</h3>
          <p className="text-gray-500 mb-6">
            This participant is not enrolled in any programs yet.
          </p>
          {canEdit && (
            <Button onClick={() => navigate(`/dashboard/participants/${participantId}/enroll`)}>
              Enroll in Program
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {enrollments.map((enrollment) => (
        <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
          <div className="p-6">
            {/* Header with Program and Status */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AcademicCapIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {enrollment.program_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500 flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </span>
                      {enrollment.expected_completion_date && (
                        <span className="text-sm text-gray-500 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          Expected: {new Date(enrollment.expected_completion_date).toLocaleDateString()}
                        </span>
                      )}
                      {enrollment.completion_date && (
                        <span className="text-sm text-gray-500 flex items-center">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Completed: {new Date(enrollment.completion_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                {getStatusBadge(enrollment)}
              </div>
            </div>

            {/* Progress Section */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Attendance Rate */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Attendance Rate</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          enrollment.attendance_rate >= 80 ? 'bg-green-500' :
                          enrollment.attendance_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${enrollment.attendance_rate || 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {enrollment.attendance_rate?.toFixed(1) || 0}%
                  </span>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Duration</p>
                <p className="text-sm font-medium text-gray-700">
                  {enrollment.duration_days || 0} days
                </p>
              </div>

              {/* Outcome Status */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Outcome</p>
                <p className="text-sm font-medium text-gray-700">
                  {enrollment.outcome_status || enrollment.status_display || 'In Progress'}
                </p>
              </div>
            </div>

            {/* Dropout Details (if applicable) */}
            {enrollment.has_dropped_out && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-2">
                  <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">Dropout Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-gray-600">Date:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {enrollment.dropout_date ? new Date(enrollment.dropout_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reason:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {enrollment.dropout_reason_display || enrollment.dropout_reason}
                        </span>
                      </div>
                      {enrollment.dropout_notes && (
                        <div className="md:col-span-2">
                          <span className="text-gray-600">Notes:</span>{' '}
                          <span className="text-gray-700">{enrollment.dropout_notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Scholarship Details (if applicable) */}
            {enrollment.has_scholarship && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <GiftIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900">Scholarship Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {enrollment.scholarship_type_display || enrollment.scholarship_type}
                        </span>
                      </div>
                      {enrollment.scholarship_amount && (
                        <div>
                          <span className="text-gray-600">Amount:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {formatCurrency(enrollment.scholarship_amount)}
                          </span>
                        </div>
                      )}
                      {enrollment.scholarship_provider && (
                        <div>
                          <span className="text-gray-600">Provider:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {enrollment.scholarship_provider}
                          </span>
                        </div>
                      )}
                      {enrollment.scholarship_date && (
                        <div>
                          <span className="text-gray-600">Award Date:</span>{' '}
                          <span className="font-medium text-gray-900">
                            {new Date(enrollment.scholarship_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {enrollment.scholarship_notes && (
                        <div className="md:col-span-2">
                          <span className="text-gray-600">Notes:</span>{' '}
                          <span className="text-gray-700">{enrollment.scholarship_notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {(isAdmin || isProgramManager || isTeacher) && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                {/* View Details Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/dashboard/enrollments/${enrollment.id}`)}
                >
                  <EyeIcon className="h-4 w-4 mr-1" />
                  View Details
                </Button>

                {/* Action buttons for active enrollments */}
                {!enrollment.has_dropped_out && !enrollment.has_finished && enrollment.status !== 'completed' && (
                  <>
                    {/* Dropout Button */}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => onDropoutClick(enrollment)}
                      className="flex items-center"
                    >
                      <XCircleIcon className="h-4 w-4 mr-1" />
                      Record Dropout
                    </Button>

                    {/* Scholarship Button */}
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => onScholarshipClick(enrollment)}
                      className="flex items-center bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-300"
                    >
                      <GiftIcon className="h-4 w-4 mr-1" />
                      Award Scholarship
                    </Button>

                    {/* Finish Program Button */}
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        // You'll need to add this handler in the parent component
                        if (window.confirm('Mark this program as completed?')) {
                          // Handle finish program
                        }
                      }}
                      className="flex items-center"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Mark Completed
                    </Button>
                  </>
                )}

                {/* Status indicators for non-actionable enrollments */}
                {enrollment.has_scholarship && (
                  <Badge color="yellow" className="flex items-center gap-1">
                    <GiftIcon className="h-4 w-4" />
                    Scholarship Awarded
                  </Badge>
                )}

                {enrollment.has_dropped_out && (
                  <Badge color="red" className="flex items-center gap-1">
                    <XCircleIcon className="h-4 w-4" />
                    Dropped Out
                  </Badge>
                )}

                {enrollment.has_finished && (
                  <Badge color="green" className="flex items-center gap-1">
                    <CheckCircleIcon className="h-4 w-4" />
                    Completed
                    {enrollment.final_grade && ` - Grade: ${enrollment.final_grade}`}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default EnrollmentsList;