(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const core = window.PiliPlusCore;
  const KEYS = { theme: 'pili-web-theme-v1', favorites: 'pili-web-favorites-v1' };
  let toastTimer;
  let lastParsed = null;

  function readStorage(key, fallback) {
    try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); }
    catch (_) { return fallback; }
  }
  function writeStorage(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (_) { showToast('浏览器存储不可用，本次更改未保存。'); return false; }
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  function showToast(message) {
    const toast = $('toast'); toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  function setTheme(theme, persist) {
    const next = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = next === 'light' ? '#f5f6fa' : '#0b0d12';
    $('theme-toggle').setAttribute('aria-label', next === 'light' ? '切换到深色主题' : '切换到浅色主题');
    if (persist) writeStorage(KEYS.theme, next);
  }
  function openDestination(parsed) {
    if (!parsed || !parsed.ok || !core.isAllowedDestination(parsed.url)) { showToast('链接检查未通过，没有打开页面。'); return; }
    window.open(parsed.url, '_blank', 'noopener,noreferrer');
  }
  function renderResult(parsed, original) {
    lastParsed = parsed;
    $('result-section').hidden = false;
    $('result-title').textContent = parsed.ok ? parsed.label : '无法识别';
    const icon = parsed.ok && parsed.kind === 'search'
      ? '<svg viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.8"></circle><path d="m16 16 4.5 4.5"></path></svg>'
      : '<svg viewBox="0 0 24 24"><path d="m9 6 9 6-9 6z"></path><rect x="3" y="3" width="18" height="18" rx="5"></rect></svg>';
    const safeDetails = escapeHtml(parsed.message || parsed.detail || '无法识别输入内容。');
    $('result-card').innerHTML = '<span class="result-symbol">' + icon + '</span><div class="result-copy"><strong>' + escapeHtml(parsed.ok ? (parsed.label + (parsed.kind === 'search' ? ' · ' + parsed.query : '')) : '输入内容无法识别') + '</strong><p>' + safeDetails + '</p></div><div class="result-actions">' + (parsed.ok ? '<button type="button" class="outline-button" id="save-result">收藏</button><button type="button" class="primary-button" id="open-result">打开 ↗</button>' : '') + '</div>';
    if (parsed.ok) {
      $('open-result').addEventListener('click', () => openDestination(parsed));
      $('save-result').addEventListener('click', () => openFavoriteDialog(original || parsed.query || parsed.url, parsed.kind === 'search' ? parsed.query : (parsed.label || 'B 站链接')));
    }
    $('result-section').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function handleSearch(value) {
    const original = String(value || '').trim();
    if (!original) { showToast('输入关键词或粘贴一个 B 站链接。'); $('search-input').focus(); return; }
    const parsed = core.parseBiliInput(original);
    renderResult(parsed, original);
  }
  function getFavorites() {
    const value = readStorage(KEYS.favorites, []);
    return Array.isArray(value) ? value.filter((x) => x && typeof x.id === 'string' && typeof x.name === 'string' && typeof x.target === 'string') : [];
  }
  function saveFavorites(list) { if (writeStorage(KEYS.favorites, list)) renderFavorites(); }
  function favoriteKind(target) {
    const parsed = core.parseBiliInput(target);
    return parsed.ok ? parsed.kind : 'search';
  }
  function renderFavorites() {
    const favorites = getFavorites();
    $('favorite-count').textContent = String(favorites.length);
    $('favorites-empty').hidden = favorites.length > 0;
    $('favorites-list').innerHTML = favorites.map((item) => {
      const kind = favoriteKind(item.target);
      const glyph = kind === 'search' ? '⌕' : '▶';
      return '<div class="favorite-row"><button class="favorite-open" type="button" data-open-favorite="' + escapeHtml(item.id) + '"><span class="favorite-mini-icon" aria-hidden="true"><span>' + glyph + '</span></span><span class="favorite-details"><b>' + escapeHtml(item.name) + '</b><small>' + escapeHtml(item.target) + '</small></span></button><button class="favorite-remove" type="button" aria-label="删除收藏 ' + escapeHtml(item.name) + '" data-remove-favorite="' + escapeHtml(item.id) + '">×</button></div>';
    }).join('');
    $('favorites-list').querySelectorAll('[data-open-favorite]').forEach((button) => button.addEventListener('click', () => {
      const item = getFavorites().find((f) => f.id === button.dataset.openFavorite); if (!item) return;
      const parsed = core.parseBiliInput(item.target); if (parsed.ok) openDestination(parsed); else showToast(parsed.message || '该收藏无法打开。');
    }));
    $('favorites-list').querySelectorAll('[data-remove-favorite]').forEach((button) => button.addEventListener('click', () => {
      const next = getFavorites().filter((f) => f.id !== button.dataset.removeFavorite); saveFavorites(next); showToast('已删除收藏。');
    }));
  }
  function openFavoriteDialog(target, name) {
    $('favorite-name').value = name && !/^B 站/.test(name) ? name : '';
    $('favorite-target').value = target || '';
    const dialog = $('favorite-dialog'); if (typeof dialog.showModal === 'function') dialog.showModal(); else showToast('当前浏览器不支持收藏弹窗，请使用较新的 Safari。');
    $('favorite-name').focus();
  }
  function createFavorite(name, target) {
    const cleanName = String(name || '').trim(); const cleanTarget = String(target || '').trim();
    if (!cleanName || !cleanTarget) { showToast('请填写名称和搜索词或链接。'); return false; }
    const parsed = core.parseBiliInput(cleanTarget);
    if (!parsed.ok) { showToast(parsed.message || '请检查链接内容。'); return false; }
    const favorites = getFavorites();
    if (favorites.some((f) => f.target === cleanTarget)) { showToast('这个入口已经收藏过了。'); return false; }
    if (favorites.length >= 30) { showToast('最多保存 30 个常用入口。'); return false; }
    const id = (window.crypto && typeof window.crypto.randomUUID === 'function') ? window.crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
    favorites.unshift({ id, name: cleanName, target: cleanTarget, createdAt: new Date().toISOString() });
    saveFavorites(favorites); return true;
  }
  function updateNetwork() {
    const online = navigator.onLine;
    $('network-status').classList.toggle('offline', !online);
    $('network-label').textContent = online ? '网络已连接' : '当前离线';
    if (!online) $('network-status').title = '离线时只能打开已缓存的网页外壳，B 站内容需要网络。';
    else $('network-status').removeAttribute('title');
  }
  function setupEvents() {
    $('search-form').addEventListener('submit', (event) => { event.preventDefault(); handleSearch($('search-input').value); });
    $('search-input').addEventListener('keydown', (event) => { if (event.key === 'Escape') { $('search-input').value = ''; $('result-section').hidden = true; } });
    $('theme-toggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light', true));
    $('clear-result').addEventListener('click', () => { $('result-section').hidden = true; $('search-input').value = ''; lastParsed = null; });
    ['add-favorite-open', 'empty-add-favorite'].forEach((id) => $(id).addEventListener('click', () => openFavoriteDialog('', '')));
    $('close-favorite-dialog').addEventListener('click', () => $('favorite-dialog').close());
    $('cancel-favorite').addEventListener('click', () => $('favorite-dialog').close());
    $('favorite-form').addEventListener('submit', (event) => {
      event.preventDefault();
      if (createFavorite($('favorite-name').value, $('favorite-target').value)) { $('favorite-dialog').close(); $('favorite-form').reset(); showToast('已保存到本机收藏。'); }
    });
    $('install-help').addEventListener('click', () => $('install-dialog').showModal());
    $('close-install-dialog').addEventListener('click', () => $('install-dialog').close());
    $('done-install-guide').addEventListener('click', () => $('install-dialog').close());
    window.addEventListener('online', updateNetwork); window.addEventListener('offline', updateNetwork);
  }
  function init() {
    const savedTheme = readStorage(KEYS.theme, null);
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(savedTheme || (prefersLight ? 'light' : 'dark'), false);
    $('year').textContent = String(new Date().getFullYear());
    setupEvents(); renderFavorites(); updateNetwork();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => { /* Offline status remains visible; app still works online. */ }));
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
