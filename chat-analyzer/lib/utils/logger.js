class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logs = [];
    this.maxLogs = 1000;
    this.context = 'global';
    
    // Log levels hierarchy
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };
    
    this.currentLevel = this.levels[this.logLevel] || this.levels.info;
  }

  setContext(context) {
    this.context = context;
    return this;
  }

  shouldLog(level) {
    return this.levels[level] <= this.currentLevel;
  }

  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      context: this.context,
      message,
      data,
      id: this.generateLogId()
    };

    // Store in memory (for debugging)
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    return logEntry;
  }

  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  log(level, message, data = {}) {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatMessage(level, message, data);
    
    // Console output with colors
    this.outputToConsole(logEntry);
    
    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry);
    }
  }

  outputToConsole(logEntry) {
    const { timestamp, level, context, message, data } = logEntry;
    const contextStr = context !== 'global' ? `[${context}]` : '';
    const timeStr = new Date(timestamp).toLocaleTimeString();
    
    const logMessage = `${timeStr} ${level} ${contextStr} ${message}`;
    
    // Use appropriate console method with colors
    switch (level) {
      case 'ERROR':
        console.error(`\x1b[31m${logMessage}\x1b[0m`, data);
        break;
      case 'WARN':
        console.warn(`\x1b[33m${logMessage}\x1b[0m`, data);
        break;
      case 'INFO':
        console.info(`\x1b[36m${logMessage}\x1b[0m`, data);
        break;
      case 'DEBUG':
        console.debug(`\x1b[35m${logMessage}\x1b[0m`, data);
        break;
      case 'TRACE':
        console.trace(`\x1b[37m${logMessage}\x1b[0m`, data);
        break;
      default:
        console.log(logMessage, data);
    }
  }

  sendToLoggingService(logEntry) {
    // In production, send to external service like Sentry, LogRocket, etc.
    // For now, just store locally
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 100 logs in localStorage
        if (logs.length > 100) {
          logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('app_logs', JSON.stringify(logs));
      }
    } catch (error) {
      console.error('Failed to store log:', error);
    }
  }

  // Convenience methods
  error(message, data = {}) {
    this.log('error', message, data);
  }

  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  info(message, data = {}) {
    this.log('info', message, data);
  }

  debug(message, data = {}) {
    this.log('debug', message, data);
  }

  trace(message, data = {}) {
    this.log('trace', message, data);
  }

  // Specialized logging methods
  apiCall(method, url, data = {}) {
    this.info(`API ${method.toUpperCase()} ${url}`, data);
  }

  apiResponse(method, url, status, duration, data = {}) {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.log(level, `API ${method.toUpperCase()} ${url} ${status} (${duration}ms)`, data);
  }

  userAction(action, data = {}) {
    this.info(`User action: ${action}`, data);
  }

  performance(metric, value, unit = 'ms') {
    this.debug(`Performance: ${metric} = ${value}${unit}`);
  }

  security(event, data = {}) {
    this.warn(`Security event: ${event}`, data);
  }

  // Analysis-specific logging
  analysisStart(sessionId, fileName, fileSize) {
    this.info('Analysis started', { sessionId, fileName, fileSize });
  }

  analysisProgress(sessionId, step, progress) {
    this.info(`Analysis progress: ${step}`, { sessionId, progress });
  }

  analysisComplete(sessionId, duration, stats) {
    this.info('Analysis completed', { sessionId, duration, stats });
  }

  analysisError(sessionId, step, error) {
    this.error(`Analysis error in ${step}`, { sessionId, error: error.message, stack: error.stack });
  }

  chunkProcessed(chunkId, duration, size) {
    this.debug('Chunk processed', { chunkId, duration, size });
  }

  aiRequest(chunkId, prompt, duration) {
    this.debug('AI request', { chunkId, promptLength: prompt.length, duration });
  }

  aiResponse(chunkId, success, duration, tokenCount) {
    this.info('AI response', { chunkId, success, duration, tokenCount });
  }

  // Database logging
  dbQuery(query, duration, affectedRows) {
    this.debug('Database query', { query: query.substring(0, 100), duration, affectedRows });
  }

  dbError(query, error) {
    this.error('Database error', { query: query.substring(0, 100), error: error.message });
  }

  // File operations
  fileUpload(fileName, fileSize, uploadTime) {
    this.info('File uploaded', { fileName, fileSize, uploadTime });
  }

  fileProcessing(fileName, operation, duration) {
    this.debug('File processing', { fileName, operation, duration });
  }

  fileError(fileName, operation, error) {
    this.error('File operation error', { fileName, operation, error: error.message });
  }

  // Export logging
  exportStart(analysisId, format) {
    this.info('Export started', { analysisId, format });
  }

  exportComplete(analysisId, format, duration, size) {
    this.info('Export completed', { analysisId, format, duration, size });
  }

  exportError(analysisId, format, error) {
    this.error('Export error', { analysisId, format, error: error.message });
  }

  // Utility methods
  getLogs(level = null, limit = 100) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level.toUpperCase());
    }
    
    return filteredLogs.slice(-limit);
  }

  clearLogs() {
    this.logs = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('app_logs');
    }
  }

  getLogStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      byContext: {},
      recent: this.logs.slice(-10)
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
    });

    return stats;
  }

  exportLogs(format = 'json') {
    const logs = this.getLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else if (format === 'csv') {
      const headers = ['timestamp', 'level', 'context', 'message', 'data'];
      const csv = [headers.join(',')];
      
      logs.forEach(log => {
        const row = [
          log.timestamp,
          log.level,
          log.context,
          `"${log.message.replace(/"/g, '""')}"`,
          `"${JSON.stringify(log.data).replace(/"/g, '""')}"`
        ];
        csv.push(row.join(','));
      });
      
      return csv.join('\n');
    }
    
    return logs;
  }

  // Create child logger with context
  child(context) {
    const childLogger = new Logger();
    childLogger.logLevel = this.logLevel;
    childLogger.currentLevel = this.currentLevel;
    childLogger.context = context;
    return childLogger;
  }
}

// Create global logger instance
export const logger = new Logger();

// Context-specific loggers
export const apiLogger = logger.child('api');
export const dbLogger = logger.child('database');
export const analysisLogger = logger.child('analysis');
export const fileLogger = logger.child('file');
export const exportLogger = logger.child('export');
export const uiLogger = logger.child('ui');

// Performance logging helper
export function logPerformance(name, fn) {
  return async function(...args) {
    const start = performance.now();
    
    try {
      const result = await fn.apply(this, args);
      const duration = performance.now() - start;
      logger.performance(name, duration.toFixed(2));
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.performance(`${name} (error)`, duration.toFixed(2));
      throw error;
    }
  };
}

// Request logging middleware
export function logRequests(req, res, next) {
  const start = Date.now();
  const { method, url, headers, body } = req;
  
  apiLogger.apiCall(method, url, {
    headers: headers['content-type'],
    bodySize: body ? JSON.stringify(body).length : 0,
    userAgent: headers['user-agent']
  });
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    apiLogger.apiResponse(method, url, res.statusCode, duration, {
      responseSize: res.get('content-length') || 0
    });
  });
  
  if (next) next();
}

// Error logging helper
export function logError(error, context = 'unknown') {
  logger.error(`Error in ${context}`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context
  });
}

// Async error wrapper
export function withLogging(fn, context) {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      logError(error, context);
      throw error;
    }
  };
}

export default logger;