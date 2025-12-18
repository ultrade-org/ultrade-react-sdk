import { AddOrderEvent, IPair, OrderExecutionType, UpdateOrderEvent } from "@ultrade/ultrade-js-sdk";

import { IUserOrders } from "@interface";
import { updateOrderState, cancelOrder, IOrderSocketActionMap, saveNewOpenOrder } from "../helpers";

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