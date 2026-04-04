import { handleAuth } from './auth.js';
import { handleAPI } from './api.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    // API routes
    if (url.pathname.startsWith('/api/auth')) {
      return addCors(await handleAuth(request, env, url));
    }
    if (url.pathname.startsWith('/api/')) {
      return addCors(await handleAPI(request, env, url));
    }

    // Serve static files
    return env.ASSETS.fetch(request);
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function addCors(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(response.body, { status: response.status, headers });
}
