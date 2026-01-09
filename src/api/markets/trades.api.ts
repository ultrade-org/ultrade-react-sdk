import { IGetLastTradesArgs, IGetLastTrades, STREAMS, LastTradeEvent, IPair } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, dataGuard } from "@utils";
import baseApi from "../base.api";
import RtkSdkAdaptor from "../sdk";
import { withErrorHandling } from '@helpers';
import { IGetLastTradesTransformedResult } from "@interface";
import { saveChartTrade, saveLastTrades, saveSocketTradeHandler } from "@redux";
import { initialTradesState } from "@consts";

export const marketsTradesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getLastTrades: builder.query<IGetLastTradesTransformedResult, IGetLastTradesArgs>({
      keepUnusedDataFor: 30,
      queryFn: async ({ symbol }: IGetLastTradesArgs, { getState, dispatch }): IQueryFuncResult<IGetLastTradesTransformedResult> => {
        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getLastTrades(symbol));

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const result = saveLastTrades(originResult.data);
        
        if (!result) {
          return { data: initialTradesState };
        }

        const { marketTrades, orderBook } = result;

        dispatch({
          type: 'exchange/SAVE_LTP',
          data: orderBook,
        });

        return { data: { marketTrades } };
      },
      providesTags: (result, error, { symbol }) => [{ type: 'markets_last_trades', id: symbol }],
      async onCacheEntryAdded({ symbol }, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState, dispatch }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.ORDERS], symbol ? symbol : state.user.selectedPair?.pair_key);
        
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

            const chartTrade = saveChartTrade(lastTrade);

            dispatch({
              type: 'exchange/SAVE_CHART_TRADE',
              data: chartTrade,
            });

            updateCachedData((draft) => {

              if(!draft) {
                return initialTradesState;
              }

              const result = saveSocketTradeHandler(draft.marketTrades, lastTrade);
              
              if (!result) {
                return;
              }

              const { marketTrades, orderBook } = result;
              dispatch({
                type: 'exchange/SAVE_LTP',
                data: orderBook,
              });
              draft.marketTrades = marketTrades;

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
  useGetLastTradesQuery,
  useLazyGetLastTradesQuery,
} = marketsTradesApi;