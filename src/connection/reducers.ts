import baseApi from '@api/base.api';

export const SDKReducers = {
  [baseApi.reducerPath]: baseApi.reducer,
} as const;

type ReducersMap = typeof SDKReducers;

export type SDKReducersType = {
  [K in keyof ReducersMap]: ReturnType<ReducersMap[K]>;
};
