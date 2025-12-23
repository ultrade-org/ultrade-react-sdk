import { CodexBalanceDto, IPair, STREAMS } from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, dataGuard, getSdkClient } from "@utils";
import baseApi from "../base.api";
import {  withErrorHandling } from '@helpers';
import { IDepositBalanceTransformedResult, IExchangeAssetsTransformedResult } from "@interface";
import { depositBalanceHandler, mapAsset, prepareAssets, saveExchangeAssetsHandler, updateExchangeAssetsHandler } from "@redux";
import { initialDepositBalanceState, initialExchangeAssetsState } from "@consts";

interface ISocketData {
  data: CodexBalanceDto;
}

export const marketsBalancesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBalances: builder.query<IDepositBalanceTransformedResult, IPair["pair_key"]>({
      queryFn: async (pairKey, { getState, dispatch }): IQueryFuncResult<IDepositBalanceTransformedResult> => {

        const client = getSdkClient();
        const originResult = await withErrorHandling(() => client.getBalances());
        
        if (!dataGuard(originResult)) {
          return originResult;
        }
        const state = getState() as any;

        const preparedPair = state.user.selectedPair as IPair;

        const balances = originResult.data;

        const prevDepositBalance = marketsBalancesApi.endpoints.getBalances.select(pairKey)(state).data ?? initialDepositBalanceState;

        const prevAssets = marketsBalancesApi.endpoints.getCodexAssets.select()(state).data || initialExchangeAssetsState;

        const preparedAssets = prepareAssets(prevAssets, balances);

        dispatch(marketsBalancesApi.util.upsertQueryData('getCodexAssets', undefined, preparedAssets));

        return { data: depositBalanceHandler(balances, prevDepositBalance, preparedPair) };
      },
      providesTags: ['markets_balances'],
      async onCacheEntryAdded(args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {

        let handlerId: number | null = null;
        const state = getState() as any;
        const rtkClient = getSdkClient();
        const preparedPair = state.user.selectedPair as IPair

        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.CODEX_BALANCES], preparedPair?.pair_key);

        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: [ISocketData, string]) => {
            
            if(!args && args?.length) {
              return;
            }
            
            const [{ data: socketData }] = args;

            if (!socketData) {
              return;
            }
            
            updateCachedData((draft) => {
              return depositBalanceHandler([socketData], draft, preparedPair)
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
      queryFn: async (): IQueryFuncResult<IExchangeAssetsTransformedResult> => {

        const client = getSdkClient();
        const originResult = await withErrorHandling(() => client.getCodexAssets());
        
        if (!dataGuard(originResult)) {
          return originResult;
        }

        return { data: saveExchangeAssetsHandler(originResult.data) };
      },
      providesTags: ['markets_codex_assets'],
      async onCacheEntryAdded(args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {

        let handlerId: number | null = null;
        const state = getState() as any
        const rtkClient = getSdkClient();
        const preparedPair = state.user.selectedPair as IPair

        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.CODEX_BALANCES], preparedPair?.pair_key);

        if (!subscribeOptions) {
          return;
        }

        if (!subscribeOptions) {
          return;
        }

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
              return updateExchangeAssetsHandler(socketData, draft);
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
