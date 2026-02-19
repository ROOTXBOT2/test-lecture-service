/**
 * score.js — Score calculation, combo, accuracy
 */
const Score = (() => {
  let _score = 0;
  let _combo = 0;
  let _maxCombo = 0;
  let _correctTaps = 0;
  let _totalTaps = 0;
  let _roundsCleared = 0;

  function reset() {
    _score = 0;
    _combo = 0;
    _maxCombo = 0;
    _correctTaps = 0;
    _totalTaps = 0;
    _roundsCleared = 0;
  }

  function addCorrect(patternLength) {
    _correctTaps++;
    _totalTaps++;
    _combo++;
    if (_combo > _maxCombo) _maxCombo = _combo;

    const base = 10 * patternLength;
    const multiplier = Math.min(1 + _combo * 0.1, 3.0);
    const gained = Math.floor(base * multiplier);
    _score += gained;
    return gained;
  }

  function addWrong() {
    _totalTaps++;
    _combo = 0;
  }

  function clearRound() {
    _roundsCleared++;
  }

  function getScore()       { return _score; }
  function getCombo()       { return _combo; }
  function getMaxCombo()    { return _maxCombo; }
  function getRoundsCleared(){ return _roundsCleared; }

  function getAccuracy() {
    if (_totalTaps === 0) return 0;
    return Math.round((_correctTaps / _totalTaps) * 1000) / 10;
  }

  function getSummary() {
    return {
      score: _score,
      combo: _maxCombo,
      accuracy: getAccuracy(),
      rounds: _roundsCleared,
    };
  }

  return { reset, addCorrect, addWrong, clearRound, getScore, getCombo, getMaxCombo, getRoundsCleared, getAccuracy, getSummary };
})();
