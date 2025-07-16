'use client';

import { useState } from 'react';

interface FilterPanelProps {
  participants: string[];
  onFilterChange: (filters: {
    dateRange: { start: Date | null; end: Date | null };
    participants: string[];
  }) => void;
  initialDateRange: { start: Date | null; end: Date | null };
  initialParticipants: string[];
}

export function FilterPanel({ 
  participants, 
  onFilterChange, 
  initialDateRange, 
  initialParticipants 
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(initialParticipants);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>(initialDateRange);

  const handleParticipantToggle = (participant: string) => {
    const newSelected = selectedParticipants.includes(participant)
      ? selectedParticipants.filter(p => p !== participant)
      : [...selectedParticipants, participant];
    
    setSelectedParticipants(newSelected);
    onFilterChange({ dateRange, participants: newSelected });
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    const newDate = value ? new Date(value) : null;
    const newRange = { ...dateRange, [type]: newDate };
    setDateRange(newRange);
    onFilterChange({ dateRange: newRange, participants: selectedParticipants });
  };

  const resetFilters = () => {
    setSelectedParticipants(participants);
    setDateRange(initialDateRange);
    onFilterChange({ dateRange: initialDateRange, participants });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
        </svg>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filters
        </span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Filter Options
              </h3>
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Reset
              </button>
            </div>

            {/* Date Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Participants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Participants
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {participants.map(participant => (
                  <label key={participant} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(participant)}
                      onChange={() => handleParticipantToggle(participant)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {participant}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Apply/Close buttons */}
            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}