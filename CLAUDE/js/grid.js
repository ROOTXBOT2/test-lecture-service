/**
 * grid.js — Grid rendering, cell input handling
 * Supports variable grid sizes (3x3, 4x4, 5x5)
 */
const Grid = (() => {
  let _container = null;
  let _cells = [];
  let _onCellTap = null;

  const COLORS = 8;

  function init(containerId) {
    _container = document.getElementById(containerId);
    _container.innerHTML = '';
    _cells = [];

    const cols = Pattern.getGridCols();
    const size = Pattern.getGridSize();

    _container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    _container.style.gridTemplateRows = `repeat(${cols}, 1fr)`;

    for (let i = 0; i < size; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.index = i;
      cell.dataset.color = i % COLORS;
      cell.addEventListener('click', _handleTap);
      _container.appendChild(cell);
      _cells.push(cell);
    }
  }

  function _handleTap(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    if (_onCellTap) _onCellTap(index, e.currentTarget);
  }

  function onTap(callback) { _onCellTap = callback; }

  function lightCell(index) {
    if (_cells[index]) _cells[index].classList.add('lit');
  }

  function unlightCell(index) {
    if (_cells[index]) _cells[index].classList.remove('lit');
  }

  function unlightAll() {
    _cells.forEach(c => c.classList.remove('lit', 'correct', 'wrong'));
  }

  function markCorrect(index) {
    if (_cells[index]) _cells[index].classList.add('correct');
  }

  function markWrong(index) {
    if (!_cells[index]) return;
    _cells[index].classList.add('wrong');
    setTimeout(() => _cells[index].classList.remove('wrong'), 300);
  }

  function setDisabled(disabled) {
    _container.classList.toggle('disabled', disabled);
  }

  function getCell(index) { return _cells[index]; }

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

      setTimeout(next, 200);
    });
  }

  function initPreview(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    container.style.gridTemplateColumns = 'repeat(4, 1fr)';
    container.style.gridTemplateRows = 'repeat(4, 1fr)';
    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.color = i % COLORS;
      container.appendChild(cell);
    }
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
    container._previewCleanup = () => clearTimeout(timeout);
  }

  function stopPreview(containerId) {
    const container = document.getElementById(containerId);
    if (container && container._previewCleanup) container._previewCleanup();
  }

  return { init, onTap, lightCell, unlightCell, unlightAll, markCorrect, markWrong, setDisabled, getCell, showPattern, initPreview, stopPreview };
})();
