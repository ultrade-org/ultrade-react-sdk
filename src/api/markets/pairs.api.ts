import { IPair } from '@ultrade/shared/browser/interfaces';
import { IGetPairListArgs, STREAMS } from '@ultrade/ultrade-js-sdk';

import {
  IQueryFuncResult,
  createPairListTag,
  dataGuard,
  getSdkClient,
} from '@utils';
import baseApi from '../base.api';
import { IGetPairListTransformedResult } from '@interface';
import { marketsCommonApi } from './common.api';
import { withErrorHandling } from '@helpers';
import { pairHandler } from '@redux';

export const marketsPairsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPairList: builder.query<IGetPairListTransformedResult, IGetPairListArgs>({

      queryFn: async ({ companyId, currentCountry, selectedPairId }, { getState }): IQueryFuncResult<IGetPairListTransformedResult> => {
        
        const state = getState() as any;
        const client = getSdkClient();
        const originResult = await withErrorHandling(() => client.getPairList(companyId));

        if (!dataGuard(originResult)) {
          return originResult;
        }
        const originalData = originResult.data;

        const cachedSettings = marketsCommonApi.endpoints.getSettings.select(null)(state).data;

        const preparedCachedArgs = { companyId, currentCountry: !currentCountry ? undefined : currentCountry, selectedPairId: selectedPairId ? selectedPairId : undefined }

        const prevPairListData = marketsPairsApi.endpoints.getPairList.select(preparedCachedArgs)(state).data;

        const preparedResult = pairHandler({
          originalData,
          currentCountry,
          cachedSettings,
          prevList: prevPairListData?.listOfPairs ?? originalData,
          selectedPairId,
        });

        return { data: preparedResult }
      },
      providesTags: (result, error, { companyId }) => createPairListTag('markets_pair_list', companyId),
      async onCacheEntryAdded({ companyId, currentCountry, selectedPairId }, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        const state = getState() as any;

        let handlerId: number | null = null;
        const rtkClient = getSdkClient();
        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.ALL_STAT]);

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: [IPair[], string]) => {

            if (!args && !args.length) {
              return;
            }
            
            const socketData = args[0]
            const messageId = args[1] 

            if(!socketData){
              return
            }
    
            const cachedSettings = marketsCommonApi.endpoints.getSettings.select(null)(state).data;

            const preparedCachedArgs = { companyId, currentCountry: !currentCountry ? undefined : currentCountry, selectedPairId: selectedPairId ? selectedPairId : undefined }

            const prevPairListData = marketsPairsApi.endpoints.getPairList.select(preparedCachedArgs)(state).data;
      
            const listOfPairs = prevPairListData?.listOfPairs ?? socketData;

            const preparedResult = pairHandler({
              originalData: socketData,
              currentCountry,
              cachedSettings,
              prevList: listOfPairs,
              selectedPairId,
              messageId,
            });

            updateCachedData((draft) => {

              if (draft?.lastUpdateId === messageId) {
                return
              }

              return preparedResult
            });

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