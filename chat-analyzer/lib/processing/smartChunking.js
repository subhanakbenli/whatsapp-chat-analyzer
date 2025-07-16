export class SmartChunking {
  constructor(options = {}) {
    // Token tabanlı limitler (yaklaşık 1 token = 4 karakter)
    this.maxTokens = options.maxTokens || 400000; 
    this.minTokens = options.minTokens || 300000; 
    this.maxChunkSize = options.maxChunkSize || this.maxTokens * 3; 
    this.minChunkSize = options.minChunkSize || this.minTokens * 3; 
    this.fileChunkingThreshold = options.fileChunkingThreshold || this.maxTokens * 4; // Token limitine göre
    this.conversationBreakHours = options.conversationBreakHours || 5; // 5 saat konuşma arası
    this.preserveContext = options.preserveContext !== false;
  }

  async chunkMessages(messages, progressCallback) {
    if (!messages || messages.length === 0) {
      throw new Error('No messages to chunk');
    }    // Calculate total file size first (token sayısı tahmini)
    const totalFileSize = messages.reduce((sum, msg) => sum + this.calculateMessageSize(msg), 0);
    const totalChars = messages.reduce((sum, msg) => sum + this.calculateMessageChars(msg), 0);

    console.log(`Total file tokens (estimated): ${totalFileSize.toLocaleString()}`);
    console.log(`Total file characters: ${totalChars.toLocaleString()}`);

    // If file is smaller than threshold, return as single chunk
    if (totalFileSize < this.maxTokens) {
      
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
    // Token tabanlı kırılma - maxTokens'ı geçerse
    if (newSize > this.maxTokens) {
      return true;
    }

    // Zaman tabanlı kırılma - minimum token sayısına ulaştıysa ve 5 saat ara varsa
    if (currentSize >= this.minTokens && timeSinceLastMessage > this.conversationBreakHours) {
      return true;
    }

    // Çok büyük chunk'ları önlemek için mesaj sayısı kontrolü
    return currentChunkLength > 20000; // Token tabanlı olduğu için daha yüksek limit
  }

  calculateMessageSize(message) {
    // Mesajın karakter sayısını hesapla ve token tahmini yap
    const content = message.content || '';
    const sender = message.sender || '';
    const timestamp = message.timestamp ? new Date(message.timestamp).toISOString() : '';
    
    // Toplam karakter sayısı: içerik + gönderen + zaman damgası
    const totalChars = content.length + sender.length + timestamp.length;
    
    // Token tahmini: yaklaşık 1 token = 4 karakter
    // Güvenlik payı için 3.5 karakter = 1 token olarak hesapla
    return Math.ceil(totalChars / 3.5);
  }

  // Karakter sayısını da hesaplamak için yardımcı method
  calculateMessageChars(message) {
    const content = message.content || '';
    const sender = message.sender || '';
    const timestamp = message.timestamp ? new Date(message.timestamp).toISOString() : '';
    
    return content.length + sender.length + timestamp.length;
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
      if (chunk.size < this.minTokens && i < chunks.length - 1) {
        const nextChunk = chunks[i + 1];
        if (chunk.size + nextChunk.size <= this.maxTokens) {
          const mergedChunk = this.mergeChunks(chunk, nextChunk, optimized.length);
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
    console.log(`Total tokens processed: ${optimized.reduce((sum, chunk) => sum + chunk.size, 0).toLocaleString()}`);
    console.log(`Total characters processed: ${optimized.reduce((sum, chunk) => sum + this.calculateMessageChars(chunk.messages), 0).toLocaleString()}`);
    
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
      if (chunk.size > this.maxTokens) {
        validation.errors.push(`Chunk ${index} exceeds maximum size: ${chunk.size} tokens`);
        validation.valid = false;
      }

      if (chunk.size < this.minTokens) {
        validation.warnings.push(`Chunk ${index} is below minimum size: ${chunk.size} tokens`);
      }

      // Check message count
      if (chunk.messageCount === 0) {
        validation.errors.push(`Chunk ${index} has no messages`);
        validation.valid = false;
      }

      // Size distribution
      if (chunk.size < this.minTokens * 10) {
        validation.stats.sizeDistribution.small++;
      } else if (chunk.size < this.maxTokens * 0.5) {
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