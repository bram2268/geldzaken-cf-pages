import { Hono } from 'hono';
import { authMiddleware } from './auth';

export const dataApi = new Hono<{ Bindings: { DB: any }, Variables: { user: any } }>();

dataApi.use('/*', authMiddleware);

// --- Subscriptions ---
dataApi.get('/subscriptions', async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY aangemaakt_op DESC').bind(user.id).all();
  return c.json(results || []);
});

dataApi.post('/subscriptions', async (c) => {
  const user = c.get('user');
  const sub = await c.req.json();
  const id = sub.id || crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO subscriptions (id, user_id, naam, bedrag, cyclus, status, betaalmethode, logo, beschrijving, valuta, categorie, volgende_betaling)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, user.id, sub.naam, sub.bedrag, sub.cyclus, sub.status, sub.betaalmethode, sub.logo || null, sub.beschrijving || null, sub.valuta || 'EUR', sub.categorie, sub.volgende_betaling
  ).run();
  
  const created = await c.env.DB.prepare('SELECT * FROM subscriptions WHERE id = ?').bind(id).first();
  return c.json(created);
});

dataApi.put('/subscriptions/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const sub = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE subscriptions SET naam = ?, bedrag = ?, cyclus = ?, status = ?, betaalmethode = ?, logo = ?, beschrijving = ?, valuta = ?, categorie = ?, volgende_betaling = ?
    WHERE id = ? AND user_id = ?
  `).bind(
    sub.naam, sub.bedrag, sub.cyclus, sub.status, sub.betaalmethode, sub.logo || null, sub.beschrijving || null, sub.valuta || 'EUR', sub.categorie, sub.volgende_betaling, id, user.id
  ).run();
  
  return c.json({ success: true });
});

dataApi.delete('/subscriptions/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM subscriptions WHERE id = ? AND user_id = ?').bind(id, user.id).run();
  return c.json({ success: true });
});

// --- Incomes ---
dataApi.get('/incomes', async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare('SELECT * FROM monthly_incomes WHERE user_id = ?').bind(user.id).all();
  return c.json(results || []);
});

dataApi.post('/incomes', async (c) => {
  const user = c.get('user');
  const inc = await c.req.json();
  const id = inc.id || crypto.randomUUID();
  
  await c.env.DB.prepare(`
    INSERT INTO monthly_incomes (id, user_id, maand_sleutel, naam, bedrag, valuta, datum)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, user.id, inc.maand_sleutel, inc.naam, inc.bedrag, inc.valuta || 'EUR', inc.datum).run();
  
  const created = await c.env.DB.prepare('SELECT * FROM monthly_incomes WHERE id = ?').bind(id).first();
  return c.json(created);
});

dataApi.delete('/incomes/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM monthly_incomes WHERE id = ? AND user_id = ?').bind(id, user.id).run();
  return c.json({ success: true });
});

// --- Notes ---
dataApi.get('/notes', async (c) => {
  const user = c.get('user');
  const { results } = await c.env.DB.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY aangemaakt_op DESC').bind(user.id).all();
  return c.json(results || []);
});

dataApi.post('/notes', async (c) => {
  const user = c.get('user');
  const note = await c.req.json();
  const id = note.id || crypto.randomUUID();
  
  await c.env.DB.prepare('INSERT INTO notes (id, user_id, titel, inhoud, kleur) VALUES (?, ?, ?, ?, ?)')
    .bind(id, user.id, note.titel, note.inhoud || '', note.kleur || 'bg-zinc-800').run();
  
  const created = await c.env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first();
  return c.json(created);
});

dataApi.delete('/notes/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').bind(id, user.id).run();
  return c.json({ success: true });
});
