import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Alert from '../common/Alert';
import Table from '../common/Table';
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
  const [programs, setPrograms] = useState([]);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

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

  const handleCompleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('Mark this enrollment as completed?')) return;
    
    setLoading(prev => ({ ...prev, [enrollmentId]: true }));
    
    try {
      await participantService.completeEnrollment(enrollmentId);
      Alert.success('Enrollment marked as completed');
      onEnrollmentUpdated();
    } catch (err) {
      Alert.error(err.message || 'Failed to complete enrollment');
    } finally {
      setLoading(prev => ({ ...prev, [enrollmentId]: false }));
    }
  };

  const handleDropoutEnrollment = async (enrollmentId) => {
    const reason = window.prompt('Please enter the reason for dropout:');
    if (reason === null) return;
    
    setLoading(prev => ({ ...prev, [enrollmentId]: true }));
    
    try {
      await participantService.dropoutEnrollment(enrollmentId, reason);
      Alert.success('Participant marked as dropped out');
      onEnrollmentUpdated();
    } catch (err) {
      Alert.error(err.message || 'Failed to mark as dropout');
    } finally {
      setLoading(prev => ({ ...prev, [enrollmentId]: false }));
    }
  };

  const handleUpdateAttendance = async (enrollmentId) => {
    setLoading(prev => ({ ...prev, [enrollmentId]: true }));
    
    try {
      await participantService.updateEnrollmentAttendance(enrollmentId);
      Alert.success('Attendance rate updated');
      onEnrollmentUpdated();
    } catch (err) {
      Alert.error(err.message || 'Failed to update attendance');
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
      render: (value) => new Date(value).toLocaleDateString()
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
            {value.toFixed(1)}%
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

      {/* Enrollment Modal (simplified - you'd need to build this) */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Enroll in New Program
            </h3>
            <p className="text-gray-600 mb-4">
              This feature would allow you to select a program and enroll the participant.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowEnrollModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setShowEnrollModal(false)}>
                Enroll
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnrollmentsList;