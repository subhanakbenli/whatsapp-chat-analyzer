export class DataValidator {
  constructor() {
    this.validationRules = {
      message: {
        required: ['timestamp', 'sender', 'content'],
        types: {
          timestamp: 'object', // Date object
          sender: 'string',
          content: 'string',
          type: 'string'
        }
      },
      participant: {
        required: ['name', 'messageCount'],
        types: {
          name: 'string',
          messageCount: 'number'
        }
      },
      chunk: {
        required: ['id', 'messages', 'messageCount', 'size'],
        types: {
          id: 'string',
          messages: 'object', // Array
          messageCount: 'number',
          size: 'number'
        }
      }
    };
  }

  validateChatData(data) {
    const validation = {
      valid: true,
      errors: [],
      warnings: [],
      stats: {
        messagesValidated: 0,
        participantsValidated: 0,
        chunksValidated: 0
      }
    };

    try {
      // Validate basic structure
      if (!data || typeof data !== 'object') {
        validation.errors.push('Invalid data structure');
        validation.valid = false;
        return validation;
      }

      // Validate messages
      if (data.messages) {
        const messageValidation = this.validateMessages(data.messages);
        this.mergeValidationResults(validation, messageValidation);
        validation.stats.messagesValidated = data.messages.length;
      }

      // Validate participants
      if (data.participants) {
        const participantValidation = this.validateParticipants(data.participants);
        this.mergeValidationResults(validation, participantValidation);
        validation.stats.participantsValidated = data.participants.length;
      }

      // Validate metadata
      if (data.metadata) {
        const metadataValidation = this.validateMetadata(data.metadata);
        this.mergeValidationResults(validation, metadataValidation);
      }

      // Cross-validation checks
      this.performCrossValidation(data, validation);

    } catch (error) {
      validation.errors.push(`Validation error: ${error.message}`);
      validation.valid = false;
    }

    return validation;
  }

  validateMessages(messages) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!Array.isArray(messages)) {
      validation.errors.push('Messages must be an array');
      validation.valid = false;
      return validation;
    }

    messages.forEach((message, index) => {
      const messageValidation = this.validateObject(message, this.validationRules.message);
      if (!messageValidation.valid) {
        validation.errors.push(`Message ${index}: ${messageValidation.errors.join(', ')}`);
        validation.valid = false;
      }

      // Additional message-specific validations
      if (message.timestamp && !(message.timestamp instanceof Date)) {
        validation.errors.push(`Message ${index}: Invalid timestamp format`);
        validation.valid = false;
      }

      if (message.content && typeof message.content !== 'string') {
        validation.errors.push(`Message ${index}: Content must be a string`);
        validation.valid = false;
      }

      if (message.content && message.content.length > 10000) {
        validation.warnings.push(`Message ${index}: Very long content (${message.content.length} characters)`);
      }
    });

    return validation;
  }

  validateParticipants(participants) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!Array.isArray(participants)) {
      validation.errors.push('Participants must be an array');
      validation.valid = false;
      return validation;
    }

    const names = new Set();
    participants.forEach((participant, index) => {
      const participantValidation = this.validateObject(participant, this.validationRules.participant);
      if (!participantValidation.valid) {
        validation.errors.push(`Participant ${index}: ${participantValidation.errors.join(', ')}`);
        validation.valid = false;
      }

      // Check for duplicate names
      if (names.has(participant.name)) {
        validation.errors.push(`Duplicate participant name: ${participant.name}`);
        validation.valid = false;
      }
      names.add(participant.name);

      // Additional participant-specific validations
      if (participant.messageCount < 0) {
        validation.errors.push(`Participant ${participant.name}: Negative message count`);
        validation.valid = false;
      }
    });

    return validation;
  }

  validateMetadata(metadata) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!metadata || typeof metadata !== 'object') {
      validation.errors.push('Metadata must be an object');
      validation.valid = false;
      return validation;
    }

    // Check required metadata fields
    const requiredFields = ['fileName', 'messageCount'];
    requiredFields.forEach(field => {
      if (!metadata.hasOwnProperty(field)) {
        validation.errors.push(`Missing required metadata field: ${field}`);
        validation.valid = false;
      }
    });

    // Validate specific metadata fields
    if (metadata.messageCount !== undefined && typeof metadata.messageCount !== 'number') {
      validation.errors.push('Metadata messageCount must be a number');
      validation.valid = false;
    }

    if (metadata.fileName && typeof metadata.fileName !== 'string') {
      validation.errors.push('Metadata fileName must be a string');
      validation.valid = false;
    }

    return validation;
  }

  validateChunks(chunks) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };

    if (!Array.isArray(chunks)) {
      validation.errors.push('Chunks must be an array');
      validation.valid = false;
      return validation;
    }

    chunks.forEach((chunk, index) => {
      const chunkValidation = this.validateObject(chunk, this.validationRules.chunk);
      if (!chunkValidation.valid) {
        validation.errors.push(`Chunk ${index}: ${chunkValidation.errors.join(', ')}`);
        validation.valid = false;
      }

      // Additional chunk-specific validations
      if (chunk.messages && !Array.isArray(chunk.messages)) {
        validation.errors.push(`Chunk ${index}: Messages must be an array`);
        validation.valid = false;
      }

      if (chunk.messageCount !== chunk.messages?.length) {
        validation.errors.push(`Chunk ${index}: Message count mismatch`);
        validation.valid = false;
      }

      if (chunk.size <= 0) {
        validation.errors.push(`Chunk ${index}: Invalid size`);
        validation.valid = false;
      }
    });

    return validation;
  }

  validateObject(obj, rules) {
    const validation = {
      valid: true,
      errors: []
    };

    // Check required fields
    if (rules.required) {
      rules.required.forEach(field => {
        if (!obj.hasOwnProperty(field)) {
          validation.errors.push(`Missing required field: ${field}`);
          validation.valid = false;
        }
      });
    }

    // Check field types
    if (rules.types) {
      Object.entries(rules.types).forEach(([field, expectedType]) => {
        if (obj.hasOwnProperty(field)) {
          const actualType = Array.isArray(obj[field]) ? 'array' : typeof obj[field];
          if (expectedType === 'object' && actualType !== 'object' && actualType !== 'array') {
            validation.errors.push(`Field ${field} must be an object or array`);
            validation.valid = false;
          } else if (expectedType !== 'object' && actualType !== expectedType) {
            validation.errors.push(`Field ${field} must be of type ${expectedType}, got ${actualType}`);
            validation.valid = false;
          }
        }
      });
    }

    return validation;
  }

  performCrossValidation(data, validation) {
    // Validate consistency between messages and participants
    if (data.messages && data.participants) {
      const messageParticipants = new Set(
        data.messages
          .filter(msg => msg.type === 'message')
          .map(msg => msg.sender)
      );
      
      const participantNames = new Set(data.participants.map(p => p.name));

      // Check if all message senders are in participants
      messageParticipants.forEach(sender => {
        if (!participantNames.has(sender)) {
          validation.warnings.push(`Message sender "${sender}" not found in participants`);
        }
      });

      // Check if all participants have messages
      participantNames.forEach(name => {
        if (!messageParticipants.has(name)) {
          validation.warnings.push(`Participant "${name}" has no messages`);
        }
      });
    }

    // Validate message count consistency
    if (data.metadata && data.messages) {
      if (data.metadata.messageCount !== data.messages.length) {
        validation.errors.push('Metadata message count does not match actual message count');
        validation.valid = false;
      }
    }

    // Validate participant message counts
    if (data.messages && data.participants) {
      data.participants.forEach(participant => {
        const actualCount = data.messages.filter(msg => 
          msg.type === 'message' && msg.sender === participant.name
        ).length;
        
        if (participant.messageCount !== actualCount) {
          validation.errors.push(`Participant "${participant.name}" message count mismatch: expected ${participant.messageCount}, got ${actualCount}`);
          validation.valid = false;
        }
      });
    }
  }

  mergeValidationResults(target, source) {
    if (!source.valid) {
      target.valid = false;
    }
    target.errors.push(...source.errors);
    target.warnings.push(...source.warnings);
  }

  sanitizeData(data) {
    try {
      const sanitized = JSON.parse(JSON.stringify(data));
      
      // Remove potentially harmful content
      if (sanitized.messages) {
        sanitized.messages = sanitized.messages.map(message => ({
          ...message,
          content: this.sanitizeString(message.content)
        }));
      }

      return sanitized;
    } catch (error) {
      throw new Error(`Data sanitization failed: ${error.message}`);
    }
  }

  sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    // Remove potential script tags and harmful content
    return str
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }
}

export default new DataValidator();