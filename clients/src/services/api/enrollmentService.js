// src/services/api/enrollmentService.js
import api from './axiosConfig';

class EnrollmentService {
  /**
   * Get list of all enrollments
   * GET /api/v1/participants/enrollments/
   */
  async getEnrollments(params = {}) {
    try {
      console.log('Fetching enrollments with params:', params);
      const response = await api.get('/participants/enrollments/', { params });
      console.log('Enrollments fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Get single enrollment by ID
   * GET /api/v1/participants/enrollments/{id}/
   */
  async getEnrollment(id) {
    try {
      console.log('Fetching enrollment:', id);
      const response = await api.get(`/participants/enrollments/${id}/`);
      console.log('Enrollment fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching enrollment:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Create new enrollment
   * POST /api/v1/participants/enrollments/
   */
  async createEnrollment(enrollmentData) {
    try {
      console.log('Creating enrollment with data:', enrollmentData);
      const response = await api.post('/participants/enrollments/', enrollmentData);
      console.log('Enrollment created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating enrollment:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Update enrollment - Full update
   * PUT /api/v1/participants/enrollments/{id}/
   */
  async updateEnrollment(id, enrollmentData) {
    try {
      console.log('Updating enrollment (PUT):', id, enrollmentData);
      const response = await api.put(`/participants/enrollments/${id}/`, enrollmentData);
      console.log('Enrollment updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating enrollment (PUT):', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Partial update enrollment
   * PATCH /api/v1/participants/enrollments/{id}/
   */
  async patchEnrollment(id, enrollmentData) {
    try {
      console.log('Patching enrollment:', id, enrollmentData);
      const response = await api.patch(`/participants/enrollments/${id}/`, enrollmentData);
      console.log('Enrollment patched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error patching enrollment:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Delete enrollment
   * DELETE /api/v1/participants/enrollments/{id}/
   */
  async deleteEnrollment(id) {
    try {
      console.log('Deleting enrollment:', id);
      const response = await api.delete(`/participants/enrollments/${id}/`);
      console.log('Enrollment deleted successfully');
      return response.data;
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Mark participant as successfully finished the program
   * POST /api/v1/participants/enrollments/{id}/finish/
   */
  async finishProgram(id, finishData = {}) {
    try {
      console.log('Marking enrollment as finished:', id, finishData);
      const response = await api.post(`/participants/enrollments/${id}/finish/`, finishData);
      console.log('Enrollment marked as finished:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error marking enrollment as finished:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Mark participant as dropped out
   * POST /api/v1/participants/enrollments/{id}/dropout/
   */
  async markDropout(id, dropoutData) {
    try {
      console.log('Marking enrollment as dropout:', id, dropoutData);
      const response = await api.post(`/participants/enrollments/${id}/dropout/`, dropoutData);
      console.log('Enrollment marked as dropout:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error marking dropout:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Award scholarship to participant
   * POST /api/v1/participants/enrollments/{id}/award_scholarship/
   */
  async awardScholarship(id, scholarshipData) {
    try {
      console.log('Awarding scholarship to enrollment:', id, scholarshipData);
      const response = await api.post(`/participants/enrollments/${id}/award_scholarship/`, scholarshipData);
      console.log('Scholarship awarded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error awarding scholarship:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Set temporary status (leave of absence)
   * POST /api/v1/participants/enrollments/{id}/temporary/
   */
  async setTemporaryStatus(id, tempData) {
    try {
      console.log('Setting temporary status:', id, tempData);
      const response = await api.post(`/participants/enrollments/${id}/temporary/`, tempData);
      console.log('Temporary status set successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error setting temporary status:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Get attendance records for an enrollment
   * GET /api/v1/participants/enrollments/{id}/attendance/
   */
  async getEnrollmentAttendance(id) {
    try {
      console.log('Fetching attendance for enrollment:', id);
      const response = await api.get(`/participants/enrollments/${id}/attendance/`);
      console.log('Enrollment attendance fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching enrollment attendance:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Recalculate attendance rate
   * POST /api/v1/participants/enrollments/{id}/update_attendance/
   */
  async updateEnrollmentAttendance(id) {
    try {
      console.log('Updating enrollment attendance:', id);
      const response = await api.post(`/participants/enrollments/${id}/update_attendance/`);
      console.log('Attendance updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating attendance:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Get enrollment statistics
   * GET /api/v1/participants/enrollments/stats/
   */
  async getEnrollmentStats() {
    try {
      console.log('Fetching enrollment statistics');
      const response = await api.get('/participants/enrollments/stats/');
      console.log('Enrollment stats fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching enrollment stats:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Get enrollment by participant ID
   * GET /api/v1/participants/enrollments/?participant={participantId}
   */
  async getEnrollmentsByParticipant(participantId) {
    return this.getEnrollments({ participant: participantId });
  }

  /**
   * Get enrollment by program ID
   * GET /api/v1/participants/enrollments/?program={programId}
   */
  async getEnrollmentsByProgram(programId) {
    return this.getEnrollments({ program: programId });
  }

  /**
   * Get active enrollments
   * GET /api/v1/participants/enrollments/active/
   */
  async getActiveEnrollments() {
    try {
      console.log('Fetching active enrollments');
      const response = await api.get('/participants/enrollments/active/');
      console.log('Active enrollments fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching active enrollments:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Bulk create enrollments
   * POST /api/v1/participants/enrollments/bulk/
   */
  async bulkCreateEnrollments(enrollmentsData) {
    try {
      console.log('Bulk creating enrollments:', enrollmentsData);
      const response = await api.post('/participants/enrollments/bulk/', enrollmentsData);
      console.log('Bulk enrollments created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error bulk creating enrollments:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }

  /**
   * Export enrollments to CSV
   * GET /api/v1/participants/enrollments/export/
   */
  async exportEnrollments(params = {}) {
    try {
      console.log('Exporting enrollments with params:', params);
      const response = await api.get('/participants/enrollments/export/', { 
        params,
        responseType: 'blob' 
      });
      console.log('Enrollments exported successfully');
      return response.data;
    } catch (error) {
      console.error('Error exporting enrollments:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  }
}

// Create an instance of the service
const enrollmentService = new EnrollmentService();

// Export as default
export default enrollmentService;