const STORAGE_KEY = "valgyklos_liquid_glass";

const listeners = new Set<() => void>();
let cached: boolean | null = null;

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "0";
  } catch {
    return true;
  }
}

function emit(): void {
  for (const listener of listeners) listener();
}

function handleStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  cached = null;
  emit();
}

export function subscribeLiquidGlass(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

export function getLiquidGlass(): boolean {
  if (cached === null) cached = read();
  return cached;
}

export function getLiquidGlassServerSnapshot(): boolean {
  return true;
}

export function setLiquidGlass(value: boolean): void {
  cached = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    return;
  } finally {
    emit();
  }
}

export function isLiquidGlassSupported(): boolean {
  if (typeof window === "undefined") return false;

  const uaData = (
    navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }
  ).userAgentData;

  const chromium =
    Boolean(uaData?.brands?.some((entry) => /Chromium/i.test(entry.brand))) ||
    Boolean((window as Window & { chrome?: unknown }).chrome);

  if (!chromium) return false;
  return !window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
}
