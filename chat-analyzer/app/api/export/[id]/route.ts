import { NextRequest, NextResponse } from 'next/server';
import { getAnalysis } from '@/lib/database/queries';
import { PDFGenerator } from '@/lib/reports/pdfGenerator';
import { HTMLGenerator } from '@/lib/reports/htmlGenerator';
import { DataExporter } from '@/lib/reports/dataExporter';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysisId = params.id;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const includeRawData = searchParams.get('includeRawData') === 'true';
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
    }

    // Fetch analysis data
    const analysisRecord = await getAnalysis(analysisId);
    
    if (!analysisRecord) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const analysisData = analysisRecord.analysis_json;
    const fileName = analysisRecord.file_name || 'chat_analysis';

    let blob;
    let contentType;
    let downloadName;

    switch (format.toLowerCase()) {
      case 'pdf':
        const pdfGenerator = new PDFGenerator();
        blob = await pdfGenerator.generateReport(analysisData, `${fileName}_report.pdf`);
        contentType = 'application/pdf';
        downloadName = `${fileName}_report.pdf`;
        break;

      case 'html':
        const htmlGenerator = new HTMLGenerator();
        blob = htmlGenerator.generateReport(analysisData, `${fileName}_report.html`);
        contentType = 'text/html';
        downloadName = `${fileName}_report.html`;
        break;

      case 'csv':
        const csvExporter = new DataExporter();
        blob = csvExporter.exportCSV(analysisData, {
          includeParticipants: true,
          includeTopics: true,
          includeSentiment: true
        });
        contentType = 'text/csv';
        downloadName = `${fileName}_data.csv`;
        break;

      case 'json':
        const jsonExporter = new DataExporter();
        blob = jsonExporter.exportJSON(analysisData, {
          includeRawData,
          prettify: true
        });
        contentType = 'application/json';
        downloadName = `${fileName}_analysis.json`;
        break;

      case 'messages-csv':
        if (!analysisData.originalData || !analysisData.originalData.messages) {
          return NextResponse.json({ error: 'Raw message data not available' }, { status: 400 });
        }
        const messageExporter = new DataExporter();
        blob = messageExporter.exportMessagesCSV(analysisData.originalData.messages, {
          includeContent: searchParams.get('includeContent') !== 'false',
          dateFormat: searchParams.get('dateFormat') || 'iso'
        });
        contentType = 'text/csv';
        downloadName = `${fileName}_messages.csv`;
        break;

      case 'activity-csv':
        if (!analysisData.originalData || !analysisData.originalData.messages) {
          return NextResponse.json({ error: 'Raw message data not available' }, { status: 400 });
        }
        const activityExporter = new DataExporter();
        blob = activityExporter.exportActivityCSV(analysisData.originalData.messages, {
          groupBy: searchParams.get('groupBy') || 'hour'
        });
        contentType = 'text/csv';
        downloadName = `${fileName}_activity.csv`;
        break;

      default:
        return NextResponse.json({ error: 'Unsupported export format' }, { status: 400 });
    }

    // Convert blob to array buffer
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set headers for file download
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${downloadName}"`,
      'Content-Length': buffer.length.toString(),
    });

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({
      error: 'Export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysisId = params.id;
    const body = await request.json();
    const { format, filters, options } = body;
    
    if (!analysisId) {
      return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
    }

    // Fetch analysis data
    const analysisRecord = await getAnalysis(analysisId);
    
    if (!analysisRecord) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const analysisData = analysisRecord.analysis_json;
    const fileName = analysisRecord.file_name || 'chat_analysis';

    // Apply filters if provided
    let exportData = analysisData;
    if (filters) {
      const dataExporter = new DataExporter();
      const filteredBlob = dataExporter.generateFilteredExport(analysisData, {
        ...filters,
        format: format || 'json'
      });
      
      const arrayBuffer = await filteredBlob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const contentType = format === 'csv' ? 'text/csv' : 'application/json';
      const extension = format === 'csv' ? 'csv' : 'json';
      const downloadName = `${fileName}_filtered.${extension}`;

      const headers = new Headers({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': buffer.length.toString(),
      });

      return new NextResponse(buffer, {
        status: 200,
        headers,
      });
    }

    // Generate regular export
    const exporter = new DataExporter();
    const blob = exporter.exportData(exportData, format || 'json', options || {});
    
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const extension = format === 'csv' ? 'csv' : 'json';
    const downloadName = `${fileName}_export.${extension}`;

    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${downloadName}"`,
      'Content-Length': buffer.length.toString(),
    });

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Custom export error:', error);
    return NextResponse.json({
      error: 'Custom export failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}