/**
 * pattern.js — Pattern generation (no consecutive duplicates)
 */
const Pattern = (() => {
  const GRID_SIZE = 16; // 4x4

  /**
   * Generate a pattern of `length` cell indices (0-15).
   * Ensures no consecutive duplicates.
   */
  function generate(length) {
    const pattern = [];
    for (let i = 0; i < length; i++) {
      let cell;
      do {
        cell = Math.floor(Math.random() * GRID_SIZE);
      } while (cell === pattern[i - 1]);
      pattern.push(cell);
    }
    return pattern;
  }

  return { generate, GRID_SIZE };
})();
