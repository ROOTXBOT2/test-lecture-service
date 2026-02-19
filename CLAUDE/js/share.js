/**
 * share.js — SNS share functionality
 */
const Share = (() => {
  const SITE_URL = 'https://pattern-battle.pages.dev';
  let _lastResult = null;

  function setResult(data) {
    _lastResult = data;
  }

  function _buildText() {
    if (!_lastResult) return '';
    const d = _lastResult;
    const diffNames = { easy: '쉬움 3x3', normal: '보통 4x4', hard: '어려움 5x5' };
    const diff = diffNames[d.difficulty] || '보통 4x4';

    return [
      `패턴 배틀 - ${d.score.toLocaleString()}점!`,
      `${diff} | R${d.rounds} | 콤보 ${d.combo} | 정확도 ${d.accuracy}%`,
      d.rank ? `랭크 #${d.rank}` : '',
      '',
      '나도 도전하기:',
      SITE_URL,
    ].filter(Boolean).join('\n');
  }

  function shareX() {
    const text = _buildText();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
  }

  function shareKakao() {
    // Kakao SDK not loaded — fallback to clipboard
    const text = _buildText();
    _copyToClipboard(text);
    _showToast('카카오톡에 붙여넣기 해주세요!');
  }

  function copyLink() {
    const text = _buildText();
    _copyToClipboard(text);
    _showToast('결과가 복사되었습니다!');
  }

  function _copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => _fallbackCopy(text));
    } else {
      _fallbackCopy(text);
    }
  }

  function _fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  function _showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  return { setResult, shareX, shareKakao, copyLink };
})();
