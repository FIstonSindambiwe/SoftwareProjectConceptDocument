// src/pages/dashboard/assessments/AssessmentEditPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import { AssessmentForm } from './CreateAssessmentPage';
import assessmentsService from '../../../services/api/assessmentsService';

const AssessmentEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await assessmentsService.getAssessment(id);
        setInitial({
          participant:     data.participant,
          program:         data.program,
          indicator:       data.indicator,
          assessment_date: data.assessment_date,
          score:           data.score,
          assessment_type: data.assessment_type,
          notes:           data.notes || '',
        });
      } catch {
        setError('Failed to load assessment record.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setError('');
      await assessmentsService.updateAssessment(id, formData);
      setSuccess('Assessment updated successfully!');
      setTimeout(() => navigate(`/dashboard/assessments/${id}`), 1200);
    } catch (err) {
      setError(err?.message || 'Failed to update. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <Spinner size="lg" />
          <p className="text-sm text-gray-500 mt-4">Loading assessment…</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/assessments/${id}`)}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Assessment</h1>
          <p className="text-sm text-gray-500 mt-1">Update assessment record #{id}</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-3">
            <CheckIcon className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">{success} Redirecting…</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {initial && (
          <AssessmentForm
            initialData={initial}
            onSubmit={handleSubmit}
            saving={saving}
            submitLabel="Save Changes"
          />
        )}
      </div>
    </Layout>
  );
};

export default AssessmentEditPage;