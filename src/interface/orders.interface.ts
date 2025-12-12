import { Order } from "@ultrade/ultrade-js-sdk"

export interface IUserOrders {
  open: Order[],
  close: Order[]
}