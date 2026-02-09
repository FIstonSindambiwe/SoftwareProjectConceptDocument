// src/pages/dashboard/participants/ParticipantsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  EyeIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Table from '../../../components/common/Table';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Spinner from '../../../components/common/Spinner';
import ParticipantFilters from '../../../components/participants/ParticipantFilters';
import useAuth from '../../../hooks/useAuth';
import participantService from '../../../services/api/participantService';

const ParticipantsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    is_active: 'true',
    age_min: '',
    age_max: '',
    search: ''
  });

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const [participantsData, statsData] = await Promise.all([
        participantService.getParticipants(filters),
        participantService.getParticipantStats()
      ]);
      
      // Handle the API response structure
      const participantsList = participantsData.results || participantsData || [];
      
      // Add debug logging
      console.log('Fetched participants:', participantsList);
      
      // Check for missing IDs
      const validParticipants = participantsList.filter(p => p && p.id);
      const invalidParticipants = participantsList.filter(p => !p || !p.id);
      
      if (invalidParticipants.length > 0) {
        console.warn('Some participants are missing IDs:', invalidParticipants);
      }
      
      setParticipants(validParticipants);
      setFilteredParticipants(validParticipants);
      setStats(statsData);
      
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError(err.message || 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await participantService.getParticipantStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, []);

  useEffect(() => {
    if (participants.length > 0) {
      applyFilters();
    }
  }, [filters, participants]);

  const applyFilters = () => {
    let filtered = [...participants];
    
    if (filters.gender) {
      filtered = filtered.filter(p => p && p.gender === filters.gender);
    }
    
    if (filters.is_active) {
      filtered = filtered.filter(p => p && p.is_active === (filters.is_active === 'true'));
    }
    
    if (filters.age_min) {
      filtered = filtered.filter(p => p && p.age >= parseInt(filters.age_min));
    }
    
    if (filters.age_max) {
      filtered = filtered.filter(p => p && p.age <= parseInt(filters.age_max));
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p && (
          (p.participant_id && p.participant_id.toLowerCase().includes(searchTerm)) ||
          (p.notes && p.notes.toLowerCase().includes(searchTerm))
        )
      );
    }
    
    setFilteredParticipants(filtered);
  };

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleClearFilters = () => {
    setFilters({
      gender: '',
      is_active: 'true',
      age_min: '',
      age_max: '',
      search: ''
    });
    setFilteredParticipants(participants);
  };

  const handleDelete = async (id) => {
    if (!id) {
      setError('Cannot delete participant: Missing ID');
      return;
    }
    
    if (window.confirm('Are you sure you want to deactivate this participant?')) {
      try {
        await participantService.deleteParticipant(id);
        setSuccess('Participant deactivated successfully');
        setError('');
        fetchParticipants();
        fetchStats();
      } catch (err) {
        console.error('Error deleting participant:', err);
        setError(err.message || 'Failed to deactivate participant');
        setSuccess('');
      }
    }
  };

  const columns = [
    {
      key: 'participant_id',
      header: 'Participant ID',
      render: (value, participant) => {
        // Check if participant has an id
        if (!participant || !participant.id) {
          return (
            <span className="text-gray-700 font-medium">{value || 'No ID'}</span>
          );
        }
        
        return (
          <Link 
            to={`/dashboard/participants/${participant.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {value || 'No ID'}
          </Link>
        );
      }
    },
    {
      key: 'age',
      header: 'Age',
      render: (value) => {
        if (!value && value !== 0) return <span className="text-gray-400">Not set</span>;
        return <span className="text-gray-700">{value} years</span>;
      }
    },
    {
      key: 'gender_display',
      header: 'Gender',
      render: (value, participant) => {
        // FIX: Properly handle the value and always return JSX
        const displayValue = value || participant?.gender_display;
        return displayValue ? (
          <span className="text-gray-700">{String(displayValue)}</span>
        ) : (
          <span className="text-gray-400">Not set</span>
        );
      }
    },
    {
      key: 'enrollment_date',
      header: 'Enrolled',
      render: (value) => {
        if (!value) return <span className="text-gray-400">Not set</span>;
        try {
          return <span className="text-gray-700">{new Date(value).toLocaleDateString()}</span>;
        } catch {
          return <span className="text-gray-400">Invalid date</span>;
        }
      }
    },
    {
      key: 'active_enrollments_count',
      header: 'Active Programs',
      render: (value) => {
        const count = value || 0;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {count}
          </span>
        );
      }
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (value) => {
        const isActive = value === true || value === 'true';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, participant) => {
        // Check if participant has an id
        if (!participant || !participant.id) {
          return (
            <span className="text-gray-400 text-sm">No actions</span>
          );
        }
        
        return (
          <div className="flex space-x-2">
            <Button
              size="xs"
              variant="outline"
              onClick={() => navigate(`/dashboard/participants/${participant.id}`)}
            >
              <EyeIcon className="h-4 w-4" />
              View
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => navigate(`/dashboard/participants/${participant.id}/edit`)}
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </Button>
            {user.role !== 'donor' && (
              <Button
                size="xs"
                variant="danger"
                onClick={() => handleDelete(participant.id)}
                disabled={!participant.is_active}
              >
                Deactivate
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  if (loading && participants.length === 0) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
            <p className="text-gray-600">Manage youth participants and their enrollments</p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
              Filters
            </Button>
            {user.role !== 'donor' && (
              <Button onClick={() => navigate('/dashboard/participants/create')}>
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Participant
              </Button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
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
                  className="text-green-500 hover:text-green-600"
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
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
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
                  onClick={() => setError('')}
                  className="text-red-500 hover:text-red-600"
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500 text-white">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Participants</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_participants || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-50 to-green-100">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500 text-white">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Active Participants</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_participants || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500 text-white">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Avg Age</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.average_age ? Math.round(stats.average_age) : 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-500 text-white">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Male/Female</h3>
                  <p className="text-lg font-bold text-gray-900">
                    {stats.participants_by_gender?.M || 0}/{stats.participants_by_gender?.F || 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <Card>
            <ParticipantFilters
              filters={filters}
              onChange={handleFilterChange}
              onClear={handleClearFilters}
            />
          </Card>
        )}

        {/* Participants Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={filteredParticipants.filter(p => p && p.id)} // Filter out participants without IDs
              emptyMessage={
                <div className="text-center py-12">
                  <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No participants found</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Try adjusting your filters or add a new participant
                  </p>
                  {user.role !== 'donor' && (
                    <Button
                      onClick={() => navigate('/dashboard/participants/create')}
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add First Participant
                    </Button>
                  )}
                </div>
              }
            />
          </div>
          
          {/* Pagination (if API supports it) */}
          {filteredParticipants.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-gray-700">
                Showing {filteredParticipants.length} of {participants.length} participants
              </p>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={true}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={true}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default ParticipantsListPage;