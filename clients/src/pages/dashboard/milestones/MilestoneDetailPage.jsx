// src/pages/dashboard/milestones/MilestoneDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  FlagIcon,
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import Badge from '../../../components/common/Badge';
import Modal from '../../../components/common/Modal';
import programService from '../../../services/api/programService';

const MilestoneDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [milestone, setMilestone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadMilestone();
  }, [id]);

  const loadMilestone = async () => {
    try {
      const data = await programService.getMilestone(id);
      setMilestone(data);
    } catch (error) {
      console.error('Error loading milestone:', error);
      toast.error('Failed to load milestone');
      navigate('/milestones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsUpdating(true);
    try {
      const response = await programService.completeMilestone(id);
      toast.success('Milestone marked as completed');
      setMilestone(response);
      setShowCompleteModal(false);
    } catch (error) {
      console.error('Error completing milestone:', error);
      toast.error('Failed to complete milestone');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      await programService.deleteMilestone(id);
      toast.success('Milestone deleted successfully');
      navigate('/milestones');
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to delete milestone');
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusInfo = () => {
    if (!milestone) return { variant: 'default', text: 'Unknown', icon: ClockIcon };

    if (milestone.is_completed) {
      return {
        variant: 'success',
        text: 'Completed',
        icon: CheckCircleIcon,
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
      };
    }

    if (milestone.is_overdue) {
      return {
        variant: 'danger',
        text: 'Overdue',
        icon: ExclamationTriangleIcon,
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
      };
    }

    return {
      variant: 'warning',
      text: 'Pending',
      icon: ClockIcon,
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!milestone) {
    return null;
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <Button
              variant="outline"
              icon={ArrowLeftIcon}
              onClick={() => navigate('/milestones')}
            >
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {milestone.title}
                </h1>
                <Badge variant={statusInfo.variant}>
                  <StatusIcon className="h-3 w-3 inline mr-1" />
                  {statusInfo.text}
                </Badge>
              </div>
              <p className="text-gray-600">
                Milestone Details and Information
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              icon={PencilIcon}
              onClick={() => navigate(`/milestones/${id}/edit`)}
            >
              Edit
            </Button>
            {!milestone.is_completed && (
              <Button
                variant="success"
                icon={CheckCircleIcon}
                onClick={() => setShowCompleteModal(true)}
              >
                Complete
              </Button>
            )}
            <Button
              variant="danger"
              icon={TrashIcon}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Status Alert */}
        {(milestone.is_completed || milestone.is_overdue) && (
          <div className={`rounded-lg p-4 ${statusInfo.bgColor} border-l-4 ${
            milestone.is_completed ? 'border-green-500' : 'border-red-500'
          }`}>
            <div className="flex items-center">
              <StatusIcon className={`h-5 w-5 ${statusInfo.textColor} mr-3`} />
              <div>
                <p className={`font-medium ${statusInfo.textColor}`}>
                  {milestone.is_completed
                    ? 'This milestone has been completed'
                    : 'This milestone is overdue'}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {milestone.is_completed
                    ? `Completed on ${formatDate(milestone.completion_date)}`
                    : `Target date was ${formatDate(milestone.target_date)}`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <div className="flex items-start">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Description
                  </h3>
                  {milestone.description ? (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {milestone.description}
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">
                      No description provided
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Program Information */}
            <Card title="Program Information">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Program Name
                  </label>
                  <p className="text-base font-semibold text-gray-900">
                    {milestone.program?.name || milestone.program_name || 'N/A'}
                  </p>
                </div>
                {milestone.program && (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/programs/${milestone.program.id || milestone.program}`)}
                    >
                      View Program Details
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dates Card */}
            <Card title="Timeline">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center text-sm text-gray-500 mb-1">
                    <FlagIcon className="h-4 w-4 mr-2" />
                    Target Date
                  </div>
                  <p className="text-base font-semibold text-gray-900">
                    {formatDate(milestone.target_date)}
                  </p>
                </div>

                {milestone.is_completed && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Completion Date
                    </div>
                    <p className="text-base font-semibold text-green-600">
                      {formatDate(milestone.completion_date)}
                    </p>
                  </div>
                )}

                {milestone.is_overdue && !milestone.is_completed && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center text-sm text-red-600">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        Overdue
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Metadata */}
            <Card title="Information">
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>
                  <p className="text-gray-900 font-medium mt-1">
                    {new Date(milestone.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Last Updated:</span>
                  <p className="text-gray-900 font-medium mt-1">
                    {new Date(milestone.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Complete Milestone Modal */}
        <Modal
          isOpen={showCompleteModal}
          onClose={() => setShowCompleteModal(false)}
          title="Complete Milestone"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to mark <strong>{milestone.title}</strong> as completed?
              <br /><br />
              The completion date will be set to today.
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
                onClick={handleComplete}
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
              Are you sure you want to delete <strong>{milestone.title}</strong>?
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
                onClick={handleDelete}
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

export default MilestoneDetailPage;