// src/services/api/assessmentsService.js
import apiClient from './axiosConfig';

/**
 * Assessments Service
 * Handles all API calls for Indicators (KPIs) and Assessments
 *
 * Endpoints:
 *   Indicators:  /api/v1/indicators/
 *   Assessments: /api/v1/assessments/
 */

// ─────────────────────────────────────────────────────────────
// INDICATOR ENDPOINTS
// ─────────────────────────────────────────────────────────────

const getIndicators = async (params = {}) => {
  const response = await apiClient.get('/indicators/', { params });
  return response.data;
};

const getActiveIndicators = async () => {
  const response = await apiClient.get('/indicators/active/');
  return response.data;
};

const getIndicator = async (id) => {
  const response = await apiClient.get(`/indicators/${id}/`);
  return response.data;
};

const createIndicator = async (data) => {
  const response = await apiClient.post('/indicators/', data);
  return response.data;
};

const updateIndicator = async (id, data) => {
  const response = await apiClient.put(`/indicators/${id}/`, data);
  return response.data;
};

const patchIndicator = async (id, data) => {
  const response = await apiClient.patch(`/indicators/${id}/`, data);
  return response.data;
};

const deleteIndicator = async (id) => {
  await apiClient.delete(`/indicators/${id}/`);
};

const getIndicatorAssessments = async (id, params = {}) => {
  const response = await apiClient.get(`/indicators/${id}/assessments/`, { params });
  return response.data;
};

// ─────────────────────────────────────────────────────────────
// ASSESSMENT ENDPOINTS
// ─────────────────────────────────────────────────────────────

const getAssessments = async (params = {}) => {
  const response = await apiClient.get('/assessments/', { params });
  return response.data;
};

const getAssessment = async (id) => {
  const response = await apiClient.get(`/assessments/${id}/`);
  return response.data;
};

const createAssessment = async (data) => {
  const response = await apiClient.post('/assessments/', data);
  return response.data;
};

const updateAssessment = async (id, data) => {
  const response = await apiClient.put(`/assessments/${id}/`, data);
  return response.data;
};

const patchAssessment = async (id, data) => {
  const response = await apiClient.patch(`/assessments/${id}/`, data);
  return response.data;
};

const deleteAssessment = async (id) => {
  await apiClient.delete(`/assessments/${id}/`);
};

const getAssessmentStats = async (params = {}) => {
  const response = await apiClient.get('/assessments/stats/', { params });
  return response.data;
};

// ─────────────────────────────────────────────────────────────
// CONVENIENCE FILTERS
// ─────────────────────────────────────────────────────────────

/**
 * Get all assessments for a single participant, newest first
 * @param {number|string} participantId - database pk
 * @param {object} extra - additional filters (e.g. { indicator, assessment_type })
 */
const getParticipantAssessments = async (participantId, extra = {}) => {
  const response = await apiClient.get('/assessments/', {
    params: { participant: participantId, ordering: '-assessment_date', ...extra },
  });
  return response.data;
};

/**
 * Get baseline vs final scores for a participant on one indicator
 */
const getParticipantProgress = async (participantId, indicatorId) => {
  const [baseline, final] = await Promise.all([
    apiClient.get('/assessments/', {
      params: { participant: participantId, indicator: indicatorId, assessment_type: 'baseline' },
    }),
    apiClient.get('/assessments/', {
      params: { participant: participantId, indicator: indicatorId, assessment_type: 'final' },
    }),
  ]);

  const baselineData = baseline.data.results || baseline.data || [];
  const finalData = final.data.results || final.data || [];

  const baselineScore = baselineData.length > 0 ? baselineData[0].score : null;
  const finalScore   = finalData.length > 0   ? finalData[0].score   : null;

  return {
    participantId,
    indicatorId,
    baselineScore,
    finalScore,
    improvement:
      baselineScore !== null && finalScore !== null
        ? +(finalScore - baselineScore).toFixed(2)
        : null,
    hasBaseline: baselineScore !== null,
    hasFinal:    finalScore !== null,
  };
};

/**
 * Get all assessments for a program, optionally filtered by indicator
 */
