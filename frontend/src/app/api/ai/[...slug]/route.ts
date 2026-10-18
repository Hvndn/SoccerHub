import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy API route cho AI Service (FastAPI) để tránh lỗi CORS trên mobile.
 * Dùng: POST /api/ai/recommend-pitches | /api/ai/matchmaking
 *
 * URL AI được chọn theo thứ tự:
 *   1. NEXT_PUBLIC_AI_BASE_URL hoặc AI_BASE_URL (nếu được cấu hình)
 *   2. Nếu không có: production -> service thật, dev -> localhost:8000
 * Nhờ vậy production vẫn chạy đúng kể cả khi quên set biến môi trường.
 */
const LOCAL_AI_BASE_URL = 'http://localhost:8000';
const PROD_AI_BASE_URL = 'https://Turfzone-ai-service.onrender.com';

function resolveAiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_AI_BASE_URL || process.env.AI_BASE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  return process.env.NODE_ENV === 'production' ? PROD_AI_BASE_URL : LOCAL_AI_BASE_URL;
}

// Cho phép hàm chạy lâu hơn để chịu được cold start của Render (Vercel Pro tôn trọng giá trị này).
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const aiBaseUrl = resolveAiBaseUrl();

  try {
    const { slug } = await params;
    const path = '/' + slug.join('/');
    const body = await request.json();

    // Forward request to AI service
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s cho cold start

    const response = await fetch(`${aiBaseUrl}/api/v1/ai${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // AI có thể trả về JSON hoặc text (VD trang lỗi) -> đọc an toàn
    const raw = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { status: 'ERROR', message: raw.slice(0, 300) };
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    console.error('[AI Proxy] Error:', error);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { status: 'ERROR', message: 'AI service timeout (cold start)' },
        { status: 504, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      { status: 'ERROR', message: 'AI service unavailable', target: aiBaseUrl },
      { status: 503, headers: CORS_HEADERS }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}
