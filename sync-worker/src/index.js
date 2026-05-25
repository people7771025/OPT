/* ============================================================
 * OPT 跨裝置同步 Worker
 * ------------------------------------------------------------
 * 純儲存：前端負責「不覆蓋、只合併」的邏輯，這支只負責
 * 用同步碼當 key 存 / 取一整包 JSON。
 *
 *   GET  /v1/sync?code=XXXX  -> { data, ts }   （沒有則 data=null, ts=0）
 *   PUT  /v1/sync?code=XXXX  body={ data }     -> { ok:true, ts }
 *
 * 防護：
 *   - CORS 只允許 GitHub Pages 來源 + localhost（開發用）
 *   - 同步碼必須是 16 碼英數，當作 KV key 與「密碼」
 *   - body 大小上限，避免被塞爆
 * ============================================================ */

const ALLOWED_ORIGINS = new Set([
  'https://people7771025.github.io',
]);
const MAX_BODY = 512 * 1024;          // 512 KB，一般進度遠小於此
const CODE_RE = /^[A-Za-z0-9]{16}$/;  // 同步碼格式

function isAllowedOrigin(origin) {
  if (!origin) return true; // 無 Origin（curl / 同源）放行；真正的門檻是同步碼
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function corsHeaders(origin) {
  const allow = isAllowedOrigin(origin) && origin ? origin : '';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname !== '/v1/sync') {
      return json({ error: 'not_found' }, 404, headers);
    }

    if (!isAllowedOrigin(origin)) {
      return json({ error: 'forbidden_origin' }, 403, headers);
    }

    const code = url.searchParams.get('code') || '';
    if (!CODE_RE.test(code)) {
      return json({ error: 'bad_code' }, 400, headers);
    }
    const key = `blob:${code}`;

    if (request.method === 'GET') {
      const val = await env.OPT_SYNC.get(key);
      if (!val) return json({ data: null, ts: 0 }, 200, headers);
      // 已是 { data, ts } 形狀，直接回傳
      return new Response(val, {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'PUT') {
      const text = await request.text();
      if (text.length > MAX_BODY) {
        return json({ error: 'too_large' }, 413, headers);
      }
      let body;
      try { body = JSON.parse(text); } catch { return json({ error: 'bad_json' }, 400, headers); }
      const ts = Date.now();
      const record = JSON.stringify({ data: body && body.data != null ? body.data : {}, ts });
      await env.OPT_SYNC.put(key, record);
      return json({ ok: true, ts }, 200, headers);
    }

    return json({ error: 'method_not_allowed' }, 405, headers);
  },
};
