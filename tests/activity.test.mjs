import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { drizzle } from "drizzle-orm/neon-http";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requireFromRoot = createRequire(import.meta.url);

function loader(overrides = {}) {
  const cache = new Map();
  function load(file) {
    const candidates = [file, `${file}.ts`, `${file}.tsx`, path.join(file, 'index.ts')];
    const resolved = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    if (!resolved) throw new Error(`Module not found: ${file}`);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const loaded = { exports: {} };
    cache.set(resolved, loaded);
    const source = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const customRequire = (name) => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.startsWith('@/')) return load(path.join(root, 'src', name.slice(2)));
      if (name.startsWith('.')) return load(path.resolve(path.dirname(resolved), name));
      return requireFromRoot(name);
    };
    const context = {
      Request, Response, Headers, URL, URLSearchParams, Buffer, AbortSignal,
      crypto: globalThis.crypto, process,
      console: { error() {} },
      fetch: overrides.fetch ?? (() => { throw new Error('Unexpected network request'); }),
    };
    vm.runInNewContext(`(function(require,module,exports){${source}\n})`, context, { filename: resolved })(customRequire, loaded, loaded.exports);
    return loaded.exports;
  }
  return (file) => load(path.join(root, file));
}

function request(body = { quantities: { 12: '0.5', 13: '' } }) {
  return new Request('http://localhost/api/orders/2026-11-13', {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie: 'PHPSESSID=private-session' },
    body: JSON.stringify(body),
  });
}

function orderRoute(options = {}) {
  const events = [];
  const results = [];
  const forwarded = [];
  const load = loader({
    '@/server/auth': { requireIdentity: async () => 'real-student' },
    '@/server/valgykla-identity': { getSessionId: () => 'private-session' },
    '@/server/activity': {
      recordActivity: async (event) => {
        if (options.auditFails) throw new Error('Audit unavailable');
        events.push(event);
        return [{ id: '74d60b76-c3d4-44eb-95f5-6130fdf1ac66' }];
      },
    },
    '@/server/db': { db: {
      update: () => ({ set: (value) => ({ where: async () => {
        if (options.finalizeFails) throw new Error('Update unavailable');
        results.push(value);
      } }) }),
    } },
    fetch: async (url, init) => {
      forwarded.push({ url, init });
      if (options.networkFails) throw new Error('Connection lost');
      return options.response ?? new Response('<html>Order saved</html>');
    },
  });
  return { POST: load('src/app/api/orders/[date]/route.ts').POST, events, results, forwarded };
}

const params = { params: Promise.resolve({ date: '2026-11-13' }) };

test('order audit uses server identity and records quantities before forwarding', async () => {
  const route = orderRoute();
  const response = await route.POST(request({ username: 'forged-admin', quantities: { 12: '0.5', 13: '' } }), params);
  assert.equal(response.status, 200);
  assert.equal(route.events[0].username, 'real-student');
  assert.equal(route.events[0].status, 'pending');
  assert.equal(route.results[0].status, 'success');
  assert.equal(route.forwarded.length, 1);
  assert.equal(new URLSearchParams(route.forwarded[0].init.body).get('quantities[12]'), '0.5');
  assert.equal(new URLSearchParams(route.forwarded[0].init.body).get('quantities[13]'), '');
  assert.equal(route.forwarded[0].init.redirect, 'manual');
  assert.doesNotMatch(JSON.stringify(route.events), /private-session|forged-admin/);
});

test('order is not forwarded when the initial audit cannot be saved', async () => {
  const route = orderRoute({ auditFails: true });
  assert.equal((await route.POST(request(), params)).status, 500);
  assert.equal(route.forwarded.length, 0);
});

test('network loss remains unknown rather than falsely successful or safe to retry', async () => {
  const route = orderRoute({ networkFails: true });
  const response = await route.POST(request(), params);
  assert.equal(response.status, 502);
  assert.equal((await response.json()).code, 'order_status_unknown');
  assert.equal(route.results[0].status, 'unknown');
});

test('a failed final audit does not repeat or reject an already sent order', async () => {
  const route = orderRoute({ finalizeFails: true });
  assert.equal((await route.POST(request(), params)).status, 200);
  assert.equal(route.forwarded.length, 1);
  assert.equal(route.events[0].status, 'pending');
});

test('invalid quantities and dates are rejected before audit or upstream calls', async () => {
  for (const quantities of [{ 12: '-1' }, { invalid: '1' }, { 12: 'Infinity' }, {}]) {
    const route = orderRoute();
    assert.equal((await route.POST(request({ quantities }), params)).status, 400);
    assert.equal(route.events.length, 0);
    assert.equal(route.forwarded.length, 0);
  }
  const route = orderRoute();
  assert.equal((await route.POST(request(), { params: Promise.resolve({ date: '2026-02-31' }) })).status, 400);
});

test('response classification recognizes login, rejection, redirects and uncertain results', () => {
  const { orderResponseStatus } = loader()('src/server/order-response.ts');
  const url = 'https://valgykla.vpm.lt/orders/make/2026-11-13';
  const cases = [
    [200, '<input type="password">', {}, 'failed'],
    [200, '<div class="errors active messages">Rejected</div>', {}, 'failed'],
    [200, '', {}, 'unknown'],
    [200, '<html>Order saved</html>', {}, 'success'],
    [502, 'Bad gateway', {}, 'unknown'],
    [403, 'Forbidden', {}, 'failed'],
    [302, '', { location: '/login' }, 'failed'],
    [303, '', { location: '/orders/make/2026-11-13' }, 'success'],
    [307, '', { location: '/orders/make/2026-11-13' }, 'unknown'],
    [302, '', { location: 'https://other.example/orders' }, 'unknown'],
    [302, '', { location: 'http://[' }, 'unknown'],
  ];
  for (const [status, html, headers, expected] of cases) {
    assert.equal(orderResponseStatus(new Response(html, { status, headers }), html, url), expected);
  }
});

