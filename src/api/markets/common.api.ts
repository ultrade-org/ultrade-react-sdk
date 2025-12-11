import { IPair, ISettingsState, STREAMS, SettingsInit } from '@ultrade/ultrade-js-sdk';

import { IQueryFuncResult, dataGuard, getSdkClient } from '@utils';
import baseApi from '../base.api';
import { withErrorHandling } from '@helpers';
import { settingsHandler } from '@redux';
import { initialSettingsState } from '@consts';

export const marketsCommonApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettings: builder.query<ISettingsState, void>({
      queryFn: async (): IQueryFuncResult<ISettingsState> => {
        const client = getSdkClient();

        const originResult = await withErrorHandling(() => client.getSettings());

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const preparedResult = settingsHandler(originResult.data);

        return { data: preparedResult };
      },
      providesTags: ['markets_settings'],

      async onCacheEntryAdded(args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const rtkClient = getSdkClient();
        const state = getState() as any

        const preparedPair = state.user.selectedPair as IPair

        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.SETTINGS_UPDATE], preparedPair?.pair_key);

        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args) => {

            if (!args && !args.length) {
              return;
            }

            const { data: socketData } = args[0] as { data: SettingsInit };

            if (!socketData) {
              return;
            }

            const preparedResult = settingsHandler(socketData);


            //!!! STREAMS.SETTINGS_UPDATE is simular to ALL_STAT, so we don't need to update the cached data

            // updateCachedData((draft) => {
            //   if (!draft) {
            //     return initialSettingsState;
            //   }

            //   return {
            //     ...draft,
            //     ...preparedResult,
            //   };
            // });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        rtkClient.unsubscribe(handlerId);
      },
    }),
  }),
});
