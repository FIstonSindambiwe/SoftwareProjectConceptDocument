// src/pages/dashboard/assessments/CreateAssessmentPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, XMarkIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import assessmentsService from '../../../services/api/assessmentsService';
import programService from '../../../services/api/programService';
import participantService from '../../../services/api/participantService';

const EMPTY_FORM = {
  participant: '',
  program: '',
  indicator: '',
  assessment_date: new Date().toISOString().split('T')[0],
  score: '',
  assessment_type: 'progress',
  notes: '',
};

const AssessmentForm = ({ initialData = EMPTY_FORM, onSubmit, saving, submitLabel = 'Save Assessment' }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [participants, setParticipants] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [selectedIndicator, setSelectedIndicator] = useState(null);

  useEffect(() => {
    const load = async () => {
      const [p, pr, ind] = await Promise.all([
        participantService.getParticipants({ is_active: true }),
        programService.getPrograms(),
        assessmentsService.getActiveIndicators(),
      ]);
      setParticipants(p.results ?? p ?? []);
      setPrograms(pr.results ?? pr ?? []);
      setIndicators(ind.results ?? ind ?? []);
    };
    load();
  }, []);

  // Update selected indicator when form.indicator changes
  useEffect(() => {
    if (form.indicator) {
      const ind = indicators.find((i) => String(i.id) === String(form.indicator));
      setSelectedIndicator(ind || null);
    } else {
      setSelectedIndicator(null);
    }
  }, [form.indicator, indicators]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.participant) newErrors.participant = 'Participant is required';
    if (!form.program) newErrors.program = 'Program is required';
    if (!form.indicator) newErrors.indicator = 'Indicator is required';
    if (!form.assessment_date) newErrors.assessment_date = 'Date is required';
    if (form.score === '' || form.score === null) {
      newErrors.score = 'Score is required';
    } else if (selectedIndicator) {
      const s = parseFloat(form.score);
      if (isNaN(s)) {
        newErrors.score = 'Score must be a number';
      } else if (s < selectedIndicator.min_value || s > selectedIndicator.max_value) {
        newErrors.score = `Score must be between ${selectedIndicator.min_value} and ${selectedIndicator.max_value}`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const inputClass = (field) =>
    `w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      errors[field] ? 'border-red-300' : 'border-gray-300'
    }`;

  const FieldError = ({ field }) =>
    errors[field] ? <p className="text-xs text-red-600 mt-1">{errors[field]}</p> : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Who & Where */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Participant & Program</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Participant *</label>
            <select name="participant" value={form.participant} onChange={handleChange} className={inputClass('participant')} disabled={saving}>
              <option value="">Select Participant</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.participant_id}{p.full_name ? ` · ${p.full_name}` : ''}
                </option>
              ))}
            </select>
            <FieldError field="participant" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
            <select name="program" value={form.program} onChange={handleChange} className={inputClass('program')} disabled={saving}>
              <option value="">Select Program</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <FieldError field="program" />
          </div>
        </div>
      </Card>

      {/* Indicator & Score */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Indicator & Score</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Indicator (KPI) *</label>
            <select name="indicator" value={form.indicator} onChange={handleChange} className={inputClass('indicator')} disabled={saving}>
              <option value="">Select Indicator</option>
              {Object.entries(
                indicators.reduce((acc, ind) => {
                  const cat = ind.category_display || ind.category;
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(ind);
                  return acc;
                }, {})
              ).map(([category, items]) => (
                <optgroup key={category} label={category}>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <FieldError field="indicator" />
          </div>

          {selectedIndicator && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-800 space-y-1">
              <div className="font-medium">{selectedIndicator.name}</div>
              <div>Range: {selectedIndicator.min_value} – {selectedIndicator.max_value}</div>
              {selectedIndicator.description && <div>{selectedIndicator.description}</div>}
              {selectedIndicator.interpretation_guide && (
                <div className="mt-1 text-blue-700">{selectedIndicator.interpretation_guide}</div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score *
                {selectedIndicator && (
                  <span className="font-normal text-gray-500 ml-1">
                    ({selectedIndicator.min_value} – {selectedIndicator.max_value})
                  </span>
                )}
              </label>
              <input
                type="number"
                name="score"
                value={form.score}
                onChange={handleChange}
                step="0.1"
                min={selectedIndicator?.min_value}
                max={selectedIndicator?.max_value}
                className={inputClass('score')}
                disabled={saving}
                placeholder="Enter score"
              />
              <FieldError field="score" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type *</label>
              <select name="assessment_type" value={form.assessment_type} onChange={handleChange} className={inputClass('assessment_type')} disabled={saving}>
                {Object.entries(assessmentsService.ASSESSMENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Date & Notes */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Date & Notes</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Date *</label>
            <input
              type="date"
              name="assessment_date"
              value={form.assessment_date}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className={inputClass('assessment_date')}
              disabled={saving}
            />
            <FieldError field="assessment_date" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={4}
              placeholder="Observations, context, or anything relevant to this assessment…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>
          <XMarkIcon className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <><Spinner size="sm" className="mr-2" />Saving…</>
          ) : (
            <><CheckIcon className="h-4 w-4 mr-2" />{submitLabel}</>
          )}
        </Button>
      </div>
    </form>
  );
};

// ─── Create Page ─────────────────────────────────────────────
const CreateAssessmentPage = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      setError('');
      await assessmentsService.createAssessment(formData);
      setSuccess('Assessment recorded successfully!');
      setTimeout(() => navigate('/dashboard/assessments'), 1200);
    } catch (err) {
      setError(err?.message || 'Failed to create assessment. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/assessments')}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">New Assessment</h1>
          <p className="text-sm text-gray-500 mt-1">Record a participant assessment</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center gap-3">
            <CheckIcon className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <AssessmentForm onSubmit={handleSubmit} saving={saving} submitLabel="Create Assessment" />
      </div>
    </Layout>
  );
};

export { AssessmentForm };
export default CreateAssessmentPage;