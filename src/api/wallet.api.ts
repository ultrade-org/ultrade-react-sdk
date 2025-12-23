import {
  IGetWalletTransactionsArgs,
  IGetTransfersArgs,
  IAddWhitelistArgs,
  IDeleteWhitelistArgs,
  IAddTradingKeyArgs,
  IRevokeTradingKeyArgs,
  ITransaction,
  ITransfer,
  IPendingTxn,
  IGetWhiteList,
  ITradingKey,
  IRevokeTradingKeyResponse,
  ACTION_TYPE,
  STREAMS,
  ITransferArgs,
} from "@ultrade/ultrade-js-sdk";
import { ITransferData, PaginatedResult, TradingKeyView } from "@ultrade/shared/browser/interfaces";

import baseApi from "./base.api";
import { IQueryFuncResult, getSdkClient, createValidatedTag, dataGuard } from "@utils";
import { withErrorHandling } from '@helpers';
import { IWalletState } from "@interface";
import { saveUserWalletTransactions, updateTransferTransactions, updateUserWalletTransactions } from "@redux";
import { initialWalletState } from "@consts";

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWalletTransactions: builder.query<IWalletState, IGetWalletTransactionsArgs>({
      queryFn: async ({ type, page, limit }: IGetWalletTransactionsArgs, { getState }): IQueryFuncResult<IWalletState> => {
        const client = getSdkClient();

        const originResult = await withErrorHandling(() => client.getWalletTransactions(type, page, limit));

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const prevWalletState = walletApi.endpoints.getWalletTransactions.select({ type, page, limit })(getState() as any).data || initialWalletState;

        const preparedResult = saveUserWalletTransactions(type as ACTION_TYPE, originResult.data.items, prevWalletState);

        return { data: preparedResult };
      },
      providesTags: (result, error, { type, page, limit }) => [
        { type: 'wallet_transactions', id: createValidatedTag([type, page, limit]) }
      ],
      async onCacheEntryAdded(args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const rtkClient = getSdkClient();
        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.WALLET_TRANSACTIONS], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: [ITransaction, string]) => {
            console.log( event, args);
            if (!args || !args.length) {
              return;
            }

            if(event !== "walletTransaction"){
              return;
            }
            
            const [data] = args;

            updateCachedData((draft) => {
              const result = updateUserWalletTransactions(data, draft);

              draft.deposit = result.deposit;
              draft.withdraw = result.withdraw;
              draft.transfer = result.transfer;
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        rtkClient.unsubscribe(handlerId);
      },
    }),
    getTransfers: builder.query<IWalletState, IGetTransfersArgs>({
      queryFn: async ({ page, limit }: IGetTransfersArgs, { getState }): IQueryFuncResult<IWalletState> => {
        const client = getSdkClient();
        const originResult = await withErrorHandling(() => client.getTransfers(page, limit));

        if (!dataGuard(originResult)) {
          return originResult;
        }

        const prevWalletState = walletApi.endpoints.getTransfers.select({ page, limit })(getState() as any).data || initialWalletState;

        const preparedResult = saveUserWalletTransactions(ACTION_TYPE.T, originResult.data.items, prevWalletState);

        return { data: preparedResult };
      },
      providesTags: (result, error, { page, limit }) => [
        { type: 'wallet_transfers', id: createValidatedTag([page, limit]) }
      ],
      async onCacheEntryAdded(args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const rtkClient = getSdkClient();
        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.WALLET_TRANSACTIONS], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: [ITransfer, string]) => {
            console.log(event, args);
            if (!args || !args.length) {
              return;
            }

            if(event !== "walletTransfer"){
              return;
            }
            
            const [data] = args;

            updateCachedData((draft) => {
              const result = updateTransferTransactions(data, draft);

              draft.deposit = result.deposit;
              draft.withdraw = result.withdraw;
              draft.transfer = result.transfer;
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        rtkClient.unsubscribe(handlerId);
      },
    }),
    transfer: builder.mutation<ITransfer, ITransferData>({
      queryFn: async (data: ITransferData): IQueryFuncResult<ITransfer> => {
        const client = getSdkClient();
        const originResult = await withErrorHandling(() => client.transfer(data));
        return originResult;
      },
      invalidatesTags: ['wallet_transfers'],
    }),
    getPendingTransactions: builder.query<IPendingTxn[], void>({
      queryFn: async (): IQueryFuncResult<IPendingTxn[]> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getPendingTransactions());
      },
      providesTags: ['wallet_pending_transactions'],
    }),
    getWhitelist: builder.query<PaginatedResult<IGetWhiteList>, void>({
      queryFn: async (): IQueryFuncResult<PaginatedResult<IGetWhiteList>> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getWhitelist());
      },
      providesTags: ['wallet_whitelist'],
    }),
    addWhitelist: builder.mutation<IGetWhiteList, IAddWhitelistArgs>({
      queryFn: async ({ data }: IAddWhitelistArgs): IQueryFuncResult<IGetWhiteList> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.addWhitelist(data));
      },
      invalidatesTags: ['wallet_whitelist'],
    }),
    deleteWhitelist: builder.mutation<void, IDeleteWhitelistArgs>({
      queryFn: async ({ whitelistId }: IDeleteWhitelistArgs): IQueryFuncResult<void> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.deleteWhitelist(whitelistId));
      },
      invalidatesTags: ['wallet_whitelist'],
    }),
    getTradingKeys: builder.query<ITradingKey, void>({
      queryFn: async (): IQueryFuncResult<ITradingKey> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getTradingKeys());
      },
      providesTags: ['wallet_trading_keys'],
    }),
    addTradingKey: builder.mutation<TradingKeyView, IAddTradingKeyArgs>({
      queryFn: async ({ data }: IAddTradingKeyArgs): IQueryFuncResult<TradingKeyView> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.addTradingKey(data));
      },
      invalidatesTags: ['wallet_trading_keys'],
    }),
    revokeTradingKey: builder.mutation<IRevokeTradingKeyResponse, IRevokeTradingKeyArgs>({
      queryFn: async ({ data }: IRevokeTradingKeyArgs): IQueryFuncResult<IRevokeTradingKeyResponse> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.revokeTradingKey(data));
      },
      invalidatesTags: ['wallet_trading_keys'],
    }),
  }),
});
