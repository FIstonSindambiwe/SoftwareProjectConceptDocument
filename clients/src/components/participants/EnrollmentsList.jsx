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
  ChartBarIcon
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
      enrolled: { color: 'blue', label: 'Enrolled' },
      active: { color: 'green', label: 'Active' },
      completed: { color: 'purple', label: 'Completed' },
      dropped: { color: 'red', label: 'Dropped' },
      transferred: { color: 'yellow', label: 'Transferred' }
    };
    
    const config = statusConfig[status] || { color: 'gray', label: status };
    return <Badge color={config.color}>{config.label}</Badge>;
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

  const columns = [
    {
      key: 'program_name',
      header: 'Program',
      render: (value, enrollment) => (
        <Link
          to={`/dashboard/programs/${enrollment.program}`}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          {value}
        </Link>
      )
    },
    {
      key: 'enrollment_date',
      header: 'Enrolled',
      render: (value) => <span>{new Date(value).toLocaleDateString()}</span>
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
        <div className="flex items-center">
          <ChartBarIcon className="h-4 w-4 mr-2 text-gray-400" />
          <span className={`font-medium ${
            value >= 80 ? 'text-green-600' :
            value >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {value ? value.toFixed(1) : '0.0'}%
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, enrollment) => (
        <div className="flex space-x-2">
          {enrollment.status === 'active' && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleCompleteEnrollment(enrollment.id)}
              disabled={loading[enrollment.id]}
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Complete
            </Button>
          )}
          
          {['enrolled', 'active'].includes(enrollment.status) && (
            <Button
              size="xs"
              variant="danger"
              onClick={() => handleDropoutEnrollment(enrollment.id)}
              disabled={loading[enrollment.id]}
            >
              <XCircleIcon className="h-4 w-4 mr-1" />
              Dropout
            </Button>
          )}
          
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleUpdateAttendance(enrollment.id)}
            disabled={loading[enrollment.id]}
          >
            Update Attendance
          </Button>
        </div>
      )
    }
  ];

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Program Enrollments</h3>
        
        {user.role !== 'donor' && (
          <Button
            onClick={() => setShowEnrollModal(true)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Enroll in New Program
          </Button>
        )}
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {enrollments.length === 0 ? (
        <div className="text-center py-8">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-2 text-gray-500">No program enrollments yet</p>
          {user.role !== 'donor' && (
            <Button
              variant="outline"
              onClick={() => setShowEnrollModal(true)}
              className="mt-4"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Enroll in First Program
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table columns={columns} data={enrollments} />
        </div>
      )}

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enroll in New Program
            </h3>
            
            {loadingPrograms ? (
              <div className="flex justify-center py-8">
                <Spinner size="md" />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={enrolling}
                  >
                    <option value="">-- Select a program --</option>
                    {programs.map(program => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enrollment Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enrollment Date *
                  </label>
                  <input
                    type="date"
                    value={enrollmentDate}
                    onChange={(e) => setEnrollmentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={enrolling}
                  />
                </div>

                {/* Error in modal */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6">
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
                    disabled={enrolling || !selectedProgram}
                  >
                    {enrolling ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Enrolling...
                      </>
                    ) : (
                      'Enroll'
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