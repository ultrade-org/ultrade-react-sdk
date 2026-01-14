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
  STREAMS,
} from "@ultrade/ultrade-js-sdk";
import { ITransferData, PaginatedResult, TradingKeyView } from "@ultrade/shared/browser/interfaces";

import baseApi from "./base.api";
import { IQueryFuncResult, createValidatedTag, dataGuard } from "@utils";
import RtkSdkAdaptor from "./sdk";
import { withErrorHandling } from '@helpers';
import { IWalletTransactionsState, IWalletTransferState } from "@interface";
import { saveUserWalletTransactions, saveUserWalletTransfer, updateTransferTransactions, updateUserWalletTransactions } from "@redux";
import {  initialWalletTransactionsState, initialWalletTransferState } from "@consts";

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWalletTransactions: builder.query<IWalletTransactionsState, IGetWalletTransactionsArgs>({
      keepUnusedDataFor: 0,
      queryFn: async ({ type, page, limit }: IGetWalletTransactionsArgs, { getState }): IQueryFuncResult<IWalletTransactionsState> => {
        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getWalletTransactions(type, page, limit));

        if (!dataGuard(originResult)) {
          return { data: initialWalletTransactionsState };
        }

        const prevWalletState = walletApi.endpoints.getWalletTransactions.select({ type, page, limit })(getState() as any).data || initialWalletTransactionsState;

        const preparedResult = saveUserWalletTransactions(type, originResult.data.items, prevWalletState);

        return { data: preparedResult };
      },
      providesTags: (result, error, { type, page, limit }) => [
        { type: 'wallet_transactions', id: createValidatedTag([type, page, limit]) }
      ],
      async onCacheEntryAdded(args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.WALLET_TRANSACTIONS], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: [{data: ITransaction}, string]) => {
            if(event !== "allStat" && event !== "depth"){
              console.log("event transactions", event, args);
            }

            if(event !== "walletTransaction"){
              return;
            }
            
            if (!args || !args.length) {
              return;
            }

            const [{data}] = args;

            updateCachedData((draft) => {
              if (!draft || !draft.deposit || !draft.withdraw) {
                return initialWalletTransactionsState;
              }

              const result = updateUserWalletTransactions(data, draft);
              return result;
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        RtkSdkAdaptor.originalSdk.unsubscribe(handlerId);
      },
    }),
    getTransfers: builder.query<IWalletTransferState, IGetTransfersArgs>({
      keepUnusedDataFor: 0,
      queryFn: async ({ page, limit }: IGetTransfersArgs): IQueryFuncResult<IWalletTransferState> => {
        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getTransfers(page, limit));

        if (!dataGuard(originResult)) {
          return { data: initialWalletTransferState };
        }

        const preparedResult = saveUserWalletTransfer(originResult.data.items);

        return { data: preparedResult };
      },
      providesTags: (result, error, { page, limit }) => [
        { type: 'wallet_transfers', id: createValidatedTag([page, limit]) }
      ],
      async onCacheEntryAdded(args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.WALLET_TRANSACTIONS], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: [{ data: ITransfer}, string]) => {

            if(event !== "allStat" && event !== "depth"){
              console.log("event transfer", event, args);
            }
            
            if(event !== "walletTransfer"){
              return;
            }

            if (!args || !args.length) {
              return;
            }
   
            const [{data}] = args;

            updateCachedData((draft) => {
              if (!draft || !draft.transfer) {
                return initialWalletTransferState;
              }
              const result = updateTransferTransactions(data, draft);
              return result;
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        RtkSdkAdaptor.originalSdk.unsubscribe(handlerId);
      },
    }),
    transfer: builder.mutation<ITransfer, ITransferData>({
      queryFn: async (data: ITransferData): IQueryFuncResult<ITransfer> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.transfer(data));
      },
      invalidatesTags: ['wallet_transfers'],
    }),
    getPendingTransactions: builder.query<IPendingTxn[], void>({
      queryFn: async (): IQueryFuncResult<IPendingTxn[]> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getPendingTransactions());
      },
      providesTags: ['wallet_pending_transactions'],
    }),
    getWhitelist: builder.query<PaginatedResult<IGetWhiteList>, void>({
      queryFn: async (): IQueryFuncResult<PaginatedResult<IGetWhiteList>> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getWhitelist());
      },
      providesTags: ['wallet_whitelist'],
    }),
    addWhitelist: builder.mutation<IGetWhiteList, IAddWhitelistArgs>({
      queryFn: async (data): IQueryFuncResult<IGetWhiteList> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.addWhitelist(data));
      },
      invalidatesTags: ['wallet_whitelist'],
    }),
    deleteWhitelist: builder.mutation<void, IDeleteWhitelistArgs>({
      queryFn: async ({ whitelistId }: IDeleteWhitelistArgs): IQueryFuncResult<void> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.deleteWhitelist(whitelistId));
      },
      invalidatesTags: ['wallet_whitelist'],
    }),
    getTradingKeys: builder.query<ITradingKey[], void>({
      queryFn: async (): IQueryFuncResult<ITradingKey[]> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getTradingKeys());
      },
      providesTags: ['wallet_trading_keys'],
    }),
    addTradingKey: builder.mutation<TradingKeyView, IAddTradingKeyArgs>({
      queryFn: async ({ data }: IAddTradingKeyArgs): IQueryFuncResult<TradingKeyView> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.addTradingKey(data));
      },
      invalidatesTags: ['wallet_trading_keys'],
    }),
    revokeTradingKey: builder.mutation<IRevokeTradingKeyResponse, IRevokeTradingKeyArgs>({
      queryFn: async ({ data }: IRevokeTradingKeyArgs): IQueryFuncResult<IRevokeTradingKeyResponse> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.revokeTradingKey(data));
      },
      invalidatesTags: ['wallet_trading_keys'],
    }),
  }),
});

export const {
  useGetWalletTransactionsQuery,
  useGetTransfersQuery,
  useGetPendingTransactionsQuery,
  useGetWhitelistQuery,
  useGetTradingKeysQuery,
  useLazyGetWalletTransactionsQuery,
  useLazyGetTransfersQuery,
  useLazyGetPendingTransactionsQuery,
  useLazyGetWhitelistQuery,
  useLazyGetTradingKeysQuery,
  useTransferMutation,
  useAddWhitelistMutation,
  useDeleteWhitelistMutation,
  useAddTradingKeyMutation,
  useRevokeTradingKeyMutation,
} = walletApi;
