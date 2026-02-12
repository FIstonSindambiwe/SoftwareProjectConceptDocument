// src/pages/dashboard/assessments/AssessmentsListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  EyeIcon,
  PencilSquareIcon,
  BeakerIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import AssessmentStats from '../../../components/assessments/AssessmentStats';
import AssessmentFilters from '../../../components/assessments/AssessmentFilters';
import assessmentsService from '../../../services/api/assessmentsService';
import programService from '../../../services/api/programService';
import useAuth from '../../../hooks/useAuth';

const EMPTY_FILTERS = {
  search: '', program: '', indicator: '', assessmentType: '',
  category: '', dateFrom: '', dateTo: '',
};

// ─── Tooltip wrapper for icon buttons ────────────────────────
const IconButton = ({ onClick, icon: Icon, label, className = '' }) => (
  <button
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`p-2 rounded-lg transition-colors ${className}`}
  >
    <Icon className="h-4 w-4" />
  </button>
);

// ─── Score pill ───────────────────────────────────────────────
const ScorePill = ({ score, minValue = 0, maxValue = 10 }) => {
  const pct = assessmentsService.scoreToPercent(score, { min_value: minValue, max_value: maxValue });
  const color = pct >= 75 ? 'bg-green-100 text-green-800' : pct >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold ${color}`}>
      {score}
    </span>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const AssessmentsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assessments, setAssessments]   = useState([]);
  const [stats, setStats]               = useState(null);
  const [indicators, setIndicators]     = useState([]);
  const [programs, setPrograms]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [showFilters, setShowFilters]   = useState(false);
  const [filters, setFilters]           = useState(EMPTY_FILTERS);
  // inline search bar (always visible, separate from panel filters)
  const [quickSearch, setQuickSearch]   = useState('');

  const canEdit = user?.role !== 'donor';

  // Active filter count (excludes quickSearch, that's separate)
  const activeCount = Object.values(filters).filter(Boolean).length;

  // ── Initial load ─────────────────────────────────────────────
  const fetchInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [assessData, indicatorData, programData, statsData] = await Promise.all([
        assessmentsService.getAssessments({ ordering: '-assessment_date' }),
        assessmentsService.getActiveIndicators(),
        programService.getPrograms(),
        assessmentsService.getAssessmentStats(),
      ]);
      setAssessments(assessData.results ?? assessData ?? []);
      setIndicators(indicatorData.results ?? indicatorData ?? []);
      setPrograms(programData.results ?? programData ?? []);
      setStats(statsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);

  // ── Re-fetch on panel filter change ──────────────────────────
  useEffect(() => {
    const fetchFiltered = async () => {
      try {
        const params = assessmentsService.buildFilterParams({
          program:        filters.program,
          indicator:      filters.indicator,
          assessmentType: filters.assessmentType,
          dateFrom:       filters.dateFrom,
          dateTo:         filters.dateTo,
          search:         filters.search,
        });
        // Stats only accepts a subset of params
        const statsParams = {};
        if (params.program)         statsParams.program         = params.program;
        if (params.indicator)       statsParams.indicator       = params.indicator;
        if (params.assessment_type) statsParams.assessment_type = params.assessment_type;

        const [data, statsData] = await Promise.all([
          assessmentsService.getAssessments(params),
          assessmentsService.getAssessmentStats(statsParams),
        ]);
        setAssessments(data.results ?? data ?? []);
        setStats(statsData);
      } catch (err) {
        console.error(err);
        setError('Failed to filter assessments.');
      }
    };
    fetchFiltered();
  }, [filters]);

  // ── Client-side quick search ──────────────────────────────────
  const displayed = quickSearch.trim()
    ? assessments.filter((a) =>
        [a.participant_id, a.participant_name, a.indicator_name, a.program_name]
          .filter(Boolean)
          .some((f) => f.toLowerCase().includes(quickSearch.toLowerCase()))
      )
    : assessments;

  // ── Helpers ───────────────────────────────────────────────────
  const clearAll = () => {
    setFilters(EMPTY_FILTERS);
    setQuickSearch('');
  };

  const formatDate = (v) => {
    const d = new Date(v);
    return {
      primary: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      secondary: d.toLocaleDateString('en-US', { weekday: 'short' }),
    };
  };

  return (
    <Layout>
      <div className="space-y-6">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track participant progress across all indicators
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard/assessments/indicators')}
              >
                <BeakerIcon className="h-4 w-4 mr-2" />
                Indicators
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/dashboard/assessments/create')}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                New Assessment
              </Button>
            </div>
          )}
        </div>

        {/* ── Error ────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Stats cards ──────────────────────────────────────── */}
        <AssessmentStats stats={stats} />

        {/* ── Search + filter toolbar ──────────────────────────── */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Quick search */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                placeholder="Search participant, indicator, program…"
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {quickSearch && (
                <button
                  onClick={() => setQuickSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Toolbar actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={activeCount > 0 ? 'border-blue-400 text-blue-600' : ''}
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
                {activeCount > 0 && (
                  <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {activeCount}
                  </span>
                )}
              </Button>

              {displayed.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => assessmentsService.exportToCSV(displayed)}
                  title="Export to CSV"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}

              {(activeCount > 0 || quickSearch) && (
                <Button variant="outline" size="sm" onClick={clearAll} title="Clear all filters">
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Expanded filter panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <AssessmentFilters
                filters={filters}
                programs={programs}
                indicators={indicators}
                onChange={setFilters}
                onClear={() => setFilters(EMPTY_FILTERS)}
                activeCount={activeCount}
              />
            </div>
          )}
        </Card>

        {/* ── Table ────────────────────────────────────────────── */}
        <Card>
          {/* Table header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Records</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {displayed.length} assessment{displayed.length !== 1 ? 's' : ''}
                {(activeCount > 0 || quickSearch) ? ' (filtered)' : ''}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner size="lg" />
              <p className="text-sm text-gray-500 mt-4">Loading assessments…</p>
            </div>

          ) : displayed.length === 0 ? (
            <div className="text-center py-16">
              <ChartBarIcon className="h-14 w-14 text-gray-200 mx-auto mb-4" />
              {activeCount > 0 || quickSearch ? (
                <>
                  <p className="text-base font-semibold text-gray-900 mb-1">No results match your search</p>
                  <p className="text-sm text-gray-500 mb-4">Try adjusting or clearing the filters</p>
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    <XMarkIcon className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-gray-900 mb-1">No assessments yet</p>
                  <p className="text-sm text-gray-500 mb-4">Start by recording the first assessment</p>
                  {canEdit && (
                    <Button size="sm" onClick={() => navigate('/dashboard/assessments/create')}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      New Assessment
                    </Button>
                  )}
                </>
              )}
            </div>

          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Date', 'Participant', 'Indicator', 'Program', 'Type', 'Score', ''].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {displayed.map((row) => {
                    const { primary, secondary } = formatDate(row.assessment_date);
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        {/* Date */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{primary}</div>
                          <div className="text-xs text-gray-400">{secondary}</div>
                        </td>

                        {/* Participant */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{row.participant_id}</div>
                          {row.participant_name && (
                            <div className="text-xs text-gray-400">{row.participant_name}</div>
                          )}
                        </td>

                        {/* Indicator */}
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 font-medium">{row.indicator_name}</div>
                          {row.indicator_category && (
                            <Badge
                              color={assessmentsService.getCategoryColor(row.indicator_category)}
                              size="sm"
                              className="mt-0.5"
                            >
                              {row.indicator_category}
                            </Badge>
                          )}
                        </td>

                        {/* Program — show full name, never empty */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.program_name ? (
                            <span className="text-sm text-gray-700">{row.program_name}</span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No program</span>
                          )}
                        </td>

                        {/* Assessment type */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge
                            color={assessmentsService.getAssessmentTypeColor(row.assessment_type)}
                            size="sm"
                          >
                            {assessmentsService.getAssessmentTypeLabel(row.assessment_type)}
                          </Badge>
                        </td>

                        {/* Score pill */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <ScorePill score={row.score} />
                        </td>

                        {/* Actions — icon buttons */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconButton
                              icon={EyeIcon}
                              label="View assessment"
                              onClick={() => navigate(`/dashboard/assessments/${row.id}`)}
                              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            />
                            {canEdit && (
                              <IconButton
                                icon={PencilSquareIcon}
                                label="Edit assessment"
                                onClick={() => navigate(`/dashboard/assessments/${row.id}/edit`)}
                                className="text-gray-500 hover:text-yellow-600 hover:bg-yellow-50"
                              />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Row count footer */}
          {displayed.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>Showing {displayed.length} record{displayed.length !== 1 ? 's' : ''}</span>
              {(activeCount > 0 || quickSearch) && (
                <button onClick={clearAll} className="hover:text-gray-600 underline underline-offset-2">
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </Card>

      </div>
    </Layout>
  );
};

export default AssessmentsListPage;