export const API_PATHS = {
  classSchedulesSearch: '/class-schedules/search',
  classSchedulesOrder: '/class-schedules/getOrderCode',
  boxesSearch: '/boxes/search',
} as const;

export type ApiPath = (typeof API_PATHS)[keyof typeof API_PATHS];
