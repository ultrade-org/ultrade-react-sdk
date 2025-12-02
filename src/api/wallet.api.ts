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
} from "@ultrade/ultrade-js-sdk";
import { PaginatedResult, TradingKeyView } from "@ultrade/shared/browser/interfaces";

import baseApi from "./base.api";
import { IQueryFuncResult, getSdkClient, withErrorHandling, createValidatedTag } from "@utils";

export const walletApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWalletTransactions: builder.query<PaginatedResult<ITransaction>, IGetWalletTransactionsArgs>({
      queryFn: async ({ type, page, limit }: IGetWalletTransactionsArgs): IQueryFuncResult<PaginatedResult<ITransaction>> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getWalletTransactions(type, page, limit));
      },
      providesTags: (result, error, { type, page, limit }) => [
        { type: 'wallet_transactions', id: createValidatedTag([type, page, limit]) }
      ],
    }),
    getTransfers: builder.query<PaginatedResult<ITransfer>, IGetTransfersArgs>({
      queryFn: async ({ page, limit }: IGetTransfersArgs): IQueryFuncResult<PaginatedResult<ITransfer>> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getTransfers(page, limit));
      },
      providesTags: (result, error, { page, limit }) => [
        { type: 'wallet_transfers', id: createValidatedTag([page, limit]) }
      ],
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
