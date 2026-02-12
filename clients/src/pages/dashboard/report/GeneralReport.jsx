/**
 * Youth Program Management - General Analytics Report
 * Comprehensive report covering Users, Programs, Participants, Assessments, Attendance, and Indicators
 * Professional PDF generation with filtering and statistics
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  MapPinIcon,
  BeakerIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import Spinner from '../../../components/common/Spinner';
import useAuth from '../../../hooks/useAuth';
import usersAPI from '../../../services/api/userService';
import programService from '../../../services/api/programService';
import participantService from '../../../services/api/participantService';
import assessmentsService from '../../../services/api/assessmentsService';
import attendanceService from '../../../services/api/attendanceService';
import logo from '../../../assets/images/l-o-g-o.png';

const GeneralReport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // Data states
  const [users, setUsers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [indicators, setIndicators] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    module: 'all', // all, users, programs, participants, assessments, attendance, indicators
    status: 'all',
    searchTerm: ''
  });

  // Check access permissions (Admin, Program Manager)
  // Be defensive - check if user exists first
  const canAccessReports = user && ['admin', 'program_manager'].includes(user.role);

  useEffect(() => {
    // Wait for user to load
    if (!user) {
      console.log('Waiting for user to load...');
      return;
    }

    if (!canAccessReports) {
      console.log('Access denied for role:', user.role);
      navigate('/dashboard');
      return;
    }
    
    console.log('Access granted for role:', user.role);
    fetchAllData();
  }, [user, canAccessReports, navigate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      console.log('Fetching report data...');
      const results = await Promise.allSettled([
        usersAPI.getUsers({ page_size: 1000 }),
        programService.getPrograms({ page_size: 1000 }),
        participantService.getParticipants({ page_size: 1000 }),
        assessmentsService.getAssessments({ page_size: 1000 }),
        attendanceService.getAttendanceRecords({ page_size: 1000 }),
        assessmentsService.getIndicators({ page_size: 1000 })
      ]);

      console.log('API results:', results);

      // Users
      setUsers(results[0].status === 'fulfilled' ? 
        (results[0].value.results || results[0].value || []) : []);
      
      // Programs
      setPrograms(results[1].status === 'fulfilled' ? 
        (results[1].value.results || results[1].value || []) : []);
      
      // Participants
      setParticipants(results[2].status === 'fulfilled' ? 
        (results[2].value.results || results[2].value || []) : []);
      
      // Assessments
      setAssessments(results[3].status === 'fulfilled' ? 
        (results[3].value.results || results[3].value || []) : []);
      
      // Attendance
      setAttendance(results[4].status === 'fulfilled' ? 
        (results[4].value.results || results[4].value || []) : []);
      
      // Indicators
      setIndicators(results[5].status === 'fulfilled' ? 
        (results[5].value.results || results[5].value || []) : []);

      console.log('Data loaded successfully');
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter functions
  const filterByDate = (items, dateField = 'created_at') => {
    return items.filter(item => {
      const itemDate = new Date(item[dateField]);
      if (filters.startDate && itemDate < new Date(filters.startDate)) return false;
      if (filters.endDate && itemDate > new Date(filters.endDate)) return false;
      return true;
    });
  };

  const getFilteredUsers = () => {
    let filtered = filterByDate([...users]);
    
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(u => u.is_active === isActive);
    }
    
    if (filters.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.first_name?.toLowerCase().includes(query) ||
        u.last_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.username?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const getFilteredPrograms = () => {
    let filtered = filterByDate([...programs], 'start_date');
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    
    if (filters.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.location_name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const getFilteredParticipants = () => {
    let filtered = filterByDate([...participants], 'enrollment_date');
    
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(p => p.is_active === isActive);
    }
    
    if (filters.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.participant_id?.toLowerCase().includes(query) ||
        p.first_name?.toLowerCase().includes(query) ||
        p.last_name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const getFilteredAssessments = () => {
    let filtered = filterByDate([...assessments], 'assessment_date');
    
    if (filters.status !== 'all') {
      // Map status filter to assessment types or score ranges
      if (filters.status === 'high') {
        filtered = filtered.filter(a => a.score >= 80);
      } else if (filters.status === 'medium') {
        filtered = filtered.filter(a => a.score >= 50 && a.score < 80);
      } else if (filters.status === 'low') {
        filtered = filtered.filter(a => a.score < 50);
      }
    }
    
    if (filters.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.participant_id?.toLowerCase().includes(query) ||
        a.indicator_name?.toLowerCase().includes(query) ||
        a.program_name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const getFilteredAttendance = () => {
    let filtered = filterByDate([...attendance], 'date');
    
    if (filters.status !== 'all') {
      const isPresent = filters.status === 'present';
      filtered = filtered.filter(a => a.present === isPresent);
    }
    
    if (filters.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.participant_id?.toLowerCase().includes(query) ||
        a.program_name?.toLowerCase().includes(query) ||
        a.session_name?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const getFilteredIndicators = () => {
    let filtered = filterByDate([...indicators]);
    
    if (filters.status !== 'all') {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(i => i.is_active === isActive);
    }
    
    if (filters.searchTerm) {
      const query = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.name?.toLowerCase().includes(query) ||
        i.description?.toLowerCase().includes(query) ||
        i.category?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Calculate comprehensive statistics
  const calculateStats = () => {
    const filteredUsers = getFilteredUsers();
    const filteredPrograms = getFilteredPrograms();
    const filteredParticipants = getFilteredParticipants();
    const filteredAssessments = getFilteredAssessments();
    const filteredAttendance = getFilteredAttendance();
    const filteredIndicators = getFilteredIndicators();

    // Calculate attendance rate
    const presentAttendance = filteredAttendance.filter(a => a.present).length;
    const attendanceRate = filteredAttendance.length > 0 
      ? ((presentAttendance / filteredAttendance.length) * 100).toFixed(1) 
      : 0;

    // Calculate average assessment score
    const totalScore = filteredAssessments.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0);
    const averageScore = filteredAssessments.length > 0 
      ? (totalScore / filteredAssessments.length).toFixed(1) 
      : 0;

    // Calculate face verification rate
    const faceVerified = filteredAttendance.filter(a => a.verified_by_face).length;
    const faceVerificationRate = filteredAttendance.length > 0 
      ? ((faceVerified / filteredAttendance.length) * 100).toFixed(1) 
      : 0;

    return {
      // Users
      totalUsers: filteredUsers.length,
      activeUsers: filteredUsers.filter(u => u.is_active).length,
      inactiveUsers: filteredUsers.filter(u => !u.is_active).length,
      adminUsers: filteredUsers.filter(u => u.role === 'admin').length,
      programManagers: filteredUsers.filter(u => u.role === 'program_manager').length,
      teachers: filteredUsers.filter(u => u.role === 'teacher').length,
      donors: filteredUsers.filter(u => u.role === 'donor').length,
      staff: filteredUsers.filter(u => u.role === 'staff').length,

      // Programs
      totalPrograms: filteredPrograms.length,
      activePrograms: filteredPrograms.filter(p => p.status === 'active').length,
      planningPrograms: filteredPrograms.filter(p => p.status === 'planning').length,
      completedPrograms: filteredPrograms.filter(p => p.status === 'completed').length,
      onHoldPrograms: filteredPrograms.filter(p => p.status === 'on_hold').length,
      cancelledPrograms: filteredPrograms.filter(p => p.status === 'cancelled').length,
      ongoingPrograms: filteredPrograms.filter(p => p.is_ongoing).length,

      // Participants
      totalParticipants: filteredParticipants.length,
      activeParticipants: filteredParticipants.filter(p => p.is_active).length,
      inactiveParticipants: filteredParticipants.filter(p => !p.is_active).length,
      maleParticipants: filteredParticipants.filter(p => p.gender === 'M').length,
      femaleParticipants: filteredParticipants.filter(p => p.gender === 'F').length,
      otherGenderParticipants: filteredParticipants.filter(p => p.gender && !['M', 'F'].includes(p.gender)).length,
      averageAge: filteredParticipants.length > 0
        ? (filteredParticipants.reduce((sum, p) => sum + (p.age || 0), 0) / filteredParticipants.length).toFixed(1)
        : 0,

      // Assessments
      totalAssessments: filteredAssessments.length,
      averageScore: averageScore,
      highScores: filteredAssessments.filter(a => a.score >= 80).length,
      mediumScores: filteredAssessments.filter(a => a.score >= 50 && a.score < 80).length,
      lowScores: filteredAssessments.filter(a => a.score < 50).length,

      // Attendance
      totalAttendance: filteredAttendance.length,
      presentCount: presentAttendance,
      absentCount: filteredAttendance.length - presentAttendance,
      attendanceRate: attendanceRate,
      faceVerifiedCount: faceVerified,
      manualVerifiedCount: filteredAttendance.length - faceVerified,
      faceVerificationRate: faceVerificationRate,

      // Indicators
      totalIndicators: filteredIndicators.length,
      activeIndicators: filteredIndicators.filter(i => i.is_active).length,
      inactiveIndicators: filteredIndicators.filter(i => !i.is_active).length,
      
      // Category breakdown for indicators
      academicIndicators: filteredIndicators.filter(i => i.category === 'academic').length,
      vocationalIndicators: filteredIndicators.filter(i => i.category === 'vocational').length,
      lifeSkillsIndicators: filteredIndicators.filter(i => i.category === 'life_skills').length,
      healthWellnessIndicators: filteredIndicators.filter(i => i.category === 'health_wellness').length,
      leadershipIndicators: filteredIndicators.filter(i => i.category === 'leadership').length,
      artsCultureIndicators: filteredIndicators.filter(i => i.category === 'arts_culture').length,
      sportsIndicators: filteredIndicators.filter(i => i.category === 'sports').length,

      // Measurement type breakdown
      scaleIndicators: filteredIndicators.filter(i => i.measurement_type?.includes('scale')).length,
      percentageIndicators: filteredIndicators.filter(i => i.measurement_type === 'percentage').length,
      yesNoIndicators: filteredIndicators.filter(i => i.measurement_type === 'yes_no').length,
      textIndicators: filteredIndicators.filter(i => i.measurement_type === 'text').length,
      countIndicators: filteredIndicators.filter(i => i.measurement_type === 'count').length
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status, type = 'default') => {
    const colors = {
      // User/Participant status
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      
      // Program status
      planning: 'bg-gray-100 text-gray-800',
      active_program: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      
      // Attendance status
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      
      // Assessment scores
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
      
      // Indicator status
      active_indicator: 'bg-green-100 text-green-800',
      inactive_indicator: 'bg-gray-100 text-gray-800'
    };
    
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      module: 'all',
      status: 'all',
      searchTerm: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.startDate || filters.endDate || filters.module !== 'all' ||
           filters.status !== 'all' || filters.searchTerm;
  };

  const generatePDFReport = () => {
    setGeneratingPDF(true);
    const stats = calculateStats();
    
    const filteredUsers = getFilteredUsers();
    const filteredPrograms = getFilteredPrograms();
    const filteredParticipants = getFilteredParticipants();
    const filteredAssessments = getFilteredAssessments();
    const filteredAttendance = getFilteredAttendance();
    const filteredIndicators = getFilteredIndicators();

    const shouldInclude = (module) => {
      return filters.module === 'all' || filters.module === module;
    };

    const printWindow = window.open('', '_blank');
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Youth Program Management - General Analytics Report</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.5;
            color: #111827;
            background: white;
            padding: 24px;
          }
          .container {
            max-width: 1400px;
            margin: 0 auto;
            border: 1px solid #e5e7eb;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            color: white;
            padding: 32px;
            border-bottom: 4px solid #000000;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 24px;
          }
          .logo-container {
            background: white;
            padding: 12px;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .logo-container img {
            height: 80px;
            width: auto;
          }
          .company-info h1 {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 6px;
            letter-spacing: -0.025em;
          }
          .company-info p {
            font-size: 14px;
            opacity: 0.9;
          }
          .report-info {
            text-align: right;
          }
          .report-title {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
          }
          .report-date {
            font-size: 13px;
            opacity: 0.9;
          }
          .content { padding: 32px; }
          .section-title {
            font-size: 20px;
            font-weight: 700;
            margin: 32px 0 20px 0;
            padding-bottom: 8px;
            border-bottom: 3px solid #000000;
            color: #111827;
            letter-spacing: -0.025em;
          }
          .section-title:first-of-type {
            margin-top: 0;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 24px;
          }
          .stat-box {
            border: 1px solid #e5e7eb;
            padding: 20px;
            text-align: center;
            background: #f9fafb;
            border-radius: 8px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          .stat-value {
            font-size: 32px;
            font-weight: 800;
            color: #111827;
            margin-bottom: 8px;
            line-height: 1;
          }
          .stat-label {
            font-size: 13px;
            text-transform: uppercase;
            font-weight: 600;
            color: #4b5563;
            letter-spacing: 0.025em;
          }
          .stat-subtitle {
            font-size: 12px;
            color: #6b7280;
            margin-top: 6px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            border: 1px solid #e5e7eb;
            font-size: 12px;
          }
          .table th {
            background: #f3f4f6;
            color: #374151;
            font-weight: 600;
            padding: 12px 8px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #e5e7eb;
          }
          .table td {
            padding: 12px 8px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }
          .table tr:last-child td {
            border-bottom: none;
          }
          .table tr:hover {
            background: #f9fafb;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
          .bg-green-100 { background: #e5e7eb; color: #111827; }
          .bg-red-100 { background: #d1d5db; color: #111827; }
          .bg-blue-100 { background: #f3f4f6; color: #111827; }
          .bg-yellow-100 { background: #e5e7eb; color: #111827; }
          .bg-gray-100 { background: #f3f4f6; color: #4b5563; }
          .bg-purple-100 { background: #e5e7eb; color: #111827; }
          .footer {
            margin-top: 48px;
            padding: 24px 32px;
            background: #f9fafb;
            border-top: 1px solid #e5e7eb;
          }
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            margin-top: 40px;
          }
          .signature-line {
            border-bottom: 2px solid #000000;
            margin: 40px 0 12px 0;
            width: 80%;
          }
          .signature-label {
            font-weight: 700;
            font-size: 13px;
            text-transform: uppercase;
            color: #374151;
            letter-spacing: 0.05em;
          }
          .flex-between {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .text-xs { font-size: 11px; }
          .text-sm { font-size: 12px; }
          .text-lg { font-size: 16px; }
          .font-bold { font-weight: 700; }
          .font-semibold { font-weight: 600; }
          .mt-4 { margin-top: 16px; }
          .mb-4 { margin-bottom: 16px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          @media print {
            body { background: white; padding: 0; }
            .container { border: none; box-shadow: none; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="header-content">
              <div class="logo-section">
                <div class="logo-container">
                  <img src="${logo}" alt="Organization Logo" />
                </div>
                <div class="company-info">
                  <h1>Youth Program Management</h1>
                  <p>Empowering Youth Through Education & Development</p>
                </div>
              </div>
              <div class="report-info">
                <div class="report-title">General Analytics Report</div>
                <div class="report-date">Generated: ${formatDateTime(new Date())}</div>
                <div class="report-date">By: ${user?.first_name} ${user?.last_name} (${user?.role})</div>
              </div>
            </div>
          </div>

          <div class="content">
            ${shouldInclude('users') ? `
           

            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                ${filteredUsers.slice(0, 30).map(user => `
                  <tr>
                    <td><strong>${user.first_name || ''} ${user.last_name || ''}</strong></td>
                    <td>${user.username || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${(user.role_display || user.role || 'N/A').toUpperCase()}</td>
                    <td><span class="status-badge ${user.is_active ? 'bg-green-100' : 'bg-red-100'}">
                      ${user.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span></td>
                    <td>${formatDate(user.date_joined || user.created_at)}</td>
                  </tr>
                `).join('')}
                ${filteredUsers.length > 30 ? `<tr><td colspan="6" style="text-align: center; font-style: italic; padding: 12px;">... and ${filteredUsers.length - 30} more users</td></tr>` : ''}
              </tbody>
            </table>
            ` : ''}

            ${shouldInclude('programs') ? `
            <!-- Programs Section -->
            <table class="table">
              <thead>
                <tr>
                  <th>Program Name</th>
                  <th>Location</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Participants</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredPrograms.slice(0, 30).map(program => `
                  <tr>
                    <td><strong>${program.name || 'N/A'}</strong></td>
                    <td>${program.location_name || program.location_city || 'N/A'}</td>
                    <td>${formatDate(program.start_date)}</td>
                    <td>${formatDate(program.end_date)}</td>
                    <td>${program.enrollment_count || 0} / ${program.target_participants || 'N/A'}</td>
                    <td><span class="status-badge ${getStatusColor(program.status)}">
                      ${(program.status || 'N/A').toUpperCase()}
                    </span></td>
                  </tr>
                `).join('')}
                ${filteredPrograms.length > 30 ? `<tr><td colspan="6" style="text-align: center; font-style: italic; padding: 12px;">... and ${filteredPrograms.length - 30} more programs</td></tr>` : ''}
              </tbody>
            </table>
            ` : ''}

            ${shouldInclude('participants') ? `
            <!-- Participants Section 
            <h2 class="section-title">Participants Analysis</h2>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">${stats.activeParticipants}</div>
                <div class="stat-label">Active Participants</div>
                <div class="stat-subtitle">${((stats.activeParticipants / (stats.totalParticipants || 1)) * 100).toFixed(1)}% of total</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.maleParticipants}</div>
                <div class="stat-label">Male</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.femaleParticipants}</div>
                <div class="stat-label">Female</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.averageAge}</div>
                <div class="stat-label">Avg. Age</div>
              </div>
            </div>
-->
            <table class="table">
              <thead>
                <tr>
                  <th>Participant ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Enrollment Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredParticipants.slice(0, 30).map(participant => `
                  <tr>
                    <td><strong>${participant.participant_id || 'N/A'}</strong></td>
                    <td>${participant.first_name || ''} ${participant.last_name || ''}</td>
                    <td>${participant.age || '-'}</td>
                    <td>${participant.gender_display || participant.gender || 'N/A'}</td>
                    <td>${formatDate(participant.enrollment_date)}</td>
                    <td><span class="status-badge ${participant.is_active ? 'bg-green-100' : 'bg-red-100'}">
                      ${participant.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span></td>
                  </tr>
                `).join('')}
                ${filteredParticipants.length > 30 ? `<tr><td colspan="6" style="text-align: center; font-style: italic; padding: 12px;">... and ${filteredParticipants.length - 30} more participants</td></tr>` : ''}
              </tbody>
            </table>
            ` : ''}

            ${shouldInclude('assessments') ? `
            <!-- Assessments Section 
            <h2 class="section-title">Assessments Analysis</h2>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">${stats.totalAssessments}</div>
                <div class="stat-label">Total Assessments</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.averageScore}%</div>
                <div class="stat-label">Avg. Score</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.highScores}</div>
                <div class="stat-label">High Scores (80%+)</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.lowScores}</div>
                <div class="stat-label">Low Scores (<50%)</div>
              </div>
            </div>
-->
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Participant</th>
                  <th>Indicator</th>
                  <th>Program</th>
                  <th>Score</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                ${filteredAssessments.slice(0, 30).map(assessment => `
                  <tr>
                    <td>${formatDate(assessment.assessment_date)}</td>
                    <td><strong>${assessment.participant_id || 'N/A'}</strong></td>
                    <td>${assessment.indicator_name || 'N/A'}</td>
                    <td>${assessment.program_name || 'N/A'}</td>
                    <td><span class="status-badge ${
                      assessment.score >= 80 ? 'bg-green-100' : 
                      assessment.score >= 50 ? 'bg-yellow-100' : 'bg-red-100'
                    }">${assessment.score || 'N/A'}</span></td>
                    <td>${assessment.indicator_category || 'N/A'}</td>
                  </tr>
                `).join('')}
                ${filteredAssessments.length > 30 ? `<tr><td colspan="6" style="text-align: center; font-style: italic; padding: 12px;">... and ${filteredAssessments.length - 30} more assessments</td></tr>` : ''}
              </tbody>
            </table>
            ` : ''}

            ${shouldInclude('attendance') ? `
            <!-- Attendance Section 
            <h2 class="section-title">Attendance Analysis</h2>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">${stats.presentCount}</div>
                <div class="stat-label">Present</div>
                <div class="stat-subtitle">${stats.attendanceRate}% rate</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.absentCount}</div>
                <div class="stat-label">Absent</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.faceVerifiedCount}</div>
                <div class="stat-label">Face Verified</div>
                <div class="stat-subtitle">${stats.faceVerificationRate}% of total</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.manualVerifiedCount}</div>
                <div class="stat-label">Manual Entry</div>
              </div>
            </div>
-->
            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Participant</th>
                  <th>Program</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Verification</th>
                </tr>
              </thead>
              <tbody>
                ${filteredAttendance.slice(0, 30).map(record => `
                  <tr>
                    <td>${formatDate(record.date)}</td>
                    <td><strong>${record.participant_id || 'N/A'}</strong></td>
                    <td>${record.program_name || 'N/A'}</td>
                    <td>${record.session_name || 'N/A'}</td>
                    <td><span class="status-badge ${record.present ? 'bg-green-100' : 'bg-red-100'}">
                      ${record.present ? 'PRESENT' : 'ABSENT'}
                    </span></td>
                    <td>
                      ${record.verified_by_face 
                        ? `<span class="status-badge bg-blue-100">FACE (${(record.confidence_score || 0).toFixed(1)}%)</span>` 
                        : `<span class="status-badge bg-gray-100">MANUAL</span>`
                      }
                    </td>
                  </tr>
                `).join('')}
                ${filteredAttendance.length > 30 ? `<tr><td colspan="6" style="text-align: center; font-style: italic; padding: 12px;">... and ${filteredAttendance.length - 30} more attendance records</td></tr>` : ''}
              </tbody>
            </table>
            ` : ''}

            ${shouldInclude('indicators') ? `
            <!-- Indicators Section 
            <h2 class="section-title">Indicators (KPIs) Analysis</h2>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-value">${stats.totalIndicators}</div>
                <div class="stat-label">Total Indicators</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.activeIndicators}</div>
                <div class="stat-label">Active</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.academicIndicators}</div>
                <div class="stat-label">Academic</div>
              </div>
              <div class="stat-box">
                <div class="stat-value">${stats.scaleIndicators}</div>
                <div class="stat-label">Scale-Based</div>
              </div>
            </div>
-->
            <!-- Category Breakdown -->
            <div style="margin: 24px 0;">
              <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #374151;">Indicators by Category</h3>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
                <div style="padding: 12px; background: #f3f4f6; border-radius: 6px;">
                  <span style="font-size: 13px; color: #4b5563;">Academic</span>
                  <span style="float: right; font-weight: 700; color: #111827;">${stats.academicIndicators}</span>
                </div>
                <div style="padding: 12px; background: #f3f4f6; border-radius: 6px;">
                  <span style="font-size: 13px; color: #4b5563;">Vocational</span>
                  <span style="float: right; font-weight: 700; color: #111827;">${stats.vocationalIndicators}</span>
                </div>
                <div style="padding: 12px; background: #f3f4f6; border-radius: 6px;">
                  <span style="font-size: 13px; color: #4b5563;">Life Skills</span>
                  <span style="float: right; font-weight: 700; color: #111827;">${stats.lifeSkillsIndicators}</span>
                </div>
                <div style="padding: 12px; background: #f3f4f6; border-radius: 6px;">
                  <span style="font-size: 13px; color: #4b5563;">Health & Wellness</span>
                  <span style="float: right; font-weight: 700; color: #111827;">${stats.healthWellnessIndicators}</span>
                </div>
                <div style="padding: 12px; background: #f3f4f6; border-radius: 6px;">
                  <span style="font-size: 13px; color: #4b5563;">Leadership</span>
                  <span style="float: right; font-weight: 700; color: #111827;">${stats.leadershipIndicators}</span>
                </div>
                <div style="padding: 12px; background: #f3f4f6; border-radius: 6px;">
                  <span style="font-size: 13px; color: #4b5563;">Arts & Culture</span>
                  <span style="float: right; font-weight: 700; color: #111827;">${stats.artsCultureIndicators}</span>
                </div>
                <div style="padding: 12px; background: #f3f4f6; border-radius: 6px;">
                  <span style="font-size: 13px; color: #4b5563;">Sports</span>
                  <span style="float: right; font-weight: 700; color: #111827;">${stats.sportsIndicators}</span>
                </div>
                <div style="padding: 12px; background: #f3f4f6; border-radius: 6px;">
                  <span style="font-size: 13px; color: #4b5563;">Other</span>
                  <span style="float: right; font-weight: 700; color: #111827;">${stats.totalIndicators - stats.academicIndicators - stats.vocationalIndicators - stats.lifeSkillsIndicators - stats.healthWellnessIndicators - stats.leadershipIndicators - stats.artsCultureIndicators - stats.sportsIndicators}</span>
                </div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Indicator Name</th>
                  <th>Category</th>
                  <th>Measurement Type</th>
                  <th>Range</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredIndicators.slice(0, 30).map(indicator => `
                  <tr>
                    <td><strong>${indicator.name || 'N/A'}</strong></td>
                    <td><span class="status-badge bg-blue-100">${(indicator.category_display || indicator.category || 'N/A').toUpperCase()}</span></td>
                    <td>${indicator.measurement_type?.replace(/_/g, ' ') || 'N/A'}</td>
                    <td>${!['yes_no', 'text'].includes(indicator.measurement_type) 
                      ? `${indicator.min_value || 0} - ${indicator.max_value || 10}` 
                      : 'N/A'}</td>
                    <td><span class="status-badge ${indicator.is_active ? 'bg-green-100' : 'bg-gray-100'}">
                      ${indicator.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span></td>
                  </tr>
                `).join('')}
                ${filteredIndicators.length > 30 ? `<tr><td colspan="5" style="text-align: center; font-style: italic; padding: 12px;">... and ${filteredIndicators.length - 30} more indicators</td></tr>` : ''}
              </tbody>
            </table>
            ` : ''}
          </div>

          <!-- Footer with Signatures -->
          <div class="footer">
            <div style="margin-bottom: 24px;">
              <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 12px; color: #374151;">Report Summary</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                <div>
                  <p style="font-size: 12px; color: #4b5563; margin-bottom: 8px;">
                    <span style="font-weight: 700;">Generated By:</span> ${user?.first_name} ${user?.last_name}
                  </p>
                  <p style="font-size: 12px; color: #4b5563; margin-bottom: 8px;">
                    <span style="font-weight: 700;">Role:</span> ${user?.role_display || user?.role}
                  </p>
                  <p style="font-size: 12px; color: #4b5563; margin-bottom: 8px;">
                    <span style="font-weight: 700;">Date Range:</span> ${filters.startDate || 'All Time'} - ${filters.endDate || 'Present'}
                  </p>
                </div>
                <div>
                  <p style="font-size: 12px; color: #4b5563; margin-bottom: 8px;">
                    <span style="font-weight: 700;">Total Records:</span> ${stats.totalUsers + stats.totalPrograms + stats.totalParticipants + stats.totalAssessments + stats.totalAttendance}
                  </p>
                  <p style="font-size: 12px; color: #4b5563; margin-bottom: 8px;">
                    <span style="font-weight: 700;">Modules Included:</span> ${filters.module === 'all' ? 'All' : filters.module}
                  </p>
                  <p style="font-size: 12px; color: #4b5563; margin-bottom: 8px;">
                    <span style="font-weight: 700;">Filters Applied:</span> ${hasActiveFilters() ? 'Yes' : 'None'}
                  </p>
                </div>
              </div>
            </div>

            <div class="signature-section">
              <div>
                <div class="signature-line"></div>
                <div class="signature-label">Report Generated By</div>
                <div style="font-size: 11px; margin-top: 8px; color: #6b7280;">
                  ${user?.first_name} ${user?.last_name}<br>
                  ${formatDate(new Date())}
                </div>
              </div>
              <div>
                <div class="signature-line"></div>
                <div class="signature-label">Approved By</div>
                <div style="font-size: 11px; margin-top: 8px; color: #6b7280;">
                  Program Director<br>
                  Date: _________________
                </div>
              </div>
            </div>
            
            <div style="margin-top: 32px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              <p>This report is confidential and intended for internal use only.</p>
              <p>© ${new Date().getFullYear()} Youth Program Management System. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(reportHTML);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      setGeneratingPDF(false);
    }, 500);
  };

  const stats = calculateStats();

  // Show loading while user is being fetched
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <Spinner size="lg" />
            <span className="text-gray-600">Loading user data...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <Spinner size="lg" />
            <span className="text-gray-600">Loading analytics data...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!canAccessReports) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m11-4a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              Administrator or Program Manager privileges required.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <ChartBarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">General Analytics Report</h1>
                  <p className="text-blue-100 text-sm">Comprehensive system overview with KPIs and performance metrics</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={generatePDFReport}
                  disabled={generatingPDF}
                  className="bg-white text-blue-600 hover:bg-blue-50 border-white"
                >
                  {generatingPDF ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchAllData}
                  className="bg-blue-700 text-white hover:bg-blue-800 border-blue-600"
                >
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Filters */}
          <Card className="mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FunnelIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Report Filters
                </h3>
                {hasActiveFilters() && (
                  <button
                    onClick={clearFilters}
                    className="text-sm px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module
                  </label>
                  <select
                    value={filters.module}
                    onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Modules</option>
                    <option value="users">Users</option>
                    <option value="programs">Programs</option>
                    <option value="participants">Participants</option>
                    <option value="assessments">Assessments</option>
                    <option value="attendance">Attendance</option>
                    <option value="indicators">Indicators</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="high">High Scores (80%+)</option>
                    <option value="medium">Medium Scores (50-79%)</option>
                    <option value="low">Low Scores (&lt;50%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-l-4 border-blue-500 hover:shadow-lg transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
                    <p className="text-sm text-gray-500 mt-1">{stats.activeUsers} active</p>
                  </div>
                  <UserGroupIcon className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-green-500 hover:shadow-lg transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase">Active Programs</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activePrograms}</p>
                    <p className="text-sm text-gray-500 mt-1">{stats.totalPrograms} total</p>
                  </div>
                  <DocumentTextIcon className="w-12 h-12 text-green-500 opacity-20" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-purple-500 hover:shadow-lg transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase">Active Participants</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeParticipants}</p>
                    <p className="text-sm text-gray-500 mt-1">{stats.totalParticipants} total</p>
                  </div>
                  <UserGroupIcon className="w-12 h-12 text-purple-500 opacity-20" />
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-orange-500 hover:shadow-lg transition-all">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase">Attendance Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.attendanceRate}%</p>
                    <p className="text-sm text-gray-500 mt-1">{stats.presentCount} present</p>
                  </div>
                  <CheckCircleIcon className="w-12 h-12 text-orange-500 opacity-20" />
                </div>
              </div>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-green-900 uppercase mb-2">Average Assessment Score</p>
                  <p className="text-3xl font-bold text-green-600">{stats.averageScore}%</p>
                  <p className="text-xs text-green-700 mt-2">
                    {stats.highScores} high scores • {stats.mediumScores} medium • {stats.lowScores} low
                  </p>
                </div>
                <ArrowTrendingUpIcon className="w-12 h-12 text-green-600 opacity-30" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-blue-900 uppercase mb-2">Face Verification Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.faceVerificationRate}%</p>
                  <p className="text-xs text-blue-700 mt-2">
                    {stats.faceVerifiedCount} face verified • {stats.manualVerifiedCount} manual
                  </p>
                </div>
                <svg className="w-12 h-12 text-blue-600 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Module Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Users Breakdown */}
            <Card className="hover:shadow-lg transition-all">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600" />
                  Users Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Administrators</span>
                    <span className="font-semibold text-gray-900">{stats.adminUsers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Program Managers</span>
                    <span className="font-semibold text-gray-900">{stats.programManagers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Teachers</span>
                    <span className="font-semibold text-gray-900">{stats.teachers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Staff</span>
                    <span className="font-semibold text-gray-900">{stats.staff}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Donors (Viewers)</span>
                    <span className="font-semibold text-gray-900">{stats.donors}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="font-semibold text-green-600">{stats.activeUsers}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Programs Breakdown */}
            <Card className="hover:shadow-lg transition-all">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2 text-purple-600" />
                  Programs Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active</span>
                    <span className="font-semibold text-green-600">{stats.activePrograms}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Planning</span>
                    <span className="font-semibold text-gray-600">{stats.planningPrograms}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">On Hold</span>
                    <span className="font-semibold text-yellow-600">{stats.onHoldPrograms}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-semibold text-blue-600">{stats.completedPrograms}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Ongoing</span>
                    <span className="font-semibold text-green-600">{stats.ongoingPrograms}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Total Programs</span>
                    <span className="font-semibold text-purple-600">{stats.totalPrograms}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Participants Breakdown */}
            <Card className="hover:shadow-lg transition-all">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <UserGroupIcon className="w-5 h-5 mr-2 text-orange-600" />
                  Participants Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Male</span>
                    <span className="font-semibold text-blue-600">{stats.maleParticipants}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Female</span>
                    <span className="font-semibold text-pink-600">{stats.femaleParticipants}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Other</span>
                    <span className="font-semibold text-gray-600">{stats.otherGenderParticipants}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Age</span>
                    <span className="font-semibold text-gray-900">{stats.averageAge} years</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Active Participants</span>
                    <span className="font-semibold text-green-600">{stats.activeParticipants}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Indicators Breakdown */}
            <Card className="hover:shadow-lg transition-all">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BeakerIcon className="w-5 h-5 mr-2 text-indigo-600" />
                  Indicators by Category
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Academic</span>
                    <span className="font-semibold text-gray-900">{stats.academicIndicators}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Vocational</span>
                    <span className="font-semibold text-gray-900">{stats.vocationalIndicators}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Life Skills</span>
                    <span className="font-semibold text-gray-900">{stats.lifeSkillsIndicators}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Health & Wellness</span>
                    <span className="font-semibold text-gray-900">{stats.healthWellnessIndicators}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Leadership</span>
                    <span className="font-semibold text-gray-900">{stats.leadershipIndicators}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Active Indicators</span>
                    <span className="font-semibold text-green-600">{stats.activeIndicators}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Attendance Breakdown */}
            <Card className="hover:shadow-lg transition-all">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ClockIcon className="w-5 h-5 mr-2 text-green-600" />
                  Attendance Overview
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Present</span>
                    <span className="font-semibold text-green-600">{stats.presentCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Absent</span>
                    <span className="font-semibold text-red-600">{stats.absentCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Face Verified</span>
                    <span className="font-semibold text-blue-600">{stats.faceVerifiedCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Manual Entry</span>
                    <span className="font-semibold text-gray-600">{stats.manualVerifiedCount}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Attendance Rate</span>
                    <span className="font-semibold text-green-600">{stats.attendanceRate}%</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Assessment Breakdown */}
            <Card className="hover:shadow-lg transition-all">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ChartBarIcon className="w-5 h-5 mr-2 text-yellow-600" />
                  Assessment Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">High Scores (80%+)</span>
                    <span className="font-semibold text-green-600">{stats.highScores}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Medium (50-79%)</span>
                    <span className="font-semibold text-yellow-600">{stats.mediumScores}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Low Scores (&lt;50%)</span>
                    <span className="font-semibold text-red-600">{stats.lowScores}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-gray-600">Total Assessments</span>
                    <span className="font-semibold text-gray-900">{stats.totalAssessments}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Score</span>
                    <span className="font-semibold text-blue-600">{stats.averageScore}%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filter Status Bar */}
          <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-semibold">Active Filters:</span>
                {hasActiveFilters() ? (
                  <div className="flex items-center space-x-2">
                    {filters.startDate && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                        From: {filters.startDate}
                      </span>
                    )}
                    {filters.endDate && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                        To: {filters.endDate}
                      </span>
                    )}
                    {filters.module !== 'all' && (
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs capitalize">
                        Module: {filters.module}
                      </span>
                    )}
                    {filters.status !== 'all' && (
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs capitalize">
                        Status: {filters.status}
                      </span>
                    )}
                    {filters.searchTerm && (
                      <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-md text-xs">
                        Search: "{filters.searchTerm}"
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">No filters applied - showing all data</span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                Last updated: {formatDateTime(new Date())}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GeneralReport; 