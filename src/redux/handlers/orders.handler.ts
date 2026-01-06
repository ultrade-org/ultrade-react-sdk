import { AddOrderEvent, IPair, ITradeDto, Order, OrderExecutionType, OrderUpdateStaus, UpdateOrderEvent, UserTradeEvent } from "@ultrade/ultrade-js-sdk";

import { IUserOrders } from "@interface";
import { updateOrderState, cancelOrder, IOrderSocketActionMap, saveNewOpenOrder, equalsIgnoreCase } from "../helpers";
import { openOrdersAdapter, closeOrdersAdapter, getOpenOrderById, getCloseOrderById } from "@redux";

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
  
  const openOrder = getOpenOrderById(prevOrdersState.open, orderId);
  const closeOrder = getCloseOrderById(prevOrdersState.close, orderId);

  const originalOrder = openOrder || closeOrder;
  if (!originalOrder) {
    return null;
  }

  const orderType = openOrder ? OrderExecutionType.open : OrderExecutionType.close;

  const existingTrades = originalOrder.trades || [];
  const foundTradeIndex = existingTrades.findIndex(item => item.tradeId === trade.tradeId);
  
  let updatedTrades: ITradeDto[];
  if (foundTradeIndex !== -1) {
    updatedTrades = existingTrades.map((item, idx) => 
      idx === foundTradeIndex 
        ? { ...item, fee: trade.fee, status: trade.status }
        : item
    );
  } else {
    const insertIndex = existingTrades.findIndex(item => new Date(item.createdAt) <= new Date(trade.createdAt));
    if (insertIndex !== -1) {
      updatedTrades = [
        ...existingTrades.slice(0, insertIndex),
        trade,
        ...existingTrades.slice(insertIndex)
      ];
    } else {
      updatedTrades = [...existingTrades, trade];
    }
  }
  
  const orderAddTo: Order = {
    ...originalOrder,
    trades: updatedTrades
  };

  let updatedOpenState = prevOrdersState.open;
  let updatedCloseState = prevOrdersState.close;

  if (orderAddTo.updateStatus === OrderUpdateStaus.removed) {
    if (openOrder) {
      updatedOpenState = openOrdersAdapter.removeOne(prevOrdersState.open, orderId);
    }
    
    const existingCloseOrder = getCloseOrderById(prevOrdersState.close, orderId);
    if (!existingCloseOrder) {
      updatedCloseState = closeOrdersAdapter.addOne(prevOrdersState.close, orderAddTo);
    } else {
      updatedCloseState = closeOrdersAdapter.updateOne(prevOrdersState.close, { id: orderId, changes: orderAddTo });
    }
    
    return {
      open: updatedOpenState,
      close: updatedCloseState
    };
  } else { 
    if (equalsIgnoreCase(orderType, OrderExecutionType.open)) {
      updatedOpenState = openOrdersAdapter.updateOne(prevOrdersState.open, { id: orderId, changes: orderAddTo });
    } else {
      updatedCloseState = closeOrdersAdapter.updateOne(prevOrdersState.close, { id: orderId, changes: orderAddTo });
    }
    
    return {
      ...prevOrdersState,
      open: updatedOpenState,
      close: updatedCloseState
    };
  }
};