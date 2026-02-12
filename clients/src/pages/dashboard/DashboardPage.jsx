// src/pages/dashboard/DashboardPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon, AcademicCapIcon, UserGroupIcon,
  ClipboardDocumentCheckIcon, ChartBarIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  PlusIcon, DocumentTextIcon, CameraIcon,
  SparklesIcon, BoltIcon, ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../components/layout/Layout';
import Spinner from '../../components/common/Spinner';
import useAuth from '../../hooks/useAuth';

// Charts
import AttendanceChart          from '../../components/chart/AttendanceChart';
import ProgramEnrollmentChart   from '../../components/chart/ProgramEnrollmentChart';
import AssessmentProgressChart  from '../../components/chart/AssessmentProgressChart';
import ParticipantGrowthChart   from '../../components/chart/ParticipantGrowthChart';
import AttendanceRateDonut      from '../../components/chart/AttendanceRateDonut';

// Services
import participantService  from '../../services/api/participantService';
import programService      from '../../services/api/programService';
import userService         from '../../services/api/userService';
import attendanceService   from '../../services/api/attendanceService';
import assessmentsService  from '../../services/api/assessmentsService';

/* ─── Keyframe CSS ───────────────────────────────────────────── */
const STYLES = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }
  .fade-up { animation: fadeSlideUp 0.38s ease both; }
  .fade-in { animation: fadeSlideUp 0.5s ease both; }
  .count   { animation: countUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
`;

const ROLE_COLORS = {
  admin:           '#6366f1',
  teacher:         '#10b981',
  program_manager: '#f59e0b',
  staff:           '#3b82f6',
  donor:           '#ec4899',
};

/* ─── Helper: get the last N days as labels ─────────────────── */
const lastNDayLabels = (n) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });

/* ─── Transform attendance records → chart data ─────────────── */
const buildAttendanceChartData = (records = []) => {
  const days = lastNDayLabels(7);
  const map = {};
  days.forEach(d => { map[d] = { day: d, present: 0, absent: 0 }; });

  records.forEach(r => {
    if (!r.attendance_date && !r.date) return;
    const d = new Date(r.attendance_date || r.date);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    if (!map[label]) return;
    if (r.status === 'present' || r.is_present) map[label].present++;
    else map[label].absent++;
  });

  return days.map(d => map[d]);
};

/* ─── Transform programs → enrollment chart ─────────────────── */
const buildEnrollmentChartData = (programs = []) =>
  programs
    .filter(p => p.is_active !== false)
    .slice(0, 6)
    .map(p => ({
      program:  p.name?.length > 18 ? p.name.slice(0, 18) + '…' : p.name,
      enrolled: p.participant_count ?? p.total_participants ?? p.enrolled_count ?? 0,
    }))
    .filter(p => p.enrolled > 0);

/* ─── Transform assessments stats → progress chart ──────────── */
const buildProgressChartData = (assessments = []) => {
  // Group by month, average scores per category
  const monthMap = {};

  assessments.forEach(a => {
    const d = new Date(a.assessment_date);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    if (!monthMap[month]) monthMap[month] = { month, _counts: {} };

    const cat = a.indicator_category_key || a.category || 'other';
    if (!monthMap[month][cat]) { monthMap[month][cat] = 0; monthMap[month]._counts[cat] = 0; }
    monthMap[month][cat] += Number(a.score) || 0;
    monthMap[month]._counts[cat]++;
  });

  return Object.values(monthMap).map(row => {
    const { month, _counts, ...cats } = row;
    const averaged = { month };
    Object.keys(cats).forEach(k => {
      averaged[k] = _counts[k] > 0 ? +(cats[k] / _counts[k]).toFixed(2) : 0;
    });
    return averaged;
  }).slice(-6);
};

/* ─── Transform participants over time → growth chart ────────── */
const buildGrowthChartData = (participants = []) => {
  const monthMap = {};
  const now = new Date();

  // Build last 6 months buckets
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    monthMap[label] = { month: label, new: 0, returning: 0 };
  }

  participants.forEach(p => {
    const joined = p.enrollment_date || p.created_at || p.date_joined;
    if (!joined) return;
    const d = new Date(joined);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    if (!monthMap[label]) return;

    // If joined within last 3 months → new, else returning
    const monthsAgo = (now - d) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo <= 3) monthMap[label].new++;
    else monthMap[label].returning++;
  });

  return Object.values(monthMap);
};

/* ─── Stat Card ──────────────────────────────────────────────── */
const StatCard = ({ title, value, icon: Icon, growth, color, onClick, delay = 0, loading }) => {
  const accent = { teal: '#2dd4bf', indigo: '#6366f1', rose: '#f43f5e', amber: '#f59e0b' }[color] || '#6366f1';
  const isUp = growth >= 0;

  return (
    <div onClick={onClick} style={{ animationDelay: `${delay}ms`, borderTop: `3px solid ${accent}` }}
      className={`fade-up bg-gray-900 rounded-2xl p-5 border border-gray-800
        ${onClick ? 'cursor-pointer hover:border-gray-600 hover:bg-gray-800/80' : ''}
        transition-all duration-200 group`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{title}</p>
          {loading
            ? <div className="h-8 w-24 bg-gray-800 rounded-lg animate-pulse mt-2" />
            : <p className="count text-3xl font-black text-white mt-2"
                style={{ animationDelay: `${delay + 100}ms` }}>{value ?? '—'}</p>
          }
          {!loading && growth !== undefined && (
            <div className="flex items-center gap-1.5 mt-2">
              {isUp
                ? <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-emerald-400" />
                : <ArrowTrendingDownIcon className="h-3.5 w-3.5 text-red-400" />
              }
              <span className={`text-xs font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {Math.abs(growth).toFixed(1)}%
              </span>
              <span className="text-xs text-gray-600">vs last month</span>
            </div>
          )}
        </div>
        <div className="p-2.5 rounded-xl flex-shrink-0" style={{ background: accent + '18' }}>
          <Icon className="h-6 w-6" style={{ color: accent }} />
        </div>
      </div>
      {onClick && !loading && (
        <p className="text-xs text-gray-700 mt-3 group-hover:text-gray-400 transition-colors">View all →</p>
      )}
    </div>
  );
};

