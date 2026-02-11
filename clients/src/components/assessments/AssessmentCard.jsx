// src/components/assessments/AssessmentCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, UserIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import Card from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import assessmentsService from '../../services/api/assessmentsService';

const AssessmentCard = ({ assessment, onDelete, showActions = true }) => {
  const navigate = useNavigate();

  const pct = assessment.indicator_min !== undefined
    ? assessmentsService.scoreToPercent(assessment.score, {
        min_value: assessment.indicator_min ?? 0,
        max_value: assessment.indicator_max ?? 10,
      })
    : null;

  const scoreColor = assessmentsService.getAssessmentTypeColor(assessment.assessment_type);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Left: icon + meta */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2.5">
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {assessment.indicator_name}
              </span>
              <Badge
                color={assessmentsService.getCategoryColor(
                  assessment.indicator_category_key ?? assessment.indicator_category
                )}
                size="sm"
              >
                {assessment.indicator_category}
              </Badge>
              <Badge
                color={scoreColor}
                size="sm"
              >
                {assessmentsService.getAssessmentTypeLabel(assessment.assessment_type)}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <UserIcon className="h-3.5 w-3.5" />
                {assessment.participant_id}
                {assessment.participant_name && ` · ${assessment.participant_name}`}
              </span>
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {new Date(assessment.assessment_date).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric',
                })}
              </span>
              {assessment.program_name && (
                <span>{assessment.program_name}</span>
              )}
            </div>

            {assessment.notes && (
              <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{assessment.notes}</p>
            )}
          </div>
        </div>

        {/* Right: score */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.score}
            </div>
            {assessment.indicator_max !== undefined && (
              <div className="text-xs text-gray-500">/ {assessment.indicator_max}</div>
            )}
          </div>

          {pct !== null && (
            <div className="w-24">
              <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                <span>{assessmentsService.getPerformanceLabel(pct)}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}

          {showActions && (
            <div className="flex gap-1.5 mt-1">
              <Button
                size="xs"
                variant="outline"
                onClick={() => navigate(`/dashboard/assessments/${assessment.id}`)}
              >
                View
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => navigate(`/dashboard/assessments/${assessment.id}/edit`)}
              >
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AssessmentCard;