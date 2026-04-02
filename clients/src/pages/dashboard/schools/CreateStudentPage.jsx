// src/pages/dashboard/schools/CreateStudentPage.jsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import schoolService from '../../../services/api/schoolService';

const CreateStudentPage = () => {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    courses: '',
    parent_name: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setGlobalError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Student name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (formData.age && (isNaN(formData.age) || formData.age < 1 || formData.age > 100))
      newErrors.age = 'Please enter a valid age';
    if (!formData.courses.trim()) newErrors.courses = 'Courses are required';
    if (!formData.parent_name.trim()) newErrors.parent_name = "Parent's name is required";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setSubmitting(true);
      await schoolService.createStudent(schoolId, {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        courses: formData.courses.trim(),
        parent_name: formData.parent_name.trim(),
      });
      setSuccess(true);
      setTimeout(() => navigate(`/dashboard/schools/${schoolId}`), 1500);
    } catch (error) {
      if (error && typeof error === 'object') {
        const fieldErrors = {};
        ['name', 'age', 'courses', 'parent_name'].forEach(field => {
          if (error[field]) {
            fieldErrors[field] = Array.isArray(error[field]) ? error[field][0] : error[field];
          }
        });
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else {
          setGlobalError(error.detail || error.message || 'Failed to add student.');
        }
      } else {
        setGlobalError('Failed to add student. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full text-center p-8">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Student Added!</h2>
            <p className="text-gray-500 text-sm">Redirecting to school...</p>
            <div className="mt-4"><Spinner size="sm" /></div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/dashboard/schools/${schoolId}`)}
            className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to School
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add Student</h1>
          <p className="text-sm text-gray-500 mt-1">Add a new student to this school</p>
        </div>

        {globalError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{globalError}</p>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6 p-2">

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-gray-400" />
                  Student Name <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Uwera Ange"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm
                  ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 15"
                min="1"
                max="100"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm
                  ${errors.age ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age}</p>}
            </div>

            {/* Courses */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                  Courses <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="text"
                name="courses"
                value={formData.courses}
                onChange={handleChange}
                placeholder="e.g. Math, Science, English"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm
                  ${errors.courses ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              <p className="mt-1 text-xs text-gray-400">Separate multiple courses with commas</p>
              {errors.courses && <p className="mt-1 text-xs text-red-600">{errors.courses}</p>}
            </div>

            {/* Parent Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4 text-gray-400" />
                  Parent's Name <span className="text-red-500">*</span>
                </div>
              </label>
              <input
                type="text"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleChange}
                placeholder="e.g. Ishimwe Passy"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm
                  ${errors.parent_name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              {errors.parent_name && <p className="mt-1 text-xs text-red-600">{errors.parent_name}</p>}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/dashboard/schools/${schoolId}`)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" /> Adding...
                  </div>
                ) : 'Add Student'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default CreateStudentPage;