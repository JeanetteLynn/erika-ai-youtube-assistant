export async function handleAuth(request, env, url) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const body = await request.json();

  if (url.pathname === '/api/auth/register') {
    return register(body, env);
  }
  if (url.pathname === '/api/auth/login') {
    return login(body, env);
  }
  if (url.pathname === '/api/auth/logout') {
    return logout(request, env);
  }
  if (url.pathname === '/api/auth/me') {
    return getMe(request, env);
  }

  return json({ error: 'Not found' }, 404);
}

async function register({ email, password, name }, env) {
  if (!email || !password || !name) {
    return json({ error: 'Email, password, and name are required' }, 400);
  }

  // Check if user exists
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
  if (existing) {
    return json({ error: 'An account with this email already exists' }, 409);
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const result = await env.DB.prepare(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
  ).bind(email.toLowerCase(), passwordHash, name).run();

  const userId = result.meta.last_row_id;

  // Create initial progress
  await env.DB.prepare(
    'INSERT INTO user_progress (user_id, step, step_question) VALUES (?, 1, 0)'
  ).bind(userId).run();

  // Create session
  const token = await createSession(userId, env);

  return json({ token, user: { id: userId, email: email.toLowerCase(), name } });
}

async function login({ email, password }, env) {
  if (!email || !password) {
    return json({ error: 'Email and password are required' }, 400);
  }

  const user = await env.DB.prepare(
    'SELECT id, email, password_hash, name FROM users WHERE email = ?'
  ).bind(email.toLowerCase()).first();

  if (!user) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return json({ error: 'Invalid email or password' }, 401);
  }

  const token = await createSession(user.id, env);
  return json({ token, user: { id: user.id, email: user.email, name: user.name } });
}

async function logout(request, env) {
  const token = getToken(request);
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  return json({ ok: true });
}

async function getMe(request, env) {
  const user = await authenticate(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  return json({ user });
}

// Auth helpers
export async function authenticate(request, env) {
  const token = getToken(request);
  if (!token) return null;

  const session = await env.DB.prepare(
    'SELECT s.user_id, u.email, u.name FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.token = ? AND s.expires_at > datetime(\'now\')'
  ).bind(token).first();

  if (!session) return null;
  return { id: session.user_id, email: session.email, name: session.name };
}

function getToken(request) {
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

async function createSession(userId, env) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  await env.DB.prepare(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).bind(userId, token, expiresAt).run();
  return token;
}

function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt, b => b.toString(16).padStart(2, '0')).join('');

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashHex = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

async function verifyPassword(password, stored) {
  const [saltHex, storedHash] = stored.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(h => parseInt(h, 16)));
  const encoder = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashHex = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === storedHash;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
