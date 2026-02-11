import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon
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
  
  // Get today's date
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    program: '',
    date: today, // Fixed to today's date
    session_name: ''
  });

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [existingAttendance, setExistingAttendance] = useState([]); // Track existing records
  const [checkingExisting, setCheckingExisting] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (formData.program && formData.date) {
      fetchEnrolledParticipants();
      fetchSessions();
      checkExistingAttendance();
    }
  }, [formData.program, formData.date]);

  const fetchPrograms = async () => {
    try {
      const data = await programService.getActivePrograms();
      setPrograms(data.results || data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      const errorMsg = error?.message || error?.error || 'Failed to load programs';
      setError('Unable to load programs. Please check your connection and try again.');
      toast.error(errorMsg);
    }
  };

  const fetchEnrolledParticipants = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // Get participants enrolled in the selected program
      const participantsData = await participantService.getParticipants({
        enrolled_program: formData.program,
        is_active: 'true'
      });
      
      const participantsList = participantsData.results || participantsData || [];
      
      if (participantsList.length === 0) {
        setError('No active participants are enrolled in this program. Please enroll participants first.');
        toast('This program has no enrolled participants', {
          icon: 'ℹ️',
          duration: 4000
        });
      }
      
      setParticipants(participantsList);
      
      // Initialize attendance records
      const records = participantsList.map(p => ({
        participant_id: p.id,
        participant_pid: p.participant_id,
        participant_name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.participant_id,
        present: false,
        hasExistingRecord: false // Will be updated by checkExistingAttendance
      }));
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Error fetching participants:', error);
      const errorMsg = error?.message || error?.error || 'Failed to load participants';
      setError(`Unable to load enrolled participants: ${errorMsg}. Please try again or contact support.`);
      toast.error('Failed to load participants for this program');
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
      // Don't show error for sessions as they're optional
      // Just log it for debugging
      toast('No scheduled sessions found for this date', {
        icon: 'ℹ️',
        duration: 3000
      });
    }
  };

  /**
   * Check for existing attendance records on the selected date
   */
  const checkExistingAttendance = async () => {
    if (!formData.program || !formData.date) return;
    
    try {
      setCheckingExisting(true);
      
      // Fetch existing attendance records for this program and date
      const response = await attendanceService.getAttendanceRecords({
        program_id: formData.program,
        date_from: formData.date,
        date_to: formData.date,
        page_size: 1000 // Get all records for the day
      });
      
      const existingRecords = response.results || response || [];
      setExistingAttendance(existingRecords);
      
      // Update attendance records to mark which participants already have records
      setAttendanceRecords(prev => prev.map(record => {
        const hasRecord = existingRecords.some(
          existing => existing.participant === record.participant_id
        );
        return {
          ...record,
          hasExistingRecord: hasRecord,
          // If they already have a record, mark as present (can't change)
          present: hasRecord ? true : record.present
        };
      }));
      
      // Show appropriate message based on existing records
      if (existingRecords.length > 0) {
        const programName = programs.find(p => p.id === parseInt(formData.program))?.name || 'this program';
        toast(
          `${existingRecords.length} participant${existingRecords.length > 1 ? 's' : ''} already have attendance recorded for ${programName} today`,
          { 
            icon: '⚠️',
            duration: 5000,
            style: {
              background: '#FEF3C7',
              color: '#92400E',
            }
          }
        );
      }
      
    } catch (error) {
      console.error('Error checking existing attendance:', error);
      const errorMsg = error?.message || error?.error || '';
      
      // Don't block the UI, just log the error
      if (error?.status === 404) {
        // No existing records found - this is fine
        console.log('No existing attendance records found');
      } else if (error?.status === 403) {
        toast.error('You do not have permission to view attendance records');
        setError('Permission denied: You cannot view existing attendance records for this program.');
      } else if (error?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        setError('Authentication required. Please refresh the page and log in again.');
      } else {
        toast('Could not check for existing attendance records', {
          icon: '⚠️',
          duration: 4000,
          style: {
            background: '#FEF3C7',
            color: '#92400E',
          }
        });
        console.warn('Error checking existing attendance:', errorMsg);
      }
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent changing date to past or future with detailed message
    if (name === 'date' && value !== today) {
      const selectedDate = new Date(value);
      const todayDate = new Date(today);
      
      let message;
      if (selectedDate < todayDate) {
        message = 'Cannot record attendance for past dates. Attendance must be recorded on the day it occurs.';
      } else if (selectedDate > todayDate) {
        message = 'Cannot record attendance for future dates. Please wait until the actual day to record attendance.';
      } else {
        message = 'Attendance can only be recorded for today\'s date.';
      }
      
      toast.error(message, { duration: 4000 });
      setError(message);
      return;
    }
    
    // Clear error when making valid changes
    if (error) {
      setError('');
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePresence = (participantId) => {
    setAttendanceRecords(prev =>
      prev.map(record => {
        // Don't allow toggling if already has a record
        if (record.participant_id === participantId && !record.hasExistingRecord) {
          return { ...record, present: !record.present };
        }
        return record;
      })
    );
  };

  const markAllPresent = () => {
    setAttendanceRecords(prev =>
      prev.map(record => ({
        ...record,
        // Only mark present if they don't already have a record
        present: record.hasExistingRecord ? true : true
      }))
    );
  };

  const markAllAbsent = () => {
    setAttendanceRecords(prev =>
      prev.map(record => ({
        ...record,
        // Only mark absent if they don't already have a record
        present: record.hasExistingRecord ? true : false
      }))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate date is today
    if (formData.date !== today) {
      const errorMessage = 'Attendance can only be recorded for today. Past and future dates are not allowed.';
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    if (!formData.program) {
      const errorMessage = 'Please select a program before recording attendance.';
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }
    
    if (!formData.date) {
      const errorMessage = 'Date is required for attendance recording.';
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    if (attendanceRecords.length === 0) {
      const errorMessage = 'No participants found. Please ensure the selected program has enrolled participants.';
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    // Filter out participants who already have records
    const recordsToSubmit = attendanceRecords.filter(
      record => record.present && !record.hasExistingRecord
    );

    if (recordsToSubmit.length === 0) {
      const totalPresent = attendanceRecords.filter(r => r.present).length;
      let errorMessage;
      
      if (totalPresent === 0) {
        errorMessage = 'No participants marked as present. Please select at least one participant to record attendance.';
      } else if (alreadyRecordedCount === totalPresent) {
        errorMessage = `All ${totalPresent} selected participant${totalPresent > 1 ? 's' : ''} already have attendance recorded for today. No new records to save.`;
      } else {
        errorMessage = 'No new attendance records to save. All selected participants already have records for today.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
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
          
          // Parse error message for better user feedback
          const errorData = err?.response?.data || err;
          const errorMsg = errorData.message || errorData.error || errorData.detail || err.message || '';
          
          // Categorize errors
          if (errorMsg.includes('already exists') || 
              errorMsg.includes('duplicate') || 
              errorMsg.includes('unique constraint') ||
              err?.status === 409) {
            errors.push({
              participant: record.participant_name,
              type: 'duplicate',
              error: `Attendance already recorded for ${record.participant_name} today`
            });
          } else if (err?.status === 403) {
            errors.push({
              participant: record.participant_name,
              type: 'permission',
              error: `No permission to record attendance for ${record.participant_name}`
            });
          } else if (err?.status === 404) {
            errors.push({
              participant: record.participant_name,
              type: 'not_found',
              error: `Participant ${record.participant_name} not found or program not found`
            });
          } else if (err?.status === 400) {
            errors.push({
              participant: record.participant_name,
              type: 'validation',
              error: `Invalid data for ${record.participant_name}: ${errorMsg}`
            });
          } else if (err?.status === 401) {
            errors.push({
              participant: record.participant_name,
              type: 'auth',
              error: 'Authentication required. Please log in again.'
            });
            // Stop processing if auth error
            break;
          } else {
            errors.push({
              participant: record.participant_name,
              type: 'unknown',
              error: errorMsg || `Failed to record attendance for ${record.participant_name}`
            });
          }
          
          console.error(`Error recording attendance for ${record.participant_name}:`, err);
        }
      }

      // Show appropriate success/error messages
      if (successCount > 0) {
        const successMsg = `Successfully recorded attendance for ${successCount} participant${successCount > 1 ? 's' : ''}`;
        setSuccess(successMsg);
        toast.success(successMsg, { duration: 4000 });
      }

      if (errors.length > 0) {
        // Group errors by type
        const duplicateErrors = errors.filter(e => e.type === 'duplicate');
        const permissionErrors = errors.filter(e => e.type === 'permission');
        const authErrors = errors.filter(e => e.type === 'auth');
        const validationErrors = errors.filter(e => e.type === 'validation');
        const otherErrors = errors.filter(e => !['duplicate', 'permission', 'auth', 'validation'].includes(e.type));
        
        // Show specific messages for each error type
        if (authErrors.length > 0) {
          const authMsg = 'Your session has expired. Please refresh the page and log in again.';
          setError(authMsg);
          toast.error(authMsg, { duration: 6000 });
        } else {
          if (duplicateErrors.length > 0) {
            toast(
              `${duplicateErrors.length} participant${duplicateErrors.length > 1 ? 's' : ''} already had attendance recorded today`,
              { 
                icon: '⚠️',
                duration: 4000,
                style: {
                  background: '#FEF3C7',
                  color: '#92400E',
                }
              }
            );
          }
          
          if (permissionErrors.length > 0) {
            toast.error(
              `Permission denied for ${permissionErrors.length} participant${permissionErrors.length > 1 ? 's' : ''}`,
              { duration: 4000 }
            );
          }
          
          if (validationErrors.length > 0) {
            const validationMsg = validationErrors.length === 1 
              ? validationErrors[0].error 
              : `${validationErrors.length} participants had validation errors`;
            toast.error(validationMsg, { duration: 5000 });
          }
          
          if (otherErrors.length > 0) {
            toast.error(
              `Failed to record attendance for ${otherErrors.length} participant${otherErrors.length > 1 ? 's' : ''}. Please try again.`,
              { duration: 4000 }
            );
          }
        }
        
        // Set detailed error message
        const errorSummary = [
          duplicateErrors.length > 0 && `${duplicateErrors.length} duplicate${duplicateErrors.length > 1 ? 's' : ''}`,
          permissionErrors.length > 0 && `${permissionErrors.length} permission denied`,
          validationErrors.length > 0 && `${validationErrors.length} validation error${validationErrors.length > 1 ? 's' : ''}`,
          otherErrors.length > 0 && `${otherErrors.length} other error${otherErrors.length > 1 ? 's' : ''}`
        ].filter(Boolean).join(', ');
        
        if (errorSummary) {
          setError(`Some records failed: ${errorSummary}. Check the console for details.`);
        }
        
        console.log('Detailed errors:', errors);
      }

      // Refresh existing attendance data
      await checkExistingAttendance();

      // Auto-redirect after 2 seconds if all successful
      if (successCount > 0 && errorCount === 0) {
        setTimeout(() => {
          navigate('/dashboard/attendance', {
            state: { 
              message: `Successfully recorded attendance for ${successCount} participant${successCount > 1 ? 's' : ''}`
            }
          });
        }, 2000);
      } else if (successCount > 0 && errorCount > 0) {
        // Partial success - ask if they want to stay or leave
        setTimeout(() => {
          const shouldNavigate = window.confirm(
            `Recorded ${successCount} successfully, ${errorCount} failed. Do you want to return to the attendance list?`
          );
          if (shouldNavigate) {
            navigate('/dashboard/attendance');
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Error in bulk attendance process:', err);
      
      const errorData = err?.response?.data || err;
      const errorMsg = errorData.message || errorData.error || errorData.detail || err.message || 'An unexpected error occurred';
      
      let userMessage;
      if (err?.status === 500 || err?.status === 502 || err?.status === 503) {
        userMessage = 'Server error: The server is experiencing issues. Please try again later or contact support.';
      } else if (err?.status === 401) {
        userMessage = 'Session expired: Please refresh the page and log in again.';
      } else if (err?.status === 403) {
        userMessage = 'Permission denied: You do not have permission to record attendance.';
      } else if (err?.status === 400) {
        userMessage = `Invalid request: ${errorMsg}. Please check your input and try again.`;
      } else {
        userMessage = `Failed to record attendance: ${errorMsg}`;
      }
      
      toast.error(userMessage, { duration: 6000 });
      setError(userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = attendanceRecords.filter(r => r.present).length;
  const absentCount = attendanceRecords.length - presentCount;
  const alreadyRecordedCount = attendanceRecords.filter(r => r.hasExistingRecord).length;
  const canRecordCount = attendanceRecords.filter(r => r.present && !r.hasExistingRecord).length;

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
              Record attendance for multiple participants at once (today only)
            </p>
          </div>
        </div>

        {/* Date Restriction Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">Attendance Recording Rules</h3>
              <div className="mt-2 text-sm text-blue-800 space-y-1">
                <p>• Attendance can only be recorded for <strong>today's date</strong></p>
                <p>• Each participant can only have <strong>one attendance record per date</strong></p>
                <p>• Past and future dates are not allowed</p>
              </div>
            </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                min={today}
                max={today}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={true}
                title="Attendance can only be recorded for today"
              />
              <p className="mt-1 text-xs text-gray-500">
                Fixed to today's date only
              </p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Existing Attendance Warning */}
        {alreadyRecordedCount > 0 && formData.program && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-900">
                  {alreadyRecordedCount} participant(s) already have attendance recorded
                </h3>
                <p className="mt-1 text-sm text-yellow-800">
                  These participants are marked with a badge and cannot be modified. You can only record attendance for participants without existing records.
                </p>
              </div>
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
                  disabled={submitting || checkingExisting}
                >
                  Mark All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllAbsent}
                  disabled={submitting || checkingExisting}
                >
                  Mark All Absent
                </Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{attendanceRecords.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Present</p>
                <p className="text-2xl font-bold text-green-900">{presentCount}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600">Already Recorded</p>
                <p className="text-2xl font-bold text-yellow-900">{alreadyRecordedCount}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Can Record</p>
                <p className="text-2xl font-bold text-blue-900">{canRecordCount}</p>
              </div>
            </div>

            {(loading || checkingExisting) ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
                <p className="ml-3 text-gray-500">
                  {checkingExisting ? 'Checking existing records...' : 'Loading participants...'}
                </p>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-12">
                <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                {formData.program ? (
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">No Enrolled Participants</p>
                    <p className="text-sm text-gray-500 mb-4">
                      This program has no active participants enrolled. To record attendance, you need to:
                    </p>
                    <div className="text-sm text-gray-600 text-left max-w-md mx-auto bg-gray-50 p-4 rounded-lg">
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Go to the Participants page</li>
                        <li>Create or select a participant</li>
                        <li>Enroll them in this program</li>
                        <li>Return here to record attendance</li>
                      </ol>
                    </div>
                    <Button
                      onClick={() => navigate('/dashboard/participants')}
                      variant="outline"
                      className="mt-4"
                    >
                      Go to Participants
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">Select a Program</p>
                    <p className="text-sm text-gray-500">
                      Choose a program from the dropdown above to view enrolled participants and record attendance.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {attendanceRecords.map((record, index) => (
                  <div
                    key={record.participant_id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
                      record.hasExistingRecord
                        ? 'border-yellow-300 bg-yellow-50 cursor-not-allowed'
                        : record.present
                        ? 'border-green-300 bg-green-50 cursor-pointer hover:bg-green-100'
                        : 'border-gray-200 bg-white hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => !record.hasExistingRecord && togglePresence(record.participant_id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {record.present ? (
                          <CheckCircleIcon className={`h-6 w-6 ${
                            record.hasExistingRecord ? 'text-yellow-600' : 'text-green-600'
                          }`} />
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
                    <div className="flex items-center gap-2">
                      {record.hasExistingRecord ? (
                        <>
                          <Badge color="yellow" className="flex items-center gap-1">
                            <CheckCircleIcon className="h-3 w-3" />
                            Already Recorded
                          </Badge>
                        </>
                      ) : (
                        <Badge color={record.present ? 'green' : 'gray'}>
                          {record.present ? 'Present' : 'Absent'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Submit Button */}
            {attendanceRecords.length > 0 && (
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.program || !formData.date || canRecordCount === 0 || checkingExisting}
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
                      Record Attendance ({canRecordCount} new)
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
            <p>1. Select the program for attendance recording</p>
            <p>2. Date is automatically set to today (cannot be changed)</p>
            <p>3. Optionally select or enter a session name</p>
            <p>4. Click on each participant to toggle their attendance status</p>
            <p>5. Use "Mark All Present" or "Mark All Absent" for quick selection</p>
            <p>6. Participants with existing records are marked in yellow and cannot be modified</p>
            <p>7. Click "Record Attendance" to save new records only</p>
            <p className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <strong>Important:</strong> Attendance can only be recorded once per participant per date. 
              You cannot record attendance for past or future dates. Only enrolled participants in the selected program are displayed.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default BulkAttendancePage;