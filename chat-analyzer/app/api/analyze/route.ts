import { NextRequest, NextResponse } from 'next/server';
import { ChatParser } from '@/lib/parsers/chatParser';
import { SmartChunking } from '@/lib/processing/smartChunking';
import { GeminiClient } from '@/lib/ai/geminiClient';
import { ResponseAggregator } from '@/lib/ai/responseAggregator';
import { ANALYSIS_PROMPT } from '@/lib/ai/promptTemplates';
import progressTracker from '@/lib/processing/progressTracker';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file
    if (!file.name.endsWith('.txt')) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a .txt file' }, { status: 400 });
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      return NextResponse.json({ error: 'File too large. Maximum size is 100MB' }, { status: 400 });
    }

    // Create progress tracking session
    const sessionId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    progressTracker.createSession(sessionId, 6);

    // Start processing
    progressTracker.updateStep(sessionId, 'reading_file', 0, 'in_progress');

    const content = await file.text();
    
    if (!content || content.length < 100) {
      return NextResponse.json({ error: 'File appears to be empty or invalid' }, { status: 400 });
    }

    progressTracker.completeStep(sessionId, 'reading_file');

    // Parse chat
    progressTracker.updateStep(sessionId, 'parsing_chat', 0, 'in_progress');
    
    const chatParser = new ChatParser();
    const parsedData = await chatParser.parse(content, file.name);

    progressTracker.completeStep(sessionId, 'parsing_chat', {
      messageCount: parsedData.messages.length,
      participantCount: parsedData.participants.length
    });

    // Smart chunking
    progressTracker.updateStep(sessionId, 'chunking_messages', 0, 'in_progress');
    
    const chunker = new SmartChunking({
      maxChunkSize: 2.5 * 1000 * 1000, // 2.5 milyon karakter maksimum
      minChunkSize: 2.1 * 1000 * 1000, // 2.1 milyon karakter minimum
      fileChunkingThreshold: 2.5 * 1000 * 1000, // 2.5 milyon karakterden büyük dosyaları böl
      conversationBreakHours: 5 // 5 saat konuşma arası
    });

    const chunks = await chunker.chunkMessages(parsedData.messages, (progress: any) => {
      progressTracker.updateStep(sessionId, 'chunking_messages', 
        Math.round((progress.processed / progress.total) * 100), 'in_progress');
    });

    progressTracker.completeStep(sessionId, 'chunking_messages', {
      chunkCount: chunks.length,
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0)
    });

    // AI Analysis
    progressTracker.updateStep(sessionId, 'ai_analysis', 0, 'in_progress');
      // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set. Please configure your API key.');
    }

    const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY);
    
    // Test connection first
    try {
      const connectionTest = await geminiClient.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Gemini API connection failed: ${connectionTest.error}`);
      }
    } catch (testError) {
      console.error('Gemini API connection test failed:', testError);
      throw new Error(`Failed to connect to Gemini API: ${testError instanceof Error ? testError.message : testError}`);
    }
    
    const aggregator = new ResponseAggregator();

    let processedChunks = 0;
    for (const chunk of chunks) {
      try {
        const analysis = await geminiClient.analyzeChunk(chunk, ANALYSIS_PROMPT);
        aggregator.addChunkAnalysis(analysis);
        
        processedChunks++;
        progressTracker.updateStep(sessionId, 'ai_analysis', 
          Math.round((processedChunks / chunks.length) * 100), 'in_progress');
        
        // Birden fazla chunk varsa ve son chunk değilse 45 saniye bekle
        if (chunks.length > 1 && processedChunks < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 45000)); // 45 saniye bekle
        }
      } catch (error) {
        console.error(`Error analyzing chunk ${chunk.id}:`, error);
        
        // Special handling for overload errors
        if (error instanceof Error && (error.message.includes('overloaded') || error.message.includes('Service Unavailable'))) {
          progressTracker.addWarning(sessionId, 'ai_analysis', 
            `Gemini API is temporarily overloaded. Chunk ${chunk.id} analysis skipped. This is a temporary issue with Google's servers.`);
        } else {
          progressTracker.addWarning(sessionId, 'ai_analysis', 
            `Failed to analyze chunk ${chunk.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // Hata durumunda da bekleme süresini uygula
        if (chunks.length > 1 && processedChunks < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 45000));
        }
      }
    }

    progressTracker.completeStep(sessionId, 'ai_analysis', {
      processedChunks,
      totalChunks: chunks.length
    });

    // Aggregate results
    progressTracker.updateStep(sessionId, 'aggregating_results', 0, 'in_progress');
    
    const aggregatedAnalysis = aggregator.aggregateAnalyses();
    
    progressTracker.completeStep(sessionId, 'aggregating_results');

    // Prepare final results - no database save needed
    progressTracker.updateStep(sessionId, 'preparing_results', 0, 'in_progress');
    
    const finalAnalysis = {
      ...aggregatedAnalysis,
      originalData: {
        messages: parsedData.messages,
        participants: parsedData.participants,
        metadata: parsedData.metadata
      },
      processingInfo: {
        sessionId,
        chunks: chunks.length,
        processingTime: Date.now() - (progressTracker.getSession(sessionId)?.startTime || 0)
      }
    };

    progressTracker.completeStep(sessionId, 'preparing_results');
    progressTracker.completeSession(sessionId, { analysis: finalAnalysis });

    return NextResponse.json({
      success: true,
      sessionId,
      analysis: finalAnalysis,
      stats: {
        messageCount: parsedData.messages.length,
        participantCount: parsedData.participants.length,
        chunkCount: chunks.length,
        processingTime: Date.now() - (progressTracker.getSession(sessionId)?.startTime || 0)
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // More detailed error information
    const errorResponse = {
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      step: 'unknown',
      suggestion: ''
    };
    
    // Try to determine which step failed
    if (error instanceof Error && (error.message.includes('parse') || error.message.includes('extract'))) {
      errorResponse.step = 'parsing';
      errorResponse.suggestion = 'Please check that your file is a valid WhatsApp chat export in .txt format';
    } else if (error instanceof Error && error.message.includes('chunk')) {
      errorResponse.step = 'chunking';
      errorResponse.suggestion = 'Try using a smaller file or different format';
    } else if (error instanceof Error && (error.message.includes('API') || error.message.includes('Gemini'))) {
      errorResponse.step = 'ai_analysis';
      errorResponse.suggestion = 'AI service may be temporarily unavailable. Please try again later';
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  const session = progressTracker.getSession(sessionId);
  
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const progress = progressTracker.getSessionProgress(sessionId);
  
  // If session is completed, include the result
  if (session.status === 'completed' && session.result) {
    return NextResponse.json({
      ...progress,
      result: session.result
    });
  }

  return NextResponse.json(progress);
}