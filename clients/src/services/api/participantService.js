// src/services/api/participantService.js
import api from './axiosConfig';

const participantService = {
  // ==================== ROOMS ====================

  /**
   * Get list of all rooms
   * GET /api/v1/participants/rooms/
   */
  async getRooms(params = {}) {
    try {
      console.log('Fetching rooms with params:', params);
      const response = await api.get('/participants/rooms/', { params });
      console.log('Rooms fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single room by ID
   * GET /api/v1/participants/rooms/{id}/
   */
  async getRoom(id) {
    try {
      console.log('Fetching room:', id);
      const response = await api.get(`/participants/rooms/${id}/`);
      console.log('Room fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching room:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Create new room
   * POST /api/v1/participants/rooms/
   */
  async createRoom(roomData) {
    try {
      console.log('Creating room with data:', roomData);
      const response = await api.post('/participants/rooms/', roomData);
      console.log('Room created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating room:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error message:', error.message);
      
      // Return the full error object with response data
      if (error.response?.data) {
        throw error.response.data;
      } else if (error.response) {
        throw { error: `HTTP ${error.response.status}: ${error.response.statusText}` };
      } else {
        throw { error: error.message || 'Network error occurred' };
      }
    }
  },

  /**
   * Update room - Full update
   * PUT /api/v1/participants/rooms/{id}/
   */
  async updateRoom(id, roomData) {
    try {
      console.log('Updating room (PUT):', id, roomData);
      const response = await api.put(`/participants/rooms/${id}/`, roomData);
      console.log('Room updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating room (PUT):', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Partial update room
   * PATCH /api/v1/participants/rooms/{id}/
   */
  async patchRoom(id, roomData) {
    try {
      console.log('Patching room:', id, roomData);
      const response = await api.patch(`/participants/rooms/${id}/`, roomData);
      console.log('Room patched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error patching room:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete room
   * DELETE /api/v1/participants/rooms/{id}/
   */
  async deleteRoom(id) {
    try {
      console.log('Deleting room:', id);
      const response = await api.delete(`/participants/rooms/${id}/`);
      console.log('Room deleted successfully');
      return response.data;
    } catch (error) {
      console.error('Error deleting room:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get participants in a room
   * GET /api/v1/participants/rooms/{id}/participants/
   */
  async getRoomParticipants(id) {
    try {
      console.log('Fetching room participants:', id);
      const response = await api.get(`/participants/rooms/${id}/participants/`);
      console.log('Room participants fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching room participants:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Assign teacher to room
   * POST /api/v1/participants/rooms/{id}/assign_teacher/
   */
  async assignTeacherToRoom(roomId, teacherId) {
    try {
      console.log('Assigning teacher to room:', roomId, teacherId);
      const response = await api.post(`/participants/rooms/${roomId}/assign_teacher/`, {
        teacher_id: teacherId
      });
      console.log('Teacher assigned successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error assigning teacher:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get room statistics
   * GET /api/v1/participants/rooms/stats/
   */
  async getRoomStats() {
    try {
      console.log('Fetching room statistics');
      const response = await api.get('/participants/rooms/stats/');
      console.log('Room stats fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching room stats:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  // ==================== PARTICIPANTS ====================

  /**
   * Get list of all participants
   * GET /api/v1/participants/participants/
   */
  async getParticipants(params = {}) {
    try {
      console.log('Fetching participants with params:', params);
      const response = await api.get('/participants/participants/', { params });
      console.log('Participants fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching participants:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single participant by ID
   * GET /api/v1/participants/participants/{id}/
   */
  async getParticipant(id) {
    try {
      console.log('Fetching participant:', id);
      const response = await api.get(`/participants/participants/${id}/`);
      console.log('Participant fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching participant:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Create new participant
   * POST /api/v1/participants/participants/
   */
  async createParticipant(participantData) {
    try {
      console.log('Creating participant with data:', participantData);
      const response = await api.post('/participants/participants/', participantData);
      console.log('Participant created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating participant:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Update participant - Full update
   * PUT /api/v1/participants/participants/{id}/
   */
  async updateParticipant(id, participantData) {
    try {
      console.log('Updating participant (PUT):', id, participantData);
      const response = await api.put(`/participants/participants/${id}/`, participantData);
      console.log('Participant updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating participant (PUT):', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Partial update participant
   * PATCH /api/v1/participants/participants/{id}/
   */
  async patchParticipant(id, participantData) {
    try {
      console.log('Patching participant:', id, participantData);
      const response = await api.patch(`/participants/participants/${id}/`, participantData);
      console.log('Participant patched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error patching participant:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Deactivate participant (soft delete)
   * DELETE /api/v1/participants/participants/{id}/
   */
  async deleteParticipant(id) {
    try {
      console.log('Deactivating participant:', id);
      const response = await api.delete(`/participants/participants/${id}/`);
      console.log('Participant deactivated successfully');
      return response.data;
    } catch (error) {
      console.error('Error deactivating participant:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get active participants
   * GET /api/v1/participants/participants/active/
   */
  async getActiveParticipants() {
    try {
      console.log('Fetching active participants');
      const response = await api.get('/participants/participants/active/');
      console.log('Active participants fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching active participants:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get participant progress report
   * GET /api/v1/participants/participants/{id}/progress/
   */
  async getParticipantProgress(id) {
    try {
      console.log('Fetching participant progress:', id);
      const response = await api.get(`/participants/participants/${id}/progress/`);
      console.log('Participant progress fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching participant progress:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get participant enrollments
   * GET /api/v1/participants/participants/{id}/enrollments/
   */
  async getParticipantEnrollments(id, params = {}) {
    try {
      console.log('Fetching participant enrollments:', id, params);
      const response = await api.get(`/participants/participants/${id}/enrollments/`, { params });
      console.log('Participant enrollments fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching participant enrollments:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get participant statistics
   * GET /api/v1/participants/participants/stats/
   */
  async getParticipantStats() {
    try {
      console.log('Fetching participant statistics');
      const response = await api.get('/participants/participants/stats/');
      console.log('Participant stats fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching participant stats:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Add note for participant
   * POST /api/v1/participants/notes/
   */
  async addParticipantNote(participantId, noteData) {
    try {
      console.log('Adding note for participant:', participantId, noteData);
      // Add participant ID to the note data
      const payload = {
        ...noteData,
        participant: participantId
      };
      const response = await api.post(`/participants/notes/`, payload);
      console.log('Note added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding note:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Upload photo and generate face encoding
   * POST /api/v1/participants/participants/{id}/upload_photo/
   */
  async uploadParticipantPhoto(id, formData) {
    try {
      console.log('Uploading participant photo:', id);
      const response = await api.post(
        `/participants/participants/${id}/upload_photo/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log('Photo uploaded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error uploading photo:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Update face encoding from existing photo
   * POST /api/v1/participants/participants/{id}/update_face_encoding/
   */
  async updateFaceEncoding(id) {
    try {
      console.log('Updating face encoding for participant:', id);
      const response = await api.post(`/participants/participants/${id}/update_face_encoding/`);
      console.log('Face encoding updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating face encoding:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get face encoding status
   * GET /api/v1/participants/participants/{id}/face_encoding_status/
   */
  async getFaceEncodingStatus(id) {
    try {
      console.log('Fetching face encoding status:', id);
      const response = await api.get(`/participants/participants/${id}/face_encoding_status/`);
      console.log('Face encoding status fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching face encoding status:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  // ==================== ENROLLMENTS ====================

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

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
  },

  // ==================== PARTICIPANT NOTES ====================

  /**
   * Get list of all participant notes
   * GET /api/v1/participants/notes/
   */
  async getParticipantNotes(params = {}) {
    try {
      console.log('Fetching participant notes with params:', params);
      const response = await api.get('/participants/notes/', { params });
      console.log('Participant notes fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching participant notes:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single participant note by ID
   * GET /api/v1/participants/notes/{id}/
   */
  async getParticipantNote(id) {
    try {
      console.log('Fetching participant note:', id);
      const response = await api.get(`/participants/notes/${id}/`);
      console.log('Participant note fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching participant note:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Create new participant note
   * POST /api/v1/participants/notes/
   */
  async createParticipantNote(noteData) {
    try {
      console.log('Creating participant note with data:', noteData);
      const response = await api.post('/participants/notes/', noteData);
      console.log('Participant note created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating participant note:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Update participant note - Full update
   * PUT /api/v1/participants/notes/{id}/
   */
  async updateParticipantNote(id, noteData) {
    try {
      console.log('Updating participant note (PUT):', id, noteData);
      const response = await api.put(`/participants/notes/${id}/`, noteData);
      console.log('Participant note updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating participant note (PUT):', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Partial update participant note
   * PATCH /api/v1/participants/notes/{id}/
   */
  async patchParticipantNote(id, noteData) {
    try {
      console.log('Patching participant note:', id, noteData);
      const response = await api.patch(`/participants/notes/${id}/`, noteData);
      console.log('Participant note patched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error patching participant note:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete participant note
   * DELETE /api/v1/participants/notes/{id}/
   */
  async deleteParticipantNote(id) {
    try {
      console.log('Deleting participant note:', id);
      const response = await api.delete(`/participants/notes/${id}/`);
      console.log('Participant note deleted successfully');
      return response.data;
    } catch (error) {
      console.error('Error deleting participant note:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },
};

export default participantService;