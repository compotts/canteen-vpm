export async function loadDishes(category) {
  const url = category ? `/api/dishes?category=${category}` : "/api/dishes";
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
