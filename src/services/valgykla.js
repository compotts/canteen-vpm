import * as api from "./api.js";

export const login = api.login;
export const checkAuth = api.checkAuth;
export const getOrderMakePage = api.getOrderMakePage;
export const getOrderPage = api.getOrderPage;
export const submitOrder = api.submitOrder;

let translationsCache = null;

export async function loadTranslations() {
  if (translationsCache) return translationsCache;
  try {
    const res = await fetch("/api/dishes");
    if (!res.ok) throw new Error("Failed to load translations");
    const data = await res.json();
    translationsCache = {};
    data.forEach((t) => {
      if (t.name) {
        translationsCache[t.name.toLowerCase().trim()] = {
          ru: t.nameRu || t.name,
          en: t.nameEn || t.name,
        };
      }
    });
    return translationsCache;
  } catch (err) {
    console.error("Error loading translations:", err);
    return {};
  }
}

export function parseOrderMakeLink(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const a = doc.querySelector('a[href^="orders/make/"]');
  if (!a) return null;
  const href = (a.getAttribute("href") || "").trim();
  const label = (a.textContent || "").trim();
  const dateMatch = href.match(/orders\/make\/(\d{4}-\d{2}-\d{2})/);
  if (!dateMatch || !label) return null;
  return { label, date: dateMatch[1] };
}

function formatDate(d) {
  if (typeof d === "string") return d;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseMenuFromHtml(html, dateStr) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const date = dateStr || extractDateFromDoc(doc);
  const sections = [];
  const tables = doc.querySelectorAll("form .container .form-control table");
  if (!tables.length) throw new Error("PARSE_ERROR contact with developer please");

  tables.forEach((table) => {
    const th = table.querySelector("thead tr th");
    const title = th ? th.textContent.trim() : "";
    const items = [];
    const rows = table.querySelectorAll("tbody tr");
    rows.forEach((row) => {
      const titleTd = row.querySelector("td.title");
      const priceTd = row.querySelector("td.price");
      const input = row.querySelector("input[name^='quantities[']");
      if (!titleTd || !priceTd || !input) return;
      const abbr = titleTd.querySelector("abbr");
      const name = abbr ? abbr.textContent.trim() : titleTd.textContent.trim();
      const priceText = priceTd.textContent.trim();
      const price = parsePrice(priceText);
      const id = parseQuantityId(input.getAttribute("name"));
      if (id == null || isNaN(price)) return;
      const weight = getWeightFromRow(row);
      const initialQuantity = (input.getAttribute("value") || "").trim();
      items.push({ id, name, price, weight, initialQuantity });
    });
    if (title || items.length) sections.push({ title, items });
  });

  return { date, sections };
}

function extractDateFromDoc(doc) {
  const h2 = doc.querySelector("h2");
  if (h2) {
    const m = h2.textContent.match(/\((\d{4}-\d{2}-\d{2})\)/);
    if (m) return m[1];
  }
  return formatDate(new Date());
}

function parsePrice(text) {
  const normalized = text.replace(/\s/g, "").replace(",", ".");
  const m = normalized.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : NaN;
}

function parseQuantityId(name) {
  if (!name) return null;
  const m = name.match(/quantities\[(\d+)\]/);
  return m ? parseInt(m[1], 10) : null;
}

function getWeightFromRow(row) {
  const span = row.querySelector(".additional_info span");
  if (!span) return undefined;
  const m = (span.textContent || "").match(/Svoris:\s*([^\s].*)/);
  return m ? m[1].trim() : undefined;
}
