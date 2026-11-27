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
