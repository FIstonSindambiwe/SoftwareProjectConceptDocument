import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import attendanceService from '../../../services/api/attendanceService';
import programService from '../../../services/api/programService';
import participantService from '../../../services/api/participantService';

const BulkAttendancePage = () => {
  const navigate = useNavigate();
  
  const [programs, setPrograms] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    program: '',
    date: new Date().toISOString().split('T')[0],
    session_name: ''
  });

  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (formData.program) {
      fetchEnrolledParticipants();
      if (formData.date) {
        fetchSessions();
      }
    }
  }, [formData.program, formData.date]);

  const fetchPrograms = async () => {
    try {
      const data = await programService.getActivePrograms();
      setPrograms(data.results || data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Failed to load programs');
    }
  };

  const fetchEnrolledParticipants = async () => {
    try {
      setLoading(true);
      // Get participants enrolled in the selected program
      const participantsData = await participantService.getParticipants({
        enrolled_program: formData.program,
        is_active: 'true'
      });
      
      const participantsList = participantsData.results || participantsData || [];
      setParticipants(participantsList);
      
      // Initialize attendance records
      const records = participantsList.map(p => ({
        participant_id: p.id,
        participant_pid: p.participant_id,
        participant_name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.participant_id,
        present: false
      }));
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setError('Failed to load enrolled participants');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const data = await attendanceService.getSessions({
        program: formData.program,
        session_date: formData.date,
        is_cancelled: false
      });
      setSessions(data.results || data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePresence = (participantId) => {
    setAttendanceRecords(prev =>
      prev.map(record =>
        record.participant_id === participantId
          ? { ...record, present: !record.present }
          : record
      )
    );
  };

  const markAllPresent = () => {
    setAttendanceRecords(prev =>
      prev.map(record => ({ ...record, present: true }))
    );
  };

  const markAllAbsent = () => {
    setAttendanceRecords(prev =>
      prev.map(record => ({ ...record, present: false }))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.program || !formData.date) {
      setError('Please select program and date');
      return;
    }

    if (attendanceRecords.length === 0) {
      setError('No participants to record');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const recordsToSubmit = attendanceRecords.filter(record => record.present);
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      // Record attendance for each present participant individually
      for (const record of recordsToSubmit) {
        try {
          const attendanceData = {
            participant: record.participant_id,
            program: formData.program,
            date: formData.date,
            present: true,
            verification_method: 'manual',
            notes: 'Bulk attendance recording'
          };

          // Add session info if provided
          if (formData.session_name) {
            attendanceData.session_name = formData.session_name;
          }

          await attendanceService.createAttendanceRecord(attendanceData);
          successCount++;
        } catch (err) {
          errorCount++;
          errors.push({
            participant: record.participant_name,
            error: err.message || 'Failed to record attendance'
          });
          console.error(`Error recording attendance for ${record.participant_name}:`, err);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully recorded attendance for ${successCount} participants`);
      }

      if (errors.length > 0) {
        toast.error(`Failed to record attendance for ${errorCount} participants`);
        console.log('Errors:', errors);
      }

      // Auto-redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/attendance');
      }, 2000);
    } catch (err) {
      console.error('Error in bulk attendance process:', err);
      toast.error('Failed to record attendance');
      setError(err.message || 'Failed to record attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = attendanceRecords.filter(r => r.present).length;
  const absentCount = attendanceRecords.length - presentCount;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/attendance')}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Attendance Recording</h1>
            <p className="mt-1 text-sm text-gray-500">
              Record attendance for multiple participants at once
            </p>
          </div>
        </div>

        {/* Session Details */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Session Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program *
              </label>
              <select
                name="program"
                value={formData.program}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={submitting}
              >
                <option value="">Select Program</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session (Optional)
              </label>
              {sessions.length > 0 ? (
                <select
                  name="session_name"
                  value={formData.session_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={submitting}
                >
                  <option value="">No specific session</option>
                  {sessions.map(session => (
                    <option key={session.id} value={session.session_name}>
                      {session.session_name} ({session.start_time} - {session.end_time})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="session_name"
                  value={formData.session_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Morning Session"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={submitting}
                />
              )}
            </div>
          </div>
        </Card>

        {/* Success/Error Messages */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Attendance List */}
        {formData.program && (
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Participants ({attendanceRecords.length})
              </h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllPresent}
                  disabled={submitting}
                >
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAbsent}
                  disabled={submitting}
                >
                  Mark All Absent
                </Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceRecords.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Present</p>
                <p className="text-2xl font-bold text-green-900">{presentCount}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600">Absent</p>
                <p className="text-2xl font-bold text-red-900">{absentCount}</p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="mt-2 text-gray-500">
                  {formData.program ? 'No enrolled participants found' : 'Select a program to view participants'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {attendanceRecords.map((record, index) => (
                  <div
                    key={record.participant_id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                      record.present
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => togglePresence(record.participant_id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {record.present ? (
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
                        ) : (
                          <XCircleIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {record.participant_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {record.participant_pid}
                        </p>
                      </div>
                    </div>
                    <Badge color={record.present ? 'green' : 'gray'}>
                      {record.present ? 'Present' : 'Absent'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Button */}
            {attendanceRecords.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.program || !formData.date || presentCount === 0}
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Recording Attendance...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Record Attendance ({presentCount} present)
                    </>
                  )}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Instructions
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. Select the program and date for attendance</p>
            <p>2. Optionally select or enter a session name</p>
            <p>3. Click on each participant to toggle their attendance status</p>
            <p>4. Use "Mark All Present" or "Mark All Absent" for quick selection</p>
            <p>5. Click "Record Attendance" to save all records</p>
            <p className="mt-4 text-xs text-gray-500">
              Note: This will create individual attendance records for each marked participant.
              Only enrolled participants in the selected program are displayed.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default BulkAttendancePage;