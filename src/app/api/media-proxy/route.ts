import type { NextRequest } from 'next/server';

// Instagram's CDN rejects browser requests that carry a cross-site referrer,
// which blocks <video> playback in particular (the referrerpolicy attribute
// isn't supported on media elements). This route streams the media server-side.

const ALLOWED_HOST = /(\.cdninstagram\.com|\.fbcdn\.net)$/;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) return new Response('Missing url', { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }
  if (target.protocol !== 'https:' || !ALLOWED_HOST.test(target.hostname)) {
    return new Response('Host not allowed', { status: 403 });
  }

  const headers: HeadersInit = {};
  const range = request.headers.get('range');
  if (range) headers.Range = range;

  const upstream = await fetch(target, { headers });
  if (!upstream.ok && upstream.status !== 206) {
    return new Response('Upstream error', { status: upstream.status });
  }

  const responseHeaders = new Headers();
  for (const h of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const v = upstream.headers.get(h);
    if (v) responseHeaders.set(h, v);
  }
  responseHeaders.set('cache-control', 'public, max-age=3600');

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
