export const API_PATHS = {
  classSchedulesSearch: '/class-schedules/search',
  classSchedulesOrder: '/class-schedules/getOrderCode',
  classCoursesSearch: '/class-courses/search',
  trainingRecordsList: '/training-records/queryList',
  trainingRecordsPersonalDetail: '/training-records/queryPersonalDetail',
  boxesSearchByGeo: '/boxes/searchByGeo',
  boxesSearch: '/boxes/search',
  boxesGeo: '/boxes/geo',
  authWhoAmI: '/auth/whoami',
} as const;

export type ApiPath = (typeof API_PATHS)[keyof typeof API_PATHS];
