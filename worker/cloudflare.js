import { pagePaths } from '../dist/routes.js';
import { reflect } from './index.js';

const pages = new Set(pagePaths);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/reflection') return reflect(request, env);
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
