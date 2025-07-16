// In-memory storage for analysis data
// Data is temporary and will be lost when the server restarts

const analyses = new Map();

export function createAnalysis(analysisData) {
  try {
    const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    const analysis = {
      id,
      analysis_json: analysisData.analysis,
      file_name: analysisData.fileName,
      file_size: analysisData.fileSize,
      processing_status: analysisData.status || 'completed',
      created_at: now,
      updated_at: now
    };
    
    analyses.set(id, analysis);
    
    return {
      id,
      created_at: now
    };
  } catch (error) {
    console.error('Error creating analysis:', error);
    throw error;
  }
}

export function getAnalysis(id) {
  try {
    const analysis = analyses.get(id);
    if (!analysis) {
      return null;
    }
    return analysis;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    throw error;
  }
}

export function updateAnalysis(id, updates) {
  try {
    const analysis = analyses.get(id);
    if (!analysis) {
      throw new Error('Analysis not found');
    }
    
    const updatedAnalysis = {
      ...analysis,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    analyses.set(id, updatedAnalysis);
    return updatedAnalysis;
  } catch (error) {
    console.error('Error updating analysis:', error);
    throw error;
  }
}

export function deleteAnalysis(id) {
  try {
    const existed = analyses.has(id);
    if (!existed) {
      throw new Error('Analysis not found');
    }
    
    analyses.delete(id);
    return { success: true };
  } catch (error) {
    console.error('Error deleting analysis:', error);
    throw error;
  }
}

export function getRecentAnalyses(limit = 10) {
  try {
    const allAnalyses = Array.from(analyses.values());
    
    // Sort by created_at (newest first)
    allAnalyses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Return only basic info and limit results
    return allAnalyses.slice(0, limit).map(analysis => ({
      id: analysis.id,
      file_name: analysis.file_name,
      file_size: analysis.file_size,
      processing_status: analysis.processing_status,
      created_at: analysis.created_at
    }));
  } catch (error) {
    console.error('Error fetching recent analyses:', error);
    throw error;
  }
}

export function getAllAnalyses() {
  return Array.from(analyses.values());
}

export function clearAllAnalyses() {
  analyses.clear();
  return { success: true };
}

export function getAnalysisCount() {
  return analyses.size;
}