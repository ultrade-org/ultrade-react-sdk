import { IGetPairListArgs, IPairDto } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, createPairListTag, getSdkClient, withErrorHandling } from "@utils";
import baseApi from "../base.api";

export const marketsPairsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPairList: builder.query<IPairDto[], IGetPairListArgs>({
      queryFn: async ({ companyId }: IGetPairListArgs): IQueryFuncResult<IPairDto[]> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getPairList(companyId));
      },
      providesTags: (result, error, { companyId }) => createPairListTag('markets_pair_list', companyId)
    }),
  }),
});

