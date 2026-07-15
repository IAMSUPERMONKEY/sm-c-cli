import { z } from 'zod';

export const LoginInput = z.object({
  token: z.string().trim().min(1, 'token 不能为空').describe('用户授权 token'),
});

export type LoginInput = z.infer<typeof LoginInput>;

export type LoginResult = {
  credentialPath: string;
};

export const AuthScope = z.object({
  title: z.string().describe('授权标题'),
  description: z.string().optional().describe('授权描述'),
});
export type AuthScope = z.infer<typeof AuthScope>;

export const AuthInfo = z.object({
  authScopes: z.array(AuthScope).describe('授权范围说明列表'),
  authorizedAt: z.number().int().describe('授权时间戳'),
  lastUsedAt: z.number().int().nullable().optional().describe('最近使用时间戳'),
});
export type AuthInfo = z.infer<typeof AuthInfo>;

export const UserInfo = z.object({
  userId: z.number().int().describe('用户 id'),
  userAvatarUrl: z.string().describe('用户头像地址'),
});
export type UserInfo = z.infer<typeof UserInfo>;

export const WhoAmIResult = z.object({
  authInfo: AuthInfo.describe('授权信息'),
  userInfo: UserInfo.describe('用户信息'),
});
export type WhoAmIResult = z.infer<typeof WhoAmIResult>;

export const WhoAmIEnvelope = z.object({
  code: z.number().describe('业务码'),
  data: WhoAmIResult.nullable().optional(),
  msg: z.string().describe('消息'),
});
export type WhoAmIEnvelope = z.infer<typeof WhoAmIEnvelope>;
