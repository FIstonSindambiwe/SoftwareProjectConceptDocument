import api from './axiosConfig';

/**
 * Attendance Service
 * Handles all attendance-related API calls including face recognition
 */

const attendanceService = {
  // ==================== ATTENDANCE RECORDS ====================
  
  /**
   * Get all attendance records with optional filters
   * GET /api/v1/attendance/records/
   */
  async getAttendanceRecords(params = {}) {
    try {
      console.log('Fetching attendance records with params:', params);
      const response = await api.get('/attendance/records/', { params });
      console.log('Attendance records fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single attendance record by ID
   * GET /api/v1/attendance/records/{id}/
   */
  async getAttendanceRecord(id) {
    try {
      console.log('Fetching attendance record:', id);
      const response = await api.get(`/attendance/records/${id}/`);
      console.log('Attendance record fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance record:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Create new attendance record
   * POST /api/v1/attendance/records/
   */
  async createAttendanceRecord(data) {
    try {
      console.log('Creating attendance record with data:', data);
      const response = await api.post('/attendance/records/', data);
      console.log('Attendance record created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating attendance record:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Update attendance record
   * PUT /api/v1/attendance/records/{id}/
   */
  async updateAttendanceRecord(id, data) {
    try {
      console.log('Updating attendance record:', id, data);
      const response = await api.put(`/attendance/records/${id}/`, data);
      console.log('Attendance record updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating attendance record:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Partial update attendance record
   * PATCH /api/v1/attendance/records/{id}/
   */
  async patchAttendanceRecord(id, data) {
    try {
      console.log('Patching attendance record:', id, data);
      const response = await api.patch(`/attendance/records/${id}/`, data);
      console.log('Attendance record patched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error patching attendance record:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete attendance record
   * DELETE /api/v1/attendance/records/{id}/
   */
  async deleteAttendanceRecord(id) {
    try {
      console.log('Deleting attendance record:', id);
      const response = await api.delete(`/attendance/records/${id}/`);
      console.log('Attendance record deleted successfully');
      return response.data;
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      throw error.response?.data || error;
    }
  },

  // ==================== BULK OPERATIONS ====================

  /**
   * Record attendance for multiple participants at once
   * POST /api/v1/attendance/records/bulk-record/
   * @param {Object} data - { program, date, session_name, attendance_records }
   */
  async bulkRecordAttendance(data) {
    try {
      console.log('Bulk recording attendance:', data);
      const response = await api.post('/attendance/records/bulk-record/', data);
      console.log('Bulk attendance recorded:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error bulk recording attendance:', error);
      throw error.response?.data || error;
    }
  },

  // ==================== STATISTICS ====================

  /**
   * Get attendance statistics
   * GET /api/v1/attendance/records/stats/
   * @param {Object} params - { program, date_from, date_to }
   */
  async getAttendanceStats(params = {}) {
    try {
      console.log('Fetching attendance statistics:', params);
      const response = await api.get('/attendance/records/stats/', { params });
      console.log('Attendance stats fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
      throw error.response?.data || error;
    }
  },

  // ==================== FACE RECOGNITION ====================

  /**
   * Verify specific participant's attendance using face recognition
   * POST /api/v1/attendance/records/face-verify/
   * @param {FormData} formData - Contains participant_id, program, date, session_name, image
   */
  async verifyAttendanceWithFace(formData) {
    try {
      console.log('Verifying attendance with face recognition');
      const response = await api.post('/attendance/records/face-verify/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Face verification result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error verifying attendance with face:', error);
      console.error('Error response:', error.response?.data);
      
      // Return structured error response
      const errorData = error.response?.data || {};
      throw {
        verified: false,
        error: errorData.error || errorData.detail || 'Failed to verify participant',
        message: errorData.message || 'Face verification failed',
        confidence: errorData.confidence || 0,
        status: error.response?.status || 500
      };
    }
  },

  /**
   * Identify participant from photo and record attendance
   * POST /api/v1/attendance/records/identify-and-record/
   * @param {FormData} formData - Contains program, date, session_name, image
   * @returns {Promise<Object>} - { identified, participant_id?, confidence, attendance?, error?, message?, top_matches? }
   */
  async identifyAndRecordAttendance(formData) {
    try {
      console.log('Identifying participant and recording attendance');
      
      // Log FormData contents for debugging
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File: ${value.name}, ${value.size} bytes, ${value.type}]`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      const response = await api.post('/attendance/records/identify-and-record/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Identification successful:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('Error identifying and recording attendance:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Extract error details from response
      const errorData = error.response?.data || {};
      const status = error.response?.status || 500;
      
      // Build structured error response
      const errorResponse = {
        identified: false,
        error: errorData.error || errorData.detail || 'Failed to identify participant',
        message: errorData.message || 'Face recognition failed',
        top_matches: errorData.top_matches || [],
        confidence: errorData.confidence || 0,
        status: status
      };
      
      // Add specific error messages based on status code
      if (status === 400) {
        // Bad request - could be validation error or face recognition issue
        if (errorData.error?.includes('not yet implemented')) {
          errorResponse.error = 'Face recognition feature is not yet available';
          errorResponse.message = 'Please use manual attendance or bulk check-in';
          errorResponse.isNotImplemented = true;
        } else if (errorData.error?.includes('No face detected')) {
          errorResponse.error = 'No face detected in image';
          errorResponse.message = 'Please ensure your face is clearly visible and well-lit';
          errorResponse.isFaceDetectionError = true;
        } else if (errorData.error?.includes('Multiple faces')) {
          errorResponse.error = 'Multiple faces detected';
          errorResponse.message = 'Please ensure only one person is in the frame';
          errorResponse.isFaceDetectionError = true;
        } else if (errorData.error?.includes('No participants with face encodings')) {
          errorResponse.error = 'No participants registered for face recognition';
          errorResponse.message = 'Please register participants with photos first';
          errorResponse.isNoEncodingsError = true;
        }
      } else if (status === 404) {
        errorResponse.error = 'Program not found';
        errorResponse.message = 'The selected program does not exist';
      } else if (status === 401) {
        errorResponse.error = 'Authentication required';
        errorResponse.message = 'Please log in to continue';
      } else if (status === 403) {
        errorResponse.error = 'Permission denied';
        errorResponse.message = 'You do not have permission to perform this action';
      } else if (status === 500) {
        errorResponse.error = 'Server error';
        errorResponse.message = 'An unexpected error occurred. Please try again later.';
      }
      
      console.log('Structured error response:', errorResponse);
      throw errorResponse;
    }
  },

  // ==================== ATTENDANCE SESSIONS ====================

  /**
   * Get all attendance sessions with optional filters
   * GET /api/v1/attendance/sessions/
   */
  async getSessions(params = {}) {
    try {
      console.log('Fetching attendance sessions with params:', params);
      const response = await api.get('/attendance/sessions/', { params });
      console.log('Sessions fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single session by ID
   * GET /api/v1/attendance/sessions/{id}/
   */
  async getSession(id) {
    try {
      console.log('Fetching session:', id);
      const response = await api.get(`/attendance/sessions/${id}/`);
      console.log('Session fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching session:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Create new attendance session
   * POST /api/v1/attendance/sessions/
   */
  async createSession(data) {
    try {
      console.log('Creating session with data:', data);
      const response = await api.post('/attendance/sessions/', data);
      console.log('Session created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Update attendance session
   * PUT /api/v1/attendance/sessions/{id}/
   */
  async updateSession(id, data) {
    try {
      console.log('Updating session:', id, data);
      const response = await api.put(`/attendance/sessions/${id}/`, data);
      console.log('Session updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating session:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Partial update session
   * PATCH /api/v1/attendance/sessions/{id}/
   */
  async patchSession(id, data) {
    try {
      console.log('Patching session:', id, data);
      const response = await api.patch(`/attendance/sessions/${id}/`, data);
      console.log('Session patched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error patching session:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete session
   * DELETE /api/v1/attendance/sessions/{id}/
   */
  async deleteSession(id) {
    try {
      console.log('Deleting session:', id);
      const response = await api.delete(`/attendance/sessions/${id}/`);
      console.log('Session deleted successfully');
      return response.data;
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error.response?.data || error;
    }
  },

  // ==================== SESSION ACTIONS ====================

  /**
   * Mark session as completed
   * POST /api/v1/attendance/sessions/{id}/complete/
   */
  async completeSession(id) {
    try {
      console.log('Completing session:', id);
      const response = await api.post(`/attendance/sessions/${id}/complete/`);
      console.log('Session completed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error completing session:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Cancel session
   * POST /api/v1/attendance/sessions/{id}/cancel/
   * @param {number} id - Session ID
   * @param {string} reason - Cancellation reason
   */
  async cancelSession(id, reason) {
    try {
      console.log('Cancelling session:', id, reason);
      const response = await api.post(`/attendance/sessions/${id}/cancel/`, { reason });
      console.log('Session cancelled successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get attendance records for a specific session
   * GET /api/v1/attendance/sessions/{id}/attendance/
   */
  async getSessionAttendance(id) {
    try {
      console.log('Fetching session attendance:', id);
      const response = await api.get(`/attendance/sessions/${id}/attendance/`);
      console.log('Session attendance fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching session attendance:', error);
      throw error.response?.data || error;
    }
  },

  // ==================== HELPER METHODS ====================

  /**
   * Get attendance records for a specific participant
   * @param {number} participantId - Participant ID
   * @param {Object} params - Additional query params
   */
  async getParticipantAttendance(participantId, params = {}) {
    try {
      console.log('Fetching attendance for participant:', participantId);
      const response = await api.get('/attendance/records/', {
        params: {
          participant: participantId,
          ...params
        }
      });
      console.log('Participant attendance fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching participant attendance:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get attendance records for a specific program
   * @param {number} programId - Program ID
   * @param {Object} params - Additional query params
   */
  async getProgramAttendance(programId, params = {}) {
    try {
      console.log('Fetching attendance for program:', programId);
      const response = await api.get('/attendance/records/', {
        params: {
          program: programId,
          ...params
        }
      });
      console.log('Program attendance fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching program attendance:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get attendance records for a date range
   * @param {string} dateFrom - Start date (YYYY-MM-DD)
   * @param {string} dateTo - End date (YYYY-MM-DD)
   * @param {Object} params - Additional query params
   */
  async getAttendanceByDateRange(dateFrom, dateTo, params = {}) {
    try {
      console.log('Fetching attendance for date range:', dateFrom, dateTo);
      const response = await api.get('/attendance/records/', {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
          ...params
        }
      });
      console.log('Date range attendance fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching date range attendance:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get upcoming sessions for a program
   * @param {number} programId - Program ID
   */
  async getUpcomingSessions(programId) {
    try {
      console.log('Fetching upcoming sessions for program:', programId);
      const response = await api.get('/attendance/sessions/', {
        params: {
          program: programId,
          is_completed: false,
          is_cancelled: false,
          ordering: 'session_date,start_time'
        }
      });
      console.log('Upcoming sessions fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Get today's sessions
   */
  async getTodaysSessions(params = {}) {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching today\'s sessions:', today);
      const response = await api.get('/attendance/sessions/', {
        params: {
          session_date: today,
          is_cancelled: false,
          ...params
        }
      });
      console.log('Today\'s sessions fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching today\'s sessions:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * Create FormData for face verification
   * @param {Object} data - { participant_id, program, date, session_name, imageFile }
   */
  createFaceVerifyFormData(data) {
    const formData = new FormData();
    formData.append('participant_id', data.participant_id);
    formData.append('program', data.program);
    formData.append('date', data.date);
    if (data.session_name) {
      formData.append('session_name', data.session_name);
    }
    formData.append('image', data.imageFile);
    return formData;
  },

  /**
   * Create FormData for face identification
   * @param {Object} data - { program, date, session_name, imageFile }
   */
  createFaceIdentifyFormData(data) {
    const formData = new FormData();
    formData.append('program', data.program);
    formData.append('date', data.date);
    if (data.session_name) {
      formData.append('session_name', data.session_name);
    }
    formData.append('image', data.imageFile);
    
    console.log('Created FormData for face identification:');
    console.log('  - program:', data.program);
    console.log('  - date:', data.date);
    console.log('  - session_name:', data.session_name || '(none)');
    console.log('  - image:', data.imageFile?.name || '(none)', data.imageFile?.size || 0, 'bytes');
    
    return formData;
  },

  /**
   * Calculate attendance rate for a participant
   * @param {Array} attendanceRecords - Array of attendance records
   */
  calculateAttendanceRate(attendanceRecords) {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return 0;
    }
    
    const presentCount = attendanceRecords.filter(record => record.present).length;
    return Math.round((presentCount / attendanceRecords.length) * 100);
  },

  /**
   * Group attendance records by date
   * @param {Array} attendanceRecords - Array of attendance records
   */
  groupByDate(attendanceRecords) {
    const grouped = {};
    
    attendanceRecords.forEach(record => {
      const date = record.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });
    
    return grouped;
  },

  /**
   * Group attendance records by program
   * @param {Array} attendanceRecords - Array of attendance records
   */
  groupByProgram(attendanceRecords) {
    const grouped = {};
    
    attendanceRecords.forEach(record => {
      const programId = record.program;
      if (!grouped[programId]) {
        grouped[programId] = {
          program_name: record.program_name,
          records: []
        };
      }
      grouped[programId].records.push(record);
    });
    
    return grouped;
  },

  /**
   * Format session time for display
   * @param {Object} session - Session object with start_time and end_time
   */
  formatSessionTime(session) {
    return `${session.start_time} - ${session.end_time}`;
  },

  /**
   * Check if session is ongoing
   * @param {Object} session - Session object
   */
  isSessionOngoing(session) {
    const now = new Date();
    const sessionDate = new Date(session.session_date);
    
    // Check if today
    if (sessionDate.toDateString() !== now.toDateString()) {
      return false;
    }
    
    if (session.is_cancelled || session.is_completed) {
      return false;
    }
    
    // Parse times
    const [startHour, startMin] = session.start_time.split(':').map(Number);
    const [endHour, endMin] = session.end_time.split(':').map(Number);
    
    const startTime = new Date(now);
    startTime.setHours(startHour, startMin, 0);
    
    const endTime = new Date(now);
    endTime.setHours(endHour, endMin, 0);
    
    return now >= startTime && now <= endTime;
  },

  /**
   * Check if session is upcoming
   * @param {Object} session - Session object
   */
  isSessionUpcoming(session) {
    const now = new Date();
    const sessionDate = new Date(session.session_date);
    
    if (session.is_cancelled || session.is_completed) {
      return false;
    }
    
    // Future date
    if (sessionDate > now) {
      return true;
    }
    
    // Today but hasn't started
    if (sessionDate.toDateString() === now.toDateString()) {
      const [startHour, startMin] = session.start_time.split(':').map(Number);
      const startTime = new Date(now);
      startTime.setHours(startHour, startMin, 0);
      
      return now < startTime;
    }
    
    return false;
  },

  /**
   * Get verification method display name
   * @param {string} method - Verification method code
   */
  getVerificationMethodDisplay(method) {
    const methods = {
      'manual': 'Manual Entry',
      'face_recognition': 'Face Recognition',
      'qr_code': 'QR Code Scan',
      'signature': 'Signature',
      'other': 'Other'
    };
    
    return methods[method] || method;
  },

  /**
   * Get confidence level from score
   * @param {number} score - Confidence score (0-100)
   */
  getConfidenceLevel(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    if (score >= 60) return 'Acceptable';
    return 'Low';
  },

  /**
   * Get user-friendly error message
   * @param {Object} error - Error object from API
   */
  getFriendlyErrorMessage(error) {
    if (error.isNotImplemented) {
      return 'Face recognition is not yet available. Please use manual check-in.';
    }
    
    if (error.isFaceDetectionError) {
      return error.message || 'Could not detect face in image. Please try again with better lighting.';
    }
    
    if (error.isNoEncodingsError) {
      return 'No participants are registered for face recognition yet.';
    }
    
    if (error.status === 401) {
      return 'Please log in to continue.';
    }
    
    if (error.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
    
    return error.message || error.error || 'An unexpected error occurred. Please try again.';
  }
};

export default attendanceService;