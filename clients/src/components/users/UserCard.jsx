// src/components/users/UserCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  PencilIcon,
  EyeIcon,
  NoSymbolIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Badge from '../common/Badge';
import Button from '../common/Button';

const UserCard = ({ user, onEdit, onView, onToggleStatus }) => {
  const navigate = useNavigate();

  const getRoleBadgeVariant = (role) => {
    const variants = {
      admin: 'danger',
      teacher: 'primary',
      program_manager: 'warning',
      donor: 'success',
    };
    return variants[role] || 'default';
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(user);
    } else {
      navigate(`/users/${user.id}/edit`);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(user);
    } else {
      navigate(`/users/${user.id}`);
    }
  };

  const handleToggleStatus = () => {
    if (onToggleStatus) {
      onToggleStatus(user);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.username}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <UserCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.full_name || user.username}
            </h3>
            <p className="text-sm text-gray-500">@{user.username}</p>
          </div>
        </div>
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {user.role_display || user.role}
        </Badge>
      </div>

      {/* User Details */}
      <div className="space-y-2 mb-4">
        {user.email && (
          <div className="flex items-center text-sm text-gray-600">
            <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span className="truncate">{user.email}</span>
          </div>
        )}
        
        {user.phone_number && (
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span>{user.phone_number}</span>
          </div>
        )}
        
        {user.organization && (
          <div className="flex items-center text-sm text-gray-600">
            <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
            <span className="truncate">{user.organization}</span>
          </div>
        )}
      </div>

      {/* Bio */}
      {user.bio && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {user.bio}
        </p>
      )}

      {/* Status */}
      <div className="mb-4">
        <Badge variant={user.is_active ? 'success' : 'default'} size="sm">
          {user.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Footer - Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          Joined {new Date(user.date_joined).toLocaleDateString()}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={handleView}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleEdit}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
            title="Edit User"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleToggleStatus}
            className={`p-2 rounded-lg transition-colors ${
              user.is_active
                ? 'text-red-600 hover:bg-red-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={user.is_active ? 'Deactivate User' : 'Activate User'}
          >
            {user.is_active ? (
              <NoSymbolIcon className="h-5 w-5" />
            ) : (
              <CheckCircleIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCard;