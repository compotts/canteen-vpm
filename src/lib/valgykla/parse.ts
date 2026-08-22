import type { Menu, MenuItem, MenuSection, OrderLink } from "./types";

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parsePrice(text: string): number {
  const normalized = text.replace(/\s/g, "").replace(",", ".");
  const match = normalized.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : NaN;
}

function parseQuantityId(name: string | null): number | null {
  const match = name?.match(/quantities\[(\d+)\]/);
  return match ? parseInt(match[1], 10) : null;
}

function getWeightFromRow(row: Element): string | undefined {
  const span = row.querySelector(".additional_info span");
  const match = span?.textContent?.match(/Svoris:\s*([^\s].*)/);
  return match ? match[1].trim() : undefined;
}

function extractDateFromDoc(doc: Document): string {
  const match = doc.querySelector("h2")?.textContent?.match(
    /\((\d{4}-\d{2}-\d{2})\)/
  );
  return match ? match[1] : formatDate(new Date());
}

export function parseOrderMakeLink(html: string): OrderLink | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const anchor = doc.querySelector('a[href^="orders/make/"]');
  if (!anchor) return null;

  const href = (anchor.getAttribute("href") ?? "").trim();
  const label = (anchor.textContent ?? "").trim();
  const match = href.match(/orders\/make\/(\d{4}-\d{2}-\d{2})/);
  if (!match || !label) return null;

  return { label, date: match[1] };
}

export function parseMenuFromHtml(html: string, dateStr?: string): Menu {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const date = dateStr || extractDateFromDoc(doc);
  const sections: MenuSection[] = [];

  const tables = doc.querySelectorAll("form .container .form-control table");
  if (!tables.length) throw new Error("PARSE_ERROR contact with developer please");

  tables.forEach((table) => {
    const title = table.querySelector("thead tr th")?.textContent?.trim() ?? "";
    const items: MenuItem[] = [];

    table.querySelectorAll("tbody tr").forEach((row) => {
      const titleCell = row.querySelector("td.title");
      const priceCell = row.querySelector("td.price");
      const input = row.querySelector("input[name^='quantities[']");
      if (!titleCell || !priceCell || !input) return;

      const abbr = titleCell.querySelector("abbr");
      const name = (abbr ?? titleCell).textContent?.trim() ?? "";
      const price = parsePrice(priceCell.textContent?.trim() ?? "");
      const id = parseQuantityId(input.getAttribute("name"));
      if (id == null || Number.isNaN(price)) return;

      items.push({
        id,
        name,
        price,
        weight: getWeightFromRow(row),
        initialQuantity: (input.getAttribute("value") ?? "").trim(),
      });
    });

    if (title || items.length) sections.push({ title, items });
  });

  return { date, sections };
}
