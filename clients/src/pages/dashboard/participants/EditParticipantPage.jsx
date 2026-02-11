import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CameraIcon, 
  TrashIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Spinner from '../../../components/common/Spinner';
import useAuth from '../../../hooks/useAuth';
import participantService from '../../../services/api/participantService';

const EditParticipantPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [participantId, setParticipantId] = useState('');
  
  // Enhanced Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    age: '',
    gender: 'M',
    enrollment_date: '',
    education_level: '',
    special_needs: '',
    notes: '',
    photo_consent_given: false,
    data_sharing_consent: false,
    is_active: true
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

  // Check browser compatibility
  const checkBrowserSupport = () => {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    const hasMediaDevices = !!navigator.mediaDevices;
    const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
    
    if (!isSecure) {
      setCameraError('Camera access requires HTTPS (or localhost).');
      return false;
    }
    
    if (!hasMediaDevices || !hasGetUserMedia) {
      setCameraError('Your browser does not support camera access. Please use Chrome, Firefox, or Edge.');
      return false;
    }
    
    return true;
  };

  // Get available cameras
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      if (videoDevices.length > 0) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
      setCameraError('Failed to detect cameras. Please check your camera connections.');
    }
  };

  // Check camera permissions
  const checkCameraPermissions = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permissions = await navigator.permissions.query({ name: 'camera' });
        
        if (permissions.state === 'denied') {
          setCameraError('Camera access denied. Please allow camera access in browser settings.');
          return false;
        }
        
        permissions.onchange = () => {
          if (permissions.state === 'granted') {
            startCamera();
          }
        };
      }
      return true;
    } catch (error) {
      console.error('Permission query error:', error);
      return true;
    }
  };

  // Start camera with improved handling
  const startCamera = async () => {
    setCameraError('');
    setCameraStatus('starting');
    
    if (!checkBrowserSupport()) {
      setCameraStatus('error');
      return;
    }
    
    const hasPermission = await checkCameraPermissions();
    if (!hasPermission) {
      setCameraStatus('error');
      return;
    }
    
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      
      await getAvailableCameras();
      
      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        const video = videoRef.current;
        
        const handleLoadedMetadata = () => {
          setCameraStatus('active');
          setIsCameraActive(true);
          setCameraError('');
          
          video.play().catch(playError => {
            console.warn('Video play error:', playError);
          });
        };
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('error', () => {
          setCameraError('Failed to load camera feed.');
          setCameraStatus('error');
        });
        
        video.load();
        
        setTimeout(() => {
          if (video.readyState < 1 && cameraStatus === 'starting') {
            setCameraError('Camera feed taking too long to load.');
            setCameraStatus('error');
          }
        }, 5000);
      }
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraStatus('error');
      
      let errorMessage = 'Failed to access camera. ';
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on your device.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera constraints could not be satisfied.';
      } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Camera access is not supported in this browser.';
      } else {
        errorMessage += error.message || 'Please check your camera settings.';
      }
      
      setCameraError(errorMessage);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
      setCameraStatus('idle');
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Take photo from camera
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setCameraError('Camera not ready. Please try again.');
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setCameraError('Camera feed not ready. Please wait and try again.');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) {
          const file = new File([blob], `participant-photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          setPhotoFile(file);
          setPhotoPreview(URL.createObjectURL(blob));
          setFormData(prev => ({ ...prev, photo_consent_given: true }));
          
          stopCamera();
          setShowCamera(false);
          setCameraError('');
        } else {
          setCameraError('Failed to create image. Please try again.');
        }
      }, 'image/jpeg', 0.9);
      
    } catch (err) {
      console.error('Error capturing photo:', err);
      setCameraError('Failed to capture photo. Please try again.');
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    fetchParticipant();
  }, [id]);

  // Initialize cameras when modal opens
  useEffect(() => {
    if (showCamera) {
      getAvailableCameras();
    }
  }, [showCamera]);

  // Handle camera selection change
  useEffect(() => {
    if (isCameraActive && selectedCamera) {
      stopCamera();
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [selectedCamera]);

  const fetchParticipant = async () => {
    try {
      setLoading(true);
      const data = await participantService.getParticipant(id);
      
      // Store participant ID for display
      setParticipantId(data.participant_id);
      
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        age: data.age?.toString() || '',
        gender: data.gender || 'M',
        enrollment_date: data.enrollment_date || '',
        education_level: data.education_level || '',
        special_needs: data.special_needs || '',
        notes: data.notes || '',
        photo_consent_given: data.photo_consent_given || false,
        data_sharing_consent: data.data_sharing_consent || false,
        is_active: data.is_active !== undefined ? data.is_active : true
      });
      
      if (data.photo) {
        setPhotoPreview(data.photo);
      }
      
    } catch (err) {
      console.error('Error fetching participant:', err);
      setFormError(err.message || 'Failed to load participant data');
      setTimeout(() => {
        navigate('/dashboard/participants');
      }, 2000);
    } finally {
      setLoading(false);
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
    
    if (formError) {
      setFormError('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setFormError('Please upload a JPEG or PNG image');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image must be less than 5MB');
        return;
      }
      
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      
      if (!formData.photo_consent_given) {
        setFormData(prev => ({ ...prev, photo_consent_given: true }));
      }
    }
  };

  const handleRemovePhoto = async () => {
    try {
      if (photoPreview && !photoPreview.startsWith('blob:')) {
        await participantService.deleteParticipantPhoto(id);
      }
      
      setPhotoFile(null);
      setPhotoPreview(null);
      setFormData(prev => ({ ...prev, photo_consent_given: false }));
      
      setFormSuccess('Photo removed successfully');
      setTimeout(() => setFormSuccess(''), 3000);
    } catch (error) {
      console.error('Error removing photo:', error);
      setFormError('Failed to remove photo. Please try again.');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
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
    
    if (!formData.enrollment_date) {
      newErrors.enrollment_date = 'Enrollment date is required';
    }
    
    if ((photoFile || photoPreview) && !formData.photo_consent_given) {
      newErrors.photo_consent_given = 'Photo consent is required when a photo is uploaded';
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
    
    setSaving(true);
    setFormError('');
    setFormSuccess('');
    
    try {
      // Update participant data with all required fields
      const updateData = {
        ...formData,
        age: parseInt(formData.age, 10),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim()
      };
      
      await participantService.updateParticipant(id, updateData);
      
      // Upload new photo if provided
      if (photoFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append('photo', photoFile);
          photoFormData.append('photo_consent_given', 'true');
          
          await participantService.uploadParticipantPhoto(id, photoFormData);
          setFormSuccess('Participant updated successfully! Photo uploaded.');
        } catch (photoError) {
          console.warn('Photo upload failed:', photoError);
          setFormSuccess('Participant updated successfully! Photo upload failed, but you can try again later.');
        }
      } else {
        setFormSuccess('Participant updated successfully!');
      }
      
      // Delay navigation slightly to show success message
      setTimeout(() => {
        navigate(`/dashboard/participants/${id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating participant:', err);
      
      let errorMessage = 'Failed to update participant';
      
      if (err.response?.data) {
        const data = err.response.data;
        if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          errorMessage = Object.entries(data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setFormError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Camera preview component
  const CameraPreview = () => {
    if (!isCameraActive) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black rounded-lg">
          <VideoCameraIcon className="h-16 w-16 text-gray-400 mb-4" />
          <p className="text-gray-300">Camera {cameraStatus === 'error' ? 'Error' : 'Inactive'}</p>
          {cameraStatus === 'error' && cameraError && (
            <p className="text-sm text-red-400 mt-2 max-w-md text-center">{cameraError}</p>
          )}
        </div>
      );
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/participants/${id}`)}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Participant
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Participant</h1>
              <p className="text-gray-600">Update participant information</p>
            </div>
            {participantId && (
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Participant ID:</span> {participantId}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Form-level Success Message */}
        {formSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
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

        {/* Form-level Error Message */}
        {formError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
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
                  aria-invalid={!!errors.gender}
                  aria-describedby={errors.gender ? "gender-error" : undefined}
                >
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.gender && (
                  <p id="gender-error" className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>
              
              <Input
                label="Enrollment Date *"
                name="enrollment_date"
                type="date"
                value={formData.enrollment_date}
                onChange={handleChange}
                error={errors.enrollment_date}
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

              {/* Status */}
              <div className="md:col-span-2">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm font-medium text-gray-900">
                      Participant is Active
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    Deactivated participants cannot be enrolled in new programs
                  </p>
                </div>
              </div>

              {/* Photo & Consent Section */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo & Consent</h2>
              </div>
              
              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participant Photo
                  </label>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="relative">
                      {photoPreview ? (
                        <div className="relative">
                          <img
                            src={photoPreview}
                            alt="Participant"
                            className="h-32 w-32 rounded-full object-cover border-4 border-white shadow"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            title="Remove photo"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 w-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300">
                          <CameraIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
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
                            {photoPreview ? 'Change Photo' : 'Upload Photo'}
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
                      {photoPreview && (
                        <p className="text-xs text-green-600">
                          ✓ Photo uploaded. Mirror effect applied for natural selfie view.
                        </p>
                      )}
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
                        Photo Consent Given
                      </label>
                      <p className="text-xs text-gray-500">
                        Guardian consent for photo storage and face recognition
                        {(!photoFile && !photoPreview) && ' (requires a photo to be selected)'}
                      </p>
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
                
                {errors.photo_consent_given && (
                  <p className="text-sm text-red-600">{errors.photo_consent_given}</p>
                )}
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
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any observations or important information..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/participants/${id}`)}
                disabled={saving}
              >
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
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex">
            <IdentificationIcon className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900">Privacy Note</h3>
              <p className="text-sm text-blue-700 mt-1">
                Participant photos and personal data require explicit consent. 
                Removing a photo will delete it from our face recognition system.
                All data is handled according to our privacy policy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
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
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Camera Selection */}
              {availableCameras.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Camera
                  </label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableCameras.map((camera, index) => (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Camera Error Display */}
              {cameraError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">Camera Error</p>
                      <p className="text-sm text-red-700 mt-1">{cameraError}</p>
                      <div className="mt-3">
                        <Button
                          onClick={startCamera}
                          size="sm"
                          variant="outline"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Camera Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    transform: 'scaleX(-1)',
                    display: isCameraActive ? 'block' : 'none'
                  }}
                />
                
                <CameraPreview />
                
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Camera Status */}
              {cameraStatus === 'starting' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-center">
                  <Spinner size="sm" className="mr-3" />
                  <span className="text-sm text-blue-800">Starting camera...</span>
                </div>
              )}

              {/* Camera Controls */}
              <div className="mt-6 flex justify-center space-x-4">
                {!isCameraActive ? (
                  <Button
                    type="button"
                    onClick={startCamera}
                    disabled={cameraStatus === 'starting'}
                  >
                    {cameraStatus === 'starting' ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <VideoCameraIcon className="h-5 w-5 mr-2" />
                        Start Camera
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={stopCamera}
                    >
                      Stop Camera
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

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc pl-4">
                  <li>Make sure the participant is well-lit and facing the camera</li>
                  <li>Position the participant's face in the center of the frame</li>
                  <li>Ensure the face is clearly visible (no hats, sunglasses, etc.)</li>
                  <li>Click "Take Photo" when ready</li>
                  <li>The photo will be mirrored for natural selfie view</li>
                </ul>
              </div>

              {/* Troubleshooting */}
              {cameraError && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Troubleshooting</h4>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc pl-4">
                    <li>Check browser permissions (click lock icon in address bar)</li>
                    <li>Make sure no other app is using the camera</li>
                    <li>Try using Chrome or Firefox if on a different browser</li>
                    <li>Refresh the page and try again</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default EditParticipantPage;