// src/pages/dashboard/programs/CreateProgramPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import programService from '../../../services/api/programService';
import authService from '../../../services/api/authService';

const CreateProgramPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    start_date: '',
    end_date: '',
    target_participants: '',
    budget: '',
    funding_source: '',
    focus_areas: [],
    age_range_min: 10,
    age_range_max: 18,
    status: 'planning',
    is_active: true,
    manager: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [focusAreaInput, setFocusAreaInput] = useState('');

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await programService.getActiveLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
      toast.error('Failed to load locations');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddFocusArea = () => {
    if (focusAreaInput.trim() && !formData.focus_areas.includes(focusAreaInput.trim())) {
      setFormData(prev => ({
        ...prev,
        focus_areas: [...prev.focus_areas, focusAreaInput.trim()]
      }));
      setFocusAreaInput('');
    }
  };

  const handleRemoveFocusArea = (area) => {
    setFormData(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.filter(a => a !== area)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Program name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.target_participants || formData.target_participants < 1) {
      newErrors.target_participants = 'Target participants must be at least 1';
    }

    if (formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date cannot be before start date';
    }

    if (formData.age_range_max < formData.age_range_min) {
      newErrors.age_range_max = 'Maximum age cannot be less than minimum age';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);
    try {
      const cleanedData = {
        ...formData,
        location: parseInt(formData.location),
        target_participants: parseInt(formData.target_participants),
        age_range_min: parseInt(formData.age_range_min),
        age_range_max: parseInt(formData.age_range_max),
        budget: formData.budget ? parseFloat(formData.budget) : null,
        manager: formData.manager ? parseInt(formData.manager) : null,
        end_date: formData.end_date || null,
      };

      // Remove empty fields
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key] === '' || cleanedData[key] === null) {
          delete cleanedData[key];
        }
      });

      const newProgram = await programService.createProgram(cleanedData);
      toast.success('Program created successfully!');
      
      setTimeout(() => {
        navigate(`/programs/${newProgram.id}`);
      }, 1000);
    } catch (error) {
      console.error('Create program error:', error);
      
      if (error && typeof error === 'object') {
        const fieldErrors = {};
        Object.keys(error).forEach(key => {
          if (Array.isArray(error[key])) {
            fieldErrors[key] = error[key][0];
          } else if (typeof error[key] === 'string') {
            fieldErrors[key] = error[key];
          }
        });
        setErrors(fieldErrors);
        
        // Show specific error message
        if (error.detail) {
          toast.error(error.detail);
        } else if (Object.keys(fieldErrors).length > 0) {
          toast.error('Please fix the errors in the form');
        } else {
          toast.error('Failed to create program');
        }
      } else {
        toast.error('Failed to create program');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            icon={ArrowLeftIcon}
            onClick={() => navigate('/programs')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Program</h1>
            <p className="text-gray-500">Add a new youth development program</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card title="Basic Information">
            <div className="space-y-6">
              <Input
                label="Program Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
                placeholder="e.g., Youth Leadership Development Program"
                disabled={isLoading}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Describe the program goals and objectives"
                  required
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                  required
                >
                  <option value="">Select a location</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name} - {location.city}, {location.country}
                    </option>
                  ))}
                </select>
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Timeline & Targets */}
          <Card title="Timeline & Targets">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Start Date"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleChange}
                error={errors.start_date}
                required
                disabled={isLoading}
              />

              <Input
                label="End Date (Optional)"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                error={errors.end_date}
                disabled={isLoading}
              />

              <Input
                label="Target Participants"
                name="target_participants"
                type="number"
                min="1"
                value={formData.target_participants}
                onChange={handleChange}
                error={errors.target_participants}
                required
                placeholder="Number of participants"
                disabled={isLoading}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Age Range */}
          <Card title="Age Range">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Minimum Age"
                name="age_range_min"
                type="number"
                min="5"
                max="25"
                value={formData.age_range_min}
                onChange={handleChange}
                error={errors.age_range_min}
                disabled={isLoading}
              />

              <Input
                label="Maximum Age"
                name="age_range_max"
                type="number"
                min="5"
                max="25"
                value={formData.age_range_max}
                onChange={handleChange}
                error={errors.age_range_max}
                disabled={isLoading}
              />
            </div>
          </Card>

          {/* Budget & Funding */}
          <Card title="Budget & Funding (Optional)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Budget (USD)"
                name="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={handleChange}
                error={errors.budget}
                placeholder="0.00"
                disabled={isLoading}
              />

              <Input
                label="Funding Source"
                name="funding_source"
                value={formData.funding_source}
                onChange={handleChange}
                placeholder="e.g., UNICEF, Private Donor"
                disabled={isLoading}
              />
            </div>
          </Card>

          {/* Focus Areas */}
          <Card title="Focus Areas">
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={focusAreaInput}
                  onChange={(e) => setFocusAreaInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFocusArea())}
                  placeholder="e.g., Education, Health, Skills Training"
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddFocusArea}
                  disabled={isLoading}
                >
                  Add
                </Button>
              </div>

              {formData.focus_areas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.focus_areas.map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {area}
                      <button
                        type="button"
                        onClick={() => handleRemoveFocusArea(area)}
                        className="ml-2 hover:text-blue-900 text-lg leading-none"
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Additional Information */}
          <Card title="Additional Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 px-3 py-2"
                  placeholder="Any additional notes about this program"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Program is active and accepting enrollments
                </label>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/programs')}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Program'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateProgramPage;