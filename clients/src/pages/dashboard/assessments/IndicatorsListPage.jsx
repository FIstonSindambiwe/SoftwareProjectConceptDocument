// src/pages/dashboard/assessments/IndicatorsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon, PencilIcon, TrashIcon, ChartBarIcon,
  CheckCircleIcon, XCircleIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import Modal from '../../../components/common/Modal';
import assessmentsService from '../../../services/api/assessmentsService';
import useAuth from '../../../hooks/useAuth';

// ─── Inline create / edit form ────────────────────────────────
const EMPTY = {
  name: '', description: '', category: 'academic',
  measurement_type: 'scale_1_10', min_value: 0, max_value: 10,
  interpretation_guide: '', is_active: true,
};

const IndicatorForm = ({ initial = EMPTY, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (parseFloat(form.max_value) <= parseFloat(form.min_value))
      e.max_value = 'Max value must be greater than min value';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (validate()) onSave(form);
  };

  const inputClass = (f) =>
    `w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 ${
      errors[f] ? 'border-red-300' : 'border-gray-300'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
          <input name="name" value={form.name} onChange={handleChange} className={inputClass('name')} placeholder="e.g., Reading Level" />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={2} className={inputClass('description')} />
          {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass('category')}>
            {Object.entries(assessmentsService.CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Measurement Type</label>
          <select name="measurement_type" value={form.measurement_type} onChange={handleChange} className={inputClass('measurement_type')}>
            {Object.entries(assessmentsService.MEASUREMENT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Min Value</label>
          <input type="number" name="min_value" value={form.min_value} onChange={handleChange} step="0.1" className={inputClass('min_value')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Max Value</label>
          <input type="number" name="max_value" value={form.max_value} onChange={handleChange} step="0.1" className={inputClass('max_value')} />
          {errors.max_value && <p className="text-xs text-red-600 mt-1">{errors.max_value}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Interpretation Guide</label>
          <textarea name="interpretation_guide" value={form.interpretation_guide} onChange={handleChange} rows={2}
            placeholder="e.g., 1–3 = Below average, 4–7 = Average, 8–10 = Above average"
            className={inputClass('interpretation_guide')} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_active" id="is_active" checked={form.is_active} onChange={handleChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
          <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? <><Spinner size="sm" className="mr-2" />Saving…</> : 'Save Indicator'}
        </Button>
      </div>
    </form>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const IndicatorsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role !== 'donor';

  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await assessmentsService.getIndicators();
      setIndicators(data.results ?? data ?? []);
    } catch { setError('Failed to load indicators.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (form) => {
    try {
      setSaving(true);
      await assessmentsService.createIndicator(form);
      setShowCreate(false);
      load();
    } catch (err) { setError(err?.message || 'Failed to create indicator.'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (form) => {
    try {
      setSaving(true);
      await assessmentsService.updateIndicator(editTarget.id, form);
      setEditTarget(null);
      load();
    } catch (err) { setError(err?.message || 'Failed to update indicator.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await assessmentsService.deleteIndicator(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) { setError(err?.message || 'Failed to delete. It may have assessments linked to it.'); }
    finally { setDeleting(false); }
  };

  const filtered = filterCategory
    ? indicators.filter((i) => i.category === filterCategory)
    : indicators;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => navigate('/dashboard/assessments')} className="text-sm text-blue-600 hover:underline">
                Assessments
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-700">Indicators</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Indicators (KPIs)</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage the metrics used to track participant development</p>
          </div>
          {canEdit && (
            <Button onClick={() => { setShowCreate(true); setEditTarget(null); }}>
              <PlusIcon className="h-4 w-4 mr-2" />
              New Indicator
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Create form */}
        {showCreate && canEdit && (
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">New Indicator</h2>
            <IndicatorForm onSave={handleCreate} onCancel={() => setShowCreate(false)} saving={saving} />
          </Card>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCategory('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !filterCategory ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {Object.entries(assessmentsService.CATEGORY_LABELS).map(([k, v]) => (
            <button
              key={k}
              onClick={() => setFilterCategory(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterCategory === k ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500 mt-4">Loading indicators…</p>
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">No indicators found</p>
              {canEdit && (
                <Button onClick={() => setShowCreate(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Indicator
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((ind) => (
              <Card key={ind.id} className={`hover:shadow-md transition-shadow ${!ind.is_active ? 'opacity-60' : ''}`}>
                {editTarget?.id === ind.id ? (
                  <>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Editing: {ind.name}</h3>
                    <IndicatorForm
                      initial={editTarget}
                      onSave={handleEdit}
                      onCancel={() => setEditTarget(null)}
                      saving={saving}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">{ind.name}</span>
                          {ind.is_active
                            ? <Badge color="green" size="sm"><CheckCircleIcon className="h-3 w-3 mr-1" />Active</Badge>
                            : <Badge color="gray" size="sm"><XCircleIcon className="h-3 w-3 mr-1" />Inactive</Badge>
                          }
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge color={assessmentsService.getCategoryColor(ind.category)} size="sm">
                            {ind.category_display || assessmentsService.getCategoryLabel(ind.category)}
                          </Badge>
                          <Badge color="gray" size="sm">
                            {assessmentsService.getMeasurementTypeLabel(ind.measurement_type)}
                          </Badge>
                          <Badge color="blue" size="sm">
                            {ind.min_value} – {ind.max_value}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{ind.description}</p>
                        {ind.interpretation_guide && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">{ind.interpretation_guide}</p>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 flex-shrink-0">
                          <Button size="xs" variant="outline" onClick={() => setEditTarget(ind)}>
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="xs"
                            variant="outline"
                            className="text-red-500 hover:bg-red-50"
                            onClick={() => setDeleteTarget(ind)}
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Indicator">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">
              Delete indicator <strong>"{deleteTarget?.name}"</strong>?
              This will fail if assessments are linked to it.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><Spinner size="sm" className="mr-2" />Deleting…</> : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default IndicatorsListPage;