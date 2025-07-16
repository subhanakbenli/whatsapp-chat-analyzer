import sql from './connection.js';

export async function createTables() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS analyses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        analysis_json JSONB NOT NULL,
        file_name VARCHAR(255),
        file_size BIGINT,
        processing_status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(processing_status);
    `;

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

export async function dropTables() {
  try {
    await sql`DROP TABLE IF EXISTS analyses CASCADE`;
    console.log('Database tables dropped successfully');
  } catch (error) {
    console.error('Drop tables failed:', error);
    throw error;
  }
}