// src/components/participants/DropoutModal.jsx
import React, { useState } from 'react';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

const DropoutModal = ({ isOpen, onClose, enrollment, participantName, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dropout_date: new Date().toISOString().split('T')[0],
    dropout_reason: '',
    dropout_notes: ''
  });
  const [errors, setErrors] = useState({});

  const DROPOUT_REASONS = [
    { value: 'dropout_personal', label: 'Dropout - Personal Reasons' },
    { value: 'dropout_financial', label: 'Dropout - Financial Difficulties' },
    { value: 'dropout_relocation', label: 'Dropout - Family Relocation' },
    { value: 'dropout_health', label: 'Dropout - Health Issues' },
    { value: 'dropout_behavior', label: 'Dropout - Behavioral Issues' },
    { value: 'transferred', label: 'Transferred to Another Program' },
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
    
    if (!formData.dropout_date) {
      newErrors.dropout_date = 'Dropout date is required';
    }
    
    if (!formData.dropout_reason) {
      newErrors.dropout_reason = 'Please select a dropout reason';
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
        dropout_date: new Date().toISOString().split('T')[0],
        dropout_reason: '',
        dropout_notes: ''
      });
    } catch (error) {
      console.error('Error in dropout submission:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Record Dropout</h3>
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

          {/* Dropout Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dropout Date *
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="dropout_date"
                value={formData.dropout_date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.dropout_date ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.dropout_date && (
              <p className="mt-1 text-sm text-red-600">{errors.dropout_date}</p>
            )}
          </div>

          {/* Dropout Reason */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dropout Reason *
            </label>
            <select
              name="dropout_reason"
              value={formData.dropout_reason}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.dropout_reason ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a reason</option>
              {DROPOUT_REASONS.map(reason => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
            {errors.dropout_reason && (
              <p className="mt-1 text-sm text-red-600">{errors.dropout_reason}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <div className="relative">
              <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                name="dropout_notes"
                value={formData.dropout_notes}
                onChange={handleChange}
                rows="4"
                placeholder="Any additional details about the dropout..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Warning */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-900">Important</h4>
                <p className="text-xs text-yellow-800 mt-1">
                  Recording a dropout will mark this enrollment as dropped out. 
                  This action can be reviewed but cannot be easily undone. 
                  Make sure you have the correct information before proceeding.
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
              variant="danger"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Recording...
                </>
              ) : (
                'Record Dropout'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DropoutModal;