/**
 * Pattern Battle — Cloudflare Worker API
 * D1 Database for score storage and rankings
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Browser-ID',
};

const PAGE_SIZE = 50;

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route
      if (path === '/api/scores' && request.method === 'POST') {
        return await handleSubmitScore(request, env);
      }
      if (path === '/api/rankings/daily' && request.method === 'GET') {
        return await handleDailyRankings(url, env);
      }
      if (path === '/api/rankings/alltime' && request.method === 'GET') {
        return await handleAlltimeRankings(url, env);
      }
      if (path === '/api/rankings/me' && request.method === 'GET') {
        return await handleMyStats(request, env);
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (e) {
      console.error('Worker error:', e);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  },
};

// ===== Handlers =====

async function handleSubmitScore(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const { browser_id, nickname, score, max_combo, accuracy, rounds } = body;

  // Validation
  if (!browser_id || typeof browser_id !== 'string') {
    return jsonResponse({ error: 'browser_id is required' }, 400);
  }
  if (typeof score !== 'number' || score < 0 || score > 999999) {
    return jsonResponse({ error: 'Invalid score' }, 400);
  }
  if (typeof max_combo !== 'number' || max_combo < 0) {
    return jsonResponse({ error: 'Invalid max_combo' }, 400);
  }
  if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100) {
    return jsonResponse({ error: 'Invalid accuracy' }, 400);
  }
  if (typeof rounds !== 'number' || rounds < 0) {
    return jsonResponse({ error: 'Invalid rounds' }, 400);
  }

  const safeName = String(nickname || 'Anonymous').trim().slice(0, 12) || 'Anonymous';

  // Insert score
  await env.DB.prepare(
    `INSERT INTO scores (browser_id, nickname, score, max_combo, accuracy, rounds)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(browser_id, safeName, Math.floor(score), Math.floor(max_combo), accuracy, Math.floor(rounds)).run();

  // Calculate rank (how many scores are higher today)
  const today = new Date().toISOString().slice(0, 10);
  const rankResult = await env.DB.prepare(
    `SELECT COUNT(*) as rank FROM scores
     WHERE date(played_at) = ? AND score > ?`
  ).bind(today, Math.floor(score)).first();

  const rank = (rankResult?.rank ?? 0) + 1;

  // Calculate total players today for top %
  const totalResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM scores WHERE date(played_at) = ?`
  ).bind(today).first();

  const total = totalResult?.total ?? 1;
  const topPercent = Math.max(1, Math.round((rank / total) * 100));

  return jsonResponse({ rank, top_percent: topPercent, total_players: total });
}

async function handleDailyRankings(url, env) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const offset = (page - 1) * PAGE_SIZE;
  const today = new Date().toISOString().slice(0, 10);

  const results = await env.DB.prepare(
    `SELECT browser_id, nickname, score, max_combo, accuracy, rounds
     FROM scores
     WHERE date(played_at) = ?
     ORDER BY score DESC
     LIMIT ? OFFSET ?`
  ).bind(today, PAGE_SIZE, offset).all();

  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM scores WHERE date(played_at) = ?`
  ).bind(today).first();

  return jsonResponse({
    rankings: results.results || [],
    page,
    total: countResult?.total ?? 0,
    has_more: (results.results?.length || 0) === PAGE_SIZE,
  });
}

async function handleAlltimeRankings(url, env) {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  // Best score per browser_id
  const results = await env.DB.prepare(
    `SELECT browser_id, nickname, MAX(score) as score, max_combo, accuracy, rounds
     FROM scores
     GROUP BY browser_id
     ORDER BY score DESC
     LIMIT ? OFFSET ?`
  ).bind(PAGE_SIZE, offset).all();

  const countResult = await env.DB.prepare(
    `SELECT COUNT(DISTINCT browser_id) as total FROM scores`
  ).first();

  return jsonResponse({
    rankings: results.results || [],
    page,
    total: countResult?.total ?? 0,
    has_more: (results.results?.length || 0) === PAGE_SIZE,
  });
}

async function handleMyStats(request, env) {
  const browserId = request.headers.get('X-Browser-ID');
  if (!browserId) {
    return jsonResponse({ error: 'X-Browser-ID header required' }, 400);
  }

  // Best score
  const best = await env.DB.prepare(
    `SELECT score, max_combo, accuracy, rounds, played_at
     FROM scores
     WHERE browser_id = ?
     ORDER BY score DESC
     LIMIT 1`
  ).bind(browserId).first();

  // Game count
  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as games FROM scores WHERE browser_id = ?`
  ).bind(browserId).first();

  // All-time rank
  let rank = null;
  if (best) {
    const rankResult = await env.DB.prepare(
      `SELECT COUNT(DISTINCT browser_id) as rank
       FROM scores
       WHERE browser_id != ? AND browser_id IN (
         SELECT browser_id FROM scores GROUP BY browser_id HAVING MAX(score) > ?
       )`
    ).bind(browserId, best.score).first();
    rank = (rankResult?.rank ?? 0) + 1;
  }

  return jsonResponse({
    best: best || null,
    games: countResult?.games ?? 0,
    rank,
  });
}

// ===== Helpers =====

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}
