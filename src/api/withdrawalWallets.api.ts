import { ISafeWithdrawalWallets } from '@ultrade/shared/browser/interfaces';
import {
  IGetWithdrawalWalletByAddressArgs,
  ICreateWithdrawalWalletArgs,
  IUpdateWithdrawalWalletArgs,
  IDeleteWithdrawalWalletArgs,
} from '@ultrade/ultrade-js-sdk';

import { IQueryFuncResult } from '@utils';
import baseApi from './base.api';
import RtkSdkAdaptor from "./sdk";
import { withErrorHandling } from '@helpers';

export const withdrawalWalletsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllWithdrawalWallets: builder.query<ISafeWithdrawalWallets[], void>({
      queryFn: async (): IQueryFuncResult<ISafeWithdrawalWallets[]> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getAllWithdrawalWallets());
      },
      providesTags: ['withdrawal_wallets'],
    }),

    getWalletByAddress: builder.query<ISafeWithdrawalWallets, IGetWithdrawalWalletByAddressArgs>({
      queryFn: async ({ address }: IGetWithdrawalWalletByAddressArgs): IQueryFuncResult<ISafeWithdrawalWallets> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getWithdrawalWalletByAddress(address));
      },
      providesTags: (result, error, { address }) => [
        { type: 'withdrawal_wallets', id: address }
      ],
    }),

    createWithdrawalWallet: builder.mutation<ISafeWithdrawalWallets, ICreateWithdrawalWalletArgs>({
      queryFn: async ({ body }: ICreateWithdrawalWalletArgs): IQueryFuncResult<ISafeWithdrawalWallets> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.createWithdrawalWallet(body));
      },
      invalidatesTags: ['withdrawal_wallets'],
    }),

    updateWithdrawalWallet: builder.mutation<boolean, IUpdateWithdrawalWalletArgs>({
      queryFn: async ({ params }: IUpdateWithdrawalWalletArgs): IQueryFuncResult<boolean> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.updateWithdrawalWallet(params));
      },
      invalidatesTags: ['withdrawal_wallets'],
    }),

    deleteWithdrawalWallet: builder.mutation<boolean, IDeleteWithdrawalWalletArgs>({
      queryFn: async ({ address }: IDeleteWithdrawalWalletArgs): IQueryFuncResult<boolean> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.deleteWithdrawalWallet(address));
      },
      invalidatesTags: (result, error, { address }) => [
        { type: 'withdrawal_wallets', id: address },
        'withdrawal_wallets'
      ],
    }),
  }),
});

export const {
  useGetAllWithdrawalWalletsQuery,
  useGetWalletByAddressQuery,
  useCreateWithdrawalWalletMutation,
  useUpdateWithdrawalWalletMutation,
  useDeleteWithdrawalWalletMutation,
  useLazyGetAllWithdrawalWalletsQuery,
  useLazyGetWalletByAddressQuery,
} = withdrawalWalletsApi;

