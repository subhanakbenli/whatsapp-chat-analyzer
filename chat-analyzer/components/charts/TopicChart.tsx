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

interface Topic {
  name: string;
  frequency: number;
  keywords: string[];
  sentiment: string;
}

interface TopicChartProps {
  data: Topic[];
}

export function TopicChart({ data }: TopicChartProps) {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No topics found</p>
        </div>
      </div>
    );
  }

  // Sort topics by frequency and take top 10
  const sortedTopics = data.sort((a, b) => b.frequency - a.frequency).slice(0, 10);

  const topicNames = sortedTopics.map(topic => topic.name);
  const frequencies = sortedTopics.map(topic => topic.frequency);

  // Generate colors based on sentiment
  const backgroundColors = sortedTopics.map(topic => {
    switch (topic.sentiment?.toLowerCase()) {
      case 'positive':
        return 'rgba(34, 197, 94, 0.8)';
      case 'negative':
        return 'rgba(239, 68, 68, 0.8)';
      default:
        return 'rgba(156, 163, 175, 0.8)';
    }
  });

  const borderColors = sortedTopics.map(topic => {
    switch (topic.sentiment?.toLowerCase()) {
      case 'positive':
        return 'rgb(34, 197, 94)';
      case 'negative':
        return 'rgb(239, 68, 68)';
      default:
        return 'rgb(156, 163, 175)';
    }
  });

  const chartData = {
    labels: topicNames,
    datasets: [
      {
        label: 'Frequency',
        data: frequencies,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            const topic = sortedTopics[context.dataIndex];
            return [
              `Frequency: ${context.parsed.y}`,
              `Sentiment: ${topic.sentiment || 'neutral'}`,
              `Keywords: ${topic.keywords?.slice(0, 3).join(', ') || 'none'}`,
            ];
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
            const name = topicNames[index];
            return name.length > 12 ? name.substring(0, 12) + '...' : name;
          },
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Frequency',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return Math.floor(value);
          },
        },
      },
    },
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'negative':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'negative':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="h-64">
        <Bar ref={chartRef} data={chartData} options={options} />
      </div>

      {/* Topic Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Topic Details
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedTopics.map((topic, index) => (
            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900 dark:text-white">
                  {topic.name}
                </h5>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {topic.frequency}x
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${getSentimentColor(topic.sentiment)}`}>
                    {getSentimentIcon(topic.sentiment)}
                    <span className="capitalize">{topic.sentiment || 'neutral'}</span>
                  </span>
                </div>
              </div>
              {topic.keywords && topic.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {topic.keywords.slice(0, 8).map((keyword, keyIndex) => (
                    <span
                      key={keyIndex}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                  {topic.keywords.length > 8 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded">
                      +{topic.keywords.length - 8} more
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
            {data.length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Total Topics
          </div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-green-600 dark:text-green-400 font-semibold text-lg">
            {data.filter(topic => topic.sentiment?.toLowerCase() === 'positive').length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Positive Topics
          </div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-red-600 dark:text-red-400 font-semibold text-lg">
            {data.filter(topic => topic.sentiment?.toLowerCase() === 'negative').length}
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">
            Negative Topics
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-gray-600 dark:text-gray-400 font-semibold text-lg">
            {data.reduce((sum, topic) => sum + topic.frequency, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total Mentions
          </div>
        </div>
      </div>
    </div>
  );
}