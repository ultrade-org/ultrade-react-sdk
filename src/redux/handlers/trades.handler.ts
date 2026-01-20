import moment from "moment";
import { IChartTrade, IGetLastTrades, IMarketTrade, IOrderBook, LastTradeEvent } from "@ultrade/ultrade-js-sdk";
import { MARKET_TRADES_SIZE } from "@ultrade/shared/browser/constants";

import { sortByDate } from "../helpers";
import { IGetLastTradesTransformedResult } from "@interface";


export const saveLastTrades = (data: IGetLastTrades[]): IGetLastTradesTransformedResult => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      orderBook: {
        currentLtp: "0",
        lastLtp: "0",
      },
      marketTrades: [],
    };
  }

  const lastTrades: IMarketTrade[] = [...data]
    .sort((a, b) => sortByDate(a.createdAt, b.createdAt))
    .map(({ tradeId, price, amount, createdAt: date, isBuyerMaker }) => ({
      tradeId,
      price,
      amount,
      date,
      isBuyerMaker,
    }));

  let currentLtp = "0";
  let lastLtp = "0";

  if (lastTrades.length > 0) {
    currentLtp = lastTrades[0].price;
    lastLtp = lastTrades.length > 1 ? lastTrades[1].price : "0";
  }

  return {
    orderBook: {
      currentLtp,
      lastLtp,
    },
    marketTrades: lastTrades,
  };
} 

export const saveSocketTradeHandler = (draft: IGetLastTradesTransformedResult, data: LastTradeEvent): void => {
  try {
    if (!data || !Array.isArray(data) || data.length < 8) {
      return;
    }

    const [_1, _2, tradeId, price, amount, _6, date, isBuyerMaker] = data;

    // Check if this trade already exists (prevent duplicates from multiple subscriptions)
    const existingTrade = draft.marketTrades.find((item: IMarketTrade) => item.tradeId === tradeId);
    if (existingTrade) {
      return;
    }

    const lastTrade: IMarketTrade = {
      tradeId,
      price,
      amount,
      date,
      isBuyerMaker,
    }

    draft.orderBook.currentLtp = lastTrade.price;
    let lastLtp = "0";

    if (draft.marketTrades.length) {
      lastLtp = draft.marketTrades[0].price;
    } else {
      lastLtp = lastTrade.price;
    }
    draft.orderBook.lastLtp = lastLtp;

    const tradeIndex = draft.marketTrades.findIndex((item: IMarketTrade) => item.date <= lastTrade.date);
    if (tradeIndex !== -1) {
      draft.marketTrades.splice(tradeIndex, 0, lastTrade);
    } else {
      draft.marketTrades.push(lastTrade);
    }

    if (draft.marketTrades.length > MARKET_TRADES_SIZE) {
      draft.marketTrades.pop();
    }

    draft.chartTrade = saveChartTrade(data);
    
  } catch (error) {
    console.error("saveTradeHandler error:", error);
  }
};

export const saveChartTrade = (data: LastTradeEvent): IChartTrade => {
  try {
    if (!data || !Array.isArray(data) || data.length < 7) {
      return {
        price: "0",
        volume: "0",
        time: moment().unix(),
      };
    }

    const [_1, _2, _3, price, amount, _6, date] = data;
    const time = date ? (typeof date === 'number' ? date : moment(date).unix()) : moment().unix();
    
    return {
      price: price || "0",
      volume: amount || "0",
      time,
    };
  } catch (error) {
    console.error("saveChartTrade error:", error);
    return {
      price: "0",
      volume: "0",
      time: moment().unix(),
    };
  }
}