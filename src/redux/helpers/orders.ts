import BigNumber from 'bignumber.js';
import { EntityState } from '@reduxjs/toolkit';

import { amountValueFormate, equalsIgnoreCase, sortByDate } from './formaters';
import { AddOrderEvent, IOrderDto, IPair, ITradeDto, Order, OrderExecutionType, OrderStatus, OrderTypeEnum, OrderUpdateStaus, UpdateOrderEvent } from '@ultrade/ultrade-js-sdk';
import { IUserOrders } from '@interface';
import { openOrdersAdapter, closeOrdersAdapter, getOpenOrderById, getCloseOrderById, openOrdersSelectors, closeOrdersSelectors } from '@redux';
import { initialUserOrdersState } from '@consts';
export interface IOrderSocketActionMap {
  add: AddOrderEvent;
  update: UpdateOrderEvent;
  cancel: UpdateOrderEvent;
}

const joinPairToOrder = (orders: IOrderDto[], pairs: IPair[]): Order[] => {
  var pairsMap = new Map(pairs.map((pair) => [+pair.id, pair]));
  return orders?.reduce((acc, o) => {
    const pair = pairsMap.get(o.pairId);
    if (pair) {
      const order = {
        ...o,
        executed: o.status !== OrderStatus.Open,
        base_decimal: pair?.base_decimal,
        price_decimal: pair.price_decimal,
        base_currency: pair?.base_currency?.toUpperCase(),
        price_currency: pair?.price_currency?.toUpperCase(),
        min_size_increment: pair?.min_size_increment,
        min_price_increment: pair?.min_price_increment,
        price_id: pair?.price_id,
      };
      acc.push(order);
    }
    return acc;
  }, []);
}

export const calculateOrder = (array: string[][], baseDecimal: number) =>
  array?.map((arr) => {
    return [arr[0], arr[1], amountValueFormate(BigNumber(arr[0]).multipliedBy(arr[1]).toString(), baseDecimal)];
  });

export const saveNewOpenOrder = (data: AddOrderEvent, prevOrdersState?: IUserOrders, currentPair?: IPair): IUserOrders => {
  if (!prevOrdersState) {
    return initialUserOrdersState;
  }
  
  if (!currentPair) {
    return prevOrdersState;
  }
  const [ pairId, _pairKey, userId, id, side, type, price, amount, total, createdAt ] = data;

  if (currentPair.id !== pairId) {
    return prevOrdersState;
  }

  const newOrder: Order = {
    executed: false,
    updateStatus: OrderUpdateStaus.created,
    base_currency: currentPair.base_currency?.toUpperCase(),
    base_decimal: currentPair.base_decimal,
    price_currency: currentPair.price_currency?.toUpperCase(),
    price_decimal: currentPair.price_decimal,
    min_size_increment: currentPair.min_size_increment,
    min_price_increment: currentPair.min_price_increment,
    price_id: Number(currentPair.price_id),
    id,
    amount,
    price,
    total,
    type,
    status: OrderStatus.Open,
    side: side as 0 | 1,
    avgPrice: '0',
    filledAmount: '0',
    filledTotal: '0',
    pairId: currentPair.id,
    pair: currentPair.pair_key,
    userId: userId,
    createdAt,
    completedAt: null,
    trades: [],
  };

  const updatedState = openOrdersAdapter.addOne(prevOrdersState.open, newOrder);

  return { ...prevOrdersState, open: updatedState };
};

