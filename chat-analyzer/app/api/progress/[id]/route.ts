import { NextRequest, NextResponse } from 'next/server';
import progressTracker from '@/lib/processing/progressTracker';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const progress = progressTracker.getSessionProgress(sessionId);
    
    if (!progress) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Progress tracking error:', error);
    return NextResponse.json({
      error: 'Failed to get progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const success = progressTracker.cleanupSession(sessionId);
    
    if (!success) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session cleanup error:', error);
    return NextResponse.json({
      error: 'Failed to cleanup session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}