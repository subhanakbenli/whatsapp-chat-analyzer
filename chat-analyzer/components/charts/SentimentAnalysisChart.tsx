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
  ArcElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface SentimentData {
  overall: string;
  score: number;
  confidence: number;
  distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  participantSentiments?: Record<string, string>;
}

interface SentimentAnalysisChartProps {
  data: SentimentData;
}

export function SentimentAnalysisChart({ data }: SentimentAnalysisChartProps) {
  const chartRef = useRef<ChartJS<'doughnut'>>(null);

  if (!data || !data.distribution) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No sentiment data available</p>
        </div>
      </div>
    );
  }

  // Safely get overall sentiment
  const overallSentiment = typeof data.overall === 'string' ? data.overall : 'neutral';
  
  // Get background color for overall sentiment
  const getOverallSentimentBg = () => {
    switch (overallSentiment) {
      case 'positive':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'negative':
        return 'bg-red-100 dark:bg-red-900/20';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const { positive, negative, neutral } = data.distribution;
  const total = positive + negative + neutral;

  const chartData = {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [
      {
        data: [positive, neutral, negative],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(156, 163, 175, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(156, 163, 175)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    cutout: '60%',
  };

  const getSentimentColor = (sentiment: unknown) => {
    const sentimentStr = typeof sentiment === 'string' ? sentiment : 'neutral';
    switch (sentimentStr.toLowerCase()) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSentimentIcon = (sentiment: unknown) => {
    const sentimentStr = typeof sentiment === 'string' ? sentiment : 'neutral';
    switch (sentimentStr.toLowerCase()) {
      case 'positive':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
      case 'negative':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Overall Sentiment Summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${getOverallSentimentBg()}`}>
            <div className={getSentimentColor(overallSentiment)}>
              {getSentimentIcon(overallSentiment)}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Overall Sentiment</p>
            <p className={`text-lg font-semibold capitalize ${getSentimentColor(overallSentiment)}`}>
              {overallSentiment}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-300">Confidence Score</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {Math.round((data.confidence || 0) * 100)}%
          </p>
        </div>
      </div>

      {/* Sentiment Distribution Chart */}
      <div className="h-64 flex items-center justify-center">
        <div className="w-full max-w-sm">
          <Doughnut ref={chartRef} data={chartData} options={options} />
        </div>
      </div>

      {/* Participant Sentiments */}
      {data.participantSentiments && Object.keys(data.participantSentiments).length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Individual Participant Sentiments
          </h4>
          <div className="space-y-2">
            {Object.entries(data.participantSentiments).map(([participant, sentiment]) => {
              const sentimentStr = typeof sentiment === 'string' ? sentiment : 'neutral';
              return (
                <div key={participant} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {participant}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className={getSentimentColor(sentiment)}>
                      {getSentimentIcon(sentiment)}
                    </div>
                    <span className={`text-sm font-medium capitalize ${getSentimentColor(sentiment)}`}>
                      {sentimentStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sentiment Statistics */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-green-600 dark:text-green-400 font-semibold text-lg">
            {positive}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Positive
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-gray-600 dark:text-gray-400 font-semibold text-lg">
            {neutral}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Neutral
          </div>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-red-600 dark:text-red-400 font-semibold text-lg">
            {negative}
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">
            Negative
          </div>
        </div>
      </div>
    </div>
  );
}