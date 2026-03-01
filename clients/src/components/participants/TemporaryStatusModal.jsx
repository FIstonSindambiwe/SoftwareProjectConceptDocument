// src/components/participants/TemporaryStatusModal.jsx
import React, { useState } from 'react';
import { 
  XMarkIcon, 
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

const TemporaryStatusModal = ({ isOpen, onClose, enrollment, participantName, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    temporary_start_date: new Date().toISOString().split('T')[0],
    expected_return_date: '',
    temporary_reason: '',
    temporary_notes: ''
  });
  const [errors, setErrors] = useState({});

  const TEMPORARY_REASONS = [
    { value: 'medical', label: 'Medical Leave' },
    { value: 'family', label: 'Family Emergency' },
    { value: 'travel', label: 'Travel' },
    { value: 'school', label: 'School Related' },
    { value: 'other', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.temporary_start_date) {
      newErrors.temporary_start_date = 'Start date is required';
    }
    
    if (!formData.expected_return_date) {
      newErrors.expected_return_date = 'Expected return date is required';
    } else {
      const startDate = new Date(formData.temporary_start_date);
      const returnDate = new Date(formData.expected_return_date);
      
      if (returnDate <= startDate) {
        newErrors.expected_return_date = 'Return date must be after start date';
      }
    }
    
    if (!formData.temporary_reason) {
      newErrors.temporary_reason = 'Please select a reason';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
      
      // Reset form after successful submission
      setFormData({
        temporary_start_date: new Date().toISOString().split('T')[0],
        expected_return_date: '',
        temporary_reason: '',
        temporary_notes: ''
      });
      onClose();
    } catch (error) {
      console.error('Error in temporary status submission:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Calculate days between dates for preview
  const calculateDaysBetween = () => {
    if (formData.temporary_start_date && formData.expected_return_date) {
      const start = new Date(formData.temporary_start_date);
      const end = new Date(formData.expected_return_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return null;
  };

  const daysUntilReturn = calculateDaysBetween();

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center">
            <ClockIcon className="h-6 w-6 text-blue-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Temporary Leave</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-lg"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Participant Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Participant</p>
            <p className="font-medium text-gray-900">{participantName || 'Unknown'}</p>
            {enrollment && (
              <>
                <p className="text-sm text-gray-600 mt-2">Program</p>
                <p className="font-medium text-gray-900">{enrollment.program_name}</p>
              </>
            )}
          </div>

          {/* Start Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave Start Date *
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="temporary_start_date"
                value={formData.temporary_start_date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.temporary_start_date ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.temporary_start_date && (
              <p className="mt-1 text-sm text-red-600">{errors.temporary_start_date}</p>
            )}
          </div>

          {/* Expected Return Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Return Date *
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="expected_return_date"
                value={formData.expected_return_date}
                onChange={handleChange}
                min={formData.temporary_start_date}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.expected_return_date ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.expected_return_date && (
              <p className="mt-1 text-sm text-red-600">{errors.expected_return_date}</p>
            )}
            
            {/* Duration Preview */}
            {daysUntilReturn !== null && (
              <p className="mt-2 text-sm text-gray-600">
                Leave duration: <span className="font-medium">{daysUntilReturn} day{daysUntilReturn !== 1 ? 's' : ''}</span>
              </p>
            )}
          </div>

          {/* Reason */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave *
            </label>
            <select
              name="temporary_reason"
              value={formData.temporary_reason}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.temporary_reason ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a reason</option>
              {TEMPORARY_REASONS.map(reason => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {errors.temporary_reason && (
              <p className="mt-1 text-sm text-red-600">{errors.temporary_reason}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <div className="relative">
              <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                name="temporary_notes"
                value={formData.temporary_notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any additional details about the temporary leave..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Info Message */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">About Temporary Leave</h4>
                <p className="text-xs text-blue-800 mt-1">
                  Temporary leave allows you to pause a participant's enrollment while they are away.
                  They will not be marked as absent during this period, and their progress will be preserved.
                  The system will remind you when they are expected to return.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                'Set Temporary Leave'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemporaryStatusModal;