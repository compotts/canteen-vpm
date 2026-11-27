import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);

function load(file, overrides = {}, globals = {}) {
  const cache = new Map();
  function read(path) {
    if (cache.has(path)) return cache.get(path).exports;
    const mod = { exports: {} };
    cache.set(path, mod);
    const code = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const localRequire = (name) => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (!name.startsWith(".") && !name.startsWith("@/")) return require(name);
      const base = name.startsWith("@/")
        ? resolve("src", name.slice(2))
        : resolve(dirname(path), name);
      const target = [base + ".ts", base + "/index.ts"].find(existsSync);
      assert.ok(target, name);
      return read(target);
    };
    new Function("require", "module", "exports", ...Object.keys(globals), code)(
      localRequire,
      mod,
      mod.exports,
      ...Object.values(globals),
    );
    return mod.exports;
  }
  return read(resolve(file));
}

const dates = load("src/lib/menu-dates.ts");
const tomorrow = dates.addMenuDays(dates.canteenTime().date, 1);
const html = (value = "0.5", id = "12") =>
  `<h2>Meniu (${tomorrow})</h2><form><div class="container"><div class="form-control"><table><thead><tr><th>Sriubos</th></tr></thead><tbody><tr><td class="title"><abbr>Sriuba</abbr><div class="additional_info"><span>Svoris: 250 g</span></div></td><td class="price">1,20 €</td><td><input name="quantities[${id}]" value="${value}"></td></tr></tbody></table></div></div></form>`;

test("Vilnius cutoff follows winter and summer time", () => {
  assert.equal(
    dates.isMenuDateOpen(
      "2026-11-30",
      "2026-11-30",
      new Date("2026-11-30T06:59:59Z"),
    ),
    true,
  );
  assert.equal(
    dates.isMenuDateOpen(
      "2026-11-30",
      "2026-11-30",
      new Date("2026-11-30T07:00:00Z"),
    ),
    false,
  );
  assert.equal(
    dates.isMenuDateOpen(
      "2026-06-01",
      "2026-06-01",
      new Date("2026-06-01T05:59:59Z"),
    ),
    true,
  );
  assert.equal(
    dates.isMenuDateOpen(
      "2026-06-01",
      "2026-06-01",
      new Date("2026-06-01T06:00:00Z"),
    ),
    false,
  );
  assert.equal(
    dates.isMenuDateOpen(
      "2026-11-29",
      "2026-11-29",
      new Date("2026-11-30T06:00:00Z"),
    ),
    false,
  );
  assert.equal(
    dates.isMenuDateOpen("2026-12-01", null, new Date("2026-11-30T06:00:00Z")),
    false,
  );
});

test("archive removes private portions while personal menu preserves them", async () => {
  const source = load(
    "src/server/menu/source.ts",
    {},
    { fetch: async () => new Response(html()) },
  );
  const archived = source.archiveSections(html(), tomorrow);
  assert.equal(archived[0].items[0].price, 1.2);
  assert.equal(Object.hasOwn(archived[0].items[0], "initialQuantity"), false);
  const personal = await source.getSessionMenu("test-session", tomorrow);
  assert.equal(personal.sections[0].items[0].initialQuantity, "0.5");
});

test("archive rejects wrong dates, duplicate IDs, missing rows and expired sessions", () => {
  const source = load("src/server/menu/source.ts");
  assert.throws(() => source.archiveSections(html(), "2000-01-01"));
  assert.throws(() =>
    source.archiveSections(
      html().replace(
        "</tbody>",
        `<tr><td><input name="quantities[13]"></td></tr></tbody>`,
      ),
      tomorrow,
    ),
  );
  assert.throws(() =>
    source.archiveSections(
      html().replace(
        "</tbody>",
        html().match(/<tbody>(.*)<\/tbody>/)[1] + "</tbody>",
      ),
      tomorrow,
    ),
  );
  assert.throws(() =>
    source.archiveSections('<input type="password">', tomorrow),
  );
  assert.throws(() => source.archiveSections(html("", "0"), tomorrow));
});

test("closed dates and stale item IDs never submit or write activity", async () => {
  let writes = 0;
  const route = load(
    "src/app/api/orders/[date]/route.ts",
    {
      "@/server/auth": { requireIdentity: async () => "test" },
      "@/server/valgykla-identity": { getSessionId: () => "test-session" },
      "@/server/menu/source": {
        getAvailableMenuLink: async () => ({ date: tomorrow }),
        getSessionMenu: async () => ({
          date: tomorrow,
          sections: [{ title: "Menu", items: [{ id: 12 }] }],
        }),
      },
      "@/server/activity": {
        recordActivity: async () => {
          writes++;
          throw new Error("Unexpected write");
        },
      },
      "@/server/db": { db: {} },
      "@/server/db/schema": { activityLogs: {} },
    },
    {
      fetch: async () => {
        throw new Error("Unexpected submission");
      },
    },
  );
  const request = (quantities) =>
    new Request("https://test/api/orders/test", {
      method: "POST",
      body: JSON.stringify({ quantities }),
    });
  const closed = await route.POST(request({ 12: "1" }), {
    params: Promise.resolve({ date: "2000-01-01" }),
  });
  assert.equal(closed.status, 409);
  assert.equal((await closed.json()).code, "order_date_closed");
  const stale = await route.POST(request({ 99: "1" }), {
    params: Promise.resolve({ date: tomorrow }),
  });
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).code, "menu_changed");
  assert.equal(writes, 0);
});

test("interface choice persists in storage and cookie even if storage is blocked", () => {
  const values = new Map();
  const document = { cookie: "" };
  let events = 0;
  const preference = load(
    "src/lib/interface.ts",
    {},
    {
      localStorage: { setItem: (key, value) => values.set(key, value) },
      document,
      window: { dispatchEvent: () => events++ },
    },
  );
  preference.rememberInterface("old");
  assert.equal(values.get(preference.INTERFACE_KEY), "old");
  assert.match(document.cookie, /valgyklos_interface=old; Path=\//);
  assert.equal(
    preference.legacyPath("/order?date=2026-11-30"),
    "/old-design/order?date=2026-11-30",
  );
  assert.equal(events, 1);
  const blocked = load(
    "src/lib/interface.ts",
    {},
    {
      localStorage: {
        setItem: () => {
          throw new Error("blocked");
        },
      },
      document,
      window: { dispatchEvent: () => {} },
    },
  );
  blocked.rememberInterface("new");
  assert.match(document.cookie, /valgyklos_interface=new/);
});

test("broadcast fanout bounds concurrency and separates expired subscriptions from failures", async () => {
  let active = 0;
  let maximum = 0;
  const sent = [];
  const service = load("src/server/broadcast.ts", {
    "./web-push": {
      sendWebPush: async (subscription, payload) => {
        active++;
        maximum = Math.max(maximum, active);
        await Promise.resolve();
        active--;
        if (subscription.endpoint === "expired") throw { statusCode: 410 };
        if (subscription.endpoint === "failed") throw { statusCode: 500 };
        sent.push(payload);
      },
      isExpiredPushSubscription: (error) => error.statusCode === 410,
    },
  });
  const recipients = Array.from({ length: 25 }, (_, i) => ({
    id: String(i),
    endpoint: i === 0 ? "expired" : i === 1 ? "failed" : `device-${i}`,
    p256dh: "key",
    auth: "key",
  }));
  const input = {
    id: "59d8bd87-5b68-45cf-a880-20f58eb2b5a0",
    title: "Title",
    body: "Text",
  };
  const result = await service.deliverBroadcast(recipients, input);
  assert.deepEqual(result, {
    total: 25,
    sent: 23,
    failed: 1,
    expired: 1,
    expiredIds: ["0"],
  });
  assert.ok(maximum <= 10);
  assert.equal(sent[0].tag, `broadcast-${input.id}`);
  assert.equal(sent[0].url, "/");
  assert.deepEqual(await service.deliverBroadcast([], input), {
    total: 0,
    sent: 0,
    failed: 0,
    expired: 0,
    expiredIds: [],
  });
});

test("broadcast deadline reports unsent devices without starting extra sends", async () => {
  let now = 0;
  let calls = 0;
  const service = load(
    "src/server/broadcast.ts",
    {
      "./web-push": {
        sendWebPush: async () => {
          calls++;
          now = 50000;
        },
        isExpiredPushSubscription: () => false,
      },
    },
    { Date: { now: () => now } },
  );
  const result = await service.deliverBroadcast(
    Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      endpoint: "device",
      p256dh: "key",
      auth: "key",
    })),
    { id: "id", title: "Title", body: "Body" },
  );
  assert.equal(calls, 1);
  assert.equal(result.sent, 1);
  assert.equal(result.failed, 29);
});

function broadcastRoute({
  deny = false,
  configured = true,
  failUpdate = false,
  deliver,
} = {}) {
  const entries = new Map();
  const permissions = [];
  let sends = 0;
  let reads = 0;
  const tables = {
    activityLogs: { id: "activity-id" },
    webPushSubscriptions: { id: "subscription-id", enabled: "enabled" },
  };
  const subscriptions = [
    { id: "expired-device", endpoint: "device", enabled: true },
  ];
  const db = {
    select: () => ({
      from: (table) => ({
        where: (condition) => {
          reads++;
          const rows =
            table === tables.activityLogs
              ? [entries.get(condition.value)].filter(Boolean)
              : subscriptions.filter((item) => item.enabled);
          return {
            limit: async () => rows,
            then: (ok, error) => Promise.resolve(rows).then(ok, error),
          };
        },
      }),
    }),
    update: () => ({
      set: (data) => ({
        where: async (condition) => {
          if (failUpdate) throw new Error("Log update failed");
          Object.assign(entries.get(condition.value), data);
        },
      }),
    }),
    delete: () => ({ where: async () => {} }),
  };
  const route = load("src/app/api/admin/broadcast/route.ts", {
    "drizzle-orm": {
      eq: (column, value) => ({ column, value }),
      inArray: (column, value) => ({ column, value }),
    },
    "@/server/auth": {
      requireAdmin: async (_, permission) => {
        permissions.push(permission);
        if (deny) {
          const error = new Error("forbidden");
          error.status = 403;
          throw error;
        }
        return { username: "admin" };
      },
    },
    "@/server/http": {
      HttpError: class extends Error {
        constructor(status, message, data) {
          super(message);
          this.status = status;
          this.data = data;
        }
      },
      errorResponse: (error) =>
        Response.json(
          { error: error.message, ...error.data },
          { status: error.status ?? 500 },
        ),
      readJson: (request) => request.json(),
      parse: (schema, input) => {
        const result = schema.safeParse(input);
        if (!result.success) {
          const error = new Error("invalid");
          error.status = 400;
          throw error;
        }
        return result.data;
      },
    },
    "@/server/db": { db },
    "@/server/db/schema": tables,
    "@/server/activity": {
      recordActivity: async (input) => {
        if (entries.has(input.id)) throw new Error("duplicate");
        const entry = {
          ...input,
          details: { ...input.details, fullName: "Admin Name" },
        };
        entries.set(input.id, entry);
        return [entry];
      },
    },
    "@/server/web-push": {
      configureWebPush: () => {
        if (!configured) throw new Error("missing VAPID");
      },
    },
    "@/server/broadcast": {
      deliverBroadcast: async () => {
        sends++;
        if (deliver) await deliver();
        return {
          total: 1,
          sent: 0,
          failed: 0,
          expired: 1,
          expiredIds: ["expired-device"],
        };
      },
    },
  });
  return {
    route,
    entries,
    permissions,
    sends: () => sends,
    reads: () => reads,
  };
}

const broadcastInput = {
  id: "59d8bd87-5b68-45cf-a880-20f58eb2b5a0",
  title: "Heading",
  body: "Notification",
};
const broadcastRequest = (input = broadcastInput) =>
  new Request("https://test/api/admin/broadcast", {
    method: "POST",
    body: JSON.stringify(input),
  });

test("broadcast requires updates permission and validates content before any side effects", async () => {
  const denied = broadcastRoute({ deny: true });
  assert.equal((await denied.route.POST(broadcastRequest())).status, 403);
  assert.deepEqual(denied.permissions, ["updates"]);
  assert.equal(denied.reads(), 0);
  const invalid = broadcastRoute();
  assert.equal(
    (
      await invalid.route.POST(
        broadcastRequest({ ...broadcastInput, body: "   " }),
      )
    ).status,
    400,
  );
  assert.equal(invalid.reads(), 0);
  const missing = broadcastRoute({ configured: false });
  const result = await missing.route.POST(broadcastRequest());
  assert.equal(result.status, 503);
  assert.equal((await result.json()).code, "push_not_configured");
  assert.equal(missing.entries.size, 0);
  assert.equal(missing.sends(), 0);
});

test("concurrent and repeated broadcasts reuse their audit claim without sending again", async () => {
  let finish;
  let started;
  const startedPromise = new Promise((resolve) => {
    started = resolve;
  });
  const gate = new Promise((resolve) => {
    finish = resolve;
  });
  const fixture = broadcastRoute({
    deliver: async () => {
      started();
      await gate;
    },
  });
  const first = fixture.route.POST(broadcastRequest());
  await startedPromise;
  const pending = await fixture.route.POST(broadcastRequest());
  assert.equal((await pending.json()).state, "pending");
  finish();
  const completed = await first;
  const result = await completed.json();
  assert.equal(result.state, "complete");
  const repeated = await fixture.route.POST(broadcastRequest());
  assert.deepEqual(await repeated.json(), result);
  assert.equal(fixture.sends(), 1);
  assert.equal(
    fixture.entries.get(broadcastInput.id).details.fullName,
    "Admin Name",
  );
  assert.equal(
    fixture.entries.get(broadcastInput.id).action,
    "notification_broadcast",
  );
  assert.equal(
    (
      await fixture.route.POST(
        broadcastRequest({ ...broadcastInput, body: "Different text" }),
      )
    ).status,
    409,
  );
});

test("failure to persist a broadcast result never allows it to be sent twice", async () => {
  const fixture = broadcastRoute({ failUpdate: true });
  assert.equal((await fixture.route.POST(broadcastRequest())).status, 500);
  const repeated = await fixture.route.POST(broadcastRequest());
  assert.equal((await repeated.json()).state, "pending");
  assert.equal(fixture.sends(), 1);
});
