export function orderResponseStatus(
  response: Response,
  html: string,
  orderUrl: string
): "success" | "failed" | "unknown" {
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    const location = response.headers.get("location");
    if (!location) return "unknown";
    let destination: URL;
    try {
      destination = new URL(location, orderUrl);
    } catch {
      return "unknown";
    }
    if (destination.origin !== new URL(orderUrl).origin) return "unknown";
    if (/\/login\/?$/.test(destination.pathname)) return "failed";
    return [302, 303].includes(response.status) && /^\/orders(?:\/make(?:\/\d{4}-\d{2}-\d{2})?)?\/?$/.test(destination.pathname)
      ? "success" : "unknown";
  }
  if (!response.ok) return response.status >= 500 ? "unknown" : "failed";
  if (/type\s*=\s*["']?password\b/i.test(html)) return "failed";
  for (const match of html.matchAll(/class\s*=\s*["']([^"']*)["']/gi)) {
    const classes = match[1].split(/\s+/);
    if (classes.includes("messages") && classes.includes("errors")) return "failed";
  }
  return html.trim() ? "success" : "unknown";
}
