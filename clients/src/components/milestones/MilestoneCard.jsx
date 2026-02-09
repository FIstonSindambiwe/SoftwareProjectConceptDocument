// src/components/milestones/MilestoneCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlagIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Badge from '../common/Badge';

const MilestoneCard = ({ 
  milestone, 
  onComplete, 
  onDelete,
  showActions = true 
}) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusInfo = () => {
    if (milestone.is_completed) {
      return {
        variant: 'success',
        text: 'Completed',
        icon: CheckCircleIcon,
        color: 'green',
      };
    }
    if (milestone.is_overdue) {
      return {
        variant: 'danger',
        text: 'Overdue',
        icon: ExclamationTriangleIcon,
        color: 'red',
      };
    }
    return {
      variant: 'warning',
      text: 'Pending',
      icon: ClockIcon,
      color: 'yellow',
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Header with Status */}
      <div className={`px-6 py-4 ${
        milestone.is_completed 
          ? 'bg-gradient-to-r from-green-500 to-green-600' 
          : milestone.is_overdue
          ? 'bg-gradient-to-r from-red-500 to-red-600'
          : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate mb-2">
              {milestone.title}
            </h3>
            <Badge variant={statusInfo.variant} size="sm">
              <StatusIcon className="h-3 w-3 inline mr-1" />
              {statusInfo.text}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Description */}
        {milestone.description && (
          <div>
            <p className="text-sm text-gray-600 line-clamp-3">
              {milestone.description}
            </p>
          </div>
        )}

        {/* Program */}
        <div className="flex items-start">
          <FlagIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Program</p>
            <p className="text-sm font-medium text-gray-900">
              {milestone.program?.name || milestone.program_name || 'N/A'}
            </p>
          </div>
        </div>

        {/* Target Date */}
        <div className="flex items-start">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Target Date</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(milestone.target_date)}
            </p>
          </div>
        </div>

        {/* Completion Date */}
        {milestone.is_completed && milestone.completion_date && (
          <div className="flex items-start border-t border-gray-200 pt-4">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">Completed On</p>
              <p className="text-sm font-medium text-green-600">
                {formatDate(milestone.completion_date)}
              </p>
            </div>
          </div>
        )}

        {/* Overdue Warning */}
        {milestone.is_overdue && !milestone.is_completed && (
          <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-sm font-medium text-red-700">
              This milestone is overdue
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={EyeIcon}
                onClick={() => navigate(`/milestones/${milestone.id}`)}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={PencilIcon}
                onClick={() => navigate(`/milestones/${milestone.id}/edit`)}
              >
                Edit
              </Button>
            </div>
            <div className="flex gap-2">
              {!milestone.is_completed && (
                <button
                  onClick={() => onComplete?.(milestone)}
                  className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-colors"
                  title="Mark as Complete"
                >
                  <CheckCircleIcon className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => onDelete?.(milestone)}
                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                title="Delete"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneCard;