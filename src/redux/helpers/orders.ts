import BigNumber from 'bignumber.js';

import { amountValueFormate, equalsIgnoreCase, sortByDate } from './formaters';
import { AddOrderEvent, IOrderDto, IPair, ITradeDto, Order, OrderExecutionType, OrderStatus, OrderTypeEnum, OrderUpdateStaus, UpdateOrderEvent } from '@ultrade/ultrade-js-sdk';
import { IUserOrders } from '@interface';
import { openOrdersAdapter, closeOrdersAdapter, getAllOpenOrders, getAllCloseOrders, getOpenOrderById, getCloseOrderById, openInitialState, closeInitialState } from '@redux';
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

export const saveNewOpenOrder = (data: AddOrderEvent, prevOrdersState: IUserOrders, currentPair?: IPair): IUserOrders => {
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

  const currentState = openOrdersAdapter.setAll(openInitialState, prevOrdersState.open);
  const updatedState = openOrdersAdapter.addOne(currentState, newOrder);
  const updatedOrdersArray = getAllOpenOrders(updatedState);

  return { ...prevOrdersState, open: updatedOrdersArray };
};

export const updateOrderState = (data: UpdateOrderEvent, { open, close }: IUserOrders, openHistoryTab: OrderExecutionType ): IUserOrders | null => {
  const [ _pairId, _pairKey, _userId, id, status, executedPrice, filledAmount, filledTotal, _updatedAt, completedAt ] = data;
  
  const openState = openOrdersAdapter.setAll(openInitialState, open);
  const closeState = closeOrdersAdapter.setAll(closeInitialState, close);
  
  const openOrder = getOpenOrderById(openState, id);
  const closeOrder = getCloseOrderById(closeState, id);

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

  let updatedOpenState = openState;
  let updatedCloseState = closeState;

  if (openOrder && status === OrderStatus.Open) {
    const isRapidOrder = openOrder.type === OrderTypeEnum.IOC || openOrder.type === OrderTypeEnum.Market;
    
    updatedOpenState = openOrdersAdapter.updateOne(openState, {
      id,
      changes: {
        ...updatedOrderChanges,
        updateStatus: isRapidOrder ? null : OrderUpdateStaus.partially_filled,
      }
    });
  } else if (openOrder && status !== OrderStatus.Open) {
    
    if (equalsIgnoreCase(openHistoryTab, OrderExecutionType.open)) {
      updatedOpenState = openOrdersAdapter.updateOne(openState, {
        id,
        changes: {
          ...updatedOrderChanges,
          executed: true,
          updateStatus: OrderUpdateStaus.removed
        }
      });
    } else {
      const orderToMove = { ...openOrder, ...updatedOrderChanges };
      updatedOpenState = openOrdersAdapter.removeOne(openState, id);
      updatedCloseState = closeOrdersAdapter.addOne(closeState, orderToMove);
    }

  } else if (closeOrder) {
    updatedCloseState = closeOrdersAdapter.updateOne(closeState, {
      id,
      changes: updatedOrderChanges
    });
  }

  const updatedOpen = getAllOpenOrders(updatedOpenState);
  const updatedClose = getAllCloseOrders(updatedCloseState);

  return {
    open: updatedOpen,
    close: updatedClose,
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
    prevOrdersState.open, 
    newOrders, 
    (a: Order, b: Order) => a.pairId === b.pairId && a.id === b.id
  );
  
  const currentState = openOrdersAdapter.setAll(openInitialState, prevOrdersState.open);
  const updatedState = openOrdersAdapter.upsertMany(currentState, filteredOrders);
  const updatedOrdersArray = getAllOpenOrders(updatedState);
  
  return { ...prevOrdersState, open: updatedOrdersArray };
};

const saveCloseOrders = (orders: IOrderDto[], prevOrdersState: IUserOrders, listOfPairs: IPair[]): IUserOrders => {
  const newOrders = joinPairToOrder(orders, listOfPairs);
  
  const filteredOrders = getActualElement(
    prevOrdersState.close, 
    newOrders, 
    (a: Order, b: Order) => a.pairId === b.pairId && a.id === b.id
  );
  
  const currentState = closeOrdersAdapter.setAll(closeInitialState, prevOrdersState.close);
  const updatedState = closeOrdersAdapter.upsertMany(currentState, filteredOrders);
  const updatedOrdersArray = getAllCloseOrders(updatedState);
  
  return { ...prevOrdersState, close: updatedOrdersArray };
};

