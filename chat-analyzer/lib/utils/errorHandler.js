export class ErrorHandler {
  constructor() {
    this.errors = new Map();
  }

  handleError(error, context = 'unknown') {
    const errorId = this.generateErrorId();
    const timestamp = new Date().toISOString();
    
    const errorDetails = {
      id: errorId,
      message: error.message || 'Unknown error',
      stack: error.stack,
      context,
      timestamp,
      type: error.name || 'Error'
    };

    // Log error
    console.error(`[${context}] Error ${errorId}:`, error);
    
    // Store error details
    this.errors.set(errorId, errorDetails);
    
    // Clean up old errors (keep last 100)
    if (this.errors.size > 100) {
      const oldestKey = this.errors.keys().next().value;
      this.errors.delete(oldestKey);
    }
    
    return errorDetails;
  }

  handleApiError(error, req, res) {
    const errorDetails = this.handleError(error, 'API');
    
    // Determine status code
    let statusCode = 500;
    if (error.name === 'ValidationError') statusCode = 400;
    if (error.name === 'NotFoundError') statusCode = 404;
    if (error.name === 'UnauthorizedError') statusCode = 401;
    if (error.name === 'RateLimitError') statusCode = 429;
    
    // Create user-friendly error response
    const response = {
      error: this.getUserFriendlyMessage(error),
      errorId: errorDetails.id,
      timestamp: errorDetails.timestamp
    };
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
      response.details = errorDetails;
    }
    
    return {
      statusCode,
      response
    };
  }

  getUserFriendlyMessage(error) {
    const message = error.message || 'An unexpected error occurred';
    
    // Map technical errors to user-friendly messages
    const errorMappings = {
      'Network Error': 'Connection problem. Please check your internet connection and try again.',
      'Timeout Error': 'Request took too long. Please try again.',
      'Parse Error': 'Invalid file format. Please check your chat export file.',
      'Validation Error': 'Invalid input data. Please check your submission.',
      'Rate Limit Error': 'Too many requests. Please wait a moment and try again.',
      'File Too Large': 'File is too large. Please use a smaller file (max 100MB).',
      'Invalid Format': 'File format not supported. Please upload a .txt file.',
      'API Key Error': 'Service temporarily unavailable. Please try again later.',
      'Database Error': 'Data storage issue. Please try again later.',
      'Processing Error': 'Analysis failed. Please try again with a different file.'
    };
    
    // Check for specific error patterns
    for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
      if (message.includes(pattern)) {
        return friendlyMessage;
      }
    }
    
    // Default user-friendly message
    return 'Something went wrong. Please try again or contact support if the problem persists.';
  }

  handleChunkingError(error, chunk) {
    const errorDetails = this.handleError(error, 'chunking');
    
    return {
      chunkId: chunk.id,
      error: errorDetails,
      canRetry: this.canRetryChunkingError(error),
      suggestion: this.getChunkingErrorSuggestion(error)
    };
  }

  handleParsingError(error, fileName) {
    const errorDetails = this.handleError(error, 'parsing');
    
    return {
      fileName,
      error: errorDetails,
      canRetry: false,
      suggestion: this.getParsingErrorSuggestion(error)
    };
  }

  handleAIError(error, chunkId) {
    const errorDetails = this.handleError(error, 'ai_analysis');
    
    return {
      chunkId,
      error: errorDetails,
      canRetry: this.canRetryAIError(error),
      suggestion: this.getAIErrorSuggestion(error)
    };
  }

  canRetryChunkingError(error) {
    const retryableErrors = [
      'Memory limit exceeded',
      'Timeout',
      'Temporary failure'
    ];
    
    return retryableErrors.some(pattern => 
      error.message.includes(pattern)
    );
  }

  canRetryAIError(error) {
    const retryableErrors = [
      'Rate limit',
      'Timeout',
      'Service unavailable',
      'Network error'
    ];
    
    return retryableErrors.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  getChunkingErrorSuggestion(error) {
    if (error.message.includes('Memory limit')) {
      return 'Try reducing the chunk size or splitting the file into smaller parts.';
    }
    if (error.message.includes('Invalid timestamp')) {
      return 'Check that your chat export uses a supported timestamp format.';
    }
    return 'Try uploading a different chat export file.';
  }

  getParsingErrorSuggestion(error) {
    if (error.message.includes('format')) {
      return 'Ensure your file is a WhatsApp chat export in .txt format.';
    }
    if (error.message.includes('encoding')) {
      return 'Try re-exporting your chat with UTF-8 encoding.';
    }
    if (error.message.includes('empty')) {
      return 'Make sure your chat export contains actual messages.';
    }
    return 'Try exporting your chat again from WhatsApp.';
  }

  getAIErrorSuggestion(error) {
    if (error.message.includes('rate limit')) {
      return 'Wait a moment and try again. High traffic detected.';
    }
    if (error.message.includes('quota')) {
      return 'Service quota exceeded. Please try again later.';
    }
    if (error.message.includes('model')) {
      return 'AI service temporarily unavailable. Please try again later.';
    }
    return 'Try again or contact support if the problem persists.';
  }

  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getError(errorId) {
    return this.errors.get(errorId);
  }

  clearError(errorId) {
    return this.errors.delete(errorId);
  }

  getAllErrors() {
    return Array.from(this.errors.values());
  }

  getErrorsByContext(context) {
    return Array.from(this.errors.values()).filter(error => error.context === context);
  }

  createErrorReport() {
    const errors = this.getAllErrors();
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: errors.length,
      errorsByType: {},
      errorsByContext: {},
      recentErrors: errors.slice(-10)
    };

    errors.forEach(error => {
      // Group by type
      report.errorsByType[error.type] = (report.errorsByType[error.type] || 0) + 1;
      
      // Group by context
      report.errorsByContext[error.context] = (report.errorsByContext[error.context] || 0) + 1;
    });

    return report;
  }

  // Frontend error handling helpers
  static createClientErrorHandler() {
    return {
      handleUploadError: (error) => {
        if (error.message.includes('size')) {
          return 'File is too large. Please use a file smaller than 100MB.';
        }
        if (error.message.includes('format')) {
          return 'Invalid file format. Please upload a .txt file from WhatsApp.';
        }
        if (error.message.includes('network')) {
          return 'Upload failed due to network issues. Please try again.';
        }
        return 'Upload failed. Please try again.';
      },

      handleAnalysisError: (error) => {
        if (error.message.includes('timeout')) {
          return 'Analysis is taking longer than expected. Please try again.';
        }
        if (error.message.includes('parse')) {
          return 'Could not parse your chat file. Please check the format.';
        }
        if (error.message.includes('api')) {
          return 'Analysis service temporarily unavailable. Please try again later.';
        }
        return 'Analysis failed. Please try again.';
      },

      handleExportError: (error) => {
        if (error.message.includes('generation')) {
          return 'Report generation failed. Please try again.';
        }
        if (error.message.includes('data')) {
          return 'Export data not available. Please regenerate the analysis.';
        }
        return 'Export failed. Please try again.';
      }
    };
  }
}

export default new ErrorHandler();