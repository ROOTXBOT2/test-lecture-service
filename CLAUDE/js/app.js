/**
 * app.js — Bootstrap, screen routing, event binding
 */
const App = (() => {
  const screens = {};
  let _currentScreen = 'start';

  function init() {
    // Cache screens
    screens.start = document.getElementById('screen-start');
    screens.game = document.getElementById('screen-game');
    screens.result = document.getElementById('screen-result');
    screens.ranking = document.getElementById('screen-ranking');

    // Load saved nickname
    const nicknameInput = document.getElementById('input-nickname');
    nicknameInput.value = Storage.getNickname();

    // Connect ranking API
    Ranking.setApiBase('https://pattern-battle-api.rootxbot2.workers.dev');

    // Init preview grid
    Grid.initPreview('grid-preview');

    // Init game grid
    Grid.init('grid-game');

    // Audio enabled from storage
    Audio.setEnabled(Storage.getSoundEnabled());

    // Ads
    Ads.init();

    // Bind events
    _bindEvents();

    // Listen to game state changes
    GameState.onStateChange(_handleStateChange);
  }

  function _bindEvents() {
    document.getElementById('btn-start').addEventListener('click', _startGame);
    document.getElementById('btn-restart').addEventListener('click', _restart);
    document.getElementById('btn-ranking').addEventListener('click', () => _showScreen('ranking'));
    document.getElementById('btn-back-from-ranking').addEventListener('click', _backFromRanking);

    // Nickname save on blur
    document.getElementById('input-nickname').addEventListener('blur', (e) => {
      Storage.setNickname(e.target.value);
    });

    // Ranking tabs
    document.querySelectorAll('.ranking-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        _loadRankings(tab.dataset.tab);
      });
    });

    // Grid cell taps
    Grid.onTap(_handleCellTap);
  }

  function _showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if (screens[name]) {
      screens[name].classList.add('active');
      _currentScreen = name;
    }
  }

  function _startGame() {
    // Save nickname
    const nickname = document.getElementById('input-nickname').value.trim();
    Storage.setNickname(nickname);

    Grid.stopPreview('grid-preview');
    _showScreen('game');
    Ads.hideAd('ad-below-game');

    // Reset HUD
    document.getElementById('hud-timer').textContent = '60';
    document.getElementById('hud-score').textContent = '0';
    document.getElementById('hud-combo').textContent = '0';
    document.getElementById('hud-round').textContent = '1';
    document.getElementById('game-message').textContent = '';
    document.getElementById('pattern-progress').innerHTML = '';

    Effects.clearAll();
    Grid.unlightAll();
    Grid.setDisabled(true);

    GameState.startGame();
  }

  function _restart() {
    _showScreen('start');
    Grid.initPreview('grid-preview');
    Ads.showAd('ad-below-game');
  }

  function _backFromRanking() {
    // Go back to result screen if came from result, otherwise start
    if (GameState.getState() === GameState.STATES.ENDED) {
      _showScreen('result');
    } else {
      _showScreen('start');
    }
  }

  // ===== State Change Handler =====

  function _handleStateChange(newState, oldState, data) {
    const S = GameState.STATES;

    switch (newState) {
      case S.COUNTDOWN:
        _runCountdown();
        break;

      case S.SHOWING:
        _showPatternPhase(data);
        break;

      case S.INPUT:
        _inputPhase(data);
        break;

      case S.ROUND_CLEAR:
        _roundClearPhase(data);
        break;

      case S.PENALTY:
        _penaltyPhase(data);
        break;

      case S.ENDED:
        _endedPhase(data);
        break;
    }
  }

  function _runCountdown() {
    const overlay = document.getElementById('countdown-overlay');
    const number = document.getElementById('countdown-number');
    overlay.classList.add('active');

    let count = 3;
    number.textContent = count;
    Audio.tick();

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        number.textContent = count;
        number.style.animation = 'none';
        void number.offsetHeight; // reflow
        number.style.animation = '';
        Audio.tick();
      } else {
        number.textContent = 'GO!';
        number.style.animation = 'none';
        void number.offsetHeight;
        number.style.animation = '';
        Audio.go();

        setTimeout(() => {
          overlay.classList.remove('active');
          GameState.afterCountdown();
        }, 500);
        clearInterval(interval);
      }
    }, 800);
  }

  async function _showPatternPhase(data) {
    Grid.setDisabled(true);
    Grid.unlightAll();

    const msg = document.getElementById('game-message');
    msg.textContent = data.retry ? '다시 보세요!' : '패턴을 기억하세요!';

    _updateHUD();
    _renderProgress(data.length, -1);

    // Speed scales with pattern length (faster at higher rounds)
    const speed = Math.max(200, 450 - data.length * 15);
    await Grid.showPattern(data.pattern, speed);

    GameState.onPatternShown();
  }

  function _inputPhase(data) {
    Grid.setDisabled(false);
    document.getElementById('game-message').textContent = '패턴을 따라하세요!';
    _renderProgress(data.length, 0);
  }

  function _roundClearPhase(data) {
    Grid.setDisabled(true);
    document.getElementById('game-message').textContent = '클리어!';
    _updateHUD();
  }

  function _penaltyPhase(data) {
    Grid.setDisabled(true);
    document.getElementById('game-message').textContent = '틀렸어요!';
    Audio.wrong();
    Effects.wrongFlash();
    _updateHUD();
  }

  function _endedPhase(data) {
    Grid.setDisabled(true);
    Effects.clearAll();
    Audio.gameOver();

    // Save best score
    Storage.setBestScore(data.score);

    // Show result screen
    setTimeout(() => {
      _showResultScreen(data);
    }, 600);
  }

  function _showResultScreen(data) {
    _showScreen('result');

    document.getElementById('result-score').textContent = data.score.toLocaleString();
    document.getElementById('result-rounds').textContent = data.rounds;
    document.getElementById('result-combo').textContent = data.combo;
    document.getElementById('result-accuracy').textContent = data.accuracy + '%';
    document.getElementById('result-rank').textContent = '-';

    Ads.showAd('ad-result-screen');

    // Submit score to API
    _submitScore(data);
  }

  async function _submitScore(data) {
    const nickname = Storage.getNickname() || 'Anonymous';
    const result = await Ranking.submitScore({
      nickname,
      score: data.score,
      combo: data.combo,
      accuracy: data.accuracy,
      rounds: data.rounds,
    });

    if (result && result.rank) {
      const rankEl = document.getElementById('result-rank');
      if (result.top_percent !== undefined) {
        rankEl.textContent = `#${result.rank} (상위 ${result.top_percent}%)`;
      } else {
        rankEl.textContent = `#${result.rank}`;
      }
    }
  }

  // ===== Cell Tap Handler =====

  function _handleCellTap(cellIndex, cellEl) {
    if (GameState.getState() !== GameState.STATES.INPUT) return;

    const result = GameState.handleInput(cellIndex);
    if (!result) return;

    if (result.correct) {
      Audio.correct();
      Grid.markCorrect(cellIndex);

      // Score pop
      const rect = cellEl.getBoundingClientRect();
      Effects.scorePop(rect.left + rect.width / 2, rect.top, result.gained);

      // Update progress dots
      _renderProgress(GameState.getPatternLength(), GameState.getInputIndex());
    } else {
      Grid.markWrong(cellIndex);
    }

    _updateHUD();
  }

  // ===== HUD + Progress =====

  function _updateHUD() {
    document.getElementById('hud-score').textContent = Score.getScore();
    document.getElementById('hud-combo').textContent = Score.getCombo();
    document.getElementById('hud-round').textContent = Score.getRoundsCleared() + 1;
  }

  function _renderProgress(total, currentIndex) {
    const container = document.getElementById('pattern-progress');
    container.innerHTML = '';

    for (let i = 0; i < total; i++) {
      const dot = document.createElement('div');
      dot.className = 'progress-dot';
      if (i < currentIndex) dot.classList.add('filled');
      if (i === currentIndex) dot.classList.add('current');
      container.appendChild(dot);
    }
  }

  // ===== Rankings =====

  async function _loadRankings(type = 'daily') {
    const list = document.getElementById('ranking-list');
    list.innerHTML = '<p class="subtitle" style="padding:20px;">랭킹을 불러오는 중...</p>';

    const data = await Ranking.fetchRankings(type);

    if (!data || !data.rankings || data.rankings.length === 0) {
      list.innerHTML = '<p class="subtitle" style="padding:20px;">아직 기록이 없습니다</p>';
      return;
    }

    const browserId = Storage.getBrowserId();
    list.innerHTML = '';

    data.rankings.forEach((entry, idx) => {
      const el = document.createElement('div');
      el.className = 'ranking-entry';
      if (entry.browser_id === browserId) el.classList.add('ranking-me');

      const rankNum = idx + 1;
      let rankCls = 'ranking-rank';
      if (rankNum === 1) rankCls += ' top1';
      else if (rankNum === 2) rankCls += ' top2';
      else if (rankNum === 3) rankCls += ' top3';

      el.innerHTML = `
        <span class="${rankCls}">${rankNum}</span>
        <span class="ranking-name">${_escapeHtml(entry.nickname)}</span>
        <span class="ranking-score">${entry.score.toLocaleString()}</span>
      `;
      list.appendChild(el);
    });
  }

  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Boot
  document.addEventListener('DOMContentLoaded', init);

  return { init };
})();
