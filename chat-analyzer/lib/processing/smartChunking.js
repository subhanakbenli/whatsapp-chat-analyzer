export class SmartChunking {
  constructor(options = {}) {
    this.maxChunkSize = options.maxChunkSize || 3 * 1024 * 1024; // 3MB default
    this.minChunkSize = options.minChunkSize || 2.5 * 1024 * 1024; // 2.5MB minimum chunk size
    this.fileChunkingThreshold = options.fileChunkingThreshold || 3 * 1024 * 1024; // Only chunk files larger than 3MB
    this.conversationBreakHours = options.conversationBreakHours || 168; // 1 week default
    this.preserveContext = options.preserveContext !== false;
  }

  async chunkMessages(messages, progressCallback) {
    if (!messages || messages.length === 0) {
      throw new Error('No messages to chunk');
    }

    // Calculate total file size first
    const totalFileSize = messages.reduce((sum, msg) => sum + this.calculateMessageSize(msg), 0);
    console.log(`Total file size: ${totalFileSize} bytes (${(totalFileSize / 1024 / 1024).toFixed(2)} MB)`);

    // If file is smaller than threshold, return as single chunk
    if (totalFileSize < this.fileChunkingThreshold) {
      console.log(`File size is below chunking threshold (${(this.fileChunkingThreshold / 1024 / 1024).toFixed(2)} MB). Creating single chunk.`);
      
      // Report progress as complete
      if (progressCallback) {
        progressCallback({
          processed: messages.length,
          total: messages.length,
          chunks: 1,
          currentChunkSize: totalFileSize
        });
      }

      return [this.createChunk(messages, 0)];
    }

    console.log(`File size exceeds threshold. Starting smart chunking...`);

    const chunks = [];
    let currentChunk = [];
    let currentSize = 0;
    let lastMessageTime = null;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const messageSize = this.calculateMessageSize(message);
      const timeSinceLastMessage = lastMessageTime 
        ? (message.timestamp - lastMessageTime) / (1000 * 60 * 60) // hours
        : 0;

      // Check if we should start a new chunk
      const shouldBreak = this.shouldBreakChunk(
        currentSize + messageSize,
        timeSinceLastMessage,
        currentChunk.length,
        currentSize
      );

      if (shouldBreak && currentChunk.length > 0) {
        // Log why we're breaking
        if (currentSize + messageSize > this.maxChunkSize) {
          console.log(`Breaking chunk due to size: ${currentSize + messageSize} > ${this.maxChunkSize}`);
        } else if (currentSize >= this.minChunkSize && timeSinceLastMessage > this.conversationBreakHours) {
          console.log(`Breaking chunk due to time gap: ${timeSinceLastMessage.toFixed(1)} hours > ${this.conversationBreakHours} hours`);
        } else if (currentChunk.length > 10000) {
          console.log(`Breaking chunk due to message count: ${currentChunk.length} > 10000`);
        }
        
        // Finalize current chunk
        chunks.push(this.createChunk(currentChunk, chunks.length));
        currentChunk = [];
        currentSize = 0;
      }

      // Add message to current chunk
      currentChunk.push(message);
      currentSize += messageSize;
      lastMessageTime = message.timestamp;

      // Report progress
      if (progressCallback) {
        progressCallback({
          processed: i + 1,
          total: messages.length,
          chunks: chunks.length,
          currentChunkSize: currentSize
        });
      }
    }

    // Add final chunk if it has messages
    if (currentChunk.length > 0) {
      chunks.push(this.createChunk(currentChunk, chunks.length));
    }

    return this.optimizeChunks(chunks);
  }

  shouldBreakChunk(newSize, timeSinceLastMessage, currentChunkLength, currentSize) {
    // Size-based break - only break if we exceed maxChunkSize
    if (newSize > this.maxChunkSize) {
      return true;
    }

    // Time-based break - only if we have at least minChunkSize
    if (currentSize >= this.minChunkSize && timeSinceLastMessage > this.conversationBreakHours) {
      return true;
    }

    // Prevent extremely large chunks by message count
    return currentChunkLength > 10000;
  }

  calculateMessageSize(message) {
    return JSON.stringify(message).length;
  }

  createChunk(messages, index) {
    const chunk = {
      id: `chunk_${index}`,
      messages: [...messages],
      messageCount: messages.length,
      size: messages.reduce((sum, msg) => sum + this.calculateMessageSize(msg), 0),
      timeRange: {
        start: messages[0].timestamp,
        end: messages[messages.length - 1].timestamp
      },
      participants: [...new Set(messages.map(msg => msg.sender))],
      contextPreview: this.createContextPreview(messages)
    };

    return chunk;
  }

  createContextPreview(messages) {
    const preview = {
      firstMessage: messages[0] ? {
        sender: messages[0].sender,
        content: messages[0].content.substring(0, 100) + '...',
        timestamp: messages[0].timestamp
      } : null,
      lastMessage: messages[messages.length - 1] ? {
        sender: messages[messages.length - 1].sender,
        content: messages[messages.length - 1].content.substring(0, 100) + '...',
        timestamp: messages[messages.length - 1].timestamp
      } : null,
      participantCount: new Set(messages.map(msg => msg.sender)).size,
      messageTypes: this.analyzeMessageTypes(messages)
    };

    return preview;
  }

  analyzeMessageTypes(messages) {
    const types = {
      text: 0,
      media: 0,
      system: 0
    };

    messages.forEach(message => {
      if (message.type === 'system') {
        types.system++;
      } else if (message.content.includes('[Media]')) {
        types.media++;
      } else {
        types.text++;
      }
    });

    return types;
  }

  optimizeChunks(chunks) {
    const optimized = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // For large files, merge small chunks with adjacent ones to reach minimum size
      if (chunk.size < this.minChunkSize && i < chunks.length - 1) {
        const nextChunk = chunks[i + 1];
        if (chunk.size + nextChunk.size <= this.maxChunkSize) {
          const mergedChunk = this.mergeChunks(chunk, nextChunk, optimized.length);
          console.log(`Merged chunk ${chunk.id} (${chunk.size} bytes) with ${nextChunk.id} (${nextChunk.size} bytes) = ${mergedChunk.size} bytes`);
          optimized.push(mergedChunk);
          i++; // Skip next chunk as it's been merged
          continue;
        }
      }
      
      // Recalculate chunk ID for optimized array
      chunk.id = `chunk_${optimized.length}`;
      optimized.push(chunk);
    }

    console.log(`Chunk optimization complete. Final chunks: ${optimized.length}`);
    optimized.forEach(chunk => {
      console.log(`- ${chunk.id}: ${chunk.messageCount} messages, ${chunk.size} bytes (${(chunk.size / 1024 / 1024).toFixed(2)} MB)`);
    });

    return optimized;
  }

  mergeChunks(chunk1, chunk2, newIndex) {
    const mergedMessages = [...chunk1.messages, ...chunk2.messages];
    
    return {
      id: `chunk_${newIndex}`,
      messages: mergedMessages,
      messageCount: mergedMessages.length,
      size: chunk1.size + chunk2.size,
      timeRange: {
        start: chunk1.timeRange.start,
        end: chunk2.timeRange.end
      },
      participants: [...new Set([...chunk1.participants, ...chunk2.participants])],
      contextPreview: this.createContextPreview(mergedMessages),
      merged: true,
      originalChunks: [chunk1.id, chunk2.id]
    };
  }

  validateChunks(chunks) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {
        totalChunks: chunks.length,
        totalMessages: chunks.reduce((sum, chunk) => sum + chunk.messageCount, 0),
        totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
        averageChunkSize: 0,
        sizeDistribution: {
          small: 0,
          medium: 0,
          large: 0
        }
      }
    };

    chunks.forEach((chunk, index) => {
      // Check chunk size
      if (chunk.size > this.maxChunkSize) {
        validation.errors.push(`Chunk ${index} exceeds maximum size: ${chunk.size} bytes`);
        validation.valid = false;
      }

      if (chunk.size < this.minChunkSize) {
        validation.warnings.push(`Chunk ${index} is below minimum size: ${chunk.size} bytes`);
      }

      // Check message count
      if (chunk.messageCount === 0) {
        validation.errors.push(`Chunk ${index} has no messages`);
        validation.valid = false;
      }

      // Size distribution
      if (chunk.size < this.minChunkSize * 10) {
        validation.stats.sizeDistribution.small++;
      } else if (chunk.size < this.maxChunkSize * 0.5) {
        validation.stats.sizeDistribution.medium++;
      } else {
        validation.stats.sizeDistribution.large++;
      }
    });

    validation.stats.averageChunkSize = validation.stats.totalSize / validation.stats.totalChunks;

    return validation;
  }
}

export default SmartChunking;