import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAllPages, type PageRequest, type PageResult } from '../pagination.js';

type Item = { id: number };

function makePage(start: number, count: number, totalHits: number): PageResult<Item> {
  return {
    items: Array.from({ length: count }, (_, i) => ({ id: start + i })),
    totalHits,
  };
}

describe('fetchAllPages', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('totalHits 不超过 pageSize 时一次返回所有条目', async () => {
    const fetchPage = vi.fn(async (_req: PageRequest): Promise<PageResult<Item>> => {
      return makePage(0, 3, 3);
    });

    const items = await fetchAllPages({ fetchPage, pageSize: 50 });

    expect(items).toEqual([{ id: 0 }, { id: 1 }, { id: 2 }]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith({ limit: 50, offset: 0 });
  });

  it('按正确的 offset 顺序遍历所有分页', async () => {
    const fetchPage = vi.fn(async ({ offset }: PageRequest): Promise<PageResult<Item>> => {
      if (offset === 0) return makePage(0, 50, 120);
      if (offset === 50) return makePage(50, 50, 120);
      if (offset === 100) return makePage(100, 20, 120);
      throw new Error(`unexpected offset ${offset}`);
    });

    const promise = fetchAllPages({ fetchPage, pageSize: 50, intervalMs: 200 });
    await vi.runAllTimersAsync();
    const items = await promise;

    expect(items).toHaveLength(120);
    expect(items[0]).toEqual({ id: 0 });
    expect(items.at(-1)).toEqual({ id: 119 });
    expect(fetchPage.mock.calls.map((c) => c[0])).toEqual([
      { limit: 50, offset: 0 },
      { limit: 50, offset: 50 },
      { limit: 50, offset: 100 },
    ]);
  });

  it('页间等待 intervalMs，第一页之前与最后一页之后都不等待', async () => {
    const calls: number[] = [];
    const fetchPage = vi.fn(async ({ offset }: PageRequest): Promise<PageResult<Item>> => {
      calls.push(Date.now());
      if (offset === 0) return makePage(0, 2, 4);
      return makePage(2, 2, 4);
    });

    const start = Date.now();
    const promise = fetchAllPages({ fetchPage, pageSize: 2, intervalMs: 200 });

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchPage).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(199);
    expect(fetchPage).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(fetchPage).toHaveBeenCalledTimes(2);

    expect(calls[0]! - start).toBe(0);
    expect(calls[1]! - start).toBe(200);
  });

  it('未指定 intervalMs 时默认 200ms', async () => {
    const fetchPage = vi.fn(async ({ offset }: PageRequest): Promise<PageResult<Item>> => {
      if (offset === 0) return makePage(0, 1, 2);
      return makePage(1, 1, 2);
    });

    const promise = fetchAllPages({ fetchPage, pageSize: 1 });

    await vi.advanceTimersByTimeAsync(0);
    expect(fetchPage).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(199);
    expect(fetchPage).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it('totalHits 为 0 时返回空数组', async () => {
    const fetchPage = vi.fn(async (): Promise<PageResult<Item>> => {
      return { items: [], totalHits: 0 };
    });

    const items = await fetchAllPages({ fetchPage, pageSize: 50 });

    expect(items).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('累计条数达到 totalHits 后立即停止，不再请求下一页', async () => {
    const fetchPage = vi.fn(async ({ offset }: PageRequest): Promise<PageResult<Item>> => {
      if (offset === 0) return makePage(0, 3, 3);
      throw new Error('should not request a second page');
    });

    const items = await fetchAllPages({ fetchPage, pageSize: 50 });

    expect(items).toHaveLength(3);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
