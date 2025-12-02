import { IGetLastTradesArgs, IGetLastTrades } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, getSdkClient, withErrorHandling } from "@utils";
import baseApi from "../base.api";

export const marketsTradesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLastTrades: builder.query<IGetLastTrades, IGetLastTradesArgs>({
      queryFn: async ({ symbol }: IGetLastTradesArgs): IQueryFuncResult<IGetLastTrades> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getLastTrades(symbol));
      },
      providesTags: (result, error, { symbol }) => [{ type: 'markets_last_trades', id: symbol }],
    }),
  }),
});

