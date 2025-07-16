export const ANALYSIS_PROMPT = `
You are an expert WhatsApp chat analyzer. Analyze the provided chat messages and return a comprehensive JSON analysis.

Your analysis should include:

1. **Sentiment Analysis**:
   - Overall conversation sentiment (positive, negative, neutral)
   - Sentiment trends over time
   - Individual participant sentiment patterns
   - Emotional tone indicators

2. **Communication Patterns**:
   - Response time patterns
   - Message frequency analysis
   - Active hours and days
   - Conversation starters and enders

3. **Content Analysis**:
   - Main topics discussed
   - Keywords and phrases frequency
   - Language patterns and style
   - Emoji usage and meaning

4. **Participant Analysis**:
   - Individual communication styles
   - Engagement levels
   - Relationship dynamics
   - Behavioral patterns

5. **Conversation Insights**:
   - Important events or milestones
   - Recurring themes
   - Conversation flow analysis
   - Group dynamics (if applicable)

6. **Statistics**:
   - Message count per participant
   - Word count and average message length
   - Media sharing patterns
   - Time-based activity patterns

Return your analysis in this JSON format:
{
  "sentiment": {
    "overall": "positive|negative|neutral",
    "score": 0.0-1.0,
    "trends": [],
    "participantSentiments": {}
  },
  "topics": [
    {
      "name": "topic name",
      "frequency": number,
      "keywords": [],
      "sentiment": "positive|negative|neutral"
    }
  ],
  "patterns": {
    "responseTime": {
      "average": "time in minutes",
      "median": "time in minutes",
      "fastest": "participant name",
      "slowest": "participant name"
    },
    "activity": {
      "peakHours": [],
      "peakDays": [],
      "quietPeriods": []
    }
  },
  "participants": {
    "participantName": {
      "messageCount": number,
      "wordCount": number,
      "avgMessageLength": number,
      "sentiment": "positive|negative|neutral",
      "communicationStyle": "description",
      "topTopics": [],
      "engagementLevel": "high|medium|low"
    }
  },
  "insights": {
    "keyEvents": [],
    "relationshipDynamics": "description",
    "conversationStyle": "description",
    "noteworthy": []
  },
  "statistics": {
    "totalMessages": number,
    "totalWords": number,
    "averageMessageLength": number,
    "mediaMessages": number,
    "timespan": "duration description",
    "mostActiveParticipant": "name",
    "conversationStarters": {}
  }
}

Important guidelines:
- Be objective and analytical
- Focus on observable patterns, not personal judgments
- Respect privacy and maintain professionalism
- If content is unclear or ambiguous, note it in your analysis
- Provide specific examples where relevant
- Consider cultural and contextual factors
- Handle sensitive topics with appropriate discretion
`;

export const SUMMARY_PROMPT = `
Based on the analyzed chat chunks, create a comprehensive summary report.

Combine and synthesize the individual chunk analyses into a cohesive overview that includes:

1. **Executive Summary**: Brief overview of the conversation analysis
2. **Key Findings**: Most important insights and patterns
3. **Participant Profiles**: Detailed analysis of each participant
4. **Conversation Timeline**: Major events and trends over time
5. **Recommendations**: Insights for improving communication (if applicable)

Maintain consistency across chunks and resolve any conflicting information.
Return the summary in the same JSON format as individual analyses but with aggregated data.
`;

export const INSIGHT_PROMPT = `
Generate actionable insights and recommendations based on the chat analysis.

Focus on:
- Communication strengths and areas for improvement
- Relationship dynamics and patterns
- Conversation quality indicators
- Engagement optimization suggestions
- Interesting behavioral patterns

Provide practical, respectful, and constructive insights.
`;

export const TOPIC_EXTRACTION_PROMPT = `
Extract and categorize the main topics discussed in this conversation.

For each topic, provide:
- Topic name and description
- Frequency of discussion
- Key participants involved
- Related keywords and phrases
- Sentiment around the topic
- Time periods when discussed

Return as a structured JSON array of topics.
`;

export const SENTIMENT_ANALYSIS_PROMPT = `
Perform detailed sentiment analysis on the conversation.

Analyze:
- Overall emotional tone
- Sentiment changes over time
- Individual participant emotions
- Emotional triggers and responses
- Conflict resolution patterns
- Positive/negative interaction patterns

Return detailed sentiment metrics and trends.
`;

export const ENGAGEMENT_PROMPT = `
Analyze engagement patterns and communication effectiveness.

Examine:
- Response rates and timing
- Message initiation patterns
- Conversation flow quality
- Participation balance
- Engagement sustainability
- Communication efficiency

Provide engagement scores and improvement suggestions.
`;

export function getCustomPrompt(analysisType, customInstructions = '') {
  const basePrompts = {
    sentiment: SENTIMENT_ANALYSIS_PROMPT,
    topics: TOPIC_EXTRACTION_PROMPT,
    engagement: ENGAGEMENT_PROMPT,
    insights: INSIGHT_PROMPT,
    summary: SUMMARY_PROMPT,
    full: ANALYSIS_PROMPT
  };

  const basePrompt = basePrompts[analysisType] || basePrompts.full;
  
  if (customInstructions) {
    return `${basePrompt}\n\nAdditional Instructions:\n${customInstructions}`;
  }
  
  return basePrompt;
}

export function buildChunkPrompt(chunk, promptType = 'full') {
  const basePrompt = getCustomPrompt(promptType);
  
  return `${basePrompt}

Chunk Information:
- Chunk ID: ${chunk.id}
- Message Count: ${chunk.messageCount}
- Time Range: ${new Date(chunk.timeRange.start).toLocaleString()} to ${new Date(chunk.timeRange.end).toLocaleString()}
- Participants: ${chunk.participants.join(', ')}

Please analyze the following messages and provide your response in the requested JSON format.
`;
}

export default {
  ANALYSIS_PROMPT,
  SUMMARY_PROMPT,
  INSIGHT_PROMPT,
  TOPIC_EXTRACTION_PROMPT,
  SENTIMENT_ANALYSIS_PROMPT,
  ENGAGEMENT_PROMPT,
  getCustomPrompt,
  buildChunkPrompt
};