import { IUserOrders, IUserOrdersArray } from "@interface";
import { openOrdersAdapter, closeOrdersAdapter } from "@redux";

export const initialUserOrdersState: IUserOrders = {
  open: openOrdersAdapter.getInitialState(),
  close: closeOrdersAdapter.getInitialState(),
}

export const initialUserOrdersArrayState: IUserOrdersArray = {
  open: [],
  close: []
}