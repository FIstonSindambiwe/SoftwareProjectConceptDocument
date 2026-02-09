// src/pages/dashboard/locations/EditLocationPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Layout from '../../../components/layout/Layout';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Spinner from '../../../components/common/Spinner';
import programService from '../../../services/api/programService';

const EditLocationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    is_active: true,
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadLocation();
  }, [id]);

  const loadLocation = async () => {
    try {
      const data = await programService.getLocation(id);
      setFormData({
        name: data.name || '',
        country: data.country || '',
        city: data.city || '',
        address: data.address || '',
        latitude: data.latitude || '',
        longitude: data.longitude || '',
        contact_person: data.contact_person || '',
        contact_email: data.contact_email || '',
        contact_phone: data.contact_phone || '',
        is_active: data.is_active ?? true,
        notes: data.notes || '',
      });
    } catch (error) {
      console.error('Error loading location:', error);
      toast.error('Failed to load location');
      navigate('/locations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Get current location using browser geolocation API
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));

        toast.success('Location captured successfully!');
        setIsGettingLocation(false);

        // Update map if visible
        if (showMap && mapRef.current) {
          updateMapMarker(parseFloat(lat), parseFloat(lng));
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get location';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        toast.error(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Initialize map when showMap changes
  useEffect(() => {
    if (showMap && mapContainerRef.current && !mapRef.current) {
      initializeMap();
    }
  }, [showMap]);

  // Initialize Leaflet map
  const initializeMap = async () => {
    try {
      // Dynamically import Leaflet
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // Fix default marker icon issue with Leaflet
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Default center (Kigali, Rwanda or use existing coordinates)
      const initialLat = formData.latitude ? parseFloat(formData.latitude) : -1.9536;
      const initialLng = formData.longitude ? parseFloat(formData.longitude) : 30.0606;

      // Create map
      const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], 13);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add marker if coordinates exist
      if (formData.latitude && formData.longitude) {
        const marker = L.marker([initialLat, initialLng]).addTo(map);
        markerRef.current = marker;
      }

      // Click event to set location
      map.on('click', (e) => {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));

        updateMapMarker(e.latlng.lat, e.latlng.lng, L, map);
      });

      mapRef.current = map;
      setMapLoaded(true);
    } catch (error) {
      console.error('Error loading map:', error);
      toast.error('Failed to load map');
    }
  };

  // Update marker on map
  const updateMapMarker = async (lat, lng, L = null, map = null) => {
    if (!L) {
      L = await import('leaflet');
    }
    
    const currentMap = map || mapRef.current;
    
    if (!currentMap) return;

    // Remove existing marker
    if (markerRef.current) {
      currentMap.removeLayer(markerRef.current);
    }

    // Add new marker
    const marker = L.marker([lat, lng]).addTo(currentMap);
    markerRef.current = marker;

    // Center map on marker
    currentMap.setView([lat, lng], currentMap.getZoom());
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Location name is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';

    if (formData.contact_email && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);
    try {
      // Clean up empty fields
      const cleanedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key,
          value === '' ? null : value
        ])
      );

      await programService.updateLocation(id, cleanedData);
      toast.success('Location updated successfully!');
      
      setTimeout(() => {
        navigate(`/locations/${id}`);
      }, 1000);
    } catch (error) {
      console.error('Update location error:', error);
      
      if (error && typeof error === 'object') {
        const fieldErrors = {};
        Object.keys(error).forEach(key => {
          if (Array.isArray(error[key])) {
            fieldErrors[key] = error[key][0];
          } else if (typeof error[key] === 'string') {
            fieldErrors[key] = error[key];
          }
        });
        setErrors(fieldErrors);
        toast.error('Please fix the errors in the form');
      } else {
        toast.error('Failed to update location');
      }
    } finally {
      setIsSaving(false);
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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            icon={ArrowLeftIcon}
            onClick={() => navigate(`/locations/${id}`)}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Location</h1>
            <p className="text-gray-500">Update location information</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card title="Basic Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="Location Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  disabled={isSaving}
                />
              </div>

              <Input
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                error={errors.country}
                required
                disabled={isSaving}
              />

              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                error={errors.city}
                required
                disabled={isSaving}
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
            </div>
          </Card>

          {/* Geolocation */}
          <Card title="Geolocation (Optional)">
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetCurrentLocation}
                  disabled={isSaving || isGettingLocation}
                  className="flex-1"
                >
                  {isGettingLocation ? (
                    <>
                      <Spinner size="sm" />
                      <span className="ml-2">Getting Location...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Use Current Location
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowMap(!showMap)}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  {showMap ? 'Hide Map' : 'Select on Map'}
                </Button>
              </div>

              {/* Coordinates Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Latitude"
                  name="latitude"
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={handleChange}
                  error={errors.latitude}
                  disabled={isSaving}
                />

                <Input
                  label="Longitude"
                  name="longitude"
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={handleChange}
                  error={errors.longitude}
                  disabled={isSaving}
                />
              </div>

              {/* Map Display */}
              {showMap && (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      Click on the map to set location coordinates
                    </p>
                  </div>
                  <div 
                    ref={mapContainerRef}
                    className="w-full h-96 bg-gray-100 relative"
                  >
                    {!mapLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Spinner size="lg" />
                      </div>
                    )}
                  </div>
                  {formData.latitude && formData.longitude && (
                    <div className="bg-blue-50 px-4 py-2 text-sm text-blue-800">
                      Selected: {formData.latitude}, {formData.longitude}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Contact Information */}
          <Card title="Contact Information (Optional)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Contact Person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleChange}
                error={errors.contact_person}
                disabled={isSaving}
              />

              <Input
                label="Contact Phone"
                name="contact_phone"
                type="tel"
                value={formData.contact_phone}
                onChange={handleChange}
                error={errors.contact_phone}
                disabled={isSaving}
              />

              <div className="md:col-span-2">
                <Input
                  label="Contact Email"
                  name="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  error={errors.contact_email}
                  disabled={isSaving}
                />
              </div>
            </div>
          </Card>

          {/* Additional Information */}
          <Card title="Additional Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows={4}
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={isSaving}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Location is active and available for programs
                </label>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/locations/${id}`)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditLocationPage;