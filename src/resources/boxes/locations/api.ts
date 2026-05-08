import { getHttpClient } from '@/shared/http/client.js';
import { API_PATHS } from '@/shared/api-paths.js';
import { CliError } from '@/shared/errors.js';
import {
  GeocodeEnvelope,
  type GeocodeInput,
  type GeocodeResult,
} from './schema.js';

export async function geocodeLocation(
  input: GeocodeInput,
): Promise<GeocodeResult> {
  const client = getHttpClient();

  const res = await client.post(API_PATHS.boxesGeo, {
    location: input.keyword,
  });
  const env = GeocodeEnvelope.parse(res.data);
  if (env.code !== 0) {
    throw new CliError(env.code, env.msg || `upstream error: code ${env.code}`);
  }

  return env.data;
}
