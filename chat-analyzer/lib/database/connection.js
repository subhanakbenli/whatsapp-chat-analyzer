import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default sql;

export async function testConnection() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log('Database connected successfully');
    return result;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}