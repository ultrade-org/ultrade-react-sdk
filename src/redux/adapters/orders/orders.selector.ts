import { EntityState } from "@reduxjs/toolkit";
import { Order } from "@ultrade/ultrade-js-sdk";

import { openOrdersAdapter, closeOrdersAdapter, openInitialState, closeInitialState } from "./orders.adapter";

export const openOrdersSelectors = openOrdersAdapter.getSelectors();

export const closeOrdersSelectors = closeOrdersAdapter.getSelectors();

export const getAllOpenOrders = (state: EntityState<Order> = openInitialState): Order[] => {
  return openOrdersSelectors.selectAll(state);
};

export const getOpenOrderById = (state: EntityState<Order> = openInitialState, id: number): Order | undefined => {
  return openOrdersSelectors.selectById(state, id);
};

export const getOpenOrdersForPair = (state: EntityState<Order> = openInitialState, pair: string): Order[] => {
  return openOrdersSelectors.selectAll(state).filter((order) => order.pair === pair);
};

export const getAllCloseOrders = (state: EntityState<Order> = closeInitialState): Order[] => {
  return closeOrdersSelectors.selectAll(state);
};

export const getCloseOrderById = (state: EntityState<Order> = closeInitialState, id: number): Order | undefined => {
  return closeOrdersSelectors.selectById(state, id);
};

export const getCloseOrdersForPair = (state: EntityState<Order> = closeInitialState, pair: string): Order[] => {
  return closeOrdersSelectors.selectAll(state).filter((order) => order.pair === pair);
};