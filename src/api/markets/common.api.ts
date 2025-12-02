import { SettingsInit } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, getSdkClient, withErrorHandling } from "@utils";
import baseApi from "../base.api";

export const marketsCommonApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<SettingsInit, void>({
      queryFn: async (): IQueryFuncResult<SettingsInit> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getSettings());
      },
      providesTags: ['markets_settings'],
    }),
  }),
});
