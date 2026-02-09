import React from 'react';
import Card from '../common/Card';
import Badge from '../common/Badge';
import {
  ChartBarIcon,
  AcademicCapIcon,
  TrophyIcon,
  ArrowUpIcon, // Changed from TrendingUpIcon to ArrowUpIcon
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const ProgressReport = ({ progress, participant, enrollments }) => {
  if (!progress) {
    return (
      <Card>
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-2 text-gray-500">No progress data available</p>
        </div>
      </Card>
    );
  }

  const calculatePerformance = () => {
    const { average_attendance } = progress;
    
    if (average_attendance >= 90) return {
      level: 'Excellent',
      color: 'green',
      description: 'Outstanding attendance and engagement'
    };
    
    if (average_attendance >= 75) return {
      level: 'Good',
      color: 'blue',
      description: 'Good attendance with consistent participation'
    };
    
    if (average_attendance >= 60) return {
      level: 'Fair',
      color: 'yellow',
      description: 'Moderate attendance, needs improvement'
    };
    
    return {
      level: 'Needs Attention',
      color: 'red',
      description: 'Low attendance, requires intervention'
    };
  };

  const performance = calculatePerformance();

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-full inline-block">
              <AcademicCapIcon className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-500 mt-2">Total Programs</p>
            <p className="text-2xl font-bold text-gray-900">{progress.total_programs}</p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-green-100 text-green-600 rounded-full inline-block">
              <TrophyIcon className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-500 mt-2">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{progress.completed_programs}</p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-full inline-block">
              <ArrowUpIcon className="h-8 w-8" /> {/* Changed here */}
            </div>
            <p className="text-sm font-medium text-gray-500 mt-2">Active</p>
            <p className="text-2xl font-bold text-gray-900">{progress.active_programs}</p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full inline-block">
              <ChartBarIcon className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-gray-500 mt-2">Avg Attendance</p>
            <p className="text-2xl font-bold text-gray-900">
              {progress.average_attendance.toFixed(1)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Performance Assessment */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Assessment</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overall Performance</p>
              <div className="flex items-center mt-1">
                <Badge color={performance.color} size="lg">
                  {performance.level}
                </Badge>
                <p className="ml-3 text-gray-900">{performance.description}</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {progress.average_attendance.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500">Average Attendance</p>
            </div>
          </div>
          
          {/* Attendance Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Attendance Rate</span>
              <span>{progress.average_attendance.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  progress.average_attendance >= 90 ? 'bg-green-500' :
                  progress.average_attendance >= 75 ? 'bg-blue-500' :
                  progress.average_attendance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(progress.average_attendance, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Program Breakdown */}
      {progress.enrollments && progress.enrollments.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Breakdown</h3>
          
          <div className="space-y-4">
            {progress.enrollments.map((enrollment, index) => (
              <div key={enrollment.id || index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{enrollment.program_name}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">
                        Status: <Badge color={
                          enrollment.status === 'completed' ? 'green' :
                          enrollment.status === 'active' ? 'blue' :
                          enrollment.status === 'dropped' ? 'red' : 'gray'
                        } size="sm">
                          {enrollment.status_display}
                        </Badge>
                      </span>
                      <span className="text-sm text-gray-500">
                        Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {enrollment.attendance_rate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">Attendance</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Notes */}
      {progress.recent_notes && progress.recent_notes.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notes</h3>
          
          <div className="space-y-3">
            {progress.recent_notes.slice(0, 3).map((note, index) => (
              <div key={note.id || index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    <Badge size="sm" color={
                      note.note_type === 'achievement' ? 'green' :
                      note.note_type === 'concern' ? 'red' :
                      note.note_type === 'progress' ? 'blue' : 'gray'
                    }>
                      {note.note_type_display}
                    </Badge>
                    {note.is_confidential && (
                      <span className="text-xs text-red-600 font-medium">
                        Confidential
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(note.note_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-900 text-sm mt-1 line-clamp-2">
                  {note.content}
                </p>
              </div>
            ))}
            
            {progress.recent_notes.length > 3 && (
              <p className="text-center text-sm text-gray-500 mt-2">
                ... and {progress.recent_notes.length - 3} more notes
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        
        <div className="space-y-3">
          {progress.average_attendance < 60 && (
            <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">Improve Attendance</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Consider discussing attendance with the participant and their guardian.
                  Look for patterns in missed sessions.
                </p>
              </div>
            </div>
          )}
          
          {progress.completed_programs === 0 && progress.total_programs > 0 && (
            <div className="flex items-start p-3 bg-blue-50 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">Program Completion</p>
                <p className="text-sm text-blue-700 mt-1">
                  Encourage completion of current programs. Consider what support might help
                  the participant successfully finish.
                </p>
              </div>
            </div>
          )}
          
          {progress.active_programs === 0 && participant.is_active && (
            <div className="flex items-start p-3 bg-green-50 rounded-lg">
              <DocumentTextIcon className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">New Program Opportunities</p>
                <p className="text-sm text-green-700 mt-1">
                  Participant is not enrolled in any active programs. Consider enrolling them
                  in suitable programs based on their interests and age.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProgressReport;