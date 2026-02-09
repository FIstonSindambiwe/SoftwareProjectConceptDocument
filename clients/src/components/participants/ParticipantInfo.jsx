import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Alert from '../common/Alert';
import Spinner from '../common/Spinner';
import {
  UserIcon,
  CalendarIcon,
  AcademicCapIcon,
  PhotoIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const ParticipantInfo = ({ participant, stats, onUploadPhoto, onUpdateFaceEncoding, user }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        Alert.error('Please upload a JPEG or PNG image');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        Alert.error('Image must be less than 5MB');
        return;
      }
      
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('photo_consent_given', 'true');
        
        await onUploadPhoto(formData);
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Participant Info Card */}
      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photo Section */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative mb-4">
              {participant.photo ? (
                <img
                  src={participant.photo}
                  alt={participant.participant_id}
                  className="h-48 w-48 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-48 w-48 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserIcon className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>
            
            {user.role !== 'donor' && (
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="photo-upload-detail"
                />
                <label htmlFor="photo-upload-detail">
                  <Button
                    variant="outline"
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <PhotoIcon className="h-5 w-5 mr-2" />
                        {participant.photo ? 'Change Photo' : 'Upload Photo'}
                      </>
                    )}
                  </Button>
                </label>
                
                {stats.faceEncodingStatus?.has_photo && !stats.faceEncodingStatus?.has_encoding && (
                  <Button
                    variant="outline"
                    onClick={onUpdateFaceEncoding}
                    className="w-full"
                  >
                    <PhotoIcon className="h-5 w-5 mr-2" />
                    Generate Face Encoding
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Participant ID</p>
                <p className="text-lg font-semibold text-gray-900">{participant.participant_id}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Age</p>
                <p className="text-lg font-semibold text-gray-900">{participant.age} years</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Gender</p>
                <p className="text-lg font-semibold text-gray-900">{participant.gender_display}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Enrollment Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(participant.enrollment_date).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Education Level</p>
                <p className="text-lg font-semibold text-gray-900">
                  {participant.education_level_display || 'Not specified'}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <Badge color={participant.is_active ? 'green' : 'red'}>
                  {participant.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {/* Special Needs */}
            {participant.special_needs && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Special Needs</p>
                <p className="text-gray-900 mt-1">{participant.special_needs}</p>
              </div>
            )}
            
            {/* Notes */}
            {participant.notes && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="text-gray-900 mt-1">{participant.notes}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Consent & Face Recognition Status */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Consent & Face Recognition</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Consent Status */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Consent Status</h4>
            
            <div className="space-y-3">
              <div className="flex items-center">
                {participant.photo_consent_given ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Photo Consent</p>
                  <p className="text-xs text-gray-500">
                    {participant.photo_consent_given 
                      ? 'Guardian consent given for photo storage and face recognition'
                      : 'Photo consent not yet given'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                {participant.data_sharing_consent ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">Data Sharing Consent</p>
                  <p className="text-xs text-gray-500">
                    {participant.data_sharing_consent
                      ? 'Consent given for sharing anonymized data'
                      : 'Data sharing consent not yet given'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Face Recognition Status */}
          {stats.faceEncodingStatus && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Face Recognition Status</h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  {stats.faceEncodingStatus.has_photo ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">Photo Uploaded</p>
                    <p className="text-xs text-gray-500">
                      {stats.faceEncodingStatus.has_photo 
                        ? 'Participant photo is available'
                        : 'No photo uploaded yet'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {stats.faceEncodingStatus.has_encoding ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">Face Encoding</p>
                    <p className="text-xs text-gray-500">
                      {stats.faceEncodingStatus.has_encoding
                        ? `Encoding generated on ${new Date(stats.faceEncodingStatus.encoding_date).toLocaleDateString()}`
                        : 'Face encoding not generated'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  {stats.faceEncodingStatus.can_use_face_recognition ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <Badge color="green">Ready</Badge>
                    </>
                  ) : (
                    <>
                      <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                      <Badge color="red">Not Ready</Badge>
                    </>
                  )}
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-900">Face Recognition</p>
                    <p className="text-xs text-gray-500">
                      {stats.faceEncodingStatus.can_use_face_recognition
                        ? 'Can use face recognition attendance'
                        : 'Cannot use face recognition attendance'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      {stats.progress && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Overview</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Total Programs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.progress.total_programs}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.progress.completed_programs}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-bold text-blue-600">{stats.progress.active_programs}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Avg Attendance</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.progress.average_attendance.toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ParticipantInfo;