// src/pages/dashboard/enrollments/EnrollmentDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Make sure Link is imported
import {
  ArrowLeftIcon,
  PencilIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  ChartBarIcon,
  IdentificationIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  GiftIcon,
  XCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  HomeIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import Tabs from '../../../components/common/Tabs';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import useAuth from '../../../hooks/useAuth';
import enrollmentService from '../../../services/api/enrollmentService';
import participantService from '../../../services/api/participantService';
import programService from '../../../services/api/programService';
import attendanceService from '../../../services/api/attendanceService';

const EnrollmentDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [enrollment, setEnrollment] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [stats, setStats] = useState(null);

  // Check user permissions
  const userRole = user?.role;
  const isTeacher = userRole === 'teacher';
  const isAdmin = userRole === 'admin';
  const isProgramManager = userRole === 'program_manager';
  const isDonor = userRole === 'donor';
  
  const canEdit = !isDonor;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserIcon },
    { id: 'attendance', label: 'Attendance', icon: ChartBarIcon },
    { id: 'notes', label: 'Notes', icon: DocumentTextIcon },
  ];

  useEffect(() => {
    fetchEnrollmentData();
  }, [id]);

  const fetchEnrollmentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch enrollment details
      const enrollmentData = await enrollmentService.getEnrollment(id);
      setEnrollment(enrollmentData);
      
      // Fetch participant details
      if (enrollmentData.participant) {
        try {
          const participantData = await participantService.getParticipant(enrollmentData.participant);
          setParticipant(participantData);
        } catch (err) {
          console.warn('Could not fetch participant details:', err);
        }
      }
      
      // Fetch program details
      if (enrollmentData.program) {
        try {
          const programData = await programService.getProgram(enrollmentData.program);
          setProgram(programData);
        } catch (err) {
          console.warn('Could not fetch program details:', err);
        }
      }
      
      // Fetch attendance history
      try {
        const attendanceData = await attendanceService.getAttendanceRecords({
          participant: enrollmentData.participant,
          program: enrollmentData.program,
          page_size: 50
        });
        setAttendanceHistory(attendanceData.results || attendanceData || []);
      } catch (err) {
        console.warn('Could not fetch attendance history:', err);
      }
      
      // Calculate stats
      calculateStats(enrollmentData, attendanceHistory);
      
    } catch (err) {
      console.error('Error fetching enrollment:', err);
      setError(err.message || 'Failed to load enrollment data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (enrollmentData, attendanceData) => {
    const totalSessions = attendanceData.length;
    const presentSessions = attendanceData.filter(a => a.present).length;
    const absentSessions = totalSessions - presentSessions;
    const faceVerifiedSessions = attendanceData.filter(a => a.verified_by_face).length;
    
    setStats({
      total_sessions: totalSessions,
      present_sessions: presentSessions,
      absent_sessions: absentSessions,
      face_verified_sessions: faceVerifiedSessions,
      attendance_rate: enrollmentData.attendance_rate || 0
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handleDelete = async () => {
    if (!enrollment?.id) return;
    
    if (window.confirm('Are you sure you want to delete this enrollment? This action cannot be undone.')) {
      try {
        await enrollmentService.deleteEnrollment(enrollment.id);
        navigate('/dashboard/enrollments', { 
          state: { message: 'Enrollment deleted successfully' }
        });
      } catch (err) {
        console.error('Error deleting enrollment:', err);
        setError(err.message || 'Failed to delete enrollment');
      }
    }
  };

  const getStatusBadge = () => {
    if (enrollment?.has_dropped_out) {
      return (
        <Badge color="red" size="lg" className="flex items-center gap-2 px-3 py-1.5">
          <XCircleIcon className="h-5 w-5" />
          Dropped Out
        </Badge>
      );
    }
    
    if (enrollment?.has_scholarship) {
      return (
        <Badge color="yellow" size="lg" className="flex items-center gap-2 px-3 py-1.5">
          <GiftIcon className="h-5 w-5" />
          Scholarship Awarded
        </Badge>
      );
    }
    
    if (enrollment?.has_finished) {
      return (
        <Badge color="green" size="lg" className="flex items-center gap-2 px-3 py-1.5">
          <CheckCircleIcon className="h-5 w-5" />
          Completed
        </Badge>
      );
    }
    
    switch (enrollment?.status) {
      case 'enrolled':
      case 'active':
        return (
          <Badge color="blue" size="lg" className="flex items-center gap-2 px-3 py-1.5">
            <AcademicCapIcon className="h-5 w-5" />
            Active
          </Badge>
        );
      case 'transferred':
        return (
          <Badge color="purple" size="lg" className="flex items-center gap-2 px-3 py-1.5">
            <ClockIcon className="h-5 w-5" />
            Transferred
          </Badge>
        );
      default:
        return (
          <Badge color="gray" size="lg" className="px-3 py-1.5">
            {enrollment?.status_display || enrollment?.status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !enrollment) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/enrollments')}
            className="mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Enrollments
          </Button>
          
          <Card>
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-400" />
              </div>
              <p className="text-red-600 font-medium">Error loading enrollment data</p>
              <p className="text-gray-600 mt-2">{error || 'Enrollment not found'}</p>
              <div className="flex justify-center space-x-4 mt-6">
                <Button onClick={fetchEnrollmentData}>
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard/enrollments')}
                >
                  Return to List
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ErrorBoundary fallback={<div>Something went wrong loading the enrollment details.</div>}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/enrollments')}
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Enrollments
              </Button>
              
              {canEdit && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/dashboard/enrollments/${id}/edit`)}
                  >
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                  >
                    <TrashIcon className="h-5 w-5 mr-2" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
            
            {/* Title Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <AcademicCapIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {program?.name || enrollment.program_name || 'Program Enrollment'}
                    </h1>
                    <p className="text-gray-600">
                      Enrollment #{enrollment.id}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Status Badge */}
              {getStatusBadge()}
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Participant Card */}
            <Card className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">Participant</p>
                  <UserIcon className="h-4 w-4 text-gray-400" />
                </div>
                <Link 
                  to={`/dashboard/participants/${participant?.id || enrollment.participant}`}
                  className="text-blue-600 hover:text-blue-800 font-medium block hover:underline"
                >
                  {participant?.full_name || enrollment.participant_name || `ID: ${enrollment.participant}`}
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  {participant?.participant_id || enrollment.participant_id}
                </p>
                {participant?.room_name && (
                  <p className="text-xs text-gray-500 flex items-center mt-2">
                    <HomeIcon className="h-3 w-3 mr-1" />
                    {participant.room_name}
                  </p>
                )}
              </div>
            </Card>

            {/* Program Card */}
            <Card className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">Program</p>
                  <AcademicCapIcon className="h-4 w-4 text-gray-400" />
                </div>
                <Link 
                  to={`/dashboard/programs/${program?.id || enrollment.program}`}
                  className="text-blue-600 hover:text-blue-800 font-medium block hover:underline"
                >
                  {program?.name || enrollment.program_name || `ID: ${enrollment.program}`}
                </Link>
                {program?.location_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    {program.location_name}
                  </p>
                )}
              </div>
            </Card>

            {/* Enrollment Date Card */}
            <Card className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">Enrollment Date</p>
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                </div>
                <p className="font-medium text-gray-900">
                  {formatDate(enrollment.enrollment_date)}
                </p>
                {enrollment.expected_completion_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    Expected: {formatDate(enrollment.expected_completion_date)}
                  </p>
                )}
              </div>
            </Card>

            {/* Attendance Rate Card */}
            <Card className="hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">Attendance Rate</p>
                  <ChartBarIcon className="h-4 w-4 text-gray-400" />
                </div>
                <p className={`text-xl font-bold ${
                  enrollment.attendance_rate >= 80 ? 'text-green-600' :
                  enrollment.attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {enrollment.attendance_rate?.toFixed(1) || 0}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div
                    className={`h-1.5 rounded-full ${
                      enrollment.attendance_rate >= 80 ? 'bg-green-500' :
                      enrollment.attendance_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(enrollment.attendance_rate || 0, 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  {/* Timeline Card */}
                  <Card>
                    <div className="p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <ClockIcon className="h-5 w-5 mr-2 text-gray-600" />
                        Timeline
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-24 flex-shrink-0">
                            <span className="text-sm font-medium text-gray-900">Enrolled</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">
                              {formatDate(enrollment.enrollment_date)}
                            </p>
                            {enrollment.enrolled_by && (
                              <p className="text-xs text-gray-500 mt-1">
                                By: {enrollment.enrolled_by_name || enrollment.enrolled_by}
                              </p>
                            )}
                          </div>
                        </div>

                        {enrollment.completion_date && (
                          <div className="flex items-start gap-3">
                            <div className="w-24 flex-shrink-0">
                              <span className="text-sm font-medium text-gray-900">Completed</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">
                                {formatDate(enrollment.completion_date)}
                              </p>
                              {enrollment.final_grade && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Grade: {enrollment.final_grade_display || enrollment.final_grade}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {enrollment.dropout_date && (
                          <div className="flex items-start gap-3">
                            <div className="w-24 flex-shrink-0">
                              <span className="text-sm font-medium text-gray-900">Dropped Out</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-600">
                                {formatDate(enrollment.dropout_date)}
                              </p>
                              {enrollment.dropout_reason_display && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Reason: {enrollment.dropout_reason_display}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          <div className="w-24 flex-shrink-0">
                            <span className="text-sm font-medium text-gray-900">Duration</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">
                              {enrollment.duration_days || 0} days
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Dropout Details */}
                  {enrollment.has_dropped_out && (
                    <Card className="border-red-200 bg-red-50">
                      <div className="p-6">
                        <h3 className="text-lg font-medium text-red-900 mb-4 flex items-center">
                          <XCircleIcon className="h-5 w-5 mr-2 text-red-600" />
                          Dropout Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Dropout Date</p>
                            <p className="font-medium text-gray-900">
                              {formatDate(enrollment.dropout_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Reason</p>
                            <p className="font-medium text-gray-900">
                              {enrollment.dropout_reason_display || enrollment.dropout_reason}
                            </p>
                          </div>
                          {enrollment.dropout_notes && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-600">Notes</p>
                              <p className="text-gray-700 whitespace-pre-wrap">{enrollment.dropout_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Scholarship Details */}
                  {enrollment.has_scholarship && (
                    <Card className="border-yellow-200 bg-yellow-50">
                      <div className="p-6">
                        <h3 className="text-lg font-medium text-yellow-900 mb-4 flex items-center">
                          <GiftIcon className="h-5 w-5 mr-2 text-yellow-600" />
                          Scholarship Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Scholarship Type</p>
                            <p className="font-medium text-gray-900">
                              {enrollment.scholarship_type_display || enrollment.scholarship_type}
                            </p>
                          </div>
                          {enrollment.scholarship_amount && (
                            <div>
                              <p className="text-sm text-gray-600">Amount</p>
                              <p className="font-medium text-gray-900">
                                {formatCurrency(enrollment.scholarship_amount)}
                              </p>
                            </div>
                          )}
                          {enrollment.scholarship_provider && (
                            <div>
                              <p className="text-sm text-gray-600">Provider</p>
                              <p className="font-medium text-gray-900">
                                {enrollment.scholarship_provider}
                              </p>
                            </div>
                          )}
                          {enrollment.scholarship_date && (
                            <div>
                              <p className="text-sm text-gray-600">Award Date</p>
                              <p className="font-medium text-gray-900">
                                {formatDate(enrollment.scholarship_date)}
                              </p>
                            </div>
                          )}
                          {enrollment.scholarship_notes && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-600">Notes</p>
                              <p className="text-gray-700 whitespace-pre-wrap">{enrollment.scholarship_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              )}

              {/* Attendance Tab */}
              {activeTab === 'attendance' && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <ChartBarIcon className="h-5 w-5 mr-2 text-gray-600" />
                      Attendance History
                    </h3>
                    
                    {stats && (
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-600">{stats.present_sessions}</p>
                          <p className="text-xs text-gray-600">Present</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-red-600">{stats.absent_sessions}</p>
                          <p className="text-xs text-gray-600">Absent</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-blue-600">{stats.total_sessions}</p>
                          <p className="text-xs text-gray-600">Total</p>
                        </div>
                      </div>
                    )}
                    
                    {attendanceHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No attendance records found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {attendanceHistory.map((record) => (
                          <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {record.present ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircleIcon className="h-5 w-5 text-red-500" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDate(record.date)}
                                </p>
                                {record.session_name && (
                                  <p className="text-xs text-gray-500">{record.session_name}</p>
                                )}
                              </div>
                            </div>
                            {record.verified_by_face && (
                              <Badge color="blue" size="sm" className="flex items-center gap-1">
                                <CheckCircleIcon className="h-3 w-3" />
                                Face Verified
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Notes Tab */}
              {activeTab === 'notes' && (
                <Card>
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-600" />
                      Enrollment Notes
                    </h3>
                    
                    {enrollment.notes ? (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 whitespace-pre-wrap">{enrollment.notes}</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No notes available</p>
                    )}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <Card>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate(`/dashboard/participants/${participant?.id || enrollment.participant}`)}
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      View Participant
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => navigate(`/dashboard/programs/${program?.id || enrollment.program}`)}
                    >
                      <AcademicCapIcon className="h-4 w-4 mr-2" />
                      View Program
                    </Button>
                    
                    {canEdit && !enrollment.has_finished && !enrollment.has_dropped_out && (
                      <>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-yellow-600 hover:bg-yellow-50"
                          onClick={() => navigate(`/dashboard/enrollments/${id}/award-scholarship`)}
                        >
                          <GiftIcon className="h-4 w-4 mr-2" />
                          Award Scholarship
                        </Button>
                        
                        <Button
                          variant="outline"
                          className="w-full justify-start text-red-600 hover:bg-red-50"
                          onClick={() => navigate(`/dashboard/enrollments/${id}/dropout`)}
                        >
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          Record Dropout
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {/* Statistics Card */}
              <Card>
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Statistics</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Attendance Rate</span>
                      <Badge color={
                        enrollment.attendance_rate >= 80 ? 'green' :
                        enrollment.attendance_rate >= 60 ? 'yellow' : 'red'
                      }>
                        {enrollment.attendance_rate?.toFixed(1) || 0}%
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Duration</span>
                      <span className="text-sm font-medium text-gray-900">
                        {enrollment.duration_days || 0} days
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status</span>
                      <span className="text-sm font-medium text-gray-900">
                        {enrollment.outcome_status || enrollment.status_display || enrollment.status}
                      </span>
                    </div>
                    
                    {enrollment.final_grade && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Final Grade</span>
                        <Badge color="blue">
                          {enrollment.final_grade_display || enrollment.final_grade}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Metadata Card */}
              <Card className="bg-gray-50">
                <div className="p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Metadata</h3>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created</span>
                      <span className="text-gray-900">{formatDate(enrollment.created_at)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated</span>
                      <span className="text-gray-900">{formatDate(enrollment.updated_at)}</span>
                    </div>
                    
                    {enrollment.enrolled_by && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Enrolled By</span>
                        <span className="text-gray-900">{enrollment.enrolled_by_name || enrollment.enrolled_by}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    </Layout>
  );
};

export default EnrollmentDetailPage;