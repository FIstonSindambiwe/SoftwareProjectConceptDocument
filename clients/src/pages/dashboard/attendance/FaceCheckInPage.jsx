import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CameraIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import attendanceService from '../../../services/api/attendanceService';
import programService from '../../../services/api/programService';

const FaceCheckInPage = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  
  const [programs, setPrograms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('idle');
  const [cameraDevices, setCameraDevices] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  
  // New error state categories
  const [errorType, setErrorType] = useState(null); // 'camera', 'recognition', 'validation', 'system'
  
  const [formData, setFormData] = useState({
    program: '',
    date: new Date().toISOString().split('T')[0],
    session_name: ''
  });

  // Check browser compatibility
  const checkBrowserSupport = () => {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    const hasMediaDevices = !!navigator.mediaDevices;
    const hasGetUserMedia = !!navigator.mediaDevices?.getUserMedia;
    
    if (!isSecure) {
      setError('Camera access requires HTTPS (or localhost).');
      setErrorType('camera');
      return false;
    }
    
    if (!hasMediaDevices || !hasGetUserMedia) {
      setError('Your browser does not support camera access. Please use Chrome, Firefox, or Edge.');
      setErrorType('camera');
      return false;
    }
    
    return true;
  };

  // Get available camera devices
  const getCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setCameraDevices(videoDevices);
      console.log('Available cameras:', videoDevices);
      
      if (videoDevices.length === 0) {
        setError('No camera detected on your device.');
        setErrorType('camera');
      }
    } catch (error) {
      console.error('Error enumerating devices:', error);
    }
  };

  // Check camera permissions
  const checkCameraPermissions = async () => {
    try {
      // Check if permission query API is available
      if (navigator.permissions && navigator.permissions.query) {
        const permissions = await navigator.permissions.query({ name: 'camera' });
        console.log('Camera permission state:', permissions.state);
        
        if (permissions.state === 'denied') {
          setError('Camera access denied. Please allow camera access in browser settings.');
          setErrorType('camera');
          return false;
        }
        
        permissions.onchange = () => {
          console.log('Camera permission changed to:', permissions.state);
          if (permissions.state === 'granted') {
            startCamera();
          }
        };
      }
      return true;
    } catch (error) {
      console.error('Permission query error:', error);
      return true; // Fallback to try anyway
    }
  };

  const startCamera = async () => {
    // Reset states
    setError('');
    setErrorType(null);
    setCameraStatus('starting');
    setVideoDimensions({ width: 0, height: 0 });
    
    // Check browser support
    if (!checkBrowserSupport()) {
      setCameraStatus('error');
      return;
    }
    
    try {
      // Check permissions first
      const hasPermission = await checkCameraPermissions();
      if (!hasPermission) {
        setCameraStatus('error');
        return;
      }
      
      // Get available devices
      await getCameraDevices();
      
      if (cameraDevices.length === 0) {
        setError('No camera detected. Please connect a camera and try again.');
        setErrorType('camera');
        setCameraStatus('error');
        return;
      }
      
      // Stop any existing stream first
      stopCamera();
      
      // Try different video constraints - simpler is often better
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      };
      
      console.log('Requesting camera with constraints:', constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Set up event listeners for the video element
        const video = videoRef.current;
        
        const handleLoadedMetadata = () => {
          console.log('Video metadata loaded');
          console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
          console.log('Video readyState:', video.readyState);
          console.log('Video srcObject:', video.srcObject);
          setVideoDimensions({
            width: video.videoWidth,
            height: video.videoHeight
          });
          
          // Check if we actually have video data
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            setCameraStatus('active');
            setCameraActive(true);
            setError('');
            setErrorType(null);
          } else {
            setError('Camera feed appears to be empty. Trying alternative camera...');
            setErrorType('camera');
            tryAlternativeCamera();
          }
        };
        
        const handleCanPlay = () => {
          console.log('Video can play');
          // Try to play the video
          video.play().then(() => {
            console.log('Video playback started');
          }).catch(playError => {
            console.warn('Video play error:', playError);
          });
        };
        
        const handleError = (e) => {
          console.error('Video element error:', e);
          setError('Failed to load camera feed. Please try again.');
          setErrorType('camera');
          setCameraStatus('error');
        };
        
        // Clear previous event listeners
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
        
        // Add new event listeners
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('error', handleError);
        
        // Force load
        video.load();
        
        // Set timeout to check if video loads
        setTimeout(() => {
          if (video.readyState < 1 && cameraStatus === 'starting') {
            console.warn('Video load timeout, readyState:', video.readyState);
            setError('Camera feed taking too long to load. Please try again.');
            setErrorType('camera');
            setCameraStatus('error');
          }
        }, 5000);
      }
      
      setStream(mediaStream);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraStatus('error');
      setErrorType('camera');
      
      let errorMessage = 'Failed to access camera. ';
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera found on your device.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Camera is already in use by another application.';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Camera constraints could not be satisfied.';
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Camera permission denied. Please allow camera access.';
      } else if (err.name === 'TypeError') {
        errorMessage = 'Camera access is not supported in this browser.';
      } else if (err.message?.includes('requested device not found')) {
        errorMessage = 'Camera not found. It may be disconnected.';
      } else {
        errorMessage += err.message || 'Please check your camera settings.';
      }
      
      setError(errorMessage);
    }
  };

  const tryAlternativeCamera = async () => {
    try {
      console.log('Trying alternative camera constraints...');
      
      // Try without any constraints first
      const basicConstraints = { video: true, audio: false };
      const mediaStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        
        setTimeout(() => {
          if (videoRef.current && videoRef.current.videoWidth > 0) {
            setCameraStatus('active');
            setCameraActive(true);
            setError('');
            setErrorType(null);
            console.log('Alternative camera worked!');
          }
        }, 1000);
      }
    } catch (altError) {
      console.error('Alternative camera also failed:', altError);
    }
  };

  const startCameraWithRetry = async (maxRetries = 2) => {
    if (retryCount >= maxRetries) {
      setError('Max retries reached. Please check camera settings and try again.');
      setErrorType('camera');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    await startCamera();
  };

  const stopCamera = () => {
    if (stream) {
      console.log('Stopping camera stream');
      stream.getTracks().forEach(track => {
        console.log('Stopping track:', track.label, track.readyState);
        track.stop();
      });
      setStream(null);
      setCameraActive(false);
      setCameraStatus('idle');
      setVideoDimensions({ width: 0, height: 0 });
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready. Please try again.');
      setErrorType('camera');
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Check if video is ready
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Camera feed not ready. Please wait and try again.');
        setErrorType('camera');
        return;
      }
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Check if image was captured
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const hasData = imageData.data.some(value => value !== 0);
      
      if (!hasData) {
        setError('Failed to capture image. Please try again.');
        setErrorType('camera');
        return;
      }
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob && blob.size > 0) {
          setCapturedImage(blob);
          stopCamera();
          setError('');
          setErrorType(null);
        } else {
          setError('Failed to create image. Please try again.');
          setErrorType('camera');
        }
      }, 'image/jpeg', 0.95);
      
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo. Please try again.');
      setErrorType('camera');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setResult(null);
    setError('');
    setErrorType(null);
    setCameraStatus('idle');
    startCamera();
  };

  const handleSubmit = async () => {
    if (!formData.program || !formData.date) {
      setError('Please select program and date');
      setErrorType('validation');
      return;
    }

    if (!capturedImage) {
      setError('Please capture a photo');
      setErrorType('validation');
      return;
    }

    setLoading(true);
    setError('');
    setErrorType(null);
    setResult(null);

    try {
      // Create FormData
      const submitFormData = attendanceService.createFaceIdentifyFormData({
        program: formData.program,
        date: formData.date,
        session_name: formData.session_name,
        imageFile: capturedImage
      });

      // Identify and record attendance
      const identifyResult = await attendanceService.identifyAndRecordAttendance(submitFormData);
      
      console.log('✅ Identification successful:', identifyResult);
      setResult(identifyResult);
      setErrorType(null);
      
      if (identifyResult.identified) {
        // Auto-clear after 3 seconds and reset
        setTimeout(() => {
          resetForm();
        }, 3000);
      }
    } catch (err) {
      console.error('❌ Error identifying participant:', err);
      
      // Use the enhanced error handling from attendanceService
      const friendlyMessage = attendanceService.getFriendlyErrorMessage(err);
      setError(friendlyMessage);
      setResult(err);
      
      // Set error type based on error flags
      if (err.isNotImplemented) {
        setErrorType('not-implemented');
      } else if (err.isFaceDetectionError) {
        setErrorType('face-detection');
      } else if (err.isNoEncodingsError) {
        setErrorType('no-encodings');
      } else if (err.status === 401 || err.status === 403) {
        setErrorType('permission');
      } else {
        setErrorType('recognition');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCapturedImage(null);
    setResult(null);
    setError('');
    setErrorType(null);
    setCameraStatus('idle');
    setFormData(prev => ({
      ...prev,
      session_name: ''
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Initialize
  useEffect(() => {
    fetchPrograms();
    checkBrowserSupport();
    getCameraDevices();
    
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (formData.program && formData.date) {
      fetchSessions();
    }
  }, [formData.program, formData.date]);

  const fetchPrograms = async () => {
    try {
      const data = await programService.getActivePrograms();
      setPrograms(data.results || data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      setError('Failed to load programs');
      setErrorType('system');
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

  // Badge component
  const Badge = ({ children, variant = 'info', size = 'md', className = '' }) => {
    const variantClasses = {
      info: 'bg-blue-100 text-blue-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };
    
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base'
    };
    
    return (
      <span className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
        {children}
      </span>
    );
  };

  // Error Alert Component with different variants
  const ErrorAlert = ({ type, message, onDismiss }) => {
    const configs = {
      'camera': {
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-400',
        titleColor: 'text-red-800',
        textColor: 'text-red-700',
        title: 'Camera Error',
        tips: [
          'Refresh the page and try again',
          'Check browser permissions (click lock icon in address bar)',
          'Try using Chrome or Firefox if on a different browser',
          'Make sure no other application is using the camera',
          'For laptop users: check if your laptop has a physical camera switch'
        ]
      },
      'not-implemented': {
        icon: InformationCircleIcon,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-400',
        titleColor: 'text-yellow-800',
        textColor: 'text-yellow-700',
        title: 'Feature Not Available',
        tips: [
          'Face recognition is currently being set up',
          'Please use the Bulk Check-in feature for now',
          'Contact your administrator for more information'
        ]
      },
      'face-detection': {
        icon: ExclamationCircleIcon,
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        iconColor: 'text-orange-400',
        titleColor: 'text-orange-800',
        textColor: 'text-orange-700',
        title: 'Face Detection Issue',
        tips: [
          'Ensure your face is clearly visible and well-lit',
          'Face the camera directly',
          'Remove sunglasses, hats, or masks',
          'Only one person should be in the frame',
          'Try improving the lighting in your room'
        ]
      },
      'no-encodings': {
        icon: InformationCircleIcon,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-400',
        titleColor: 'text-blue-800',
        textColor: 'text-blue-700',
        title: 'No Participants Registered',
        tips: [
          'Participants need to be registered with photos first',
          'Go to Participants → Select participant → Upload Photo',
          'Ensure "Enable Face Recognition" is checked',
          'Photo consent must be given for each participant'
        ]
      },
      'recognition': {
        icon: XCircleIcon,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-400',
        titleColor: 'text-red-800',
        textColor: 'text-red-700',
        title: 'Recognition Failed',
        tips: [
          'Ensure the participant has a registered photo',
          'Try taking another photo with better lighting',
          'Make sure the face is clearly visible',
          'The participant may need to re-register their photo'
        ]
      },
      'validation': {
        icon: ExclamationCircleIcon,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-400',
        titleColor: 'text-yellow-800',
        textColor: 'text-yellow-700',
        title: 'Validation Error',
        tips: []
      },
      'permission': {
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-400',
        titleColor: 'text-red-800',
        textColor: 'text-red-700',
        title: 'Permission Error',
        tips: [
          'Please log in if you have been logged out',
          'Contact your administrator if the issue persists'
        ]
      },
      'system': {
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        iconColor: 'text-gray-400',
        titleColor: 'text-gray-800',
        textColor: 'text-gray-700',
        title: 'System Error',
        tips: [
          'Please try again in a few moments',
          'Contact support if the issue persists'
        ]
      }
    };
    
    const config = configs[type] || configs['system'];
    const Icon = config.icon;
    
    return (
      <div className={`p-4 ${config.bgColor} border ${config.borderColor} rounded-md`}>
        <div className="flex">
          <Icon className={`h-5 w-5 ${config.iconColor} mr-3 flex-shrink-0`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${config.titleColor}`}>{config.title}</p>
            <p className={`text-sm ${config.textColor} mt-1`}>{message}</p>
            
            {config.tips.length > 0 && (
              <details className="mt-3">
                <summary className={`cursor-pointer text-xs font-medium ${config.titleColor} hover:opacity-80`}>
                  {type === 'not-implemented' ? 'What to do instead' : type === 'no-encodings' ? 'How to set up' : 'Troubleshooting Steps'}
                </summary>
                <ul className={`mt-2 pl-5 space-y-1 text-xs ${config.textColor} list-disc`}>
                  {config.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </details>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`mt-2 text-xs font-medium ${config.titleColor} hover:opacity-80`}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-bold text-gray-900">Face Recognition Check-in</h1>
            <p className="mt-1 text-sm text-gray-500">
              Use face recognition to identify and record attendance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Camera */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Camera
              </h3>
              {cameraDevices.length > 0 && (
                <Badge variant="info" size="sm">
                  {cameraDevices.length} camera{cameraDevices.length !== 1 ? 's' : ''} detected
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              {/* Camera Status Indicator */}
              {cameraStatus === 'starting' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center">
                  <Spinner size="sm" className="mr-3" />
                  <span className="text-sm text-blue-800">
                    Starting camera... {videoDimensions.width > 0 && 
                      `(${videoDimensions.width}x${videoDimensions.height})`}
                  </span>
                </div>
              )}

              {/* Camera View */}
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                {/* Video Element - ALWAYS render this */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? '' : 'hidden'}`}
                  style={{
                    transform: 'scaleX(-1)', // Mirror for selfie view
                    display: cameraActive ? 'block' : 'none'
                  }}
                />
                
                {capturedImage && (
                  <img
                    src={URL.createObjectURL(capturedImage)}
                    alt="Captured"
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }} // Also mirror captured image
                  />
                )}
                
                {/* Camera Preview (when no video) */}
                {!cameraActive && !capturedImage && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-lg">
                    <CameraIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-gray-400">Camera {cameraStatus === 'error' ? 'Error' : 'Inactive'}</p>
                    {cameraDevices.length === 0 && (
                      <p className="text-sm text-gray-500 mt-2">No camera detected</p>
                    )}
                    {cameraStatus === 'error' && (
                      <Button
                        onClick={() => startCameraWithRetry()}
                        variant="outline"
                        className="mt-4"
                        size="sm"
                      >
                        Try Again
                      </Button>
                    )}
                  </div>
                )}
                
                {/* Debug Overlay */}
                {cameraActive && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded">
                    {videoDimensions.width}x{videoDimensions.height}
                  </div>
                )}

                {/* Camera Status Overlay */}
                {cameraStatus === 'active' && !capturedImage && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="success" size="sm">
                      Live
                    </Badge>
                  </div>
                )}

                {/* Result Overlay */}
                {result && result.identified && (
                  <div className="absolute inset-0 bg-green-600 bg-opacity-90 flex items-center justify-center">
                    <div className="text-center text-white">
                      <CheckCircleIcon className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-2xl font-bold mb-2">Check-in Successful!</p>
                      <p className="text-lg">{result.participant_id}</p>
                      <p className="text-sm mt-2">Confidence: {result.confidence?.toFixed(1)}%</p>
                    </div>
                  </div>
                )}

                {result && !result.identified && errorType !== 'not-implemented' && (
                  <div className="absolute inset-0 bg-red-600 bg-opacity-90 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <XCircleIcon className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-2xl font-bold mb-2">Not Identified</p>
                      <p className="text-sm">{result.message || 'Could not identify participant'}</p>
                      {result.confidence > 0 && (
                        <p className="text-xs mt-2 opacity-90">
                          Closest match: {result.confidence?.toFixed(1)}% confidence
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Error Message Display - Enhanced with different types */}
              {error && errorType && (
                <ErrorAlert 
                  type={errorType} 
                  message={error}
                  onDismiss={errorType === 'validation' ? () => { setError(''); setErrorType(null); } : null}
                />
              )}

              {/* Camera Controls */}
              <div className="flex space-x-3">
                {!cameraActive && !capturedImage && (
                  <Button 
                    onClick={startCamera} 
                    className="flex-1"
                    disabled={cameraStatus === 'starting'}
                  >
                    {cameraStatus === 'starting' ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <CameraIcon className="h-5 w-5 mr-2" />
                        Start Camera
                      </>
                    )}
                  </Button>
                )}

                {cameraActive && (
                  <Button onClick={capturePhoto} className="flex-1">
                    <CameraIcon className="h-5 w-5 mr-2" />
                    Capture Photo
                  </Button>
                )}

                {capturedImage && !result && (
                  <Button onClick={retakePhoto} variant="outline" className="flex-1">
                    Retake Photo
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Right Column - Form */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Session Details
            </h3>

            <div className="space-y-4">
              {/* Program Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program *
                </label>
                <select
                  name="program"
                  value={formData.program}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Session Name */}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                )}
              </div>

              {/* Top Matches */}
              {result && !result.identified && result.top_matches && result.top_matches.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm font-medium text-yellow-800 mb-2">Top matches:</p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {result.top_matches.slice(0, 3).map((match, idx) => (
                      <li key={idx}>
                        {match.participant_id} - {match.confidence?.toFixed(1)}% confidence
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-600 mt-2">
                    None of these matches meet the confidence threshold (60%)
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={loading || !capturedImage || !formData.program}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Identifying...
                  </>
                ) : (
                  <>
                    <UserIcon className="h-5 w-5 mr-2" />
                    Identify & Check In
                  </>
                )}
              </Button>

              {result && result.identified && (
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="w-full"
                >
                  Check In Another Participant
                </Button>
              )}

              {/* Additional Help */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Tips for Best Results:</p>
                    <ul className="mt-1 text-xs text-blue-700 space-y-1 list-disc pl-4">
                      <li>Ensure good lighting on the face</li>
                      <li>Face should be centered and looking at the camera</li>
                      <li>Remove sunglasses or hats that obscure the face</li>
                      <li>Make sure face recognition is enabled for the participant</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Instructions
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>1. Select the program and date for attendance</p>
            <p>2. Click "Start Camera" to activate your webcam</p>
            <p>3. Position the participant's face clearly in the camera view</p>
            <p>4. Click "Capture Photo" when ready</p>
            <p>5. Click "Identify & Check In" to record attendance</p>
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-xs font-medium text-gray-700 mb-1">Important Notes:</p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                <li>Participants must have face recognition enabled and photo consent given</li>
                <li>Camera access requires HTTPS connection (except localhost)</li>
                <li>For best results, use Chrome or Firefox browsers</li>
                <li>Ensure camera permissions are granted in your browser</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-4 border-t">
          <p>© 2026 Youth Empowerment System v1.0.0</p>
          <p className="mt-1">Face recognition check-in system</p>
        </div>
      </div>
    </Layout>
  );
};

export default FaceCheckInPage;