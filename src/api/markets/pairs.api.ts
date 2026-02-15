import { STREAMS, IPair, IPairDto } from '@ultrade/ultrade-js-sdk';
import { IQueryFuncResult, dataGuard } from '@utils';
import baseApi from '@api/base.api';
import RtkSdkAdaptor from "../sdk";
import { IGetPairListTransformedResult } from '@interface';
import { marketsCommonApi } from '@api/markets/common.api';
import { withErrorHandling } from '@helpers';
import { pairHandler } from '@redux';
import { initialPairListState } from '@consts';

export const marketsPairsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPairList: builder.query<IGetPairListTransformedResult, void>({
      keepUnusedDataFor: 180,
      queryFn: async (_, { getState }): IQueryFuncResult<IGetPairListTransformedResult> => {
        const state = getState() as any;
        const selectedPairId = state.user.selectedPair.id;
        const cachedSettings = marketsCommonApi.endpoints.getSettings.select()(state).data;

        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getPairList(cachedSettings.companyId));

        if (!dataGuard(originResult)) {
          return { data: initialPairListState };
        }

        const originalData = originResult.data;

        if (!Array.isArray(originalData)) {
          return { data: initialPairListState };
        }

        const prevPairListData = marketsPairsApi.endpoints.getPairList.select()(state).data;

        const listOfPairs = prevPairListData?.listOfPairs ?? []
        const preparedResult = pairHandler({
          originalData,
          cachedSettings,
          prevList: listOfPairs,
          selectedPairId,
        });

        return { data: preparedResult }
      },
      providesTags: ['markets_pair_list'],
      async onCacheEntryAdded(_, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        const state = getState() as any;

        let handlerId: number | null = null;
        const preparedPair = state.user.selectedPair as IPair
        const cachedSettings = marketsCommonApi.endpoints.getSettings.select()(state).data;

        const companyId = cachedSettings?.companyId;
        if (!companyId) {
          return;
        }

        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.ALL_STAT], preparedPair?.pair_key);

        if (!subscribeOptions) {
          return;
        }

        subscribeOptions.options.companyId = companyId;

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: [IPairDto[], string]) => {

            if(event !== "allStat"){
              return;
            }

            if (!args && !args?.length) {
              return;
            }
            
            const [socketData, messageId] = args;

            if(!socketData){
              return
            }
    
            const cachedSettings = marketsCommonApi.endpoints.getSettings.select()(state).data;

            const prevPairListData = marketsPairsApi.endpoints.getPairList.select()(state).data;
      
            const preparedResult = pairHandler({
              originalData: socketData,
              cachedSettings,
              prevList: prevPairListData?.listOfPairs ?? [],
              selectedPairId: preparedPair.id,
              messageId,
            });

            updateCachedData((draft) => {
              if (!draft) {
                return initialPairListState;
              }

              if (draft.lastUpdateId === messageId) {
                return;
              }

              return preparedResult;
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