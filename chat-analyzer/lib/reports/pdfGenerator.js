import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class PDFGenerator {
  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  async generateReport(analysisData, fileName = 'chat_analysis_report.pdf') {
    try {
      // Reset document
      this.doc = new jsPDF();
      this.currentY = this.margin;

      // Generate report sections
      this.addTitle('WhatsApp Chat Analysis Report');
      this.addSummary(analysisData);
      this.addParticipantAnalysis(analysisData);
      this.addSentimentAnalysis(analysisData);
      this.addTopicAnalysis(analysisData);
      this.addInsights(analysisData);
      this.addMetadata(analysisData);

      // Return PDF as blob
      return this.doc.output('blob');
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  addTitle(title) {
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;

    // Add date
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Generated on: ${new Date().toLocaleDateString()}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 20;

    // Add separator line
    this.doc.setDrawColor(0, 0, 0);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 15;
  }

  addSummary(data) {
    this.addSectionTitle('Executive Summary');
    
    const summary = data.summary || {};
    const statistics = data.statistics || {};
    
    this.addText(`This report analyzes ${statistics.totalMessages || 0} messages from ${summary.participantCount || 0} participants.`);
    this.addText(`Analysis covers conversations from ${summary.timeRange ? new Date(summary.timeRange.start).toLocaleDateString() : 'N/A'} to ${summary.timeRange ? new Date(summary.timeRange.end).toLocaleDateString() : 'N/A'}.`);
    
    // Key metrics
    this.addSubsectionTitle('Key Metrics');
    this.addBulletPoint(`Total Messages: ${statistics.totalMessages || 0}`);
    this.addBulletPoint(`Total Words: ${statistics.totalWords || 0}`);
    this.addBulletPoint(`Average Message Length: ${statistics.averageMessageLength || 0} characters`);
    this.addBulletPoint(`Media Messages: ${statistics.mediaMessages || 0}`);
    this.addBulletPoint(`Active Participants: ${summary.participantCount || 0}`);
    
    this.currentY += 10;
  }

  addParticipantAnalysis(data) {
    this.addSectionTitle('Participant Analysis');
    
    const participants = data.participants || {};
    const participantEntries = Object.entries(participants)
      .sort((a, b) => b[1].messageCount - a[1].messageCount)
      .slice(0, 10); // Top 10 participants

    if (participantEntries.length === 0) {
      this.addText('No participant data available.');
      return;
    }

    participantEntries.forEach(([name, participantData]) => {
      this.addSubsectionTitle(name);
      this.addBulletPoint(`Messages: ${participantData.messageCount}`);
      this.addBulletPoint(`Words: ${participantData.wordCount}`);
      this.addBulletPoint(`Average Message Length: ${participantData.avgMessageLength} characters`);
      this.addBulletPoint(`Sentiment: ${participantData.sentiment || 'neutral'}`);
      this.addBulletPoint(`Engagement Level: ${participantData.engagementLevel || 'medium'}`);
      this.currentY += 5;
    });
  }

  addSentimentAnalysis(data) {
    this.addSectionTitle('Sentiment Analysis');
    
    const sentiment = data.sentiment || {};
    
    this.addText(`Overall Sentiment: ${sentiment.overall || 'neutral'} (${Math.round((sentiment.score || 0.5) * 100)}% confidence)`);
    
    if (sentiment.distribution) {
      this.addSubsectionTitle('Sentiment Distribution');
      this.addBulletPoint(`Positive: ${sentiment.distribution.positive || 0} messages`);
      this.addBulletPoint(`Neutral: ${sentiment.distribution.neutral || 0} messages`);
      this.addBulletPoint(`Negative: ${sentiment.distribution.negative || 0} messages`);
    }
    
    this.currentY += 10;
  }

  addTopicAnalysis(data) {
    this.addSectionTitle('Topic Analysis');
    
    const topics = data.topics || [];
    
    if (topics.length === 0) {
      this.addText('No topics identified in the conversation.');
      return;
    }

    this.addText(`${topics.length} main topics were identified in the conversation:`);
    this.currentY += 5;

    topics.slice(0, 10).forEach((topic, index) => {
      this.addBulletPoint(`${index + 1}. ${topic.name} (${topic.frequency} mentions)`);
      if (topic.keywords && topic.keywords.length > 0) {
        this.addText(`   Keywords: ${topic.keywords.slice(0, 5).join(', ')}`, this.margin + 15);
      }
      this.currentY += 2;
    });
    
    this.currentY += 10;
  }

  addInsights(data) {
    this.addSectionTitle('Key Insights');
    
    const insights = data.insights || {};
    
    if (insights.keyEvents && insights.keyEvents.length > 0) {
      this.addSubsectionTitle('Notable Events');
      insights.keyEvents.slice(0, 5).forEach(event => {
        this.addBulletPoint(event);
      });
    }
    
    if (insights.relationshipDynamics) {
      this.addSubsectionTitle('Relationship Dynamics');
      this.addText(insights.relationshipDynamics);
    }
    
    if (insights.conversationStyle) {
      this.addSubsectionTitle('Conversation Style');
      this.addText(insights.conversationStyle);
    }
    
    this.currentY += 10;
  }

  addMetadata(data) {
    this.addSectionTitle('Analysis Metadata');
    
    const metadata = data.metadata || {};
    const processingInfo = data.processingInfo || {};
    
    this.addBulletPoint(`Analysis ID: ${metadata.analysisId || 'N/A'}`);
    this.addBulletPoint(`Processing Method: ${metadata.method || 'N/A'}`);
    this.addBulletPoint(`Chunks Processed: ${processingInfo.chunks || 0}`);
    this.addBulletPoint(`Processing Time: ${processingInfo.processingTime ? Math.round(processingInfo.processingTime / 1000) : 0} seconds`);
    this.addBulletPoint(`Generated: ${new Date().toISOString()}`);
  }

  addSectionTitle(title) {
    this.checkPageBreak(25);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 12;
  }

  addSubsectionTitle(title) {
    this.checkPageBreak(20);
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;
  }

  addText(text, x = this.margin) {
    this.checkPageBreak(15);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    
    // Split text into lines that fit within the page width
    const lines = this.doc.splitTextToSize(text, this.pageWidth - this.margin * 2);
    
    lines.forEach(line => {
      this.doc.text(line, x, this.currentY);
      this.currentY += 6;
    });
  }

  addBulletPoint(text) {
    this.checkPageBreak(15);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    
    // Add bullet point
    this.doc.text('•', this.margin, this.currentY);
    
    // Split text into lines that fit within the page width
    const lines = this.doc.splitTextToSize(text, this.pageWidth - this.margin * 2 - 10);
    
    lines.forEach((line, index) => {
      this.doc.text(line, this.margin + 10, this.currentY);
      if (index < lines.length - 1) {
        this.currentY += 6;
      }
    });
    
    this.currentY += 8;
  }

  checkPageBreak(requiredSpace) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  async addChartImage(chartElement, title) {
    try {
      const canvas = await html2canvas(chartElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = this.pageWidth - this.margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      this.checkPageBreak(imgHeight + 30);
      
      if (title) {
        this.addSubsectionTitle(title);
      }
      
      this.doc.addImage(imgData, 'PNG', this.margin, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 10;
      
    } catch (error) {
      console.error('Error adding chart to PDF:', error);
      this.addText(`[Chart: ${title}] - Unable to include chart in PDF`);
    }
  }
}

export default PDFGenerator;