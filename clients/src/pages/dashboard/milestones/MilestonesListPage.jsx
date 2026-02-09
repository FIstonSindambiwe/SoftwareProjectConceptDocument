// src/pages/dashboard/milestones/MilestonesListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon, 
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  FlagIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Modal from '../../../components/common/Modal';
import Badge from '../../../components/common/Badge';
import MilestoneStatistics from '../../../components/milestones/MilestoneStatistics';
import MilestoneFilters from '../../../components/milestones/MilestoneFilters';
import programService from '../../../services/api/programService';

const MilestonesListPage = () => {
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [completionFilter, setCompletionFilter] = useState('');
  const [overdueFilter, setOverdueFilter] = useState('');
  
  // Modal states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (programFilter) params.program = programFilter;
      if (completionFilter) params.is_completed = completionFilter;

      const data = await programService.getMilestones(params);
      
      let milestonesList = [];
      if (data && data.results && Array.isArray(data.results)) {
        milestonesList = data.results;
      } else if (Array.isArray(data)) {
        milestonesList = data;
      }

      // Apply client-side filters
      if (searchTerm) {
        milestonesList = milestonesList.filter(m => 
          m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      if (overdueFilter === 'true') {
        milestonesList = milestonesList.filter(m => m.is_overdue);
      } else if (overdueFilter === 'false') {
        milestonesList = milestonesList.filter(m => !m.is_overdue);
      }

      setMilestones(milestonesList);
    } catch (error) {
      console.error('Error loading milestones:', error);
      toast.error('Failed to load milestones');
      setMilestones([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadMilestones();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, programFilter, completionFilter, overdueFilter]);

  const handleOpenCompleteModal = (milestone) => {
    setSelectedMilestone(milestone);
    setShowCompleteModal(true);
  };

  const handleOpenDeleteModal = (milestone) => {
    setSelectedMilestone(milestone);
    setShowDeleteModal(true);
  };

  const handleCompleteMilestone = async () => {
    if (!selectedMilestone) return;

    setIsUpdating(true);
    try {
      const response = await programService.completeMilestone(selectedMilestone.id);
      toast.success('Milestone marked as completed');
      
      setMilestones(milestones.map(m => 
        m.id === selectedMilestone.id ? response : m
      ));
      
      setShowCompleteModal(false);
    } catch (error) {
      console.error('Error completing milestone:', error);
      toast.error('Failed to complete milestone');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMilestone = async () => {
    if (!selectedMilestone) return;

    setIsUpdating(true);
    try {
      await programService.deleteMilestone(selectedMilestone.id);
      toast.success('Milestone deleted successfully');
      
      setMilestones(milestones.filter(m => m.id !== selectedMilestone.id));
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to delete milestone');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (milestone) => {
    if (milestone.is_completed) {
      return <Badge variant="success">Completed</Badge>;
    }
    if (milestone.is_overdue) {
      return <Badge variant="danger">Overdue</Badge>;
    }
    return <Badge variant="warning">Pending</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Milestones</h1>
            <p className="text-gray-600 mt-1">
              Track program milestones and achievements
            </p>
          </div>
          <Button
            variant="primary"
            icon={PlusIcon}
            onClick={() => navigate('/milestones/create')}
            size="lg"
          >
            Create Milestone
          </Button>
        </div>

        {/* Statistics */}
        <MilestoneStatistics milestones={milestones} />

        {/* Filters */}
        <MilestoneFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          programFilter={programFilter}
          setProgramFilter={setProgramFilter}
          completionFilter={completionFilter}
          setCompletionFilter={setCompletionFilter}
          overdueFilter={overdueFilter}
          setOverdueFilter={setOverdueFilter}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-600">
            {isLoading ? (
              <span className="flex items-center">
                <Spinner size="sm" />
                <span className="ml-2">Loading milestones...</span>
              </span>
            ) : (
              <span>
                Showing <span className="font-semibold text-gray-900">{milestones.length}</span> milestone{milestones.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Milestones Table */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 bg-white rounded-lg shadow">
            <Spinner size="lg" />
          </div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="text-gray-400 mb-4">
              <FlagIcon className="mx-auto h-20 w-20" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No milestones found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || programFilter || completionFilter || overdueFilter
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Get started by creating your first milestone.'}
            </p>
            {!searchTerm && !programFilter && !completionFilter && !overdueFilter && (
              <Button
                variant="primary"
                icon={PlusIcon}
                onClick={() => navigate('/milestones/create')}
              >
                Create Your First Milestone
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Milestone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Program
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Target Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Completion
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {milestones.map((milestone, index) => (
                    <tr 
                      key={milestone.id} 
                      className={`transition-all duration-200 hover:bg-blue-50 hover:shadow-md ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {milestone.title}
                          </div>
                          {milestone.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {milestone.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {milestone.program?.name || milestone.program_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(milestone.target_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {milestone.is_completed ? (
                          <div className="text-sm text-gray-900">
                            <div className="text-green-600 font-medium">
                              {formatDate(milestone.completion_date)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Not completed
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(milestone)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => navigate(`/milestones/${milestone.id}`)}
                            className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => navigate(`/milestones/${milestone.id}/edit`)}
                            className="p-2.5 text-amber-600 hover:bg-amber-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                            title="Edit Milestone"
                          >
                            <PencilIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </button>
                          {!milestone.is_completed && (
                            <button
                              onClick={() => handleOpenCompleteModal(milestone)}
                              className="p-2.5 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                              title="Mark as Complete"
                            >
                              <CheckCircleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDeleteModal(milestone)}
                            className="p-2.5 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 group"
                            title="Delete Milestone"
                          >
                            <XCircleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Complete Milestone Modal */}
        <Modal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          title="Complete Milestone"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to mark <strong>{selectedMilestone?.title}</strong> as completed?
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCompleteModal(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCompleteMilestone}
                isLoading={isUpdating}
              >
                Mark as Complete
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Milestone Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Milestone"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong>{selectedMilestone?.title}</strong>?
              <br /><br />
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteMilestone}
                isLoading={isUpdating}
              >
                Delete Milestone
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};

export default MilestonesListPage;