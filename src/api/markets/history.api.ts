import { IGetHistoryArgs, IGetHistoryResponse } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, createValidatedTag, getSdkClient, withErrorHandling } from "@utils";
import baseApi from "../base.api";

export const marketsHistoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHistory: builder.query<IGetHistoryResponse, IGetHistoryArgs>({
      queryFn: async ({ symbol, interval, startTime, endTime, limit, page }: IGetHistoryArgs): IQueryFuncResult<IGetHistoryResponse> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getHistory(symbol, interval, startTime, endTime, limit, page));
      },
      providesTags: (result, error, { symbol, interval, startTime, endTime, limit, page }) => [
        { type: 'markets_history', id: createValidatedTag([symbol, interval, startTime, endTime, limit, page]) }
      ],
    }),
  }),
});

