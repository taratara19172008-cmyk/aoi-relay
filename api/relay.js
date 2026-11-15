// AoiMusic relay — Vercel Serverless Function
// 网页直连 Apple Music 接口会被苹果按来源（Origin）拦截（网页播放器令牌只认 music.apple.com）。
// 本中转在服务器端以 music.apple.com 的来源向苹果发请求，再带 CORS 头返回给网页。
// 不保存、不记录任何令牌；Authorization / Music-User-Token 仅透传。
//
// 用法： GET/POST https://<部署地址>/api/relay?target=<url 编码后的完整苹果接口地址>

const ALLOWED = /(^|\.)music\.apple\.com$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Music-User-Token, Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const target = req.query.target;
  if (!target) return res.status(400).json({ error: 'missing target' });
  let u;
  try { u = new URL(target); } catch { return res.status(400).json({ error: 'bad target' }); }
  if (u.protocol !== 'https:' || !ALLOWED.test(u.hostname)) {
    return res.status(403).json({ error: 'host not allowed' });
  }

  const headers = {
    'Origin': 'https://music.apple.com',
    'Referer': 'https://music.apple.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
  };
  for (const h of ['authorization', 'music-user-token', 'content-type', 'accept', 'accept-language']) {
    if (req.headers[h]) headers[h] = req.headers[h];
  }

  const init = { method: req.method, headers, redirect: 'follow' };
  if (!['GET', 'HEAD'].includes(req.method)) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    init.body = Buffer.concat(chunks);
  }

  try {
    const r = await fetch(u, init);
    const buf = Buffer.from(await r.arrayBuffer());
    res.status(r.status);
    const ct = r.headers.get('content-type');
    if (ct) res.setHeader('Content-Type', ct);
    const cc = r.headers.get('cache-control');
    if (cc) res.setHeader('Cache-Control', cc);
    return res.send(buf);
  } catch (e) {
    return res.status(502).json({ error: 'relay fetch failed', detail: String(e) });
  }
}
