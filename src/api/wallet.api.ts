import {
  IGetWalletTransactionsArgs,
  IGetTransfersArgs,
  IGetPendingActionsArgs,
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
  ACTION_TYPE,
} from "@ultrade/ultrade-js-sdk";
import { ITransferData, PaginatedResult, TradingKeyView } from "@ultrade/shared/browser/interfaces";

import baseApi from '@api/base.api';
import { IQueryFuncResult, createValidatedTag, dataGuard } from "@utils";
import RtkSdkAdaptor from "./sdk";
import { withErrorHandling } from '@helpers';
import { IGetPendingTransactionsResult, IWalletTransactionsState, IWalletTransferState } from "@interface";
import { isTxnDone, saveUserWalletTransactions, saveUserWalletTransfer, updateTransferTransactions, updateUserWalletTransactions } from "@redux";
import {  initialWalletTransactionsState, initialWalletTransferState } from "@consts";

const WAIT_FOR_AUTH_INTERVAL_MS = 100;
const WAIT_FOR_AUTH_MAX_ATTEMPTS = 50;

const waitForWalletAuth = async (): Promise<boolean> => {
  for (let i = 0; i < WAIT_FOR_AUTH_MAX_ATTEMPTS; i++) {
    const wallet = RtkSdkAdaptor.originalSdk.mainWallet;
    if (wallet?.token || wallet?.tradingKey) return true;
    await new Promise(resolve => setTimeout(resolve, WAIT_FOR_AUTH_INTERVAL_MS));
  }
  return false;
};

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

          if (!(await waitForWalletAuth())) return;

          const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.WALLET_TRANSACTIONS]);

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

          if (!(await waitForWalletAuth())) return;

          const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.WALLET_TRANSACTIONS]);

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
    getPendingTransactions: builder.query<IGetPendingTransactionsResult, IGetPendingActionsArgs>({
      queryFn: async (args): IQueryFuncResult<IGetPendingTransactionsResult> => {
        const originResult =  await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getPendingTransactions());

        if (!dataGuard(originResult)) {
          return { data: { 
            pendingTxns: { deposit: [], withdraw: [], transfer: [] }, 
            pendingCount: 0
          } };
        }

        const pendingTxns = originResult.data.reduce((acc, el) => {
          acc[el.type] 
            ? acc[el.type].push(el) 
            : acc[el.type] = [el];
          return acc;
        }, {});

        const preparedResult = {
          pendingTxns,
          pendingCount: originResult.data.length,
        };

        return { data: preparedResult };
      },
      providesTags: ['wallet_pending_transactions'],
      async onCacheEntryAdded(args, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {

        let handlerId: number | null = null;
        const state = getState() as any;
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.WALLET_TRANSACTIONS], state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          if (!(await waitForWalletAuth())) return;

          const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.WALLET_TRANSACTIONS]);

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: [{ data: any}, string]) => {
            if (event === "walletCancelTransaction") {
              const [{ data }] = args;
              const txnId = data.primaryId;
              const type = data.action_type;
              
              updateCachedData((draft) => {
                if (!draft || !draft.pendingTxns[type]) return;

                const index = draft.pendingTxns[type].findIndex(t => t.id === txnId);
                if (index !== -1) {
                  draft.pendingTxns[type].splice(index, 1);
                  draft.pendingCount = Math.max(0, draft.pendingCount - 1);
                }
              });
              return;
            }
            
            if (event !== "walletTransfer" && event !== "walletTransaction") {
              return;
            }

            if (!args || !args.length) {
              return;
            }
   
            const [{data}] = args;

            updateCachedData((draft) => {
              if (!draft) return;
              const type = event === "walletTransfer" ? ACTION_TYPE.T : data.action_type;
              const txnId = event === "walletTransfer" ? data.transferId : data.primaryId;

              const newTxn = {
                type,
                id: txnId,
                amount: data.amount,
                tokenId: data.token_id ? data.token_id.id : data.tokenId,
              }

              if (!draft.pendingTxns[type]) {
                draft.pendingTxns[type] = [];
              }

              const oldTxn = draft.pendingTxns[type].find(t => t.id === newTxn.id);
              console.log("update pending txns, old txn- ", oldTxn, newTxn);

              if (!oldTxn && !isTxnDone(data.status)) {
                draft.pendingCount += 1;
                draft.pendingTxns[type].unshift(newTxn); 
              }

              if (oldTxn && isTxnDone(data.status)) {
                draft.pendingCount = Math.max(0, draft.pendingCount - 1);
                draft.pendingTxns[type] = draft.pendingTxns[type].filter(t => t.id !== txnId);
              }
            });
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        RtkSdkAdaptor.originalSdk.unsubscribe(handlerId);
      }
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
