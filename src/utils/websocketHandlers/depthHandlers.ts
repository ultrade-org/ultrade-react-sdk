import { AnyAction } from '@reduxjs/toolkit';
import { Dispatch } from 'redux';
import BigNumber from 'bignumber.js';

import { marketsDepthApi } from '@api/markets'; 


export interface DepthUpdateEvent {
  buy: string[][];
  sell: string[][];
  pair: string;
  ts: number;
  U: number; 
  u: number; 
  ask?: { price: string; qty: string };
  bid?: { price: string; qty: string };
}

export interface DepthData {
  buy: string[][];
  sell: string[][];
  pair: string;
  ts: number;
  U: number;
  u: number;
  lastUpdateId?: number;
}

const amountValueFormate = (amount: string, decimal: number): string => {
  const MAX_TOKEN_DECIMAL = 18;
  try {
    const value = new BigNumber(amount);
    if (value.isGreaterThan(0) && decimal >= 0) {
      const divisor = new BigNumber(10).pow(decimal);
      const shifted = value.dividedBy(divisor);
      return shifted.toFixed(MAX_TOKEN_DECIMAL).replace(/\.?0+$/, '') || "0";
    }
  } catch (e) {
      console.error("amountValueFormate error:", e);
  }
  return "0";
};


export function handleDepthUpdate(
  dispatch: Dispatch,
  data: DepthUpdateEvent,
  selectedPair?: { pair_key: string; base_decimal: number }
) {
  dispatch(
    marketsDepthApi.util.updateQueryData('getDepth', { symbol: data.pair, depth: 100 }, (draft: DepthData | undefined) => {
      const calculateOrderLocal = (array: Array<string[]>) => array.map(arr => {
        return [
          arr[0],
          arr[1],
          amountValueFormate(
            new BigNumber(arr[0]).multipliedBy(arr[1]).toString(), 
            selectedPair?.base_decimal || 0
          )
        ];
      });
      
      const buyOrders = selectedPair 
        ? calculateOrderLocal(data.buy)
        : data.buy;
      
      const sellOrders = selectedPair 
        ? calculateOrderLocal(data.sell)
        : data.sell;

      if (!draft) {
        return {
          buy: buyOrders,
          sell: sellOrders,
          pair: data.pair,
          ts: data.ts,
          U: data.U,
          u: data.u,
        };
      }

      if (draft.ts === data.ts) {
        return draft;
      }

      return {
        ...draft,
        buy: buyOrders,
        sell: sellOrders,
        pair: data.pair,
        ts: data.ts,
        U: data.U,
        u: data.u,
      };
    
    }) as unknown as AnyAction
  );
}
