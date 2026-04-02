// src/pages/dashboard/attendance/SessionAttendancePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import attendanceService from '../../../services/api/attendanceService';

const SessionAttendancePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loadingAttendees, setLoadingAttendees] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchSession();
      fetchAttendees();
    }
  }, [id]);

  const fetchSession = async () => {
    try {
      setLoadingSession(true);
      const data = await attendanceService.getSession(id);
      setSession(data);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError('Failed to load session details.');
    } finally {
      setLoadingSession(false);
    }
  };

  const fetchAttendees = async () => {
    try {
      setLoadingAttendees(true);
      const data = await attendanceService.getSessionAttendance(id);
      setAttendees(data.results || data || []);
    } catch (err) {
      console.error('Error fetching attendees:', err);
      setError('Failed to load attendance records.');
    } finally {
      setLoadingAttendees(false);
    }
  };

  // Stats
  const presentCount = attendees.filter(a => a.present).length;
  const absentCount = attendees.filter(a => !a.present).length;
  const attendanceRate = attendees.length > 0
    ? ((presentCount / attendees.length) * 100).toFixed(1)
    : 0;

  const loading = loadingSession || loadingAttendees;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard/attendance/sessions')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Sessions
        </button>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Session Info Header */}
        <Card>
          {loadingSession ? (
            <div className="flex justify-center py-6">
              <Spinner size="md" />
            </div>
          ) : session ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {session.session_name}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <AcademicCapIcon className="h-4 w-4" />
                    {session.program_name}
                  </p>
                </div>

                {/* Session Status */}
                <div>
                  {session.is_cancelled ? (
                    <Badge color="red">Cancelled</Badge>
                  ) : session.is_completed ? (
                    <Badge color="purple">Completed</Badge>
                  ) : (
                    <Badge color="green">Active</Badge>
                  )}
                </div>
              </div>

              {/* Session Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  {new Date(session.session_date).toLocaleDateString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  {session.start_time} — {session.end_time}
                </span>
                {session.room_name && (
                  <span className="flex items-center gap-1">
                    🏠 {session.room_name}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </Card>

        {/* Stats Row */}
        {!loadingAttendees && attendees.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="text-center">
              <p className="text-3xl font-bold text-gray-900">{attendees.length}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Total</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-green-600">{presentCount}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Present</p>
            </Card>
            <Card className="text-center">
              <p className="text-3xl font-bold text-red-500">{absentCount}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wide">Absent</p>
            </Card>
          </div>
        )}

        {/* Attendance Rate Bar */}
        {!loadingAttendees && attendees.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Attendance Rate</p>
              <p className={`text-sm font-bold ${
                attendanceRate >= 80 ? 'text-green-600' :
                attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {attendanceRate}%
              </p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  attendanceRate >= 80 ? 'bg-green-500' :
                  attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </Card>
        )}

        {/* Attendees Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
              Attendees ({attendees.length})
            </h2>
            <button
              onClick={fetchAttendees}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Refresh
            </button>
          </div>

          {loadingAttendees ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : attendees.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <UserGroupIcon className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm font-medium">No attendance records yet</p>
              <p className="text-gray-400 text-xs mt-1">
                Records will appear here once attendance is taken for this session.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      #
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Participant ID
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attendees.map((attendee, index) => (
                    <tr
                      key={attendee.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Row Number */}
                      <td className="py-3 px-4 text-gray-400 text-xs">
                        {index + 1}
                      </td>

                      {/* Participant ID */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {attendee.participant_id || attendee.participant || '—'}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {attendee.participant_name ||
                           `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim() ||
                           '—'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {attendee.present ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            <XCircleIcon className="h-3.5 w-3.5" />
                            Absent
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between">
                <span>{attendees.length} record{attendees.length !== 1 ? 's' : ''}</span>
                <span>Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </Card>

      </div>
    </Layout>
  );
};

export default SessionAttendancePage;