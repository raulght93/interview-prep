/// <reference types="@cloudflare/workers-types" />

export interface Env {
  PROGRESS_KV: KVNamespace;
  ASSETS: Fetcher;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 90 days — abandoned data is cleaned up automatically
const KV_TTL_SECONDS = 90 * 24 * 60 * 60;

// Valid sync key: 6-32 lowercase alphanumeric chars
const KEY_RE = /^[a-z0-9]{6,32}$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === '/api/progress') {
      if (request.method === 'GET') return handleGet(url, env);
      if (request.method === 'POST') return handlePost(request, env);
      return json({ error: 'Method not allowed' }, 405);
    }

    // Everything else → static assets (Next.js export)
    return env.ASSETS.fetch(request);
  },
};

async function handleGet(url: URL, env: Env): Promise<Response> {
  const key = url.searchParams.get('key') ?? '';
  if (!KEY_RE.test(key)) return json({ error: 'Invalid key' }, 400);

  const raw = await env.PROGRESS_KV.get(key);
  if (!raw) return json({ error: 'Not found' }, 404);

  try {
    return json(JSON.parse(raw));
  } catch {
    return json({ error: 'Corrupt data' }, 500);
  }
}

async function handlePost(request: Request, env: Env): Promise<Response> {
  let body: { key?: unknown; data?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const key = typeof body.key === 'string' ? body.key : '';
  if (!KEY_RE.test(key)) return json({ error: 'Invalid key' }, 400);
  if (body.data === undefined) return json({ error: 'Missing data' }, 400);

  const savedAt = new Date().toISOString();
  const payload = JSON.stringify({ version: 1, savedAt, data: body.data });

  if (payload.length > 10 * 1024 * 1024) return json({ error: 'Payload too large' }, 413);

  await env.PROGRESS_KV.put(key, payload, { expirationTtl: KV_TTL_SECONDS });
  return json({ ok: true, savedAt });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
