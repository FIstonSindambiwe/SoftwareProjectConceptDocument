import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  CameraIcon,
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Spinner from '../../../components/common/Spinner';
import useAuth from '../../../hooks/useAuth';
import participantService from '../../../services/api/participantService';

const CreateParticipantPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [availableCameras, setAvailableCameras] = useState([]);
  
  const [formData, setFormData] = useState({
    age: '',
    gender: 'M',
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

  // Get available cameras
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCamera(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error getting cameras:', error);
      }
    };
    
    getCameras();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraStream(stream);
      setIsCameraActive(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setFormError('Cannot access camera. Please check permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Take photo from camera
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        // Create file from blob
        const file = new File([blob], `participant-photo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        // Set photo file and preview
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(blob));
        
        // Auto-check photo consent
        setFormData(prev => ({ ...prev, photo_consent_given: true }));
        
        // Stop camera and close modal
        stopCamera();
        setShowCamera(false);
      }
    }, 'image/jpeg', 0.9); // 90% quality
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
      
      // Auto-check photo consent if uploading photo
      setFormData(prev => ({ ...prev, photo_consent_given: true }));
      
      // Clear any errors
      setFormError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.age) newErrors.age = 'Age is required';
    if (formData.age && (formData.age < 5 || formData.age > 25)) {
      newErrors.age = 'Age must be between 5 and 25 years';
    }
    
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.enrollment_date) newErrors.enrollment_date = 'Enrollment date is required';
    
    if (photoFile && !formData.photo_consent_given) {
      newErrors.photo_consent_given = 'Photo consent is required when uploading a photo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setFormError('');
    setFormSuccess('');
    
    try {
      // First, create the participant
      const participantData = {
        ...formData,
        age: parseInt(formData.age)
      };
      
      console.log('Creating participant with data:', participantData);
      
      const createdParticipant = await participantService.createParticipant(participantData);
      
      console.log('Participant created successfully:', createdParticipant);
      
      if (!createdParticipant || !createdParticipant.id) {
        throw new Error('Invalid response from server. No participant ID received.');
      }
      
      // Upload photo if provided
      if (photoFile) {
        try {
          const photoFormData = new FormData();
          photoFormData.append('photo', photoFile);
          photoFormData.append('photo_consent_given', 'true');
          
          console.log('Uploading photo for participant:', createdParticipant.id);
          
          await participantService.uploadParticipantPhoto(createdParticipant.id, photoFormData);
          console.log('Photo uploaded successfully');
        } catch (photoError) {
          console.warn('Photo upload failed:', photoError);
          // Continue anyway - participant was created
          setFormSuccess('Participant created successfully! Photo upload failed, but you can upload it later from the participant details page.');
        }
      }
      
      if (!formSuccess) {
        setFormSuccess('Participant created successfully!');
      }
      
      // Delay navigation slightly to show success message
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
          errorMessage = Object.entries(data)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
            .join('\n');
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
      <div className="max-w-4xl mx-auto">
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
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{formError}</p>
              </div>
            </div>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              </div>
              
              <Input
                label="Age *"
                name="age"
                type="number"
                min="5"
                max="25"
                value={formData.age}
                onChange={handleChange}
                error={errors.age}
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

              {/* Photo Upload */}
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo & Consent</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participant Photo (Optional)
                  </label>
                  <div className="mt-1 flex items-center">
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
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          title="Remove photo"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32 w-32 rounded-full bg-gray-100">
                        <CameraIcon className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="ml-4 space-y-2">
                      <div className="flex space-x-2">
                        {/* Upload from file */}
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                            id="photo-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('photo-upload').click()}
                          >
                            <PhotoIcon className="h-5 w-5 mr-2" />
                            Upload Photo
                          </Button>
                        </label>
                        
                        {/* Take photo with camera */}
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
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="photo_consent_given"
                      name="photo_consent_given"
                      checked={formData.photo_consent_given}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="photo_consent_given" className="ml-2 block text-sm text-gray-900">
                      Photo Consent Given
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    Guardian consent for photo storage and face recognition
                  </p>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="data_sharing_consent"
                      name="data_sharing_consent"
                      checked={formData.data_sharing_consent}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="data_sharing_consent" className="ml-2 block text-sm text-gray-900">
                      Data Sharing Consent
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">
                    Consent for sharing anonymized data with donors and partners
                  </p>
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
                disabled={loading}
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
          <h3 className="font-medium text-blue-900">Privacy Note</h3>
          <p className="text-sm text-blue-700 mt-1">
            Participant IDs are auto-generated to protect privacy. Photos and personal data 
            require explicit consent. All data is handled according to our privacy policy.
          </p>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Take Photo</h3>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
                className="text-gray-400 hover:text-gray-500"
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
                    onChange={(e) => {
                      setSelectedCamera(e.target.value);
                      stopCamera();
                      startCamera();
                    }}
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

              {/* Camera Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                {!isCameraActive ? (
                  <div className="aspect-video flex items-center justify-center">
                    <div className="text-center">
                      <VideoCameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-300">Camera not active</p>
                    </div>
                  </div>
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full aspect-video object-cover"
                  />
                )}
                
                {/* Hidden canvas for capturing photo */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Camera Controls */}
              <div className="mt-6 flex justify-center space-x-4">
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
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Make sure the participant is well-lit and facing the camera</li>
                  <li>• Position the participant's face in the center of the frame</li>
                  <li>• Ensure the face is clearly visible (no hats, sunglasses, etc.)</li>
                  <li>• Click "Take Photo" when ready</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CreateParticipantPage;