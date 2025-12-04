import { IGetDepthArgs, STREAMS } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, dataGuard, getSdkClient, withErrorHandling } from "@utils";
import baseApi from "../base.api";
import { IGetDepthTransformedResult } from "@interface";
import { calculateOrder } from "src/utils/redux/dataProcessing/orders";

const initialState: IGetDepthTransformedResult = {
  lastUpdateId: 0,
  buyOrders: [],
  sellOrders: [],
}

export const marketsDepthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDepth: builder.query<IGetDepthTransformedResult, IGetDepthArgs>({
      queryFn: async ({ symbol, depth, baseDecimal }: IGetDepthArgs): IQueryFuncResult<IGetDepthTransformedResult> => {
        const client = getSdkClient();
        
        const originResult = await withErrorHandling(() => client.getDepth(symbol, depth));

        if (!dataGuard(originResult)) {
          return originResult
        }

        const preparedResult: IGetDepthTransformedResult = {
          lastUpdateId: originResult.data.U,
          buyOrders: calculateOrder(originResult.data.buy, baseDecimal),
          sellOrders: calculateOrder(originResult.data.sell, baseDecimal),
        }

        return { data: preparedResult }
      },
      providesTags: (result, error, { symbol, depth }) => [
        { type: 'markets_depth', id: `${symbol}-${depth}` }
      ],

      async onCacheEntryAdded({symbol, baseDecimal},
      { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {

        let handlerId: number | null = null;
        const rtkClient = getSdkClient();
        const subscribeOptions = rtkClient.getSocketSubscribeOptions(symbol, [STREAMS.DEPTH]);

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, data) => {
            updateCachedData((draft) => {

                if(!draft) {
                  return initialState;
                }

                if(draft.lastUpdateId >= data.U) {
                  return draft;
                }
                
                // There is no this case, because cache is going to be changed in particular pair's cache
                // if (getState().user.selectedPair?.pair_key !== data.pair) {
                //   return;
                // }

                draft.lastUpdateId = data.U;
                draft.buyOrders = calculateOrder(data.buy, baseDecimal);
                draft.sellOrders = calculateOrder(data.sell, baseDecimal);
            });
          });

        } catch (error) {
          console.error('Error loading cache data:', error);
        }
      
        await cacheEntryRemoved;
        rtkClient.unsubscribe(handlerId);
      }
    }),
  }),
});