export const saveUserOrders = (orders: IOrderDto[], prevOrdersState: IUserOrders, ordersType: OrderExecutionType, listOfPairs: IPair[]): IUserOrders => {
  if (equalsIgnoreCase(ordersType, OrderExecutionType.open)) {
    return saveOpenOrders(orders, prevOrdersState, listOfPairs);
  }

  return saveCloseOrders(orders, prevOrdersState, listOfPairs);
};

export const removeOpenOrderBg = (order: Order, prevOrdersState: IUserOrders): IUserOrders | null => {
  const openState = openOrdersAdapter.setAll(openInitialState, prevOrdersState.open);
  
  const openOrder = getOpenOrderById(openState, order.id);
  if (!openOrder) {
    return null;
  }
  
  const updatedOpenState = openOrdersAdapter.updateOne(openState, {
    id: order.id,
    changes: { updateStatus: null }
  });
  
  const updatedOpen = getAllOpenOrders(updatedOpenState);
  
  return {
    ...prevOrdersState,
    open: updatedOpen
  };
};

export const moveOrderToHistory = (order: Order, prevOrdersState: IUserOrders): IUserOrders | null => {
  const openState = openOrdersAdapter.setAll(openInitialState, prevOrdersState.open);
  const closeState = closeOrdersAdapter.setAll(closeInitialState, prevOrdersState.close);
  
  const openOrder = getOpenOrderById(openState, order.id);
  if (!openOrder) {
    return null;
  }
  
  const existingCloseOrder = getCloseOrderById(closeState, order.id);
  const orderToMove = { ...order, updateStatus: null };
  
  const updatedOpenState = openOrdersAdapter.removeOne(openState, order.id);
  let updatedCloseState = closeState;
  
  if (!existingCloseOrder) {
    updatedCloseState = closeOrdersAdapter.addOne(closeState, orderToMove);
  }
  
  const updatedOpen = getAllOpenOrders(updatedOpenState);
  const updatedClose = getAllCloseOrders(updatedCloseState);
  
  return {
    open: updatedOpen,
    close: updatedClose
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
      const openState = openOrdersAdapter.setAll(openInitialState, draft.open);
      const order = getOpenOrderById(openState, orderId);
      
      if (!order) {
        return;
      }

      if (action === "add" || action === "update") {
        if (order.updateStatus === OrderUpdateStaus.created || order.updateStatus === OrderUpdateStaus.partially_filled) {
          const removeResult = removeOpenOrderBg(order, draft);
          if (removeResult) {
            draft.open = removeResult.open;
            draft.close = removeResult.close;
          }
        }
      } else if (action === "cancel") {
        if (order.updateStatus === OrderUpdateStaus.removed) {
          const moveResult = moveOrderToHistory(order, draft);
          if (moveResult) {
            draft.open = moveResult.open;
            draft.close = moveResult.close;
          }
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
  
  const openState = openOrdersAdapter.setAll(openInitialState, prevOrdersState.open);
  const closeState = closeOrdersAdapter.setAll(closeInitialState, prevOrdersState.close);
  
  const openOrder = getOpenOrderById(openState, id);
  const closeOrder = getCloseOrderById(closeState, id);
  
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
  
  let updatedOpenState = openState;
  let updatedCloseState = closeState;
  
  if (equalsIgnoreCase(orderType, OrderExecutionType.open)) {
    updatedOpenState = openOrdersAdapter.updateOne(openState, {
      id,
      changes: updatedOrder,
    });
  } else {
    updatedCloseState = closeOrdersAdapter.updateOne(closeState, {
      id,
      changes: updatedOrder,
    });
  }
  
  const updatedOpen = getAllOpenOrders(updatedOpenState);
  const updatedClose = getAllCloseOrders(updatedCloseState);
  
  return {
    open: updatedOpen,
    close: updatedClose,
  };
};