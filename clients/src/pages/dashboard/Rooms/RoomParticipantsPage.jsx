// src/pages/dashboard/participants/RoomParticipantsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  EyeIcon,
  UserGroupIcon,
  HomeIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Table from '../../../components/common/Table';
import useAuth from '../../../hooks/useAuth';
import participantService from '../../../services/api/participantService';

const RoomParticipantsPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRoomData();
  }, [id]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await participantService.getRoomParticipants(id);
      setRoomData(data);
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError('Failed to load room data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getGenderColor = (gender) => {
    switch (gender) {
      case 'M': return 'info';
      case 'F': return 'secondary';
      default: return 'default';
    }
  };

  const columns = [
    {
      key: 'participant_id',
      header: 'Participant ID',
      render: (value, participant) => (
        <div>
          <Link
            to={`/dashboard/participants/${participant.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            {value}
          </Link>
          {participant.full_name && (
            <p className="text-sm text-gray-500">{participant.full_name}</p>
          )}
        </div>
      )
    },
    {
      key: 'age',
      header: 'Age',
      render: (value) => (
        <div className="flex items-center">
          <span className="text-gray-700 font-medium">{value || '—'}</span>
          {value && <span className="text-gray-400 text-sm ml-1">years</span>}
        </div>
      )
    },
    {
      key: 'gender_display',
      header: 'Gender',
      render: (value, participant) => {
        if (!value && !participant.gender) return <span className="text-gray-400">—</span>;
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            participant.gender === 'M' ? 'bg-blue-100 text-blue-800' :
            participant.gender === 'F' ? 'bg-pink-100 text-pink-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {value || participant.gender}
          </span>
        );
      }
    },
    {
      key: 'active_enrollments_count',
      header: 'Programs',
      render: (value) => {
        const count = value || 0;
        return (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {count} active
          </span>
        );
      }
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (value) => (
        <div className="flex items-center">
          <div className={`h-2 w-2 rounded-full mr-2 ${
            value ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? 'Active' : 'Inactive'}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, participant) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/dashboard/participants/${participant.id}`)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            title="View Details"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate(`/dashboard/participants/${participant.id}/edit`)}
            className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
            title="Edit Participant"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !roomData) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <div className="p-6 text-center">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error || 'Room not found'}</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <HomeIcon className="h-6 w-6 mr-2 text-blue-600" />
                {roomData.room_name}
              </h1>
              <p className="text-gray-600 mt-1">
                Room participants and enrollment details
              </p>
            </div>
            <Button onClick={() => navigate(`/dashboard/participants/rooms/${id}/edit`)}>
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Room
            </Button>
          </div>
        </div>

        {/* Room Info Card */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="flex items-center mb-2">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-600">Teacher</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {roomData.teacher || 'Not assigned'}
                </p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-600">Capacity</span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {roomData.current_count} / {roomData.capacity}
                </p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Available Spots</span>
                </div>
                <p className={`text-lg font-semibold ${
                  roomData.available_spots > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {roomData.available_spots}
                </p>
              </div>

              <div>
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                </div>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  roomData.current_count >= roomData.capacity
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {roomData.current_count >= roomData.capacity ? 'Full' : 'Available'}
                </span>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Enrollment Progress</span>
                <span>{Math.round((roomData.current_count / roomData.capacity) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    roomData.current_count >= roomData.capacity ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((roomData.current_count / roomData.capacity) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Participants Table */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Participants ({roomData.participants?.length || 0})
              </h2>
            </div>

            {!roomData.participants || roomData.participants.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <UserGroupIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No participants in this room
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Participants will appear here when they are assigned to this room
                </p>
                <Button onClick={() => navigate('/dashboard/participants/create')}>
                  <UserIcon className="h-5 w-5 mr-2" />
                  Add Participant
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  data={roomData.participants}
                  rowClassName="hover:bg-gray-50 transition-colors"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Info Card */}
        {roomData.participants && roomData.participants.length > 0 && (
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-blue-900">Room Management</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Click on a participant's ID to view their full profile. Use the edit icon to update participant information.
                    To change a participant's room assignment, edit their profile.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default RoomParticipantsPage;