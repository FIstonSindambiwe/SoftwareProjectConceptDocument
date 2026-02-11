import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Table from '../common/Table';
import Spinner from '../common/Spinner';
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
  AcademicCapIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import participantService from '../../services/api/participantService';
import programService from '../../services/api/programService';

const EnrollmentsList = ({ enrollments, participantId, user, onEnrollmentUpdated }) => {
  const [loading, setLoading] = useState({});
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    if (showEnrollModal) {
      fetchPrograms();
    }
  }, [showEnrollModal]);

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const response = await programService.getActivePrograms();
      setPrograms(response.results || response || []);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to load programs');
    } finally {
      setLoadingPrograms(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      enrolled: { color: 'blue', label: 'Enrolled', icon: ClockIcon },
      active: { color: 'green', label: 'Active', icon: AcademicCapIcon },
      completed: { color: 'purple', label: 'Completed', icon: CheckCircleIcon },
      dropped: { color: 'red', label: 'Dropped', icon: XCircleIcon },
      transferred: { color: 'yellow', label: 'Transferred', icon: ArrowPathIcon }
    };
    
    const config = statusConfig[status] || { color: 'gray', label: status, icon: InformationCircleIcon };
    const Icon = config.icon;
    
    return (
      <Badge color={config.color} className="flex items-center gap-1 px-2.5 py-1">
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    );
  };

  const handleEnroll = async () => {
    if (!selectedProgram) {
      setError('Please select a program');
      return;
    }

    setEnrolling(true);
    setError('');

    try {
      await participantService.createEnrollment({
        participant: participantId,
        program: selectedProgram,
        enrollment_date: enrollmentDate,
        status: 'enrolled'
      });

      setSuccess('Participant enrolled successfully');
      setTimeout(() => setSuccess(''), 3000);
      setShowEnrollModal(false);
      setSelectedProgram('');
      setEnrollmentDate(new Date().toISOString().split('T')[0]);
      onEnrollmentUpdated();
    } catch (err) {
      console.error('Error enrolling participant:', err);
      setError(err.message || 'Failed to enroll participant');
      setTimeout(() => setError(''), 5000);
    } finally {
      setEnrolling(false);
    }
  };

  const handleCompleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('Mark this enrollment as completed?')) return;
    
    setLoading(prev => ({ ...prev, [enrollmentId]: true }));
    setError('');
    
    try {
      await participantService.completeEnrollment(enrollmentId);
      setSuccess('Enrollment marked as completed');
      setTimeout(() => setSuccess(''), 3000);
      onEnrollmentUpdated();
    } catch (err) {
      setError(err.message || 'Failed to complete enrollment');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(prev => ({ ...prev, [enrollmentId]: false }));
    }
  };

  const handleDropoutEnrollment = async (enrollmentId) => {
    const reason = window.prompt('Please enter the reason for dropout:');
    if (reason === null) return;
    
    setLoading(prev => ({ ...prev, [enrollmentId]: true }));
    setError('');
    
    try {
      await participantService.dropoutEnrollment(enrollmentId, reason);
      setSuccess('Participant marked as dropped out');
      setTimeout(() => setSuccess(''), 3000);
      onEnrollmentUpdated();
    } catch (err) {
      setError(err.message || 'Failed to mark as dropout');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(prev => ({ ...prev, [enrollmentId]: false }));
    }
  };

  const handleUpdateAttendance = async (enrollmentId) => {
    setLoading(prev => ({ ...prev, [enrollmentId]: true }));
    setError('');
    
    try {
      await participantService.updateEnrollmentAttendance(enrollmentId);
      setSuccess('Attendance rate updated');
      setTimeout(() => setSuccess(''), 3000);
      onEnrollmentUpdated();
    } catch (err) {
      setError(err.message || 'Failed to update attendance');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(prev => ({ ...prev, [enrollmentId]: false }));
    }
  };

  const toggleRowExpand = (enrollmentId) => {
    setExpandedRow(expandedRow === enrollmentId ? null : enrollmentId);
  };

  // Helper to get attendance color
  const getAttendanceColor = (value) => {
    if (value >= 80) return 'text-green-600 bg-green-50';
    if (value >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const columns = [
    {
      key: 'program_name',
      header: 'Program',
      render: (value, enrollment) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {value?.charAt(0) || 'P'}
          </div>
          <div>
            <Link
              to={`/dashboard/programs/${enrollment.program}`}
              className="text-blue-600 hover:text-blue-800 font-medium hover:underline block"
            >
              {value}
            </Link>
            {enrollment.program_code && (
              <span className="text-xs text-gray-500">{enrollment.program_code}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'enrollment_date',
      header: 'Enrolled',
      render: (value) => (
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-700">{new Date(value).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      key: 'status_display',
      header: 'Status',
      render: (_, enrollment) => getStatusBadge(enrollment.status)
    },
    {
      key: 'attendance_rate',
      header: 'Attendance',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getAttendanceColor(value)}`}>
            {value ? value.toFixed(1) : '0.0'}%
          </div>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, enrollment) => (
        <div className="flex items-center gap-1">
          {/* Complete Button - Only for active/enrolled */}
          {['enrolled', 'active'].includes(enrollment.status) && (
            <button
              onClick={() => handleCompleteEnrollment(enrollment.id)}
              disabled={loading[enrollment.id]}
              className="p-2 text-green-600 hover:text-white hover:bg-green-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed group relative"
              title="Mark as Completed"
            >
              {loading[enrollment.id] ? (
                <Spinner size="xs" />
              ) : (
                <CheckCircleIcon className="h-5 w-5" />
              )}
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Complete
              </span>
            </button>
          )}
          
          {/* Dropout Button - Only for active/enrolled */}
          {['enrolled', 'active'].includes(enrollment.status) && (
            <button
              onClick={() => handleDropoutEnrollment(enrollment.id)}
              disabled={loading[enrollment.id]}
              className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed group relative"
              title="Mark as Dropped Out"
            >
              {loading[enrollment.id] ? (
                <Spinner size="xs" />
              ) : (
                <XCircleIcon className="h-5 w-5" />
              )}
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Dropout
              </span>
            </button>
          )}
          
          {/* Update Attendance Button - Always visible */}
          <button
            onClick={() => handleUpdateAttendance(enrollment.id)}
            disabled={loading[enrollment.id]}
            className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed group relative"
            title="Update Attendance Rate"
          >
            {loading[enrollment.id] ? (
              <Spinner size="xs" />
            ) : (
              <ChartBarIcon className="h-5 w-5" />
            )}
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Update Attendance
            </span>
          </button>

          {/* Expand/Collapse Button - Shows additional info */}
          <button
            onClick={() => toggleRowExpand(enrollment.id)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 group relative"
            title={expandedRow === enrollment.id ? 'Show less' : 'Show more'}
          >
            {expandedRow === enrollment.id ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {expandedRow === enrollment.id ? 'Show less' : 'Show more'}
            </span>
          </button>
        </div>
      )
    }
  ];

  // Expanded row content
  const expandedRowRender = (enrollment) => {
    if (expandedRow !== enrollment.id) return null;
    
    return (
      <div className="bg-gray-50 p-4 rounded-lg mt-2 border border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Enrollment Details</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Enrolled: </span>
                <span className="text-gray-900">{new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
              </div>
              {enrollment.expected_completion_date && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Expected: </span>
                  <span className="text-gray-900">{new Date(enrollment.expected_completion_date).toLocaleDateString()}</span>
                </div>
              )}
              {enrollment.completion_date && (
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">Completed: </span>
                  <span className="text-gray-900">{new Date(enrollment.completion_date).toLocaleDateString()}</span>
                </div>
              )}
              {enrollment.exit_date && (
                <div className="flex items-center gap-2">
                  <XCircleIcon className="h-4 w-4 text-red-500" />
                  <span className="text-gray-600">Exited: </span>
                  <span className="text-gray-900">{new Date(enrollment.exit_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Performance</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Attendance: </span>
                <span className={`font-medium ${getAttendanceColor(enrollment.attendance_rate)} px-2 py-0.5 rounded-full`}>
                  {enrollment.attendance_rate?.toFixed(1) || '0.0'}%
                </span>
              </div>
              {enrollment.duration_days && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Duration: </span>
                  <span className="text-gray-900">{enrollment.duration_days} days</span>
                </div>
              )}
            </div>
          </div>
          
          {enrollment.exit_reason && (
            <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div>
                  <span className="text-gray-600 font-medium">Exit Reason: </span>
                  <span className="text-gray-900">{enrollment.exit_reason}</span>
                </div>
              </div>
            </div>
          )}
          
          {enrollment.notes && (
            <div className="col-span-2 mt-2">
              <span className="text-gray-600 font-medium">Notes: </span>
              <span className="text-gray-900">{enrollment.notes}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AcademicCapIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Program Enrollments</h3>
            <p className="text-sm text-gray-500">
              {enrollments.length} {enrollments.length === 1 ? 'program' : 'programs'} enrolled
            </p>
          </div>
        </div>
        
        {user?.role !== 'donor' && (
          <Button
            onClick={() => setShowEnrollModal(true)}
            className="flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Enroll in Program</span>
          </Button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2 animate-fadeIn">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 animate-fadeIn">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-gray-900 font-medium mb-2">No program enrollments yet</p>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Enroll this participant in a program to start tracking their progress and attendance.
          </p>
          {user?.role !== 'donor' && (
            <Button
              variant="outline"
              onClick={() => setShowEnrollModal(true)}
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Enroll in First Program
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table 
            columns={columns} 
            data={enrollments} 
            rowClassName="hover:bg-gray-50 transition-colors"
            expandedRowRender={expandedRowRender}
          />
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start gap-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Quick Actions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click <CheckCircleIcon className="h-4 w-4 text-green-600 inline mx-1" /> to mark enrollment as completed</li>
                <li>Click <XCircleIcon className="h-4 w-4 text-red-600 inline mx-1" /> to mark as dropped out</li>
                <li>Click <ChartBarIcon className="h-4 w-4 text-blue-600 inline mx-1" /> to update attendance rate</li>
                <li>Click <ChevronDownIcon className="h-4 w-4 text-gray-600 inline mx-1" /> to view additional details</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PlusIcon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Enroll in New Program
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setSelectedProgram('');
                  setError('');
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                disabled={enrolling}
              >
                <span className="sr-only">Close</span>
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
            
            {loadingPrograms ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Spinner size="lg" />
                <p className="mt-4 text-sm text-gray-500">Loading available programs...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Program Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Program *
                  </label>
                  <select
                    value={selectedProgram}
                    onChange={(e) => setSelectedProgram(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={enrolling}
                  >
                    <option value="">-- Select a program --</option>
                    {programs.map(program => (
                      <option key={program.id} value={program.id}>
                        {program.name} {program.code ? `(${program.code})` : ''}
                      </option>
                    ))}
                  </select>
                  {programs.length === 0 && (
                    <p className="mt-2 text-sm text-yellow-600 flex items-center gap-1">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      No active programs available
                    </p>
                  )}
                </div>

                {/* Enrollment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enrollment Date *
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={enrollmentDate}
                      onChange={(e) => setEnrollmentDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={enrolling}
                    />
                  </div>
                </div>

                {/* Error in modal */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEnrollModal(false);
                      setSelectedProgram('');
                      setError('');
                    }}
                    disabled={enrolling}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleEnroll}
                    disabled={enrolling || !selectedProgram || programs.length === 0}
                  >
                    {enrolling ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Enrolling...
                      </>
                    ) : (
                      'Confirm Enrollment'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnrollmentsList;