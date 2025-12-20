import { AddOrderEvent, IPair, ITradeDto, Order, OrderExecutionType, OrderUpdateStaus, UpdateOrderEvent, UserTradeEvent } from "@ultrade/ultrade-js-sdk";

import { IUserOrders } from "@interface";
import { updateOrderState, cancelOrder, IOrderSocketActionMap, saveNewOpenOrder, equalsIgnoreCase } from "../helpers";

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
export const newTradeForOrderHandler = (data: UserTradeEvent, prevOrdersState: IUserOrders) => {
  const openOrders = [...prevOrdersState.open] as Order[];
  const closedOrders = [...prevOrdersState.close] as Order[];
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

  const openOrderIdx = openOrders.findIndex((op: Order) => op.id === orderId);
  const orderType = openOrderIdx !== -1 ? OrderExecutionType.open : OrderExecutionType.close;

  const originalOrder: Order | undefined = equalsIgnoreCase(orderType, OrderExecutionType.open) 
    ? openOrders.find((op: Order) => op.id === orderId)
    : closedOrders.find((op: Order) => op.id === orderId);

  if (!originalOrder) {
    return;
  }

  // Create a mutable copy of the order to avoid "object is not extensible" error
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

  if (orderAddTo.updateStatus === OrderUpdateStaus.removed) {
    const filteredOpenOrders = openOrders.filter(o => o.id !== orderId);
    const closedOrderExists = closedOrders.findIndex(o => o.id === orderId) !== -1;
    
    if (!closedOrderExists) {
      closedOrders.unshift(orderAddTo);
    } else {
      // Update existing closed order
      const index = closedOrders.findIndex((o) => o.id === orderId);
      if (index !== -1) {
        closedOrders[index] = orderAddTo;
      }
    }
    return {
      open: filteredOpenOrders,
      close: closedOrders
    }
  } else { 
    // Update the order in the appropriate array
    if (equalsIgnoreCase(orderType, OrderExecutionType.open)) {
      const index = openOrders.findIndex((o) => o.id === orderId);
      if (index !== -1) {
        openOrders[index] = orderAddTo;
      }
    } else {
      const index = closedOrders.findIndex((o) => o.id === orderId);
      if (index !== -1) {
        closedOrders[index] = orderAddTo;
      }
    }
    return {
      ...prevOrdersState,
      [orderType]: equalsIgnoreCase(orderType, OrderExecutionType.open) ? openOrders : closedOrders }
    }
};