import { IPair } from '@ultrade/shared/browser/interfaces';

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
