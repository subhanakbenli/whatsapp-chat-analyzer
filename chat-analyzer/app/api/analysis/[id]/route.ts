import { NextRequest, NextResponse } from 'next/server';
import { getAnalysis } from '@/lib/database/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysisId = params.id;
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
    }

    const analysis = await getAnalysis(analysisId);
    
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json({
      error: 'Failed to fetch analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}