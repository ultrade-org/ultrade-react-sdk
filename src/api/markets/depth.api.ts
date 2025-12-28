import { IGetDepth, IGetDepthArgs, IPair, STREAMS } from '@ultrade/ultrade-js-sdk';

import { IQueryFuncResult, dataGuard } from '@utils';
import baseApi from '../base.api';
import RtkSdkAdaptor from "../sdk";
import { IGetDepthTransformedResult } from '@interface';
import { initialDepthState } from '@consts';
import { hasAllArgs, withErrorHandling } from '@helpers';
import { depthHandler } from '@redux';

export const marketsDepthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepth: builder.query<IGetDepthTransformedResult, IGetDepthArgs>({
      queryFn: async ({ symbol, depth, baseDecimal }): IQueryFuncResult<IGetDepthTransformedResult> => {
        if (!hasAllArgs([symbol, depth, baseDecimal])) {
          return { data: initialDepthState };
        }

        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getDepth(symbol, depth));

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const preparedResult = depthHandler(originResult.data, baseDecimal);

        return { data: preparedResult };
      },
      providesTags: (result, error, { symbol, depth }) => [{ type: 'markets_depth', id: `${symbol}-${depth}` }],

      async onCacheEntryAdded({ symbol, baseDecimal }, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const state = getState() as any
        const preparedPair = state.user.selectedPair as IPair

        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.DEPTH], preparedPair?.pair_key);

        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: [IGetDepth, string]) => {

            // if(event !== "depth"){
            //   return;
            // }

            if(!args || !args.length) {
              return;
            }

            const [socketData] = args;

            if (socketData.U === socketData.u) {
              return;
            }

            const preparedResult = depthHandler(socketData, baseDecimal);

            updateCachedData((draft) => {
              if (!draft) {
                return initialDepthState;
              }
        
              if (draft.lastUpdateId >= socketData.U) {
                return draft;
              }

              if(socketData.pair === symbol) {
                draft.lastUpdateId = socketData.U;
                draft.buyOrders = preparedResult.buyOrders;
                draft.sellOrders = preparedResult.sellOrders;
              }
             
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
  useGetDepthQuery,
  useLazyGetDepthQuery,
} = marketsDepthApi;
