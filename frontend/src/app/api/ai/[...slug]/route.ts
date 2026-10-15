import { NextRequest, NextResponse } from 'next/server';

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_BASE_URL || 'http://localhost:8000';

/**
 * Proxy API route for AI Service to avoid CORS issues on mobile
 * Usage: /api/ai/recommend-pitches, /api/ai/calculate-elo, /api/ai/matchmaking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const path = '/' + slug.join('/');
    const body = await request.json();

    // Forward request to AI service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for cold start

    const response = await fetch(`${AI_BASE_URL}/api/v1/ai${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    // Return with proper CORS headers
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('[AI Proxy] Error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { status: 'ERROR', message: 'AI service timeout (cold start)' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { status: 'ERROR', message: 'AI service unavailable' },
      { status: 503 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}