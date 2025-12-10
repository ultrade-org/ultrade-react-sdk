import { CodexBalanceDto, IPair, STREAMS } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, dataGuard, getSdkClient } from "@utils";
import baseApi from "../base.api";
import { depositBalanceGuard, withErrorHandling } from '@helpers';
import { IDepositBalanceTransformedResult, IExchangeAssetsTransformedResult } from "@interface";
import { depositBalanceHandler, exchangeAssetsHandler, mapAsset, prepareAssets } from "@redux";
import { initialExchangeAssetsState } from "@consts";

interface ISocketData {
  data: CodexBalanceDto;
}

export const marketsBalancesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBalances: builder.query<IDepositBalanceTransformedResult, void>({
      queryFn: async (args,{ getState }): IQueryFuncResult<IDepositBalanceTransformedResult> => {
        const client = getSdkClient();
        const state = getState() as any;
        const originResult = await withErrorHandling(() => client.getBalances());

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const balances = originResult.data;

        const selectedPair = state.user.selectedPair as IPair;
        const prevDepositBalance = marketsBalancesApi.endpoints.getBalances.select()(state).data;

        const prevAssets = marketsBalancesApi.endpoints.getCodexAssets.select()(state).data;

        const preparedAssets = prepareAssets(prevAssets, balances);

        marketsBalancesApi.util.updateQueryData('getCodexAssets', undefined, () => {
          return preparedAssets;
        });

        return { data: depositBalanceHandler(balances, prevDepositBalance, selectedPair) };
      },
      providesTags: ['markets_balances'],
      async onCacheEntryAdded(args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const rtkClient = getSdkClient();
        const state = getState() as any;
        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.CODEX_BALANCES]);

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: [ISocketData, string]) => {

            if(!args) {
              return;
            }
            const [{ data: socketData }] = args;

            if (!socketData) {
              return;
            }

            const selectedPair = state.user.selectedPair as IPair;

            updateCachedData((draft) => {
              const preparedResult = depositBalanceHandler([socketData], draft, selectedPair);

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
    getCodexAssets: builder.query<IExchangeAssetsTransformedResult, void>({
      queryFn: async (args,{ getState }): IQueryFuncResult<IExchangeAssetsTransformedResult> => {
        const client = getSdkClient();
        const state = getState() as any;
        const originResult = await withErrorHandling(() => client.getCodexAssets());
        
        if (!dataGuard(originResult)) {
          return originResult;
        }

        const codexAssets = originResult.data;

        const preparedAssets = codexAssets.map(asset => mapAsset(asset, undefined));

        const prevExchangeAssets = marketsBalancesApi.endpoints.getCodexAssets.select()(state).data;

        return { data: exchangeAssetsHandler(preparedAssets, prevExchangeAssets) };
      },
      providesTags: ['markets_codex_assets'],
      async onCacheEntryAdded(args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const rtkClient = getSdkClient();
        const state = getState() as any;
        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.CODEX_BALANCES]);

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: [ISocketData, string]) => {

            if(!args) {
              return
            }

            const [{ data: socketData }] = args;

            if (!socketData) {
              return;
            }
            
            updateCachedData((draft) => {
              const preparedResult = exchangeAssetsHandler(socketData, draft);
              
              return preparedResult;
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
