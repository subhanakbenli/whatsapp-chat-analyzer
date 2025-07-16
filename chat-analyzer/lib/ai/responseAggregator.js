export class ResponseAggregator {
  constructor() {
    this.chunkAnalyses = [];
  }

  addChunkAnalysis(analysis) {
    this.chunkAnalyses.push(analysis);
  }

  aggregateAnalyses() {
    if (this.chunkAnalyses.length === 0) {
      throw new Error('No analyses to aggregate');
    }

    const aggregated = {
      summary: this.createSummary(),
      sentiment: this.aggregateSentiment(),
      topics: this.aggregateTopics(),
      patterns: this.aggregatePatterns(),
      participants: this.aggregateParticipants(),
      insights: this.aggregateInsights(),
      statistics: this.aggregateStatistics(),
      metadata: this.createMetadata()
    };

    return aggregated;
  }

  createSummary() {
    const totalMessages = this.chunkAnalyses.reduce((sum, analysis) => 
      sum + (analysis.metadata?.messageCount || 0), 0
    );

    const timeRange = this.calculateTimeRange();
    const participantCount = this.getUniqueParticipants().length;

    return {
      overview: `Analysis of ${totalMessages} messages across ${this.chunkAnalyses.length} conversation chunks`,
      timeRange,
      participantCount,
      totalChunks: this.chunkAnalyses.length,
      analysisDate: new Date().toISOString()
    };
  }

  aggregateSentiment() {
    const sentiments = this.chunkAnalyses
      .map(analysis => analysis.analysis?.sentiment)
      .filter(Boolean);

    if (sentiments.length === 0) {
      return {
        overall: 'neutral',
        score: 0.5,
        confidence: 0,
        trends: [],
        distribution: { positive: 0, negative: 0, neutral: 0 }
      };
    }

    // Calculate weighted average sentiment
    const totalWeight = sentiments.reduce((sum, s) => sum + (s.score || 0.5), 0);
    const avgScore = totalWeight / sentiments.length;

    // Determine overall sentiment
    let overall = 'neutral';
    if (avgScore > 0.6) overall = 'positive';
    else if (avgScore < 0.4) overall = 'negative';

    // Calculate distribution
    const distribution = sentiments.reduce((dist, s) => {
      const sentiment = s.overall || 'neutral';
      dist[sentiment] = (dist[sentiment] || 0) + 1;
      return dist;
    }, { positive: 0, negative: 0, neutral: 0 });

    return {
      overall,
      score: avgScore,
      confidence: this.calculateConfidence(sentiments),
      trends: this.aggregateTrends(sentiments),
      distribution,
      participantSentiments: this.aggregateParticipantSentiments(sentiments)
    };
  }

  aggregateTopics() {
    const allTopics = this.chunkAnalyses
      .flatMap(analysis => analysis.analysis?.topics || []);

    const topicMap = new Map();

    // Merge similar topics
    allTopics.forEach(topic => {
      const key = topic.name?.toLowerCase() || 'unknown';
      if (topicMap.has(key)) {
        const existing = topicMap.get(key);
        existing.frequency += topic.frequency || 1;
        existing.keywords = [...new Set([...existing.keywords, ...(topic.keywords || [])])];
      } else {
        topicMap.set(key, {
          name: topic.name || 'Unknown Topic',
          frequency: topic.frequency || 1,
          keywords: topic.keywords || [],
          sentiment: topic.sentiment || 'neutral'
        });
      }
    });

    return Array.from(topicMap.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20); // Top 20 topics
  }

  aggregatePatterns() {
    const patterns = this.chunkAnalyses
      .map(analysis => analysis.analysis?.patterns)
      .filter(Boolean);

    if (patterns.length === 0) {
      return {
        responseTime: { average: 0, median: 0 },
        activity: { peakHours: [], peakDays: [] }
      };
    }

    // Aggregate response times
    const responseTimes = patterns
      .map(p => p.responseTime)
      .filter(Boolean);

    const avgResponseTime = responseTimes.reduce((sum, rt) => 
      sum + (parseFloat(rt.average) || 0), 0) / responseTimes.length;

    // Aggregate activity patterns
    const allPeakHours = patterns.flatMap(p => p.activity?.peakHours || []);
    const allPeakDays = patterns.flatMap(p => p.activity?.peakDays || []);

    const peakHourCounts = this.countOccurrences(allPeakHours);
    const peakDayCounts = this.countOccurrences(allPeakDays);

    return {
      responseTime: {
        average: avgResponseTime,
        median: this.calculateMedian(responseTimes.map(rt => parseFloat(rt.average) || 0))
      },
      activity: {
        peakHours: Object.entries(peakHourCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([hour, count]) => ({ hour, frequency: count })),
        peakDays: Object.entries(peakDayCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 7)
          .map(([day, count]) => ({ day, frequency: count }))
      }
    };
  }

  aggregateParticipants() {
    const allParticipants = this.chunkAnalyses
      .flatMap(analysis => Object.entries(analysis.analysis?.participants || {}));

    const participantMap = new Map();

    allParticipants.forEach(([name, data]) => {
      if (participantMap.has(name)) {
        const existing = participantMap.get(name);
        existing.messageCount += data.messageCount || 0;
        existing.wordCount += data.wordCount || 0;
        existing.topTopics = [...new Set([...existing.topTopics, ...(data.topTopics || [])])];
      } else {
        participantMap.set(name, {
          name,
          messageCount: data.messageCount || 0,
          wordCount: data.wordCount || 0,
          avgMessageLength: data.avgMessageLength || 0,
          sentiment: data.sentiment || 'neutral',
          communicationStyle: data.communicationStyle || 'unknown',
          topTopics: data.topTopics || [],
          engagementLevel: data.engagementLevel || 'medium'
        });
      }
    });

    // Recalculate averages
    participantMap.forEach(participant => {
      if (participant.messageCount > 0) {
        participant.avgMessageLength = Math.round(participant.wordCount / participant.messageCount);
      }
    });

    return Object.fromEntries(participantMap);
  }

  aggregateInsights() {
    const insights = this.chunkAnalyses
      .map(analysis => analysis.analysis?.insights)
      .filter(Boolean);

    const keyEvents = insights.flatMap(i => i.keyEvents || []);
    const noteworthy = insights.flatMap(i => i.noteworthy || []);

    return {
      keyEvents: [...new Set(keyEvents)],
      relationshipDynamics: this.synthesizeRelationshipDynamics(insights),
      conversationStyle: this.synthesizeConversationStyle(insights),
      noteworthy: [...new Set(noteworthy)]
    };
  }

  aggregateStatistics() {
    const totalMessages = this.chunkAnalyses.reduce((sum, analysis) => 
      sum + (analysis.metadata?.messageCount || 0), 0
    );

    const totalWords = this.chunkAnalyses.reduce((sum, analysis) => 
      sum + (analysis.analysis?.statistics?.totalWords || 0), 0
    );

    const mediaMessages = this.chunkAnalyses.reduce((sum, analysis) => 
      sum + (analysis.analysis?.statistics?.mediaMessages || 0), 0
    );

    return {
      totalMessages,
      totalWords,
      averageMessageLength: totalMessages > 0 ? Math.round(totalWords / totalMessages) : 0,
      mediaMessages,
      totalChunks: this.chunkAnalyses.length,
      processingTime: this.calculateProcessingTime(),
      timespan: this.calculateTimespan()
    };
  }

  createMetadata() {
    return {
      analysisId: this.generateAnalysisId(),
      timestamp: new Date().toISOString(),
      chunksAnalyzed: this.chunkAnalyses.length,
      totalProcessingTime: this.calculateProcessingTime(),
      version: '1.0.0',
      method: 'gemini-2.5-pro-chunked-analysis'
    };
  }

  // Helper methods
  calculateTimeRange() {
    const timestamps = this.chunkAnalyses.map(analysis => analysis.metadata?.timestamp).filter(Boolean);
    if (timestamps.length === 0) return null;

    return {
      start: Math.min(...timestamps.map(t => new Date(t).getTime())),
      end: Math.max(...timestamps.map(t => new Date(t).getTime()))
    };
  }

  getUniqueParticipants() {
    const participants = new Set();
    this.chunkAnalyses.forEach(analysis => {
      Object.keys(analysis.analysis?.participants || {}).forEach(name => {
        participants.add(name);
      });
    });
    return Array.from(participants);
  }

  calculateConfidence(sentiments) {
    const scores = sentiments.map(s => s.score || 0.5);
    const variance = this.calculateVariance(scores);
    return Math.max(0, 1 - variance);
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squareDiffs.reduce((sum, sq) => sum + sq, 0) / numbers.length;
  }

  calculateMedian(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  countOccurrences(array) {
    return array.reduce((counts, item) => {
      counts[item] = (counts[item] || 0) + 1;
      return counts;
    }, {});
  }

  synthesizeRelationshipDynamics(insights) {
    const dynamics = insights.map(i => i.relationshipDynamics).filter(Boolean);
    return dynamics.length > 0 ? dynamics[0] : 'Unable to determine relationship dynamics';
  }

  synthesizeConversationStyle(insights) {
    const styles = insights.map(i => i.conversationStyle).filter(Boolean);
    return styles.length > 0 ? styles[0] : 'Unable to determine conversation style';
  }

  aggregateTrends(sentiments) {
    return sentiments.flatMap(s => s.trends || []).slice(0, 10);
  }

  aggregateParticipantSentiments(sentiments) {
    const participantSentiments = {};
    sentiments.forEach(s => {
      Object.entries(s.participantSentiments || {}).forEach(([name, sentiment]) => {
        participantSentiments[name] = sentiment;
      });
    });
    return participantSentiments;
  }

  calculateProcessingTime() {
    const timestamps = this.chunkAnalyses.map(a => new Date(a.metadata?.timestamp)).filter(Boolean);
    if (timestamps.length < 2) return 0;
    
    const start = Math.min(...timestamps.map(t => t.getTime()));
    const end = Math.max(...timestamps.map(t => t.getTime()));
    return end - start;
  }

  calculateTimespan() {
    const processingTime = this.calculateProcessingTime();
    const minutes = Math.floor(processingTime / 60000);
    const seconds = Math.floor((processingTime % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  generateAnalysisId() {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default ResponseAggregator;