import { getHttpClient } from '../../shared/http/client.js';
import { API_PATHS } from '../../shared/api-paths.js';
import { fetchAllPages } from '../../shared/pagination.js';
import { CliError } from '../../shared/errors.js';
import {
  OrderEnvelope,
  SearchPageEnvelope,
  type ClassSchedule,
  type OrderInput,
  type OrderResult,
  type SearchInput,
  type SearchResult,
} from './schema.js';

const SEARCH_TYPE_GROUP_CLASS = 1;
const DEFAULT_PAGE_SIZE = 50;

export type SearchOptions = {
  pageSize?: number;
  intervalMs?: number;
};

export async function searchClassSchedules(
  input: SearchInput,
  options: SearchOptions = {},
): Promise<SearchResult> {
  const client = getHttpClient();
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  const list = await fetchAllPages<ClassSchedule>({
    pageSize,
    ...(options.intervalMs !== undefined && { intervalMs: options.intervalMs }),
    fetchPage: async ({ limit, offset }) => {
      const res = await client.post(API_PATHS.classSchedulesSearch, {
        city: input.city,
        keyword: input.keyword,
        searchType: SEARCH_TYPE_GROUP_CLASS,
        ...(input.date !== undefined && { date: input.date }),
        limit,
        offset,
      });
      const env = SearchPageEnvelope.parse(res.data);
      if (env.code !== 0) {
        throw new CliError(env.code, env.msg || `upstream error: code ${env.code}`);
      }
      return { items: env.data.list, totalHits: env.data.totalHits };
    },
  });

  const seen = new Set<number>();
  const deduped: ClassSchedule[] = [];
  for (const item of list) {
    if (seen.has(item.scheduleId)) continue;
    seen.add(item.scheduleId);
    deduped.push(item);
  }

  return { list: deduped };
}

export async function getClassScheduleOrderCode(
  input: OrderInput,
): Promise<OrderResult> {
  const client = getHttpClient();
  const res = await client.post(API_PATHS.classSchedulesOrder, {
    scheduleId: input.scheduleId,
    scheduleIdSk: input.scheduleIdSk,
  });
  const env = OrderEnvelope.parse(res.data);
  if (env.code !== 0) {
    throw new CliError(env.code, env.msg || `upstream error: code ${env.code}`);
  }
  return env.data;
}
