import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
  DocumentTextIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import Modal from '../../../components/common/Modal';
import attendanceService from '../../../services/api/attendanceService';
import useAuth from '../../../hooks/useAuth';

const AttendanceDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await attendanceService.getAttendanceRecord(id);
      setRecord(data);
    } catch (error) {
      console.error('Error fetching attendance record:', error);
      setError('Failed to load attendance record. It may have been deleted.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await attendanceService.deleteAttendanceRecord(id);
      navigate('/dashboard/attendance', { 
        state: { message: 'Attendance record deleted successfully' }
      });
    } catch (error) {
      console.error('Error deleting record:', error);
      setError('Failed to delete record. Please try again.');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusBadge = () => {
    if (!record) return null;
    
    return record.present ? (
      <Badge color="green" size="lg">
        <CheckCircleIcon className="h-5 w-5 mr-2" />
        Present
      </Badge>
    ) : (
      <Badge color="red" size="lg">
        <XCircleIcon className="h-5 w-5 mr-2" />
        Absent
      </Badge>
    );
  };

  const getVerificationBadge = () => {
    if (!record) return null;

    if (record.verified_by_face) {
      const quality = attendanceService.getConfidenceLevel(record.confidence_score || 0);
      const confidenceColor = 
        quality === 'Excellent' || quality === 'Good' ? 'green' :
        quality === 'Fair' || quality === 'Acceptable' ? 'yellow' : 'red';
      
      return (
        <Badge color={confidenceColor} size="lg">
          <CameraIcon className="h-5 w-5 mr-2" />
          Face Recognition ({record.confidence_score?.toFixed(1)}%)
        </Badge>
      );
    }

    const methodDisplay = attendanceService.getVerificationMethodDisplay(
      record.verification_method
    );
    
    return (
      <Badge color="gray" size="lg">
        {methodDisplay}
      </Badge>
    );
  };

  const InfoRow = ({ icon: Icon, label, value, valueColor = 'text-gray-900' }) => (
    <div className="flex items-start py-4 border-b border-gray-200 last:border-b-0">
      <div className="flex items-center min-w-[200px]">
        {Icon && <Icon className="h-5 w-5 text-gray-400 mr-3" />}
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <div className={`text-sm ${valueColor} flex-1`}>
        {value || <span className="italic text-gray-400">Not provided</span>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 mt-4">Loading attendance record...</p>
        </div>
      </Layout>
    );
  }

  if (error || !record) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <div className="flex">
              <ExclamationCircleIcon className="h-6 w-6 text-red-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Record</h3>
                <p className="text-sm text-red-700 mt-2">{error || 'Record not found'}</p>
                <Button
                  onClick={() => navigate('/dashboard/attendance')}
                  className="mt-4"
                  variant="outline"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Back to Attendance List
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard/attendance')}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
              {getStatusBadge()}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Record</h1>
            <p className="mt-1 text-sm text-gray-500">
              Record ID: {record.id}
            </p>
          </div>

          {user && user.role !== 'donor' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/dashboard/attendance/${id}/edit`)}
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Main Information Card */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="space-y-0">
            <InfoRow
              icon={UserIcon}
              label="Participant"
              value={
                <div>
                  <div className="font-semibold text-base">{record.participant_id}</div>
                  {record.participant_name && (
                    <div className="text-sm text-gray-600 mt-0.5">{record.participant_name}</div>
                  )}
                </div>
              }
            />

            <InfoRow
              icon={BuildingOfficeIcon}
              label="Program"
              value={
                <div>
                  <div className="font-medium">{record.program_name}</div>
                  {record.program_description && (
                    <div className="text-xs text-gray-500 mt-1">{record.program_description}</div>
                  )}
                </div>
              }
            />

            <InfoRow
              icon={CalendarIcon}
              label="Date"
              value={
                <div className="font-medium">
                  {new Date(record.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              }
            />

            <InfoRow
              icon={DocumentTextIcon}
              label="Session"
              value={record.session_name}
            />

            <InfoRow
              icon={CheckCircleIcon}
              label="Status"
              value={
                <div className="flex items-center">
                  {record.present ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">Present</span>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
                      <span className="font-medium text-red-900">Absent</span>
                    </>
                  )}
                </div>
              }
            />
          </div>
        </Card>

        {/* Time Details Card */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Time Details
          </h2>
          <div className="space-y-0">
            {/* <InfoRow
              icon={ClockIcon}
              label="Arrival Time"
              value={record.arrival_time}
            /> */}
{/* 
            <InfoRow
              icon={ClockIcon}
              label="Departure Time"
              value={record.departure_time}
            /> */}

            {record.arrival_time && record.departure_time && (
              <InfoRow
                icon={ClockIcon}
                label="Duration"
                value={
                  (() => {
                    try {
                      const arrival = new Date(`2000-01-01 ${record.arrival_time}`);
                      const departure = new Date(`2000-01-01 ${record.departure_time}`);
                      const diff = departure - arrival;
                      const hours = Math.floor(diff / 3600000);
                      const minutes = Math.floor((diff % 3600000) / 60000);
                      return `${hours}h ${minutes}m`;
                    } catch {
                      return 'Unable to calculate';
                    }
                  })()
                }
              />
            )}

            <InfoRow
              icon={CalendarIcon}
              label="Recorded At"
              value={
                record.recorded_at ? new Date(record.recorded_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : null
              }
            />

            <InfoRow
              icon={UserIcon}
              label="Recorded By"
              value={record.recorded_by_name || record.recorded_by}
            />
          </div>
        </Card>

        {/* Verification Details Card */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Verification Details
          </h2>
          <div className="space-y-0">
            <InfoRow
              icon={CameraIcon}
              label="Verification Method"
              value={getVerificationBadge()}
            />

            {record.verified_by_face && (
              <>
                <InfoRow
                  label="Face Recognition"
                  value={
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">Verified</span>
                    </div>
                  }
                />

                <InfoRow
                  label="Confidence Score"
                  value={
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              record.confidence_score >= 90 ? 'bg-green-600' :
                              record.confidence_score >= 80 ? 'bg-green-500' :
                              record.confidence_score >= 70 ? 'bg-yellow-500' :
                              record.confidence_score >= 60 ? 'bg-yellow-600' : 'bg-red-500'
                            }`}
                            style={{ width: `${record.confidence_score}%` }}
                          />
                        </div>
                        <span className="font-semibold min-w-[60px]">
                          {record.confidence_score?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Quality: {attendanceService.getConfidenceLevel(record.confidence_score || 0)}
                      </div>
                    </div>
                  }
                />
              </>
            )}

            {record.verification_notes && (
              <InfoRow
                label="Verification Notes"
                value={record.verification_notes}
              />
            )}
          </div>
        </Card>

        {/* Additional Notes Card */}
        {record.notes && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Notes
            </h2>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{record.notes}</p>
            </div>
          </Card>
        )}

        {/* Metadata Card */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Record Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2 text-gray-900">
                {record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Last Updated:</span>
              <span className="ml-2 text-gray-900">
                {record.updated_at ? new Date(record.updated_at).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Record ID:</span>
              <span className="ml-2 text-gray-900 font-mono">{record.id}</span>
            </div>
            {record.verification_method && (
              <div>
                <span className="text-gray-500">Verification Code:</span>
                <span className="ml-2 text-gray-900 font-mono">{record.verification_method}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Attendance Record"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationCircleIcon className="h-6 w-6 text-red-600 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm text-red-800 font-medium">
                  Are you sure you want to delete this attendance record?
                </p>
                <p className="text-sm text-red-700 mt-2">
                  This action cannot be undone. The record for <strong>{record.participant_id}</strong> on{' '}
                  <strong>{new Date(record.date).toLocaleDateString()}</strong> will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Delete Record
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default AttendanceDetailPage;