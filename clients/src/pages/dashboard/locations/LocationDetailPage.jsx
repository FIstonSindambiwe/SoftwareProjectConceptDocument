// src/pages/dashboard/locations/LocationDetailPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Spinner from '../../../components/common/Spinner';
import programService from '../../../services/api/programService';

const LocationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLocationData();
  }, [id]);

  const loadLocationData = async () => {
    setIsLoading(true);
    try {
      const [locationData, programsData] = await Promise.all([
        programService.getLocation(id),
        programService.getLocationPrograms(id)
      ]);
      setLocation(locationData);
      setPrograms(programsData);
    } catch (error) {
      console.error('Error loading location:', error);
      toast.error('Failed to load location');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (!location) {
    return (
      <Layout>
        <div className="text-center py-20">
          <MapPinIcon className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Location not found</h3>
          <Button
            variant="primary"
            onClick={() => navigate('/locations')}
            className="mt-6"
          >
            Back to Locations
          </Button>
        </div>
      </Layout>
    );
  }

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="py-3">
      <div className="flex items-center text-sm font-medium text-gray-500 mb-1">
        {Icon && <Icon className="h-4 w-4 mr-2" />}
        {label}
      </div>
      <p className="text-sm text-gray-900 font-medium">{value || '-'}</p>
    </div>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <Button
                variant="ghost"
                icon={ArrowLeftIcon}
                onClick={() => navigate('/locations')}
              >
                Back
              </Button>
              
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {location.name}
                  </h1>
                  <Badge variant={location.is_active ? 'success' : 'default'}>
                    {location.is_active ? '● Active' : '○ Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center text-gray-600">
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  {location.city}, {location.country}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              icon={PencilIcon}
              onClick={() => navigate(`/locations/${id}/edit`)}
            >
              Edit Location
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location Details */}
            <Card title="Location Details">
              <div className="divide-y divide-gray-200">
                <InfoRow 
                  label="Full Address" 
                  value={location.address} 
                  icon={MapPinIcon}
                />
                {location.latitude && location.longitude && (
                  <div className="py-3">
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Coordinates
                    </div>
                    <p className="text-sm text-gray-900 font-medium">
                      {location.latitude}, {location.longitude}
                    </p>
                  </div>
                )}
              </div>
              
              {location.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{location.notes}</p>
                </div>
              )}
            </Card>

            {/* Programs at this Location */}
            <Card title={`Programs (${programs.length})`}>
              {programs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BuildingOfficeIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No programs at this location yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {programs.map((program) => (
                    <div
                      key={program.id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => navigate(`/programs/${program.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{program.name}</h4>
                          <div className="mt-1 flex items-center text-sm text-gray-600">
                            <span>
                              {new Date(program.start_date).toLocaleDateString()}
                              {program.end_date && ` - ${new Date(program.end_date).toLocaleDateString()}`}
                            </span>
                          </div>
                        </div>
                        <Badge variant={
                          program.status === 'active' ? 'success' :
                          program.status === 'completed' ? 'primary' :
                          program.status === 'planning' ? 'warning' : 'default'
                        }>
                          {program.status_display || program.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card title="Contact Information">
              <div className="divide-y divide-gray-200">
                <InfoRow 
                  label="Contact Person" 
                  value={location.contact_person}
                  icon={BuildingOfficeIcon}
                />
                <InfoRow 
                  label="Email" 
                  value={location.contact_email}
                  icon={EnvelopeIcon}
                />
                <InfoRow 
                  label="Phone" 
                  value={location.contact_phone}
                  icon={PhoneIcon}
                />
              </div>
            </Card>

            {/* Statistics */}
            <Card title="Statistics">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Active Programs</span>
                  <span className="text-sm font-medium text-gray-900">
                    {location.active_programs_count || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Total Programs</span>
                  <span className="text-sm font-medium text-gray-900">
                    {programs.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Status</span>
                  <Badge variant={location.is_active ? 'success' : 'default'} size="sm">
                    {location.is_active ? (
                      <><CheckCircleIcon className="h-3 w-3 inline mr-1" />Active</>
                    ) : (
                      <><XCircleIcon className="h-3 w-3 inline mr-1" />Inactive</>
                    )}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LocationDetailPage;