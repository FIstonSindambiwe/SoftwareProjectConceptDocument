// src/pages/dashboard/attendance/CreateSessionPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  ClockIcon,
  HomeIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import attendanceService from '../../../services/api/attendanceService';
import programService from '../../../services/api/programService';
import roomService from '../../../services/api/roomService';
import useAuth from '../../../hooks/useAuth';

const CreateSessionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const userRole = user?.role;
  const isTeacher = userRole === 'teacher';

  const [programs, setPrograms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  const [formData, setFormData] = useState({
    program: '',
    room: '',
    session_name: '',
    session_date: '',
    start_time: '',
    end_time: '',
    description: '',
  });

  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms();
    fetchRooms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const data = await programService.getPrograms({ page_size: 100 });
      setPrograms(data.results || data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const params = { is_active: true, page_size: 100 };
      // If teacher, only fetch their assigned rooms
      if (isTeacher && user?.id) {
        params.teacher = user.id;
      }
      const data = await roomService.getRooms(params);
      setRooms(data.results || data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setGlobalError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.program) newErrors.program = 'Program is required';
    if (!formData.session_name.trim()) newErrors.session_name = 'Session name is required';
    if (!formData.session_date) newErrors.session_date = 'Date is required';
    if (!formData.start_time) newErrors.start_time = 'Start time is required';
    if (!formData.end_time) newErrors.end_time = 'End time is required';

    if (formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        program: formData.program,
        session_name: formData.session_name.trim(),
        session_date: formData.session_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
      };

      if (formData.room) payload.room = formData.room;
      if (formData.description.trim()) payload.description = formData.description.trim();

      await attendanceService.createSession(payload);

      setSuccess(true);

      // Redirect back to sessions list after short delay
      setTimeout(() => {
        navigate('/dashboard/attendance/sessions');
      }, 1500);

    } catch (error) {
      console.error('Error creating session:', error);

      // Handle field-level errors from backend
      if (error && typeof error === 'object') {
        const fieldErrors = {};
        const knownFields = ['program', 'room', 'session_name', 'session_date', 'start_time', 'end_time', 'description'];

        knownFields.forEach(field => {
          if (error[field]) {
            fieldErrors[field] = Array.isArray(error[field]) ? error[field][0] : error[field];
          }
        });

        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else {
          setGlobalError(
            error.detail || error.message || error.error ||
            'Failed to create session. Please check your inputs and try again.'
          );
        }
      } else {
        setGlobalError('Failed to create session. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full text-center p-8">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Session Created!</h2>
            <p className="text-gray-500 text-sm">Redirecting to sessions list...</p>
            <div className="mt-4">
              <Spinner size="sm" />
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard/attendance/sessions')}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Sessions
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create Session</h1>
          <p className="text-sm text-gray-500 mt-1">
            Schedule a new attendance session for a program
          </p>
        </div>

        {/* Global Error */}
        {globalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{globalError}</p>
          </div>
        )}

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6 p-2">

            {/* Program */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                  Program <span className="text-red-500">*</span>
                </div>
              </label>
              {loadingPrograms ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Spinner size="sm" /> Loading programs...
                </div>
              ) : (
                <select
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
                    ${errors.program ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">Select a program</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
              {errors.program && (
                <p className="mt-1 text-xs text-red-600">{errors.program}</p>
              )}
            </div>

            {/* Room */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <HomeIcon className="h-4 w-4 text-gray-400" />
                  Room <span className="text-gray-400 text-xs font-normal">(optional)</span>
                </div>
              </label>
              {loadingRooms ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Spinner size="sm" /> Loading rooms...
                </div>
              ) : (
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
                    ${errors.room ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                >
                  <option value="">No room assigned</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}
              {errors.room && (
                <p className="mt-1 text-xs text-red-600">{errors.room}</p>
              )}
            </div>

            {/* Session Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="session_name"
                value={formData.session_name}
                onChange={handleChange}
                placeholder="e.g. Morning Class, Week 3 Session"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
                  ${errors.session_name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.session_name && (
                <p className="mt-1 text-xs text-red-600">{errors.session_name}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  Date <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="date"
                name="session_date"
                value={formData.session_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
                  ${errors.session_date ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.session_date && (
                <p className="mt-1 text-xs text-red-600">{errors.session_date}</p>
              )}
            </div>

            {/* Start & End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    Start Time <span className="text-red-500">*</span>
                  </div>
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
                    ${errors.start_time ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.start_time && (
                  <p className="mt-1 text-xs text-red-600">{errors.start_time}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-gray-400" />
                    End Time <span className="text-red-500">*</span>
                  </div>
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
                    ${errors.end_time ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                />
                {errors.end_time && (
                  <p className="mt-1 text-xs text-red-600">{errors.end_time}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                  Description <span className="text-gray-400 text-xs font-normal">(optional)</span>
                </div>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Add any notes or details about this session..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none
                  ${errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/attendance/sessions')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Creating...
                  </div>
                ) : (
                  'Create Session'
                )}
              </Button>
            </div>

          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateSessionPage;