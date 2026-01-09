import { IGetHistoryArgs, IGetHistoryResponse } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, createValidatedTag } from "@utils";
import baseApi from "../base.api";
import RtkSdkAdaptor from "../sdk";
import { withErrorHandling } from '@helpers';

export const marketsHistoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHistory: builder.query<IGetHistoryResponse, IGetHistoryArgs>({
      keepUnusedDataFor: 20,
      queryFn: async ({ symbol, interval, startTime, endTime, limit, page }: IGetHistoryArgs): IQueryFuncResult<IGetHistoryResponse> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getHistory(symbol, interval, startTime, endTime, limit, page));
      },
      providesTags: (result, error, { symbol, interval, startTime, endTime, limit, page }) => [
        { type: 'markets_history', id: createValidatedTag([symbol, interval, startTime, endTime, limit, page]) }
      ],
    }),
  }),
});

export const {
  useGetHistoryQuery,
  useLazyGetHistoryQuery,
} = marketsHistoryApi;

