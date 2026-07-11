// Tests de base utilisant le test runner natif de Node.js (>= 18).
// Lancer avec : npm test (depuis le dossier backend)
const test = require('node:test');
const assert = require('node:assert');

process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.JWT_SECRET = 'test_secret';
process.env.INVITE_ONLY = 'false';
process.env.PAYMENT_ENABLED = 'false';
process.env.CLIENT_URL = 'http://localhost:5173';

const express = require('express');
const http = require('http');
const { syncDatabase } = require('../src/models');

const authRoutes = require('../src/routes/auth.routes');

async function buildServer() {
  await syncDatabase();
  const app = express();
  app.set('io', { to: () => ({ emit: () => {} }), emit: () => {} });
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return http.createServer(app);
}

test('GET /api/health n\'existe pas ici, mais l\'inscription et la connexion fonctionnent', async () => {
  const server = await buildServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  const registerRes = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'testuser',
      email: 'test@example.com',
      password: 'motdepasse123',
    }),
  });
  assert.strictEqual(registerRes.status, 201);
  const registerBody = await registerRes.json();
  assert.ok(registerBody.token);
  assert.strictEqual(registerBody.user.username, 'testuser');

  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'motdepasse123' }),
  });
  assert.strictEqual(loginRes.status, 200);
  const loginBody = await loginRes.json();
  assert.ok(loginBody.token);

  const badLoginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'mauvais' }),
  });
  assert.strictEqual(badLoginRes.status, 401);

  server.close();
});
