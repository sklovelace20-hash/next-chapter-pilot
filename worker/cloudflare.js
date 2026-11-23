import { pagePaths } from '../dist/routes.js';
import { reflect } from './index.js';

import { authorizeAI } from './ai-access.js';
export { AIUsage } from './ai-access.js';

const pages = new Set(pagePaths);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/reflection') {
      const denial = await authorizeAI(request, env);
      if (denial) return denial;
      if (request.method === 'GET' && url.searchParams.has('signin')) return Response.redirect(new URL('/',url),302);
      return reflect(request, env);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    if (url.pathname.replace(/\/$/, '') === '/accomplishments') {
      url.pathname = '/smile-file';
      return Response.redirect(url, 301);
    }
    if (url.pathname === '/middle-theory-growth-library.html') {
      return Response.redirect(new URL('/library', url), 302);
    }
    if (pages.has(url.pathname.replace(/\/$/, '') || '/')) {
      url.pathname = '/index.html';
      return env.ASSETS.fetch(new Request(url, request));
    }
    return env.ASSETS.fetch(request);
  }
};
