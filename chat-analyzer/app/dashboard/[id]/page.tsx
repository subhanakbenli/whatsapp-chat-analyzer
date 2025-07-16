'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { MessageTimelineChart } from '@/components/charts/MessageTimelineChart';
import { SentimentAnalysisChart } from '@/components/charts/SentimentAnalysisChart';
import { ParticipantChart } from '@/components/charts/ParticipantChart';
import { TopicChart } from '@/components/charts/TopicChart';
import { ActivityHeatmap } from '@/components/charts/ActivityHeatmap';
import { FilterPanel } from '@/components/dashboard/FilterPanel';


interface AnalysisData {
  id: string;
  analysis_json: any;
  file_name: string;
  file_size: number;
  created_at: string;
}

export default function DashboardPage() {
  const params = useParams();
  const analysisId = params.id as string;
  
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  useEffect(() => {
    fetchAnalysis();
  }, [analysisId]);

  const fetchAnalysis = async () => {
    try {
      // First, check if we have a completed analysis
      const response = await fetch(`/api/analyze?sessionId=${analysisId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis');
      }
      
      const result = await response.json();
      
      // Check if the analysis is completed
      if (result.status === 'completed' && result.result?.analysis) {
        // Convert to expected format
        const analysisData = {
          id: analysisId,
          analysis_json: result.result.analysis,
          file_name: result.result.analysis.originalData?.metadata?.fileName || 'Unknown',
          file_size: result.result.analysis.originalData?.metadata?.estimatedSize || 0,
          created_at: result.result.analysis.originalData?.metadata?.parseDate || new Date().toISOString()
        };
        setData(analysisData);
        
        // Initialize filters
        const participants = Object.keys(result.result.analysis.participants || {});
        setSelectedParticipants(participants);
        
        // Set date range from analysis
        const originalData = result.result.analysis.originalData;
        if (originalData?.messages?.length > 0) {
          const messages = originalData.messages;
          setDateRange({
            start: new Date(messages[0].timestamp),
            end: new Date(messages[messages.length - 1].timestamp)
          });
        }
      } else {
        // Analysis is still in progress or failed
        setError('Analysis is still in progress or failed. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: {
    dateRange: { start: Date | null; end: Date | null };
    participants: string[];
  }) => {
    setDateRange(filters.dateRange);
    setSelectedParticipants(filters.participants);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const analysis = data.analysis_json;
  const originalData = analysis.originalData || {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Chat Analysis Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {data.file_name} • {new Date(data.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <FilterPanel
                participants={Object.keys(analysis.participants || {})}
                onFilterChange={handleFilterChange}
                initialDateRange={dateRange}
                initialParticipants={selectedParticipants}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Messages"
            value={analysis.statistics?.totalMessages || 0}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
            change={null}
          />
          <StatsCard
            title="Participants"
            value={Object.keys(analysis.participants || {}).length}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
            change={null}
          />
          <StatsCard
            title="Overall Sentiment"
            value={analysis.sentiment?.overall || 'neutral'}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            change={analysis.sentiment?.score ? `${Math.round(analysis.sentiment.score * 100)}%` : null}
          />
          <StatsCard
            title="Top Topics"
            value={analysis.topics?.length || 0}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            }
            change={null}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Message Timeline
            </h2>
            <MessageTimelineChart 
              data={originalData.messages || []}
              dateRange={dateRange}
              selectedParticipants={selectedParticipants}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Sentiment Analysis
            </h2>
            <SentimentAnalysisChart data={analysis.sentiment || {}} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Participant Activity
            </h2>
            <ParticipantChart 
              data={analysis.participants || {}}
              selectedParticipants={selectedParticipants}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Topics
            </h2>
            <TopicChart data={analysis.topics || []} />
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Activity Heatmap
          </h2>
          <ActivityHeatmap 
            data={originalData.messages || []}
            dateRange={dateRange}
            selectedParticipants={selectedParticipants}
          />
        </div>

        {/* Insights Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Key Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                Conversation Highlights
              </h3>
              <ul className="space-y-2">
                {(analysis.insights?.keyEvents || []).map((event: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600 dark:text-gray-300">{event}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-3">
                Communication Patterns
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Most Active Participant</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {analysis.statistics?.mostActiveParticipant || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Average Message Length</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {analysis.statistics?.averageMessageLength || 0} chars
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Media Messages</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {analysis.statistics?.mediaMessages || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}