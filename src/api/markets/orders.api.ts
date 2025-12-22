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

import { IQueryFuncResult, dataGuard, getSdkClient } from "@utils";
import { withErrorHandling } from '@helpers';
import baseApi from "../base.api";
import { IUserOrders } from "@interface";
import { IOrderSocketActionMap, handleSocketOrder, newTradeForOrderHandler, saveUserOrders } from "@redux";
import { initialUserOrdersState } from "@consts";

const openOrderStatus = OrderExecution[OrderExecutionType.open]
const closeOrderStatus = OrderExecution[OrderExecutionType.close];

type IOrderSocketAction = keyof IOrderSocketActionMap;

type IOrderSocketArgs = [IOrderSocketAction, IOrderSocketActionMap[IOrderSocketAction]]

type IOrdersSocketArgs = [IOrderSocketArgs | UserTradeEvent, string];

const orderSocketEventGuard = (event: string, args: IOrderSocketArgs | UserTradeEvent): args is UserTradeEvent => {
  return event === "userTrade";
}

export const marketsOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<IUserOrders, IGetOrdersArgs>({
      queryFn: async ({symbol, status, startTime, endTime, limit }: IGetOrdersArgs, { getState }): IQueryFuncResult<IUserOrders> => {
        const client = getSdkClient();
        const originResult = await withErrorHandling(() => client.getOrders(symbol, status, limit, endTime, startTime));
        
        if (!dataGuard(originResult)) {
          return originResult;
        }

        const state = getState() as any;

        const listOfPairs = state.exchange.listOfPairs as IPair[];
        const orderHistoryTab = state.exchange.openHistoryTab as OrderExecutionType;

        const cacheKey = { symbol, status: status === openOrderStatus ? openOrderStatus : closeOrderStatus, startTime, endTime, limit };

        const prevOrdersState = marketsOrdersApi.endpoints.getOrders.select(cacheKey)(state).data || initialUserOrdersState;
       
        const preparedResult = saveUserOrders(originResult.data, prevOrdersState, orderHistoryTab, listOfPairs);

        return { data: preparedResult };
      },
      providesTags: ['markets_orders'],
      async onCacheEntryAdded({ symbol }, { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }) {
        let handlerId: number | null = null;
        const state = getState() as any;
        const rtkClient = getSdkClient();
        const subscribeOptions = rtkClient.getSocketSubscribeOptions([STREAMS.ORDERS, STREAMS.TRADES], symbol ? symbol : state.user.selectedPair?.pair_key);
        
        if (!subscribeOptions) {
          return;
        }

        try {
          await cacheDataLoaded;

          handlerId = rtkClient.subscribe(subscribeOptions, (event, args: IOrdersSocketArgs) => {
            if(!args) {
              return;
            }
            
            const selectedPair = state.user.selectedPair as IPair;
            const orderHistoryTab = state.exchange.openHistoryTab as OrderExecutionType;
            
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
          });
        } catch (error) {
          console.error('Error loading cache data:', error);
        }

        await cacheEntryRemoved;
        rtkClient.unsubscribe(handlerId);
      },
    }),
    createSpotOrder: builder.mutation<IOrderDto, CreateSpotOrderArgs>({
      queryFn: async (data: CreateSpotOrderArgs): IQueryFuncResult<IOrderDto> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.createSpotOrder(data));
      },
    }),
    cancelOrder: builder.mutation<ICancelOrderResponse, ICancelOrderArgs>({
      queryFn: async (data: ICancelOrderArgs): IQueryFuncResult<ICancelOrderResponse> => {
        const client = getSdkClient();
        return await withErrorHandling(() => client.cancelOrder(data));
      },
      invalidatesTags: (result, error, { orderId }) => [{ type: 'markets_orders', id: orderId }],
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
      invalidatesTags: (result, error, { orderIds }) => orderIds?.map(orderId => ({ type: 'markets_orders', id: orderId })) || [],
    }),
  }),
});
