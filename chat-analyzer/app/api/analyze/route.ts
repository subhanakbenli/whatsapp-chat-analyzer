import { NextRequest, NextResponse } from 'next/server';
import { createAnalysis } from '@/lib/database/queries';
import { createTables } from '@/lib/database/migrations';
import ChatParser from '@/lib/parsers/chatParser';
import { SmartChunking } from '@/lib/processing/smartChunking';
import { GeminiClient } from '@/lib/ai/geminiClient';
import { ResponseAggregator } from '@/lib/ai/responseAggregator';
import { ANALYSIS_PROMPT } from '@/lib/ai/promptTemplates';
import progressTracker from '@/lib/processing/progressTracker';

export async function POST(request: NextRequest) {
  try {
    // Initialize database
    await createTables();

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
    const sessionId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      maxChunkSize: 3 * 1024 * 1024, // 3MB
      conversationBreakHours: 4
    });

    const chunks = await chunker.chunkMessages(parsedData.messages, (progress) => {
      progressTracker.updateStep(sessionId, 'chunking_messages', 
        Math.round((progress.processed / progress.total) * 100), 'in_progress');
    });

    progressTracker.completeStep(sessionId, 'chunking_messages', {
      chunkCount: chunks.length,
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0)
    });

    // AI Analysis
    progressTracker.updateStep(sessionId, 'ai_analysis', 0, 'in_progress');
    
    const geminiClient = new GeminiClient(process.env.GEMINI_API_KEY);
    const aggregator = new ResponseAggregator();

    let processedChunks = 0;
    for (const chunk of chunks) {
      try {
        const analysis = await geminiClient.analyzeChunk(chunk, ANALYSIS_PROMPT);
        aggregator.addChunkAnalysis(analysis);
        
        processedChunks++;
        progressTracker.updateStep(sessionId, 'ai_analysis', 
          Math.round((processedChunks / chunks.length) * 100), 'in_progress');
      } catch (error) {
        console.error(`Error analyzing chunk ${chunk.id}:`, error);
        progressTracker.addWarning(sessionId, 'ai_analysis', 
          `Failed to analyze chunk ${chunk.id}: ${error.message}`);
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

    // Save to database
    progressTracker.updateStep(sessionId, 'saving_results', 0, 'in_progress');
    
    const analysisData = {
      analysis: {
        ...aggregatedAnalysis,
        originalData: {
          messages: parsedData.messages,
          participants: parsedData.participants,
          metadata: parsedData.metadata
        },
        processingInfo: {
          sessionId,
          chunks: chunks.length,
          processingTime: Date.now() - progressTracker.getSession(sessionId).startTime
        }
      },
      fileName: file.name,
      fileSize: file.size,
      status: 'completed'
    };

    const result = await createAnalysis(analysisData);
    
    progressTracker.completeStep(sessionId, 'saving_results', { analysisId: result.id });
    progressTracker.completeSession(sessionId, { analysisId: result.id });

    return NextResponse.json({
      success: true,
      analysisId: result.id,
      sessionId,
      stats: {
        messageCount: parsedData.messages.length,
        participantCount: parsedData.participants.length,
        chunkCount: chunks.length,
        processingTime: Date.now() - progressTracker.getSession(sessionId).startTime
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    return NextResponse.json({
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
  }

  const progress = progressTracker.getSessionProgress(sessionId);
  
  if (!progress) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json(progress);
}