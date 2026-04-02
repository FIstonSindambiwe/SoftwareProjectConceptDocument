// src/services/api/schoolService.js
import api from './axiosConfig';

const schoolService = {

  async getSchools(params = {}) {
    try {
      const response = await api.get('/schools/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getSchool(id) {
    try {
      const response = await api.get(`/schools/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async createSchool(data) {
    try {
      const response = await api.post('/schools/', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async updateSchool(id, data) {
    try {
      const response = await api.put(`/schools/${id}/`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async deleteSchool(id) {
    try {
      const response = await api.delete(`/schools/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getSchoolStats(id) {
    try {
      const response = await api.get(`/schools/${id}/stats/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getStudents(schoolId) {
    try {
      const response = await api.get(`/schools/${schoolId}/students/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async getStudent(id) {
    try {
      const response = await api.get(`/schools/students/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async createStudent(schoolId, data) {
    try {
      const response = await api.post(`/schools/${schoolId}/students/`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async updateStudent(id, data) {
    try {
      const response = await api.patch(`/schools/students/${id}/`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async updateMarks(id, data) {
    try {
      const response = await api.patch(`/schools/students/${id}/marks/`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async graduateStudent(id) {
    try {
      const response = await api.post(`/schools/students/${id}/graduate/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  async dropoutStudent(id, reason) {
    try {
      const response = await api.post(`/schools/students/${id}/dropout/`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default schoolService;