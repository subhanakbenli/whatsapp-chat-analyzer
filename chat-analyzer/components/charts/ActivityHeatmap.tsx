'use client';

import { useMemo } from 'react';
import { format, getHours, getDay } from 'date-fns';

interface Message {
  timestamp: string;
  sender: string;
  content: string;
  type: string;
}

interface ActivityHeatmapProps {
  data: Message[];
  dateRange: { start: Date | null; end: Date | null };
  selectedParticipants: string[];
}

export function ActivityHeatmap({ data, dateRange, selectedParticipants }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Filter messages based on date range and selected participants
    const filteredMessages = data.filter(message => {
      const messageDate = new Date(message.timestamp);
      const inDateRange = (!dateRange.start || messageDate >= dateRange.start) && 
                         (!dateRange.end || messageDate <= dateRange.end);
      const participantSelected = selectedParticipants.includes(message.sender);
      return inDateRange && participantSelected && message.type === 'message';
    });

    // Create a 7x24 grid (days of week x hours)
    const grid = Array(7).fill(null).map(() => Array(24).fill(0));
    
    // Count messages for each day/hour combination
    filteredMessages.forEach(message => {
      const date = new Date(message.timestamp);
      const dayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, etc.
      const hour = getHours(date);
      grid[dayOfWeek][hour]++;
    });

    return grid;
  }, [data, dateRange, selectedParticipants]);

  const maxValue = Math.max(...heatmapData.flat());
  const minValue = Math.min(...heatmapData.flat());

  const getIntensity = (value: number) => {
    if (maxValue === 0) return 0;
    return value / maxValue;
  };

  const getColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity <= 0.25) return 'bg-blue-200 dark:bg-blue-900/40';
    if (intensity <= 0.5) return 'bg-blue-400 dark:bg-blue-700/60';
    if (intensity <= 0.75) return 'bg-blue-600 dark:bg-blue-600/80';
    return 'bg-blue-800 dark:bg-blue-500';
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getTotalForDay = (dayIndex: number) => {
    return heatmapData[dayIndex].reduce((sum, count) => sum + count, 0);
  };

  const getTotalForHour = (hourIndex: number) => {
    return heatmapData.reduce((sum, day) => sum + day[hourIndex], 0);
  };

  const totalMessages = heatmapData.flat().reduce((sum, count) => sum + count, 0);

  if (totalMessages === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No activity data for selected filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Hour headers */}
          <div className="flex mb-2">
            <div className="w-12 flex-shrink-0"></div>
            <div className="flex-1 grid grid-cols-24 gap-1">
              {hours.map(hour => (
                <div key={hour} className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {hour === 0 ? '12a' : hour <= 12 ? `${hour}${hour === 12 ? 'p' : 'a'}` : `${hour - 12}p`}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap grid */}
          <div className="space-y-1">
            {heatmapData.map((dayData, dayIndex) => (
              <div key={dayIndex} className="flex items-center">
                <div className="w-12 flex-shrink-0 text-sm text-gray-600 dark:text-gray-400 text-right pr-2">
                  {dayNames[dayIndex]}
                </div>
                <div className="flex-1 grid grid-cols-24 gap-1">
                  {dayData.map((count, hourIndex) => (
                    <div
                      key={hourIndex}
                      className={`aspect-square rounded-sm ${getColor(getIntensity(count))} cursor-pointer hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50 transition-all`}
                      title={`${dayNames[dayIndex]} ${hourIndex}:00 - ${count} messages`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Less</span>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm" />
                <div className="w-3 h-3 bg-blue-200 dark:bg-blue-900/40 rounded-sm" />
                <div className="w-3 h-3 bg-blue-400 dark:bg-blue-700/60 rounded-sm" />
                <div className="w-3 h-3 bg-blue-600 dark:bg-blue-600/80 rounded-sm" />
                <div className="w-3 h-3 bg-blue-800 dark:bg-blue-500 rounded-sm" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">More</span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {totalMessages} total messages
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Daily Activity
          </h4>
          <div className="space-y-2">
            {dayNames.map((day, index) => {
              const dayTotal = getTotalForDay(index);
              const percentage = totalMessages > 0 ? (dayTotal / totalMessages) * 100 : 0;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-8 text-xs text-gray-600 dark:text-gray-400">
                    {day}
                  </div>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-xs text-gray-600 dark:text-gray-400 text-right">
                    {dayTotal}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Peak Hours
          </h4>
          <div className="space-y-2">
            {hours
              .map(hour => ({ hour, total: getTotalForHour(hour) }))
              .sort((a, b) => b.total - a.total)
              .slice(0, 8)
              .map(({ hour, total }) => {
                const percentage = totalMessages > 0 ? (total / totalMessages) * 100 : 0;
                const timeStr = hour === 0 ? '12:00 AM' : 
                               hour <= 12 ? `${hour}:00 ${hour === 12 ? 'PM' : 'AM'}` : 
                               `${hour - 12}:00 PM`;
                return (
                  <div key={hour} className="flex items-center space-x-3">
                    <div className="w-16 text-xs text-gray-600 dark:text-gray-400">
                      {timeStr}
                    </div>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-8 text-xs text-gray-600 dark:text-gray-400 text-right">
                      {total}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Activity Insights */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          Activity Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Most Active Day:</span>
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              {dayNames[heatmapData.findIndex(day => day.reduce((sum, count) => sum + count, 0) === Math.max(...heatmapData.map(day => day.reduce((sum, count) => sum + count, 0))))]}
            </span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Peak Hour:</span>
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              {hours.find(hour => getTotalForHour(hour) === Math.max(...hours.map(h => getTotalForHour(h))))}:00
            </span>
          </div>
          <div>
            <span className="text-blue-700 dark:text-blue-300 font-medium">Avg per Hour:</span>
            <span className="ml-2 text-blue-600 dark:text-blue-400">
              {Math.round(totalMessages / (7 * 24))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}