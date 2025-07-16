'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ParticipantData {
  [key: string]: {
    name: string;
    messageCount: number;
    wordCount: number;
    avgMessageLength: number;
    sentiment: string;
    communicationStyle: string;
    engagementLevel: string;
  };
}

interface ParticipantChartProps {
  data: ParticipantData;
  selectedParticipants: string[];
}

export function ParticipantChart({ data, selectedParticipants }: ParticipantChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No participant data available</p>
        </div>
      </div>
    );
  }

  // Filter participants based on selection
  const filteredParticipants = Object.entries(data).filter(([name]) => 
    selectedParticipants.includes(name)
  );

  if (filteredParticipants.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No participants selected</p>
        </div>
      </div>
    );
  }

  // Sort participants by message count
  const sortedParticipants = filteredParticipants.sort((a, b) => 
    b[1].messageCount - a[1].messageCount
  );

  const participantNames = sortedParticipants.map(([name]) => name);
  const messageCounts = sortedParticipants.map(([, data]) => data.messageCount);
  const wordCounts = sortedParticipants.map(([, data]) => data.wordCount);

  const chartData = {
    labels: participantNames,
    datasets: [
      {
        label: 'Messages',
        data: messageCounts,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: 'Words',
        data: wordCounts,
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const participant = sortedParticipants[context.dataIndex];
            if (context.dataset.label === 'Messages') {
              return `${participant[0]}: ${context.parsed.y} messages`;
            } else {
              return `${participant[0]}: ${context.parsed.y} words`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          callback: function(value: any, index: number) {
            const name = participantNames[index];
            return name.length > 10 ? name.substring(0, 10) + '...' : name;
          },
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Messages',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Words',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const getEngagementColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-64">
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>

      {/* Participant Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Participant Details
        </h4>
        <div className="space-y-2">
          {sortedParticipants.map(([name, participantData]) => (
            <div key={name} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900 dark:text-white truncate">
                  {name}
                </h5>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getEngagementColor(participantData.engagementLevel)}`}>
                    {participantData.engagementLevel} engagement
                  </span>
                  <span className={`text-sm font-medium ${getSentimentColor(participantData.sentiment)}`}>
                    {participantData.sentiment}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Messages:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {participantData.messageCount}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Words:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {participantData.wordCount}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Avg Length:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {participantData.avgMessageLength} chars
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Style:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white capitalize">
                    {participantData.communicationStyle}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
            {sortedParticipants.length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Active Participants
          </div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-green-600 dark:text-green-400 font-semibold text-lg">
            {messageCounts.reduce((sum, count) => sum + count, 0)}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Total Messages
          </div>
        </div>
        <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-purple-600 dark:text-purple-400 font-semibold text-lg">
            {wordCounts.reduce((sum, count) => sum + count, 0)}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            Total Words
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-gray-600 dark:text-gray-400 font-semibold text-lg">
            {messageCounts.length > 0 ? Math.round(messageCounts.reduce((sum, count) => sum + count, 0) / messageCounts.length) : 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Avg per Person
          </div>
        </div>
      </div>
    </div>
  );
}