test('activity API enforces logs permission before accessing the database', async () => {
  let databaseCalls = 0;
  const load = loader({
    '@/server/auth': { requireAdmin: async (_request, permission) => {
      assert.equal(permission, 'logs');
      const { HttpError } = load('src/server/http.ts');
      throw new HttpError(403, 'forbidden');
    } },
    '@/server/db': { db: { select: () => { databaseCalls++; } } },
  });
  const { GET } = load('src/app/api/admin/logs/route.ts');
  assert.equal((await GET(new Request('http://localhost/api/admin/logs'))).status, 403);
  assert.equal(databaseCalls, 0);
});

test('activity API validates filters and uses a stable cursor for pages of 50', async () => {
  const queries = [];
  const rows = Array.from({ length: 51 }, (_, index) => ({
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    username: 'student', category: 'orders', action: 'order_submit', status: 'success',
    createdAt: new Date('2026-11-13T10:00:00.123Z'), details: {}, target: '2026-11-13',
  }));
  const mock = drizzle.mock();
  const load = loader({
    '@/server/auth': { requireAdmin: async () => ({ username: 'owner' }) },
    '@/server/db': { db: {
      select: () => {
        const query = mock.select();
        const from = query.from.bind(query);
        query.from = (...args) => {
          const selection = from(...args);
          const limit = selection.limit.bind(selection);
          selection.limit = (value) => {
            assert.equal(value, 51);
            const built = limit(value);
            queries.push(built.toSQL());
            return Promise.resolve(rows);
          };
          return selection;
        };
        return query;
      },
    } },
  });
  const { GET } = load('src/app/api/admin/logs/route.ts');
  for (const search of ['?from=bad', '?from=2026-11-14&to=2026-11-13', '?cursor=invalid', '?category=secret', '?status=invalid']) {
    assert.equal((await GET(new Request(`http://localhost/api/admin/logs${search}`))).status, 400);
  }
  const first = await (await GET(new Request('http://localhost/api/admin/logs?username=STUDENT&category=orders&from=2026-11-13&to=2026-11-13'))).json();
  assert.equal(first.entries.length, 50);
  const cursor = JSON.parse(Buffer.from(first.nextCursor, 'base64url'));
  assert.equal(cursor.id, rows[49].id);
  assert.equal(cursor.createdAt, '2026-11-13T10:00:00.123Z');
  assert.ok(queries[0].params.includes('student'));
  assert.match(queries[0].sql, /Europe\/Vilnius/);
  await GET(new Request(`http://localhost/api/admin/logs?cursor=${first.nextCursor}`));
  assert.ok(queries[1].params.includes(rows[49].id));
  assert.match(queries[1].sql, /order by.*created_at.*desc.*id.*desc/);
});

test('admin password changes are audited without plaintext or password hashes', async () => {
  const events = [];
  const mock = drizzle.mock();
  const load = loader({
    '@/server/auth': { requireOwner: async () => ({ username: 'owner' }) },
    '@/server/queries/admins': {
      findAdmin: async () => ({ username: 'admin' }), isOwner: () => false,
      normalizeUsername: value => value.toLowerCase(), formatAdmin: row => row,
    },
    '@/server/password': { hashPassword: () => 'private-password-hash' },
    '@/server/activity': { auditMutation: async (_mutation, event) => {
      events.push(event);
      return [{ username: 'admin', permissions: ['logs'] }];
    } },
    '@/server/db': { db: mock },
  });
  const { PATCH } = load('src/app/api/admin/accounts/route.ts');
  const response = await PATCH(new Request('http://localhost/api/admin/accounts', {
    method: 'PATCH', body: JSON.stringify({ username: 'admin', password: 'private-password', permissions: ['logs'] }),
  }));
  assert.equal(response.status, 200);
  assert.equal(events[0].username, 'owner');
  assert.equal(events[0].details.passwordChanged, true);
  assert.doesNotMatch(JSON.stringify(events), /private-password/);
});

test('mutations and audit inserts share a single transactional batch', async () => {
  const batches = [];
  const mock = drizzle.mock();
  const database = { db: {
    insert: mock.insert.bind(mock),
    batch: async queries => { batches.push(queries); return [[{ id: 'dish' }], []]; },
  } };
  const load = loader({ '@/server/db': database, './db': database });
  const { auditMutation } = load('src/server/activity.ts');
  const mutation = { query: 'change' };
  const result = await auditMutation(mutation, { username: 'admin', category: 'admin', action: 'dish_update', target: 'dish' });
  assert.equal(result[0].id, 'dish');
  assert.equal(batches.length, 1);
  assert.equal(batches[0][0], mutation);
  assert.match(batches[0][1].toSQL().sql, /insert into "activity_logs"/);
});

test('all actions, statuses and permissions have translations without prohibited characters', () => {
  const { ACTIVITY_ACTIONS, ACTIVITY_STATUSES } = loader()('src/lib/activity.ts');
  for (const locale of ['ru', 'en', 'lt']) {
    const messages = JSON.parse(fs.readFileSync(path.join(root, `messages/${locale}.json`)));
    assert.ok(messages.admin.permissions.logs);
    assert.ok(messages.admin.tabs.logs);
    for (const action of ACTIVITY_ACTIONS) assert.ok(messages.admin.logs.actions[action]);
    for (const status of ACTIVITY_STATUSES) assert.ok(messages.admin.logs.statuses[status]);
    assert.doesNotMatch(JSON.stringify(messages.admin.logs), /[Ёё—–]/);
  }
});
