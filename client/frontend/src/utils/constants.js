// src/utils/constants.js

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
export const API_TIMEOUT = 10000; // 10 seconds

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PROGRAM_MANAGER: 'program_manager',
  DONOR: 'donor',
};

export const USER_ROLE_LABELS = {
  admin: 'Administrator',
  teacher: 'Teacher',
  program_manager: 'Program Manager',
  donor: 'Donor',
};

export const USER_ROLE_DESCRIPTIONS = {
  admin: 'Full system access - Can manage users, programs, and all data',
  teacher: 'Can manage attendance, assessments, and participant data',
  program_manager: 'Can manage programs, view reports, and track progress',
  donor: 'Read-only access to reports and aggregated data',
};

// Badge Variants for Roles
export const ROLE_BADGE_VARIANTS = {
  admin: 'danger',
  teacher: 'primary',
  program_manager: 'warning',
  donor: 'success',
};

// User Status
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
  { value: 'N', label: 'Prefer not to say' },
];

// Education Levels
export const EDUCATION_LEVELS = [
  { value: 'none', label: 'No Formal Education' },
  { value: 'primary', label: 'Primary School' },
  { value: 'secondary', label: 'Secondary School' },
  { value: 'vocational', label: 'Vocational Training' },
  { value: 'university', label: 'University' },
];

// Enrollment Status
export const ENROLLMENT_STATUS = {
  ENROLLED: 'enrolled',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  TRANSFERRED: 'transferred',
};

export const ENROLLMENT_STATUS_LABELS = {
  enrolled: 'Enrolled',
  active: 'Active',
  completed: 'Completed',
  dropped: 'Dropped Out',
  transferred: 'Transferred',
};

export const ENROLLMENT_STATUS_VARIANTS = {
  enrolled: 'info',
  active: 'success',
  completed: 'primary',
  dropped: 'danger',
  transferred: 'warning',
};

// Program Status
export const PROGRAM_STATUS = {
  PLANNED: 'planned',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended',
};

export const PROGRAM_STATUS_LABELS = {
  planned: 'Planned',
  active: 'Active',
  completed: 'Completed',
  suspended: 'Suspended',
};

// Assessment Types
export const ASSESSMENT_TYPES = {
  BASELINE: 'baseline',
  PROGRESS: 'progress',
  MIDTERM: 'midterm',
  FINAL: 'final',
};

export const ASSESSMENT_TYPE_LABELS = {
  baseline: 'Baseline',
  progress: 'Progress',
  midterm: 'Midterm',
  final: 'Final',
};

// Indicator Categories
export const INDICATOR_CATEGORIES = {
  ACADEMIC: 'academic',
  SOCIAL: 'social',
  PHYSICAL: 'physical',
  VOCATIONAL: 'vocational',
  LIFE_SKILLS: 'life_skills',
  OTHER: 'other',
};

export const INDICATOR_CATEGORY_LABELS = {
  academic: 'Academic Skills',
  social: 'Social-Emotional Development',
  physical: 'Physical Development',
  vocational: 'Vocational Skills',
  life_skills: 'Life Skills',
  other: 'Other',
};

// Measurement Types
export const MEASUREMENT_TYPES = {
  SCALE_1_10: 'scale_1_10',
  SCALE_1_5: 'scale_1_5',
  PERCENTAGE: 'percentage',
  BINARY: 'binary',
  SCORE: 'score',
};

export const MEASUREMENT_TYPE_LABELS = {
  scale_1_10: 'Scale (1-10)',
  scale_1_5: 'Scale (1-5)',
  percentage: 'Percentage (0-100)',
  binary: 'Pass/Fail',
  score: 'Raw Score',
};

// Attendance Verification Methods
export const VERIFICATION_METHODS = {
  MANUAL: 'manual',
  FACE_RECOGNITION: 'face_recognition',
  QR_CODE: 'qr_code',
  SIGNATURE: 'signature',
  OTHER: 'other',
};

export const VERIFICATION_METHOD_LABELS = {
  manual: 'Manual Entry',
  face_recognition: 'Face Recognition',
  qr_code: 'QR Code Scan',
  signature: 'Signature',
  other: 'Other',
};

