/**
 * grid.js — Grid rendering, cell input handling
 */
const Grid = (() => {
  let _container = null;
  let _cells = [];
  let _onCellTap = null;

  const COLORS = 8; // number of color variants

  function init(containerId) {
    _container = document.getElementById(containerId);
    _container.innerHTML = '';
    _cells = [];

    for (let i = 0; i < Pattern.GRID_SIZE; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      cell.dataset.color = i % COLORS;
      cell.addEventListener('click', _handleTap);
      cell.addEventListener('touchstart', _preventDouble, { passive: true });
      _container.appendChild(cell);
      _cells.push(cell);
    }
  }

  function _preventDouble(e) {
    // handled by click
  }

  function _handleTap(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    if (_onCellTap) _onCellTap(index, e.currentTarget);
  }

  function onTap(callback) {
    _onCellTap = callback;
  }

  function lightCell(index) {
    const cell = _cells[index];
    if (!cell) return;
    cell.classList.add('lit');
  }

  function unlightCell(index) {
    const cell = _cells[index];
    if (!cell) return;
    cell.classList.remove('lit');
  }

  function unlightAll() {
    _cells.forEach(c => c.classList.remove('lit', 'correct', 'wrong'));
  }

  function markCorrect(index) {
    const cell = _cells[index];
    if (!cell) return;
    cell.classList.add('correct');
  }

  function markWrong(index) {
    const cell = _cells[index];
    if (!cell) return;
    cell.classList.add('wrong');
    setTimeout(() => cell.classList.remove('wrong'), 300);
  }

  function setDisabled(disabled) {
    _container.classList.toggle('disabled', disabled);
  }

  function getCell(index) {
    return _cells[index];
  }

  /**
   * Show pattern sequence with animation
   * @returns {Promise} resolves when animation is complete
   */
  function showPattern(pattern, speed = 400) {
    return new Promise(resolve => {
      setDisabled(true);
      unlightAll();
      let i = 0;

      function next() {
        if (i > 0) unlightCell(pattern[i - 1]);
        if (i >= pattern.length) {
          setDisabled(false);
          resolve();
          return;
        }
        lightCell(pattern[i]);
        Audio.showTone(pattern[i]);
        i++;
        setTimeout(next, speed);
      }

      // Short delay before starting
      setTimeout(next, 200);
    });
  }

  // Initialize a static preview grid (decorative, on start screen)
  function initPreview(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (let i = 0; i < Pattern.GRID_SIZE; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.color = i % COLORS;
      container.appendChild(cell);
    }
    // Animate a few cells
    _animatePreview(container);
  }

  function _animatePreview(container) {
    const cells = container.querySelectorAll('.cell');
    let timeout;

    function loop() {
      const idx = Math.floor(Math.random() * cells.length);
      cells[idx].classList.add('lit');
      setTimeout(() => cells[idx].classList.remove('lit'), 600);
      timeout = setTimeout(loop, 800 + Math.random() * 400);
    }
    loop();

    // Store cleanup reference
    container._previewCleanup = () => clearTimeout(timeout);
  }

  function stopPreview(containerId) {
    const container = document.getElementById(containerId);
    if (container && container._previewCleanup) {
      container._previewCleanup();
    }
  }

  return { init, onTap, lightCell, unlightCell, unlightAll, markCorrect, markWrong, setDisabled, getCell, showPattern, initPreview, stopPreview };
})();
