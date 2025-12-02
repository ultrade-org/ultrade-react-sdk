import { CodexBalanceDto } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, getSdkClient, withErrorHandling } from "@utils";
import baseApi from "../base.api";

export const marketsBalancesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBalances: builder.query<CodexBalanceDto[], void>({
      queryFn: async (): IQueryFuncResult<CodexBalanceDto[]> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getBalances());
      },
      providesTags: ['markets_balances'],
    })
  }),
});
