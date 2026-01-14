import { IChartTrade } from "@ultrade/ultrade-js-sdk";

import { IGetLastTradesTransformedResult } from "@interface";

export const initialTradesState: IGetLastTradesTransformedResult = {
  orderBook: {
    currentLtp: "0",
    lastLtp: "0",
  },
  marketTrades: [],
  chartTrade: {} as IChartTrade,
}