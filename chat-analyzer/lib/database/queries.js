import sql from './connection.js';

export async function createAnalysis(analysisData) {
  try {
    const result = await sql`
      INSERT INTO analyses (analysis_json, file_name, file_size, processing_status)
      VALUES (${JSON.stringify(analysisData.analysis)}, ${analysisData.fileName}, ${analysisData.fileSize}, ${analysisData.status || 'completed'})
      RETURNING id, created_at
    `;
    return result[0];
  } catch (error) {
    console.error('Error creating analysis:', error);
    throw error;
  }
}

export async function getAnalysis(id) {
  try {
    const result = await sql`
      SELECT * FROM analyses 
      WHERE id = ${id}
    `;
    return result[0];
  } catch (error) {
    console.error('Error fetching analysis:', error);
    throw error;
  }
}

export async function updateAnalysis(id, updates) {
  try {
    const result = await sql`
      UPDATE analyses 
      SET 
        analysis_json = ${updates.analysis_json ? JSON.stringify(updates.analysis_json) : sql`analysis_json`},
        processing_status = ${updates.processing_status || sql`processing_status`},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error('Error updating analysis:', error);
    throw error;
  }
}

export async function deleteAnalysis(id) {
  try {
    await sql`
      DELETE FROM analyses 
      WHERE id = ${id}
    `;
    return { success: true };
  } catch (error) {
    console.error('Error deleting analysis:', error);
    throw error;
  }
}

export async function getRecentAnalyses(limit = 10) {
  try {
    const result = await sql`
      SELECT id, file_name, file_size, processing_status, created_at
      FROM analyses 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `;
    return result;
  } catch (error) {
    console.error('Error fetching recent analyses:', error);
    throw error;
  }
}