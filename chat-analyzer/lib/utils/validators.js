export class Validators {
  static validateFile(file) {
    const errors = [];
    
    // Check if file exists
    if (!file) {
      errors.push('No file provided');
      return { valid: false, errors };
    }
    
    // Check file type
    if (!file.name.endsWith('.txt')) {
      errors.push('File must be a .txt file');
    }
    
    // Check file size (100MB limit)
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum limit (${this.formatFileSize(MAX_SIZE)})`);
    }
    
    // Check minimum file size
    const MIN_SIZE = 100; // 100 bytes
    if (file.size < MIN_SIZE) {
      errors.push('File appears to be empty or too small');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      }
    };
  }

  static async validateFileContent(content) {
    const errors = [];
    const warnings = [];
    
    // Check if content exists
    if (!content || typeof content !== 'string') {
      errors.push('File content is empty or invalid');
      return { valid: false, errors, warnings };
    }
    
    // Check minimum content length
    if (content.length < 100) {
      errors.push('File content is too short to be a valid WhatsApp export');
    }
    
    // Check for common WhatsApp export patterns
    const commonPatterns = [
      /\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\s*-\s*.+/i,
      /\[\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]\s*.+/i,
      /\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*-\s*.+/i
    ];
    
    const hasValidPattern = commonPatterns.some(pattern => pattern.test(content));
    if (!hasValidPattern) {
      errors.push('File does not appear to be a valid WhatsApp chat export');
    }
    
    // Check for suspicious content
    if (content.includes('<script>') || content.includes('javascript:')) {
      errors.push('File contains potentially harmful content');
    }
    
    // Check character encoding
    if (content.includes('\uFFFD')) {
      warnings.push('File may have encoding issues. Some characters might not display correctly.');
    }
    
    // Check for reasonable message count
    const lines = content.split('\n');
    const messageLines = lines.filter(line => 
      commonPatterns.some(pattern => pattern.test(line))
    );
    
    if (messageLines.length < 5) {
      warnings.push('Very few messages detected. Please ensure this is a complete chat export.');
    }
    
    if (messageLines.length > 100000) {
      warnings.push('Very large chat detected. Processing may take longer than usual.');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalLines: lines.length,
        messageLines: messageLines.length,
        characters: content.length,
        estimatedMessages: messageLines.length
      }
    };
  }

  static validateAnalysisData(data) {
    const errors = [];
    const warnings = [];
    
    // Check basic structure
    if (!data || typeof data !== 'object') {
      errors.push('Invalid analysis data structure');
      return { valid: false, errors, warnings };
    }
    
    // Check required fields
    const requiredFields = ['messages', 'participants', 'metadata'];
    requiredFields.forEach(field => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Validate messages
    if (data.messages) {
      if (!Array.isArray(data.messages)) {
        errors.push('Messages must be an array');
      } else {
        if (data.messages.length === 0) {
          errors.push('No messages found in analysis data');
        }
        
        // Check message structure
        const sampleMessage = data.messages[0];
        if (sampleMessage) {
          const requiredMessageFields = ['timestamp', 'sender', 'content'];
          requiredMessageFields.forEach(field => {
            if (!sampleMessage[field]) {
              warnings.push(`Message missing field: ${field}`);
            }
          });
        }
      }
    }
    
    // Validate participants
    if (data.participants) {
      if (!Array.isArray(data.participants) && typeof data.participants !== 'object') {
        errors.push('Participants must be an array or object');
      } else {
        const participantCount = Array.isArray(data.participants) 
          ? data.participants.length 
          : Object.keys(data.participants).length;
        
        if (participantCount === 0) {
          errors.push('No participants found in analysis data');
        }
        
        if (participantCount > 100) {
          warnings.push('Very large number of participants detected');
        }
      }
    }
    
    // Validate metadata
    if (data.metadata) {
      if (typeof data.metadata !== 'object') {
        errors.push('Metadata must be an object');
      } else {
        const requiredMetadataFields = ['fileName', 'messageCount'];
        requiredMetadataFields.forEach(field => {
          if (!data.metadata[field]) {
            warnings.push(`Metadata missing field: ${field}`);
          }
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      stats: {
        messageCount: data.messages ? data.messages.length : 0,
        participantCount: data.participants ? 
          (Array.isArray(data.participants) ? data.participants.length : Object.keys(data.participants).length) : 0,
        hasMetadata: !!data.metadata
      }
    };
  }

  static validateChunk(chunk) {
    const errors = [];
    
    if (!chunk || typeof chunk !== 'object') {
      errors.push('Invalid chunk structure');
      return { valid: false, errors };
    }
    
    // Check required fields
    const requiredFields = ['id', 'messages', 'messageCount', 'size'];
    requiredFields.forEach(field => {
      if (chunk[field] === undefined) {
        errors.push(`Chunk missing required field: ${field}`);
      }
    });
    
    // Validate messages array
    if (chunk.messages) {
      if (!Array.isArray(chunk.messages)) {
        errors.push('Chunk messages must be an array');
      } else if (chunk.messages.length !== chunk.messageCount) {
        errors.push('Chunk message count mismatch');
      }
    }
    
    // Validate size
    if (typeof chunk.size !== 'number' || chunk.size <= 0) {
      errors.push('Chunk size must be a positive number');
    }
    
    // Check if size is too large
    const MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    if (chunk.size > MAX_CHUNK_SIZE) {
      errors.push(`Chunk size (${this.formatFileSize(chunk.size)}) exceeds maximum (${this.formatFileSize(MAX_CHUNK_SIZE)})`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateExportRequest(request) {
    const errors = [];
    
    if (!request || typeof request !== 'object') {
      errors.push('Invalid export request');
      return { valid: false, errors };
    }
    
    // Validate format
    const supportedFormats = ['json', 'csv', 'pdf', 'html'];
    if (!request.format || !supportedFormats.includes(request.format)) {
      errors.push(`Unsupported export format. Supported formats: ${supportedFormats.join(', ')}`);
    }
    
    // Validate analysis ID
    if (!request.analysisId || typeof request.analysisId !== 'string') {
      errors.push('Valid analysis ID is required');
    }
    
    // Validate filters if provided
    if (request.filters) {
      if (typeof request.filters !== 'object') {
        errors.push('Filters must be an object');
      } else {
        // Validate date range
        if (request.filters.dateRange) {
          const { start, end } = request.filters.dateRange;
          if (start && end && new Date(start) > new Date(end)) {
            errors.push('Start date must be before end date');
          }
        }
        
        // Validate participants
        if (request.filters.participants && !Array.isArray(request.filters.participants)) {
          errors.push('Participants filter must be an array');
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  static validateSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      return { valid: false, error: 'Invalid session ID' };
    }
    
    // Check format: analysis_timestamp_randomstring
    const pattern = /^analysis_\d+_[a-z0-9]+$/;
    if (!pattern.test(sessionId)) {
      return { valid: false, error: 'Invalid session ID format' };
    }
    
    return { valid: true };
  }

  static validateAnalysisId(analysisId) {
    if (!analysisId || typeof analysisId !== 'string') {
      return { valid: false, error: 'Invalid analysis ID' };
    }
    
    // Check if it's a valid UUID
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidPattern.test(analysisId)) {
      return { valid: false, error: 'Invalid analysis ID format' };
    }
    
    return { valid: true };
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    // Remove potentially harmful characters
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime());
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static createValidationError(field, message) {
    return {
      field,
      message,
      timestamp: new Date().toISOString()
    };
  }

  static createValidationSummary(validations) {
    const allErrors = validations.flatMap(v => v.errors || []);
    const allWarnings = validations.flatMap(v => v.warnings || []);
    
    return {
      valid: allErrors.length === 0,
      errorCount: allErrors.length,
      warningCount: allWarnings.length,
      errors: allErrors,
      warnings: allWarnings,
      timestamp: new Date().toISOString()
    };
  }
}

export default Validators;