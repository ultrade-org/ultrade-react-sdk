import { IPair } from '@ultrade/ultrade-js-sdk';

export interface IGetDepthTransformedResult {
  lastUpdateId: number;
  buyOrders: string[][];
  sellOrders: string[][];
}

export interface IGetPairListTransformedResult {
  listOfPairs: IPair[];
  mftCached: boolean;
  lastUpdateId?: string;
}
