const BASE = "https://pokeapi.co/api/v2";
const DELAY_MS = 80;
const MAX_RETRIES = 3;

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function extractId(url: string): number {
  const parts = url.replace(/\/$/, "").split("/");
  return Number(parts[parts.length - 1]);
}

function isRetryable(error: unknown): boolean {
  if (error instanceof TypeError) return true; // network errors (ECONNRESET, etc.)
  const cause = (error as { cause?: { code?: string } }).cause;
  if (cause?.code) {
    // Transient system errors
    if (["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND", "EPIPE"].includes(cause.code)) return true;
  }
  if (error instanceof Error && error.message.includes("429")) return true; // rate limited
  return false;
}

export async function fetchJSON(url: string, retries = MAX_RETRIES): Promise<unknown> {
  await delay(DELAY_MS);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) {
          const backoff = 2 ** attempt * 200;
          console.warn(`  PokeAPI ${res.status}, retrying in ${backoff}ms (${attempt}/${retries})`);
          await delay(backoff);
          continue;
        }
        throw new Error(`PokeAPI ${res.status} for ${url}`);
      }
      if (!res.ok) throw new Error(`PokeAPI ${res.status} for ${url}`);
      return res.json();
    } catch (err) {
      if (attempt < retries && isRetryable(err)) {
        const backoff = 2 ** attempt * 300;
        console.warn(`  fetch failed (${String(err).slice(0, 80)}), retrying in ${backoff}ms (${attempt}/${retries})`);
        await delay(backoff);
        continue;
      }
      throw err;
    }
  }

  throw new Error(`PokeAPI: exhausted ${retries} retries for ${url}`);
}

export interface PokeAPINamed {
  name: string;
  url: string;
}

export interface PokeAPIListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokeAPINamed[];
}

/** Fetch all pages of a paginated list endpoint. */
export async function fetchList(endpoint: string): Promise<PokeAPINamed[]> {
  const results: PokeAPINamed[] = [];
  let url: string | null = `${BASE}/${endpoint}?limit=1000`;
  while (url) {
    const data = (await fetchJSON(url)) as PokeAPIListResponse;
    results.push(...data.results);
    url = data.next;
  }
  return results;
}

/** Fetch a single resource by numeric id or string name. */
export function fetchOne(endpoint: string, idOrName: number | string): Promise<unknown> {
  return fetchJSON(`${BASE}/${endpoint}/${idOrName}`);
}

/** Walk all results, applying a concurrent async transform. Items that fail are logged and skipped. */
export async function mapConcurrent<T, R>(
  items: T[],
  fn: (item: T, i: number) => Promise<R>,
  concurrency = 4,
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map(fn));
    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        console.warn(`  item failed: ${String(result.reason).slice(0, 100)}`);
      }
    }
  }
  return results;
}
