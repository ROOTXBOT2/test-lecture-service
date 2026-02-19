/**
 * game-state.js — Game state machine (FSM)
 * Supports difficulty levels and daily challenge mode
 */
const GameState = (() => {
  const STATES = {
    IDLE: 'IDLE',
    COUNTDOWN: 'COUNTDOWN',
    SHOWING: 'SHOWING',
    INPUT: 'INPUT',
    ROUND_CLEAR: 'ROUND_CLEAR',
    PENALTY: 'PENALTY',
    ENDED: 'ENDED',
  };

  let _state = STATES.IDLE;
  let _pattern = [];
  let _inputIndex = 0;
  let _patternLength = 3;
  let _roundStartTime = 0;
  let _lockout = false;
  let _onStateChange = null;
  let _difficulty = 'normal';
  let _mode = 'normal'; // 'normal' or 'daily'

  function getState() { return _state; }
  function getDifficulty() { return _difficulty; }
  function getMode() { return _mode; }

  function onStateChange(cb) { _onStateChange = cb; }

  function _setState(newState, data) {
    const old = _state;
    _state = newState;
    if (_onStateChange) _onStateChange(newState, old, data);
  }

  function setDifficulty(diff) {
    _difficulty = diff;
    Pattern.setDifficulty(diff);
  }

  function setMode(mode) {
    _mode = mode;
    if (mode === 'daily') {
      Daily.activate();
    } else {
      Daily.deactivate();
    }
  }

  function startGame() {
    Score.reset();
    _patternLength = 3;
    _lockout = false;
    _setState(STATES.COUNTDOWN);
  }

  function afterCountdown() {
    Timer.start(
      (remaining) => {
        const hudTimer = document.getElementById('hud-timer');
        if (hudTimer) hudTimer.textContent = Math.ceil(remaining);

        if (remaining <= 5) {
          Effects.timerCritical(true);
        } else if (remaining <= 10) {
          Effects.timerDanger(true);
        }
      },
      () => { endGame(); }
    );
    nextRound();
  }

  function nextRound() {
    if (_mode === 'daily' && Daily.isActive()) {
      _pattern = Daily.generatePattern(_patternLength, Pattern.getGridSize());
    } else {
      _pattern = Pattern.generate(_patternLength);
    }
    _inputIndex = 0;
    _setState(STATES.SHOWING, { pattern: _pattern, length: _patternLength });
  }

  function onPatternShown() {
    _inputIndex = 0;
    _roundStartTime = performance.now();
    _setState(STATES.INPUT, { pattern: _pattern, length: _patternLength });
  }

  function handleInput(cellIndex) {
    if (_state !== STATES.INPUT || _lockout) return;

    const expected = _pattern[_inputIndex];

    if (cellIndex === expected) {
      const gained = Score.addCorrect(_patternLength);
      _inputIndex++;

      const combo = Score.getCombo();

      if (combo > 0 && combo % 5 === 0) {
        Audio.comboMilestone();
        if (combo >= 10) {
          Effects.comboShake();
        } else {
          Effects.comboGlow();
        }
      }

      Effects.comboGlowBadge(combo >= 3);

      if (_inputIndex >= _pattern.length) {
        Score.clearRound();
        const elapsed = performance.now() - _roundStartTime;
        const remaining = Timer.getRemaining();

        if (remaining <= 2) Effects.clutchVignette();
        if (elapsed < _pattern.length * 1000) Effects.perfect();

        _setState(STATES.ROUND_CLEAR, { gained, combo });

        Audio.roundClear();
        Effects.roundClear();

        _patternLength++;
        setTimeout(() => {
          if (_state === STATES.ROUND_CLEAR && Timer.isRunning()) {
            nextRound();
          }
        }, 600);
      }

      return { correct: true, gained, combo, inputIndex: _inputIndex - 1 };
    } else {
      Score.addWrong();
      Effects.comboGlowBadge(false);

      _setState(STATES.PENALTY, { expected, got: cellIndex });

      _lockout = true;
      setTimeout(() => {
        _lockout = false;
        if (Timer.isRunning()) {
          _inputIndex = 0;
          _setState(STATES.SHOWING, { pattern: _pattern, length: _patternLength, retry: true });
        }
      }, 500);

      return { correct: false };
    }
  }

  function endGame() {
    Timer.stop();
    _state = STATES.ENDED;
    const summary = Score.getSummary();
    summary.difficulty = _difficulty;
    summary.mode = _mode;
    _setState(STATES.ENDED, summary);
  }

  function getPatternLength() { return _patternLength; }
  function getCurrentPattern() { return _pattern; }
  function getInputIndex() { return _inputIndex; }

  return {
    STATES, getState, getDifficulty, getMode, onStateChange,
    setDifficulty, setMode, startGame, afterCountdown, onPatternShown,
    handleInput, endGame, getPatternLength, getCurrentPattern, getInputIndex
  };
})();
