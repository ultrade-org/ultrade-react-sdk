import { IPair, ISettingsState, STREAMS, SettingsInit } from '@ultrade/ultrade-js-sdk';

import { IQueryFuncResult, dataGuard } from '@utils';
import baseApi from '@api/base.api';
import RtkSdkAdaptor from "../sdk";
import { withErrorHandling } from '@helpers';
import { settingsHandler } from '@redux';
import { initialSettingsState } from '@consts';

export const marketsCommonApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<ISettingsState, void>({
      keepUnusedDataFor: Number.POSITIVE_INFINITY,
      queryFn: async (_, { getState }): IQueryFuncResult<ISettingsState> => {
        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getSettings());

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const prevState = marketsCommonApi.endpoints.getSettings.select()(getState() as any).data || initialSettingsState;
        const preparedResult = settingsHandler(originResult.data, prevState);

        return { data: preparedResult };
      },
      providesTags: ['markets_settings'],
      async onCacheEntryAdded(_, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        const result = await cacheDataLoaded;
        const state = getState() as any;
        
        const companyId = result?.data.companyId;
        let handlerId: number | null = null;
        const preparedPair = state.user.selectedPair as IPair

        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.SETTINGS_UPDATE], preparedPair?.pair_key);
        subscribeOptions.options.companyId = companyId;

        if (!subscribeOptions) {
          return;
        }

        try {
          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args) => {

            if (event !== "settingsUpdate") {
              return;
            }

            if (!args && !args.length) {
              return;
            }

            const { data: socketData } = args[0] as { data: SettingsInit };

            if (!socketData) {
              return;
            }



            //!!! STREAMS.SETTINGS_UPDATE is simular to ALL_STAT, so we don't need to update the cached data

            updateCachedData((draft) => {
              if (!draft) {
                return initialSettingsState;
              }
              console.log("settings socket is working", socketData)
              const preparedResult = settingsHandler(socketData, draft);

              return {
                ...draft,
                ...preparedResult,
              };
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        RtkSdkAdaptor.originalSdk.unsubscribe(handlerId);
      },
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useLazyGetSettingsQuery,
} = marketsCommonApi;
