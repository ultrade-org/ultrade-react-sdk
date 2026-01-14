import { IChartTrade, IMarketTrade, IOrderBook } from "@ultrade/ultrade-js-sdk";

export interface IGetLastTradesTransformedResult {  
  orderBook: IOrderBook
  marketTrades: IMarketTrade[];
  chartTrade?: IChartTrade;
}
