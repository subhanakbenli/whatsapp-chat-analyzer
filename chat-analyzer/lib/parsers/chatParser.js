import { extractMessages } from './messageExtractor.js';
import { analyzeParticipants } from './participantAnalyzer.js';

export class ChatParser {
  constructor() {
    this.supportedFormats = [
      'android_default',
      'ios_default',
      'android_24h',
      'ios_24h',
      'android_custom',
      'ios_custom'
    ];
  }

  async parse(chatContent, fileName) {
    try {
      // Detect format and extract messages
      const messages = await extractMessages(chatContent);
      
      if (!messages || messages.length === 0) {
        throw new Error('No messages found in chat export');
      }

      // Analyze participants
      const participants = analyzeParticipants(messages);

      // Extract metadata
      const metadata = this.extractMetadata(messages, fileName);

      return {
        messages,
        participants,
        metadata,
        stats: {
          totalMessages: messages.length,
          totalParticipants: participants.length,
          dateRange: {
            start: messages[0]?.timestamp,
            end: messages[messages.length - 1]?.timestamp
          }
        }
      };
    } catch (error) {
      console.error('Chat parsing error:', error);
      throw new Error(`Failed to parse chat: ${error.message}`);
    }
  }

  extractMetadata(messages, fileName) {
    return {
      fileName,
      parseDate: new Date().toISOString(),
      messageCount: messages.length,
      firstMessage: messages[0]?.timestamp,
      lastMessage: messages[messages.length - 1]?.timestamp,
      estimatedSize: JSON.stringify(messages).length
    };
  }

  validateChatFormat(content) {
    const commonPatterns = [
      /\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\s*-\s*.+/i,
      /\[\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]\s*.+/i,
      /\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*-\s*.+/i
    ];

    return commonPatterns.some(pattern => pattern.test(content));
  }
}

export default new ChatParser();