const getProgramAssessments = async (programId, extra = {}) => {
  const response = await apiClient.get('/assessments/', {
    params: { program: programId, ordering: '-assessment_date', ...extra },
  });
  return response.data;
};

/**
 * Get stats for a specific program and indicator combination
 */
const getProgramIndicatorStats = async (programId, indicatorId) => {
  const response = await apiClient.get('/assessments/stats/', {
    params: { program: programId, indicator: indicatorId },
  });
  return response.data;
};

/**
 * Get assessments within a date range
 */
const getAssessmentsByDateRange = async (dateFrom, dateTo, extra = {}) => {
  const response = await apiClient.get('/assessments/', {
    params: { date_from: dateFrom, date_to: dateTo, ordering: '-assessment_date', ...extra },
  });
  return response.data;
};

// ─────────────────────────────────────────────────────────────
// DISPLAY / HELPER UTILITIES
// ─────────────────────────────────────────────────────────────

/**
 * Category label map (mirrors CATEGORY_CHOICES on the backend)
 */
const CATEGORY_LABELS = {
  academic:    'Academic Skills',
  social:      'Social-Emotional Development',
  physical:    'Physical Development',
  vocational:  'Vocational Skills',
  life_skills: 'Life Skills',
  other:       'Other',
};

/**
 * Measurement type label map
 */
const MEASUREMENT_TYPE_LABELS = {
  scale_1_10:  'Scale (1–10)',
  scale_1_5:   'Scale (1–5)',
  percentage:  'Percentage (0–100)',
  binary:      'Pass / Fail',
  score:       'Raw Score',
};

/**
 * Assessment type label map
 */
const ASSESSMENT_TYPE_LABELS = {
  baseline: 'Baseline',
  progress: 'Progress Check',
  midterm:  'Midterm',
  final:    'Final',
};

/**
 * Assessment type badge color (matches your Badge component color prop)
 */
const ASSESSMENT_TYPE_COLORS = {
  baseline: 'blue',
  progress: 'green',
  midterm:  'yellow',
  final:    'purple',
};

/**
 * Category badge colors
 */
const CATEGORY_COLORS = {
  academic:    'blue',
  social:      'green',
  physical:    'orange',
  vocational:  'purple',
  life_skills: 'yellow',
  other:       'gray',
};

/**
 * Return a human-readable label for a category key
 */
const getCategoryLabel = (category) =>
  CATEGORY_LABELS[category] || category;

/**
 * Return a human-readable label for a measurement type key
 */
const getMeasurementTypeLabel = (type) =>
  MEASUREMENT_TYPE_LABELS[type] || type;

/**
 * Return a human-readable label for an assessment type key
 */
const getAssessmentTypeLabel = (type) =>
  ASSESSMENT_TYPE_LABELS[type] || type;

/**
 * Return a badge color string for an assessment type
 */
const getAssessmentTypeColor = (type) =>
  ASSESSMENT_TYPE_COLORS[type] || 'gray';

/**
 * Return a badge color string for a category
 */
const getCategoryColor = (category) =>
  CATEGORY_COLORS[category] || 'gray';

/**
 * Format a numeric score for display, optionally with the indicator's max value
 * Example: formatScore(7.5, indicator) → "7.5 / 10"
 */
const formatScore = (score, indicator = null) => {
  if (score === null || score === undefined) return 'N/A';
  const rounded = typeof score === 'number' ? score.toFixed(1) : score;

  if (!indicator) return rounded;

  if (indicator.measurement_type === 'binary') {
    return score >= 1 ? 'Pass' : 'Fail';
  }
  if (indicator.measurement_type === 'percentage') {
    return `${rounded}%`;
  }
  return `${rounded} / ${indicator.max_value}`;
};

/**
 * Convert a raw score to a 0-100 percentage of the indicator's range
 */
const scoreToPercent = (score, indicator) => {
  if (!indicator || score === null || score === undefined) return 0;
  const range = indicator.max_value - indicator.min_value;
  if (range === 0) return 0;
  return Math.round(((score - indicator.min_value) / range) * 100);
};

