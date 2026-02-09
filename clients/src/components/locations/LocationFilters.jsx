// src/components/locations/LocationStatistics.jsx
import React, { useState, useEffect } from 'react';
import {
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOffice2Icon,
  GlobeAltIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import programService from '../../services/api/programService';

const LocationStatistics = ({ locations }) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await programService.getLocationStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Fallback to local calculation if API fails
      calculateLocalStats();
    } finally {
      setIsLoading(false);
    }
  };

  const calculateLocalStats = () => {
    const total = locations.length;
    const active = locations.filter(l => l.is_active).length;
    const inactive = total - active;
    
    // Count by country
    const countryCounts = {};
    locations.forEach(loc => {
      countryCounts[loc.country] = (countryCounts[loc.country] || 0) + 1;
    });
    
    const locationsByCountry = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);

    setStats({
      total_locations: total,
      active_locations: active,
      inactive_locations: inactive,
      locations_by_country: locationsByCountry,
      locations_with_programs: locations.filter(l => l.active_programs_count > 0).length,
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Total Locations',
      value: stats.total_locations || 0,
      icon: MapPinIcon,
      color: 'blue',
      description: 'All locations',
    },
    {
      title: 'Active',
      value: stats.active_locations || 0,
      icon: CheckCircleIcon,
      color: 'green',
      description: 'Currently active',
    },
    {
      title: 'Inactive',
      value: stats.inactive_locations || 0,
      icon: XCircleIcon,
      color: 'red',
      description: 'Not in use',
    },
    {
      title: 'With Programs',
      value: stats.locations_with_programs || 0,
      icon: BuildingOffice2Icon,
      color: 'purple',
      description: 'Hosting programs',
    },
    {
      title: 'Countries',
      value: stats.locations_by_country?.length || 0,
      icon: GlobeAltIcon,
      color: 'indigo',
      description: 'Unique countries',
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      red: 'bg-red-100 text-red-600',
      purple: 'bg-purple-100 text-purple-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      yellow: 'bg-yellow-100 text-yellow-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Countries */}
      {stats.locations_by_country && stats.locations_by_country.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <ChartBarIcon className="h-5 w-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Locations by Country
            </h3>
          </div>
          <div className="space-y-3">
            {stats.locations_by_country.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <span className="text-sm font-medium text-gray-700 w-32">
                    {item.country}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(item.count / stats.total_locations) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-900 w-12 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationStatistics;