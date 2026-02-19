/**
 * ranking.js — Ranking API client
 */
const Ranking = (() => {
  // Worker API base URL — update after deployment
  let API_BASE = '';

  function setApiBase(url) {
    API_BASE = url.replace(/\/$/, '');
  }

  function _headers() {
    return {
      'Content-Type': 'application/json',
      'X-Browser-ID': Storage.getBrowserId(),
    };
  }

  async function submitScore(data) {
    if (!API_BASE) return null;
    try {
      const res = await fetch(API_BASE + '/api/scores', {
        method: 'POST',
        headers: _headers(),
        body: JSON.stringify({
          browser_id: Storage.getBrowserId(),
          nickname: data.nickname || 'Anonymous',
          score: data.score,
          max_combo: data.combo,
          accuracy: data.accuracy,
          rounds: data.rounds,
        }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('Failed to submit score:', e);
      return null;
    }
  }

  async function fetchRankings(type = 'daily', page = 1) {
    if (!API_BASE) return null;
    try {
      const res = await fetch(API_BASE + `/api/rankings/${type}?page=${page}`, {
        headers: _headers(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('Failed to fetch rankings:', e);
      return null;
    }
  }

  async function fetchMyStats() {
    if (!API_BASE) return null;
    try {
      const res = await fetch(API_BASE + '/api/rankings/me', {
        headers: _headers(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('Failed to fetch my stats:', e);
      return null;
    }
  }

  return { setApiBase, submitScore, fetchRankings, fetchMyStats };
})();
