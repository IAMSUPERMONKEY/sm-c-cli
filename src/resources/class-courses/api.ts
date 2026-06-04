import { getHttpClient } from '@/shared/http/client.js';
import { API_PATHS } from '@/shared/api-paths.js';
import { CliError } from '@/shared/errors.js';
import {
  SearchEnvelope,
  type SearchInput,
  type SearchResult,
} from './schema.js';

export async function searchClassCourses(
  input: SearchInput,
): Promise<SearchResult> {
  const client = getHttpClient();

  const res = await client.post(API_PATHS.classCoursesSearch, {
    keyword: input.keyword,
  });
  const env = SearchEnvelope.parse(res.data);
  if (env.code !== 0) {
    throw new CliError(env.code, env.msg || `upstream error: code ${env.code}`);
  }

  return env.data;
}
