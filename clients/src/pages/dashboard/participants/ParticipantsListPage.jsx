// src/pages/dashboard/participants/ParticipantsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  EllipsisVerticalIcon,
  UserPlusIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Table from '../../../components/common/Table';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Spinner from '../../../components/common/Spinner';
import Dropdown from '../../../components/common/Dropdown';
import ParticipantFilters from '../../../components/participants/ParticipantFilters';
import useAuth from '../../../hooks/useAuth';
import participantService from '../../../services/api/participantService';

const ParticipantsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ x: 0, y: 0 });
  const [showActionMenu, setShowActionMenu] = useState(false);
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
      setRefreshing(false);
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchParticipants();
  };

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
          (p.first_name && p.first_name.toLowerCase().includes(searchTerm)) ||
          (p.last_name && p.last_name.toLowerCase().includes(searchTerm)) ||
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
  };

  const handleDelete = async (participant) => {
    if (!participant?.id) {
      setError('Cannot delete participant: Missing ID');
      return;
    }
    
    if (window.confirm(`Are you sure you want to deactivate ${participant.participant_id || 'this participant'}? This action cannot be undone.`)) {
      try {
        await participantService.deleteParticipant(participant.id);
        setSuccess(`Participant ${participant.participant_id || ''} deactivated successfully`);
        setShowActionMenu(false);
        setSelectedParticipant(null);
        fetchParticipants();
        fetchStats();
      } catch (err) {
        console.error('Error deleting participant:', err);
        setError(err.message || 'Failed to deactivate participant');
        setSuccess('');
      }
    }
  };

  const handleActionMenuClick = (participant, event) => {
    event.stopPropagation();
    
    // Calculate position for the action menu
    const rect = event.currentTarget.getBoundingClientRect();
    setActionMenuPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 5
    });
    
    setSelectedParticipant(participant);
    setShowActionMenu(true);
  };

  const ActionMenu = () => {
    if (!selectedParticipant || !showActionMenu) return null;

    const menuItems = [
      {
        label: 'View Details',
        icon: <EyeIcon className="h-4 w-4 mr-2" />,
        onClick: () => {
          navigate(`/dashboard/participants/${selectedParticipant.id}`);
          setShowActionMenu(false);
        }
      },
      {
        label: 'Edit',
        icon: <PencilIcon className="h-4 w-4 mr-2" />,
        onClick: () => {
          navigate(`/dashboard/participants/${selectedParticipant.id}/edit`);
          setShowActionMenu(false);
        }
      },
      ...(user.role !== 'donor' && selectedParticipant.is_active ? [{
        label: 'Deactivate',
        icon: <TrashIcon className="h-4 w-4 mr-2" />,
        onClick: () => handleDelete(selectedParticipant),
        className: 'text-red-600 hover:bg-red-50'
      }] : [])
    ];

    return (
      <>
        {/* Overlay to close menu when clicking outside */}
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowActionMenu(false);
            setSelectedParticipant(null);
          }}
        />
        
        {/* Action Menu */}
        <div 
          className="fixed z-50 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 animate-slideDown"
          style={{
            top: actionMenuPosition.y,
            left: actionMenuPosition.x,
            transform: 'translateX(-100%)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1" role="menu">
            <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
              {selectedParticipant.participant_id || 'Participant'}
            </div>
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center ${item.className || ''}`}
                role="menuitem"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  };

  const columns = [
    {
      key: 'participant_id',
      header: 'Participant ID',
      render: (value, participant) => {
        const fullName = participant?.first_name || participant?.last_name 
          ? `${participant.first_name || ''} ${participant.last_name || ''}`.trim()
          : null;
        
        if (!participant || !participant.id) {
          return (
            <div>
              <span className="text-gray-700 font-medium block">{value || 'No ID'}</span>
              {fullName && (
                <span className="text-sm text-gray-500">{fullName}</span>
              )}
            </div>
          );
        }
        
        return (
          <div>
            <Link 
              to={`/dashboard/participants/${participant.id}`}
              className="text-blue-600 hover:text-blue-800 font-medium block hover:underline"
            >
              {value || 'No ID'}
            </Link>
            {fullName && (
              <span className="text-sm text-gray-500">{fullName}</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'age',
      header: 'Age',
      render: (value) => {
        if (!value && value !== 0) return <span className="text-gray-400">—</span>;
        return (
          <div className="flex items-center">
            <span className="text-gray-700 font-medium">{value}</span>
            <span className="text-gray-400 text-sm ml-1">years</span>
          </div>
        );
      }
    },
    {
      key: 'gender_display',
      header: 'Gender',
      render: (value, participant) => {
        const displayValue = value || participant?.gender_display;
        return displayValue ? (
          <span className="text-gray-700 capitalize">{String(displayValue)}</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      }
    },
    {
      key: 'enrollment_date',
      header: 'Enrolled',
      render: (value) => {
        if (!value) return <span className="text-gray-400">—</span>;
        try {
          const date = new Date(value);
          return (
            <div className="flex flex-col">
              <span className="text-gray-700">{date.toLocaleDateString()}</span>
              <span className="text-xs text-gray-400">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          );
        } catch {
          return <span className="text-gray-400">—</span>;
        }
      }
    },
    {
      key: 'active_enrollments_count',
      header: 'Programs',
      render: (value) => {
        const count = value || 0;
        return (
          <div className="flex flex-col items-start">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              count > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {count} active
            </span>
            {count === 0 && (
              <span className="text-xs text-gray-400 mt-1">Not enrolled</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (value) => {
        const isActive = value === true || value === 'true';
        return (
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${
              isActive ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: '',
      width: '60px',
      render: (_, participant) => {
        if (!participant || !participant.id) {
          return <span className="text-gray-300">—</span>;
        }
        
        return (
          <button
            onClick={(e) => handleActionMenuClick(participant, e)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title="Actions"
          >
            <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
          </button>
        );
      }
    }
  ];

  if (loading && participants.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col justify-center items-center h-64">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Loading participants...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Floating Action Menu */}
      {showActionMenu && <ActionMenu />}
      
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
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {user.role !== 'donor' && (
              <Button onClick={() => navigate('/dashboard/participants/create')}>
                <UserPlusIcon className="h-5 w-5 mr-2" />
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
                  <XMarkIcon className="h-5 w-5" />
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
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Participants</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_participants || 0}</p>
                </div>
              </div>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Active</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_participants || 0}</p>
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <ChartBarIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Average Age</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.average_age ? Math.round(stats.average_age) : 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Gender Ratio</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-1">♂</span>
                      <span className="font-bold text-gray-900">{stats.participants_by_gender?.M || 0}</span>
                    </div>
                    <span className="text-gray-300">/</span>
                    <div className="flex items-center">
                      <span className="text-pink-600 mr-1">♀</span>
                      <span className="font-bold text-gray-900">{stats.participants_by_gender?.F || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Filters Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant={showFilters ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
                {Object.values(filters).some(value => value !== '' && value !== 'true') && (
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </Button>
              
              {Object.values(filters).some(value => value !== '' && value !== 'true') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {filteredParticipants.length} of {participants.length} participants
            </div>
          </div>

          {showFilters && (
            <Card className="animate-slideDown">
              <ParticipantFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
              />
            </Card>
          )}
        </div>

        {/* Participants Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={filteredParticipants.filter(p => p && p.id)}
              rowClassName="hover:bg-gray-50 transition-colors"
              emptyMessage={
                <div className="text-center py-16">
                  <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {Object.values(filters).some(value => value !== '' && value !== 'true') 
                      ? 'No participants match your current filters. Try adjusting your search criteria.'
                      : 'Get started by adding your first participant to the system.'
                    }
                  </p>
                  <div className="space-x-3">
                    {Object.values(filters).some(value => value !== '' && value !== 'true') && (
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                      >
                        <XMarkIcon className="h-5 w-5 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                    {user.role !== 'donor' && (
                      <Button
                        onClick={() => navigate('/dashboard/participants/create')}
                      >
                        <UserPlusIcon className="h-5 w-5 mr-2" />
                        Add Participant
                      </Button>
                    )}
                  </div>
                </div>
              }
            />
          </div>
          
          {/* Table Footer */}
          {filteredParticipants.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredParticipants.length}</span> of{' '}
                <span className="font-medium">{participants.length}</span> participants
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={true}
                  title="Previous page"
                >
                  ← Previous
                </Button>
                <span className="text-sm text-gray-500 mx-2">Page 1 of 1</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={true}
                  title="Next page"
                >
                  Next →
                </Button>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <InformationCircleIcon className="h-4 w-4 mr-1" />
                Click on participant ID to view details
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default ParticipantsListPage;