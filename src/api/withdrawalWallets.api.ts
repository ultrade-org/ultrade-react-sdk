import { ISafeWithdrawalWallets } from '@ultrade/shared/browser/interfaces';
import {
  IGetWithdrawalWalletByAddressArgs,
  ICreateWithdrawalWalletArgs,
  IUpdateWithdrawalWalletArgs,
  IDeleteWithdrawalWalletArgs,
} from '@ultrade/ultrade-js-sdk';

import { IQueryFuncResult, withErrorHandling, getSdkClient } from '@utils';
import baseApi from './base.api';

export const withdrawalWalletsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllWithdrawalWallets: builder.query<ISafeWithdrawalWallets[], void>({
      queryFn: async (): IQueryFuncResult<ISafeWithdrawalWallets[]> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getAllWithdrawalWallets());
      },
      providesTags: ['withdrawal_wallets'],
    }),

    getWalletByAddress: builder.query<ISafeWithdrawalWallets, IGetWithdrawalWalletByAddressArgs>({
      queryFn: async ({ address }: IGetWithdrawalWalletByAddressArgs): IQueryFuncResult<ISafeWithdrawalWallets> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getWithdrawalWalletByAddress(address));
      },
      providesTags: (result, error, { address }) => [
        { type: 'withdrawal_wallets', id: address }
      ],
    }),

    createWithdrawalWallet: builder.mutation<ISafeWithdrawalWallets, ICreateWithdrawalWalletArgs>({
      queryFn: async ({ body }: ICreateWithdrawalWalletArgs): IQueryFuncResult<ISafeWithdrawalWallets> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.createWithdrawalWallet(body));
      },
      invalidatesTags: ['withdrawal_wallets'],
    }),

    updateWithdrawalWallet: builder.mutation<boolean, IUpdateWithdrawalWalletArgs>({
      queryFn: async ({ params }: IUpdateWithdrawalWalletArgs): IQueryFuncResult<boolean> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.updateWithdrawalWallet(params));
      },
      invalidatesTags: ['withdrawal_wallets'],
    }),

    deleteWithdrawalWallet: builder.mutation<boolean, IDeleteWithdrawalWalletArgs>({
      queryFn: async ({ address }: IDeleteWithdrawalWalletArgs): IQueryFuncResult<boolean> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.deleteWithdrawalWallet(address));
      },
      invalidatesTags: (result, error, { address }) => [
        { type: 'withdrawal_wallets', id: address },
        'withdrawal_wallets'
      ],
    }),
  }),
});
