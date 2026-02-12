// src/pages/dashboard/assessments/IndicatorsListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon, PencilIcon, TrashIcon, ChartBarIcon,
  CheckCircleIcon, XCircleIcon, ExclamationCircleIcon,
  ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon,
  InformationCircleIcon, ArrowPathIcon,
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
  name: '', 
  description: '', 
  category: 'academic',
  measurement_type: 'scale_1_10', 
  min_value: 0, 
  max_value: 10,
  interpretation_guide: '', 
  is_active: true,
};

const MEASUREMENT_TYPE_HELP = {
  scale_1_10: "Numeric scale where 1 is lowest and 10 is highest",
  scale_1_5: "Numeric scale where 1 is lowest and 5 is highest",
  percentage: "Score out of 100%",
  yes_no: "Yes or No outcome",
  text: "Text-based qualitative assessment",
  count: "Count of items/occurrences",
};

const CATEGORY_COLORS = {
  academic: 'blue',
  vocational: 'purple',
  life_skills: 'green',
  health_wellness: 'teal',
  leadership: 'orange',
  arts_culture: 'pink',
  sports: 'yellow',
  other: 'gray'
};

const CATEGORY_ICONS = {
  academic: '📚',
  vocational: '🛠️',
  life_skills: '🧠',
  health_wellness: '❤️',
  leadership: '👥',
  arts_culture: '🎨',
  sports: '⚽',
  other: '📌'
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

  const inputClass = (fieldName) =>
    `w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
      errors[fieldName] ? 'border-red-300 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Name - full width */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Indicator Name <span className="text-red-500">*</span>
          </label>
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            className={inputClass('name')} 
            placeholder="e.g., Reading Comprehension Level"
            autoFocus
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <ExclamationCircleIcon className="h-3 w-3" />
              {errors.name}
            </p>
          )}
        </div>
        
        {/* Description - full width */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea 
            name="description" 
            value={form.description} 
            onChange={handleChange} 
            rows={2} 
            className={inputClass('description')}
            placeholder="What does this indicator measure? How is it used?"
          />
          {errors.description && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <ExclamationCircleIcon className="h-3 w-3" />
              {errors.description}
            </p>
          )}
        </div>
        
        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass('category')}>
            {Object.entries(assessmentsService.CATEGORY_LABELS || {
              academic: 'Academic',
              vocational: 'Vocational',
              life_skills: 'Life Skills',
              health_wellness: 'Health & Wellness',
              leadership: 'Leadership',
              arts_culture: 'Arts & Culture',
              sports: 'Sports',
              other: 'Other'
            }).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        
        {/* Measurement Type with inline help */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <label className="block text-xs font-semibold text-gray-700">Measurement Type</label>
            <div className="relative group">
              <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 pointer-events-none">
                {MEASUREMENT_TYPE_HELP[form.measurement_type] || "How this indicator is measured"}
              </div>
            </div>
          </div>
          <select name="measurement_type" value={form.measurement_type} onChange={handleChange} className={inputClass('measurement_type')}>
            {Object.entries(assessmentsService.MEASUREMENT_TYPE_LABELS || {
              scale_1_10: 'Scale 1-10',
              scale_1_5: 'Scale 1-5',
              percentage: 'Percentage (%)',
              yes_no: 'Yes/No',
              text: 'Text/Notes',
              count: 'Count'
            }).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        
        {/* Min/Max Values - only show for scale/percentage/count */}
        {!['yes_no', 'text'].includes(form.measurement_type) && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Minimum Value</label>
              <input 
                type="number" 
                name="min_value" 
                value={form.min_value} 
                onChange={handleChange} 
                step="0.1" 
                className={inputClass('min_value')} 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Maximum Value</label>
              <input 
                type="number" 
                name="max_value" 
                value={form.max_value} 
                onChange={handleChange} 
                step="0.1" 
                className={inputClass('max_value')} 
              />
              {errors.max_value && (
                <p className="text-xs text-red-600 mt-1.5">{errors.max_value}</p>
              )}
            </div>
          </>
        )}
        
        {/* Yes/No helper text */}
        {form.measurement_type === 'yes_no' && (
          <div className="lg:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-blue-800">Yes/No indicator</p>
              <p className="text-xs text-blue-700">This will be recorded as Yes (passed) or No (needs improvement). No min/max values needed.</p>
            </div>
          </div>
        )}
        
        {/* Text helper text */}
        {form.measurement_type === 'text' && (
          <div className="lg:col-span-2 bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
            <InformationCircleIcon className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-purple-800">Text-based assessment</p>
              <p className="text-xs text-purple-700">This will be recorded as open-ended text feedback or observations.</p>
            </div>
          </div>
        )}
        
        {/* Interpretation Guide - full width */}
        <div className="lg:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Interpretation Guide <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea 
            name="interpretation_guide" 
            value={form.interpretation_guide} 
            onChange={handleChange} 
            rows={2}
            placeholder="e.g., 1-3: Beginner, 4-7: Intermediate, 8-10: Advanced"
            className={inputClass('interpretation_guide')} 
          />
          <p className="text-xs text-gray-500 mt-1.5">Help staff understand what each score/value means</p>
        </div>
        
        {/* Active status */}
        <div className="lg:col-span-2 flex items-center gap-3 py-2">
          <div className="relative inline-flex items-center">
            <input 
              type="checkbox" 
              name="is_active" 
              id="is_active" 
              checked={form.is_active} 
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Active <span className="text-gray-500 text-xs ml-1">(inactive indicators won't appear in new assessments)</span>
            </label>
          </div>
        </div>
      </div>
      
      {/* Form actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="md" disabled={saving}>
          {saving ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-4 w-4 mr-2" />
              {initial.id ? 'Update Indicator' : 'Create Indicator'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

// ─── Indicator Card Component ─────────────────────────────────
const IndicatorCard = ({ indicator, canEdit, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  
  const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category] || 'gray';
  };
  
  const getCategoryLabel = (category) => {
    const labels = {
      academic: 'Academic',
      vocational: 'Vocational',
      life_skills: 'Life Skills',
      health_wellness: 'Health & Wellness',
      leadership: 'Leadership',
      arts_culture: 'Arts & Culture',
      sports: 'Sports',
      other: 'Other'
    };
    return labels[category] || category;
  };
  
  const getMeasurementTypeLabel = (type) => {
    const labels = {
      scale_1_10: 'Scale 1-10',
      scale_1_5: 'Scale 1-5',
      percentage: 'Percentage',
      yes_no: 'Yes/No',
      text: 'Text',
      count: 'Count'
    };
    return labels[type] || type;
  };
  
  return (
    <Card className={`hover:shadow-md transition-all border ${!indicator.is_active ? 'border-gray-200 bg-gray-50/50' : 'border-gray-200 hover:border-blue-200'}`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className={`font-semibold text-base ${!indicator.is_active ? 'text-gray-600' : 'text-gray-900'}`}>
                {indicator.name}
              </h3>
              {indicator.is_active ? (
                <Badge color="green" size="sm" className="flex items-center gap-1">
                  <CheckCircleIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">Active</span>
                </Badge>
              ) : (
                <Badge color="gray" size="sm" className="flex items-center gap-1">
                  <XCircleIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">Inactive</span>
                </Badge>
              )}
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge color={getCategoryColor(indicator.category)} size="sm" className="px-2.5 py-1">
                {indicator.category_display || getCategoryLabel(indicator.category)}
              </Badge>
              <Badge color="gray" size="sm" className="px-2.5 py-1">
                {getMeasurementTypeLabel(indicator.measurement_type)}
              </Badge>
              {!['yes_no', 'text'].includes(indicator.measurement_type) && (
                <Badge color="blue" size="sm" className="px-2.5 py-1">
                  {indicator.min_value} – {indicator.max_value}
                </Badge>
              )}
            </div>
            
            {/* Description - truncated or full */}
            <p className={`text-sm text-gray-600 ${!expanded ? 'line-clamp-2' : ''}`}>
              {indicator.description}
            </p>
            
            {/* Expand/collapse toggle for long descriptions */}
            {indicator.description?.length > 100 && (
              <button 
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1.5 flex items-center gap-1"
              >
                {expanded ? (
                  <>Show less <ChevronUpIcon className="h-3 w-3" /></>
                ) : (
                  <>Read more <ChevronDownIcon className="h-3 w-3" /></>
                )}
              </button>
            )}
            
            {/* Interpretation guide */}
            {indicator.interpretation_guide && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-start gap-1.5">
                  <InformationCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Interpretation</p>
                    <p className="text-xs text-gray-600 mt-0.5">{indicator.interpretation_guide}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Action buttons - icon-only for cleaner UI */}
          {canEdit && (
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onEdit(indicator)}
                iconOnly
                className="text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                title="Edit indicator"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                iconOnly
                className="text-red-600 hover:bg-red-50 hover:border-red-200"
                onClick={() => onDelete(indicator)}
                title="Delete indicator"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const IndicatorsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role !== 'donor' && user?.role !== 'viewer';

  const [indicators, setIndicators] = useState([]);
  const [filteredIndicators, setFilteredIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // UI state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [deletingIndicator, setDeletingIndicator] = useState(null);
  
  // Form state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Filters & search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'

  // Load indicators
  const loadIndicators = async (showSuccessMessage = false) => {
    try {
      setLoading(true);
      const data = await assessmentsService.getIndicators();
      const indicatorsList = data.results ?? data ?? [];
      setIndicators(indicatorsList);
      setError('');
      
      if (showSuccessMessage) {
        setSuccessMessage('Indicators updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setError('Unable to load indicators. Please try again.');
      console.error('Error loading indicators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIndicators();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...indicators];
    
    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter(i => i.category === filterCategory);
    }
    
    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(i => i.is_active === true);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(i => i.is_active === false);
    }
    
    // Search by name or description
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.name.toLowerCase().includes(term) || 
        i.description.toLowerCase().includes(term) ||
        (i.interpretation_guide?.toLowerCase().includes(term))
      );
    }
    
    setFilteredIndicators(filtered);
  }, [indicators, filterCategory, filterStatus, searchTerm]);

  // Create handler
  const handleCreate = async (formData) => {
    try {
      setSaving(true);
      await assessmentsService.createIndicator(formData);
      setShowCreateForm(false);
      setSuccessMessage('Indicator created successfully!');
      await loadIndicators(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to create indicator. Please check all fields.');
      console.error('Error creating indicator:', err);
    } finally {
      setSaving(false);
    }
  };

  // Edit handler
  const handleEdit = async (formData) => {
    try {
      setSaving(true);
      await assessmentsService.updateIndicator(editingIndicator.id, formData);
      setEditingIndicator(null);
      setSuccessMessage('Indicator updated successfully!');
      await loadIndicators(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to update indicator.');
      console.error('Error updating indicator:', err);
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deletingIndicator) return;
    
    try {
      setDeleting(true);
      await assessmentsService.deleteIndicator(deletingIndicator.id);
      setDeletingIndicator(null);
      setSuccessMessage(`"${deletingIndicator.name}" has been removed`);
      await loadIndicators(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Cannot delete: This indicator may be used in existing assessments.');
      console.error('Error deleting indicator:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterStatus('all');
  };

  // Get counts for stats
  const totalCount = indicators.length;
  const activeCount = indicators.filter(i => i.is_active).length;
  const inactiveCount = totalCount - activeCount;

  // Category labels for filter
  const categoryLabels = {
    academic: 'Academic',
    vocational: 'Vocational',
    life_skills: 'Life Skills',
    health_wellness: 'Health & Wellness',
    leadership: 'Leadership',
    arts_culture: 'Arts & Culture',
    sports: 'Sports',
    other: 'Other'
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm mb-2">
                <button 
                  onClick={() => navigate('/dashboard/assessments')} 
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Assessments
                </button>
                <span className="text-gray-400">/</span>
                <span className="text-gray-700 font-medium">Indicators</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ChartBarIcon className="h-7 w-7 text-blue-500" />
                Indicators (KPIs)
              </h1>
              <p className="text-sm text-gray-600 mt-1.5 max-w-2xl">
                Define and manage the metrics used to track participant progress and program outcomes.
                {canEdit && ' You can create, edit, or archive indicators as needed.'}
              </p>
            </div>
            
            {/* Responsive New Indicator Button */}
            {canEdit && !showCreateForm && !editingIndicator && (
              <>
                {/* Desktop version with text */}
                <Button 
                  onClick={() => {
                    setShowCreateForm(true);
                    setEditingIndicator(null);
                  }}
                  size="lg"
                  className="hidden sm:inline-flex shadow-sm"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Indicator
                </Button>
                
                {/* Mobile icon-only version */}
                <Button
                  onClick={() => {
                    setShowCreateForm(true);
                    setEditingIndicator(null);
                  }}
                  size="md"
                  iconOnly
                  className="sm:hidden"
                  title="New Indicator"
                >
                  <PlusIcon className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            </div>
            <div className="text-center border-x border-gray-100">
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-400">{inactiveCount}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Inactive</p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700"
              title="Dismiss"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700 mt-0.5">{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage('')}
              className="text-green-500 hover:text-green-700"
              title="Dismiss"
            >
              <XCircleIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Create Form (inline) */}
        {showCreateForm && canEdit && (
          <Card className="border-2 border-blue-200 shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 p-1 rounded-lg">
                  <PlusIcon className="h-5 w-5" />
                </span>
                Create New Indicator
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                iconOnly
                onClick={() => setShowCreateForm(false)}
                className="text-gray-500"
                title="Cancel"
              >
                <XCircleIcon className="h-5 w-5" />
              </Button>
            </div>
            <IndicatorForm 
              onSave={handleCreate} 
              onCancel={() => setShowCreateForm(false)} 
              saving={saving} 
            />
          </Card>
        )}

        {/* Edit Form (inline) */}
        {editingIndicator && !showCreateForm && canEdit && (
          <Card className="border-2 border-amber-200 bg-amber-50/30 shadow-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="bg-amber-100 text-amber-800 p-1 rounded-lg">
                  <PencilIcon className="h-5 w-5" />
                </span>
                Editing: {editingIndicator.name}
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                iconOnly
                onClick={() => setEditingIndicator(null)}
                className="text-gray-500"
                title="Cancel"
              >
                <XCircleIcon className="h-5 w-5" />
              </Button>
            </div>
            <IndicatorForm
              initial={editingIndicator}
              onSave={handleEdit}
              onCancel={() => setEditingIndicator(null)}
              saving={saving}
            />
          </Card>
        )}

        {/* Filters & Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search indicators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
          
          {/* Category Filters - Responsive with icons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-medium text-gray-500 mr-1 hidden sm:inline">Filter by category:</span>
            <button
              onClick={() => setFilterCategory('')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                !filterCategory 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="All categories"
            >
              <span className="sm:hidden">📋</span>
              <span>All</span>
            </button>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setFilterCategory(k)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  filterCategory === k 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={v}
              >
                <span className="sm:hidden">{CATEGORY_ICONS[k]}</span>
                <span>{v}</span>
              </button>
            ))}
            
            {/* Clear filters button */}
            {(searchTerm || filterCategory || filterStatus !== 'all') && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <XCircleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Clear filters</span>
              </button>
            )}
          </div>
          
          {/* Results count and refresh */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredIndicators.length}</span> of <span className="font-medium">{indicators.length}</span>
            </p>
            <button 
              onClick={() => loadIndicators(false)} 
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
              disabled={loading}
              title="Refresh"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Indicators Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-200">
            <div className="relative">
              <Spinner size="lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ChartBarIcon className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-700 mt-6">Loading indicators...</p>
            <p className="text-xs text-gray-500 mt-1">Please wait while we fetch your data</p>
          </div>
        ) : filteredIndicators.length === 0 ? (
          <Card className="text-center py-16">
            <div className="max-w-sm mx-auto">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No indicators found</h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchTerm || filterCategory || filterStatus !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by creating your first performance indicator'}
              </p>
              
              {(searchTerm || filterCategory || filterStatus !== 'all') ? (
                <Button variant="outline" onClick={clearFilters}>
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Clear all filters
                </Button>
              ) : canEdit ? (
                <Button onClick={() => setShowCreateForm(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Indicator
                </Button>
              ) : null}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredIndicators.map((indicator) => (
              <IndicatorCard
                key={indicator.id}
                indicator={indicator}
                canEdit={canEdit && !editingIndicator && !showCreateForm}
                onEdit={(ind) => {
                  setEditingIndicator(ind);
                  setShowCreateForm(false);
                }}
                onDelete={setDeletingIndicator}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!deletingIndicator} 
        onClose={() => !deleting && setDeletingIndicator(null)} 
        title="Delete Indicator"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
              <ExclamationCircleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                Delete "{deletingIndicator?.name}"?
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone. If this indicator is currently used in any assessments, 
                you will need to remove those associations first.
              </p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <InformationCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Tip:</span> You can also deactivate indicators instead of deleting them. 
                Deactivated indicators won't appear in new assessments but existing data is preserved.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setDeletingIndicator(null)} 
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete} 
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default IndicatorsListPage;