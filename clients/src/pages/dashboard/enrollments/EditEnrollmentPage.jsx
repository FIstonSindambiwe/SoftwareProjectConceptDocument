// src/pages/dashboard/enrollments/EditEnrollmentPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ClockIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import useAuth from '../../../hooks/useAuth';
import enrollmentService from '../../../services/api/enrollmentService';
import programService from '../../../services/api/programService';
import participantService from '../../../services/api/participantService';

const EditEnrollmentPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [programs, setPrograms] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [enrollment, setEnrollment] = useState(null);

  const [formData, setFormData] = useState({
    participant: '',
    program: '',
    enrollment_date: '',
    expected_completion_date: '',
    status: 'enrolled',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchEnrollmentData();
  }, [id]);

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [enrollmentData, programsData, participantsData] = await Promise.all([
        enrollmentService.getEnrollment(id),
        programService.getPrograms({ is_active: true }),
        participantService.getParticipants({ is_active: 'true' })
      ]);

      setEnrollment(enrollmentData);
      setPrograms(programsData.results || programsData);
      setParticipants(participantsData.results || participantsData);

      // Populate form
      setFormData({
        participant: enrollmentData.participant?.toString() || '',
        program: enrollmentData.program?.toString() || '',
        enrollment_date: enrollmentData.enrollment_date || '',
        expected_completion_date: enrollmentData.expected_completion_date || '',
        status: enrollmentData.status || 'enrolled',
        notes: enrollmentData.notes || ''
      });
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load enrollment data. Please try again.');
    } finally {
      setLoading(false);
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

    // Check if changing participant/program would create duplicate
    if ((formData.participant !== enrollment?.participant?.toString() || 
         formData.program !== enrollment?.program?.toString()) && 
        participants.length > 0) {
      
      const existingEnrollment = participants
        .find(p => p.id === parseInt(formData.participant))
        ?.enrollments?.some(e => e.program === parseInt(formData.program) && e.id !== parseInt(id));

      if (existingEnrollment) {
        newErrors.participant = 'Participant is already enrolled in this program';
      }
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
      setSaving(true);
      setError('');
      setSuccess('');
      setFieldErrors({});

      const payload = {
        participant: parseInt(formData.participant),
        program: parseInt(formData.program),
        enrollment_date: formData.enrollment_date,
        status: formData.status
      };

      if (formData.expected_completion_date) {
        payload.expected_completion_date = formData.expected_completion_date;
      }

      if (formData.notes && formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }

      await enrollmentService.updateEnrollment(id, payload);
      
      setSuccess('Enrollment updated successfully! Redirecting...');
      
      setTimeout(() => {
        navigate(`/dashboard/enrollments/${id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating enrollment:', err);
      
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
          setError('Failed to update enrollment. Please check all fields.');
        }
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = () => {
    if (!enrollment) return null;
    
    if (enrollment.has_dropped_out) {
      return <Badge color="red">Dropped Out</Badge>;
    }
    if (enrollment.has_scholarship) {
      return <Badge color="yellow">Scholarship</Badge>;
    }
    if (enrollment.has_finished) {
      return <Badge color="green">Completed</Badge>;
    }
    return null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!enrollment) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="p-6 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Enrollment not found</p>
              <Button onClick={() => navigate('/dashboard/enrollments')} className="mt-4">
                Back to Enrollments
              </Button>
            </div>
          </Card>
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
            onClick={() => navigate(`/dashboard/enrollments/${id}`)}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Enrollment
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Enrollment</h1>
              <p className="text-gray-600">Update enrollment information</p>
            </div>
            {getStatusBadge()}
          </div>
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

        {/* Read-only warning for special statuses */}
        {(enrollment.has_dropped_out || enrollment.has_finished || enrollment.has_scholarship) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Limited Editing</h4>
                <p className="text-xs text-yellow-800 mt-1">
                  This enrollment has a special status. You can update basic information but 
                  status changes should be made through the appropriate actions (Dropout, 
                  Scholarship, etc.) from the enrollment detail page.
                </p>
              </div>
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
                  disabled={enrollment.has_dropped_out || enrollment.has_finished}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.participant || fieldErrors.participant ? 'border-red-300' : 'border-gray-300'
                  } ${(enrollment.has_dropped_out || enrollment.has_finished) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                  disabled={enrollment.has_dropped_out || enrollment.has_finished}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.program || fieldErrors.program ? 'border-red-300' : 'border-gray-300'
                  } ${(enrollment.has_dropped_out || enrollment.has_finished) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={enrollment.has_dropped_out || enrollment.has_finished || enrollment.has_scholarship}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    (enrollment.has_dropped_out || enrollment.has_finished || enrollment.has_scholarship) ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="enrolled">Enrolled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="dropped">Dropped Out</option>
                  <option value="transferred">Transferred</option>
                  <option value="scholarship">Scholarship</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Status changes may be restricted based on enrollment state
                </p>
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

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/dashboard/enrollments/${id}`)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || success}
                >
                  {saving ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
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

export default EditEnrollmentPage;