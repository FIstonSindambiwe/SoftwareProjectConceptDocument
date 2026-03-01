// src/components/participants/ScholarshipModal.jsx
import React, { useState } from 'react';
import { 
  XMarkIcon, 
  GiftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

const ScholarshipModal = ({ isOpen, onClose, enrollment, participantName, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scholarship_type: '',
    scholarship_amount: '',
    scholarship_provider: '',
    scholarship_date: new Date().toISOString().split('T')[0],
    scholarship_notes: ''
  });
  const [errors, setErrors] = useState({});

  const SCHOLARSHIP_TYPES = [
    { value: 'full', label: 'Full Scholarship' },
    { value: 'partial', label: 'Partial Scholarship' },
    { value: 'merit', label: 'Merit-Based Scholarship' },
    { value: 'need', label: 'Need-Based Scholarship' },
    { value: 'vocational', label: 'Vocational Training Scholarship' },
    { value: 'university', label: 'University Scholarship' },
    { value: 'other', label: 'Other Scholarship' }
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
    
    if (!formData.scholarship_type) {
      newErrors.scholarship_type = 'Please select a scholarship type';
    }
    
    if (formData.scholarship_amount && isNaN(parseFloat(formData.scholarship_amount))) {
      newErrors.scholarship_amount = 'Please enter a valid amount';
    }
    
    if (!formData.scholarship_date) {
      newErrors.scholarship_date = 'Award date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Format data for submission
      const submitData = {
        ...formData,
        scholarship_amount: formData.scholarship_amount ? parseFloat(formData.scholarship_amount) : null
      };
      
      await onSubmit(submitData);
      
      // Reset form after successful submission
      setFormData({
        scholarship_type: '',
        scholarship_amount: '',
        scholarship_provider: '',
        scholarship_date: new Date().toISOString().split('T')[0],
        scholarship_notes: ''
      });
      onClose();
    } catch (error) {
      console.error('Error in scholarship submission:', error);
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
            <GiftIcon className="h-6 w-6 text-yellow-500 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Award Scholarship</h3>
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

          {/* Scholarship Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scholarship Type *
            </label>
            <select
              name="scholarship_type"
              value={formData.scholarship_type}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.scholarship_type ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select scholarship type</option>
              {SCHOLARSHIP_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.scholarship_type && (
              <p className="mt-1 text-sm text-red-600">{errors.scholarship_type}</p>
            )}
          </div>

          {/* Scholarship Amount */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (USD)
            </label>
            <div className="relative">
              <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                name="scholarship_amount"
                value={formData.scholarship_amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.scholarship_amount ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.scholarship_amount && (
              <p className="mt-1 text-sm text-red-600">{errors.scholarship_amount}</p>
            )}
          </div>

          {/* Scholarship Provider */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider / Organization
            </label>
            <div className="relative">
              <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="scholarship_provider"
                value={formData.scholarship_provider}
                onChange={handleChange}
                placeholder="e.g., ABC Foundation, Government, etc."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Award Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Award Date *
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="date"
                name="scholarship_date"
                value={formData.scholarship_date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.scholarship_date ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
            </div>
            {errors.scholarship_date && (
              <p className="mt-1 text-sm text-red-600">{errors.scholarship_date}</p>
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
                name="scholarship_notes"
                value={formData.scholarship_notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any additional details about the scholarship..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Success Message */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <GiftIcon className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-green-900">Scholarship Benefits</h4>
                <p className="text-xs text-green-800 mt-1">
                  Awarding a scholarship helps track funding sources and can be used for reporting to donors.
                  This information will appear on the participant's record and in reports.
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
                  Awarding...
                </>
              ) : (
                'Award Scholarship'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScholarshipModal;