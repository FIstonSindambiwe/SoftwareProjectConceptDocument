import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import attendanceService from '../../../services/api/attendanceService';
import programService from '../../../services/api/programService';
import participantService from '../../../services/api/participantService';

const AttendanceEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [programs, setPrograms] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [formData, setFormData] = useState({
    participant: '',
    program: '',
    date: '',
    session_name: '',
    present: true,
    arrival_time: '',
    departure_time: '',
    notes: '',
    verification_method: 'manual'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (formData.program && formData.date) {
      fetchSessions();
    }
  }, [formData.program, formData.date]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [recordData, programsData, participantsData] = await Promise.all([
        attendanceService.getAttendanceRecord(id),
        programService.getPrograms(),
        participantService.getParticipants()
      ]);

      setPrograms(programsData.results || programsData || []);
      setParticipants(participantsData.results || participantsData || []);

      // Populate form with existing data
      setFormData({
        participant: recordData.participant || '',
        program: recordData.program || '',
        date: recordData.date || '',
        session_name: recordData.session_name || '',
        present: recordData.present !== undefined ? recordData.present : true,
        arrival_time: recordData.arrival_time || '',
        departure_time: recordData.departure_time || '',
        notes: recordData.notes || '',
        verification_method: recordData.verification_method || 'manual'
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load attendance record. It may have been deleted.');
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.participant) {
      newErrors.participant = 'Participant is required';
    }
    if (!formData.program) {
      newErrors.program = 'Program is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (formData.arrival_time && !timeRegex.test(formData.arrival_time)) {
      newErrors.arrival_time = 'Invalid time format (use HH:MM)';
    }
    if (formData.departure_time && !timeRegex.test(formData.departure_time)) {
      newErrors.departure_time = 'Invalid time format (use HH:MM)';
    }

    // Validate departure is after arrival
    if (formData.arrival_time && formData.departure_time) {
      const arrival = new Date(`2000-01-01 ${formData.arrival_time}`);
      const departure = new Date(`2000-01-01 ${formData.departure_time}`);
      if (departure <= arrival) {
        newErrors.departure_time = 'Departure time must be after arrival time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setError('Please fix the errors below');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      await attendanceService.updateAttendanceRecord(id, formData);
      
      setSuccessMessage('Attendance record updated successfully!');
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        navigate(`/dashboard/attendance/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating attendance:', error);
      setError(error.message || 'Failed to update attendance record. Please try again.');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/dashboard/attendance/${id}`);
  };

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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Attendance Record</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update attendance information for this record
            </p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckIcon className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
                <p className="text-sm text-green-700 mt-1">Redirecting to record details...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>
            
            <div className="space-y-4">
              {/* Participant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant *
                </label>
                <select
                  name="participant"
                  value={formData.participant}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.participant ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={saving}
                >
                  <option value="">Select Participant</option>
                  {participants.map(participant => (
                    <option key={participant.id} value={participant.id}>
                      {participant.participant_id} - {participant.full_name}
                    </option>
                  ))}
                </select>
                {errors.participant && (
                  <p className="text-sm text-red-600 mt-1">{errors.participant}</p>
                )}
              </div>

              {/* Program */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program *
                </label>
                <select
                  name="program"
                  value={formData.program}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.program ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={saving}
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {errors.program && (
                  <p className="text-sm text-red-600 mt-1">{errors.program}</p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.date ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={saving}
                />
                {errors.date && (
                  <p className="text-sm text-red-600 mt-1">{errors.date}</p>
                )}
              </div>

              {/* Session */}
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
                    disabled={saving}
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
                    disabled={saving}
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Attendance Status */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Attendance Status
            </h2>
            
            <div className="space-y-4">
              {/* Present/Absent */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="present"
                    checked={formData.present}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={saving}
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Mark as Present
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Uncheck if participant was absent
                </p>
              </div>

              {/* Arrival Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arrival Time
                </label>
                <input
                  type="time"
                  name="arrival_time"
                  value={formData.arrival_time}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.arrival_time ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={saving}
                />
                {errors.arrival_time && (
                  <p className="text-sm text-red-600 mt-1">{errors.arrival_time}</p>
                )}
              </div>

              {/* Departure Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Time
                </label>
                <input
                  type="time"
                  name="departure_time"
                  value={formData.departure_time}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.departure_time ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={saving}
                />
                {errors.departure_time && (
                  <p className="text-sm text-red-600 mt-1">{errors.departure_time}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Verification Method */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Verification Method
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Method
                </label>
                <select
                  name="verification_method"
                  value={formData.verification_method}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={saving}
                >
                  <option value="manual">Manual Entry</option>
                  <option value="face_recognition">Face Recognition</option>
                  <option value="qr_code">QR Code Scan</option>
                  <option value="signature">Signature</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Note: Changing the verification method to "Face Recognition" will not automatically verify the participant's face. This field is for record-keeping purposes only.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Additional Notes */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Additional Notes
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                placeholder="Add any additional notes about this attendance record..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional notes about circumstances, late arrival reasons, etc.
              </p>
            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              <XMarkIcon className="h-5 w-5 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AttendanceEditPage;