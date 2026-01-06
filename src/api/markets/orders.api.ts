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
  STREAMS,
  IPair,
  OrderExecutionType,
  OrderExecution,
  UserTradeEvent,
} from "@ultrade/ultrade-js-sdk";

import { IQueryFuncResult, createValidatedTag, dataGuard } from "@utils";
import { withErrorHandling } from '@helpers';
import baseApi from "../base.api";
import RtkSdkAdaptor from "../sdk";
import { IUserOrders, IUserOrdersArray } from "@interface";
import { IOrderSocketActionMap, handleSocketOrder, newTradeForOrderHandler, saveUserOrders, scheduleOrderBackgroundUpdate, openOrdersSelectors, closeOrdersSelectors, getAllOpenOrders, getAllCloseOrders } from "@redux";
import { initialUserOrdersArrayState, initialUserOrdersState } from "@consts";

const openOrderStatus = OrderExecution[OrderExecutionType.open]
const closeOrderStatus = OrderExecution[OrderExecutionType.close];

type IOrderSocketAction = keyof IOrderSocketActionMap;

type IOrderSocketArgs = [IOrderSocketAction, IOrderSocketActionMap[IOrderSocketAction]]

type IOrdersSocketArgs = [IOrderSocketArgs | UserTradeEvent, string];

const orderSocketEventGuard = (event: string, args: IOrderSocketArgs | UserTradeEvent): args is UserTradeEvent => {
  return event === "userTrade";
}

const allOpenOrdersArgs: IGetOrdersArgs = {
  symbol: null,
  status: openOrderStatus,
  limit: 50,
}

const allClosedOrdersArgs: IGetOrdersArgs = {
  symbol: null,
  status: closeOrderStatus,
  limit: 50,
}

