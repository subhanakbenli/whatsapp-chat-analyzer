'use client';

import { useState, useEffect } from 'react';

interface ProcessingProgress {
  id: string;
  progress: number;
  status: 'initialized' | 'in_progress' | 'completed' | 'failed';
  currentStep: number;
  totalSteps: number;
  elapsedTime: number;
  estimatedTimeRemaining: number | null;
  steps: Array<{
    name: string;
    status: string;
    progress: number;
    duration: number | null;
  }>;
  errors: Array<{
    step: string;
    error: string;
    timestamp: number;
  }>;
  warnings: Array<{
    step: string;
    warning: string;
    timestamp: number;
  }>;
}

interface ProcessingStateProps {
  sessionId: string;
  onComplete: (analysisId: string) => void;
  onError: (error: string) => void;
}

export function ProcessingState({ sessionId, onComplete, onError }: ProcessingStateProps) {
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollProgress = async () => {
      try {
        const response = await fetch(`/api/analyze?sessionId=${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch progress');
        }

        const data = await response.json();
        setProgress(data);

        if (data.status === 'completed') {
          setIsPolling(false);
          onComplete(sessionId);
        } else if (data.status === 'failed') {
          setIsPolling(false);
          const errorMessage = data.errors.length > 0 
            ? data.errors[0].error 
            : 'Analysis failed';
          onError(errorMessage);
        }
      } catch (error) {
        console.error('Error polling progress:', error);
        setIsPolling(false);
        onError('Failed to track progress');
      }
    };

    if (isPolling) {
      // Initial poll
      pollProgress();
      
      // Set up interval
      interval = setInterval(pollProgress, 2000); // Poll every 2 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [sessionId, isPolling, onComplete, onError]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'in_progress':
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'failed':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
        );
    }
  };

  const getStepName = (stepName: string) => {
    const stepNames: { [key: string]: string } = {
      'reading_file': 'Reading file',
      'parsing_chat': 'Parsing chat messages',
      'chunking_messages': 'Organizing conversation chunks',
      'ai_analysis': 'AI analysis in progress',
      'aggregating_results': 'Aggregating insights',
      'saving_results': 'Saving results'
    };
    return stepNames[stepName] || stepName;
  };

  if (!progress) {
    return (
      <div className="flex items-center justify-center space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="text-gray-600 dark:text-gray-300">Initializing analysis...</span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Analyzing Your Chat
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Please wait while our AI processes your conversation
        </p>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
          <span>Overall Progress</span>
          <span>{progress.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      </div>

      {/* Time Information */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-6">
        <span>Elapsed: {formatTime(progress.elapsedTime)}</span>
        {progress.estimatedTimeRemaining && (
          <span>Estimated remaining: {formatTime(progress.estimatedTimeRemaining)}</span>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {progress.steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {getStepIcon(step.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getStepName(step.name)}
                </span>
                {step.status === 'in_progress' && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {step.progress}%
                  </span>
                )}
                {step.status === 'completed' && step.duration && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(step.duration)}
                  </span>
                )}
              </div>
              {step.status === 'in_progress' && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {progress.warnings.length > 0 && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Warnings
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            {progress.warnings.map((warning, index) => (
              <li key={index}>• {warning.warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Cancel Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => onError('Analysis cancelled by user')}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          Cancel Analysis
        </button>
      </div>
    </div>
  );
}