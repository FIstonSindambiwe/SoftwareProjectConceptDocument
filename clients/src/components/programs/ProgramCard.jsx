// src/components/programs/ProgramCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  ClockIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Badge from '../common/Badge';

const ProgramCard = ({ 
  program, 
  onStatusClick, 
  onToggleActive,
  showActions = true 
}) => {
  const navigate = useNavigate();

  const getStatusBadgeVariant = (status) => {
    const variants = {
      planning: 'warning',
      active: 'success',
      completed: 'primary',
      on_hold: 'default',
      cancelled: 'danger',
    };
    return variants[status] || 'default';
  };

  const getProgressPercentage = () => {
    if (!program.target_participants) return 0;
    const enrolled = program.enrollment_count || 0;
    return Math.min((enrolled / program.target_participants) * 100, 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Header with Status */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate mb-2">
              {program.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onStatusClick?.(program)}
                className="inline-block"
              >
                <Badge variant={getStatusBadgeVariant(program.status)} size="sm">
                  {program.status_display || program.status}
                </Badge>
              </button>
              {program.is_ongoing && (
                <Badge variant="success" size="sm">
                  <ClockIcon className="h-3 w-3 inline mr-1" />
                  Ongoing
                </Badge>
              )}
              {!program.is_active && (
                <Badge variant="default" size="sm">
                  <XCircleIcon className="h-3 w-3 inline mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Location */}
        <div className="flex items-start">
          <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {program.location_name}
            </p>
            <p className="text-xs text-gray-500">
              {program.location_city}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-start">
          <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700">
              {formatDate(program.start_date)}
              {program.end_date && (
                <>
                  <span className="text-gray-400 mx-1">→</span>
                  {formatDate(program.end_date)}
                </>
              )}
            </p>
            {program.duration_days && (
              <p className="text-xs text-gray-500">
                {program.duration_days} days
              </p>
            )}
          </div>
        </div>

        {/* Participants Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm text-gray-700">
              <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
              <span className="font-medium">
                {program.enrollment_count || 0}
              </span>
              <span className="text-gray-500 mx-1">/</span>
              <span className="text-gray-600">
                {program.target_participants}
              </span>
              <span className="text-gray-500 ml-1">participants</span>
            </div>
            <span className="text-xs font-semibold text-gray-600">
              {progressPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progressPercentage >= 100
                  ? 'bg-green-500'
                  : progressPercentage >= 75
                  ? 'bg-blue-500'
                  : progressPercentage >= 50
                  ? 'bg-yellow-500'
                  : 'bg-gray-400'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Budget */}
        {program.budget && (
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(program.budget)}
              </p>
              {program.funding_source && (
                <p className="text-xs text-gray-500 truncate">
                  {program.funding_source}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Focus Areas */}
        {program.focus_areas && program.focus_areas.length > 0 && (
          <div className="flex items-start">
            <TagIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {program.focus_areas.slice(0, 3).map((area, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {area}
                </span>
              ))}
              {program.focus_areas.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{program.focus_areas.length - 3}
                </span>
              )}
            </div>
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
                onClick={() => navigate(`/programs/${program.id}`)}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={PencilIcon}
                onClick={() => navigate(`/programs/${program.id}/edit`)}
              >
                Edit
              </Button>
            </div>
            <button
              onClick={() => onToggleActive?.(program)}
              className={`p-2 rounded-lg transition-colors ${
                program.is_active
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              title={program.is_active ? 'Deactivate' : 'Activate'}
            >
              {program.is_active ? (
                <XCircleIcon className="h-5 w-5" />
              ) : (
                <CheckCircleIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramCard;