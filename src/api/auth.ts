import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sha256 } from 'js-sha256';

export const authApi = new Hono<{ Bindings: { DB: any }, Variables: { user: any } }>();

const hashPassword = (password: string) => sha256(password);

// Auth Middleware to check session
export const authMiddleware = async (c: any, next: () => Promise<void>) => {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) return c.json({ error: 'Unauthorized' }, 401);

  const session = await c.env.DB.prepare(`SELECT user_id FROM sessions WHERE id = ? AND expires_at > datetime('now')`).bind(sessionId).first();
  if (!session) {
    deleteCookie(c, 'session_id');
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const user = await c.env.DB.prepare('SELECT id, email, name FROM users WHERE id = ?').bind(session.user_id).first();
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  c.set('user', user);
  await next();
};

authApi.post('/register', async (c) => {
  const { email, password, name } = await c.req.json();
  if (!email || !password || !name) return c.json({ error: 'Missing fields' }, 400);

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return c.json({ error: 'Email already in use' }, 400);

  const userId = crypto.randomUUID();
  const hashedPassword = hashPassword(password);
  
  await c.env.DB.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)')
    .bind(userId, email, hashedPassword, name)
    .run();

  const sessionId = crypto.randomUUID();
  // 30 days expiry
  await c.env.DB.prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))`)
    .bind(sessionId, userId)
    .run();

  setCookie(c, 'session_id', sessionId, { httpOnly: true, path: '/', maxAge: 30 * 24 * 60 * 60 });
  return c.json({ user: { id: userId, email, name } });
});

authApi.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  
  if (!user || user.password_hash !== hashPassword(password)) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const sessionId = crypto.randomUUID();
  await c.env.DB.prepare(`INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))`)
    .bind(sessionId, user.id)
    .run();

  setCookie(c, 'session_id', sessionId, { httpOnly: true, path: '/', maxAge: 30 * 24 * 60 * 60 });
  return c.json({ user: { id: user.id, email: user.email, name: user.name } });
});

authApi.post('/logout', async (c) => {
  const sessionId = getCookie(c, 'session_id');
  if (sessionId) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }
  deleteCookie(c, 'session_id', { path: '/' });
  return c.json({ success: true });
});

authApi.get('/me', authMiddleware, async (c) => {
  return c.json({ user: c.get('user') });
});
