/**
 * storage.js — localStorage + browser ID via cookie
 */
const Storage = (() => {
  const PREFIX = 'pattern_battle_';

  function getBrowserId() {
    let id = localStorage.getItem(PREFIX + 'browser_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : _fallbackUUID();
      localStorage.setItem(PREFIX + 'browser_id', id);
    }
    return id;
  }

  function _fallbackUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function getNickname() {
    return localStorage.getItem(PREFIX + 'nickname') || '';
  }

  function setNickname(name) {
    localStorage.setItem(PREFIX + 'nickname', name.trim().slice(0, 12));
  }

  function getBestScore() {
    return parseInt(localStorage.getItem(PREFIX + 'best_score') || '0', 10);
  }

  function setBestScore(score) {
    const best = getBestScore();
    if (score > best) {
      localStorage.setItem(PREFIX + 'best_score', String(score));
    }
  }

  function getSoundEnabled() {
    const v = localStorage.getItem(PREFIX + 'sound');
    return v === null ? true : v === '1';
  }

  function setSoundEnabled(on) {
    localStorage.setItem(PREFIX + 'sound', on ? '1' : '0');
  }

  return { getBrowserId, getNickname, setNickname, getBestScore, setBestScore, getSoundEnabled, setSoundEnabled };
})();
