import { CodexBalanceDto } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, getSdkClient } from "@utils";
import baseApi from "../base.api";
import { withErrorHandling } from '@helpers';


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
