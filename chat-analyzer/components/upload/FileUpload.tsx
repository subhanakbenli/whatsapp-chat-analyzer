'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { ProcessingState } from './ProcessingState';

export function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingSessionId, setProcessingSessionId] = useState<string | null>(null);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setError(null);

    // Run upload in background
    (async () => {
      try {
        // Validate file
        if (!file.name.endsWith('.txt')) {
          throw new Error('Please upload a .txt file exported from WhatsApp');
        }

        if (file.size > 100 * 1024 * 1024) { // 100MB limit
          throw new Error('File size must be less than 100MB');
        }

        // Read file content
        const text = await file.text();
        
        // Basic validation
        if (!text.includes(':') || text.length < 100) {
          throw new Error('This doesn\'t appear to be a valid WhatsApp chat export');
        }

        // Create FormData and upload
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        
        // Check if analysis was successful
        if (result.success && result.sessionId) {
          setProcessingSessionId(result.sessionId);
          setUploading(false);
        } else {
          throw new Error(result.error || 'Analysis failed');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setUploading(false);
      }
    })();
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    disabled: uploading || processingSessionId !== null
  });

  const handleProcessingComplete = (sessionId: string) => {
    router.push(`/dashboard/${sessionId}`);
  };

  const handleProcessingError = (error: string) => {
    setError(error);
    setProcessingSessionId(null);
    setUploading(false);
  };

  // Show processing state if we have a session ID
  if (processingSessionId) {
    return (
      <ProcessingState
        sessionId={processingSessionId}
        onComplete={handleProcessingComplete}
        onError={handleProcessingError}
      />
    );
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Analyzing your chat...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {isDragActive ? 'Drop your chat file here' : 'Upload your WhatsApp chat export'}
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Drag and drop your .txt file here, or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Maximum file size: 100MB
              </p>
            </div>
            
            <button
              type="button"
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
            >
              Choose File
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Don't have a WhatsApp chat export? 
        </p>
        <button
          type="button"
          onClick={() => {
            // You can add a modal or tutorial here
            alert('Tutorial: Go to WhatsApp > Settings > Chats > Export chat > Without media > Share as text file');
          }}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          Learn how to export your chats
        </button>
      </div>
    </div>
  );
}