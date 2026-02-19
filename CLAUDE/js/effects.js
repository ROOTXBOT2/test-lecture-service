/**
 * effects.js — CSS class-based effect triggers
 */
const Effects = (() => {
  const body = document.body;
  const gameScreen = () => document.getElementById('screen-game');

  function _flash(el, cls, ms) {
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), ms);
  }

  function comboGlow() {
    _flash(gameScreen(), 'fx-glow', 600);
  }

  function comboShake() {
    _flash(gameScreen(), 'fx-shake', 400);
  }

  function wrongFlash() {
    _flash(body, 'fx-wrong-flash', 300);
  }

  function roundClear() {
    _flash(gameScreen(), 'fx-round-clear', 500);
  }

  function perfect() {
    const el = document.createElement('div');
    el.className = 'fx-perfect';
    el.textContent = 'PERFECT!';
    body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  function clutchVignette() {
    body.classList.add('fx-vignette');
    setTimeout(() => body.classList.remove('fx-vignette'), 1500);
  }

  function timerDanger(on) {
    body.classList.toggle('timer-danger', on);
  }

  function timerCritical(on) {
    body.classList.remove('timer-danger');
    body.classList.toggle('timer-critical', on);
  }

  function clearAll() {
    body.classList.remove('fx-wrong-flash', 'fx-vignette', 'timer-danger', 'timer-critical');
    const gs = gameScreen();
    if (gs) {
      gs.classList.remove('fx-glow', 'fx-shake', 'fx-round-clear');
    }
    body.querySelectorAll('.fx-perfect').forEach(e => e.remove());
    body.querySelectorAll('.score-pop').forEach(e => e.remove());
  }

  function scorePop(x, y, text) {
    const el = document.createElement('div');
    el.className = 'score-pop';
    el.textContent = '+' + text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    body.appendChild(el);
    setTimeout(() => el.remove(), 800);
  }

  function comboGlowBadge(on) {
    const gs = gameScreen();
    if (gs) gs.classList.toggle('combo-glow', on);
  }

  return { comboGlow, comboShake, wrongFlash, roundClear, perfect, clutchVignette, timerDanger, timerCritical, clearAll, scorePop, comboGlowBadge };
})();
