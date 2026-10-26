(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PiliPlusCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VIDEO_ID = /\b(BV[a-zA-Z0-9]{10}|av\d{1,20})\b/i;
  const ALLOWED_HOSTS = new Set(['bilibili.com', 'www.bilibili.com', 'm.bilibili.com', 'b23.tv', 'bili2233.cn', 't.bilibili.com', 'space.bilibili.com', 'live.bilibili.com']);

  function safeHttpsUrl(input) {
    let raw = String(input || '').trim();
    if (!raw) return null;
    if (/^\/\//.test(raw)) raw = 'https:' + raw;
    else if (/^(?:www\.)?(?:bilibili\.com|b23\.tv|bili2233\.cn)(?:\/|$)/i.test(raw)) raw = 'https://' + raw;
    if (!/^https:\/\//i.test(raw)) return null;
    try {
      const url = new URL(raw);
      if (url.protocol !== 'https:' || url.username || url.password) return null;
      const hostname = url.hostname.toLowerCase();
      if (!ALLOWED_HOSTS.has(hostname) && !hostname.endsWith('.bilibili.com')) return null;
      return url;
    } catch (_) { return null; }
  }

  function parseBiliInput(input) {
    const raw = String(input || '').trim();
    if (!raw) return { ok: false, reason: 'empty', message: '先输入关键词、BV 号或视频链接。' };
    const idMatch = raw.match(VIDEO_ID);
    const isUrlish = /^(?:[a-z][a-z\d+.-]*:|\/\/|(?:www\.)?(?:[\w-]+\.)?(?:bilibili\.com|b23\.tv|bili2233\.cn)(?:\/|$))/i.test(raw);
    if (idMatch && !isUrlish) {
      const id = idMatch[1];
      if (/^BV/i.test(id)) return { ok: true, kind: 'video', url: 'https://www.bilibili.com/video/' + id, label: 'B 站视频', detail: '已识别视频号 ' + id };
      const aid = id.match(/^av(\d+)$/i)[1];
      return { ok: true, kind: 'video', url: 'https://www.bilibili.com/video/av' + aid, label: 'B 站视频', detail: '已识别视频号 av' + aid };
    }
    const candidate = isUrlish ? safeHttpsUrl(raw) : null;
    if (isUrlish && !candidate) return { ok: false, reason: 'invalid-url', message: '暂不支持这个链接。请使用 HTTPS 的 B 站或 b23.tv 链接。' };
    if (candidate) {
      const hostname = candidate.hostname.toLowerCase();
      if (hostname === 'b23.tv' || hostname === 'bili2233.cn') return { ok: true, kind: 'shortlink', url: candidate.href, label: 'B 站短链接', detail: '将交由 B 站短链服务跳转，短链目标无法在此静态页面内预先验证。' };
      const path = candidate.pathname;
      const pathId = path.match(/\/video\/(BV[a-zA-Z0-9]{10}|av\d+)/i);
      const kind = pathId ? 'video' : (path.startsWith('/bangumi/play/') ? 'bangumi' : (path.startsWith('/read/') ? 'article' : (hostname.startsWith('live.') ? 'live' : (hostname === 'space.bilibili.com' ? 'user' : 'page'))));
      return { ok: true, kind, url: candidate.href, label: ({ video: 'B 站视频', bangumi: '番剧页面', article: '专栏页面', live: '直播间', user: '用户主页', page: 'B 站页面' })[kind], detail: pathId ? '已识别视频链接 ' + pathId[1] : '已识别 B 站 HTTPS 页面链接' };
    }
    return { ok: true, kind: 'search', query: raw, url: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(raw), label: 'B 站搜索', detail: '将在 B 站搜索“' + raw + '”' };
  }

  function isAllowedDestination(input) {
    const url = safeHttpsUrl(input);
    return Boolean(url);
  }

  return { parseBiliInput, isAllowedDestination };
});
