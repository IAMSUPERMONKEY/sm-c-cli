import { getHttpClient } from '@/shared/http/client.js';
import { API_PATHS } from '@/shared/api-paths.js';
import { CliError } from '@/shared/errors.js';
import {
  SearchEnvelope,
  type SearchInput,
  type SearchResult,
} from './schema.js';

export async function searchBoxes(input: SearchInput): Promise<SearchResult> {
  const client = getHttpClient();

  const body: Record<string, unknown> = {};
  if (input.lng !== undefined && input.lat !== undefined) {
    body.longitude = input.lng;
    body.latitude = input.lat;
  } else if (input.location !== undefined) {
    body.location = input.location;
  }
  if (input.type !== undefined) {
    body.type = input.type;
  }

  const res = await client.post(API_PATHS.boxesSearch, body);
  const env = SearchEnvelope.parse(res.data);
  if (env.code !== 0) {
    throw new CliError(env.code, env.msg || `upstream error: code ${env.code}`);
  }
  return { list: env.data.list };
}
