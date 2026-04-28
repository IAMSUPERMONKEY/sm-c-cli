import { sleep } from './promise.js';

export type PageRequest = {
  limit: number;
  offset: number;
};

export type PageResult<T> = {
  items: T[];
  totalHits: number;
};

export type FetchAllPagesOptions<T> = {
  fetchPage: (req: PageRequest) => Promise<PageResult<T>>;
  pageSize: number;
  intervalMs?: number;
};

const DEFAULT_INTERVAL_MS = 200;

export async function fetchAllPages<T>({
  fetchPage,
  pageSize,
  intervalMs = DEFAULT_INTERVAL_MS,
}: FetchAllPagesOptions<T>): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;
  let totalHits = Infinity;

  while (all.length < totalHits) {
    if (all.length > 0 && intervalMs > 0) {
      await sleep(intervalMs);
    }

    const page = await fetchPage({ limit: pageSize, offset });
    totalHits = page.totalHits;
    all.push(...page.items);

    if (page.items.length === 0) break;

    offset = all.length;
  }

  return all;
}
