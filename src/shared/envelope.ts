export type Envelope<T = unknown> = {
  code: number;
  data: T | Record<string, never>;
  msg: string;
};

export const ok = <T>(data: T): Envelope<T> => ({
  code: 0,
  data,
  msg: 'success',
});

export const fail = (code: number, msg: string): Envelope => ({
  code,
  data: {},
  msg,
});