export const marketsOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<IUserOrders, IGetOrdersArgs>({
      queryFn: async ({symbol, status, startTime, endTime, limit }: IGetOrdersArgs, { getState, dispatch }): IQueryFuncResult<IUserOrders> => {
        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getOrders(symbol, status, limit, endTime, startTime));
        
        if (!dataGuard(originResult)) {
          return originResult;
        }

        const state = getState() as any;

        const listOfPairs = state.exchange.listOfPairs as IPair[];
        const orderHistoryTab = state.exchange.openHistoryTab as OrderExecutionType;

        const baseCacheKey = { symbol, status: status === openOrderStatus ? openOrderStatus : closeOrderStatus, limit };

        const prevOrdersState = marketsOrdersApi.endpoints.getOrders.select(baseCacheKey)(state).data || initialUserOrdersState;
       
        const preparedResult = saveUserOrders(originResult.data, prevOrdersState, orderHistoryTab, listOfPairs);

        if (endTime || startTime) {
          dispatch(marketsOrdersApi.util.updateQueryData('getOrders', baseCacheKey, (draft) => {
            draft.open = preparedResult.open;
            draft.close = preparedResult.close;
          }));
        }

        return { data: preparedResult };
      },
      providesTags: (result, error, { symbol, status }) => [
        { type: 'markets_orders', id: createValidatedTag([symbol, status]) }
      ],
      async onCacheEntryAdded({ symbol }, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState, dispatch }) {
        let handlerId: number | null = null;
        const initialState = getState() as any;
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.ORDERS, STREAMS.TRADES], symbol ? symbol : initialState.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, args: IOrdersSocketArgs) => {
            if(!args) {
              return;
            }
            
            const currentState = getState() as any;
            const selectedPair = currentState.user.selectedPair as IPair;
            const orderHistoryTab = currentState.exchange.openHistoryTab as OrderExecutionType;
            
            if(orderSocketEventGuard(event, args[0])){

              const data = args[0];

              updateCachedData((draft) => {

                const result = newTradeForOrderHandler(data, draft);
                
                if (!result) {
                  return;
                }
                
                draft.open = result.open;
                draft.close = result.close;
              });
              return  
            }

            if(event !== "order"){
              return;
            }
            
            const [[action, data]] = args

            updateCachedData((draft) => {
              const result = handleSocketOrder(action, data, draft, orderHistoryTab, selectedPair);

              if (!result) {
                return;
              }

              draft.open = result.open;
              draft.close = result.close;
            });

            const allOpenCache = marketsOrdersApi.endpoints.getOrders.select(allOpenOrdersArgs)(currentState);
            const allClosedCache = marketsOrdersApi.endpoints.getOrders.select(allClosedOrdersArgs)(currentState);

            if (allOpenCache.data) {
              dispatch(marketsOrdersApi.util.updateQueryData('getOrders', allOpenOrdersArgs, (draft) => {
                const result = handleSocketOrder(action, data, draft, OrderExecutionType.open, null);

                draft.close = result.close;
                draft.open = result.open;
              }));
            }

            if (allClosedCache.data) {
              dispatch(marketsOrdersApi.util.updateQueryData('getOrders', allClosedOrdersArgs, (draft) => {
                const result = handleSocketOrder(action, data, draft, OrderExecutionType.close, null);

                draft.open = result.open;
                draft.close = result.close;
              }));
            }

      
            const orderId = data[3];
            scheduleOrderBackgroundUpdate(action, orderId, updateCachedData);
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        RtkSdkAdaptor.originalSdk.unsubscribe(handlerId);
      },
    }),
    createSpotOrder: builder.mutation<IOrderDto, CreateSpotOrderArgs>({
      queryFn: async (data: CreateSpotOrderArgs): IQueryFuncResult<IOrderDto> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.createSpotOrder(data));
      },
    }),
    cancelOrder: builder.mutation<ICancelOrderResponse, ICancelOrderArgs>({
      queryFn: async (data: ICancelOrderArgs): IQueryFuncResult<ICancelOrderResponse> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.cancelOrder(data));
      },
      invalidatesTags: (result, error, { orderId }) => [{ type: 'markets_orders', id: orderId }],
    }),
    getOrderById: builder.query<Order, IGetOrderByIdArgs>({
      queryFn: async ({ orderId }: IGetOrderByIdArgs): IQueryFuncResult<Order> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getOrderById(orderId));
      },
      providesTags: (result, error, { orderId }) => [{ type: 'markets_orders', id: orderId }],
    }),
    cancelMultipleOrders: builder.mutation<ICancelMultipleOrdersResponse, ICancelMultipleOrdersArgs>({
      queryFn: async (data: ICancelMultipleOrdersArgs): IQueryFuncResult<ICancelMultipleOrdersResponse> => {
        return await withErrorHandling(() => RtkSdkAdaptor.originalSdk.cancelMultipleOrders(data));
      },
      invalidatesTags: (result, error, { orderIds, pairId }) => {
        if(pairId) {
          return [{ type: 'markets_orders', id: createValidatedTag([pairId, openOrderStatus]) }];
        }
        return orderIds.map(orderId => ({ type: 'markets_orders', id: orderId }));
      },
    }),
  }),
});

const {
  useGetOrdersQuery: useGetOrdersQueryBase,
  useGetOrderByIdQuery,
  useLazyGetOrdersQuery,
  useLazyGetOrderByIdQuery,
  useCreateSpotOrderMutation,
  useCancelOrderMutation,
  useCancelMultipleOrdersMutation
} = marketsOrdersApi;

export {
  useGetOrderByIdQuery,
  useLazyGetOrdersQuery,
  useLazyGetOrderByIdQuery,
  useCreateSpotOrderMutation,
  useCancelOrderMutation,
  useCancelMultipleOrdersMutation
};

export const useGetOrdersQuery = (args: IGetOrdersArgs, options?: Record<string, unknown>) => {
  return useGetOrdersQueryBase(args, {
    ...options,
    selectFromResult: (result) => ({
      ...result,
      data: result.data ? {
        open: getAllOpenOrders(result.data.open),
        close: getAllCloseOrders(result.data.close)
      } as IUserOrdersArray : initialUserOrdersArrayState
    })
  });
};
