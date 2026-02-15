import { ISafeWithdrawalWallets } from '@ultrade/shared/browser/interfaces';
import {
  IGetWithdrawalWalletByAddressArgs,
  ICreateWithdrawalWalletArgs,
  IUpdateWithdrawalWalletArgs,
  IDeleteWithdrawalWalletArgs,
} from '@ultrade/ultrade-js-sdk';

import { IQueryFuncResult } from '@utils';
import baseApi from '@api/base.api';
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
      queryFn: async (data: ICreateWithdrawalWalletArgs): IQueryFuncResult<ISafeWithdrawalWallets> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.createWithdrawalWallet(data));
      },
      invalidatesTags: ['withdrawal_wallets'],
    }),

    updateWithdrawalWallet: builder.mutation<boolean, IUpdateWithdrawalWalletArgs>({
      queryFn: async (data: IUpdateWithdrawalWalletArgs): IQueryFuncResult<boolean> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.updateWithdrawalWallet(data));
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

