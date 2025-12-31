import { EntityState } from "@reduxjs/toolkit";
import { Order } from "@ultrade/ultrade-js-sdk";

import { openOrdersAdapter, closeOrdersAdapter } from "./orders.adapter";

export const openOrdersSelectors = openOrdersAdapter.getSelectors();

export const closeOrdersSelectors = closeOrdersAdapter.getSelectors();

export const getAllOpenOrders = (state: EntityState<Order>): Order[] => {
  return openOrdersSelectors.selectAll(state);
};

export const getOpenOrderById = (state: EntityState<Order>, id: number): Order | undefined => {
  return openOrdersSelectors.selectById(state, id);
};

export const getOpenOrdersForPair = (state: EntityState<Order>, pair: string): Order[] => {
  return openOrdersSelectors.selectAll(state).filter((order) => order.pair === pair);
};

export const getAllCloseOrders = (state: EntityState<Order>): Order[] => {
  return closeOrdersSelectors.selectAll(state);
};

export const getCloseOrderById = (state: EntityState<Order>, id: number): Order | undefined => {
  return closeOrdersSelectors.selectById(state, id);
};

export const getCloseOrdersForPair = (state: EntityState<Order>, pair: string): Order[] => {
  return closeOrdersSelectors.selectAll(state).filter((order) => order.pair === pair);
};