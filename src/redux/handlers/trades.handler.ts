import moment from "moment";
import { IChartTrade, IGetLastTrades, IMarketTrade, IOrderBook, LastTradeEvent } from "@ultrade/ultrade-js-sdk";
import { MARKET_TRADES_SIZE } from "@ultrade/shared/browser/constants";
import { sortByDate } from "../helpers";

interface SaveTradeHandlerResult {
  orderBook: IOrderBook
  marketTrades: IMarketTrade[];
}

export const saveLastTrades = (data: IGetLastTrades[]): SaveTradeHandlerResult => {
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

export const saveSocketTradeHandler = (prevMarketTrades: IMarketTrade[], data: LastTradeEvent): SaveTradeHandlerResult => {
  try {
    if (!data || !Array.isArray(data) || data.length < 8) {
      return {
        orderBook: {
          currentLtp: "0",
          lastLtp: "0",
        },
        marketTrades: prevMarketTrades || [],
      };
    }

    const copyMarketTrades = [...(prevMarketTrades || [])];

    const [_1, _2, tradeId, price, amount, _6, date, isBuyerMaker] = data;
    const lastTrade: IMarketTrade = {
      tradeId,
      price,
      amount,
      date,
      isBuyerMaker,
    }

    let currentLtp = lastTrade.price;
    let lastLtp = "0";

    if (copyMarketTrades.length) {
      lastLtp = copyMarketTrades[0].price;
    } else {
      lastLtp = lastTrade.price;
    }

    const tradeIndex = copyMarketTrades.findIndex((item: IMarketTrade) => item.date <= lastTrade.date);
    if (tradeIndex !== -1) {
      copyMarketTrades.splice(tradeIndex, 0, lastTrade);
    } else {
      copyMarketTrades.push(lastTrade);
    }

    if (copyMarketTrades.length > MARKET_TRADES_SIZE) {
      copyMarketTrades.pop();
    }

    return {
      orderBook: {
        currentLtp,
        lastLtp,
      },
      marketTrades: copyMarketTrades,
    };
  } catch (error) {
    console.error("saveTradeHandler error:", error);
    return {
      orderBook: {
        currentLtp: "0",
        lastLtp: "0",
      },
      marketTrades: prevMarketTrades || [],
    };
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