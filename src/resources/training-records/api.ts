import { API_PATHS } from '@/shared/api-paths.js';
import { CliError } from '@/shared/errors.js';
import { getHttpClient } from '@/shared/http/client.js';
import { debug } from '@/shared/logger.js';
import { z } from 'zod';
import {
  ListEnvelope,
  PersonalDetailEnvelope,
  type ListInput,
  type ApiListResult,
  type PersonalDetailInput,
  type PersonalDetailResult,
} from './schema.js';

export async function listTrainingRecords(input: ListInput): Promise<ApiListResult> {
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

export async function getPersonalTrainingDetail(
  input: PersonalDetailInput,
): Promise<PersonalDetailResult> {
  const client = getHttpClient();
  const body = {
    orderType: input.orderType,
    trainingId: input.trainingId,
    ...(input.orderId !== undefined && { orderId: input.orderId }),
  };
  debug('请求', {
    method: 'POST',
    path: API_PATHS.trainingRecordsPersonalDetail,
    body,
  });
  const res = await client.post(API_PATHS.trainingRecordsPersonalDetail, body);
  debug('接口原始响应', {
    path: API_PATHS.trainingRecordsPersonalDetail,
    status: res.status,
    data: res.data,
  });

  let env: PersonalDetailEnvelope;
  try {
    env = PersonalDetailEnvelope.parse(res.data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      debug('响应校验失败', {
        stage: 'envelope',
        issues: err.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
          code: issue.code,
        })),
      });
    }
    throw err;
  }

  if (env.code !== 0) {
    throw new CliError(env.code, env.msg || `upstream error: code ${env.code}`);
  }

  return env.data as PersonalDetailResult;
}
