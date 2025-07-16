export function analyzeParticipants(messages) {
  const participantStats = {};
  
  messages.forEach(message => {
    if (message.type === 'message' && message.sender !== 'System') {
      const sender = message.sender;
      
      if (!participantStats[sender]) {
        participantStats[sender] = {
          name: sender,
          messageCount: 0,
          wordCount: 0,
          characterCount: 0,
          firstMessage: message.timestamp,
          lastMessage: message.timestamp,
          averageMessageLength: 0,
          mediaCount: 0,
          hourlyActivity: new Array(24).fill(0),
          dailyActivity: {},
          sentiments: []
        };
      }

      const stats = participantStats[sender];
      stats.messageCount++;
      stats.characterCount += message.content.length;
      stats.wordCount += countWords(message.content);
      
      // Update timestamps
      if (message.timestamp < stats.firstMessage) {
        stats.firstMessage = message.timestamp;
      }
      if (message.timestamp > stats.lastMessage) {
        stats.lastMessage = message.timestamp;
      }
      
      // Track media messages
      if (message.content.includes('[Media]')) {
        stats.mediaCount++;
      }
      
      // Track hourly activity
      const hour = message.timestamp.getHours();
      stats.hourlyActivity[hour]++;
      
      // Track daily activity
      const date = message.timestamp.toDateString();
      stats.dailyActivity[date] = (stats.dailyActivity[date] || 0) + 1;
    }
  });

  // Calculate averages and additional stats
  return Object.values(participantStats).map(participant => {
    participant.averageMessageLength = participant.messageCount > 0 
      ? Math.round(participant.characterCount / participant.messageCount)
      : 0;
    
    participant.averageWordsPerMessage = participant.messageCount > 0
      ? Math.round(participant.wordCount / participant.messageCount)
      : 0;
    
    participant.activeDays = Object.keys(participant.dailyActivity).length;
    participant.mostActiveHour = findMostActiveHour(participant.hourlyActivity);
    participant.mostActiveDay = findMostActiveDay(participant.dailyActivity);
    
    return participant;
  }).sort((a, b) => b.messageCount - a.messageCount);
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function findMostActiveHour(hourlyActivity) {
  const maxIndex = hourlyActivity.indexOf(Math.max(...hourlyActivity));
  return maxIndex;
}

function findMostActiveDay(dailyActivity) {
  const entries = Object.entries(dailyActivity);
  if (entries.length === 0) return null;
  
  return entries.reduce((a, b) => a[1] > b[1] ? a : b)[0];
}

export function calculateEngagementMetrics(participants) {
  const totalMessages = participants.reduce((sum, p) => sum + p.messageCount, 0);
  
  return participants.map(participant => ({
    ...participant,
    engagementScore: calculateEngagementScore(participant, totalMessages),
    responsePattern: analyzeResponsePattern(participant),
    conversationStarter: analyzeConversationStarter(participant)
  }));
}

function calculateEngagementScore(participant, totalMessages) {
  const messageRatio = participant.messageCount / totalMessages;
  const consistencyScore = participant.activeDays / 365; // Assuming yearly data
  const lengthScore = Math.min(participant.averageMessageLength / 100, 1); // Normalize to 100 chars
  
  return Math.round((messageRatio * 0.4 + consistencyScore * 0.3 + lengthScore * 0.3) * 100);
}

function analyzeResponsePattern(participant) {
  // This would analyze response times and patterns
  // For now, return a simple metric based on message frequency
  const avgDailyMessages = participant.messageCount / participant.activeDays;
  
  if (avgDailyMessages > 50) return 'very_active';
  if (avgDailyMessages > 20) return 'active';
  if (avgDailyMessages > 5) return 'moderate';
  return 'low';
}

function analyzeConversationStarter(participant) {
  // This would analyze who starts conversations
  // For now, return a simple score
  return participant.messageCount > 100 ? 'high' : 'low';
}