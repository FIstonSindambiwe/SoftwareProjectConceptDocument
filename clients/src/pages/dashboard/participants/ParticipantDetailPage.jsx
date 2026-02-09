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
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Alert from '../../../components/common/Alert';
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
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    enrollments: [],
    progress: null,
    faceEncodingStatus: null
  });

  const fetchParticipantData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [participantData, enrollmentsData, progressData, faceStatus] = await Promise.all([
        participantService.getParticipant(id),
        participantService.getParticipantEnrollments(id),
        participantService.getParticipantProgress(id).catch(() => null),
        participantService.getFaceEncodingStatus(id).catch(() => null)
      ]);
      
      setParticipant(participantData);
      setStats({
        enrollments: enrollmentsData.results || enrollmentsData,
        progress: progressData,
        faceEncodingStatus: faceStatus
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

  const handleAddNote = async (noteData) => {
    try {
      await participantService.addParticipantNote(id, noteData);
      Alert.success('Note added successfully');
      fetchParticipantData();
    } catch (err) {
      Alert.error(err.message || 'Failed to add note');
    }
  };

  const handleUploadPhoto = async (formData) => {
    try {
      await participantService.uploadParticipantPhoto(id, formData);
      Alert.success('Photo uploaded successfully');
      fetchParticipantData();
    } catch (err) {
      Alert.error(err.message || 'Failed to upload photo');
    }
  };

  const handleUpdateFaceEncoding = async () => {
    try {
      await participantService.updateFaceEncoding(id);
      Alert.success('Face encoding updated successfully');
      fetchParticipantData();
    } catch (err) {
      Alert.error(err.message || 'Failed to update face encoding');
    }
  };

  const handleDeactivate = async () => {
    if (window.confirm('Are you sure you want to deactivate this participant?')) {
      try {
        await participantService.deleteParticipant(id);
        Alert.success('Participant deactivated successfully');
        navigate('/dashboard/participants');
      } catch (err) {
        Alert.error(err.message || 'Failed to deactivate participant');
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

  if (error || !participant) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
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
              <p className="text-red-600">Error loading participant data</p>
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
      <div className="max-w-6xl mx-auto">
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
          
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {participant.participant_id}
                </h1>
                <Badge
                  color={participant.is_active ? 'green' : 'red'}
                >
                  {participant.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {stats.faceEncodingStatus?.can_use_face_recognition && (
                  <Badge color="blue" variant="outline">
                    <PhotoIcon className="h-4 w-4 mr-1" />
                    Face Recognition Ready
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                <span className="flex items-center">
                  <UserIcon className="h-5 w-5 mr-1" />
                  {participant.age} years • {participant.gender_display}
                </span>
                <span className="flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-1" />
                  Enrolled: {new Date(participant.enrollment_date).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <AcademicCapIcon className="h-5 w-5 mr-1" />
                  {participant.active_enrollments_count} active programs
                </span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {user.role !== 'donor' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/dashboard/participants/${id}/edit`)}
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDeactivate}
                    disabled={!participant.is_active}
                  >
                    Deactivate
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
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
              participantId={participant.id}
              user={user}
              onEnrollmentUpdated={fetchParticipantData}
            />
          )}

          {activeTab === 'notes' && (
            <NotesList
              participantId={participant.id}
              notes={participant.progress_notes}
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
      </div>
    </Layout>
  );
};

export default ParticipantDetailPage;