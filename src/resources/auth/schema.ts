import { z } from 'zod';

export const LoginInput = z.object({
  token: z.string().trim().min(1, 'token 不能为空').describe('用户授权 token'),
});

export type LoginInput = z.infer<typeof LoginInput>;

export type LoginResult = {
  credentialPath: string;
};
