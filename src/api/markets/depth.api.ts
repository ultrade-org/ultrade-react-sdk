import { IGetDepthArgs, IGetDepth } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, getSdkClient, withErrorHandling } from "@utils";
import baseApi from "../base.api";

export const marketsDepthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepth: builder.query<IGetDepth, IGetDepthArgs>({
      queryFn: async ({ symbol, depth }: IGetDepthArgs): IQueryFuncResult<IGetDepth> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getDepth(symbol, depth));
      },
      providesTags: (result, error, { symbol, depth }) => [
        { type: 'markets_depth', id: `${symbol}-${depth}` }
      ],
    }),
  }),
});

