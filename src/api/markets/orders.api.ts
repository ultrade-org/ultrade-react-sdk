import {
  IGetOrdersArgs,
  CreateSpotOrderArgs,
  ICancelOrderArgs,
  IGetOrderByIdArgs,
  ICancelMultipleOrdersArgs,
  IOrderDto,
  Order,
  ICancelOrderResponse,
  ICancelMultipleOrdersResponse,
} from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, createValidatedTag, getSdkClient } from "@utils";
import { withErrorHandling } from '@helpers';
import baseApi from "../base.api";

export const marketsOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<IOrderDto[], IGetOrdersArgs>({
      queryFn: async ({ symbol, status, startTime, endTime, limit }: IGetOrdersArgs): IQueryFuncResult<IOrderDto[]> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getOrders(symbol, status, limit, endTime, startTime));
      },
      providesTags: (result, error, { symbol, status, startTime, endTime, limit }) => [
        { type: 'markets_orders', id: createValidatedTag([symbol, status, startTime, endTime, limit]) }
      ]
    }),
    createSpotOrder: builder.mutation<IOrderDto, CreateSpotOrderArgs>({
      queryFn: async (data: CreateSpotOrderArgs): IQueryFuncResult<IOrderDto> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.createSpotOrder(data));
      },
      invalidatesTags: [{ type: 'markets_orders'}],
    }),
    cancelOrder: builder.mutation<ICancelOrderResponse, ICancelOrderArgs>({
      queryFn: async (data: ICancelOrderArgs): IQueryFuncResult<ICancelOrderResponse> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.cancelOrder(data));
      },
      invalidatesTags: [{ type: 'markets_orders'}],
    }),
    getOrderById: builder.query<Order, IGetOrderByIdArgs>({
      queryFn: async ({ orderId }: IGetOrderByIdArgs): IQueryFuncResult<Order> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.getOrderById(orderId));
      },
      providesTags: (result, error, { orderId }) => [{ type: 'markets_orders', id: orderId }],
    }),
    cancelMultipleOrders: builder.mutation<ICancelMultipleOrdersResponse, ICancelMultipleOrdersArgs>({
      queryFn: async (data: ICancelMultipleOrdersArgs): IQueryFuncResult<ICancelMultipleOrdersResponse> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.cancelMultipleOrders(data));
      },
      invalidatesTags: [{ type: 'markets_orders'}],
    }),
  }),
});