/* ─── Chart Card ─────────────────────────────────────────────── */
const ChartCard = ({ title, sub, children, delay = 0, loading, empty, badge }) => (
  <div className="fade-up bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden"
    style={{ animationDelay: `${delay}ms` }}>
    <div className="px-5 pt-5 pb-3 flex items-start justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          {badge && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
              {badge}
            </span>
          )}
        </div>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
    <div className="px-2 pb-4">
      {loading
        ? <div className="h-48 flex items-center justify-center">
            <Spinner size="md" />
          </div>
        : empty
          ? <div className="h-48 flex flex-col items-center justify-center text-gray-600">
              <ChartBarIcon className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-xs">No data available yet</p>
            </div>
          : children
      }
    </div>
  </div>
);

/* ─── Quick Action ───────────────────────────────────────────── */
const Action = ({ icon: Icon, label, sub, onClick, color = '#6366f1', delay = 0 }) => (
  <button onClick={onClick} style={{ animationDelay: `${delay}ms` }}
    className="fade-up flex items-center gap-4 w-full p-4 rounded-xl bg-gray-800/60 border border-gray-700
      hover:border-gray-500 hover:bg-gray-800 transition-all text-left group">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: color + '22' }}>
      <Icon className="h-5 w-5" style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="text-xs text-gray-500 truncate">{sub}</p>
    </div>
    <span className="text-gray-600 group-hover:text-gray-300 transition-colors text-lg">›</span>
  </button>
);

/* ─── Section label ──────────────────────────────────────────── */
const SectionLabel = ({ text, color = '#6366f1' }) => (
  <div className="flex items-center gap-3 fade-in">
    <div className="h-px flex-1 bg-gray-800" />
    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border"
      style={{ color, borderColor: color + '40', background: color + '10' }}>
      {text}
    </span>
    <div className="h-px flex-1 bg-gray-800" />
  </div>
);

