export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.timers = new Map();
  }

  // Start timing a process
  startTimer(name) {
    this.timers.set(name, {
      startTime: performance.now(),
      startMemory: this.getMemoryUsage()
    });
  }

  // End timing and record metric
  endTimer(name, metadata = {}) {
    const timer = this.timers.get(name);
    if (!timer) {
      console.warn(`Timer '${name}' not found`);
      return null;
    }

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();
    const duration = endTime - timer.startTime;
    const memoryDelta = endMemory - timer.startMemory;

    const metric = {
      name,
      duration,
      memoryDelta,
      timestamp: Date.now(),
      metadata
    };

    this.recordMetric(name, metric);
    this.timers.delete(name);

    return metric;
  }

  // Record a metric
  recordMetric(name, metric) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metrics = this.metrics.get(name);
    metrics.push(metric);
    
    // Keep only last 100 metrics for each name
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  // Get memory usage (if available)
  getMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  // Get performance metrics
  getMetrics(name) {
    return this.metrics.get(name) || [];
  }

  // Get all metrics
  getAllMetrics() {
    const result = {};
    for (const [name, metrics] of this.metrics) {
      result[name] = metrics;
    }
    return result;
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary = {};
    
    for (const [name, metrics] of this.metrics) {
      if (metrics.length === 0) continue;
      
      const durations = metrics.map(m => m.duration);
      const memoryDeltas = metrics.map(m => m.memoryDelta);
      
      summary[name] = {
        count: metrics.length,
        avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        avgMemoryDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
        lastRun: Math.max(...metrics.map(m => m.timestamp))
      };
    }
    
    return summary;
  }

  // Clear metrics
  clearMetrics(name) {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  // Check if process is slow
  isProcessSlow(name, threshold = 1000) {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return false;
    
    const recent = metrics.slice(-5);
    const avgDuration = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
    
    return avgDuration > threshold;
  }

  // Generate performance report
  generateReport() {
    const summary = this.getPerformanceSummary();
    const report = {
      timestamp: new Date().toISOString(),
      totalMetrics: Object.keys(summary).length,
      summary,
      slowProcesses: [],
      recommendations: []
    };

    // Identify slow processes
    for (const [name, stats] of Object.entries(summary)) {
      if (stats.avgDuration > 1000) {
        report.slowProcesses.push({
          name,
          avgDuration: stats.avgDuration,
          maxDuration: stats.maxDuration
        });
      }
    }

    // Generate recommendations
    if (report.slowProcesses.length > 0) {
      report.recommendations.push('Consider optimizing slow processes');
    }

    return report;
  }
}

// Utility functions for performance optimization
export class PerformanceOptimizer {
  // Debounce function calls
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function calls
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Memoize function results
  static memoize(func, getKey = (...args) => JSON.stringify(args)) {
    const cache = new Map();
    
    return function memoizedFunction(...args) {
      const key = getKey(...args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func.apply(this, args);
      cache.set(key, result);
      
      // Limit cache size
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      return result;
    };
  }

  // Lazy loading helper
  static createLazyLoader(loadFn, placeholder = null) {
    let loaded = false;
    let loading = false;
    let result = placeholder;
    let error = null;

    return {
      load: async () => {
        if (loaded) return result;
        if (loading) return result;
        
        loading = true;
        try {
          result = await loadFn();
          loaded = true;
          error = null;
        } catch (err) {
          error = err;
          throw err;
        } finally {
          loading = false;
        }
        
        return result;
      },
      get: () => result,
      isLoaded: () => loaded,
      isLoading: () => loading,
      getError: () => error
    };
  }

  // Batch processing
  static createBatchProcessor(processFn, batchSize = 100, delay = 100) {
    let queue = [];
    let processing = false;

    const processBatch = async () => {
      if (processing || queue.length === 0) return;
      
      processing = true;
      const batch = queue.splice(0, batchSize);
      
      try {
        await processFn(batch);
      } catch (error) {
        console.error('Batch processing error:', error);
      } finally {
        processing = false;
        
        if (queue.length > 0) {
          setTimeout(processBatch, delay);
        }
      }
    };

    return {
      add: (item) => {
        queue.push(item);
        if (!processing) {
          setTimeout(processBatch, delay);
        }
      },
      flush: processBatch,
      getQueueSize: () => queue.length,
      isProcessing: () => processing
    };
  }

  // Virtual scrolling helper
  static createVirtualScroller(items, itemHeight, containerHeight) {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const buffer = Math.ceil(visibleCount / 2);
    
    return {
      getVisibleItems: (scrollTop) => {
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount + buffer, items.length);
        const adjustedStartIndex = Math.max(0, startIndex - buffer);
        
        return {
          startIndex: adjustedStartIndex,
          endIndex,
          items: items.slice(adjustedStartIndex, endIndex),
          offsetY: adjustedStartIndex * itemHeight,
          totalHeight: items.length * itemHeight
        };
      }
    };
  }

  // Memory usage tracker
  static trackMemory(name, fn) {
    const startMemory = performance.memory?.usedJSHeapSize || 0;
    const result = fn();
    const endMemory = performance.memory?.usedJSHeapSize || 0;
    
    console.log(`[${name}] Memory delta: ${((endMemory - startMemory) / 1024 / 1024).toFixed(2)} MB`);
    
    return result;
  }

  // File chunk processor
  static async processFileInChunks(file, chunkSize = 1024 * 1024, processFn) {
    const chunks = [];
    let offset = 0;
    
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      const chunkData = await chunk.text();
      
      const processedChunk = await processFn(chunkData, offset, chunks.length);
      chunks.push(processedChunk);
      
      offset += chunkSize;
      
      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return chunks;
  }

  // Progressive loading
  static createProgressiveLoader(items, loadFn, batchSize = 10) {
    let loadedItems = [];
    let currentIndex = 0;
    let loading = false;

    const loadNext = async () => {
      if (loading || currentIndex >= items.length) return false;
      
      loading = true;
      const batch = items.slice(currentIndex, currentIndex + batchSize);
      
      try {
        const loadedBatch = await loadFn(batch);
        loadedItems.push(...loadedBatch);
        currentIndex += batchSize;
        return true;
      } catch (error) {
        console.error('Progressive loading error:', error);
        return false;
      } finally {
        loading = false;
      }
    };

    return {
      loadNext,
      getLoadedItems: () => loadedItems,
      getProgress: () => currentIndex / items.length,
      isLoading: () => loading,
      hasMore: () => currentIndex < items.length
    };
  }
}

// Web Worker helper
export class WebWorkerHelper {
  static createWorker(workerScript) {
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    return new Worker(workerUrl);
  }

  static async runInWorker(workerScript, data) {
    return new Promise((resolve, reject) => {
      const worker = this.createWorker(workerScript);
      
      worker.onmessage = (event) => {
        worker.terminate();
        resolve(event.data);
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
      
      worker.postMessage(data);
    });
  }
}

// Create global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance measurement decorator
export function measurePerformance(name, metadata = {}) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args) {
      performanceMonitor.startTimer(name);
      
      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.endTimer(name, metadata);
        return result;
      } catch (error) {
        performanceMonitor.endTimer(name, { ...metadata, error: error.message });
        throw error;
      }
    };
    
    return descriptor;
  };
}

export default {
  PerformanceMonitor,
  PerformanceOptimizer,
  WebWorkerHelper,
  performanceMonitor,
  measurePerformance
};