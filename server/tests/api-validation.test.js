// These tests hit only paths that are rejected BEFORE the database is used,
// so they run without MongoDB or a Gemini key.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      base = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});
after(() => server.close());

const post = (path, body) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('health check', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
});

test('POST /api/complaints rejects an empty body', async () => {
  const res = await post('/api/complaints', {});
  assert.equal(res.status, 400);
  assert.ok((await res.json()).error.details.length >= 3);
});

test('POST /api/complaints rejects a bad email', async () => {
  const res = await post('/api/complaints', {
    customerName: 'Sam', email: 'nope', description: 'My order never arrived at all.',
  });
  assert.equal(res.status, 400);
  assert.match((await res.json()).error.message, /email/i);
});

test('POST /api/complaints rejects a too-short description', async () => {
  const res = await post('/api/complaints', { customerName: 'Sam', email: 'sam@example.com', description: 'bad' });
  assert.equal(res.status, 400);
});

test('malformed JSON returns 400', async () => {
  const res = await fetch(`${base}/api/complaints`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{oops',
  });
  assert.equal(res.status, 400);
});

test('invalid complaint id returns 400', async () => {
  assert.equal((await fetch(`${base}/api/complaints/abc`)).status, 400);
});

test('invalid status value returns 400', async () => {
  const res = await fetch(`${base}/api/complaints/507f1f77bcf86cd799439011/status`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Done' }),
  });
  assert.equal(res.status, 400);
});

test('invalid filter values return 400 (no NoSQL operators accepted)', async () => {
  assert.equal((await fetch(`${base}/api/complaints?category=Shipping`)).status, 400);
  assert.equal((await fetch(`${base}/api/complaints?category[$ne]=x`)).status, 400);
});

test('unknown route returns JSON 404', async () => {
  const res = await fetch(`${base}/api/nope`);
  assert.equal(res.status, 404);
  assert.ok((await res.json()).error.message);
});
