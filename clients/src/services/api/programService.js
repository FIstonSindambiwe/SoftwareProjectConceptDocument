// src/services/api/programService.js
import api from './axiosConfig';

const programService = {
  // ==================== PROGRAMS ====================
  
  /**
   * Get list of all programs
   * GET /api/v1/programs/
   */
  async getPrograms(params = {}) {
    try {
      console.log('Fetching programs with params:', params);
      const response = await api.get('/programs/programs/', { params });
      console.log('Programs fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching programs:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single program by ID
   * GET /api/v1/programs/{id}/
   */
  async getProgram(id) {
    try {
      console.log('Fetching program:', id);
      const response = await api.get(`/programs/programs/${id}/`);
      console.log('Program fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching program:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Create new program
   * POST /api/v1/programs/
   */
  async createProgram(programData) {
    try {
      console.log('Creating program with data:', programData);
      const response = await api.post('/programs/programs/', programData);
      console.log('Program created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating program:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Update program - Full update
   * PUT /api/v1/programs/{id}/
   */
  async updateProgram(id, programData) {
    try {
      console.log('Updating program (PUT):', id, programData);
      const response = await api.put(`/programs/programs/${id}/`, programData);
      console.log('Program updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating program (PUT):', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Partial update program
   * PATCH /api/v1/programs/{id}/
   */
  async patchProgram(id, programData) {
    try {
      console.log('Patching program:', id, programData);
      const response = await api.patch(`/programs/programs/${id}/`, programData);
      console.log('Program patched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error patching program:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete program
   * DELETE /api/v1/programs/{id}/
   */
  async deleteProgram(id) {
    try {
      console.log('Deleting program:', id);
      const response = await api.delete(`/programs/programs/${id}/`);
      console.log('Program deleted successfully');
      return response.data;
    } catch (error) {
      console.error('Error deleting program:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get active programs
   * GET /api/v1/programs/active/
   */
  async getActivePrograms() {
    try {
      console.log('Fetching active programs');
      const response = await api.get('/programs/active/');
      console.log('Active programs fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching active programs:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  // Add these methods to programService.js after the existing program methods

  /**
   * Deactivate program
   * POST /api/v1/programs/programs/{id}/deactivate/
   */
  async deactivateProgram(id) {
    try {
      console.log('Deactivating program:', id);
      const response = await api.post(`/programs/programs/${id}/deactivate/`);
      console.log('Program deactivated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error deactivating program:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Activate program
   * POST /api/v1/programs/programs/{id}/activate/
   */
  async activateProgram(id) {
    try {
      console.log('Activating program:', id);
      const response = await api.post(`/programs/programs/${id}/activate/`);
      console.log('Program activated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error activating program:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Toggle program active status
   * POST /api/v1/programs/programs/{id}/toggle_active/
   */
  async toggleProgramActive(id) {
    try {
      console.log('Toggling program active status:', id);
      const response = await api.post(`/programs/programs/${id}/toggle_active/`);
      console.log('Program status toggled:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error toggling program status:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Change program status
   * POST /api/v1/programs/programs/{id}/change_status/
   */
  async changeProgramStatus(id, newStatus) {
    try {
      console.log('Changing program status:', id, newStatus);
      const response = await api.post(`/programs/programs/${id}/change_status/`, {
        status: newStatus
      });
      console.log('Program status changed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error changing program status:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get ongoing programs
   * GET /api/v1/programs/ongoing/
   */
  async getOngoingPrograms() {
    try {
      console.log('Fetching ongoing programs');
      const response = await api.get('/programs/ongoing/');
      console.log('Ongoing programs fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching ongoing programs:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get program summary
   * GET /api/v1/programs/{id}/summary/
   */
  async getProgramSummary(id) {
    try {
      console.log('Fetching program summary:', id);
      const response = await api.get(`/programs/programs/${id}/summary/`);
      console.log('Program summary fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching program summary:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get program participants
   * GET /api/v1/programs/{id}/participants/
   */
  async getProgramParticipants(id, params = {}) {
    try {
      console.log('Fetching program participants:', id, params);
      const response = await api.get(`/programs/programs/${id}/participants/`, { params });
      console.log('Program participants fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching program participants:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get program statistics
   * GET /api/v1/programs/stats/
   */
  async getProgramStats() {
    try {
      console.log('Fetching program statistics');
      const response = await api.get('/programs/stats/');
      console.log('Program stats fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching program stats:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Add milestone to program
   * POST /api/v1/programs/{id}/add_milestone/
   */
  async addProgramMilestone(programId, milestoneData) {
    try {
      console.log('Adding milestone to program:', programId, milestoneData);
      const response = await api.post(`/programs/${programId}/add_milestone/`, milestoneData);
      console.log('Milestone added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding milestone:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  // ==================== LOCATIONS ====================

  /**
   * Get list of all locations
   * GET /api/v1/programs/locations/
   */
  async getLocations(params = {}) {
    try {
      console.log('Fetching locations with params:', params);
      const response = await api.get('/programs/locations/', { params });
      console.log('Locations fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single location by ID
   * GET /api/v1/programs/locations/{id}/
   */
  async getLocation(id) {
    try {
      console.log('Fetching location:', id);
      const response = await api.get(`/programs/locations/${id}/`);
      console.log('Location fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching location:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Create new location
   * POST /api/v1/programs/locations/
   */
  async createLocation(locationData) {
    try {
      console.log('Creating location with data:', locationData);
      const response = await api.post('/programs/locations/', locationData);
      console.log('Location created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating location:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Update location - Full update
   * PUT /api/v1/programs/locations/{id}/
   */
  async updateLocation(id, locationData) {
    try {
      console.log('Updating location (PUT):', id, locationData);
      const response = await api.put(`/programs/locations/${id}/`, locationData);
      console.log('Location updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating location (PUT):', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Partial update location
   * PATCH /api/v1/programs/locations/{id}/
   */
  async patchLocation(id, locationData) {
    try {
      console.log('Patching location:', id, locationData);
      const response = await api.patch(`/programs/locations/${id}/`, locationData);
      console.log('Location patched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error patching location:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete location
   * DELETE /api/v1/programs/locations/{id}/
   */
  async deleteLocation(id) {
    try {
      console.log('Deleting location:', id);
      const response = await api.delete(`/programs/locations/${id}/`);
      console.log('Location deleted successfully');
      return response.data;
    } catch (error) {
      console.error('Error deleting location:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get active locations
   * GET /api/v1/programs/locations/active/
   */
  async getActiveLocations() {
    try {
      console.log('Fetching active locations');
      const response = await api.get('/programs/locations/active/');
      console.log('Active locations fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching active locations:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get programs for a location
   * GET /api/v1/programs/locations/{id}/programs/
   */
  async getLocationPrograms(id, params = {}) {
    try {
      console.log('Fetching programs for location:', id, params);
      const response = await api.get(`/programs/locations/${id}/programs/`, { params });
      console.log('Location programs fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching location programs:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get location statistics
   * GET /api/v1/programs/locations/stats/
   */
  async getLocationStats() {
    try {
      console.log('Fetching location statistics');
      const response = await api.get('/programs/locations/stats/');
      console.log('Location stats fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching location stats:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  // ==================== MILESTONES ====================

  /**
   * Get list of all milestones
   * GET /api/v1/milestones/
   */
  async getMilestones(params = {}) {
    try {
      console.log('Fetching milestones with params:', params);
      const response = await api.get('/milestones/', { params });
      console.log('Milestones fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching milestones:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get single milestone by ID
   * GET /api/v1/milestones/{id}/
   */
  async getMilestone(id) {
    try {
      console.log('Fetching milestone:', id);
      const response = await api.get(`/milestones/${id}/`);
      console.log('Milestone fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching milestone:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Create new milestone
   * POST /api/v1/milestones/
   */
  async createMilestone(milestoneData) {
    try {
      console.log('Creating milestone with data:', milestoneData);
      const response = await api.post('/milestones/', milestoneData);
      console.log('Milestone created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating milestone:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Update milestone - Full update
   * PUT /api/v1/milestones/{id}/
   */
  async updateMilestone(id, milestoneData) {
    try {
      console.log('Updating milestone (PUT):', id, milestoneData);
      const response = await api.put(`/milestones/${id}/`, milestoneData);
      console.log('Milestone updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating milestone (PUT):', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Partial update milestone
   * PATCH /api/v1/milestones/{id}/
   */
  async patchMilestone(id, milestoneData) {
    try {
      console.log('Patching milestone:', id, milestoneData);
      const response = await api.patch(`/milestones/${id}/`, milestoneData);
      console.log('Milestone patched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error patching milestone:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Delete milestone
   * DELETE /api/v1/milestones/{id}/
   */
  async deleteMilestone(id) {
    try {
      console.log('Deleting milestone:', id);
      const response = await api.delete(`/milestones/${id}/`);
      console.log('Milestone deleted successfully');
      return response.data;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Mark milestone as completed
   * POST /api/v1/milestones/{id}/complete/
   */
  async completeMilestone(id) {
    try {
      console.log('Completing milestone:', id);
      const response = await api.post(`/milestones/${id}/complete/`);
      console.log('Milestone completed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error completing milestone:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Get overdue milestones
   * GET /api/v1/milestones/overdue/
   */
  async getOverdueMilestones() {
    try {
      console.log('Fetching overdue milestones');
      const response = await api.get('/milestones/overdue/');
      console.log('Overdue milestones fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching overdue milestones:', error);
      console.error('Error response:', error.response?.data);
      throw error.response?.data || error;
    }
  },
};

export default programService;