export const updateOrderState = (data: UpdateOrderEvent, prevOrdersState?: IUserOrders, openHistoryTab?: OrderExecutionType ): IUserOrders | null => {
  if (!prevOrdersState) {
    return null;
  }
  
  const { open, close } = prevOrdersState;
  const [ _pairId, _pairKey, _userId, id, status, executedPrice, filledAmount, filledTotal, _updatedAt, completedAt ] = data;
  
  const openOrder = getOpenOrderById(open, id);
  const closeOrder = getCloseOrderById(close, id);

  if (!openOrder && !closeOrder) {
    return null;
  }

  const updatedOrderChanges: Partial<Order> = {
    status,
    filledAmount,
    filledTotal,
    avgPrice: executedPrice,
    completedAt
  };

  let updatedOpenState = open;
  let updatedCloseState = close;

  if (openOrder && status === OrderStatus.Open) {
    const isRapidOrder = openOrder.type === OrderTypeEnum.IOC || openOrder.type === OrderTypeEnum.Market;
    
    updatedOpenState = openOrdersAdapter.updateOne(open, {
      id,
      changes: {
        ...updatedOrderChanges,
        updateStatus: isRapidOrder ? null : OrderUpdateStaus.partially_filled,
      }
    });
  } else if (openOrder && status !== OrderStatus.Open) {
    
    if (equalsIgnoreCase(openHistoryTab, OrderExecutionType.open)) {
      updatedOpenState = openOrdersAdapter.updateOne(open, {
        id,
        changes: {
          ...updatedOrderChanges,
          executed: true,
          updateStatus: OrderUpdateStaus.removed
        }
      });
    } else {
      const orderToMove = { ...openOrder, ...updatedOrderChanges };
      updatedOpenState = openOrdersAdapter.removeOne(open, id);
      updatedCloseState = closeOrdersAdapter.addOne(close, orderToMove);
    }

  } else if (closeOrder) {
    updatedCloseState = closeOrdersAdapter.updateOne(close, {
      id,
      changes: updatedOrderChanges
    });
  }

  return {
    open: updatedOpenState,
    close: updatedCloseState,
  };
}
  
  export const cancelOrder = (data: UpdateOrderEvent, prevOrdersState: IUserOrders, openHistoryTab: OrderExecutionType) => updateOrderState(data, prevOrdersState, openHistoryTab);
  

//   export const saveAllUserOrders = (openOrders: IOrderDto[], historyOrders: IOrderDto[], listOfPairs: IPair[]) => {
//     const openFullOrders = joinPairToOrder(openOrders, listOfPairs);
//     const historyFullOrders = joinPairToOrder(historyOrders, listOfPairs);

//   return {
//     open: openFullOrders.sort((a,b) => sortByDate(a.createdAt, b.createdAt)), 
//     close: historyFullOrders.sort((a,b) => sortByDate(a.completedAt, b.completedAt))
//   };
// }

const getActualElement = (oldArray: Order[], newArray: Order[], filterFnc: (a: Order, b: Order) => boolean): Order[] => {
  return newArray.map(newItem => {
    const exsistItem = oldArray.find((oldItem: Order) => filterFnc(oldItem, newItem));
    if (exsistItem && new Date(exsistItem.updatedAt).getTime() >= new Date(newItem.updatedAt).getTime()) {
      return exsistItem;
    }
    return newItem;
  });
}

const saveOpenOrders = (orders: IOrderDto[], prevOrdersState: IUserOrders, listOfPairs: IPair[]): IUserOrders => {
  const newOrders = joinPairToOrder(orders, listOfPairs);
  
  const filteredOrders = getActualElement(
    openOrdersSelectors.selectAll(prevOrdersState.open), 
    newOrders, 
    (a: Order, b: Order) => a.pairId === b.pairId && a.id === b.id
  );
  
  const updatedState = openOrdersAdapter.upsertMany(prevOrdersState.open, filteredOrders);
  
  return { ...prevOrdersState, open: updatedState };
};

const saveCloseOrders = (orders: IOrderDto[], prevOrdersState: IUserOrders, listOfPairs: IPair[]): IUserOrders => {
  const newOrders = joinPairToOrder(orders, listOfPairs);
  
  const filteredOrders = getActualElement(
    closeOrdersSelectors.selectAll(prevOrdersState.close), 
    newOrders, 
    (a: Order, b: Order) => a.pairId === b.pairId && a.id === b.id
  );
  
  const updatedState = closeOrdersAdapter.upsertMany(prevOrdersState.close, filteredOrders);
  
  return { ...prevOrdersState, close: updatedState };
};

export const saveUserOrders = (orders: IOrderDto[], prevOrdersState: IUserOrders, ordersType: OrderExecutionType, listOfPairs: IPair[]): IUserOrders => {
  if (equalsIgnoreCase(ordersType, OrderExecutionType.open)) {
    return saveOpenOrders(orders, prevOrdersState, listOfPairs);
  }

  return saveCloseOrders(orders, prevOrdersState, listOfPairs);
};

