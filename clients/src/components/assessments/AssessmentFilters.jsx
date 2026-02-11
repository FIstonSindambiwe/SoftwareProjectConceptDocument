// src/components/assessments/AssessmentFilters.jsx
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';
import assessmentsService from '../../services/api/assessmentsService';

const AssessmentFilters = ({
  filters,
  programs = [],
  indicators = [],
  participants = [],
  onChange,
  onClear,
  activeCount = 0,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ ...filters, [name]: value });
  };

  const selectClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            name="search"
            value={filters.search || ''}
            onChange={handleChange}
            placeholder="Search by participant ID, name, or indicator…"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Program */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Program</label>
          <select name="program" value={filters.program || ''} onChange={handleChange} className={selectClass}>
            <option value="">All Programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Indicator */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Indicator (KPI)</label>
          <select name="indicator" value={filters.indicator || ''} onChange={handleChange} className={selectClass}>
            <option value="">All Indicators</option>
            {indicators.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>

        {/* Assessment Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Assessment Type</label>
          <select name="assessmentType" value={filters.assessmentType || ''} onChange={handleChange} className={selectClass}>
            <option value="">All Types</option>
            {Object.entries(assessmentsService.ASSESSMENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
          <select name="category" value={filters.category || ''} onChange={handleChange} className={selectClass}>
            <option value="">All Categories</option>
            {Object.entries(assessmentsService.CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
          <input
            type="date"
            name="dateFrom"
            value={filters.dateFrom || ''}
            onChange={handleChange}
            className={selectClass}
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
          <input
            type="date"
            name="dateTo"
            value={filters.dateTo || ''}
            onChange={handleChange}
            className={selectClass}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t">
        <p className="text-xs text-gray-500">
          {activeCount > 0
            ? `${activeCount} filter${activeCount !== 1 ? 's' : ''} applied`
            : 'No filters applied'}
        </p>
        {activeCount > 0 && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
};

export default AssessmentFilters;