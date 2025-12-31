import { AddOrderEvent, IPair, ITradeDto, Order, OrderExecutionType, OrderUpdateStaus, UpdateOrderEvent, UserTradeEvent } from "@ultrade/ultrade-js-sdk";

import { IUserOrders } from "@interface";
import { updateOrderState, cancelOrder, IOrderSocketActionMap, saveNewOpenOrder, equalsIgnoreCase } from "../helpers";
import { openOrdersAdapter, closeOrdersAdapter, getAllOpenOrders, getAllCloseOrders, getOpenOrderById, getCloseOrderById, openInitialState, closeInitialState } from "@redux";

export const handleSocketOrder = <T extends keyof IOrderSocketActionMap>(
  action: T,
  data: IOrderSocketActionMap[T],
  prevOrdersState: IUserOrders,
  openHistoryTab: OrderExecutionType,
  currentPair?: IPair
): IUserOrders | null => {
  switch (action) {
    case "add":
      return saveNewOpenOrder(data as AddOrderEvent, prevOrdersState, currentPair);
    case "update":
      return updateOrderState(data as UpdateOrderEvent, prevOrdersState, openHistoryTab);
    case "cancel":
      return cancelOrder(data as UpdateOrderEvent, prevOrdersState, openHistoryTab);
  }
}

/**
 * Update the order trades with socket
 */
export const newTradeForOrderHandler = (data: UserTradeEvent, prevOrdersState: IUserOrders): IUserOrders | null => {
  const [_pairId, _coin, _userId, orderId, _isBuyer, _isMaker, tradeId, price, amount, total, createdAt, status, fee] = data;

  const trade: ITradeDto = {
    tradeId,
    amount,
    price,
    createdAt,
    total,
    fee,
    status,
  };

  const openState = openOrdersAdapter.setAll(openInitialState, prevOrdersState.open);
  const closeState = closeOrdersAdapter.setAll(closeInitialState, prevOrdersState.close);
  
  const openOrder = getOpenOrderById(openState, orderId);
  const closeOrder = getCloseOrderById(closeState, orderId);

  const originalOrder = openOrder || closeOrder;
  if (!originalOrder) {
    return null;
  }

  const orderType = openOrder ? OrderExecutionType.open : OrderExecutionType.close;

  const orderAddTo: Order = {
    ...originalOrder,
    trades: originalOrder.trades ? [...originalOrder.trades] : []
  };
  
  const foundTrade = orderAddTo.trades.find(item => item.tradeId === trade.tradeId);
  if (foundTrade) {
    foundTrade.fee = trade.fee;
    foundTrade.status = trade.status;
  } else {
    const tradeIndex = orderAddTo.trades.findIndex(item => new Date(item.createdAt) <= new Date(trade.createdAt));
    if (tradeIndex !== -1) {
      orderAddTo.trades.splice(tradeIndex, 0, trade);
    } else {
      orderAddTo.trades.push(trade);
    }
  }

  let updatedOpenState = openState;
  let updatedCloseState = closeState;

  if (orderAddTo.updateStatus === OrderUpdateStaus.removed) {
    if (openOrder) {
      updatedOpenState = openOrdersAdapter.removeOne(openState, orderId);
    }
    
    const existingCloseOrder = getCloseOrderById(closeState, orderId);
    if (!existingCloseOrder) {
      updatedCloseState = closeOrdersAdapter.addOne(closeState, orderAddTo);
    } else {
      updatedCloseState = closeOrdersAdapter.updateOne(closeState, { id: orderId, changes: orderAddTo });
    }
    
    const updatedOpen = getAllOpenOrders(updatedOpenState);
    const updatedClose = getAllCloseOrders(updatedCloseState);
    
    return {
      open: updatedOpen,
      close: updatedClose
    };
  } else { 
    if (equalsIgnoreCase(orderType, OrderExecutionType.open)) {
      updatedOpenState = openOrdersAdapter.updateOne(openState, { id: orderId, changes: orderAddTo });
    } else {
      updatedCloseState = closeOrdersAdapter.updateOne(closeState, { id: orderId, changes: orderAddTo });
    }
    
    const updatedOpen = getAllOpenOrders(updatedOpenState);
    const updatedClose = getAllCloseOrders(updatedCloseState);
    
    return {
      ...prevOrdersState,
      open: updatedOpen,
      close: updatedClose
    };
  }
};