export const removeOpenOrderBg = (order: Order, prevOrdersState: IUserOrders): IUserOrders | null => {
  const openOrder = getOpenOrderById(prevOrdersState.open, order.id);
  if (!openOrder) {
    return null;
  }
  
  const updatedOpenState = openOrdersAdapter.updateOne(prevOrdersState.open, {
    id: order.id,
    changes: { updateStatus: null }
  });
  
  return {
    ...prevOrdersState,
    open: updatedOpenState
  };
};

export const moveOrderToHistory = (order: Order, prevOrdersState: IUserOrders): IUserOrders | null => {
  const openOrder = getOpenOrderById(prevOrdersState.open, order.id);
  if (!openOrder) {
    return null;
  }
  
  const existingCloseOrder = getCloseOrderById(prevOrdersState.close, order.id);
  const orderToMove = { ...order, updateStatus: null };
  
  const updatedOpenState = openOrdersAdapter.removeOne(prevOrdersState.open, order.id);
  let updatedCloseState = prevOrdersState.close;
  
  if (!existingCloseOrder) {
    updatedCloseState = closeOrdersAdapter.addOne(prevOrdersState.close, orderToMove);
  }
  
  return {
    open: updatedOpenState,
    close: updatedCloseState
  };
};

export type UpdateCachedDataCallback = (updater: (draft: IUserOrders) => void) => void;

export const scheduleOrderBackgroundUpdate = (
  action: "add" | "update" | "cancel",
  orderId: number,
  updateCachedData: UpdateCachedDataCallback
): void => {
  setTimeout(() => {
    updateCachedData((draft) => {
      if (!draft || !draft.open || !draft.close) {
        return;
      }

      const order = getOpenOrderById(draft.open, orderId);
      
      if (!order) {
        return;
      }

      if (order.updateStatus === OrderUpdateStaus.created || order.updateStatus === OrderUpdateStaus.partially_filled) {
        const removeResult = removeOpenOrderBg(order, draft);
        if (removeResult) {
          draft.open = removeResult.open;
          draft.close = removeResult.close;
        }
        return;
      }

      if (order.updateStatus === OrderUpdateStaus.removed) {
        const moveResult = moveOrderToHistory(order, draft);
        if (moveResult) {
          draft.open = moveResult.open;
          draft.close = moveResult.close;
        }
      }
    });
  }, 1500);
};

const getActualTrades = (oldTrades: ITradeDto[], newTrades: ITradeDto[]): ITradeDto[] => {
  return newTrades.map(newTrade => {
    const existingTrade = oldTrades.find((oldTrade: ITradeDto) => oldTrade.tradeId === newTrade.tradeId);
    if (existingTrade && new Date(existingTrade.createdAt).getTime() >= new Date(newTrade.createdAt).getTime()) {
      return existingTrade;
    }
    return newTrade;
  });
};

export const addTradesToOrder = (orderWithTrades: Order, prevOrdersState: IUserOrders): IUserOrders | null => {
  const { id, trades } = orderWithTrades;
  
  const openOrder = getOpenOrderById(prevOrdersState.open, id);
  const closeOrder = getCloseOrderById(prevOrdersState.close, id);
  
  if (!openOrder && !closeOrder) {
    return null;
  }
  
  const orderType = openOrder ? OrderExecutionType.open : OrderExecutionType.close;
  const existingOrder = openOrder || closeOrder;
  
  const existingTrades = existingOrder.trades || [];
  const newTrades = getActualTrades(existingTrades, trades || []);
  
  const allTrades = [...existingTrades, ...newTrades]
    .filter((el, idx, arr) => idx === arr.findIndex((t) => t.tradeId === el.tradeId)) as ITradeDto[];
  
  const sortedTrades = [...allTrades.sort((a, b) => sortByDate(a.createdAt, b.createdAt))];
  
  const updatedOrder: Order = {
    ...existingOrder,
    trades: sortedTrades,
  };
  
  let updatedOpenState = prevOrdersState.open;
  let updatedCloseState = prevOrdersState.close;
  
  if (equalsIgnoreCase(orderType, OrderExecutionType.open)) {
    updatedOpenState = openOrdersAdapter.updateOne(prevOrdersState.open, {
      id,
      changes: updatedOrder,
    });
  } else {
    updatedCloseState = closeOrdersAdapter.updateOne(prevOrdersState.close, {
      id,
      changes: updatedOrder,
    });
  }
  
  return {
    open: updatedOpenState,
    close: updatedCloseState,
  };
};