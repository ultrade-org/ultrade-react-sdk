import { marketsCommonApi } from './common.api';
import { marketsOrdersApi } from './orders.api';
import { marketsBalancesApi } from './balances.api';
import { marketsTradesApi } from './trades.api';
import { marketsDepthApi } from './depth.api';
import { marketsPairsApi } from './pairs.api';
import { marketsHistoryApi } from './history.api';

export const marketsApi = {
  ...marketsCommonApi,
  ...marketsOrdersApi,
  ...marketsBalancesApi,
  ...marketsTradesApi,
  ...marketsDepthApi,
  ...marketsPairsApi,
  ...marketsHistoryApi,
} as const;

export {
  marketsCommonApi,
  marketsOrdersApi,
  marketsBalancesApi,
  marketsTradesApi,
  marketsDepthApi,
  marketsPairsApi,
  marketsHistoryApi,
};