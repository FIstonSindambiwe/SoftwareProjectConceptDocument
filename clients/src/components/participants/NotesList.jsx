import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import Alert from '../common/Alert';
import Spinner from '../common/Spinner';
import {
  PlusIcon,
  DocumentTextIcon,
  LockClosedIcon,
  CalendarIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const NotesList = ({ participantId, notes = [], onAddNote, user }) => {
  const [showAddNote, setShowAddNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [noteData, setNoteData] = useState({
    note_date: new Date().toISOString().split('T')[0],
    note_type: 'progress',
    content: '',
    is_confidential: false
  });

  const noteTypeOptions = [
    { value: 'progress', label: 'Progress Note' },
    { value: 'concern', label: 'Concern' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'behavior', label: 'Behavioral Observation' },
    { value: 'other', label: 'Other' }
  ];

  const getNoteTypeBadge = (type) => {
    const typeConfig = {
      progress: { color: 'blue', label: 'Progress' },
      concern: { color: 'red', label: 'Concern' },
      achievement: { color: 'green', label: 'Achievement' },
      behavior: { color: 'yellow', label: 'Behavior' },
      other: { color: 'gray', label: 'Other' }
    };
    
    const config = typeConfig[type] || { color: 'gray', label: type };
    return <Badge color={config.color} size="sm">{config.label}</Badge>;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNoteData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!noteData.content.trim()) {
      Alert.error('Please enter note content');
      return;
    }
    
    setLoading(true);
    
    try {
      await onAddNote(noteData);
      
      // Reset form
      setNoteData({
        note_date: new Date().toISOString().split('T')[0],
        note_type: 'progress',
        content: '',
        is_confidential: false
      });
      
      setShowAddNote(false);
      
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Progress Notes</h3>
        
        {user.role !== 'donor' && (
          <Button
            onClick={() => setShowAddNote(true)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Note
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      {showAddNote && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Date
                </label>
                <input
                  type="date"
                  name="note_date"
                  value={noteData.note_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note Type
                </label>
                <select
                  name="note_type"
                  value={noteData.note_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  {noteTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Note Content *
              </label>
              <textarea
                name="content"
                value={noteData.content}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your observations, progress updates, or concerns..."
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_confidential"
                name="is_confidential"
                checked={noteData.is_confidential}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_confidential" className="ml-2 flex items-center">
                <LockClosedIcon className="h-4 w-4 mr-1" />
                <span className="text-sm text-gray-900">Confidential Note</span>
              </label>
              <span className="ml-2 text-xs text-gray-500">
                (Visible only to authorized staff)
              </span>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddNote(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Adding...
                  </>
                ) : (
                  'Add Note'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-8">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <p className="mt-2 text-gray-500">No notes yet</p>
          {user.role !== 'donor' && !showAddNote && (
            <Button
              variant="outline"
              onClick={() => setShowAddNote(true)}
              className="mt-4"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add First Note
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map(note => (
            <div
              key={note.id}
              className={`p-4 rounded-lg border ${
                note.is_confidential 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                  {getNoteTypeBadge(note.note_type)}
                  <span className="flex items-center text-sm text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {formatDate(note.note_date)}
                  </span>
                  {note.is_confidential && (
                    <span className="flex items-center text-sm text-red-600">
                      <LockClosedIcon className="h-4 w-4 mr-1" />
                      Confidential
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {note.created_by_name}
                </span>
              </div>
              
              <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default NotesList;