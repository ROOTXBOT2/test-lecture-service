/**
 * game-state.js — Game state machine (FSM)
 *
 * States: IDLE → COUNTDOWN → SHOWING → INPUT → ROUND_CLEAR / PENALTY → SHOWING → ENDED
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
  let _patternLength = 3; // starts at 3, +1 per round
  let _roundStartTime = 0;
  let _lockout = false;
  let _onStateChange = null;

  function getState() { return _state; }

  function onStateChange(cb) { _onStateChange = cb; }

  function _setState(newState, data) {
    const old = _state;
    _state = newState;
    if (_onStateChange) _onStateChange(newState, old, data);
  }

  function startGame() {
    Score.reset();
    _patternLength = 3;
    _setState(STATES.COUNTDOWN);
  }

  function afterCountdown() {
    Timer.start(
      (remaining) => {
        // Timer tick callback
        const hudTimer = document.getElementById('hud-timer');
        if (hudTimer) hudTimer.textContent = Math.ceil(remaining);

        // Timer warning effects
        if (remaining <= 5) {
          Effects.timerCritical(true);
        } else if (remaining <= 10) {
          Effects.timerDanger(true);
        }
      },
      () => {
        // Timer ended
        endGame();
      }
    );
    nextRound();
  }

  function nextRound() {
    _pattern = Pattern.generate(_patternLength);
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
      // Correct
      const gained = Score.addCorrect(_patternLength);
      _inputIndex++;

      const combo = Score.getCombo();

      // Check combo milestones
      if (combo > 0 && combo % 5 === 0) {
        Audio.comboMilestone();
        if (combo >= 10) {
          Effects.comboShake();
        } else {
          Effects.comboGlow();
        }
      }

      Effects.comboGlowBadge(combo >= 3);

      // Check if round complete
      if (_inputIndex >= _pattern.length) {
        Score.clearRound();
        const elapsed = performance.now() - _roundStartTime;
        const remaining = Timer.getRemaining();

        // Clutch clear: less than 2 seconds left on timer
        if (remaining <= 2) {
          Effects.clutchVignette();
        }

        // Fast clear: under 1 second per step
        if (elapsed < _pattern.length * 1000) {
          Effects.perfect();
        }

        _setState(STATES.ROUND_CLEAR, { gained, combo });

        Audio.roundClear();
        Effects.roundClear();

        // Move to next round
        _patternLength++;
        setTimeout(() => {
          if (_state === STATES.ROUND_CLEAR && Timer.isRunning()) {
            nextRound();
          }
        }, 600);
      }

      return { correct: true, gained, combo, inputIndex: _inputIndex - 1 };
    } else {
      // Wrong
      Score.addWrong();
      Effects.comboGlowBadge(false);

      _setState(STATES.PENALTY, { expected, got: cellIndex });

      // Lockout 0.5s
      _lockout = true;
      setTimeout(() => {
        _lockout = false;
        if (Timer.isRunning()) {
          // Retry same pattern
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
    _setState(STATES.ENDED, Score.getSummary());
  }

  function getPatternLength() { return _patternLength; }
  function getCurrentPattern() { return _pattern; }
  function getInputIndex() { return _inputIndex; }

  return {
    STATES, getState, onStateChange, startGame, afterCountdown, onPatternShown,
    handleInput, endGame, getPatternLength, getCurrentPattern, getInputIndex
  };
})();
