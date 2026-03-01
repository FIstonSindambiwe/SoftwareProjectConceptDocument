// src/pages/dashboard/participants/ParticipantDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  PhotoIcon,
  DocumentTextIcon,
  ChartBarIcon,
  IdentificationIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  GiftIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import Tabs from '../../../components/common/Tabs';
import ParticipantInfo from '../../../components/participants/ParticipantInfo';
import EnrollmentsList from '../../../components/participants/EnrollmentsList';
import NotesList from '../../../components/participants/NotesList';
import ProgressReport from '../../../components/participants/ProgressReport';
import DropoutModal from '../../../components/participants/DropoutModal';
import ScholarshipModal from '../../../components/participants/ScholarshipModal';
import TemporaryStatusModal from '../../../components/participants/TemporaryStatusModal';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import useAuth from '../../../hooks/useAuth';
import participantService from '../../../services/api/participantService';
import enrollmentService from '../../../services/api/enrollmentService';

// Education levels constant for display
const educationLevels = [
  { value: 'none', label: 'No Formal Education' },
  { value: 'primary', label: 'Primary School' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'vocational', label: 'Vocational Training' },
  { value: 'university', label: 'University' }
];

const ParticipantDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    enrollments: [],
    progress: null,
    faceEncodingStatus: null,
    notes: [],
    dropoutInfo: null,
    scholarshipInfo: null,
    temporaryStatus: null
  });

  // Modal states
  const [showDropoutModal, setShowDropoutModal] = useState(false);
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [showTemporaryModal, setShowTemporaryModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);

  // Check user permissions
  const userRole = user?.role;
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';
  const isProgramManager = userRole === 'program_manager';
  const isDonor = userRole === 'donor';
  
  const canEdit = !isDonor;
  const canManageEnrollments = isAdmin || isProgramManager || isTeacher;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserIcon },
    { id: 'enrollments', label: 'Enrollments', icon: AcademicCapIcon },
    { id: 'notes', label: 'Notes', icon: DocumentTextIcon },
    { id: 'progress', label: 'Progress Report', icon: ChartBarIcon },
  ];

  const fetchParticipantData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First get the participant data
      const participantData = await participantService.getParticipant(id);
      setParticipant(participantData);
      
      // Then fetch related data
      const promises = [
        // Fetch enrollments
        enrollmentService.getEnrollments({ participant: id })
          .catch(err => {
            console.warn('Could not fetch enrollments:', err);
            return { results: [] };
          }),
        
        // Fetch notes
        participantService.getParticipantNotes({ participant: id })
          .catch(err => {
            console.warn('Could not fetch notes:', err);
            return { results: [] };
          })
      ];
      
      // Only fetch face encoding status if photo exists
      if (participantData.photo) {
        promises.push(
          participantService.getFaceEncodingStatus(id)
            .catch(err => {
              console.warn('Could not fetch face encoding status:', err);
              return null;
            })
        );
      } else {
        promises.push(Promise.resolve(null));
      }
      
      // Fetch progress report
      promises.push(
        participantService.getParticipantProgress(id)
          .catch(err => {
            console.warn('Could not fetch progress:', err);
            return null;
          })
      );
      
      const [enrollmentsData, notesData, faceStatus, progressData] = await Promise.all(promises);
      
      // Extract dropout, scholarship, and temporary info from enrollments
      const enrollments = enrollmentsData.results || enrollmentsData || [];
      
      // Find active dropout info
      const dropoutEnrollment = enrollments.find(e => e.has_dropped_out);
      const dropoutInfo = dropoutEnrollment ? {
        enrollmentId: dropoutEnrollment.id,
        programName: dropoutEnrollment.program_name,
        programId: dropoutEnrollment.program,
        dropoutDate: dropoutEnrollment.dropout_date,
        dropoutReason: dropoutEnrollment.dropout_reason,
        dropoutReasonDisplay: dropoutEnrollment.dropout_reason_display,
        dropoutNotes: dropoutEnrollment.dropout_notes
      } : null;
      
      // Find scholarship info
      const scholarshipEnrollment = enrollments.find(e => e.has_scholarship);
      const scholarshipInfo = scholarshipEnrollment ? {
        enrollmentId: scholarshipEnrollment.id,
        programName: scholarshipEnrollment.program_name,
        programId: scholarshipEnrollment.program,
        scholarshipType: scholarshipEnrollment.scholarship_type,
        scholarshipTypeDisplay: scholarshipEnrollment.scholarship_type_display,
        scholarshipAmount: scholarshipEnrollment.scholarship_amount,
        scholarshipProvider: scholarshipEnrollment.scholarship_provider,
        scholarshipDate: scholarshipEnrollment.scholarship_date,
        scholarshipNotes: scholarshipEnrollment.scholarship_notes
      } : null;
      
      // Find temporary status
      const temporaryEnrollment = enrollments.find(e => e.status === 'temporary_leave' || e.temporary_status);
      const temporaryStatus = temporaryEnrollment ? {
        enrollmentId: temporaryEnrollment.id,
        programName: temporaryEnrollment.program_name,
        programId: temporaryEnrollment.program,
        startDate: temporaryEnrollment.temporary_start_date,
        expectedReturnDate: temporaryEnrollment.expected_return_date,
        reason: temporaryEnrollment.temporary_reason,
        notes: temporaryEnrollment.temporary_notes
      } : null;
      
      setStats({
        enrollments,
        notes: notesData.results || notesData || [],
        faceEncodingStatus: faceStatus,
        progress: progressData,
        dropoutInfo,
        scholarshipInfo,
        temporaryStatus
      });
      
    } catch (err) {
      console.error('Error fetching participant data:', err);
      setError(err.message || 'Failed to load participant data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipantData();
  }, [id]);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-dismiss error messages after 10 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleAddNote = async (noteData) => {
    try {
      setError(null);
      await participantService.addParticipantNote(id, noteData);
      setSuccess('Note added successfully');
      fetchParticipantData();
    } catch (err) {
      console.error('Add note error:', err);
      const errorMessage = err.participant?.[0] || err.message || 'Failed to add note';
      setError(errorMessage);
    }
  };

  const handleUploadPhoto = async (formData) => {
    try {
      setError(null);
      await participantService.uploadParticipantPhoto(id, formData);
      setSuccess('Photo uploaded successfully');
      fetchParticipantData();
    } catch (err) {
      setError(err.message || 'Failed to upload photo');
    }
  };

  const handleUpdateFaceEncoding = async () => {
    try {
      setError(null);
      await participantService.updateFaceEncoding(id);
      setSuccess('Face encoding updated successfully');
      fetchParticipantData();
    } catch (err) {
      setError(err.message || 'Failed to update face encoding');
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm(`Are you sure you want to deactivate ${participant?.full_name || 'this participant'}?`)) {
      try {
        setError(null);
        await participantService.deleteParticipant(id);
        setSuccess('Participant deactivated successfully');
        setTimeout(() => navigate('/dashboard/participants'), 1500);
      } catch (err) {
        setError(err.message || 'Failed to deactivate participant');
      }
    }
  };

  const handleActivate = async () => {
    if (window.confirm(`Are you sure you want to reactivate ${participant?.full_name || 'this participant'}?`)) {
      try {
        setError(null);
        await participantService.patchParticipant(id, { is_active: true });
        setSuccess('Participant reactivated successfully');
        fetchParticipantData();
      } catch (err) {
        setError(err.message || 'Failed to reactivate participant');
      }
    }
  };

  const handleDropout = async (enrollmentId, dropoutData) => {
    try {
      setError(null);
      await enrollmentService.markDropout(enrollmentId, dropoutData);
      setSuccess('Dropout recorded successfully');
      setShowDropoutModal(false);
      setSelectedEnrollment(null);
      fetchParticipantData();
    } catch (err) {
      console.error('Dropout error:', err);
      setError(err.message || 'Failed to record dropout');
    }
  };

  const handleAwardScholarship = async (enrollmentId, scholarshipData) => {
    try {
      setError(null);
      await enrollmentService.awardScholarship(enrollmentId, scholarshipData);
      setSuccess('Scholarship awarded successfully');
      setShowScholarshipModal(false);
      setSelectedEnrollment(null);
      fetchParticipantData();
    } catch (err) {
      console.error('Scholarship error:', err);
      setError(err.message || 'Failed to award scholarship');
    }
  };

  const handleTemporaryStatus = async (enrollmentId, tempData) => {
    try {
      setError(null);
      await enrollmentService.setTemporaryStatus(enrollmentId, tempData);
      setSuccess('Temporary status updated successfully');
      setShowTemporaryModal(false);
      setSelectedEnrollment(null);
      fetchParticipantData();
    } catch (err) {
      console.error('Temporary status error:', err);
      setError(err.message || 'Failed to update temporary status');
    }
  };

  // Render status badges
  const renderStatusBadges = () => {
    if (!stats.enrollments || stats.enrollments.length === 0) return null;
    
    const hasDropout = stats.dropoutInfo;
    const hasScholarship = stats.scholarshipInfo;
    const hasTemporary = stats.temporaryStatus;
    
    if (!hasDropout && !hasScholarship && !hasTemporary) return null;
    
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {hasDropout && (
          <Badge color="red" size="md" className="flex items-center gap-1">
            <XCircleIcon className="h-4 w-4" />
            <span>Dropped Out</span>
            <span 
              className="ml-1 text-xs opacity-75 cursor-help" 
              title={stats.dropoutInfo.dropoutReasonDisplay || stats.dropoutInfo.dropoutReason}
            >
              ⓘ
            </span>
          </Badge>
        )}
        
        {hasScholarship && (
          <Badge color="yellow" size="md" className="flex items-center gap-1">
            <GiftIcon className="h-4 w-4" />
            <span>Scholarship</span>
            <span 
              className="ml-1 text-xs opacity-75" 
              title={stats.scholarshipInfo.scholarshipTypeDisplay || stats.scholarshipInfo.scholarshipType}
            >
              ({stats.scholarshipInfo.scholarshipTypeDisplay || stats.scholarshipInfo.scholarshipType})
            </span>
          </Badge>
        )}
        
        {hasTemporary && (
          <Badge color="blue" size="md" className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            <span>Temporary Leave</span>
            <span 
              className="ml-1 text-xs opacity-75" 
              title={`Expected return: ${new Date(stats.temporaryStatus.expectedReturnDate).toLocaleDateString()}`}
            >
              (until {new Date(stats.temporaryStatus.expectedReturnDate).toLocaleDateString()})
            </span>
          </Badge>
        )}
      </div>
    );
  };

  // Render dropout details card
  const renderDropoutDetails = () => {
    if (!stats.dropoutInfo) return null;
    
    return (
      <Card className="mt-4 border-red-200 bg-red-50">
        <div className="p-6">
          <h3 className="text-lg font-medium text-red-900 mb-4 flex items-center">
            <XCircleIcon className="h-5 w-5 mr-2 text-red-600" />
            Dropout Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Program</p>
              <p className="font-medium text-gray-900">{stats.dropoutInfo.programName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dropout Date</p>
              <p className="font-medium text-gray-900">
                {new Date(stats.dropoutInfo.dropoutDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reason</p>
              <p className="font-medium text-gray-900">
                {stats.dropoutInfo.dropoutReasonDisplay || stats.dropoutInfo.dropoutReason}
              </p>
            </div>
            {stats.dropoutInfo.dropoutNotes && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-gray-700 whitespace-pre-wrap">{stats.dropoutInfo.dropoutNotes}</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // Render scholarship details card
  const renderScholarshipDetails = () => {
    if (!stats.scholarshipInfo) return null;
    
    return (
      <Card className="mt-4 border-yellow-200 bg-yellow-50">
        <div className="p-6">
          <h3 className="text-lg font-medium text-yellow-900 mb-4 flex items-center">
            <GiftIcon className="h-5 w-5 mr-2 text-yellow-600" />
            Scholarship Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Program</p>
              <p className="font-medium text-gray-900">{stats.scholarshipInfo.programName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Scholarship Type</p>
              <p className="font-medium text-gray-900">
                {stats.scholarshipInfo.scholarshipTypeDisplay || stats.scholarshipInfo.scholarshipType}
              </p>
            </div>
            {stats.scholarshipInfo.scholarshipAmount && (
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-medium text-gray-900">
                  ${parseFloat(stats.scholarshipInfo.scholarshipAmount).toLocaleString()}
                </p>
              </div>
            )}
            {stats.scholarshipInfo.scholarshipProvider && (
              <div>
                <p className="text-sm text-gray-600">Provider</p>
                <p className="font-medium text-gray-900">{stats.scholarshipInfo.scholarshipProvider}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Award Date</p>
              <p className="font-medium text-gray-900">
                {new Date(stats.scholarshipInfo.scholarshipDate).toLocaleDateString()}
              </p>
            </div>
            {stats.scholarshipInfo.scholarshipNotes && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-gray-700 whitespace-pre-wrap">{stats.scholarshipInfo.scholarshipNotes}</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // Render temporary status details card
  const renderTemporaryDetails = () => {
    if (!stats.temporaryStatus) return null;
    
    const today = new Date();
    const returnDate = new Date(stats.temporaryStatus.expectedReturnDate);
    const daysRemaining = Math.ceil((returnDate - today) / (1000 * 60 * 60 * 24));
    
    return (
      <Card className="mt-4 border-blue-200 bg-blue-50">
        <div className="p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2 text-blue-600" />
            Temporary Leave
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Program</p>
              <p className="font-medium text-gray-900">{stats.temporaryStatus.programName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Leave Start Date</p>
              <p className="font-medium text-gray-900">
                {new Date(stats.temporaryStatus.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expected Return Date</p>
              <p className="font-medium text-gray-900">
                {new Date(stats.temporaryStatus.expectedReturnDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Remaining</p>
              <Badge color={daysRemaining > 7 ? 'green' : daysRemaining > 3 ? 'yellow' : 'red'}>
                {daysRemaining} days
              </Badge>
            </div>
            {stats.temporaryStatus.reason && (
              <div>
                <p className="text-sm text-gray-600">Reason</p>
                <p className="font-medium text-gray-900">{stats.temporaryStatus.reason}</p>
              </div>
            )}
            {stats.temporaryStatus.notes && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-gray-700 whitespace-pre-wrap">{stats.temporaryStatus.notes}</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (loading && !participant) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error && !participant) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/participants')}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Participants
          </Button>
          
          <Card>
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-400" />
              </div>
              <p className="text-red-600 font-medium">Error loading participant data</p>
              <p className="text-gray-600 mt-2">{error}</p>
              <div className="flex justify-center space-x-4 mt-6">
                <Button onClick={fetchParticipantData}>
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/participants')}
                >
                  Return to List
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ErrorBoundary fallback={<div>Something went wrong loading the participant details.</div>}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/participants')}
              className="mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Participants
            </Button>
            
            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                  <p className="text-sm font-medium text-green-800">{success}</p>
                  <button
                    onClick={() => setSuccess('')}
                    className="ml-auto text-green-500 hover:text-green-600"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto text-red-500 hover:text-red-600"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div className="flex-1">
                <div className="flex items-start space-x-4">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0">
                    {participant?.photo ? (
                      <img
                        src={participant.photo}
                        alt={participant.full_name || 'Participant'}
                        className="h-20 w-20 rounded-full object-cover border-4 border-white shadow"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `
                            <div class="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-4 border-white shadow">
                              <svg class="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center border-4 border-white shadow">
                        <UserIcon className="h-10 w-10 text-blue-500" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {participant?.full_name || 'Participant'}
                      </h1>
                      <Badge
                        color={participant?.is_active ? 'green' : 'red'}
                        className="ml-2"
                      >
                        {participant?.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {stats.faceEncodingStatus?.can_use_face_recognition && (
                        <Badge color="blue" variant="outline">
                          <PhotoIcon className="h-4 w-4 mr-1" />
                          Face Recognition Ready
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-lg text-gray-600 mb-2">
                      {participant?.participant_id}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600">
                      <span className="flex items-center text-sm">
                        <UserIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {participant?.age} years • {participant?.gender_display}
                      </span>
                      <span className="flex items-center text-sm">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        Enrolled: {participant?.enrollment_date ? new Date(participant.enrollment_date).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className="flex items-center text-sm">
                        <AcademicCapIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {participant?.active_enrollments_count || 0} active programs
                      </span>
                      {participant?.room_name && (
                        <span className="flex items-center text-sm">
                          <HomeIcon className="h-4 w-4 mr-1 text-gray-400" />
                          Room: {participant.room_name}
                        </span>
                      )}
                      {participant?.education_level && (
                        <span className="flex items-center text-sm">
                          <ShieldCheckIcon className="h-4 w-4 mr-1 text-gray-400" />
                          Education: {educationLevels.find(l => l.value === participant.education_level)?.label || participant.education_level}
                        </span>
                      )}
                    </div>
                    
                    {/* Status Badges */}
                    {renderStatusBadges()}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 lg:self-start">
                {canEdit && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/dashboard/participants/${id}/edit`)}
                    >
                      <PencilIcon className="h-5 w-5 mr-2" />
                      Edit
                    </Button>
                    {participant?.is_active ? (
                      <Button
                        variant="danger"
                        onClick={handleDeactivate}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="success"
                        onClick={handleActivate}
                      >
                        Reactivate
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Details Cards */}
          {renderDropoutDetails()}
          {renderScholarshipDetails()}
          {renderTemporaryDetails()}

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && participant && (
              <ErrorBoundary fallback={<div>Error loading participant info</div>}>
                <ParticipantInfo
                  participant={participant}
                  stats={stats}
                  onUploadPhoto={handleUploadPhoto}
                  onUpdateFaceEncoding={handleUpdateFaceEncoding}
                  user={user}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'enrollments' && (
              <ErrorBoundary fallback={<div>Error loading enrollments</div>}>
                <EnrollmentsList
                  enrollments={stats.enrollments}
                  participantId={participant?.id}
                  user={user}
                  onEnrollmentUpdated={fetchParticipantData}
                  onDropoutClick={(enrollment) => {
                    setSelectedEnrollment(enrollment);
                    setShowDropoutModal(true);
                  }}
                  onScholarshipClick={(enrollment) => {
                    setSelectedEnrollment(enrollment);
                    setShowScholarshipModal(true);
                  }}
                  onTemporaryClick={(enrollment) => {
                    setSelectedEnrollment(enrollment);
                    setShowTemporaryModal(true);
                  }}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'notes' && (
              <ErrorBoundary fallback={<div>Error loading notes</div>}>
                <NotesList
                  participantId={participant?.id}
                  notes={stats.notes}
                  onAddNote={handleAddNote}
                  user={user}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'progress' && (
              <ErrorBoundary fallback={<div>Error loading progress report</div>}>
                <ProgressReport
                  progress={stats.progress}
                  participant={participant}
                  enrollments={stats.enrollments}
                />
              </ErrorBoundary>
            )}
          </div>

          {/* Additional Info Card */}
          {activeTab === 'overview' && participant?.special_needs && (
            <Card className="mt-6">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
                  Special Needs & Accommodations
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {participant.special_needs}
                </p>
              </div>
            </Card>
          )}
        </div>
      </ErrorBoundary>

      {/* Dropout Modal */}
      {showDropoutModal && selectedEnrollment && (
        <DropoutModal
          isOpen={showDropoutModal}
          onClose={() => {
            setShowDropoutModal(false);
            setSelectedEnrollment(null);
          }}
          enrollment={selectedEnrollment}
          participantName={participant?.full_name}
          onSubmit={(data) => handleDropout(selectedEnrollment.id, data)}
        />
      )}

      {/* Scholarship Modal */}
      {showScholarshipModal && selectedEnrollment && (
        <ScholarshipModal
          isOpen={showScholarshipModal}
          onClose={() => {
            setShowScholarshipModal(false);
            setSelectedEnrollment(null);
          }}
          enrollment={selectedEnrollment}
          participantName={participant?.full_name}
          onSubmit={(data) => handleAwardScholarship(selectedEnrollment.id, data)}
        />
      )}

      {/* Temporary Status Modal */}
      {showTemporaryModal && selectedEnrollment && (
        <TemporaryStatusModal
          isOpen={showTemporaryModal}
          onClose={() => {
            setShowTemporaryModal(false);
            setSelectedEnrollment(null);
          }}
          enrollment={selectedEnrollment}
          participantName={participant?.full_name}
          onSubmit={(data) => handleTemporaryStatus(selectedEnrollment.id, data)}
        />
      )}
    </Layout>
  );
};

export default ParticipantDetailPage;