/* ─── Main Page ──────────────────────────────────────────────── */
const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, canEditData } = useAuth();

  const role       = user?.role || 'staff';
  const roleColor  = ROLE_COLORS[role] || '#6366f1';
  const isAdminOrPM   = ['admin', 'program_manager'].includes(role);
  const isTeacherUp   = ['admin', 'teacher', 'program_manager'].includes(role);
  const isDonor       = role === 'donor';
  const isStaffUp     = !isDonor;

  /* ── Data state ── */
  const [statsLoading,   setStatsLoading]   = useState(true);
  const [chartsLoading,  setChartsLoading]  = useState(true);
  const [error,          setError]          = useState('');

  // Stat numbers
  const [userCount,       setUserCount]       = useState(null);
  const [programCount,    setProgramCount]    = useState(null);
  const [participantCount,setParticipantCount]= useState(null);
  const [attendanceRate,  setAttendanceRate]  = useState(null);
  const [assessmentCount, setAssessmentCount] = useState(null);

  // Chart data
  const [attendanceData,  setAttendanceData]  = useState([]);
  const [enrollmentData,  setEnrollmentData]  = useState([]);
  const [progressData,    setProgressData]    = useState([]);
  const [growthData,      setGrowthData]      = useState([]);

  /* ── Fetch stats (fast, parallel) ── */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const promises = [
        programService.getProgramStats().catch(() => null),
        participantService.getParticipantStats().catch(() => null),
        attendanceService.getAttendanceStats().catch(() => null),
      ];

      if (isAdminOrPM) {
        promises.push(userService.getStats().catch(() => null));
      }

      if (isTeacherUp) {
        promises.push(assessmentsService.getAssessmentStats().catch(() => null));
      }

      const [prgStats, partStats, attStats, ...rest] = await Promise.all(promises);

      setProgramCount(
        prgStats?.total_programs ?? prgStats?.count ?? prgStats?.total ?? null
      );
      setParticipantCount(
        partStats?.total_participants ?? partStats?.count ?? partStats?.total ?? null
      );

      if (attStats) {
        const rate = attStats.attendance_rate ?? attStats.rate
          ?? (attStats.total_present && attStats.total_records
            ? +((attStats.total_present / attStats.total_records) * 100).toFixed(1)
            : null);
        setAttendanceRate(rate);
      }

      if (isAdminOrPM && rest[0]) {
        setUserCount(rest[0].total_users ?? rest[0].count ?? rest[0].total ?? null);
      }
      if (isTeacherUp) {
        const aStats = isAdminOrPM ? rest[1] : rest[0];
        setAssessmentCount(aStats?.total_assessments ?? aStats?.count ?? aStats?.total ?? null);
      }
    } catch (e) {
      console.error('Stats error:', e);
      setError('Some statistics could not be loaded.');
    } finally {
      setStatsLoading(false);
    }
  }, [isAdminOrPM, isTeacherUp]);

  /* ── Fetch chart data (heavier, parallel) ── */
  const fetchCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateFrom = sevenDaysAgo.toISOString().split('T')[0];
      const dateTo   = new Date().toISOString().split('T')[0];

      const chartPromises = [
        // Attendance records last 7 days
        attendanceService.getAttendanceByDateRange(dateFrom, dateTo).catch(() => ({ results: [] })),
        // Programs with enrollment counts
        programService.getPrograms({ is_active: true }).catch(() => ({ results: [] })),
      ];

      if (isStaffUp) {
        chartPromises.push(
          participantService.getParticipants({ ordering: 'created_at' }).catch(() => ({ results: [] }))
        );
      }

      if (isTeacherUp) {
        chartPromises.push(
          assessmentsService.getAssessments({ ordering: '-assessment_date', page_size: 200 }).catch(() => ({ results: [] }))
        );
      }

      const [attRecords, programs, ...rest] = await Promise.all(chartPromises);

      const attList  = attRecords?.results ?? attRecords ?? [];
      const progList = programs?.results ?? programs ?? [];

      setAttendanceData(buildAttendanceChartData(attList));
      setEnrollmentData(buildEnrollmentChartData(progList));

      if (isStaffUp && rest[0]) {
        const partList = rest[0]?.results ?? rest[0] ?? [];
        setGrowthData(buildGrowthChartData(partList));
      }

      if (isTeacherUp) {
        const asmList = isStaffUp ? rest[1] : rest[0];
        const aList   = asmList?.results ?? asmList ?? [];
        setProgressData(buildProgressChartData(aList));
      }
    } catch (e) {
      console.error('Charts error:', e);
    } finally {
      setChartsLoading(false);
    }
  }, [isStaffUp, isTeacherUp]);

  useEffect(() => {
    fetchStats();
    fetchCharts();
  }, [fetchStats, fetchCharts]);

  /* ── Progress chart: detect what categories exist ── */
  const progressCategories = progressData.length > 0
    ? Object.keys(progressData[0]).filter(k => k !== 'month')
    : [];

  return (
    <Layout>
      <style>{STYLES}</style>

      <div className="space-y-8 pb-12">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="fade-in relative overflow-hidden rounded-3xl"
          style={{ background: `linear-gradient(135deg, #0f172a 0%, #1e293b 60%, ${roleColor}22 100%)` }}>
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${roleColor}, transparent)`, transform: 'translate(30%,-30%)' }} />

          <div className="relative px-8 py-7 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: roleColor + '30' }}>
                  <SparklesIcon className="h-4 w-4" style={{ color: roleColor }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ color: roleColor, background: roleColor + '18', border: `1px solid ${roleColor}40` }}>
                  {role.replace('_', ' ')}
                </span>
              </div>
              <h1 className="text-3xl font-black text-white leading-tight">
                Welcome back,<br />
                <span style={{ color: roleColor }}>{user?.username || 'User'}</span>
              </h1>
              <p className="text-gray-400 text-sm mt-2">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {attendanceRate !== null && (
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Attendance Rate</p>
                  <p className="text-4xl font-black" style={{ color: roleColor }}>
                    {statsLoading ? '…' : `${attendanceRate}%`}
                  </p>
                </div>
              )}
              <button onClick={() => { fetchStats(); fetchCharts(); }}
                className="p-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-gray-700/50 transition-colors"
                title="Refresh data">
                <ArrowPathIcon className={`h-5 w-5 ${(statsLoading || chartsLoading) ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Error banner ─────────────────────────────────────── */}
        {error && (
          <div className="fade-in flex items-center gap-3 px-4 py-3 rounded-xl bg-red-950/50 border border-red-900/50 text-sm text-red-300">
            <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-200 text-xs underline">Dismiss</button>
          </div>
        )}

        {/* ── Stat Cards ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isAdminOrPM && (
            <StatCard title="Total Users"      value={userCount}
              icon={UsersIcon}               color="indigo" delay={0}   loading={statsLoading}
              onClick={isAdmin?.() ? () => navigate('/dashboard/users') : undefined} />
          )}
          <StatCard   title="Active Programs"  value={programCount}
            icon={AcademicCapIcon}             color="amber"  delay={50}  loading={statsLoading}
            onClick={() => navigate('/dashboard/programs')} />
          <StatCard   title="Participants"     value={participantCount}
            icon={UserGroupIcon}               color="rose"   delay={100} loading={statsLoading}
            onClick={() => navigate('/dashboard/participants')} />
          <StatCard   title="Attendance Rate"  value={attendanceRate !== null ? `${attendanceRate}%` : null}
            icon={ClipboardDocumentCheckIcon}  color="teal"   delay={150} loading={statsLoading}
            onClick={isStaffUp ? () => navigate('/dashboard/attendance') : undefined} />
          {isTeacherUp && (
            <StatCard title="Assessments"      value={assessmentCount}
              icon={ChartBarIcon}              color="indigo" delay={200} loading={statsLoading}
              onClick={() => navigate('/dashboard/assessments')} />
          )}
        </div>

        {/* ── Attendance Charts (all roles) ─────────────────────── */}
        <SectionLabel text="Attendance Overview" color="#2dd4bf" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <ChartCard title="Weekly Attendance" badge="7 days"
              sub="Present vs absent — last 7 days"
              delay={0} loading={chartsLoading}
              empty={!chartsLoading && attendanceData.every(d => d.present === 0 && d.absent === 0)}>
              <AttendanceChart data={attendanceData} />
              <div className="flex gap-5 px-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-3 h-0.5 rounded bg-teal-400 inline-block" />Present
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-3 h-0.5 rounded bg-red-400 inline-block" />Absent
                </div>
              </div>
            </ChartCard>
          </div>
          <ChartCard title="Overall Rate" sub="Current attendance performance"
            delay={80} loading={statsLoading}
            empty={!statsLoading && attendanceRate === null}>
            <AttendanceRateDonut rate={attendanceRate ?? 0} />
          </ChartCard>
        </div>

        {/* ── Participant Growth (staff+) ───────────────────────── */}
        {isStaffUp && (
          <>
            <SectionLabel text="Participant Growth" color="#f43f5e" />
            <ChartCard title="Participant Intake" sub="New vs returning participants per month"
              delay={0} loading={chartsLoading}
              empty={!chartsLoading && growthData.every(d => d.new === 0 && d.returning === 0)}>
              <ParticipantGrowthChart data={growthData} />
              <div className="flex gap-5 px-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-3 h-0.5 rounded bg-orange-400 inline-block" />New
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-3 h-0.5 rounded bg-rose-500 inline-block" />Returning
                </div>
              </div>
            </ChartCard>
          </>
        )}

        {/* ── Assessment & Program Charts (teacher+) ────────────── */}
        {isTeacherUp && (
          <>
            <SectionLabel text="Assessment Analytics" color="#6366f1" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="Score Progress by Category"
                sub="Average assessment scores over time"
                delay={0} loading={chartsLoading}
                empty={!chartsLoading && progressData.length === 0}>
                <AssessmentProgressChart data={progressData} categories={progressCategories} />
              </ChartCard>

              <ChartCard title="Program Enrollment"
                sub="Active participants per program"
                delay={80} loading={chartsLoading}
                empty={!chartsLoading && enrollmentData.length === 0}>
                <ProgramEnrollmentChart data={enrollmentData} />
              </ChartCard>
            </div>
          </>
        )}

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <SectionLabel text="Quick Actions" color={roleColor} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {isStaffUp && (
            <Action icon={CameraIcon}       label="Face Check-In"
              sub="Start attendance with camera"
              onClick={() => navigate('/dashboard/attendance/face-check-in')}
              color="#2dd4bf" delay={0} />
          )}
          {canEditData?.() && (
            <Action icon={PlusIcon}         label="Add Participant"
              sub="Enroll a new youth"
              onClick={() => navigate('/dashboard/participants/create')}
              color="#f43f5e" delay={50} />
          )}
          {isTeacherUp && (
            <Action icon={ChartBarIcon}     label="New Assessment"
              sub="Record participant progress"
              onClick={() => navigate('/dashboard/assessments/create')}
              color="#6366f1" delay={100} />
          )}
          <Action   icon={DocumentTextIcon} label="Reports"
            sub="View program reports"
            onClick={() => navigate('/dashboard/reports')}
            color="#f59e0b" delay={150} />
          <Action   icon={AcademicCapIcon}  label="Programs"
            sub="Browse active programs"
            onClick={() => navigate('/dashboard/programs')}
            color="#a78bfa" delay={200} />
          {isAdminOrPM && (
            <Action icon={BoltIcon}         label="Bulk Attendance"
              sub="Record for full session"
              onClick={() => navigate('/dashboard/attendance/bulk-record')}
              color="#10b981" delay={250} />
          )}
        </div>

        {/* ── Donor note ───────────────────────────────────────── */}
        {isDonor && (
          <div className="fade-in rounded-2xl border border-pink-900/50 bg-pink-950/30 p-6">
            <div className="flex items-center gap-3 mb-2">
              <SparklesIcon className="h-5 w-5 text-pink-400" />
              <h3 className="text-sm font-bold text-pink-200">Donor View</h3>
            </div>
            <p className="text-sm text-pink-300/70 leading-relaxed">
              You have read-only access to program performance and attendance data.
              The charts above reflect live data across all active initiatives.
            </p>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default DashboardPage;