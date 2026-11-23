const reply = (message, status) => Response.json({error:message}, {status, headers:{'Cache-Control':'no-store'}});
let cachedKeys;
function decode(segment) {
  return Uint8Array.from(atob(segment.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
}

async function identity(request, env) {
  const issuer = env.ACCESS_ISSUER;
  const audience = env.ACCESS_AUD;
  if (!issuer || !audience || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)) return null;
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || '';
  if (!token || token.length > 32768) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const parse = s => JSON.parse(new TextDecoder().decode(decode(s)));
  const header = parse(parts[0]), claims = parse(parts[1]);
  const now = Date.now() / 1000;
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || claims.iss !== issuer ||
      !Array.isArray(claims.aud) || !claims.aud.includes(audience) || !Number.isFinite(claims.exp) ||
      claims.exp <= now || (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now)) ||
      typeof claims.sub !== 'string' || !claims.sub || !claims.email) return null;
  if (!cachedKeys || cachedKeys.issuer !== issuer || cachedKeys.until <= now) {
    const res = await fetch(issuer + '/cdn-cgi/access/certs', {signal:AbortSignal.timeout(5000)});
    if (!res.ok) throw Error('Identity provider unavailable');
    cachedKeys = {issuer, until:now + 300, keys:(await res.json()).keys};
  }
  const jwk = cachedKeys.keys.find(k => k.kid === header.kid && k.kty === 'RSA');
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}, false, ['verify']);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(claims.email).trim().toLowerCase()));
  const emailHash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
  if (!(env.AI_INVITE_HASHES || '').split(',').includes(emailHash)) return null;
  return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])) ? claims.sub : null;
}

export async function authorizeAI(request, env) {
  let user;
  try { user = await identity(request, env); } catch { /* Fail closed on invalid or unverifiable tokens. */ }
  if (!user) return reply('AI is available to signed-in, invited testers only.', 403);
  if (request.method !== 'POST') return null;
  if (request.headers.get('Origin') !== new URL(request.url).origin ||
      !request.headers.get('Content-Type')?.startsWith('application/json')) return reply('Invalid request.',403);
  try {
    const gate = env.AI_USAGE.get(env.AI_USAGE.idFromName('pilot'));
    const result = await gate.fetch('https://quota.internal/reserve',{method:'POST',body:user});
    if (result.status === 429) return reply('The daily AI allowance has been used. It resets at midnight UTC.',429);
    if (!result.ok) throw Error('Quota unavailable');
  } catch { return reply('AI is temporarily unavailable. Your answers are still editable.',503); }
  return null;
}

export class AIUsage {
  constructor(ctx) { this.storage = ctx.storage; }
  async fetch(request) {
    const user = await request.text();
    const day = new Date().toISOString().slice(0,10);
    const accepted = await this.storage.transaction(async tx => {
      const prev = await tx.get('daily');
      const usage = prev?.day === day ? prev : {day,total:0,users:{}};
      const count = Object.hasOwn(usage.users,user) ? usage.users[user] : 0;
      if (count >= 30 || usage.total >= 150) return false;
      usage.users[user] = count + 1;
      usage.total++;
      await tx.put('daily',usage);
      return true;
    });
    return new Response(null,{status:accepted ? 204 : 429});
  }
}
