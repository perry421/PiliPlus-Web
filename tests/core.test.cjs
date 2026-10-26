const test = require('node:test');
const assert = require('node:assert/strict');
const { parseBiliInput, isAllowedDestination } = require('../core.js');

test('parses a BV identifier without requiring a URL', () => {
  const result = parseBiliInput('BV1xx411c7mD');
  assert.equal(result.ok, true);
  assert.equal(result.kind, 'video');
  assert.equal(result.url, 'https://www.bilibili.com/video/BV1xx411c7mD');
});

test('parses an av identifier', () => {
  const result = parseBiliInput('av170001');
  assert.equal(result.ok, true);
  assert.equal(result.url, 'https://www.bilibili.com/video/av170001');
});

test('recognizes a canonical video URL', () => {
  const result = parseBiliInput('https://www.bilibili.com/video/BV1xx411c7mD/?p=2');
  assert.equal(result.ok, true);
  assert.equal(result.kind, 'video');
  assert.match(result.url, /\/video\/BV1xx411c7mD\/\?p=2$/);
});

test('preserves b23.tv short links as an external redirect', () => {
  const result = parseBiliInput('https://b23.tv/AbCdEf');
  assert.equal(result.ok, true);
  assert.equal(result.kind, 'shortlink');
  assert.equal(result.url, 'https://b23.tv/AbCdEf');
  assert.match(result.detail, /无法在此静态页面内预先验证/);
});

test('normalizes a Bilibili host without a scheme', () => {
  const result = parseBiliInput('www.bilibili.com/video/av123');
  assert.equal(result.ok, true);
  assert.equal(result.url, 'https://www.bilibili.com/video/av123');
});

test('turns ordinary text into a Bilibili search URL', () => {
  const result = parseBiliInput('机器学习入门');
  assert.equal(result.ok, true);
  assert.equal(result.kind, 'search');
  assert.equal(result.url, 'https://search.bilibili.com/all?keyword=' + encodeURIComponent('机器学习入门'));
});

test('rejects unsupported external hosts instead of navigating them', () => {
  const result = parseBiliInput('https://example.com/video/BV1xx411c7mD');
  assert.equal(result.ok, false);
  assert.equal(isAllowedDestination('https://example.com/'), false);
});

test('rejects unsupported schemes and URLs with embedded credentials', () => {
  const result = parseBiliInput('javascript:alert(1)');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'invalid-url');
  assert.equal(isAllowedDestination('https://user:pass@www.bilibili.com/'), false);
});

test('handles empty input with an actionable message', () => {
  const result = parseBiliInput('   ');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'empty');
});

test('parses bangumi and live URLs', () => {
  assert.equal(parseBiliInput('https://www.bilibili.com/bangumi/play/ss1').kind, 'bangumi');
  assert.equal(parseBiliInput('https://live.bilibili.com/1').kind, 'live');
});
