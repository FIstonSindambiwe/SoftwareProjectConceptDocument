// src/services/api/roomService.js
import api from './axiosConfig';

const roomService = {
  async getRooms(params = {}) {
    try {
      const response = await api.get('/participants/rooms/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error.response?.data || error;
    }
  },
  
  async getRoom(id) {
    try {
      const response = await api.get(`/participants/rooms/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching room:', error);
      throw error.response?.data || error;
    }
  },
  
  async createRoom(roomData) {
    try {
      const response = await api.post('/participants/rooms/', roomData);
      return response.data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error.response?.data || error;
    }
  },
  
  async updateRoom(id, roomData) {
    try {
      const response = await api.put(`/participants/rooms/${id}/`, roomData);
      return response.data;
    } catch (error) {
      console.error('Error updating room:', error);
      throw error.response?.data || error;
    }
  },
  
  async deleteRoom(id) {
    try {
      const response = await api.delete(`/participants/rooms/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error.response?.data || error;
    }
  }
};

export default roomService;