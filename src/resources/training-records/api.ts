import { API_PATHS } from '@/shared/api-paths.js';
import { CliError } from '@/shared/errors.js';
import { getHttpClient } from '@/shared/http/client.js';
import {
  ListEnvelope,
  type ListInput,
  type ListResult,
} from './schema.js';

export async function listTrainingRecords(
  input: ListInput,
): Promise<ListResult> {
  const client = getHttpClient();
  const res = await client.post(API_PATHS.trainingRecordsList, {
    date: input.yearMonth,
  });
  const env = ListEnvelope.parse(res.data);

  if (env.code !== 0) {
    throw new CliError(env.code, env.msg || `upstream error: code ${env.code}`);
  }

  return env.data;
}
