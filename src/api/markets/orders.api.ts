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
  orderHistoryTab: OrderExecutionType.open,
}

const allClosedOrdersArgs: IGetOrdersArgs = {
  symbol: null,
  status: closeOrderStatus,
  limit: 50,
  orderHistoryTab: OrderExecutionType.close,
}

console.log("testtest")
export const marketsOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<IUserOrders, IGetOrdersArgs>({
      queryFn: async ({symbol, status, startTime, endTime, limit, orderHistoryTab }: IGetOrdersArgs, { getState, dispatch }): IQueryFuncResult<IUserOrders> => {
        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getOrders(symbol, status, limit, endTime, startTime));
        
        if (!dataGuard(originResult)) {
          return originResult;
        }

        const state = getState() as any;

        const listOfPairs = state.exchange.listOfPairs as IPair[];
        const finalOrderHistoryTab = orderHistoryTab || (state.exchange.openHistoryTab as OrderExecutionType);

        const baseCacheKey: IGetOrdersArgs = { symbol, status: status === openOrderStatus ? openOrderStatus : closeOrderStatus, limit, orderHistoryTab: finalOrderHistoryTab };

        const prevOrdersState = marketsOrdersApi.endpoints.getOrders.select(baseCacheKey)(state).data || initialUserOrdersState;
       
        const preparedResult = saveUserOrders(originResult.data, prevOrdersState, finalOrderHistoryTab, listOfPairs);

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
      async onCacheEntryAdded({ symbol, limit, orderHistoryTab }, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState, dispatch }) {
        let handlerId: number | null = null;
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.ORDERS, STREAMS.TRADES], symbol);
        
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
            const listOfPairs = currentState.exchange.listOfPairs as IPair[];
            const finalOrderHistoryTab = orderHistoryTab || (currentState.exchange.openHistoryTab as OrderExecutionType);
            
            if(orderSocketEventGuard(event, args[0])){
              const data = args[0];
              const [_pairId, _coin, _userId] = data;
              const eventPairId = _pairId;
              const eventPair = listOfPairs.find(p => p.id === eventPairId);

              updateCachedData((draft) => {
                if (!draft) {
                  return;
                }
                const result = newTradeForOrderHandler(data, draft);
                if (!result) {
                  return;
                }
                draft.open = result.open;
                draft.close = result.close;
              });

            // Update allOpenOrdersArgs cache - create if doesn't exist
            const allOpenCache = marketsOrdersApi.endpoints.getOrders.select(allOpenOrdersArgs)(currentState);
            if (allOpenCache.data) {
              dispatch(marketsOrdersApi.util.updateQueryData('getOrders', allOpenOrdersArgs, (draft) => {
                if (!draft) {
                  return;
                }
                const result = newTradeForOrderHandler(data, draft);
                if (result) {
                  draft.open = result.open;
                  draft.close = result.close;
                }
              }));
            } else {
              // Create cache entry with initial data and update it
              const initialResult = newTradeForOrderHandler(data, initialUserOrdersState);
              if (initialResult) {
                dispatch(marketsOrdersApi.util.upsertQueryData('getOrders', allOpenOrdersArgs, initialResult));
              }
            }

            // Update allClosedOrdersArgs cache - create if doesn't exist
            const allClosedCache = marketsOrdersApi.endpoints.getOrders.select(allClosedOrdersArgs)(currentState);
            if (allClosedCache.data) {
              dispatch(marketsOrdersApi.util.updateQueryData('getOrders', allClosedOrdersArgs, (draft) => {
                if (!draft) {
                  return;
                }
                const result = newTradeForOrderHandler(data, draft);
                if (result) {
                  draft.open = result.open;
                  draft.close = result.close;
                }
              }));
            } else {
              // Create cache entry with initial data and update it
              const initialResult = newTradeForOrderHandler(data, initialUserOrdersState);
              if (initialResult) {
                dispatch(marketsOrdersApi.util.upsertQueryData('getOrders', allClosedOrdersArgs, initialResult));
              }
            }

              if (eventPair) {
                const pairOpenArgs: IGetOrdersArgs = { symbol: eventPair.pair_key, status: openOrderStatus, limit, orderHistoryTab: OrderExecutionType.open };
                const pairClosedArgs: IGetOrdersArgs = { symbol: eventPair.pair_key, status: closeOrderStatus, limit, orderHistoryTab: OrderExecutionType.close };

                dispatch(marketsOrdersApi.util.updateQueryData('getOrders', pairOpenArgs, (draft) => {
                  if (!draft) {
                    return;
                  }
                  const result = newTradeForOrderHandler(data, draft);
                  if (result) {
                    draft.open = result.open;
                    draft.close = result.close;
                  }
                }));

                dispatch(marketsOrdersApi.util.updateQueryData('getOrders', pairClosedArgs, (draft) => {
                  if (!draft) {
                    return;
                  }
                  const result = newTradeForOrderHandler(data, draft);
                  if (result) {
                    draft.open = result.open;
                    draft.close = result.close;
                  }
                }));
              }

              return;
            }

            if(event !== "order"){
              return;
            }
            
            const [[action, data]] = args
            const eventPairId = data[0];
            const eventPair = listOfPairs.find(p => p.id === eventPairId);

            // Update current cache entry only if it matches the symbol or if symbol is null (all pairs)
            if (!symbol || !eventPair || eventPair.pair_key === symbol) {
              updateCachedData((draft) => {
                if (!draft) {
                  return;
                }

                const result = handleSocketOrder(action, data, draft, finalOrderHistoryTab, eventPair || selectedPair);

                if (!result) {
                  return;
                }

                draft.open = result.open;
                draft.close = result.close;
              });
            }

            // Update allOpenOrdersArgs cache - create if doesn't exist
            const allOpenCache = marketsOrdersApi.endpoints.getOrders.select(allOpenOrdersArgs)(currentState);
            if (allOpenCache.data) {
              dispatch(marketsOrdersApi.util.updateQueryData('getOrders', allOpenOrdersArgs, (draft) => {
                if (!draft) {
                  return;
                }
                const result = handleSocketOrder(action, data, draft, OrderExecutionType.open, eventPair || selectedPair);
                if (result) {
                  draft.close = result.close;
                  draft.open = result.open;
                }
              }));
            } else {
              // Create cache entry with initial data and update it
              const initialResult = handleSocketOrder(action, data, initialUserOrdersState, OrderExecutionType.open, eventPair || selectedPair);
              if (initialResult) {
                dispatch(marketsOrdersApi.util.upsertQueryData('getOrders', allOpenOrdersArgs, initialResult));
              }
            }

            // Update allClosedOrdersArgs cache - create if doesn't exist
            const allClosedCache = marketsOrdersApi.endpoints.getOrders.select(allClosedOrdersArgs)(currentState);
            if (allClosedCache.data) {
              dispatch(marketsOrdersApi.util.updateQueryData('getOrders', allClosedOrdersArgs, (draft) => {
                if (!draft) {
                  return;
                }
                const result = handleSocketOrder(action, data, draft, OrderExecutionType.close, eventPair || selectedPair);
                if (result) {
                  draft.open = result.open;
                  draft.close = result.close;
                }
              }));
            } else {
              // Create cache entry with initial data and update it
              const initialResult = handleSocketOrder(action, data, initialUserOrdersState, OrderExecutionType.close, eventPair || selectedPair);
              if (initialResult) {
                dispatch(marketsOrdersApi.util.upsertQueryData('getOrders', allClosedOrdersArgs, initialResult));
              }
            }

            if (eventPair) {
              const pairOpenArgs: IGetOrdersArgs = { symbol: eventPair.pair_key, status: openOrderStatus, limit: limit || 50, orderHistoryTab: OrderExecutionType.open };
              const pairClosedArgs: IGetOrdersArgs = { symbol: eventPair.pair_key, status: closeOrderStatus, limit: limit || 50, orderHistoryTab: OrderExecutionType.close };

              dispatch(marketsOrdersApi.util.updateQueryData('getOrders', pairOpenArgs, (draft) => {
                if (!draft) {
                  return;
                }
                const result = handleSocketOrder(action, data, draft, OrderExecutionType.open, eventPair);
                if (result) {
                  draft.open = result.open;
                  draft.close = result.close;
                }
              }));

              dispatch(marketsOrdersApi.util.updateQueryData('getOrders', pairClosedArgs, (draft) => {
                if (!draft) {
                  return;
                }
                const result = handleSocketOrder(action, data, draft, OrderExecutionType.close, eventPair);
                if (result) {
                  draft.open = result.open;
                  draft.close = result.close;
                }
              }));
            }

            if (selectedPair) {
              const certainOrdersArgs: IGetOrdersArgs = { symbol: selectedPair.pair_key, status: finalOrderHistoryTab === OrderExecutionType.open ? openOrderStatus : closeOrderStatus, limit: limit || 50, orderHistoryTab: finalOrderHistoryTab };
              dispatch(marketsOrdersApi.util.updateQueryData('getOrders', certainOrdersArgs, (draft) => {
                if (!draft) {
                  return;
                }
                const result = handleSocketOrder(action, data, draft, finalOrderHistoryTab, selectedPair);
                if (result) {
                  draft.open = result.open;
                  draft.close = result.close;
                }
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
