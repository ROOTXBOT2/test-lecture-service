/**
 * audio.js — Web Audio API sound effects
 */
const Audio = (() => {
  let ctx = null;
  let enabled = true;

  function _getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function setEnabled(on) {
    enabled = on;
  }

  function _play(freq, type, duration, volume = 0.15) {
    if (!enabled) return;
    try {
      const c = _getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      gain.gain.setValueAtTime(volume, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration);
    } catch (e) { /* ignore audio errors */ }
  }

  // Cell lit during pattern show
  function showTone(index) {
    const base = 300 + (index % 8) * 60;
    _play(base, 'sine', 0.15, 0.1);
  }

  // Correct tap
  function correct() {
    _play(520, 'sine', 0.12, 0.12);
  }

  // Wrong tap
  function wrong() {
    _play(180, 'square', 0.25, 0.15);
  }

  // Round clear
  function roundClear() {
    const c = _getCtx();
    if (!enabled) return;
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => _play(f, 'sine', 0.2, 0.12), i * 80);
    });
  }

  // Game over
  function gameOver() {
    if (!enabled) return;
    [400, 350, 300, 250].forEach((f, i) => {
      setTimeout(() => _play(f, 'triangle', 0.3, 0.1), i * 120);
    });
  }

  // Countdown tick
  function tick() {
    _play(800, 'sine', 0.05, 0.08);
  }

  // Go!
  function go() {
    _play(1000, 'sine', 0.2, 0.15);
  }

  // Combo milestone
  function comboMilestone() {
    if (!enabled) return;
    [600, 800, 1000].forEach((f, i) => {
      setTimeout(() => _play(f, 'sine', 0.15, 0.1), i * 50);
    });
  }

  return { setEnabled, showTone, correct, wrong, roundClear, gameOver, tick, go, comboMilestone };
})();
