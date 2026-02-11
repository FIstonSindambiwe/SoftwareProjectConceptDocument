// src/pages/dashboard/assessments/AssessmentDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon, PencilIcon, TrashIcon,
  CalendarIcon, UserIcon, ChartBarIcon,
  DocumentTextIcon, ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import Modal from '../../../components/common/Modal';
import assessmentsService from '../../../services/api/assessmentsService';
import useAuth from '../../../hooks/useAuth';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start py-4 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center min-w-[200px]">
      {Icon && <Icon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />}
      <span className="text-sm font-medium text-gray-500">{label}</span>
    </div>
    <div className="text-sm text-gray-900 flex-1">
      {value ?? <span className="italic text-gray-400">Not provided</span>}
    </div>
  </div>
);

const AssessmentDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [record, setRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await assessmentsService.getAssessment(id);
        setRecord(data);

        // Load previous assessments for same participant + indicator
        if (data.participant && data.indicator) {
          const hist = await assessmentsService.getAssessments({
            participant: data.participant,
            indicator: data.indicator,
            ordering: '-assessment_date',
          });
          setHistory((hist.results ?? hist ?? []).filter((a) => String(a.id) !== String(id)));
        }
      } catch (err) {
        setError('Failed to load assessment record.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await assessmentsService.deleteAssessment(id);
      navigate('/dashboard/assessments', { state: { message: 'Assessment deleted.' } });
    } catch (err) {
      setError('Failed to delete. Please try again.');
      setDeleting(false);
      setShowDelete(false);
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

  if (error || !record) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-md p-6">
          <div className="flex gap-3">
            <ExclamationCircleIcon className="h-6 w-6 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error || 'Record not found.'}</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard/assessments')}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Assessments
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const pct = record.indicator
    ? assessmentsService.scoreToPercent(record.score, record.indicator)
    : null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/assessments')}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Badge color={assessmentsService.getAssessmentTypeColor(record.assessment_type)}>
                {assessmentsService.getAssessmentTypeLabel(record.assessment_type)}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{record.indicator_name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Assessment ID: {record.id}</p>
          </div>

          {user?.role !== 'donor' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/dashboard/assessments/${id}/edit`)}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:bg-red-50"
                onClick={() => setShowDelete(true)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Score hero */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-shrink-0 bg-blue-50 rounded-2xl p-6 text-center min-w-[140px]">
              <div className="text-5xl font-black text-blue-700">{record.score}</div>
              {record.indicator?.max_value && (
                <div className="text-sm text-blue-500 mt-1">/ {record.indicator.max_value}</div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Performance</span>
                  {pct !== null && (
                    <span className="font-semibold">{pct}% — {assessmentsService.getPerformanceLabel(pct)}</span>
                  )}
                </div>
                {pct !== null && (
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-2">
                    <Badge color={assessmentsService.getCategoryColor(record.indicator_category)} size="sm">
                      {record.indicator_category}
                    </Badge>
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Program:</span>
                  <span className="ml-2 font-medium">{record.program_name || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Details */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Details</h2>
          <InfoRow icon={UserIcon} label="Participant" value={
            <span>{record.participant_id}{record.participant_name ? ` · ${record.participant_name}` : ''}</span>
          } />
          <InfoRow icon={CalendarIcon} label="Assessment Date" value={
            new Date(record.assessment_date).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })
          } />
          <InfoRow icon={ChartBarIcon} label="Indicator" value={record.indicator_name} />
          <InfoRow icon={DocumentTextIcon} label="Notes" value={record.notes || null} />
          <InfoRow icon={UserIcon} label="Assessed By" value={record.assessed_by_name} />
        </Card>

        {/* History */}
        {history.length > 0 && (
          <Card>
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Previous Assessments for Same Indicator
            </h2>
            <div className="space-y-3">
              {history.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/dashboard/assessments/${h.id}`)}
                >
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {new Date(h.assessment_date).toLocaleDateString()}
                    </span>
                    <Badge color={assessmentsService.getAssessmentTypeColor(h.assessment_type)} size="sm" className="ml-2">
                      {assessmentsService.getAssessmentTypeLabel(h.assessment_type)}
                    </Badge>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{h.score}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Record Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Created:</span> <span className="ml-2">{record.created_at ? new Date(record.created_at).toLocaleString() : '—'}</span></div>
            <div><span className="text-gray-500">Updated:</span> <span className="ml-2">{record.updated_at ? new Date(record.updated_at).toLocaleString() : '—'}</span></div>
            <div><span className="text-gray-500">Record ID:</span> <span className="ml-2 font-mono">{record.id}</span></div>
          </div>
        </Card>
      </div>

      {/* Delete modal */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Delete Assessment">
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">
              Permanently delete this <strong>{assessmentsService.getAssessmentTypeLabel(record.assessment_type)}</strong> assessment
              for <strong>{record.participant_id}</strong> on <strong>{record.assessment_date}</strong>?
              This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDelete(false)} disabled={deleting}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={deleting}>
              {deleting ? <><Spinner size="sm" className="mr-2" />Deleting…</> : <><TrashIcon className="h-4 w-4 mr-2" />Delete</>}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default AssessmentDetailPage;