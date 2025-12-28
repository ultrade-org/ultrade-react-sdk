import { IGetPairListArgs, STREAMS, IPair, IPairDto } from '@ultrade/ultrade-js-sdk';

import {
  IQueryFuncResult,
  createPairListTag,
  dataGuard,
} from '@utils';
import baseApi from '../base.api';
import RtkSdkAdaptor from "../sdk";
import { IGetPairListTransformedResult } from '@interface';
import { marketsCommonApi } from './common.api';
import { withErrorHandling } from '@helpers';
import { pairHandler } from '@redux';

export const marketsPairsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPairList: builder.query<IGetPairListTransformedResult, IGetPairListArgs>({

      queryFn: async ({ selectedPairId }, { getState }): IQueryFuncResult<IGetPairListTransformedResult> => {
        const state = getState() as any;
        const cachedSettings = marketsCommonApi.endpoints.getSettings.select()(state).data;

        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getPairList(cachedSettings.companyId));

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const originalData = originResult.data;

        const prevPairListData = marketsPairsApi.endpoints.getPairList.select({selectedPairId})(state).data;

        const listOfPairs = prevPairListData?.listOfPairs ?? []

        const preparedResult = pairHandler({
          originalData,
          cachedSettings,
          prevList: listOfPairs,
          selectedPairId,
        });

        return { data: preparedResult }
      },
      providesTags: (result, error, { selectedPairId }) => [{ type: 'markets_pair_list', id: selectedPairId }],
      async onCacheEntryAdded({ selectedPairId }, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        const state = getState() as any;

        let handlerId: number | null = null;
        const preparedPair = state.user.selectedPair as IPair

        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.ALL_STAT], preparedPair?.pair_key);


        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: [IPairDto[], string]) => {

            // if(event !== "allStat"){
            //   return;
            // }

            if (!args && !args?.length) {
              return;
            }
            
            const [socketData, messageId] = args;

            if(!socketData){
              return
            }
    
            const cachedSettings = marketsCommonApi.endpoints.getSettings.select()(state).data;

            const prevPairListData = marketsPairsApi.endpoints.getPairList.select({selectedPairId})(state).data;
      
            const preparedResult = pairHandler({
              originalData: socketData,
              cachedSettings,
              prevList: prevPairListData?.listOfPairs ?? [],
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
        RtkSdkAdaptor.originalSdk.unsubscribe(handlerId);
      },
    }),
  }),
});

export const {
  useGetPairListQuery,
  useLazyGetPairListQuery,
} = marketsPairsApi;