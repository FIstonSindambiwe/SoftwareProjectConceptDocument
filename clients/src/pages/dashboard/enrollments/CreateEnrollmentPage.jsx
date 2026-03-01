// src/pages/dashboard/enrollments/CreateEnrollmentPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Spinner from '../../../components/common/Spinner';
import useAuth from '../../../hooks/useAuth';
import enrollmentService from '../../../services/api/enrollmentService';
import programService from '../../../services/api/programService';
import participantService from '../../../services/api/participantService';

const CreateEnrollmentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [programs, setPrograms] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    participant: '',
    program: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    expected_completion_date: '',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      setError('');
      
      const [programsData, participantsData] = await Promise.all([
        programService.getPrograms({ is_active: true }),
        participantService.getParticipants({ is_active: 'true' })
      ]);

      setPrograms(programsData.results || programsData);
      setParticipants(participantsData.results || participantsData);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load programs and participants. Please try refreshing the page.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) {
      setError('');
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

    if (!formData.enrollment_date) {
      newErrors.enrollment_date = 'Enrollment date is required';
    }

    // Check if participant already enrolled in this program
    const existingEnrollment = participants.find(p => p.id === parseInt(formData.participant))?.enrollments?.some(
      e => e.program === parseInt(formData.program)
    );

    if (existingEnrollment) {
      newErrors.participant = 'Participant is already enrolled in this program';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setFieldErrors({});

      const payload = {
        participant: parseInt(formData.participant),
        program: parseInt(formData.program),
        enrollment_date: formData.enrollment_date,
        status: 'enrolled'
      };

      if (formData.expected_completion_date) {
        payload.expected_completion_date = formData.expected_completion_date;
      }

      if (formData.notes && formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }

      await enrollmentService.createEnrollment(payload);
      
      setSuccess('Enrollment created successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/dashboard/enrollments');
      }, 1500);
      
    } catch (err) {
      console.error('Error creating enrollment:', err);
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        if (typeof errorData === 'object') {
          Object.entries(errorData).forEach(([field, messages]) => {
            setFieldErrors(prev => ({ 
              ...prev, 
              [field]: Array.isArray(messages) ? messages[0] : messages 
            }));
          });
        } else if (errorData.detail) {
          setError(errorData.detail);
        } else if (errorData.message) {
          setError(errorData.message);
        } else {
          setError('Failed to create enrollment. Please check all fields.');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/enrollments')}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Enrollments
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900">Create New Enrollment</h1>
          <p className="text-gray-600">Enroll a participant in a program</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm font-medium text-red-800 whitespace-pre-line">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <div className="p-6 space-y-6">
              {/* Participant Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant *
                </label>
                <select
                  name="participant"
                  value={formData.participant}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.participant || fieldErrors.participant ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select a participant</option>
                  {participants.map(participant => (
                    <option key={participant.id} value={participant.id}>
                      {participant.full_name || `${participant.first_name} ${participant.last_name}`} ({participant.participant_id})
                    </option>
                  ))}
                </select>
                {(errors.participant || fieldErrors.participant) && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.participant || fieldErrors.participant}
                  </p>
                )}
                {participants.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    ⚠️ No active participants available. Create a participant first.
                  </p>
                )}
              </div>

              {/* Program Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program *
                </label>
                <select
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.program || fieldErrors.program ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select a program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {(errors.program || fieldErrors.program) && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.program || fieldErrors.program}
                  </p>
                )}
                {programs.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    ⚠️ No active programs available. Create a program first.
                  </p>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Enrollment Date *"
                  name="enrollment_date"
                  type="date"
                  value={formData.enrollment_date}
                  onChange={handleChange}
                  error={errors.enrollment_date || fieldErrors.enrollment_date}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />

                <Input
                  label="Expected Completion Date"
                  name="expected_completion_date"
                  type="date"
                  value={formData.expected_completion_date}
                  onChange={handleChange}
                  error={fieldErrors.expected_completion_date}
                  min={formData.enrollment_date}
                  helperText="Optional: When the participant is expected to complete"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    fieldErrors.notes ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Any additional notes about this enrollment..."
                />
                {fieldErrors.notes && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.notes}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">About Enrollments</h4>
                    <p className="text-xs text-blue-800 mt-1">
                      Enrolling a participant in a program allows you to track their attendance, 
                      progress, and outcomes. Each participant can be enrolled in multiple programs.
                      The enrollment status will be set to "Enrolled" initially.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/enrollments')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || success}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Enrollment'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </Layout>
  );
};

export default CreateEnrollmentPage;