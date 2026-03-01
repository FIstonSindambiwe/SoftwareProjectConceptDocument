// src/pages/dashboard/participants/ParticipantsListPage.jsx (Fixed)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  EyeIcon,
  TrashIcon,
  UserGroupIcon,
  ChartBarIcon,
  EllipsisVerticalIcon,
  UserPlusIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Table from '../../../components/common/Table';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Spinner from '../../../components/common/Spinner';
import ParticipantFilters from '../../../components/participants/ParticipantFilters';
import useAuth from '../../../hooks/useAuth';
import participantService from '../../../services/api/participantService';
import roomService from '../../../services/api/roomService';
import { debounce } from 'lodash';

const PAGE_SIZE = 10;

const ParticipantsListPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teacherRooms, setTeacherRooms] = useState([]);
  const [stats, setStats] = useState({
    total_participants: 0,
    active_participants: 0,
    average_age: 0,
    participants_by_gender: { M: 0, F: 0, O: 0, N: 0 }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ x: 0, y: 0 });
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total_pages: 1,
    total_count: 0,
    page_size: PAGE_SIZE
  });
  const [filters, setFilters] = useState({
    gender: '',
    is_active: 'true',
    age_min: '',
    age_max: '',
    search: '',
    room: ''
  });

  // Check user permissions
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  const isProgramManager = user?.role === 'program_manager';
  const canEdit = !['donor', 'teacher'].includes(user?.role);
  const canViewAll = isAdmin || isProgramManager;

  // Fetch teacher's assigned rooms if user is teacher
  useEffect(() => {
    if (isTeacher) {
      fetchTeacherRooms();
    }
  }, [isTeacher]);

  const fetchTeacherRooms = async () => {
    try {
      const response = await roomService.getRooms({ teacher: user.id, page_size: 100 });
      const rooms = response.results || response;
      setTeacherRooms(rooms);
      
      if (rooms.length === 1) {
        setFilters(prev => ({ ...prev, room: rooms[0].id.toString() }));
      }
    } catch (err) {
      console.error('Error fetching teacher rooms:', err);
    }
  };

  // Memoized filtered participants
  const filteredParticipants = useMemo(() => {
    let filtered = [...participants];
    
    if (filters.gender) {
      filtered = filtered.filter(p => p && p.gender === filters.gender);
    }
    
    if (filters.is_active) {
      const isActiveBool = filters.is_active === 'true';
      filtered = filtered.filter(p => p && p.is_active === isActiveBool);
    }
    
    if (filters.age_min) {
      const minAge = parseInt(filters.age_min);
      filtered = filtered.filter(p => p && p.age >= minAge);
    }
    
    if (filters.age_max) {
      const maxAge = parseInt(filters.age_max);
      filtered = filtered.filter(p => p && p.age <= maxAge);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p && (
          (p.participant_id && p.participant_id.toLowerCase().includes(searchTerm)) ||
          (p.first_name && p.first_name.toLowerCase().includes(searchTerm)) ||
          (p.last_name && p.last_name.toLowerCase().includes(searchTerm)) ||
          (p.full_name && p.full_name.toLowerCase().includes(searchTerm))
        )
      );
    }
    
    return filtered;
  }, [participants, filters]);

  // Memoized paginated participants
  const paginatedParticipants = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.page_size;
    const endIndex = startIndex + pagination.page_size;
    return filteredParticipants.slice(startIndex, endIndex);
  }, [filteredParticipants, pagination.page, pagination.page_size]);

  // Update pagination when filtered participants change
  useEffect(() => {
    const totalCount = filteredParticipants.length;
    const totalPages = Math.ceil(totalCount / pagination.page_size);
    
    setPagination(prev => ({
      ...prev,
      total_count: totalCount,
      total_pages: totalPages || 1,
      page: prev.page > totalPages && totalPages > 0 ? 1 : prev.page
    }));
  }, [filteredParticipants, pagination.page_size]);

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const queryParams = { ...filters };
      
      if (isTeacher) {
        if (teacherRooms.length > 0) {
          if (filters.room) {
            queryParams.room = filters.room;
          } else {
            queryParams.rooms = teacherRooms.map(r => r.id).join(',');
          }
        } else {
          setParticipants([]);
          setStats({
            total_participants: 0,
            active_participants: 0,
            average_age: 0,
            participants_by_gender: { M: 0, F: 0, O: 0, N: 0 }
          });
          setPagination(prev => ({ ...prev, page: 1, total_count: 0, total_pages: 1 }));
          setLoading(false);
          return;
        }
      }
      
      const participantsData = await participantService.getParticipants(queryParams);
      
      const participantsList = participantsData.results || participantsData || [];
      const validParticipants = participantsList.filter(p => p && p.id);
      
      setParticipants(validParticipants);
      calculateStats(validParticipants);
      
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError(err.message || 'Failed to load participants');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, isTeacher, teacherRooms]);

  const calculateStats = useCallback((participantsList) => {
    const validParticipants = participantsList.filter(p => p && p.id);
    
    const total_participants = validParticipants.length;
    const active_participants = validParticipants.filter(p => p.is_active).length;
    
    const ages = validParticipants.map(p => p.age).filter(age => age && !isNaN(age));
    const average_age = ages.length > 0 
      ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) 
      : 0;
    
    const participants_by_gender = validParticipants.reduce((acc, p) => {
      const gender = p.gender || 'N';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, { M: 0, F: 0, O: 0, N: 0 });
    
    setStats({
      total_participants,
      active_participants,
      average_age,
      participants_by_gender
    });
  }, []);

  const debouncedFetch = useMemo(
    () => debounce(() => fetchParticipants(), 500),
    [fetchParticipants]
  );

  useEffect(() => {
    if (isTeacher && teacherRooms.length === 0) {
      return;
    }
    fetchParticipants();
  }, [isTeacher, teacherRooms.length]);

  useEffect(() => {
    if (filters.search) {
      debouncedFetch();
    } else if (!isTeacher || teacherRooms.length > 0) {
      fetchParticipants();
    }
    return () => debouncedFetch.cancel();
  }, [filters.gender, filters.is_active, filters.age_min, filters.age_max, filters.search, filters.room]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchParticipants();
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      gender: '',
      is_active: 'true',
      age_min: '',
      age_max: '',
      search: '',
      room: isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (participant) => {
    if (!participant?.id) {
      setError('Cannot delete participant: Missing ID');
      return;
    }
    
    if (window.confirm(`Are you sure you want to deactivate ${participant.participant_id || 'this participant'}?`)) {
      try {
        await participantService.deleteParticipant(participant.id);
        setSuccess(`Participant ${participant.participant_id || ''} deactivated successfully`);
        setShowActionMenu(false);
        setSelectedParticipant(null);
        fetchParticipants();
      } catch (err) {
        console.error('Error deleting participant:', err);
        setError(err.message || 'Failed to deactivate participant');
      }
    }
  };

  const handleActionMenuClick = (participant, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setActionMenuPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 5
    });
    setSelectedParticipant(participant);
    setShowActionMenu(true);
  };

  const getPageNumbers = useCallback(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= pagination.total_pages; i++) {
      if (i === 1 || i === pagination.total_pages || (i >= pagination.page - delta && i <= pagination.page + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  }, [pagination.total_pages, pagination.page]);

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
      ...(canEdit ? [
        {
          label: 'Edit',
          icon: <PencilIcon className="h-4 w-4 mr-2" />,
          onClick: () => {
            navigate(`/dashboard/participants/${selectedParticipant.id}/edit`);
            setShowActionMenu(false);
          }
        },
        ...(selectedParticipant.is_active ? [{
          label: 'Deactivate',
          icon: <TrashIcon className="h-4 w-4 mr-2" />,
          onClick: () => handleDelete(selectedParticipant),
          className: 'text-red-600 hover:bg-red-50'
        }] : [])
      ] : [])
    ];

    return (
      <>
        <div className="fixed inset-0 z-40" onClick={() => {
          setShowActionMenu(false);
          setSelectedParticipant(null);
        }} />
        
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
              {selectedParticipant.room_name && (
                <div className="mt-1 text-gray-400">Room: {selectedParticipant.room_name}</div>
              )}
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

  const columns = useMemo(() => [
    {
      key: 'participant_id',
      header: 'Participant ID',
      render: (value, participant) => {
        const fullName = participant?.full_name || 
          `${participant?.first_name || ''} ${participant?.last_name || ''}`.trim();
        
        if (!participant || !participant.id) {
          return (
            <div>
              <span className="text-gray-700 font-medium block">{value || 'No ID'}</span>
              {fullName && <span className="text-sm text-gray-500">{fullName}</span>}
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
            {fullName && <span className="text-sm text-gray-500">{fullName}</span>}
          </div>
        );
      }
    },
    {
      key: 'room_name',
      header: 'Room',
      render: (value) => {
        return value ? (
          <div className="flex items-center">
            <HomeIcon className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-600">{value}</span>
          </div>
        ) : (
          <span className="text-gray-400">—</span>
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
  ], [navigate, canEdit]);

  const renderTeacherInfo = () => {
    if (!isTeacher) return null;
    
    if (teacherRooms.length === 0) {
      return (
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">No Rooms Assigned</p>
                <p className="text-xs text-yellow-700 mt-1">
                  You don't have any rooms assigned yet. Please contact an administrator.
                </p>
              </div>
            </div>
          </div>
        </Card>
      );
    }
    
    return (
      <Card className="bg-blue-50 border-blue-200">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <HomeIcon className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Your Assigned Rooms: {teacherRooms.length}
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {teacherRooms.map(room => (
                    <span 
                      key={room.id}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-white text-xs text-blue-700 border border-blue-200"
                    >
                      {room.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {teacherRooms.length > 1 && (
              <p className="text-xs text-blue-600">
                Use room filter to switch between rooms
              </p>
            )}
          </div>
        </div>
      </Card>
    );
  };

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
      {showActionMenu && <ActionMenu />}
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Participants</h1>
            <p className="text-gray-600">
              {isTeacher 
                ? 'View participants in your assigned rooms'
                : 'Manage youth participants and their enrollments'}
            </p>
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
            {canEdit && (
              <Button onClick={() => navigate('/dashboard/participants/create')}>
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Add Participant
              </Button>
            )}
          </div>
        </div>

        {/* Teacher Info */}
        {renderTeacherInfo()}

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm font-medium text-green-800">{success}</p>
              <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm font-medium text-red-800">{error}</p>
              <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {(canViewAll || participants.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <UserGroupIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Participants</h3>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_participants}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.active_participants}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.average_age}</p>
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
                {Object.values(filters).some(value => value !== '' && value !== 'true' && value !== (isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : '')) && (
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </Button>
              
              {Object.values(filters).some(value => value !== '' && value !== 'true' && value !== (isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : '')) && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {paginatedParticipants.length} of {filteredParticipants.length} participants
            </div>
          </div>

          {showFilters && (
            <Card className="animate-slideDown">
              <ParticipantFilters
                filters={filters}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
                teacherRooms={teacherRooms}
                isTeacher={isTeacher}
              />
            </Card>
          )}
        </div>

        {/* Participants Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              data={paginatedParticipants}
              rowClassName="hover:bg-gray-50 transition-colors"
              emptyMessage={
                <div className="text-center py-16">
                  <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No participants found</h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {isTeacher && teacherRooms.length === 0
                      ? 'You don\'t have any rooms assigned yet.'
                      : Object.values(filters).some(value => value !== '' && value !== 'true' && value !== (isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : ''))
                        ? 'No participants match your current filters.'
                        : isTeacher
                          ? 'No participants in your assigned rooms.'
                          : 'Get started by adding your first participant.'}
                  </p>
                  <div className="space-x-3">
                    {Object.values(filters).some(value => value !== '' && value !== 'true' && value !== (isTeacher && teacherRooms.length === 1 ? teacherRooms[0].id.toString() : '')) && (
                      <Button variant="outline" onClick={handleClearFilters}>
                        <XMarkIcon className="h-5 w-5 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                    {canEdit && !isTeacher && (
                      <Button onClick={() => navigate('/dashboard/participants/create')}>
                        <UserPlusIcon className="h-5 w-5 mr-2" />
                        Add Participant
                      </Button>
                    )}
                  </div>
                </div>
              }
            />
          </div>
          
          {/* Pagination */}
          {paginatedParticipants.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 gap-4">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{((pagination.page - 1) * pagination.page_size) + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.page_size, pagination.total_count)}
                </span>{' '}
                of <span className="font-medium">{pagination.total_count}</span> participants
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="hidden md:flex items-center space-x-1">
                  {getPageNumbers().map((pageNum, index) => (
                    <button
                      key={index}
                      onClick={() => typeof pageNum === 'number' ? handlePageChange(pageNum) : null}
                      disabled={pageNum === '...'}
                      className={`
                        px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                        ${pageNum === pagination.page 
                          ? 'bg-blue-600 text-white hover:bg-blue-700' 
                          : pageNum === '...'
                            ? 'text-gray-500 cursor-default'
                            : 'text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-3 py-2"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <InformationCircleIcon className="h-4 w-4 mr-1" />
                <span>{pagination.page_size} records per page</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default ParticipantsListPage;