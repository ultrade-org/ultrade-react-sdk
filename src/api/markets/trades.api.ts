import { IGetLastTradesArgs, IGetLastTrades, STREAMS, LastTradeEvent, IPair } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, createValidatedTag, dataGuard } from "@utils";
import baseApi from '@api/base.api';
import RtkSdkAdaptor from "../sdk";
import { withErrorHandling } from '@helpers';
import { IGetLastTradesTransformedResult } from "@interface";
import { saveChartTrade, saveLastTrades, saveSocketTradeHandler } from "@redux";
import { initialTradesState } from "@consts";

export const marketsTradesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLastTrades: builder.query<IGetLastTradesTransformedResult, IGetLastTradesArgs>({
      keepUnusedDataFor: 40,
      queryFn: async ({ symbol }: IGetLastTradesArgs): IQueryFuncResult<IGetLastTradesTransformedResult> => {
        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getLastTrades(symbol));

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const result = saveLastTrades(originResult.data);
        
        if (!result) {
          return { data: initialTradesState };
        }

        // const { marketTrades, orderBook } = result;

        // dispatch({
        //   type: 'SAVE_LTP',
        //   data: orderBook,
        // });

        return { data: result };
      },
      providesTags: (result, error, { symbol }) => [{ type: 'markets_last_trades', id: symbol }],
      async onCacheEntryAdded({ symbol }, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState, dispatch }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.TRADES], symbol);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: [LastTradeEvent, string]) => {
            
            if(event !== "lastTrade") {
              return;
            }

            if(!args || !args[0].length) {
              return;
            }

            const lastTrade = args[0];

            if (!lastTrade) {
              return;
            }

            // dispatch({
            //   type: 'SAVE_CHART_TRADE',
            //   data: chartTrade,
            // });
            const eventPairSymbol = lastTrade[1];

            if (eventPairSymbol === symbol) {

              updateCachedData((draft) => {

                if(!draft) {
                  return initialTradesState;
                }
  
                saveSocketTradeHandler(draft, lastTrade);
              });

              return;
            }

            dispatch(marketsTradesApi.util.updateQueryData('getLastTrades', { symbol: eventPairSymbol }, (draft) => {
              if(!draft) {
                return;
              }

              saveSocketTradeHandler(draft, lastTrade);
            }));

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
  useGetLastTradesQuery,
  useLazyGetLastTradesQuery,
} = marketsTradesApi;

// export {
//   useLazyGetLastTradesQuery,
// };

// export const useGetLastTradesQuery = (
//   args: IGetLastTradesArgs,
//   options?: Parameters<typeof useGetLastTradesQueryBase>[1]
// ) => {
//   return useGetLastTradesQueryBase(args, {
//     ...options,
//     refetchOnMountOrArgChange: true,
//   });
// };