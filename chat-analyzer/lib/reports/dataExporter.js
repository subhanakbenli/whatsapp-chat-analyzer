export class DataExporter {
  constructor() {
    this.supportedFormats = ['json', 'csv', 'xlsx'];
  }

  exportData(analysisData, format = 'json', options = {}) {
    switch (format.toLowerCase()) {
      case 'json':
        return this.exportJSON(analysisData, options);
      case 'csv':
        return this.exportCSV(analysisData, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  exportJSON(analysisData, options = {}) {
    const { includeRawData = false, prettify = true } = options;
    
    let dataToExport = { ...analysisData };
    
    // Remove raw data if not requested
    if (!includeRawData && dataToExport.originalData) {
      delete dataToExport.originalData;
    }
    
    // Remove large processing info if not needed
    if (dataToExport.processingInfo && !options.includeProcessingInfo) {
      delete dataToExport.processingInfo;
    }
    
    const jsonString = prettify 
      ? JSON.stringify(dataToExport, null, 2)
      : JSON.stringify(dataToExport);
    
    return new Blob([jsonString], { type: 'application/json' });
  }

  exportCSV(analysisData, options = {}) {
    const { includeParticipants = true, includeTopics = true, includeSentiment = true } = options;
    
    let csvContent = '';
    
    // Export participants data
    if (includeParticipants && analysisData.participants) {
      csvContent += this.generateParticipantsCSV(analysisData.participants);
      csvContent += '\n\n';
    }
    
    // Export topics data
    if (includeTopics && analysisData.topics) {
      csvContent += this.generateTopicsCSV(analysisData.topics);
      csvContent += '\n\n';
    }
    
    // Export sentiment data
    if (includeSentiment && analysisData.sentiment) {
      csvContent += this.generateSentimentCSV(analysisData.sentiment);
      csvContent += '\n\n';
    }
    
    // Export summary statistics
    if (analysisData.statistics) {
      csvContent += this.generateStatisticsCSV(analysisData.statistics);
    }
    
    return new Blob([csvContent], { type: 'text/csv' });
  }

  generateParticipantsCSV(participants) {
    const headers = [
      'Participant',
      'Message Count',
      'Word Count',
      'Avg Message Length',
      'Sentiment',
      'Communication Style',
      'Engagement Level'
    ];
    
    let csv = '# Participants Data\n';
    csv += headers.join(',') + '\n';
    
    Object.entries(participants).forEach(([name, data]) => {
      const row = [
        this.escapeCSVField(name),
        data.messageCount || 0,
        data.wordCount || 0,
        data.avgMessageLength || 0,
        this.escapeCSVField(data.sentiment || 'neutral'),
        this.escapeCSVField(data.communicationStyle || 'unknown'),
        this.escapeCSVField(data.engagementLevel || 'medium')
      ];
      csv += row.join(',') + '\n';
    });
    
    return csv;
  }

  generateTopicsCSV(topics) {
    const headers = [
      'Topic',
      'Frequency',
      'Sentiment',
      'Keywords'
    ];
    
    let csv = '# Topics Data\n';
    csv += headers.join(',') + '\n';
    
    topics.forEach(topic => {
      const row = [
        this.escapeCSVField(topic.name || 'Unknown'),
        topic.frequency || 0,
        this.escapeCSVField(topic.sentiment || 'neutral'),
        this.escapeCSVField(topic.keywords ? topic.keywords.join('; ') : '')
      ];
      csv += row.join(',') + '\n';
    });
    
    return csv;
  }

  generateSentimentCSV(sentiment) {
    let csv = '# Sentiment Analysis Data\n';
    csv += 'Metric,Value\n';
    csv += `Overall Sentiment,${this.escapeCSVField(sentiment.overall || 'neutral')}\n`;
    csv += `Sentiment Score,${sentiment.score || 0.5}\n`;
    csv += `Confidence,${sentiment.confidence || 0}\n`;
    
    if (sentiment.distribution) {
      csv += `Positive Messages,${sentiment.distribution.positive || 0}\n`;
      csv += `Neutral Messages,${sentiment.distribution.neutral || 0}\n`;
      csv += `Negative Messages,${sentiment.distribution.negative || 0}\n`;
    }
    
    // Individual participant sentiments
    if (sentiment.participantSentiments) {
      csv += '\n# Participant Sentiments\n';
      csv += 'Participant,Sentiment\n';
      Object.entries(sentiment.participantSentiments).forEach(([name, sentimentValue]) => {
        csv += `${this.escapeCSVField(name)},${this.escapeCSVField(sentimentValue)}\n`;
      });
    }
    
    return csv;
  }

  generateStatisticsCSV(statistics) {
    let csv = '# General Statistics\n';
    csv += 'Metric,Value\n';
    csv += `Total Messages,${statistics.totalMessages || 0}\n`;
    csv += `Total Words,${statistics.totalWords || 0}\n`;
    csv += `Average Message Length,${statistics.averageMessageLength || 0}\n`;
    csv += `Media Messages,${statistics.mediaMessages || 0}\n`;
    csv += `Total Chunks,${statistics.totalChunks || 0}\n`;
    csv += `Processing Time,${statistics.processingTime || 0}\n`;
    csv += `Timespan,${this.escapeCSVField(statistics.timespan || 'N/A')}\n`;
    
    if (statistics.mostActiveParticipant) {
      csv += `Most Active Participant,${this.escapeCSVField(statistics.mostActiveParticipant)}\n`;
    }
    
    return csv;
  }

  escapeCSVField(field) {
    if (field === null || field === undefined) {
      return '';
    }
    
    const stringField = String(field);
    
    // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
    if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
      return `"${stringField.replace(/"/g, '""')}"`;
    }
    
    return stringField;
  }

  exportMessagesCSV(messages, options = {}) {
    const { includeContent = true, dateFormat = 'iso' } = options;
    
    const headers = [
      'Timestamp',
      'Sender',
      'Type',
      ...(includeContent ? ['Content'] : []),
      'Word Count',
      'Character Count'
    ];
    
    let csv = '# Messages Data\n';
    csv += headers.join(',') + '\n';
    
    messages.forEach(message => {
      const timestamp = dateFormat === 'iso' 
        ? new Date(message.timestamp).toISOString()
        : new Date(message.timestamp).toLocaleString();
      
      const row = [
        this.escapeCSVField(timestamp),
        this.escapeCSVField(message.sender || 'Unknown'),
        this.escapeCSVField(message.type || 'message'),
        ...(includeContent ? [this.escapeCSVField(message.content || '')] : []),
        this.countWords(message.content || ''),
        (message.content || '').length
      ];
      
      csv += row.join(',') + '\n';
    });
    
    return new Blob([csv], { type: 'text/csv' });
  }

  exportActivityCSV(messages, options = {}) {
    const { groupBy = 'hour' } = options; // 'hour', 'day', 'month'
    
    const activityData = this.aggregateActivityData(messages, groupBy);
    
    let csv = `# Activity Data (grouped by ${groupBy})\n`;
    csv += 'Period,Message Count,Unique Participants\n';
    
    Object.entries(activityData).forEach(([period, data]) => {
      csv += `${this.escapeCSVField(period)},${data.messageCount},${data.uniqueParticipants}\n`;
    });
    
    return new Blob([csv], { type: 'text/csv' });
  }

  aggregateActivityData(messages, groupBy) {
    const data = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp);
      let key;
      
      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!data[key]) {
        data[key] = {
          messageCount: 0,
          participants: new Set()
        };
      }
      
      data[key].messageCount++;
      data[key].participants.add(message.sender);
    });
    
    // Convert sets to counts
    Object.keys(data).forEach(key => {
      data[key].uniqueParticipants = data[key].participants.size;
      delete data[key].participants;
    });
    
    return data;
  }

  countWords(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  generateFilteredExport(analysisData, filters = {}) {
    const {
      participants = [],
      dateRange = null,
      topics = [],
      sentiment = null,
      format = 'json'
    } = filters;
    
    let filteredData = { ...analysisData };
    
    // Filter participants
    if (participants.length > 0 && filteredData.participants) {
      filteredData.participants = Object.fromEntries(
        Object.entries(filteredData.participants).filter(([name]) => participants.includes(name))
      );
    }
    
    // Filter topics
    if (topics.length > 0 && filteredData.topics) {
      filteredData.topics = filteredData.topics.filter(topic => 
        topics.some(filterTopic => topic.name.toLowerCase().includes(filterTopic.toLowerCase()))
      );
    }
    
    // Filter by sentiment
    if (sentiment && filteredData.participants) {
      filteredData.participants = Object.fromEntries(
        Object.entries(filteredData.participants).filter(([, data]) => 
          data.sentiment === sentiment
        )
      );
    }
    
    // Filter messages by date range if raw data is included
    if (dateRange && filteredData.originalData && filteredData.originalData.messages) {
      const { start, end } = dateRange;
      filteredData.originalData.messages = filteredData.originalData.messages.filter(message => {
        const messageDate = new Date(message.timestamp);
        return (!start || messageDate >= start) && (!end || messageDate <= end);
      });
    }
    
    return this.exportData(filteredData, format);
  }
}

export default DataExporter;