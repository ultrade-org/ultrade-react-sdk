

import { IGetDepth } from "@ultrade/ultrade-js-sdk";
import { IGetDepthTransformedResult } from "@interface";
import { calculateOrder } from "../helpers";

export const depthHandler = (
  depthData: IGetDepth,
  baseDecimal: number
): IGetDepthTransformedResult => {
  return {
    lastUpdateId: depthData.U,
    buyOrders: calculateOrder(depthData.buy, baseDecimal),
    sellOrders: calculateOrder(depthData.sell, baseDecimal),
  };
};