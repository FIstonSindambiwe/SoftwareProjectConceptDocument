// src/pages/dashboard/assessments/AssessmentsListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import Table from '../../../components/common/Table';
import AssessmentStats from '../../../components/assessments/AssessmentStats';
import AssessmentFilters from '../../../components/assessments/AssessmentFilters';
import assessmentsService from '../../../services/api/assessmentsService';
import programService from '../../../services/api/programService';
import useAuth from '../../../hooks/useAuth';

const EMPTY_FILTERS = {
  search: '', program: '', indicator: '', assessmentType: '',
  category: '', dateFrom: '', dateTo: '',
};

const AssessmentsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assessments, setAssessments] = useState([]);
  const [stats, setStats] = useState(null);
  const [indicators, setIndicators] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const activeCount = Object.values(filters).filter(Boolean).length;

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

  // Re-fetch when filters change
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
        const [data, statsData] = await Promise.all([
          assessmentsService.getAssessments(params),
          assessmentsService.getAssessmentStats(params),
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

  const columns = [
    {
      key: 'assessment_date',
      header: 'Date',
      render: (v) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(v).toLocaleDateString('en-US', { weekday: 'short' })}
          </div>
        </div>
      ),
    },
    {
      key: 'participant_id',
      header: 'Participant',
      render: (v, row) => (
        <div>
          <div className="font-medium text-gray-900 text-sm">{v}</div>
          {row.participant_name && (
            <div className="text-xs text-gray-500">{row.participant_name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'indicator_name',
      header: 'Indicator',
      render: (v, row) => (
        <div>
          <div className="text-sm text-gray-900">{v}</div>
          {row.indicator_category && (
            <Badge color={assessmentsService.getCategoryColor(row.indicator_category)} size="sm">
              {row.indicator_category}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'program_name',
      header: 'Program',
      render: (v) => <span className="text-sm text-gray-600">{v || '—'}</span>,
    },
    {
      key: 'assessment_type',
      header: 'Type',
      render: (v) => (
        <Badge color={assessmentsService.getAssessmentTypeColor(v)} size="sm">
          {assessmentsService.getAssessmentTypeLabel(v)}
        </Badge>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      render: (v) => (
        <span className="font-bold text-gray-900">{v}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button size="xs" variant="outline" onClick={() => navigate(`/dashboard/assessments/${row.id}`)}>
            View
          </Button>
          {user?.role !== 'donor' && (
            <Button size="xs" variant="outline" onClick={() => navigate(`/dashboard/assessments/${row.id}/edit`)}>
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track participant progress across all indicators
            </p>
          </div>
          {user?.role !== 'donor' && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/assessments/indicators')}>
                <ChartBarIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Manage Indicators</span>
              </Button>
              <Button onClick={() => navigate('/dashboard/assessments/create')} size="sm">
                <PlusIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">New Assessment</span>
              </Button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Stats */}
        <AssessmentStats stats={stats} />

        {/* Filters card */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              {activeCount > 0 && (
                <Badge color="blue" size="sm">{activeCount} active</Badge>
              )}
            </div>
            <div className="flex gap-2">
              {assessments.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => assessmentsService.exportToCSV(assessments)}>
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <FunnelIcon className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>

          {showFilters && (
            <AssessmentFilters
              filters={filters}
              programs={programs}
              indicators={indicators}
              onChange={setFilters}
              onClear={() => setFilters(EMPTY_FILTERS)}
              activeCount={activeCount}
            />
          )}
        </Card>

        {/* Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Records</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
                {activeCount > 0 ? ' (filtered)' : ''}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner size="lg" />
              <p className="text-sm text-gray-500 mt-4">Loading assessments…</p>
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-16">
              <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              {activeCount > 0 ? (
                <>
                  <p className="text-lg font-medium text-gray-900 mb-2">No results match your filters</p>
                  <p className="text-sm text-gray-500 mb-4">Try adjusting or clearing the filters</p>
                  <Button variant="outline" onClick={() => setFilters(EMPTY_FILTERS)}>
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-gray-900 mb-2">No assessments yet</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Start by recording the first assessment
                  </p>
                  {user?.role !== 'donor' && (
                    <Button onClick={() => navigate('/dashboard/assessments/create')}>
                      <PlusIcon className="h-5 w-5 mr-2" />
                      New Assessment
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table columns={columns} data={assessments} />
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default AssessmentsListPage;