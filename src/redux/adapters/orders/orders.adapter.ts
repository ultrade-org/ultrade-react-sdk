import { createEntityAdapter } from "@reduxjs/toolkit";
import { Order } from "@ultrade/ultrade-js-sdk";

import { sortByDate } from "@redux";

export const openOrdersAdapter = createEntityAdapter<Order>({
  selectId: (order) => order.id,
  sortComparer: (a, b) => sortByDate(a.createdAt, b.createdAt),
});

export const closeOrdersAdapter = createEntityAdapter<Order>({
  selectId: (order) => order.id,
  sortComparer: (a, b) => sortByDate(a.completedAt, b.completedAt),
});

export const openInitialState = openOrdersAdapter.getInitialState();
export const closeInitialState = closeOrdersAdapter.getInitialState();
