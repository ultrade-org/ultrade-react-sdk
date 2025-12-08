import { IGetDepthTransformedResult, IGetPairListTransformedResult } from "@interface";

export const initialDepthState: IGetDepthTransformedResult = {
  lastUpdateId: 0,
  buyOrders: [],
  sellOrders: [],
}

export const initialPairListState: IGetPairListTransformedResult = {
  listOfPairs: [],
  mftCached: false,
}