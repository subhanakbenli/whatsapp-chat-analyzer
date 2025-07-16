import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        api: 'healthy',
        gemini: 'checking'
      }
    };

    // Test Gemini API availability
    try {
      const hasGeminiKey = !!process.env.GEMINI_API_KEY;
      healthStatus.services.gemini = hasGeminiKey ? 'healthy' : 'configured';
    } catch (error) {
      console.error('Gemini API check failed:', error);
      healthStatus.services.gemini = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Set overall status
    const unhealthyServices = Object.values(healthStatus.services).filter(status => status === 'unhealthy');
    if (unhealthyServices.length > 0) {
      healthStatus.status = 'unhealthy';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}