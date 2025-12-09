import { IGetDepth, IGetDepthArgs, STREAMS } from '@ultrade/ultrade-js-sdk';

import { IQueryFuncResult, dataGuard, getSdkClient } from '@utils';
import baseApi from '../base.api';
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

        const client = getSdkClient();

        const originResult = await withErrorHandling(() => client.getDepth(symbol, depth));

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const preparedResult = depthHandler(originResult.data, baseDecimal);

        return { data: preparedResult };
      },
      providesTags: (result, error, { symbol, depth }) => [{ type: 'markets_depth', id: `${symbol}-${depth}` }],

      async onCacheEntryAdded({ symbol, baseDecimal }, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        let handlerId: number | null = null;
        const rtkClient = getSdkClient();
        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.DEPTH]);

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: [IGetDepth, string]) => {

            if(!args) {
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
        rtkClient.unsubscribe(handlerId);
      },
    }),
  }),
});
