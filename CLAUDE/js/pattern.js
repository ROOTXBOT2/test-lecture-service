/**
 * pattern.js — Pattern generation (no consecutive duplicates)
 * Supports variable grid sizes for difficulty
 */
const Pattern = (() => {
  let GRID_SIZE = 16; // default 4x4
  let GRID_COLS = 4;

  const DIFFICULTIES = {
    easy:   { cols: 3, size: 9 },
    normal: { cols: 4, size: 16 },
    hard:   { cols: 5, size: 25 },
  };

  function setDifficulty(diff) {
    const d = DIFFICULTIES[diff] || DIFFICULTIES.normal;
    GRID_COLS = d.cols;
    GRID_SIZE = d.size;
  }

  function getDifficulty() {
    if (GRID_SIZE === 9) return 'easy';
    if (GRID_SIZE === 25) return 'hard';
    return 'normal';
  }

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

  function getGridSize() { return GRID_SIZE; }
  function getGridCols() { return GRID_COLS; }

  return { generate, setDifficulty, getDifficulty, getGridSize, getGridCols, DIFFICULTIES };
})();
