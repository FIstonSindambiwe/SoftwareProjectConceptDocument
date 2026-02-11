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
  EnvelopeIcon,
  PhoneIcon,
  HomeIcon,
  ShieldCheckIcon
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
import useAuth from '../../../hooks/useAuth';
import participantService from '../../../services/api/participantService';

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
    notes: []
  });

  const fetchParticipantData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [participantData, enrollmentsData, progressData, faceStatus, notesData] = await Promise.all([
        participantService.getParticipant(id),
        participantService.getParticipantEnrollments(id),
        participantService.getParticipantProgress(id).catch(() => null),
        participantService.getFaceEncodingStatus(id).catch(() => null),
        participantService.getParticipantNotes({ participant: id }).catch(() => ({ results: [] }))
      ]);
      
      setParticipant(participantData);
      setStats({
        enrollments: enrollmentsData.results || enrollmentsData || [],
        progress: progressData,
        faceEncodingStatus: faceStatus,
        notes: notesData.results || notesData || []
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
        await participantService.updateParticipant(id, { is_active: true });
        setSuccess('Participant reactivated successfully');
        fetchParticipantData();
      } catch (err) {
        setError(err.message || 'Failed to reactivate participant');
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserIcon },
    { id: 'enrollments', label: 'Enrollments', icon: AcademicCapIcon },
    { id: 'notes', label: 'Notes', icon: DocumentTextIcon },
    { id: 'progress', label: 'Progress Report', icon: ChartBarIcon },
  ];

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
                <IdentificationIcon className="h-12 w-12 text-red-400" />
              </div>
              <p className="text-red-600 font-medium">Error loading participant data</p>
              <p className="text-gray-600 mt-2">{error}</p>
              <Button
                onClick={() => navigate('/dashboard/participants')}
                className="mt-4"
              >
                Return to Participants List
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setSuccess('')}
                    className="text-green-500 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-lg"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-lg"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
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
                      alt={participant.full_name}
                      className="h-20 w-20 rounded-full object-cover border-4 border-white shadow"
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
                    {participant?.education_level && (
                      <span className="flex items-center text-sm">
                        <ShieldCheckIcon className="h-4 w-4 mr-1 text-gray-400" />
                        Education: {educationLevels.find(l => l.value === participant.education_level)?.label || participant.education_level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 lg:self-start">
              {user?.role !== 'donor' && (
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

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <ParticipantInfo
              participant={participant}
              stats={stats}
              onUploadPhoto={handleUploadPhoto}
              onUpdateFaceEncoding={handleUpdateFaceEncoding}
              user={user}
            />
          )}

          {activeTab === 'enrollments' && (
            <EnrollmentsList
              enrollments={stats.enrollments}
              participantId={participant?.id}
              user={user}
              onEnrollmentUpdated={fetchParticipantData}
            />
          )}

          {activeTab === 'notes' && (
            <NotesList
              participantId={participant?.id}
              notes={stats.notes}
              onAddNote={handleAddNote}
              user={user}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressReport
              progress={stats.progress}
              participant={participant}
              enrollments={stats.enrollments}
            />
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
    </Layout>
  );
};

// Education levels constant for display
const educationLevels = [
  { value: 'none', label: 'No Formal Education' },
  { value: 'primary', label: 'Primary School' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'vocational', label: 'Vocational Training' },
  { value: 'university', label: 'University' }
];

export default ParticipantDetailPage;