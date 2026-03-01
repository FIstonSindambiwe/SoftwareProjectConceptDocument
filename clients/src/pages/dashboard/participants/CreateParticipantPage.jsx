// src/pages/dashboard/participants/CreateParticipantPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CameraIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Spinner from '../../../components/common/Spinner';
import useAuth from '../../../hooks/useAuth';
import participantService from '../../../services/api/participantService';
import roomService from '../../../services/api/roomService'; // You'll need to create this

const CreateParticipantPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [rooms, setRooms] = useState([]);
  
  // Camera state - simplified
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: '',
    gender: 'M',
    room: '', // Add room field
    enrollment_date: new Date().toISOString().split('T')[0],
    education_level: '',
    special_needs: '',
    notes: '',
    photo_consent_given: false,
    data_sharing_consent: false
  });

  const educationLevels = [
    { value: '', label: 'Select education level' },
    { value: 'none', label: 'No Formal Education' },
    { value: 'primary', label: 'Primary School' },
    { value: 'secondary', label: 'Secondary School' },
    { value: 'vocational', label: 'Vocational Training' },
    { value: 'university', label: 'University' }
  ];

  const genderOptions = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'O', label: 'Other' },
    { value: 'N', label: 'Prefer not to say' }
  ];

  // Fetch available rooms
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const roomsData = await participantService.getRooms({ is_active: true });
      setRooms(roomsData.results || roomsData || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setFormError('Failed to load rooms. Please refresh the page.');
    } finally {
      setRoomsLoading(false);
    }
  };

  // Simplified camera functions
  const startCamera = async () => {
    try {
      setCameraError('');
      
      // Check if browser supports camera
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
      
    } catch (error) {
      console.error('Camera error:', error);
      
      let errorMessage = 'Failed to access camera. ';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on your device.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      } else {
        errorMessage += error.message;
      }
      
      setCameraError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) {
      setCameraError('Camera not ready. Please try again.');
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) {
          const file = new File([blob], `participant-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          
          setPhotoFile(file);
          setPhotoPreview(URL.createObjectURL(blob));
          setFormData(prev => ({ ...prev, photo_consent_given: true }));
          
          // Stop camera and close modal
          stopCamera();
          setShowCamera(false);
          setCameraError('');
        }
      }, 'image/jpeg', 0.9);
      
    } catch (err) {
      console.error('Error taking photo:', err);
      setCameraError('Failed to capture photo. Please try again.');
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear field-specific error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear form error
    if (formError) {
      setFormError('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setFormError('Please upload a JPEG or PNG image');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image must be less than 5MB');
        return;
      }
      
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, photo_consent_given: true }));
      setFormError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.first_name?.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name?.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (formData.age < 5 || formData.age > 25) {
      newErrors.age = 'Age must be between 5 and 25 years';
    }
    
    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (!formData.room) {
      newErrors.room = 'Room assignment is required';
    }
    
    // Validate enrollment date is not in the future
    if (formData.enrollment_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const enrollmentDate = new Date(formData.enrollment_date);
      if (enrollmentDate > today) {
        newErrors.enrollment_date = 'Enrollment date cannot be in the future';
      }
    }
    
    // Consent validation
    if (photoFile && !formData.photo_consent_given) {
      newErrors.photo_consent_given = 'Photo consent is required when uploading a photo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setLoading(true);
    setFormError('');
    setFormSuccess('');
    
    try {
      // Create participant with room assignment
      const participantData = {
        ...formData,
        age: parseInt(formData.age, 10),
        room: parseInt(formData.room, 10),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim()
      };
      
      console.log('Creating participant:', participantData);
      
      const createdParticipant = await participantService.createParticipant(participantData);
      
      if (!createdParticipant?.id) {
        throw new Error('Invalid response from server');
      }
      
      // Upload photo if provided
      if (photoFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append('photo', photoFile);
          
          await participantService.uploadParticipantPhoto(createdParticipant.id, photoFormData);
          setFormSuccess('Participant created successfully! Photo uploaded.');
        } catch (photoError) {
          console.warn('Photo upload failed:', photoError);
          setFormSuccess('Participant created! Photo upload failed - you can upload it later.');
        }
      } else {
        setFormSuccess('Participant created successfully!');
      }
      
      // Navigate after delay
      setTimeout(() => {
        navigate(`/dashboard/participants/${createdParticipant.id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error creating participant:', err);
      
      let errorMessage = 'Failed to create participant';
      
      if (err.response?.data) {
        const data = err.response.data;
        if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          // Handle field errors
          const fieldErrors = Object.entries(data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
          
          if (fieldErrors) {
            errorMessage = fieldErrors;
            
            // Also set field-specific errors
            Object.entries(data).forEach(([field, messages]) => {
              setErrors(prev => ({
                ...prev,
                [field]: Array.isArray(messages) ? messages[0] : messages
              }));
            });
          }
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setFormError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/participants')}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Participants
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900">Add New Participant</h1>
          <p className="text-gray-600">Create a new youth participant record</p>
        </div>

        {/* Success/Error Messages */}
        {formSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{formSuccess}</p>
              </div>
            </div>
          </div>
        )}

        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg animate-fadeIn">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm font-medium text-red-800 whitespace-pre-line">{formError}</p>
            </div>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Basic Information
                </h2>
              </div>
              
              <Input
                label="First Name *"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                error={errors.first_name}
                placeholder="Enter participant's first name"
                required
                autoComplete="given-name"
              />
              
              <Input
                label="Last Name *"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                error={errors.last_name}
                placeholder="Enter participant's last name"
                required
                autoComplete="family-name"
              />
              
              <Input
                label="Age *"
                name="age"
                type="number"
                min="5"
                max="25"
                value={formData.age}
                onChange={handleChange}
                error={errors.age}
                placeholder="5-25"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.gender ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>

              {/* Room Assignment */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Assignment *
                </label>
                <select
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    errors.room ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                  disabled={roomsLoading}
                >
                  <option value="">
                    {roomsLoading ? 'Loading rooms...' : 'Select a room'}
                  </option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id} disabled={room.is_full}>
                      {room.name} - {room.program_name} 
                      ({room.current_enrollment_count}/{room.capacity})
                      {room.is_full && ' (Full)'}
                    </option>
                  ))}
                </select>
                {errors.room && (
                  <p className="mt-1 text-sm text-red-600">{errors.room}</p>
                )}
                {rooms.length === 0 && !roomsLoading && (
                  <p className="mt-2 text-sm text-amber-600">
                    No active rooms available. Please{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard/participants/rooms/create')}
                      className="text-blue-600 hover:underline"
                    >
                      create a room
                    </button>{' '}
                    first.
                  </p>
                )}
              </div>
              
              <Input
                label="Enrollment Date *"
                name="enrollment_date"
                type="date"
                value={formData.enrollment_date}
                onChange={handleChange}
                error={errors.enrollment_date}
                max={new Date().toISOString().split('T')[0]}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education Level
                </label>
                <select
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {educationLevels.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo & Consent Section */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo & Consent</h2>
              </div>
              
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participant Photo (Optional)
                  </label>
                  <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {photoPreview ? (
                      <div className="relative">
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="h-32 w-32 rounded-full object-cover border-4 border-white shadow"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                            setFormData(prev => ({ ...prev, photo_consent_given: false }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          title="Remove photo"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 w-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300">
                        <CameraIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleFileChange}
                            className="hidden"
                            id="photo-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('photo-upload')?.click()}
                          >
                            <PhotoIcon className="h-5 w-5 mr-2" />
                            Upload Photo
                          </Button>
                        </label>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCamera(true)}
                        >
                          <VideoCameraIcon className="h-5 w-5 mr-2" />
                          Take Photo
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        JPEG or PNG, max 5MB. Photo will be used for face recognition attendance.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="photo_consent_given"
                        name="photo_consent_given"
                        checked={formData.photo_consent_given}
                        onChange={handleChange}
                        disabled={!photoFile && !photoPreview}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="photo_consent_given" className="text-sm font-medium text-gray-700">
                        Photo Consent Given *
                      </label>
                      <p className="text-xs text-gray-500">
                        Guardian consent for photo storage and face recognition
                        {(!photoFile && !photoPreview) && ' (requires a photo)'}
                      </p>
                      {errors.photo_consent_given && (
                        <p className="text-xs text-red-600 mt-1">{errors.photo_consent_given}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="data_sharing_consent"
                        name="data_sharing_consent"
                        checked={formData.data_sharing_consent}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="data_sharing_consent" className="text-sm font-medium text-gray-700">
                        Data Sharing Consent
                      </label>
                      <p className="text-xs text-gray-500">
                        Consent for sharing anonymized data with donors and partners
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Needs / Accommodations
                </label>
                <textarea
                  name="special_needs"
                  value={formData.special_needs}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special needs, disabilities, or accommodations required..."
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any initial observations or important information..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/participants')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || roomsLoading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Participant'
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900">Privacy Note</h3>
              <p className="text-sm text-blue-700 mt-1">
                Participant IDs are auto-generated to protect privacy. Photos and personal data 
                require explicit consent. All data is handled according to our privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal - Simplified */}
      {showCamera && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Take Photo</h3>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                  setCameraError('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Camera Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    display: isCameraActive ? 'block' : 'none'
                  }}
                />
                
                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <CameraIcon className="h-16 w-16 text-gray-600" />
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Camera Error */}
              {cameraError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{cameraError}</p>
                </div>
              )}

              {/* Camera Controls */}
              <div className="flex justify-center space-x-4">
                {!isCameraActive ? (
                  <Button
                    type="button"
                    onClick={startCamera}
                  >
                    <VideoCameraIcon className="h-5 w-5 mr-2" />
                    Start Camera
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={stopCamera}
                    >
                      Stop
                    </Button>
                    <Button
                      type="button"
                      onClick={takePhoto}
                    >
                      <CameraIcon className="h-5 w-5 mr-2" />
                      Take Photo
                    </Button>
                  </>
                )}
              </div>

              {/* Simple Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Position face in the center and click "Take Photo" when ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CreateParticipantPage;