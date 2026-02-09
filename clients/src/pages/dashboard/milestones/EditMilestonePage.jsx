// src/pages/dashboard/milestones/EditMilestonePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Spinner from '../../../components/common/Spinner';
import programService from '../../../services/api/programService';

const EditMilestonePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [formData, setFormData] = useState({
    program: '',
    title: '',
    description: '',
    target_date: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadMilestone();
    loadPrograms();
  }, [id]);

  const loadMilestone = async () => {
    try {
      const data = await programService.getMilestone(id);
      setFormData({
        program: data.program?.id || data.program || '',
        title: data.title || '',
        description: data.description || '',
        target_date: data.target_date || '',
      });
    } catch (error) {
      console.error('Error loading milestone:', error);
      toast.error('Failed to load milestone');
      navigate('/milestones');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrograms = async () => {
    try {
      const data = await programService.getActivePrograms();
      setPrograms(data);
    } catch (error) {
      console.error('Error loading programs:', error);
      toast.error('Failed to load programs');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.program) {
      newErrors.program = 'Program is required';
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.target_date) {
      newErrors.target_date = 'Target date is required';
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

    setIsSaving(true);
    try {
      console.log('Updating milestone data:', formData);
      const response = await programService.updateMilestone(id, formData);
      toast.success('Milestone updated successfully!');
      navigate(`/milestones/${id}`);
    } catch (error) {
      console.error('Update milestone error:', error);
      if (error.detail) {
        toast.error(error.detail);
      } else if (typeof error === 'object') {
        // Handle field-specific errors
        const fieldErrors = {};
        Object.keys(error).forEach(key => {
          if (Array.isArray(error[key])) {
            fieldErrors[key] = error[key][0];
          } else {
            fieldErrors[key] = error[key];
          }
        });
        setErrors(fieldErrors);
        toast.error('Please check the form for errors');
      } else {
        toast.error('Failed to update milestone');
      }
    } finally {
      setIsSaving(false);
    }
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              icon={ArrowLeftIcon}
              onClick={() => navigate(`/milestones/${id}`)}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Milestone
              </h1>
              <p className="text-gray-600 mt-1">
                Update milestone information
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card title="Milestone Information">
            <div className="space-y-6">
              {/* Program */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program <span className="text-red-500">*</span>
                </label>
                <select
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                  required
                >
                  <option value="">Select a program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
                {errors.program && (
                  <p className="mt-1 text-sm text-red-600">{errors.program}</p>
                )}
              </div>

              {/* Title */}
              <Input
                label="Title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                required
                placeholder="Enter milestone title"
                disabled={isSaving}
              />

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isSaving}
                  rows={4}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Describe the milestone..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              {/* Target Date */}
              <Input
                label="Target Date"
                name="target_date"
                type="date"
                value={formData.target_date}
                onChange={handleChange}
                error={errors.target_date}
                required
                disabled={isSaving}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/milestones/${id}`)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
              >
                Save Changes
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </Layout>
  );
};

export default EditMilestonePage;