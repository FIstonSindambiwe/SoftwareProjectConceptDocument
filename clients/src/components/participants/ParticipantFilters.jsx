// src/components/participants/ParticipantFilters.jsx
import React from 'react';
import Input from '../common/Input';

const ParticipantFilters = ({ filters, onChange, onClear, teacherRooms = [], isTeacher = false }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Search"
          name="search"
          type="text"
          value={filters.search || ''}
          onChange={handleChange}
          placeholder="Search by ID, name..."
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            name="gender"
            value={filters.gender || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Genders</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Other</option>
            <option value="N">Prefer not to say</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="is_active"
            value={filters.is_active || 'true'}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
            <option value="">All</option>
          </select>
        </div>
        
        {!isTeacher && teacherRooms.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Room
            </label>
            <select
              name="room"
              value={filters.room || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Rooms</option>
              {teacherRooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.current_enrollment_count}/{room.capacity})
                </option>
              ))}
            </select>
          </div>
        )}
        
        <Input
          label="Min Age"
          name="age_min"
          type="number"
          value={filters.age_min || ''}
          onChange={handleChange}
          placeholder="Minimum age"
          min="0"
        />
        
        <Input
          label="Max Age"
          name="age_max"
          type="number"
          value={filters.age_max || ''}
          onChange={handleChange}
          placeholder="Maximum age"
          min="0"
        />
      </div>
    </div>
  );
};

export default ParticipantFilters;