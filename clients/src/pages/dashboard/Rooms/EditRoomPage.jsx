// src/pages/dashboard/participants/EditRoomPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  HomeIcon,
  UserIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Spinner from '../../../components/common/Spinner';
import Badge from '../../../components/common/Badge';
import useAuth from '../../../hooks/useAuth';
import participantService from '../../../services/api/participantService';
import programService from '../../../services/api/programService';
import userService from '../../../services/api/userService';

const EditRoomPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [programs, setPrograms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [room, setRoom] = useState(null);
  const [selectedTeacherDetails, setSelectedTeacherDetails] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    program: '',
    teacher: '',
    capacity: 30,
    schedule: '',
    description: '',
    is_active: true,
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Helper function to get role display name
  const getRoleDisplay = (role) => {
    const roleNames = {
      admin: 'Admin',
      teacher: 'Teacher',
      program_manager: 'Program Manager',
      donor: 'Donor',
    };
    return roleNames[role] || role;
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 border-red-200',
      teacher: 'bg-blue-100 text-blue-800 border-blue-200',
      program_manager: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      donor: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Check if user has teacher role
  const isTeacher = (user) => {
    return user.role === 'teacher';
  };

  // Get avatar initial
  const getAvatarInitial = (teacher) => {
    if (teacher?.first_name) {
      return teacher.first_name.charAt(0).toUpperCase();
    } else if (teacher?.username) {
      return teacher.username.charAt(0).toUpperCase();
    } else if (teacher?.email) {
      return teacher.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Get display name
  const getDisplayName = (teacher) => {
    if (teacher?.first_name && teacher?.last_name) {
      return `${teacher.first_name} ${teacher.last_name}`;
    }
    if (teacher?.first_name) return teacher.first_name;
    if (teacher?.username) return teacher.username;
    if (teacher?.email) return teacher.email.split('@')[0];
    return 'Unknown User';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  // Update selected teacher details when teacher changes
  useEffect(() => {
    if (formData.teacher) {
      const teacher = teachers.find(t => t.id === parseInt(formData.teacher));
      setSelectedTeacherDetails(teacher || null);
    } else {
      setSelectedTeacherDetails(null);
    }
  }, [formData.teacher, teachers]);

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      setError('');
      
      const [roomData, programsData, usersData] = await Promise.all([
        participantService.getRoom(id),
        programService.getPrograms(),
        userService.getUsers(),
      ]);

      setRoom(roomData);
      setPrograms(programsData.results || programsData);
      
      // Get all users and filter ONLY teachers (role = 'teacher')
      const allUsers = usersData.results || usersData;
      const onlyTeachers = allUsers.filter(isTeacher);
      
      // Sort teachers by name
      const sortedTeachers = onlyTeachers.sort((a, b) => {
        const aName = `${a.first_name} ${a.last_name}`.toLowerCase();
        const bName = `${b.first_name} ${b.last_name}`.toLowerCase();
        return aName.localeCompare(bName);
      });
      
      setTeachers(sortedTeachers);

      // Populate form with existing data
      setFormData({
        name: roomData.name || '',
        program: roomData.program || '',
        teacher: roomData.teacher || '',
        capacity: roomData.capacity || 30,
        schedule: roomData.schedule || '',
        description: roomData.description || '',
        is_active: roomData.is_active !== undefined ? roomData.is_active : true,
        notes: roomData.notes || '',
      });

      console.log('Room loaded:', roomData);
      console.log('Programs loaded:', programsData.results?.length || programsData.length);
      console.log('Teachers loaded (role=teacher):', sortedTeachers.length);
      console.log('Teacher details:', sortedTeachers.map(t => ({ 
        id: t.id, 
        name: `${t.first_name} ${t.last_name}`,
        role: t.role,
        roleDisplay: getRoleDisplay(t.role)
      })));
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load room data. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required';
    }

    if (!formData.program) {
      newErrors.program = 'Program is required';
    }

    if (!formData.capacity || formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    } else if (formData.capacity > 200) {
      newErrors.capacity = 'Capacity cannot exceed 200';
    }

    // Check if capacity is being reduced below current enrollment
    if (room && formData.capacity < room.current_enrollment_count) {
      newErrors.capacity = `Cannot reduce capacity below current enrollment (${room.current_enrollment_count})`;
    }

    // Validate teacher if selected
    if (formData.teacher) {
      const selectedTeacher = teachers.find(t => t.id === parseInt(formData.teacher));
      if (selectedTeacher && selectedTeacher.role !== 'teacher') {
        newErrors.teacher = 'Only users with Teacher role can be assigned';
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
      setLoading(true);
      setError('');
      setSuccess('');

      const payload = {
        name: formData.name.trim(),
        program: parseInt(formData.program),
        capacity: parseInt(formData.capacity),
        is_active: formData.is_active,
      };

      if (formData.teacher) {
        // Double-check teacher role before sending
        const selectedTeacher = teachers.find(t => t.id === parseInt(formData.teacher));
        if (selectedTeacher && selectedTeacher.role !== 'teacher') {
          throw { teacher: 'Only users with Teacher role can be assigned' };
        }
        payload.teacher = parseInt(formData.teacher);
      } else {
        payload.teacher = null;
      }
      
      if (formData.schedule && formData.schedule.trim()) {
        payload.schedule = formData.schedule.trim();
      }
      
      if (formData.description && formData.description.trim()) {
        payload.description = formData.description.trim();
      }
      
      if (formData.notes && formData.notes.trim()) {
        payload.notes = formData.notes.trim();
      }

      await participantService.updateRoom(id, payload);
      
      setSuccess('Room updated successfully! Redirecting...');
      
      setTimeout(() => {
        navigate('/dashboard/participants/rooms');
      }, 1500);
      
    } catch (err) {
      console.error('Error updating room:', err);
      
      let errorMessage = 'Failed to update room';
      
      if (err.teacher) {
        setErrors(prev => ({ ...prev, teacher: err.teacher }));
        errorMessage = err.teacher;
      } else if (err.response?.data) {
        const data = err.response.data;
        if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          // Handle field errors
          Object.entries(data).forEach(([field, messages]) => {
            setErrors(prev => ({ 
              ...prev, 
              [field]: Array.isArray(messages) ? messages[0] : messages 
            }));
          });
          errorMessage = 'Please check the form for errors';
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewParticipants = () => {
    navigate(`/dashboard/participants/rooms/${id}/participants`);
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

  if (!room) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="p-6 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-medium">Room not found</p>
              <Button onClick={() => navigate('/dashboard/participants/rooms')} className="mt-4">
                Back to Rooms
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
            onClick={() => navigate('/dashboard/participants/rooms')}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Rooms
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Room: {room.name}</h1>
              <p className="text-gray-600">Update room information and settings</p>
            </div>
            <Button variant="outline" onClick={handleViewParticipants}>
              <EyeIcon className="h-5 w-5 mr-2" />
              View Participants ({room.current_enrollment_count})
            </Button>
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

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <HomeIcon className="h-5 w-5 mr-2 text-gray-600" />
                    Room Information
                  </h2>

                  <div className="space-y-4">
                    <Input
                      label="Room Name *"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                      placeholder="e.g., Room A"
                      required
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Program *
                        </label>
                        <select
                          name="program"
                          value={formData.program}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                            errors.program ? 'border-red-300' : 'border-gray-300'
                          }`}
                          required
                        >
                          {programs.map((program) => (
                            <option key={program.id} value={program.id}>
                              {program.name}
                            </option>
                          ))}
                        </select>
                        {errors.program && (
                          <p className="mt-1 text-sm text-red-600">{errors.program}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assigned Teacher
                        </label>
                        <select
                          name="teacher"
                          value={formData.teacher}
                          onChange={handleChange}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                            errors.teacher ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="">No teacher assigned</option>
                          {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {getDisplayName(teacher)}
                            </option>
                          ))}
                        </select>
                        {errors.teacher && (
                          <p className="mt-1 text-sm text-red-600">{errors.teacher}</p>
                        )}
                        {teachers.length === 0 && (
                          <p className="mt-1 text-xs text-amber-600">
                            ⚠️ No teachers available. Create users with role 'Teacher' first.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Capacity *"
                        name="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={handleChange}
                        error={errors.capacity}
                        min={room.current_enrollment_count}
                        max="200"
                        required
                        helperText={`Current enrollment: ${room.current_enrollment_count} participant(s)`}
                      />

                      <Input
                        label="Schedule"
                        name="schedule"
                        type="text"
                        value={formData.schedule}
                        onChange={handleChange}
                        placeholder="e.g., Mon-Fri 9AM-12PM"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Status Card */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                        Room Active
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.is_active ? 'Can accept participants' : 'Cannot accept participants'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </Card>

              {/* Selected Teacher Details */}
              {selectedTeacherDetails && (
                <Card className="bg-blue-50 border-blue-200">
                  <div className="p-6">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
                      <UserIcon className="h-4 w-4 mr-2" />
                      Selected Teacher
                    </h3>
                    
                    <div className="flex items-center mb-3">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ring-2 ring-blue-100">
                          <span className="text-white font-semibold text-sm">
                            {getAvatarInitial(selectedTeacherDetails)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {getDisplayName(selectedTeacherDetails)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedTeacherDetails.username || selectedTeacherDetails.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-xs text-gray-600">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full border ${getRoleBadgeColor(selectedTeacherDetails.role)}`}>
                          {getRoleDisplay(selectedTeacherDetails.role)}
                        </span>
                      </div>
                      
                      {selectedTeacherDetails.email && (
                        <div className="flex items-center text-xs text-gray-600">
                          <EnvelopeIcon className="h-3 w-3 mr-2 text-gray-400" />
                          {selectedTeacherDetails.email}
                        </div>
                      )}
                      
                      {selectedTeacherDetails.phone_number && (
                        <div className="flex items-center text-xs text-gray-600">
                          <PhoneIcon className="h-3 w-3 mr-2 text-gray-400" />
                          {selectedTeacherDetails.phone_number}
                        </div>
                      )}
                      
                      {selectedTeacherDetails.date_joined && (
                        <div className="flex items-center text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3 mr-2 text-gray-400" />
                          Joined: {formatDate(selectedTeacherDetails.date_joined)}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              {/* Statistics Card */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Statistics</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Enrollment:</span>
                      <Badge color="blue" size="sm">
                        {room.current_enrollment_count}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Capacity:</span>
                      <Badge color="gray" size="sm">
                        {room.capacity}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Available Spots:</span>
                      <Badge color={room.available_spots > 0 ? "green" : "red"} size="sm">
                        {room.available_spots}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <Badge color={room.is_full ? "red" : "green"} size="sm">
                        {room.is_full ? 'Full' : 'Available'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Teacher Info Card */}
              <Card className="bg-blue-50 border-blue-200">
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="text-sm font-semibold text-blue-900">
                      Teacher Information
                    </h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-700">Available Teachers:</span>
                      <Badge color="blue" size="sm">
                        {teachers.length}
                      </Badge>
                    </div>
                    
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <p className="text-xs text-blue-700 mb-1">Only users with role:</p>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full border bg-blue-100 text-blue-800 border-blue-200`}>
                          Teacher
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Info Card */}
              <Card className="bg-yellow-50 border-yellow-200">
                <div className="p-6">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                        Important Note
                      </h3>
                      <p className="text-xs text-yellow-700">
                        Cannot reduce capacity below current enrollment count. Remove participants first if you need to decrease capacity.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/participants/rooms')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || success}>
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditRoomPage;