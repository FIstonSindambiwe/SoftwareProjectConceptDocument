// src/utils/helpers.js
import { 
  DATE_FORMAT, 
  DATETIME_FORMAT, 
  DISPLAY_DATE_FORMAT, 
  DISPLAY_DATETIME_FORMAT,
  USER_ROLE_LABELS,
  ROLE_BADGE_VARIANTS,
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUS_VARIANTS,
} from './constants';

/**
 * Format date to display format
 */
export const formatDate = (date, format = DISPLAY_DATE_FORMAT) => {
  if (!date) return '';
  
  const d = new Date(date);
  
  if (format === DISPLAY_DATE_FORMAT) {
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  if (format === DISPLAY_DATETIME_FORMAT) {
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return d.toLocaleDateString();
};

/**
 * Format datetime to display format
 */
export const formatDateTime = (datetime) => {
  return formatDate(datetime, DISPLAY_DATETIME_FORMAT);
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 50, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + suffix;
};

/**
 * Capitalize first letter of string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert snake_case to Title Case
 */
export const snakeToTitle = (str) => {
  if (!str) return '';
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Get user role label
 */
export const getUserRoleLabel = (role) => {
  return USER_ROLE_LABELS[role] || snakeToTitle(role);
};

/**
 * Get role badge variant
 */
export const getRoleBadgeVariant = (role) => {
  return ROLE_BADGE_VARIANTS[role] || 'default';
};

/**
 * Get enrollment status label
 */
export const getEnrollmentStatusLabel = (status) => {
  return ENROLLMENT_STATUS_LABELS[status] || snakeToTitle(status);
};

/**
 * Get enrollment status badge variant
 */
export const getEnrollmentStatusVariant = (status) => {
  return ENROLLMENT_STATUS_VARIANTS[status] || 'default';
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Parse API error
 */
export const parseApiError = (error) => {
  // Handle different error formats
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.detail) {
    return error.detail;
  }
  
  if (error.non_field_errors) {
    return Array.isArray(error.non_field_errors) 
      ? error.non_field_errors[0] 
      : error.non_field_errors;
  }
  
  // Handle field errors
  if (typeof error === 'object') {
    const firstKey = Object.keys(error)[0];
    if (firstKey && error[firstKey]) {
      const errorValue = error[firstKey];
      return Array.isArray(errorValue) ? errorValue[0] : errorValue;
    }
  }
  
  return 'An error occurred. Please try again.';
};

/**
 * Download file from blob
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Debounce function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: errors.length === 0 ? 'strong' : errors.length <= 2 ? 'medium' : 'weak',
  };
};

/**
 * Generate random ID
 */
export const generateId = (prefix = '') => {
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${random}` : random;
};

/**
 * Group array by key
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Sort array by key
 */
export const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Remove duplicates from array
 */
export const unique = (array, key) => {
  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }
  return [...new Set(array)];
};

/**
 * Check if object is empty
 */
export const isEmpty = (obj) => {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

/**
 * Deep clone object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Merge objects
 */
export const mergeObjects = (...objects) => {
  return Object.assign({}, ...objects);
};

/**
 * Get nested property value
 */
export const getNestedValue = (obj, path, defaultValue = null) => {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
};

/**
 * Calculate age from birthdate
 */
export const calculateAge = (birthdate) => {
  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

/**
 * Generate color from string (for avatars)
 */
export const stringToColor = (str) => {
  if (!str) return '#6B7280';
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6'
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
};

/**
 * Check if date is in past
 */
export const isPast = (date) => {
  return new Date(date) < new Date();
};

/**
 * Check if date is in future
 */
export const isFuture = (date) => {
  return new Date(date) > new Date();
};

/**
 * Get days between dates
 */
export const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Export all helpers
export default {
  formatDate,
  formatDateTime,
  getRelativeTime,
  truncateText,
  capitalize,
  snakeToTitle,
  getUserRoleLabel,
  getRoleBadgeVariant,
  getEnrollmentStatusLabel,
  getEnrollmentStatusVariant,
  formatNumber,
  formatPercentage,
  calculatePercentage,
  parseApiError,
  downloadFile,
  copyToClipboard,
  debounce,
  isValidEmail,
  validatePassword,
  generateId,
  groupBy,
  sortBy,
  unique,
  isEmpty,
  deepClone,
  mergeObjects,
  getNestedValue,
  calculateAge,
  formatFileSize,
  getInitials,
  stringToColor,
  isToday,
  isPast,
  isFuture,
  daysBetween,
};