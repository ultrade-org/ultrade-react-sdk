import { IUserOrders } from "@interface";
import { openOrdersAdapter, closeOrdersAdapter, getAllOpenOrders, getAllCloseOrders } from "@redux";

export const initialUserOrdersState: IUserOrders = {
  open: getAllOpenOrders(openOrdersAdapter.getInitialState()),
  close: getAllCloseOrders(closeOrdersAdapter.getInitialState()),
}