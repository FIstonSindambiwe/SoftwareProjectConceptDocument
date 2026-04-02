// src/pages/dashboard/schools/SchoolDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  BuildingLibraryIcon,
  MapPinIcon,
  PlusIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import schoolService from '../../../services/api/schoolService';
import useAuth from '../../../hooks/useAuth';

const SchoolDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = ['admin', 'program_manager', 'teacher', 'staff'].includes(user?.role);

  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchSchool();
      fetchStudents();
    }
  }, [id]);

  const fetchSchool = async () => {
    try {
      const data = await schoolService.getSchool(id);
      setSchool(data);
    } catch (err) {
      setError('Failed to load school details.');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await schoolService.getStudents(id);
      setStudents(data.results || data || []);
    } catch (err) {
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge color="green">Active</Badge>;
      case 'graduated':
        return <Badge color="blue">Graduated</Badge>;
      case 'dropped_out':
        return <Badge color="red">Dropped Out</Badge>;
      default:
        return <Badge color="gray">{status}</Badge>;
    }
  };

  const activeCount = students.filter(s => s.status === 'active').length;
  const graduatedCount = students.filter(s => s.status === 'graduated').length;
  const droppedCount = students.filter(s => s.status === 'dropped_out').length;

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard/schools')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Schools
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* School Info */}
        {school && (
          <Card>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BuildingLibraryIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
                  <div className="flex items-center text-gray-500 mt-1">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span className="text-sm">{school.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                <p className="text-xs text-gray-500 mt-1">Total Students</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                <p className="text-xs text-gray-500 mt-1">Active</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{graduatedCount}</p>
                <p className="text-xs text-gray-500 mt-1">Graduated</p>
              </div>
            </div>
          </Card>
        )}

        {/* Students */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
              Students ({students.length})
            </h2>
            {canEdit && (
              <Button
                size="sm"
                onClick={() => navigate(`/dashboard/schools/${id}/students/create`)}
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <UserGroupIcon className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm font-medium">No students yet</p>
              <p className="text-gray-400 text-xs mt-1 mb-4">
                Add the first student to this school.
              </p>
              {canEdit && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/dashboard/schools/${id}/students/create`)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">#</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Age</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Courses</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Parent</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student, index) => (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-400 text-xs">{index + 1}</td>
                      <td className="py-3 px-4">
                        <span
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => navigate(`/dashboard/schools/students/${student.id}`)}
                        >
                          {student.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{student.age}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-[150px] truncate" title={student.courses}>
                        {student.courses}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{student.parent_name}</td>
                      <td className="py-3 px-4">{getStatusBadge(student.status)}</td>
                      <td className="py-3 px-4">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => navigate(`/dashboard/schools/students/${student.id}`)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default SchoolDetailPage;