/**
 * Determine a color representing how good the score is
 * (green = high, yellow = mid, red = low)
 */
const getScoreColor = (score, indicator) => {
  const pct = scoreToPercent(score, indicator);
  if (pct >= 75) return 'green';
  if (pct >= 50) return 'yellow';
  return 'red';
};

/**
 * Human-readable performance label for a percentage
 */
const getPerformanceLabel = (pct) => {
  if (pct >= 90) return 'Excellent';
  if (pct >= 75) return 'Good';
  if (pct >= 60) return 'Fair';
  if (pct >= 40) return 'Needs Improvement';
  return 'Critical';
};

/**
 * Calculate the percentage improvement between two scores
 * Returns null if either score is missing
 */
const calculateImprovement = (baselineScore, finalScore) => {
  if (baselineScore === null || baselineScore === undefined) return null;
  if (finalScore === null || finalScore === undefined) return null;
  return +(finalScore - baselineScore).toFixed(2);
};

/**
 * Return a signed, human-readable string for an improvement value
 * Example: formatImprovement(1.5) → "+1.5"
 */
const formatImprovement = (improvement) => {
  if (improvement === null || improvement === undefined) return 'N/A';
  const sign = improvement > 0 ? '+' : '';
  return `${sign}${improvement.toFixed(1)}`;
};

/**
 * Build a complete, cleaned filter params object suitable for API calls
 * Strips empty / undefined values
 */
const buildFilterParams = ({
  program = '',
  participant = '',
  indicator = '',
  assessmentType = '',
  dateFrom = '',
  dateTo = '',
  search = '',
  ordering = '-assessment_date',
} = {}) => {
  const params = {};
  if (program)        params.program         = program;
  if (participant)    params.participant      = participant;
  if (indicator)      params.indicator        = indicator;
  if (assessmentType) params.assessment_type  = assessmentType;
  if (dateFrom)       params.date_from        = dateFrom;
  if (dateTo)         params.date_to          = dateTo;
  if (search)         params.search           = search;
  if (ordering)       params.ordering         = ordering;
  return params;
};

/**
 * Export assessments array to CSV and trigger browser download
 */
const exportToCSV = (assessments, filename = null) => {
  const headers = [
    'Date', 'Participant ID', 'Program', 'Indicator',
    'Category', 'Type', 'Score', 'Assessed By', 'Notes',
  ];

  const rows = assessments.map((a) => [
    a.assessment_date || '',
    a.participant_id || '',
    a.program_name || '',
    a.indicator_name || '',
    a.indicator_category || '',
    getAssessmentTypeLabel(a.assessment_type),
    a.score !== null && a.score !== undefined ? a.score : '',
    a.assessed_by_name || '',
    (a.notes || '').replace(/"/g, '""'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const name = filename || `assessments_${new Date().toISOString().split('T')[0]}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', name);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────────────────────
// EXPORTED SERVICE OBJECT
// ─────────────────────────────────────────────────────────────

const assessmentsService = {
  // Indicators
  getIndicators,
  getActiveIndicators,
  getIndicator,
  createIndicator,
  updateIndicator,
  patchIndicator,
  deleteIndicator,
  getIndicatorAssessments,

  // Assessments
  getAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  patchAssessment,
  deleteAssessment,
  getAssessmentStats,

  // Convenience
  getParticipantAssessments,
  getParticipantProgress,
  getProgramAssessments,
  getProgramIndicatorStats,
  getAssessmentsByDateRange,

  // Helpers & display
  CATEGORY_LABELS,
  MEASUREMENT_TYPE_LABELS,
  ASSESSMENT_TYPE_LABELS,
  ASSESSMENT_TYPE_COLORS,
  CATEGORY_COLORS,
  getCategoryLabel,
  getMeasurementTypeLabel,
  getAssessmentTypeLabel,
  getAssessmentTypeColor,
  getCategoryColor,
  formatScore,
  scoreToPercent,
  getScoreColor,
  getPerformanceLabel,
  calculateImprovement,
  formatImprovement,
  buildFilterParams,
  exportToCSV,
};

export default assessmentsService;