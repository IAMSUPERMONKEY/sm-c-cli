export const API_PATHS = {
  classSchedulesSearch: '/class-schedules/search',
  classSchedulesOrder: '/class-schedules/getOrderCode',
  boxesSearchByGeo: '/boxes/searchByGeo',
  boxesSearch: '/boxes/search',
  boxesGeo: '/boxes/geo',
} as const;

export type ApiPath = (typeof API_PATHS)[keyof typeof API_PATHS];
