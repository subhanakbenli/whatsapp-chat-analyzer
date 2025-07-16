import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiClient {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 2.0 Flash-Lite - faster and more stable
    this.modelName = 'gemini-2.0-flash-lite';
    this.model = this.genAI.getGenerativeModel({ 
      model: this.modelName,
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
    
    this.rateLimitDelay = 2000; // 2 seconds between requests
    this.maxRetries = 5; // More retries for overload scenarios
  }

  async analyzeChunk(chunk, prompt) {
    console.log(`Starting AI analysis for chunk ${chunk.id}...`);
    
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        // Add rate limiting
        if (attempt > 0) {
          console.log(`Retrying chunk ${chunk.id}, attempt ${attempt + 1}/${this.maxRetries}`);
          await this.sleep(this.rateLimitDelay * attempt);
        }

        const fullPrompt = this.buildPrompt(chunk, prompt);
        console.log(`Sending prompt to Gemini ${this.modelName} for chunk ${chunk.id} (${fullPrompt.length} characters)`);
        
        const result = await this.model.generateContent(fullPrompt);
        const response = await result.response;
        
        console.log(`AI analysis completed for chunk ${chunk.id} using ${this.modelName}`);
        
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
        console.error(`Gemini API error for chunk ${chunk.id} (attempt ${attempt}/${this.maxRetries}):`, error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          status: error.status,
          stack: error.stack?.substring(0, 200)
        });
        
        if (attempt >= this.maxRetries) {
          const detailedError = `Failed to analyze chunk ${chunk.id} after ${this.maxRetries} attempts. Last error: ${error.message}`;
          console.error(detailedError);
          throw new Error(detailedError);
        }
        
        // Handle specific API errors
        if (error.message.includes('RATE_LIMIT') || error.message.includes('rate limit')) {
          console.log(`Rate limit hit for chunk ${chunk.id}, waiting ${this.rateLimitDelay * attempt * 2}ms`);
          await this.sleep(this.rateLimitDelay * attempt * 2);
        } else if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please check your billing and usage limits.');
        } else if (error.message.includes('API_KEY') || error.message.includes('authentication')) {
          throw new Error('Invalid API key. Please check your Gemini API configuration.');
        } else if (error.message.includes('overloaded') || error.message.includes('Service Unavailable') || error.status === 503) {
          const waitTime = this.rateLimitDelay * attempt * 3; // Longer wait for overload
          console.log(`Gemini API overloaded for chunk ${chunk.id}, waiting ${waitTime}ms before retry`);
          await this.sleep(waitTime);
        } else if (error.message.includes('Internal Server Error') || error.status === 500) {
          const waitTime = this.rateLimitDelay * attempt * 2;
          console.log(`Gemini API internal error for chunk ${chunk.id}, waiting ${waitTime}ms before retry`);
          await this.sleep(waitTime);
        } else {
          console.log(`Generic error for chunk ${chunk.id}, waiting ${this.rateLimitDelay * attempt}ms before retry`);
          await this.sleep(this.rateLimitDelay * attempt);
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
      console.log(`Testing connection with model: ${this.modelName}`);
      const result = await this.model.generateContent('Hello, please respond with "API connection successful"');
      const response = await result.response;
      return {
        success: true,
        response: response.text(),
        model: this.modelName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Test connection failed:', error);
      return {
        success: false,
        error: error.message,
        model: this.modelName,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default GeminiClient;