// Session Types
export const SESSION_TYPES = {
  CLASS: 'class',
  WORKSHOP: 'workshop',
  ACTIVITY: 'activity',
  ASSESSMENT: 'assessment',
  FIELD_TRIP: 'field_trip',
  OTHER: 'other',
};

export const SESSION_TYPE_LABELS = {
  class: 'Class/Lecture',
  workshop: 'Workshop',
  activity: 'Activity',
  assessment: 'Assessment',
  field_trip: 'Field Trip',
  other: 'Other',
};

// Report Template Types
export const REPORT_TYPES = {
  DONOR_QUARTERLY: 'donor_quarterly',
  PROGRAM_SUMMARY: 'program_summary',
  IMPACT_ASSESSMENT: 'impact_assessment',
  PARTICIPANT_PROGRESS: 'participant_progress',
  ATTENDANCE_REPORT: 'attendance_report',
};

export const REPORT_TYPE_LABELS = {
  donor_quarterly: 'Donor Quarterly Report',
  program_summary: 'Program Summary',
  impact_assessment: 'Impact Assessment',
  participant_progress: 'Participant Progress Report',
  attendance_report: 'Attendance Report',
};

// File Formats
export const FILE_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
};

export const FILE_FORMAT_LABELS = {
  pdf: 'PDF Document',
  excel: 'Excel Spreadsheet',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date Formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export const DISPLAY_DATE_FORMAT = 'MMM DD, YYYY';
export const DISPLAY_DATETIME_FORMAT = 'MMM DD, YYYY HH:mm';

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 150,
  AGE_MIN: 5,
  AGE_MAX: 25,
  CONFIDENCE_SCORE_MIN: 0,
  CONFIDENCE_SCORE_MAX: 1,
  ATTENDANCE_RATE_MIN: 0,
  ATTENDANCE_RATE_MAX: 100,
};

// Face Recognition
export const FACE_RECOGNITION = {
  THRESHOLD: 0.6,
  MIN_CONFIDENCE: 0.6,
  QUALITY_RATINGS: {
    EXCELLENT: { min: 0.9, label: 'Excellent' },
    GOOD: { min: 0.8, label: 'Good' },
    FAIR: { min: 0.7, label: 'Fair' },
    ACCEPTABLE: { min: 0.6, label: 'Acceptable' },
    LOW: { min: 0, label: 'Low' },
  },
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
  THEME: 'theme',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  USERS: '/users',
  PROGRAMS: '/programs',
  PARTICIPANTS: '/participants',
  ATTENDANCE: '/attendance',
  ASSESSMENTS: '/assessments',
  ANALYTICS: '/analytics',
  REPORTS: '/reports',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  CREATE_SUCCESS: 'Created successfully!',
  UPDATE_SUCCESS: 'Updated successfully!',
  DELETE_SUCCESS: 'Deleted successfully!',
  SAVE_SUCCESS: 'Saved successfully!',
};

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  DANGER: '#EF4444',
  INFO: '#06B6D4',
  PURPLE: '#8B5CF6',
  PINK: '#EC4899',
  GRAY: '#6B7280',
};

// Export all as default object
export default {
  API_BASE_URL,
  API_TIMEOUT,
  USER_ROLES,
  USER_ROLE_LABELS,
  USER_ROLE_DESCRIPTIONS,
  ROLE_BADGE_VARIANTS,
  USER_STATUS,
  GENDER_OPTIONS,
  EDUCATION_LEVELS,
  ENROLLMENT_STATUS,
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUS_VARIANTS,
  PROGRAM_STATUS,
  PROGRAM_STATUS_LABELS,
  ASSESSMENT_TYPES,
  ASSESSMENT_TYPE_LABELS,
  INDICATOR_CATEGORIES,
  INDICATOR_CATEGORY_LABELS,
  MEASUREMENT_TYPES,
  MEASUREMENT_TYPE_LABELS,
  VERIFICATION_METHODS,
  VERIFICATION_METHOD_LABELS,
  SESSION_TYPES,
  SESSION_TYPE_LABELS,
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
  FILE_FORMATS,
  FILE_FORMAT_LABELS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  DATE_FORMAT,
  DATETIME_FORMAT,
  DISPLAY_DATE_FORMAT,
  DISPLAY_DATETIME_FORMAT,
  VALIDATION,
  FACE_RECOGNITION,
  STORAGE_KEYS,
  ROUTES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  CHART_COLORS,
};