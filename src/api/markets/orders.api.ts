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
import { IOrderSocketActionMap, handleSocketOrder, newTradeForOrderHandler, saveUserOrders, scheduleOrderBackgroundUpdate, getAllOpenOrders, getAllCloseOrders } from "@redux";
import { initialUserOrdersArrayState, initialUserOrdersState } from "@consts";

type IOrderSocketAction = keyof IOrderSocketActionMap;
type IOrderSocketArgs = [IOrderSocketAction, IOrderSocketActionMap[IOrderSocketAction]]
type IOrdersSocketArgs = [IOrderSocketArgs | UserTradeEvent, string];

const orderSocketEventGuard = (event: string, args: IOrderSocketArgs | UserTradeEvent): args is UserTradeEvent => {
  return event === "userTrade";
}

export interface IGetOrdersQueryArgs extends IGetOrdersArgs {}

export const marketsOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<IUserOrders, IGetOrdersQueryArgs>({
      keepUnusedDataFor: 0,
      queryFn: async (args, { getState, dispatch }): IQueryFuncResult<IUserOrders> => {
        const { symbol, status, startTime, endTime, limit, orderHistoryTab } = args;
        const originResult = await withErrorHandling(() => RtkSdkAdaptor.originalSdk.getOrders(symbol, status, limit, endTime, startTime));
        
        if (!dataGuard(originResult)) {
          return originResult;
        }

        const state = getState() as any;
        const listOfPairs = state.exchange.listOfPairs as IPair[];
        const finalOrderHistoryTab = orderHistoryTab || (state.exchange.openHistoryTab as OrderExecutionType);

        const prevOrdersState = marketsOrdersApi.endpoints.getOrders.select(args)(state).data || initialUserOrdersState;
        const preparedResult = saveUserOrders(originResult.data, prevOrdersState, finalOrderHistoryTab, listOfPairs);

        if (endTime || startTime) {
          dispatch(marketsOrdersApi.util.updateQueryData('getOrders', args, (draft) => {
            draft.open = preparedResult.open;
            draft.close = preparedResult.close;
          }));
        }

        return { data: preparedResult };
      },

      providesTags: (result, error, { symbol, status }) => [
        { type: 'markets_orders', id: createValidatedTag([symbol, status]) }
      ],
      async onCacheEntryAdded({orderHistoryTab, symbol}, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState, dispatch }) {
        // const { symbol, orderHistoryTab, limit } = args;
        let handlerId: number | null = null;
        const subscribeOptions = RtkSdkAdaptor.originalSdk.getSocketSubscribeOptions([STREAMS.ORDERS, STREAMS.TRADES], null);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = RtkSdkAdaptor.originalSdk.subscribe(subscribeOptions, (event, socketArgs: IOrdersSocketArgs) => {
            if(!socketArgs) {
              return;
            }
            
            const currentState = getState() as any;
            // const listOfPairs = currentState.exchange.listOfPairs as IPair[];
            const currentPair = currentState.user.selectedPair as IPair;
            const finalOrderHistoryTab = orderHistoryTab || (currentState.exchange.openHistoryTab as OrderExecutionType);
            
            if (orderSocketEventGuard(event, socketArgs[0])) {
              const data = socketArgs[0];
              updateCachedData((draft) => {
                const result = newTradeForOrderHandler(data, draft);
                if (result) {
                  draft.open = result.open;
                  draft.close = result.close;
                }
              });

              // Update global caches (All Pairs)
              // [OrderExecutionType.open, OrderExecutionType.close].forEach(tab => {
              //   const globalArgs = { symbol: null, status: OrderExecution[tab], orderHistoryTab: tab, limit };
              //   dispatch(marketsOrdersApi.util.updateQueryData('getOrders', globalArgs as any, (draft) => {
              //     const result = newTradeForOrderHandler(data, draft);
              //     if (result) {
              //       draft.open = result.open;
              //       draft.close = result.close;
              //     }
              //   }));
              // });

              return;
            }

            if (event !== "order") {
              return;
            }
            
            const [[action, data]] = socketArgs;
            // const eventPairId = data[0];
            // const eventPair = listOfPairs.find(p => p.id === eventPairId);

            // if (!symbol || (eventPair && eventPair.pair_key === symbol)) {
              updateCachedData((draft) => {
                const result = handleSocketOrder(action, data, draft, finalOrderHistoryTab, currentPair);
                if (result) {
                  draft.open = result.open;
                  draft.close = result.close;
                }
              });
            // }

            // Update global caches (All Pairs)
            // [OrderExecutionType.open, OrderExecutionType.close].forEach(tab => {
            //   const globalArgs = { symbol: null, status: OrderExecution[tab], orderHistoryTab: tab, limit};
            //   dispatch(marketsOrdersApi.util.updateQueryData('getOrders', globalArgs as any, (draft) => {
            //     const result = handleSocketOrder(action, data, draft, tab, eventPair || currentPair);
            //     if (result) {
            //       draft.open = result.open;
            //       draft.close = result.close;
            //     }
            //   }));
            // });

            const orderId = data[3];
            scheduleOrderBackgroundUpdate(action, orderId, updateCachedData);
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        const state = getState() as any;
        const selectedPair = state.user.selectedPair as IPair;
        const orderFilter = state.persist.ordersFilter;

        const computedSymbol = orderFilter === "CurrentPair" 
        ? selectedPair?.pair_key
        : null;

        console.log('computedSymbol', computedSymbol, symbol);

        if(symbol !== computedSymbol) {
          await cacheEntryRemoved
          await RtkSdkAdaptor.originalSdk.unsubscribeAsync(handlerId)
        }
        }
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

export const useGetOrdersQuery = (args: IGetOrdersQueryArgs, options?: Record<string, unknown>) => {
  return useGetOrdersQueryBase(args as any, {
    ...options,
    selectFromResult: (result) => ({
      ...result,
      data: result.data ? {
        open: getAllOpenOrders(result.data.open),
        close: getAllCloseOrders(result.data.close)
      } : initialUserOrdersArrayState
    })
  });
};

