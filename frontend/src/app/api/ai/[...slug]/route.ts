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

/**
 * Chi cho phep 2 endpoint AI dung cho san (tranh proxy thanh cong dung dich khac).
 */
const ALLOWED_PATHS = new Set(['/recommend-pitches', '/matchmaking']);

/** Kich thuoc toi da cho phep gui len AI (du du thua). */
const MAX_BODY_BYTES = 256 * 1024;

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

    // Chỉ cho pép 2 endpoint AI hợp lệ.
    if (!ALLOWED_PATHS.has(path)) {
      return NextResponse.json(
        { status: 'ERROR', message: 'Endpoint AI không hợp lệ.' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Body quá lớn -> tu choi TRƯỚC khi đọc hết (đọc hết rồi mới check thì vẫn
    // dùng bộ nhớ tạm cho payload lớn -> không chặn được lạm dụng).
    const declaredLength = Number(request.headers.get('content-length') || '0');
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { status: 'ERROR', message: 'Dữ liệu gửi lên quá lớn.' },
        { status: 413, headers: CORS_HEADERS }
      );
    }
    const rawBody = await request.text();
    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { status: 'ERROR', message: 'Dữ liệu gửi lên quá lớn.' },
        { status: 413, headers: CORS_HEADERS }
      );
    }
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { status: 'ERROR', message: 'Body phải là JSON hợp lệ.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Forward request to AI service (giữ nguyên query string của client).
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s cho cold start
    const search = request.nextUrl.search || '';

    let response: Response;
    try {
      response = await fetch(`${aiBaseUrl}/api/v1/ai${path}${search}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      // clearTimeout phải ở finally — nếu fetch ném lỗi thì timer 55s vẫn treo.
      clearTimeout(timeoutId);
    }

    // AI có thể trả về JSON hoặc text (VD trang lỗi/bảo trì) -> đọc an toàn
    const raw = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      // Trả 502 thay vì 200: nếu forward nguyên trang HTML lỗi với status 200, giao diện
      // sẽ tưởng là thành công rồi đọc `recommendations` (không có) -> undefined -> vỡ trang.
      console.error('[AI Proxy] Upstream trả về body không phải JSON:', raw.slice(0, 300));
      return NextResponse.json(
        { status: 'ERROR', message: 'AI service trả về dữ liệu không hợp lệ.' },
        { status: 502, headers: CORS_HEADERS }
      );
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
        { status: 'ERROR', message: 'AI service unavailable' },
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
