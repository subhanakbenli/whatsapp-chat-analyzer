import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-pro',
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
    
    this.rateLimitDelay = 1000; // 1 second between requests
    this.maxRetries = 3;
  }

  async analyzeChunk(chunk, prompt) {
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        // Add rate limiting
        if (attempt > 0) {
          await this.sleep(this.rateLimitDelay * attempt);
        }

        const fullPrompt = this.buildPrompt(chunk, prompt);
        const result = await this.model.generateContent(fullPrompt);
        const response = await result.response;
        
        return {
          chunkId: chunk.id,
          analysis: this.parseResponse(response.text()),
          metadata: {
            timestamp: new Date().toISOString(),
            messageCount: chunk.messageCount,
            chunkSize: chunk.size,
            attempt: attempt + 1
          }
        };
      } catch (error) {
        attempt++;
        console.error(`Gemini API error (attempt ${attempt}):`, error);
        
        if (attempt >= this.maxRetries) {
          throw new Error(`Failed to analyze chunk after ${this.maxRetries} attempts: ${error.message}`);
        }
        
        // Handle specific API errors
        if (error.message.includes('RATE_LIMIT')) {
          await this.sleep(this.rateLimitDelay * attempt * 2);
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
          throw new Error('API quota exceeded. Please check your billing and usage limits.');
        }
      }
    }
  }

  buildPrompt(chunk, basePrompt) {
    const contextInfo = `
Chunk Analysis Context:
- Chunk ID: ${chunk.id}
- Message Count: ${chunk.messageCount}
- Time Range: ${chunk.timeRange.start} to ${chunk.timeRange.end}
- Participants: ${chunk.participants.join(', ')}
- Size: ${chunk.size} bytes

Messages to analyze:
${chunk.messages.map(msg => `[${msg.timestamp}] ${msg.sender}: ${msg.content}`).join('\n')}
`;

    return `${basePrompt}\n\n${contextInfo}`;
  }

  parseResponse(responseText) {
    try {
      // Try to parse as JSON first
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If not JSON, return structured text analysis
      return {
        rawResponse: responseText,
        parsed: false,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        rawResponse: responseText,
        parsed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testConnection() {
    try {
      const result = await this.model.generateContent('Hello, please respond with "API connection successful"');
      const response = await result.response;
      return {
        success: true,
        response: response.text(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default GeminiClient;