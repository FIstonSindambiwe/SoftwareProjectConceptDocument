// src/pages/dashboard/DashboardPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon, AcademicCapIcon, UserGroupIcon,
  ClipboardDocumentCheckIcon, ChartBarIcon,
  ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  PlusIcon, DocumentTextIcon, CameraIcon,
  SparklesIcon, BoltIcon, ArrowPathIcon,
  ExclamationCircleIcon, PresentationChartBarIcon,
} from '@heroicons/react/24/outline';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import useAuth from '../../hooks/useAuth';

// Charts
import AttendanceChart from '../../components/chart/AttendanceChart';
import AssessmentProgressChart from '../../components/chart/AssessmentProgressChart';
import ParticipantGrowthChart from '../../components/chart/ParticipantGrowthChart';
import AttendanceRateDonut from '../../components/chart/AttendanceRateDonut';

// Services
import participantService from '../../services/api/participantService';
import programService from '../../services/api/programService';
import userService from '../../services/api/userService';
import attendanceService from '../../services/api/attendanceService';
import assessmentsService from '../../services/api/assessmentsService';

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
    if (r.status === 'present' || r.present || r.is_present) map[label].present++;
    else map[label].absent++;
  });

  return days.map(d => map[d]);
};

/* ─── Transform assessments stats → progress chart ──────────── */
const buildProgressChartData = (assessments = []) => {
  const monthMap = {};

  assessments.forEach(a => {
    const d = new Date(a.assessment_date);
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    if (!monthMap[month]) monthMap[month] = { month, _counts: {} };

    const cat = a.indicator_category_key || a.category || 'other';
    if (!monthMap[month][cat]) { 
      monthMap[month][cat] = 0; 
      monthMap[month]._counts[cat] = 0; 
    }
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

    const monthsAgo = (now - d) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo <= 3) monthMap[label].new++;
    else monthMap[label].returning++;
  });

  return Object.values(monthMap);
};

/* ─── Stat Card (Clean White with Subtle Border) ───────────────── */
const StatCard = ({ title, value, subvalue, icon: Icon, onClick, delay = 0, loading, color = 'blue' }) => {
  const accentColors = {
    blue: '#3b82f6',
    green: '#10b981',
    amber: '#f59e0b',
    purple: '#8b5cf6',
    rose: '#f43f5e',
    teal: '#2dd4bf',
    indigo: '#6366f1',
    gray: '#6b7280'
  };
  
  const accent = accentColors[color] || '#3b82f6';

  return (
    <Card 
      className={`fade-up cursor-pointer hover:shadow-md transition-all duration-200 bg-white border border-gray-200`}
      style={{ 
        animationDelay: `${delay}ms`,
        backgroundColor: '#ffffff'
      }}
      onClick={onClick}
      padding={true}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse mt-2" />
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {value ?? '—'}
              </p>
              {subvalue && (
                <p className="text-xs text-gray-500 mt-1">
                  {subvalue}
                </p>
              )}
            </>
          )}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg flex-shrink-0 ml-2" style={{ background: accent + '10' }}>
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
        )}
      </div>
    </Card>
  );
};

/* ─── Chart Card (using Card component) ──────────────────────── */
const ChartCard = ({ title, subtitle, action, children, delay = 0, loading, empty, badge }) => (
  <Card 
    className="fade-up overflow-hidden"
    style={{ animationDelay: `${delay}ms` }}
    title={title}
    subtitle={subtitle}
    action={badge && (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300">
        {badge}
      </span>
    )}
  >
    {loading ? (
      <div className="h-48 flex items-center justify-center">
        <Spinner size="md" />
      </div>
    ) : empty ? (
      <div className="h-48 flex flex-col items-center justify-center text-gray-500">
        <ChartBarIcon className="h-10 w-10 mb-2 opacity-30" />
        <p className="text-xs">No data available yet</p>
      </div>
    ) : (
      children
    )}
  </Card>
);

/* ─── Quick Action Card (using Card component) ───────────────── */
const ActionCard = ({ icon: Icon, label, sub, onClick, color = '#6366f1', delay = 0 }) => (
  <Card 
    className={`fade-up cursor-pointer hover:shadow-md transition-all group`}
    style={{ animationDelay: `${delay}ms` }}
    onClick={onClick}
    padding={false}
  >
    <div className="flex items-center gap-4 p-4">
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '22' }}
      >
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 truncate">{sub}</p>
      </div>
      <span className="text-gray-400 group-hover:text-gray-600 transition-colors text-lg">›</span>
    </div>
  </Card>
);

