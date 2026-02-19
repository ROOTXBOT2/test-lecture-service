/**
 * daily.js — Daily challenge with seeded random
 */
const Daily = (() => {
  let _seed = 0;
  let _active = false;

  function isActive() { return _active; }

  function activate() {
    _active = true;
    _seed = _getDailySeed();
  }

  function deactivate() {
    _active = false;
  }

  function _getDailySeed() {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
      const ch = dateStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // Seeded pseudo-random (mulberry32)
  function _seededRandom() {
    _seed += 0x6D2B79F5;
    let t = _seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate a daily pattern — same seed = same sequence for everyone
   */
  function generatePattern(length, gridSize) {
    // Reset seed for each game to ensure consistency
    _seed = _getDailySeed();
    // Advance seed by round number encoded in length
    for (let skip = 0; skip < length - 3; skip++) {
      _seededRandom();
    }

    const pattern = [];
    for (let i = 0; i < length; i++) {
      let cell;
      do {
        cell = Math.floor(_seededRandom() * gridSize);
      } while (cell === pattern[i - 1]);
      pattern.push(cell);
    }
    return pattern;
  }

  function getTodayLabel() {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  }

  return { isActive, activate, deactivate, generatePattern, getTodayLabel };
})();
