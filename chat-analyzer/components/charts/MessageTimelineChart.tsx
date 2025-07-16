'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface Message {
  timestamp: string;
  sender: string;
  content: string;
  type: string;
}

interface MessageTimelineChartProps {
  data: Message[];
  dateRange: { start: Date | null; end: Date | null };
  selectedParticipants: string[];
}

export function MessageTimelineChart({ data, dateRange, selectedParticipants }: MessageTimelineChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  // Filter messages based on date range and selected participants
  const filteredMessages = data.filter(message => {
    const messageDate = new Date(message.timestamp);
    const inDateRange = (!dateRange.start || messageDate >= dateRange.start) && 
                       (!dateRange.end || messageDate <= dateRange.end);
    const participantSelected = selectedParticipants.includes(message.sender);
    return inDateRange && participantSelected && message.type === 'message';
  });

  // Group messages by day
  const messagesByDay = filteredMessages.reduce((acc, message) => {
    const date = format(new Date(message.timestamp), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { total: 0, participants: {} };
    }
    acc[date].total++;
    acc[date].participants[message.sender] = (acc[date].participants[message.sender] || 0) + 1;
    return acc;
  }, {} as Record<string, { total: number; participants: Record<string, number> }>);

  // Sort dates and prepare chart data
  const sortedDates = Object.keys(messagesByDay).sort();
  const chartData = {
    labels: sortedDates,
    datasets: [
      {
        label: 'Total Messages',
        data: sortedDates.map(date => messagesByDay[date].total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  // Add individual participant lines if there are few enough participants
  if (selectedParticipants.length <= 5) {
    const colors = [
      'rgb(239, 68, 68)',
      'rgb(34, 197, 94)',
      'rgb(168, 85, 247)',
      'rgb(245, 158, 11)',
      'rgb(236, 72, 153)',
    ];

    selectedParticipants.forEach((participant, index) => {
      chartData.datasets.push({
        label: participant,
        data: sortedDates.map(date => messagesByDay[date].participants[participant] || 0),
        borderColor: colors[index % colors.length],
        backgroundColor: colors[index % colors.length] + '20',
        tension: 0.1,
        fill: false,
      });
    });
  }

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
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: function(context: any) {
            return format(new Date(context[0].label), 'MMM dd, yyyy');
          },
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y} messages`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: {
            day: 'MMM dd',
          },
        },
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
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
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  if (filteredMessages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">No messages found for selected filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}