/* ─── Welcome Card (using Card component) ────────────────────── */
const WelcomeCard = ({ user, roleColor, attendanceRate, statsLoading, onRefresh }) => (
  <Card className="relative overflow-hidden" padding={false}>
    <div 
      className="absolute inset-0 opacity-[0.04]"
      style={{ 
        backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
        backgroundSize: '32px 32px' 
      }} 
    />
    <div 
      className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 pointer-events-none"
      style={{ 
        background: `radial-gradient(circle, ${roleColor}, transparent)`, 
        transform: 'translate(30%,-30%)' 
      }} 
    />
    
    <div className="relative px-8 py-7 flex flex-col sm:flex-row sm:items-center gap-5">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: roleColor + '30' }}>
            <SparklesIcon className="h-4 w-4" style={{ color: roleColor }} />
          </div>
          <span 
            className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ 
              color: roleColor, 
              background: roleColor + '18', 
              border: `1px solid ${roleColor}40` 
            }}
          >
            {user?.role?.replace('_', ' ') || 'user'}
          </span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 leading-tight">
          Welcome back,<br />
          <span style={{ color: roleColor }}>{user?.username || 'User'}</span>
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
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
        <button 
          onClick={onRefresh}
          className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Refresh data"
        >
          <ArrowPathIcon className={`h-5 w-5 ${statsLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  </Card>
);

/* ─── Section label ──────────────────────────────────────────── */
const SectionLabel = ({ text, color = '#6366f1' }) => (
  <div className="flex items-center gap-3 fade-in">
    <div className="h-px flex-1 bg-gray-200" />
    <span 
      className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border"
      style={{ color, borderColor: color + '40', background: color + '10' }}
    >
      {text}
    </span>
    <div className="h-px flex-1 bg-gray-200" />
  </div>
);

/* ─── Donor View Card ───────────────────────────────────────── */
const DonorViewCard = () => (
  <Card className="border-pink-200 bg-pink-50">
    <div className="flex items-center gap-3 mb-2">
      <SparklesIcon className="h-5 w-5 text-pink-500" />
      <h3 className="text-sm font-bold text-pink-700">Donor View</h3>
    </div>
    <p className="text-sm text-pink-600 leading-relaxed">
      You have read-only access to program performance and attendance data.
      The charts above reflect live data across all active initiatives.
    </p>
  </Card>
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
  const [progressData,    setProgressData]    = useState([]);
  const [growthData,      setGrowthData]      = useState([]);

  /* ── Fetch stats ── */
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
        const rate = attStats.attendance_rate ?? attStats.rate ??
          (attStats.total_present && attStats.total_records
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

  /* ── Fetch chart data ── */
  const fetchCharts = useCallback(async () => {
    setChartsLoading(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateFrom = sevenDaysAgo.toISOString().split('T')[0];
      const dateTo   = new Date().toISOString().split('T')[0];

      const chartPromises = [
        attendanceService.getAttendanceByDateRange(dateFrom, dateTo).catch(() => ({ results: [] })),
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

  const handleRefresh = () => {
    fetchStats();
    fetchCharts();
  };

  /* ── Progress chart: detect what categories exist ── */
  const progressCategories = progressData.length > 0
    ? Object.keys(progressData[0]).filter(k => k !== 'month')
    : [];

  return (
    <Layout>
      <style>{STYLES}</style>

      <div className="space-y-8 pb-12">
        {/* ── Welcome Card ────────────────────────────────────── */}
        <WelcomeCard 
          user={user}
          roleColor={roleColor}
          attendanceRate={attendanceRate}
          statsLoading={statsLoading}
          onRefresh={handleRefresh}
        />

        {/* ── Error banner ────────────────────────────────────── */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <div className="flex items-center gap-3 text-sm text-red-700">
              <ExclamationCircleIcon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button 
                onClick={() => setError('')} 
                className="text-red-400 hover:text-red-600 text-xs underline"
              >
                Dismiss
              </button>
            </div>
          </Card>
        )}

        {/* ── Stat Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {isAdminOrPM && (
            <StatCard 
              title="Total Users" 
              value={userCount}
              icon={UsersIcon}               
              color="indigo" 
              delay={0}   
              loading={statsLoading}
              onClick={isAdmin?.() ? () => navigate('/dashboard/users') : undefined} 
            />
          )}
          <StatCard   
            title="Active Programs"  
            value={programCount}
            icon={AcademicCapIcon}             
            color="amber"  
            delay={50}  
            loading={statsLoading}
            onClick={() => navigate('/dashboard/programs')} 
          />
          <StatCard   
            title="Participants"     
            value={participantCount}
            icon={UserGroupIcon}               
            color="rose"   
            delay={100} 
            loading={statsLoading}
            onClick={() => navigate('/dashboard/participants')} 
          />
          <StatCard   
            title="Attendance Rate"  
            value={attendanceRate !== null ? `${attendanceRate}%` : null}
            icon={ClipboardDocumentCheckIcon}  
            color="teal"   
            delay={150} 
            loading={statsLoading}
            onClick={isStaffUp ? () => navigate('/dashboard/attendance') : undefined} 
          />
          {isTeacherUp && (
            <StatCard 
              title="Assessments"      
              value={assessmentCount}
              icon={ChartBarIcon}              
              color="blue" 
              delay={200} 
              loading={statsLoading}
              onClick={() => navigate('/dashboard/assessments')} 
            />
          )}
        </div>

        {/* ── Attendance Charts ───────────────────────────────── */}
        <SectionLabel text="Attendance Overview" color="#2dd4bf" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <ChartCard 
              title="Weekly Attendance" 
              badge="7 days"
              subtitle="Present vs absent — last 7 days"
              delay={0} 
              loading={chartsLoading}
              empty={!chartsLoading && attendanceData.every(d => d.present === 0 && d.absent === 0)}
            >
              <AttendanceChart data={attendanceData} />
              <div className="flex gap-5 px-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-0.5 rounded bg-teal-400 inline-block" />
                  Present
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-0.5 rounded bg-red-400 inline-block" />
                  Absent
                </div>
              </div>
            </ChartCard>
          </div>
          <ChartCard 
            title="Overall Rate" 
            subtitle="Current attendance performance"
            delay={80} 
            loading={statsLoading}
            empty={!statsLoading && attendanceRate === null}
          >
            <AttendanceRateDonut rate={attendanceRate ?? 0} />
          </ChartCard>
        </div>

        {/* ── Participant Growth ──────────────────────────────── */}
        {isStaffUp && (
          <>
            <SectionLabel text="Participant Growth" color="#f43f5e" />
            <ChartCard 
              title="Participant Intake" 
              subtitle="New vs returning participants per month"
              delay={0} 
              loading={chartsLoading}
              empty={!chartsLoading && growthData.every(d => d.new === 0 && d.returning === 0)}
            >
              <ParticipantGrowthChart data={growthData} />
              <div className="flex gap-5 px-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-0.5 rounded bg-orange-400 inline-block" />
                  New
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-0.5 rounded bg-rose-500 inline-block" />
                  Returning
                </div>
              </div>
            </ChartCard>
          </>
        )}

        {/* ── Assessment & Program Charts ─────────────────────── */}
        {isTeacherUp && (
          <>
            <SectionLabel text="Assessment Analytics" color="#6366f1" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard 
                title="Score Progress by Category"
                subtitle="Average assessment scores over time"
                delay={0} 
                loading={chartsLoading}
                empty={!chartsLoading && progressData.length === 0}
              >
                <AssessmentProgressChart data={progressData} categories={progressCategories} />
              </ChartCard>
            </div>
          </>
        )}

        {/* ── Quick Actions ───────────────────────────────────── */}
        <SectionLabel text="Quick Actions" color={roleColor} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {isStaffUp && (
            <ActionCard 
              icon={CameraIcon}       
              label="Face Check-In"
              sub="Start attendance with camera"
              onClick={() => navigate('/dashboard/attendance/check-in')}
              color="#2dd4bf" 
              delay={0} 
            />
          )}
          {canEditData?.() && (
            <ActionCard 
              icon={PlusIcon}         
              label="Add Participant"
              sub="Enroll a new youth"
              onClick={() => navigate('/dashboard/participants/create')}
              color="#f43f5e" 
              delay={50} 
            />
          )}
          {isTeacherUp && (
            <ActionCard 
              icon={ChartBarIcon}     
              label="New Assessment"
              sub="Record participant progress"
              onClick={() => navigate('/dashboard/assessments/create')}
              color="#6366f1" 
              delay={100} 
            />
          )}
          <ActionCard   
            icon={DocumentTextIcon} 
            label="Reports"
            sub="View program reports"
            onClick={() => navigate('/dashboard/reports')}
            color="#f59e0b" 
            delay={150} 
          />
          <ActionCard   
            icon={AcademicCapIcon}  
            label="Programs"
            sub="Browse active programs"
            onClick={() => navigate('/dashboard/programs')}
            color="#a78bfa" 
            delay={200} 
          />
          {isAdminOrPM && (
            <ActionCard 
              icon={BoltIcon}         
              label="Bulk Attendance"
              sub="Record for full session"
              onClick={() => navigate('/dashboard/attendance/bulk-record')}
              color="#10b981" 
              delay={250} 
            />
          )}
          {/* New: General Report Quick Action for Admin/PM */}
          {isAdminOrPM && (
            <ActionCard 
              icon={PresentationChartBarIcon}
              label="General Report"
              sub="Download comprehensive analytics"
              onClick={() => navigate('/dashboard/reports/general')}
              color="#8b5cf6"
              delay={300}
            />
          )}
        </div>

        {/* ── Donor note ──────────────────────────────────────── */}
        {isDonor && <DonorViewCard />}
      </div>
    </Layout>
  );
};

export default DashboardPage;