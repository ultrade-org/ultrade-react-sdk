import BigNumber from 'bignumber.js';

import { amountValueFormate, equalsIgnoreCase, sortByDate } from './formaters';
import { AddOrderEvent, IOrderDto, IPair, Order, OrderExecutionType, OrderStatus, OrderTypeEnum, OrderUpdateStaus, UpdateOrderEvent } from '@ultrade/ultrade-js-sdk';
import { IUserOrders } from '@interface';
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

    return { ...prevOrdersState, open: [ newOrder, ...prevOrdersState.open ] };
  };

  export const updateOrderState = (data: UpdateOrderEvent, { open, close }: IUserOrders, openHistoryTab: OrderExecutionType ): IUserOrders=> {
    const [ _pairId, _pairKey, _userId, id, status, executedPrice, filledAmount, filledTotal, _updatedAt, completedAt ] = data;
   
    const openOrderIdx = open.findIndex((op: Order) => op.id === id);
    const closeOrderIdx = close.findIndex((op: Order) => op.id === id);
  
    if (openOrderIdx === -1 && closeOrderIdx === -1) {
      return;
    }
  
    const updatedOrder: Partial<Order> = {
      status,
      filledAmount,
      filledTotal,
      avgPrice: executedPrice,
      completedAt
    };
  
    if (openOrderIdx !== -1 && updatedOrder.status === OrderStatus.Open) {
      const isRapidOrder = open[openOrderIdx].type === OrderTypeEnum.IOC || open[openOrderIdx].type === OrderTypeEnum.Market;
  
      open[openOrderIdx] = {
        ...open[openOrderIdx],
        ...updatedOrder,
        updateStatus: isRapidOrder ? null : OrderUpdateStaus.partially_filled,
      };
    } else if (openOrderIdx !== -1 && updatedOrder.status !== OrderStatus.Open) {
      
      if (equalsIgnoreCase(openHistoryTab, OrderExecutionType.open)) {
        open[openOrderIdx] = {
          ...open[openOrderIdx],
          ...updatedOrder,
          executed: true,
          updateStatus: OrderUpdateStaus.removed
        }
      } else {
        const [ order ] = open.splice(openOrderIdx, 1);   
        close.unshift({ ...order, ...updatedOrder });
      }
  
    } else {
  
      close[closeOrderIdx] = {
        ...close[closeOrderIdx],
        ...updatedOrder,
      };
    }
  
    return {
      open: open,
      close: close,
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

const getActualElement = (oldArray: any[], newArray: any[], filterFnc: (a, b) => boolean) => {
  return newArray.map(newItem => {
    const exsistItem = oldArray.find((oldItem: Order) => filterFnc(oldItem, newItem));
    if (exsistItem && new Date(exsistItem.updatedAt).getTime() >= new Date(newItem.updatedAt).getTime()) {
      return exsistItem;
    }
    return newItem;
  });
}

export const saveUserOrders = (orders: IOrderDto[], prevOrdersState: IUserOrders, ordersType: OrderExecutionType, listOfPairs: IPair[]) => {
  const newOrders = joinPairToOrder(orders, listOfPairs);

  const filteredOrders = getActualElement(prevOrdersState[ordersType], newOrders, (a: Order, b: Order) => a.pairId === b.pairId && a.id === b.id);

  if (equalsIgnoreCase(ordersType, OrderExecutionType.open)) {
    filteredOrders.sort((a,b) => sortByDate(a.createdAt, b.createdAt));
  } else {
    filteredOrders.sort((a,b) => sortByDate(a.completedAt, b.completedAt));
  }

  return { ...prevOrdersState, [ordersType]: filteredOrders }
};