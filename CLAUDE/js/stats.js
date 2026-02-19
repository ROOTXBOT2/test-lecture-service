/**
 * stats.js — Local play history + statistics dashboard
 */
const Stats = (() => {
  const KEY = 'pattern_battle_history';
  const MAX_HISTORY = 50;

  function _getHistory() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch { return []; }
  }

  function _saveHistory(arr) {
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX_HISTORY)));
  }

  function addGame(data) {
    const history = _getHistory();
    history.unshift({
      score: data.score,
      combo: data.combo,
      accuracy: data.accuracy,
      rounds: data.rounds,
      difficulty: data.difficulty || 'normal',
      mode: data.mode || 'normal',
      date: new Date().toISOString(),
    });
    _saveHistory(history);
  }

  function getStats() {
    const history = _getHistory();
    if (history.length === 0) {
      return { games: 0, best: 0, avg: 0, bestCombo: 0, history: [] };
    }

    const scores = history.map(h => h.score);
    return {
      games: history.length,
      best: Math.max(...scores),
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestCombo: Math.max(...history.map(h => h.combo)),
      history,
    };
  }

  function renderStats() {
    const stats = getStats();

    document.getElementById('stat-games').textContent = stats.games;
    document.getElementById('stat-best').textContent = stats.best.toLocaleString();
    document.getElementById('stat-avg').textContent = stats.avg.toLocaleString();
    document.getElementById('stat-best-combo').textContent = stats.bestCombo;

    _renderChart(stats.history);
    _renderHistory(stats.history);
  }

  function _renderChart(history) {
    const canvas = document.getElementById('stats-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = (rect.width - 24) * (window.devicePixelRatio || 1);
    canvas.height = 180 * (window.devicePixelRatio || 1);
    canvas.style.width = (rect.width - 24) + 'px';
    canvas.style.height = '180px';
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

    const w = rect.width - 24;
    const h = 180;
    const pad = { top: 10, right: 10, bottom: 25, left: 40 };

    ctx.clearRect(0, 0, w, h);

    const data = history.slice(0, 20).reverse();
    if (data.length < 2) {
      ctx.fillStyle = '#8888a0';
      ctx.font = '13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('2게임 이상 플레이하면 그래프가 표시됩니다', w / 2, h / 2);
      return;
    }

    const scores = data.map(d => d.score);
    const maxScore = Math.max(...scores, 100);
    const minScore = Math.min(...scores);
    const range = maxScore - minScore || 100;

    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;
    const stepX = chartW / (data.length - 1);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();

      ctx.fillStyle = '#8888a0';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'right';
      const val = Math.round(maxScore - (range / 4) * i);
      ctx.fillText(val, pad.left - 6, y + 4);
    }

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#a29bfe';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const points = [];
    data.forEach((d, i) => {
      const x = pad.left + i * stepX;
      const y = pad.top + chartH - ((d.score - minScore) / range) * chartH;
      points.push({ x, y });
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
    gradient.addColorStop(0, 'rgba(162, 155, 254, 0.3)');
    gradient.addColorStop(1, 'rgba(162, 155, 254, 0)');

    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.lineTo(points[points.length - 1].x, h - pad.bottom);
    ctx.lineTo(points[0].x, h - pad.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Dots
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#a29bfe';
      ctx.fill();
    });
  }

  function _renderHistory(history) {
    const list = document.getElementById('history-list');
    if (!list) return;

    if (history.length === 0) {
      list.innerHTML = '<p class="subtitle" style="padding:16px;">아직 플레이 기록이 없습니다</p>';
      return;
    }

    list.innerHTML = '';
    const diffNames = { easy: '쉬움', normal: '보통', hard: '어려움' };

    history.slice(0, 20).forEach(h => {
      const el = document.createElement('div');
      el.className = 'history-item';

      const date = new Date(h.date);
      const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

      el.innerHTML = `
        <div>
          <span class="history-score">${h.score.toLocaleString()}</span>
          <span class="history-meta" style="margin-left:8px;">${diffNames[h.difficulty] || '보통'} R${h.rounds}</span>
        </div>
        <span class="history-meta">${dateStr}</span>
      `;
      list.appendChild(el);
    });
  }

  return { addGame, getStats, renderStats };
})();
