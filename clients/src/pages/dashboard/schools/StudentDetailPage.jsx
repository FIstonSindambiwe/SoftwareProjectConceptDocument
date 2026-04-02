// src/pages/dashboard/schools/StudentDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import schoolService from '../../../services/api/schoolService';
import useAuth from '../../../hooks/useAuth';

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ['admin', 'program_manager', 'teacher', 'staff'].includes(user?.role);

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingMarks, setSavingMarks] = useState(false);
  const [marksSuccess, setMarksSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const [marks, setMarks] = useState({
    midterm_marks: '',
    final_marks: '',
  });

  useEffect(() => {
    if (id) fetchStudent();
  }, [id]);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const data = await schoolService.getStudent(id);
      setStudent(data);
      setMarks({
        midterm_marks: data.midterm_marks ?? '',
        final_marks: data.final_marks ?? '',
      });
    } catch (err) {
      setError('Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (e) => {
    const { name, value } = e.target;
    setMarks(prev => ({ ...prev, [name]: value }));
    setMarksSuccess(false);
  };

  const handleSaveMarks = async () => {
    try {
      setSavingMarks(true);
      const payload = {};
      if (marks.midterm_marks !== '') payload.midterm_marks = parseFloat(marks.midterm_marks);
      if (marks.final_marks !== '') payload.final_marks = parseFloat(marks.final_marks);
      const updated = await schoolService.updateMarks(id, payload);
      setStudent(updated);
      setMarksSuccess(true);
      setTimeout(() => setMarksSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save marks.');
    } finally {
      setSavingMarks(false);
    }
  };

  const handleGraduate = async () => {
    if (!window.confirm(`Mark ${student.name} as Graduated? This cannot be undone.`)) return;
    try {
      setActionLoading('graduate');
      const updated = await schoolService.graduateStudent(id);
      setStudent(updated);
    } catch (err) {
      setError(err.error || 'Failed to mark as graduated.');
    } finally {
      setActionLoading('');
    }
  };

  const handleDropout = async () => {
    const reason = window.prompt(`Enter reason for ${student.name}'s dropout:`);
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Dropout reason is required');
      return;
    }
    try {
      setActionLoading('dropout');
      const updated = await schoolService.dropoutStudent(id, reason.trim());
      setStudent(updated);
    } catch (err) {
      setError(err.error || 'Failed to mark as dropped out.');
    } finally {
      setActionLoading('');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge color="green">Active</Badge>;
      case 'graduated': return <Badge color="blue">Graduated</Badge>;
      case 'dropped_out': return <Badge color="red">Dropped Out</Badge>;
      default: return <Badge color="gray">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!student) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Student not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate(`/dashboard/schools/${student.school}`)}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to School
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Student Info */}
        <Card>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-100 rounded-xl">
                <UserIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                  <span>Age: <strong>{student.age}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <UserGroupIcon className="h-4 w-4" />
                    Parent: <strong>{student.parent_name}</strong>
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{student.courses}</span>
                </div>
              </div>
            </div>
            <div>{getStatusBadge(student.status)}</div>
          </div>

          {/* Dropout/Graduate info */}
          {student.status === 'graduated' && student.graduated_at && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Graduated on:</strong> {new Date(student.graduated_at).toLocaleDateString()}
              </p>
            </div>
          )}
          {student.status === 'dropped_out' && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                <strong>Dropped out on:</strong> {student.dropped_out_at ? new Date(student.dropped_out_at).toLocaleDateString() : 'N/A'}
              </p>
              {student.dropout_reason && (
                <p className="text-sm text-red-600 mt-1">
                  <strong>Reason:</strong> {student.dropout_reason}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Marks */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PencilIcon className="h-5 w-5 text-gray-400" />
            Academic Marks
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mid Term Marks
              </label>
              <input
                type="number"
                name="midterm_marks"
                value={marks.midterm_marks}
                onChange={handleMarksChange}
                placeholder="e.g. 75"
                min="0"
                max="100"
                disabled={!canEdit || student.status !== 'active'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Final Marks
              </label>
              <input
                type="number"
                name="final_marks"
                value={marks.final_marks}
                onChange={handleMarksChange}
                placeholder="e.g. 85"
                min="0"
                max="100"
                disabled={!canEdit || student.status !== 'active'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          </div>

          {/* Current marks display */}
          {(student.midterm_marks !== null || student.final_marks !== null) && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {student.midterm_marks ?? '—'}
                </p>
                <p className="text-xs text-gray-500">Current Mid Term</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {student.final_marks ?? '—'}
                </p>
                <p className="text-xs text-gray-500">Current Final</p>
              </div>
            </div>
          )}

          {marksSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700">Marks saved successfully!</p>
            </div>
          )}

          {canEdit && student.status === 'active' && (
            <Button onClick={handleSaveMarks} disabled={savingMarks} size="sm">
              {savingMarks ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" /> Saving...
                </div>
              ) : 'Save Marks'}
            </Button>
          )}
        </Card>

        {/* Actions */}
        {canEdit && student.status === 'active' && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="success"
                onClick={handleGraduate}
                disabled={actionLoading === 'graduate'}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading === 'graduate' ? (
                  <Spinner size="sm" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                Mark as Graduated
              </Button>

              <Button
                variant="danger"
                onClick={handleDropout}
                disabled={actionLoading === 'dropout'}
                className="flex items-center gap-2"
              >
                {actionLoading === 'dropout' ? (
                  <Spinner size="sm" />
                ) : (
                  <XCircleIcon className="h-4 w-4" />
                )}
                Mark as Dropped Out
              </Button>
            </div>
          </Card>
        )}

      </div>
    </Layout>
  );
};

export default StudentDetailPage;