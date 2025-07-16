export function extractMessages(chatContent) {
  const lines = chatContent.split('\n').filter(line => line.trim());
  const messages = [];
  let currentMessage = null;

  // WhatsApp export patterns for different formats
  const patterns = {
    // Android: 12/31/2023, 11:59 PM - John: Hello
    android_default: /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\s*-\s*([^:]+):\s*(.*)$/i,
    
    // iOS: [12/31/2023, 11:59:00 PM] John: Hello
    ios_default: /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\]\s*([^:]+):\s*(.*)$/i,
    
    // Android 24h: 31/12/2023, 23:59 - John: Hello
    android_24h: /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*([^:]+):\s*(.*)$/i,
    
    // iOS 24h: [31/12/2023, 23:59:00] John: Hello
    ios_24h: /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.*)$/i,
    
    // System messages
    system: /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\s*-\s*(.+)$/i
  };

  for (const line of lines) {
    let matched = false;

    // Try to match different patterns
    for (const [formatName, pattern] of Object.entries(patterns)) {
      const match = line.match(pattern);
      
      if (match) {
        // Save previous message if exists
        if (currentMessage) {
          messages.push(currentMessage);
        }

        if (formatName === 'system') {
          // System message
          currentMessage = {
            timestamp: parseTimestamp(match[1], match[2]),
            type: 'system',
            content: match[3],
            sender: 'System'
          };
        } else {
          // Regular message
          currentMessage = {
            timestamp: parseTimestamp(match[1], match[2]),
            type: 'message',
            sender: match[3].trim(),
            content: match[4].trim()
          };
        }
        
        matched = true;
        break;
      }
    }

    // If no pattern matched, it might be a continuation of the previous message
    if (!matched && currentMessage) {
      currentMessage.content += '\n' + line;
    }
  }

  // Add the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages.map(msg => ({
    ...msg,
    content: cleanMessageContent(msg.content)
  }));
}

function parseTimestamp(dateStr, timeStr) {
  try {
    // Handle different date formats
    const dateParts = dateStr.split('/');
    let day, month, year;

    if (dateParts.length === 3) {
      // Determine if it's MM/DD/YYYY or DD/MM/YYYY
      const first = parseInt(dateParts[0]);
      const second = parseInt(dateParts[1]);
      
      if (first > 12) {
        // DD/MM/YYYY format
        day = first;
        month = second;
      } else if (second > 12) {
        // MM/DD/YYYY format
        month = first;
        day = second;
      } else {
        // Ambiguous, assume MM/DD/YYYY (US format)
        month = first;
        day = second;
      }
      
      year = parseInt(dateParts[2]);
      if (year < 100) year += 2000; // Handle 2-digit years
    }

    // Parse time
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!timeMatch) return new Date();

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = parseInt(timeMatch[3]) || 0;
    const ampm = timeMatch[4];

    // Convert to 24-hour format
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    }

    return new Date(year, month - 1, day, hours, minutes, seconds);
  } catch (error) {
    console.error('Error parsing timestamp:', error);
    return new Date();
  }
}

function cleanMessageContent(content) {
  // Remove media placeholders
  const mediaPatterns = [
    /\<Media omitted\>/gi,
    /\<image omitted\>/gi,
    /\<video omitted\>/gi,
    /\<audio omitted\>/gi,
    /\<document omitted\>/gi,
    /\<sticker omitted\>/gi,
    /\<GIF omitted\>/gi,
    /\<Contact card omitted\>/gi,
    /\<Location omitted\>/gi
  ];

  let cleaned = content;
  mediaPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '[Media]');
  });

  return cleaned.trim();
}

export function detectChatFormat(content) {
  const sampleLines = content.split('\n').slice(0, 50);
  const formats = {
    android_default: 0,
    ios_default: 0,
    android_24h: 0,
    ios_24h: 0
  };

  const patterns = {
    android_default: /\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\s*-\s*.+/i,
    ios_default: /^\[\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?\]\s*.+/i,
    android_24h: /\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*-\s*.+/i,
    ios_24h: /^\[\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\]\s*.+/i
  };

  for (const line of sampleLines) {
    for (const [format, pattern] of Object.entries(patterns)) {
      if (pattern.test(line)) {
        formats[format]++;
      }
    }
  }

  return Object.entries(formats).reduce((a, b) => formats[a[0]] > formats[b[0]] ? a : b)[0];
}