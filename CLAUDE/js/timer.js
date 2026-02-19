/**
 * timer.js — 60-second countdown using requestAnimationFrame
 */
const Timer = (() => {
  const TOTAL = 60;
  let _startTime = 0;
  let _remaining = TOTAL;
  let _running = false;
  let _rafId = null;
  let _onTick = null;
  let _onEnd = null;

  function start(onTick, onEnd) {
    _onTick = onTick;
    _onEnd = onEnd;
    _remaining = TOTAL;
    _running = true;
    _startTime = performance.now();
    _tick();
  }

  function _tick() {
    if (!_running) return;
    const elapsed = (performance.now() - _startTime) / 1000;
    _remaining = Math.max(0, TOTAL - elapsed);

    if (_onTick) _onTick(_remaining);

    if (_remaining <= 0) {
      _running = false;
      if (_onEnd) _onEnd();
      return;
    }

    _rafId = requestAnimationFrame(_tick);
  }

  function stop() {
    _running = false;
    if (_rafId) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  }

  function getRemaining() {
    return _remaining;
  }

  function isRunning() {
    return _running;
  }

  return { start, stop, getRemaining, isRunning, TOTAL };
})();
