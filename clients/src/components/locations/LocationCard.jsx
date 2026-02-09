// src/components/locations/LocationCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPinIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Button from '../common/Button';

const LocationCard = ({ location, onToggleActive, showActions = true }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Header with Status */}
      <div className={`px-6 py-4 ${
        location.is_active 
          ? 'bg-gradient-to-r from-green-500 to-green-600' 
          : 'bg-gradient-to-r from-gray-500 to-gray-600'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white truncate mb-2">
              {location.name}
            </h3>
            <div className="flex items-center text-white text-sm">
              <GlobeAltIcon className="h-4 w-4 mr-1" />
              {location.city}, {location.country}
            </div>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              location.is_active
                ? 'bg-white text-green-600'
                : 'bg-white text-gray-600'
            }`}
          >
            {location.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Address */}
        {location.address && (
          <div className="flex items-start">
            <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">Address</p>
              <p className="text-sm text-gray-900">{location.address}</p>
            </div>
          </div>
        )}

        {/* Contact Person */}
        {location.contact_person && (
          <div className="flex items-start">
            <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">Contact Person</p>
              <p className="text-sm font-medium text-gray-900">{location.contact_person}</p>
            </div>
          </div>
        )}

        {/* Email */}
        {location.contact_email && (
          <div className="flex items-start">
            <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-sm text-gray-900 truncate">{location.contact_email}</p>
            </div>
          </div>
        )}

        {/* Phone */}
        {location.contact_phone && (
          <div className="flex items-start">
            <PhoneIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1">Phone</p>
              <p className="text-sm text-gray-900">{location.contact_phone}</p>
            </div>
          </div>
        )}

        {/* Programs Count */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Active Programs</span>
            <span className="text-lg font-bold text-blue-600">
              {location.active_programs_count || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={EyeIcon}
                onClick={() => navigate(`/locations/${location.id}`)}
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={PencilIcon}
                onClick={() => navigate(`/locations/${location.id}/edit`)}
              >
                Edit
              </Button>
            </div>
            <button
              onClick={() => onToggleActive?.(location)}
              className={`p-2 rounded-lg transition-colors ${
                location.is_active
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              title={location.is_active ? 'Deactivate' : 'Activate'}
            >
              {location.is_active ? (
                <XCircleIcon className="h-5 w-5" />
              ) : (
                <CheckCircleIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationCard;