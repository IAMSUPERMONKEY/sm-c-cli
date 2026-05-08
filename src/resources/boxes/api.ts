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

  const res = await client.post(API_PATHS.boxesSearchByGeo, {
    longitude: input.longitude,
    latitude: input.latitude,
    distance: 10000,
  });
  const env = SearchEnvelope.parse(res.data);
  if (env.code !== 0) {
    throw new CliError(env.code, env.msg || `upstream error: code ${env.code}`);
  }

  const sorted = [...env.data.list].sort(
    (a, b) => parseDistanceMeters(a.distance) - parseDistanceMeters(b.distance),
  );
  return { list: sorted };
}

function parseDistanceMeters(distance: string): number {
  const match = /^(-?\d+(?:\.\d+)?)(km|m)$/.exec(distance);
  if (!match) return Number.POSITIVE_INFINITY;
  const value = Number(match[1]);
  return match[2] === 'km' ? value * 1000 : value;
}
