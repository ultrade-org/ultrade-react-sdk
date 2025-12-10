import { AccountAssetType, CodexBalanceDto } from "@ultrade/ultrade-js-sdk";

export const depositBalanceGuard = (
  data: AccountAssetType[] | CodexBalanceDto | undefined | null,
): data is CodexBalanceDto => {
  if (!data) {
    return false;
  }
  if (Array.isArray(data)) {
    return false;
  }
  return typeof data === 'object'
    && 'loginAddress' in data
    && 'tokenAddress' in data
    && 'tokenChainId' in data
    && 'amount' in data
    && 'lockedAmount' in data;
};