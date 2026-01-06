import { EntityState } from "@reduxjs/toolkit"
import { Order } from "@ultrade/ultrade-js-sdk"

export interface IUserOrders {
  open: EntityState<Order>,
  close: EntityState<Order>
}

export interface IUserOrdersArray {
  open: Order[],
  close: Order[]
}